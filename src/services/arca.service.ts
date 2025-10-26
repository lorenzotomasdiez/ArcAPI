/**
 * ARCA/AFIP Service
 * Handles communication with AFIP's web services (SOAP)
 *
 * This service wraps the AFIP API and provides:
 * - Authentication token management
 * - Invoice creation (CAE/CAEA)
 * - Invoice queries
 * - Error handling and retries
 *
 * AFIP Web Services Documentation:
 * https://www.afip.gob.ar/ws/documentacion/ws-factura-electronica.asp
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import { certificateService } from './certificate.service';
import { logger } from '../config/logger';

export interface ArcaAuthToken {
  token: string;
  sign: string;
  expiresAt: Date;
}

export interface InvoiceRequest {
  invoiceType: number;
  pointOfSale: number;
  number: number;
  issueDate: string;
  dueDate?: string;
  concept: number;
  clientDocumentType: number;
  clientDocumentNumber: string;
  totalAmount: number;
  netAmount: number;
  exemptAmount: number;
  vatAmount: number;
  serviceFrom?: string;
  serviceTo?: string;
  paymentDue?: string;
  currency: string;
  currencyExchangeRate: number;
  items: InvoiceItem[];
  taxes?: InvoiceTax[];
  cbtesAsoc?: AssociatedInvoice[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
}

export interface InvoiceTax {
  taxType: number;
  description: string;
  taxableBase: number;
  rate: number;
  amount: number;
}

export interface AssociatedInvoice {
  type: number;
  pointOfSale: number;
  number: number;
}

export interface InvoiceResponse {
  success: boolean;
  cae?: string;
  caeExpiration?: string;
  number?: number;
  observations?: ArcaObservation[];
  errors?: ArcaError[];
  rawResponse?: any;
}

export interface ArcaObservation {
  code: number;
  message: string;
}

export interface ArcaError {
  code: number;
  message: string;
}

export interface LastInvoiceNumber {
  invoiceType: number;
  pointOfSale: number;
  lastNumber: number;
}

export class ArcaService {
  // Token cache (in-memory for now, should use Redis in production)
  private tokenCache: Map<string, ArcaAuthToken> = new Map();

  // AFIP Web Service URLs
  private readonly WSAA_WSDL_PROD = 'https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl';
  private readonly WSAA_WSDL_TEST = 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl';
  private readonly WSFE_WSDL_PROD = 'https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL';
  private readonly WSFE_WSDL_TEST = 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL';

  /**
   * Get authentication token from AFIP (WSAA)
   * Tokens are valid for 12 hours
   */
  async getAuthToken(userId: string, cuit: string, isProduction: boolean): Promise<ArcaAuthToken> {
    const cacheKey = `${userId}_${cuit}_${isProduction ? 'prod' : 'test'}`;

    // Check cache first
    const cachedToken = this.tokenCache.get(cacheKey);
    if (cachedToken && cachedToken.expiresAt > new Date()) {
      logger.debug('Using cached ARCA token', { userId, cuit, isProduction });
      return cachedToken;
    }

    try {
      // Get user's certificate
      const certificate = await certificateService.getActiveCertificate(userId, cuit, isProduction);

      // Generate authentication request (TRA - Ticket de Requerimiento de Acceso)
      const tra = this.generateTRA(cuit, 'wsfe');

      // Sign TRA with certificate
      const signedTRA = this.signTRA(tra, certificate.privateKey, certificate.passphrase);

      // Call WSAA to get token (in production, this would be a SOAP call)
      // For now, return a mock token
      const token = await this.requestTokenFromWSAA(signedTRA, isProduction);

      // Cache token
      this.tokenCache.set(cacheKey, token);

      logger.info('Generated new ARCA token', {
        userId,
        cuit,
        isProduction,
        expiresAt: token.expiresAt,
      });

      return token;
    } catch (error) {
      logger.error('Failed to get ARCA auth token', { error, userId, cuit, isProduction });
      throw new Error('Failed to authenticate with ARCA: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Generate TRA (Ticket de Requerimiento de Acceso)
   */
  private generateTRA(cuit: string, service: string): string {
    const now = new Date();
    const generationTime = now.toISOString();
    const expirationTime = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(); // 12 hours
    const uniqueId = Date.now();

    return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${uniqueId}</uniqueId>
    <generationTime>${generationTime}</generationTime>
    <expirationTime>${expirationTime}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`;
  }

  /**
   * Sign TRA with certificate
   */
  private signTRA(tra: string, privateKeyPem: string, passphrase: string | null): string {
    try {
      const privateKey = crypto.createPrivateKey({
        key: privateKeyPem,
        format: 'pem',
        passphrase: passphrase || undefined,
      });

      const sign = crypto.createSign('SHA256');
      sign.update(tra);
      sign.end();

      const signature = sign.sign(privateKey, 'base64');

      // In production, this would be a CMS (PKCS#7) signed message
      // For now, return base64 encoded signature
      return Buffer.from(tra + '\n' + signature).toString('base64');
    } catch (error) {
      logger.error('Failed to sign TRA', { error });
      throw new Error('Failed to sign authentication request');
    }
  }

  /**
   * Request token from WSAA
   * In production, this would make a SOAP call to AFIP's WSAA
   */
  private async requestTokenFromWSAA(signedTRA: string, isProduction: boolean): Promise<ArcaAuthToken> {
    // TODO: Implement actual SOAP call to WSAA
    // For now, return a mock token for testing

    logger.warn('Using mock ARCA token - SOAP implementation pending', { isProduction });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 12);

    return {
      token: 'mock_token_' + crypto.randomBytes(32).toString('hex'),
      sign: 'mock_sign_' + crypto.randomBytes(32).toString('hex'),
      expiresAt,
    };
  }

  /**
   * Create invoice in AFIP (WSFE)
   */
  async createInvoice(
    userId: string,
    cuit: string,
    isProduction: boolean,
    invoice: InvoiceRequest,
  ): Promise<InvoiceResponse> {
    try {
      // Get authentication token
      const authToken = await this.getAuthToken(userId, cuit, isProduction);

      // Validate invoice data
      this.validateInvoiceRequest(invoice);

      // Call WSFE to create invoice (in production, this would be a SOAP call)
      const response = await this.submitInvoiceToWSFE(authToken, cuit, invoice, isProduction);

      logger.info('Invoice created in ARCA', {
        userId,
        cuit,
        invoiceType: invoice.invoiceType,
        pointOfSale: invoice.pointOfSale,
        number: response.number,
        cae: response.cae,
      });

      return response;
    } catch (error) {
      logger.error('Failed to create invoice in ARCA', {
        error,
        userId,
        cuit,
        invoiceType: invoice.invoiceType,
      });
      throw error;
    }
  }

  /**
   * Validate invoice request
   */
  private validateInvoiceRequest(invoice: InvoiceRequest): void {
    if (!invoice.invoiceType || invoice.invoiceType < 1) {
      throw new Error('Invalid invoice type');
    }

    if (!invoice.pointOfSale || invoice.pointOfSale < 1) {
      throw new Error('Invalid point of sale');
    }

    if (!invoice.concept || invoice.concept < 1 || invoice.concept > 3) {
      throw new Error('Invalid concept (must be 1=Products, 2=Services, 3=Mixed)');
    }

    if (!invoice.clientDocumentType || !invoice.clientDocumentNumber) {
      throw new Error('Client document information is required');
    }

    if (!invoice.totalAmount || invoice.totalAmount <= 0) {
      throw new Error('Total amount must be greater than zero');
    }

    if (invoice.items.length === 0) {
      throw new Error('At least one item is required');
    }

    // Validate concept 2 or 3 requires service dates
    if ((invoice.concept === 2 || invoice.concept === 3) && (!invoice.serviceFrom || !invoice.serviceTo)) {
      throw new Error('Service dates are required for service invoices');
    }
  }

  /**
   * Submit invoice to WSFE
   * In production, this would make a SOAP call to AFIP's WSFE
   */
  private async submitInvoiceToWSFE(
    authToken: ArcaAuthToken,
    cuit: string,
    invoice: InvoiceRequest,
    isProduction: boolean,
  ): Promise<InvoiceResponse> {
    // TODO: Implement actual SOAP call to WSFE
    // For now, return a mock response for testing

    logger.warn('Using mock ARCA invoice response - SOAP implementation pending', {
      cuit,
      invoiceType: invoice.invoiceType,
      pointOfSale: invoice.pointOfSale,
    });

    // Generate mock CAE (Código de Autorización Electrónico)
    const cae = '7' + Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0');
    const caeExpiration = new Date();
    caeExpiration.setDate(caeExpiration.getDate() + 10); // CAE valid for 10 days

    return {
      success: true,
      cae,
      caeExpiration: caeExpiration.toISOString().split('T')[0],
      number: invoice.number,
      observations: [],
      errors: [],
    };
  }

  /**
   * Get last invoice number from AFIP
   */
  async getLastInvoiceNumber(
    userId: string,
    cuit: string,
    isProduction: boolean,
    invoiceType: number,
    pointOfSale: number,
  ): Promise<LastInvoiceNumber> {
    try {
      // Get authentication token
      const authToken = await this.getAuthToken(userId, cuit, isProduction);

      // Call WSFE to get last number (in production, this would be a SOAP call)
      // For now, return mock data

      logger.warn('Using mock last invoice number - SOAP implementation pending');

      return {
        invoiceType,
        pointOfSale,
        lastNumber: 0, // In production, this would come from AFIP
      };
    } catch (error) {
      logger.error('Failed to get last invoice number from ARCA', {
        error,
        userId,
        cuit,
        invoiceType,
        pointOfSale,
      });
      throw error;
    }
  }

  /**
   * Query invoice from AFIP
   */
  async queryInvoice(
    userId: string,
    cuit: string,
    isProduction: boolean,
    invoiceType: number,
    pointOfSale: number,
    number: number,
  ): Promise<any> {
    try {
      // Get authentication token
      const authToken = await this.getAuthToken(userId, cuit, isProduction);

      // Call WSFE to query invoice (in production, this would be a SOAP call)
      logger.warn('Using mock invoice query - SOAP implementation pending');

      return {
        found: false,
        message: 'SOAP implementation pending',
      };
    } catch (error) {
      logger.error('Failed to query invoice from ARCA', {
        error,
        userId,
        cuit,
        invoiceType,
        pointOfSale,
        number,
      });
      throw error;
    }
  }

  /**
   * Clear token cache for a user
   */
  clearTokenCache(userId: string, cuit: string, isProduction: boolean): void {
    const cacheKey = `${userId}_${cuit}_${isProduction ? 'prod' : 'test'}`;
    this.tokenCache.delete(cacheKey);
    logger.info('Cleared ARCA token cache', { userId, cuit, isProduction });
  }
}

// Export singleton instance
export const arcaService = new ArcaService();
