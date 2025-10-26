/**
 * Certificate service
 * Handles ARCA X.509 certificate operations
 */

import * as crypto from 'crypto';
import { certificateRepository } from '../repositories/certificate.repository';
import { logger } from '../config/logger';

export interface CertificateInfo {
  subject: string;
  issuer: string;
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
  fingerprint: string;
}

export class CertificateService {
  /**
   * Parse X.509 certificate and extract information
   */
  parseCertificate(certificatePem: string): CertificateInfo {
    try {
      // Parse the certificate
      const cert = new crypto.X509Certificate(certificatePem);

      return {
        subject: cert.subject,
        issuer: cert.issuer,
        serialNumber: cert.serialNumber,
        validFrom: new Date(cert.validFrom),
        validTo: new Date(cert.validTo),
        fingerprint: cert.fingerprint,
      };
    } catch (error) {
      logger.error('Failed to parse certificate', { error });
      throw new Error('Invalid certificate format');
    }
  }

  /**
   * Validate certificate format
   */
  validateCertificate(certificatePem: string): { valid: boolean; error?: string } {
    try {
      const info = this.parseCertificate(certificatePem);

      // Check if certificate is expired
      if (new Date() > info.validTo) {
        return { valid: false, error: 'Certificate has expired' };
      }

      // Check if certificate is not yet valid
      if (new Date() < info.validFrom) {
        return { valid: false, error: 'Certificate is not yet valid' };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid certificate',
      };
    }
  }

  /**
   * Validate private key format
   */
  validatePrivateKey(privateKeyPem: string, passphrase?: string): { valid: boolean; error?: string } {
    try {
      // Try to create a private key object
      crypto.createPrivateKey({
        key: privateKeyPem,
        format: 'pem',
        passphrase,
      });

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid private key',
      };
    }
  }

  /**
   * Check if certificate and private key match
   */
  validateKeyPair(certificatePem: string, privateKeyPem: string, passphrase?: string): boolean {
    try {
      // Create test data
      const testData = 'test-data';

      // Create private key object
      const privateKey = crypto.createPrivateKey({
        key: privateKeyPem,
        format: 'pem',
        passphrase,
      });

      // Create public key from certificate
      const cert = new crypto.X509Certificate(certificatePem);
      const publicKey = crypto.createPublicKey(cert.publicKey);

      // Sign with private key
      const sign = crypto.createSign('SHA256');
      sign.update(testData);
      sign.end();
      const signature = sign.sign(privateKey);

      // Verify with public key
      const verify = crypto.createVerify('SHA256');
      verify.update(testData);
      verify.end();
      return verify.verify(publicKey, signature);
    } catch (error) {
      logger.error('Key pair validation failed', { error });
      return false;
    }
  }

  /**
   * Extract CUIT from certificate subject
   * ARCA certificates typically include CUIT in the subject field
   */
  extractCuitFromCertificate(certificatePem: string): string | null {
    try {
      const cert = new crypto.X509Certificate(certificatePem);
      const subject = cert.subject;

      // Try to extract CUIT from subject
      // Format is typically: CN=CUIT 20123456789 - Company Name
      const cuitMatch = subject.match(/CUIT\s*(\d{11})/i) || subject.match(/(\d{11})/);

      if (cuitMatch && cuitMatch[1]) {
        return cuitMatch[1];
      }

      // Try serialNumber attribute (some certificates use this)
      const serialMatch = subject.match(/serialNumber=(\d{11})/i);
      if (serialMatch && serialMatch[1]) {
        return serialMatch[1];
      }

      return null;
    } catch (error) {
      logger.error('Failed to extract CUIT from certificate', { error });
      return null;
    }
  }

  /**
   * Create certificate in database
   */
  async createCertificate(
    userId: string,
    cuit: string,
    certificate: string,
    privateKey: string,
    passphrase: string | null,
    isProduction: boolean,
  ) {
    // Validate certificate
    const certValidation = this.validateCertificate(certificate);
    if (!certValidation.valid) {
      throw new Error(`Invalid certificate: ${certValidation.error}`);
    }

    // Validate private key
    const keyValidation = this.validatePrivateKey(privateKey, passphrase || undefined);
    if (!keyValidation.valid) {
      throw new Error(`Invalid private key: ${keyValidation.error}`);
    }

    // Validate key pair
    if (!this.validateKeyPair(certificate, privateKey, passphrase || undefined)) {
      throw new Error('Certificate and private key do not match');
    }

    // Parse certificate to get expiration date
    const certInfo = this.parseCertificate(certificate);

    // Check if certificate CUIT matches provided CUIT
    const extractedCuit = this.extractCuitFromCertificate(certificate);
    if (extractedCuit && extractedCuit !== cuit) {
      logger.warn('Certificate CUIT does not match provided CUIT', {
        extractedCuit,
        providedCuit: cuit,
      });
    }

    // Deactivate any existing certificates for this user/cuit/environment
    const existingCerts = await certificateRepository.findAll({
      userId,
      cuit,
      isProduction,
      isActive: true,
    });

    for (const existingCert of existingCerts) {
      await certificateRepository.softDelete(existingCert.id);
      logger.info('Deactivated existing certificate', {
        certificateId: existingCert.id,
        userId,
        cuit,
      });
    }

    // Create new certificate
    const newCertificate = await certificateRepository.create({
      userId,
      cuit,
      certificate,
      privateKey,
      passphrase,
      isProduction,
      expiresAt: certInfo.validTo,
      metadata: {
        subject: certInfo.subject,
        issuer: certInfo.issuer,
        serialNumber: certInfo.serialNumber,
        fingerprint: certInfo.fingerprint,
        validFrom: certInfo.validFrom.toISOString(),
      },
    });

    logger.info('Certificate created', {
      certificateId: newCertificate.id,
      userId,
      cuit,
      isProduction,
      expiresAt: certInfo.validTo,
    });

    return newCertificate;
  }

  /**
   * Get active certificate for user
   */
  async getActiveCertificate(userId: string, cuit: string, isProduction: boolean) {
    const certificate = await certificateRepository.getActiveCertificate(userId, cuit, isProduction);

    if (!certificate) {
      throw new Error('No active certificate found. Please upload a certificate first.');
    }

    // Check if certificate is expired
    if (await certificateRepository.isExpired(certificate.id)) {
      await certificateRepository.softDelete(certificate.id);
      throw new Error('Certificate has expired. Please upload a new certificate.');
    }

    return certificate;
  }

  /**
   * Check for certificates expiring soon
   */
  async checkExpiringCertificates(userId: string, days: number = 30) {
    return certificateRepository.findExpiringSoon(userId, days);
  }
}

// Export singleton instance
export const certificateService = new CertificateService();
