/**
 * Invoice repository
 * Handles database operations for invoices
 */

import { Prisma, Invoice, InvoiceItem } from '@prisma/client';
import { getPrismaClient } from '../config/database';

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

export interface InvoiceFilters {
  userId?: string;
  clientId?: string;
  pointOfSaleId?: string;
  invoiceType?: number;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface InvoiceCreateInput {
  userId: string;
  clientId: string;
  pointOfSaleId: string;
  invoiceType: number;
  number: number;
  issueDate: Date;
  dueDate?: Date | null;
  concept: number;
  currency: string;
  currencyExchangeRate: number;
  netAmount: number;
  vatAmount: number;
  exemptAmount: number;
  taxAmount: number;
  totalAmount: number;
  cae?: string | null;
  caeExpiration?: Date | null;
  status: string;
  metadata?: Prisma.InputJsonValue;
  arcaResponse?: Prisma.InputJsonValue;
  items: InvoiceItemCreateInput[];
}

export interface InvoiceItemCreateInput {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  metadata?: Prisma.InputJsonValue;
}

export interface InvoiceUpdateInput {
  status?: string;
  cae?: string | null;
  caeExpiration?: Date | null;
  metadata?: Prisma.InputJsonValue;
  arcaResponse?: Prisma.InputJsonValue;
}

export class InvoiceRepository {
  private prisma = getPrismaClient();

  /**
   * Create a new invoice with items
   */
  async create(data: InvoiceCreateInput): Promise<InvoiceWithItems> {
    const { items, ...invoiceData } = data;

    return this.prisma.invoice.create({
      data: {
        ...invoiceData,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });
  }

  /**
   * Find invoice by ID
   */
  async findById(id: string): Promise<InvoiceWithItems | null> {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        client: true,
        pointOfSale: true,
      },
    });
  }

  /**
   * Find invoice by number
   */
  async findByNumber(
    userId: string,
    pointOfSaleId: string,
    invoiceType: number,
    number: number,
  ): Promise<InvoiceWithItems | null> {
    return this.prisma.invoice.findFirst({
      where: {
        userId,
        pointOfSaleId,
        invoiceType,
        number,
      },
      include: {
        items: true,
      },
    });
  }

  /**
   * Find all invoices matching filters with pagination
   */
  async findAll(
    filters: InvoiceFilters = {},
    page: number = 1,
    limit: number = 50,
  ): Promise<{ invoices: InvoiceWithItems[]; total: number }> {
    const where: Prisma.InvoiceWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.pointOfSaleId) {
      where.pointOfSaleId = filters.pointOfSaleId;
    }

    if (filters.invoiceType) {
      where.invoiceType = filters.invoiceType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.issueDate = {};
      if (filters.dateFrom) {
        where.issueDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.issueDate.lte = filters.dateTo;
      }
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.totalAmount = {};
      if (filters.minAmount !== undefined) {
        where.totalAmount.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        where.totalAmount.lte = filters.maxAmount;
      }
    }

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          items: true,
          client: true,
          pointOfSale: true,
        },
        orderBy: { issueDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { invoices, total };
  }

  /**
   * Update invoice
   */
  async update(id: string, data: InvoiceUpdateInput): Promise<Invoice> {
    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete invoice (only allowed in testing environment)
   */
  async delete(id: string): Promise<Invoice> {
    return this.prisma.invoice.delete({
      where: { id },
    });
  }

  /**
   * Get invoice statistics for user
   */
  async getStatistics(
    userId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{
    totalInvoices: number;
    totalAmount: number;
    approvedInvoices: number;
    rejectedInvoices: number;
    pendingInvoices: number;
  }> {
    const where: Prisma.InvoiceWhereInput = { userId };

    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) where.issueDate.gte = dateFrom;
      if (dateTo) where.issueDate.lte = dateTo;
    }

    const [totalInvoices, approvedInvoices, rejectedInvoices, pendingInvoices, totalAmountResult] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.invoice.count({ where: { ...where, status: 'REJECTED' } }),
      this.prisma.invoice.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.invoice.aggregate({
        where: { ...where, status: 'APPROVED' },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalInvoices,
      totalAmount: totalAmountResult._sum.totalAmount || 0,
      approvedInvoices,
      rejectedInvoices,
      pendingInvoices,
    };
  }

  /**
   * Get last invoice number for a point of sale and invoice type
   */
  async getLastNumber(pointOfSaleId: string, invoiceType: number): Promise<number> {
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        pointOfSaleId,
        invoiceType,
      },
      orderBy: { number: 'desc' },
      select: { number: true },
    });

    return lastInvoice?.number || 0;
  }

  /**
   * Check if invoice exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.invoice.count({ where: { id } });
    return count > 0;
  }
}

// Export singleton instance
export const invoiceRepository = new InvoiceRepository();
