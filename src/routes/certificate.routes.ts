/**
 * Certificate routes
 * Manages ARCA X.509 certificates for authentication
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { certificateService } from '../services/certificate.service';
import { certificateRepository } from '../repositories/certificate.repository';
import { logger } from '../config/logger';

const router = Router();

// All routes require authentication
router.use(authenticate());

/**
 * POST /api/v1/certificates
 * Upload and register a new certificate
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { cuit, certificate, privateKey, passphrase, isProduction } = req.body;

    // Validation
    if (!cuit || !certificate || !privateKey || isProduction === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: cuit, certificate, privateKey, isProduction',
      });
    }

    // Validate CUIT format (11 digits)
    if (!/^\d{11}$/.test(cuit)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid CUIT format. Must be 11 digits.',
      });
    }

    const userId = req.user!.id;

    // Create certificate
    const newCertificate = await certificateService.createCertificate(
      userId,
      cuit,
      certificate,
      privateKey,
      passphrase || null,
      isProduction,
    );

    // Return certificate without sensitive data
    const { privateKey: _, passphrase: __, ...safeCertificate } = newCertificate;

    res.status(201).json({
      success: true,
      data: safeCertificate,
      message: 'Certificate uploaded and validated successfully',
    });
  } catch (error) {
    logger.error('Error creating certificate', { error, userId: req.user?.id });

    res.status(400).json({
      success: false,
      error: 'Failed to create certificate',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/certificates
 * Get all certificates for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { cuit, isProduction, isActive } = req.query;

    const filters: any = { userId };

    if (cuit) filters.cuit = cuit as string;
    if (isProduction !== undefined) filters.isProduction = isProduction === 'true';
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const certificates = await certificateRepository.findAll(filters);

    // Remove sensitive data from response
    const safeCertificates = certificates.map((cert) => {
      const { privateKey, passphrase, ...safe } = cert;
      return safe;
    });

    res.json({
      success: true,
      data: safeCertificates,
      count: safeCertificates.length,
    });
  } catch (error) {
    logger.error('Error fetching certificates', { error, userId: req.user?.id });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch certificates',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/certificates/expiring
 * Get certificates expiring soon
 */
router.get('/expiring', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;

    const certificates = await certificateService.checkExpiringCertificates(userId, days);

    // Remove sensitive data from response
    const safeCertificates = certificates.map((cert) => {
      const { privateKey, passphrase, ...safe } = cert;
      return safe;
    });

    res.json({
      success: true,
      data: safeCertificates,
      count: safeCertificates.length,
      message: `Certificates expiring within ${days} days`,
    });
  } catch (error) {
    logger.error('Error fetching expiring certificates', { error, userId: req.user?.id });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch expiring certificates',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/certificates/:id
 * Get a specific certificate by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const certificate = await certificateRepository.findById(id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found',
      });
    }

    // Ensure the certificate belongs to the authenticated user
    if (certificate.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Remove sensitive data from response
    const { privateKey, passphrase, ...safeCertificate } = certificate;

    res.json({
      success: true,
      data: safeCertificate,
    });
  } catch (error) {
    logger.error('Error fetching certificate', { error, userId: req.user?.id, certificateId: req.params.id });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch certificate',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/v1/certificates/:id
 * Delete a certificate (soft delete by default)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { permanent } = req.query;

    const existingCert = await certificateRepository.findById(id);

    if (!existingCert) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found',
      });
    }

    // Ensure the certificate belongs to the authenticated user
    if (existingCert.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    let deletedCert;
    if (permanent === 'true') {
      deletedCert = await certificateRepository.delete(id);
      logger.info('Certificate permanently deleted', { userId, certificateId: id });
    } else {
      deletedCert = await certificateRepository.softDelete(id);
      logger.info('Certificate soft deleted', { userId, certificateId: id });
    }

    // Remove sensitive data from response
    const { privateKey, passphrase, ...safeCertificate } = deletedCert;

    res.json({
      success: true,
      data: safeCertificate,
      message: permanent === 'true' ? 'Certificate permanently deleted' : 'Certificate deactivated',
    });
  } catch (error) {
    logger.error('Error deleting certificate', { error, userId: req.user?.id, certificateId: req.params.id });

    res.status(500).json({
      success: false,
      error: 'Failed to delete certificate',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/certificates/validate
 * Validate a certificate without saving it
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { certificate, privateKey, passphrase } = req.body;

    if (!certificate || !privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: certificate, privateKey',
      });
    }

    // Validate certificate
    const certValidation = certificateService.validateCertificate(certificate);
    if (!certValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid certificate',
        details: certValidation.error,
      });
    }

    // Validate private key
    const keyValidation = certificateService.validatePrivateKey(privateKey, passphrase);
    if (!keyValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid private key',
        details: keyValidation.error,
      });
    }

    // Validate key pair
    const keyPairValid = certificateService.validateKeyPair(certificate, privateKey, passphrase);
    if (!keyPairValid) {
      return res.status(400).json({
        success: false,
        error: 'Certificate and private key do not match',
      });
    }

    // Parse certificate info
    const certInfo = certificateService.parseCertificate(certificate);
    const extractedCuit = certificateService.extractCuitFromCertificate(certificate);

    res.json({
      success: true,
      message: 'Certificate and private key are valid',
      data: {
        subject: certInfo.subject,
        issuer: certInfo.issuer,
        serialNumber: certInfo.serialNumber,
        validFrom: certInfo.validFrom,
        validTo: certInfo.validTo,
        fingerprint: certInfo.fingerprint,
        extractedCuit,
        daysUntilExpiration: Math.floor((certInfo.validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      },
    });
  } catch (error) {
    logger.error('Error validating certificate', { error, userId: req.user?.id });

    res.status(400).json({
      success: false,
      error: 'Failed to validate certificate',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
