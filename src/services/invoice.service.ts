/**
 * Invoice service
 * Handles invoice creation, validation, and ARCA integration
 */

import { invoiceRepository, InvoiceCreateInput } from '../repositories/invoice.repository';
import { clientRepository } from '../repositories/client.repository';
import { pointOfSaleRepository } from '../repositories/point-of-sale.repository';
import { arcaService, InvoiceRequest } from './arca.service';
import { logger } from '../config/logger';
import {
  isValidInvoiceType,
  isValidConceptType,
  isValidCurrency,
  getVATRateByRate,
} from '../data/reference-data';

export interface CreateInvoiceInput {
  clientId: string;
  pointOfSaleId?: string; // Optional, will use default if not provided
  invoiceType: number;
  issueDate?: Date; // Optional, defaults to today
  dueDate?: Date | null;
  concept: number; // 1=Products, 2=Services, 3=Mixed
  currency?: string; // Defaults to ARS
  currencyExchangeRate?: number; // Defaults to 1
  items: CreateInvoiceItemInput[];
  notes?: string;
}

export interface CreateInvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number; // 0, 10.5, 21, 27, etc.
}

export class InvoiceService {
  /**
   * Create a new invoice
   */
  async createInvoice(userId: string, input: CreateInvoiceInput) {
    try {
      // 1. Validate input
      await this.validateInvoiceInput(userId, input);

      // 2. Get client
      const client = await clientRepository.findById(input.clientId);
      if (!client) {
        throw new Error('Client not found');
      }

      if (client.userId !== userId) {
        throw new Error('Client does not belong to user');
      }

      // 3. Get or use default point of sale
      let pointOfSale;
      if (input.pointOfSaleId) {
        pointOfSale = await pointOfSaleRepository.findById(input.pointOfSaleId);
        if (!pointOfSale) {
          throw new Error('Point of sale not found');
        }
        if (pointOfSale.userId !== userId) {
          throw new Error('Point of sale does not belong to user');
        }
      } else {
        pointOfSale = await pointOfSaleRepository.getDefaultForUser(userId);
        if (!pointOfSale) {
          throw new Error('No point of sale found. Please create one first.');
        }
      }

      // 4. Get next invoice number
      const lastNumber = await invoiceRepository.getLastNumber(pointOfSale.id, input.invoiceType);
      const newNumber = lastNumber + 1;

      // 5. Calculate totals
      const totals = this.calculateTotals(input.items, input.currencyExchangeRate || 1);

      // 6. Prepare ARCA request
      const arcaRequest: InvoiceRequest = {
        invoiceType: input.invoiceType,
        pointOfSale: pointOfSale.number,
        number: newNumber,
        issueDate: (input.issueDate || new Date()).toISOString().split('T')[0],
        concept: input.concept,
        clientDocumentType: this.getDocumentTypeId(client.taxIdType),
        clientDocumentNumber: client.taxId.replace(/\D/g, ''), // Remove non-digits
        totalAmount: totals.totalAmount,
        netAmount: totals.netAmount,
        exemptAmount: totals.exemptAmount,
        vatAmount: totals.vatAmount,
        currency: input.currency || 'ARS',
        currencyExchangeRate: input.currencyExchangeRate || 1,
        items: input.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          vatAmount: (item.quantity * item.unitPrice * item.vatRate) / 100,
          totalAmount: item.quantity * item.unitPrice * (1 + item.vatRate / 100),
        })),
      };

      // Add service dates if concept is services
      if (input.concept === 2 || input.concept === 3) {
        const issueDate = input.issueDate || new Date();
        arcaRequest.serviceFrom = issueDate.toISOString().split('T')[0];
        arcaRequest.serviceTo = issueDate.toISOString().split('T')[0];
        arcaRequest.paymentDue = (input.dueDate || issueDate).toISOString().split('T')[0];
      }

      // 7. Create invoice in database with PENDING status
      const invoiceData: InvoiceCreateInput = {
        userId,
        clientId: client.id,
        pointOfSaleId: pointOfSale.id,
        invoiceType: input.invoiceType,
        number: newNumber,
        issueDate: input.issueDate || new Date(),
        dueDate: input.dueDate,
        concept: input.concept,
        currency: input.currency || 'ARS',
        currencyExchangeRate: input.currencyExchangeRate || 1,
        netAmount: totals.netAmount,
        vatAmount: totals.vatAmount,
        exemptAmount: totals.exemptAmount,
        taxAmount: 0,
        totalAmount: totals.totalAmount,
        status: 'PENDING',
        metadata: input.notes ? { notes: input.notes } : undefined,
        items: input.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          vatAmount: (item.quantity * item.unitPrice * item.vatRate) / 100,
          totalAmount: item.quantity * item.unitPrice * (1 + item.vatRate / 100),
        })),
      };

      const invoice = await invoiceRepository.create(invoiceData);

      logger.info('Invoice created in database', {
        userId,
        invoiceId: invoice.id,
        invoiceType: input.invoiceType,
        number: newNumber,
      });

      // 8. Submit to ARCA
      try {
        const arcaResponse = await arcaService.createInvoice(
          userId,
          client.taxId.replace(/\D/g, ''),
          pointOfSale.isProduction,
          arcaRequest,
        );

        // 9. Update invoice with ARCA response
        if (arcaResponse.success && arcaResponse.cae) {
          await invoiceRepository.update(invoice.id, {
            status: 'APPROVED',
            cae: arcaResponse.cae,
            caeExpiration: arcaResponse.caeExpiration ? new Date(arcaResponse.caeExpiration) : null,
            arcaResponse: arcaResponse as any,
          });

          logger.info('Invoice approved by ARCA', {
            userId,
            invoiceId: invoice.id,
            cae: arcaResponse.cae,
          });
        } else {
          await invoiceRepository.update(invoice.id, {
            status: 'REJECTED',
            arcaResponse: arcaResponse as any,
          });

          logger.error('Invoice rejected by ARCA', {
            userId,
            invoiceId: invoice.id,
            errors: arcaResponse.errors,
          });
        }

        // Return updated invoice
        return invoiceRepository.findById(invoice.id);
      } catch (arcaError) {
        // Update invoice status to error
        await invoiceRepository.update(invoice.id, {
          status: 'ERROR',
          metadata: {
            error: arcaError instanceof Error ? arcaError.message : 'Unknown ARCA error',
          },
        });

        logger.error('ARCA submission failed', {
          userId,
          invoiceId: invoice.id,
          error: arcaError,
        });

        throw new Error('Failed to submit invoice to ARCA: ' + (arcaError instanceof Error ? arcaError.message : 'Unknown error'));
      }
    } catch (error) {
      logger.error('Failed to create invoice', { error, userId });
      throw error;
    }
  }

  /**
   * Validate invoice input
   */
  private async validateInvoiceInput(userId: string, input: CreateInvoiceInput): Promise<void> {
    // Validate invoice type
    if (!isValidInvoiceType(input.invoiceType)) {
      throw new Error('Invalid invoice type');
    }

    // Validate concept
    if (!isValidConceptType(input.concept)) {
      throw new Error('Invalid concept. Must be 1 (Products), 2 (Services), or 3 (Mixed)');
    }

    // Validate currency
    if (input.currency && !isValidCurrency(input.currency)) {
      throw new Error('Invalid currency');
    }

    // Validate items
    if (!input.items || input.items.length === 0) {
      throw new Error('At least one item is required');
    }

    for (const item of input.items) {
      if (!item.description || item.description.trim().length === 0) {
        throw new Error('Item description is required');
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new Error('Item quantity must be greater than zero');
      }

      if (!item.unitPrice || item.unitPrice < 0) {
        throw new Error('Item unit price must be greater than or equal to zero');
      }

      // Validate VAT rate
      const vatRate = getVATRateByRate(item.vatRate);
      if (!vatRate) {
        throw new Error(`Invalid VAT rate: ${item.vatRate}. Must be one of: 0, 2.5, 5, 10.5, 21, 27`);
      }
    }
  }

  /**
   * Calculate invoice totals
   */
  private calculateTotals(
    items: CreateInvoiceItemInput[],
    exchangeRate: number,
  ): {
    netAmount: number;
    vatAmount: number;
    exemptAmount: number;
    totalAmount: number;
  } {
    let netAmount = 0;
    let vatAmount = 0;
    let exemptAmount = 0;

    for (const item of items) {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemVat = (itemSubtotal * item.vatRate) / 100;

      if (item.vatRate === 0) {
        exemptAmount += itemSubtotal;
      } else {
        netAmount += itemSubtotal;
        vatAmount += itemVat;
      }
    }

    const totalAmount = netAmount + vatAmount + exemptAmount;

    return {
      netAmount: Math.round(netAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      exemptAmount: Math.round(exemptAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

  /**
   * Get document type ID from code
   */
  private getDocumentTypeId(code: string): number {
    const documentTypes: Record<string, number> = {
      CUIT: 80,
      CUIL: 86,
      CDI: 87,
      LE: 89,
      LC: 90,
      CI_EXT: 91,
      DNI: 96,
      PASAPORTE: 94,
    };

    return documentTypes[code.toUpperCase()] || 96; // Default to DNI
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(userId: string, invoiceId: string) {
    const invoice = await invoiceRepository.findById(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.userId !== userId) {
      throw new Error('Access denied');
    }

    return invoice;
  }

  /**
   * List invoices with filters and pagination
   */
  async listInvoices(
    userId: string,
    filters: {
      clientId?: string;
      pointOfSaleId?: string;
      invoiceType?: number;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
      minAmount?: number;
      maxAmount?: number;
    },
    page: number = 1,
    limit: number = 50,
  ) {
    return invoiceRepository.findAll({ ...filters, userId }, page, limit);
  }

  /**
   * Get invoice statistics
   */
  async getStatistics(userId: string, dateFrom?: Date, dateTo?: Date) {
    return invoiceRepository.getStatistics(userId, dateFrom, dateTo);
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService();
