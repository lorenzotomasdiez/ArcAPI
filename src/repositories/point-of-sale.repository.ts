/**
 * Point of Sale repository
 * Handles database operations for ARCA points of sale (puntos de venta)
 */

import { Prisma, PointOfSale } from '@prisma/client';
import { getPrismaClient } from '../config/database';

export interface PointOfSaleFilters {
  userId?: string;
  number?: number;
  isActive?: boolean;
}

export interface PointOfSaleCreateInput {
  userId: string;
  number: number;
  name: string;
  isProduction: boolean;
  metadata?: Prisma.InputJsonValue;
}

export interface PointOfSaleUpdateInput {
  name?: string;
  isProduction?: boolean;
  metadata?: Prisma.InputJsonValue;
}

export class PointOfSaleRepository {
  private prisma = getPrismaClient();

  /**
   * Create a new point of sale
   */
  async create(data: PointOfSaleCreateInput): Promise<PointOfSale> {
    return this.prisma.pointOfSale.create({
      data,
    });
  }

  /**
   * Find point of sale by ID
   */
  async findById(id: string): Promise<PointOfSale | null> {
    return this.prisma.pointOfSale.findUnique({
      where: { id },
    });
  }

  /**
   * Find point of sale by user and number
   */
  async findByUserAndNumber(userId: string, number: number): Promise<PointOfSale | null> {
    return this.prisma.pointOfSale.findUnique({
      where: {
        userId_number: {
          userId,
          number,
        },
      },
    });
  }

  /**
   * Find all points of sale matching filters
   */
  async findAll(filters: PointOfSaleFilters = {}): Promise<PointOfSale[]> {
    const where: Prisma.PointOfSaleWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.number !== undefined) {
      where.number = filters.number;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.pointOfSale.findMany({
      where,
      orderBy: { number: 'asc' },
    });
  }

  /**
   * Update point of sale
   */
  async update(id: string, data: PointOfSaleUpdateInput): Promise<PointOfSale> {
    return this.prisma.pointOfSale.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete point of sale (mark as inactive)
   */
  async softDelete(id: string): Promise<PointOfSale> {
    return this.prisma.pointOfSale.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Hard delete point of sale (permanent)
   */
  async delete(id: string): Promise<PointOfSale> {
    return this.prisma.pointOfSale.delete({
      where: { id },
    });
  }

  /**
   * Count points of sale by user
   */
  async countByUser(userId: string): Promise<number> {
    return this.prisma.pointOfSale.count({
      where: { userId, isActive: true },
    });
  }

  /**
   * Check if point of sale exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.pointOfSale.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Check if point of sale exists by user and number
   */
  async existsByUserAndNumber(userId: string, number: number): Promise<boolean> {
    const count = await this.prisma.pointOfSale.count({
      where: { userId, number },
    });
    return count > 0;
  }

  /**
   * Get default point of sale for user (usually number 1)
   */
  async getDefaultForUser(userId: string): Promise<PointOfSale | null> {
    return this.prisma.pointOfSale.findFirst({
      where: { userId, isActive: true },
      orderBy: { number: 'asc' },
    });
  }

  /**
   * Get next available invoice number for a point of sale
   */
  async getNextInvoiceNumber(pointOfSaleId: string, invoiceType: number): Promise<number> {
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        pointOfSaleId,
        invoiceType,
      },
      orderBy: { number: 'desc' },
    });

    return (lastInvoice?.number ?? 0) + 1;
  }
}

// Export singleton instance
export const pointOfSaleRepository = new PointOfSaleRepository();
