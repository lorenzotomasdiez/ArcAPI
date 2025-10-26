/**
 * Client repository
 * Handles database operations for clients (customers)
 */

import { Prisma, Client } from '@prisma/client';
import { getPrismaClient } from '../config/database';

export interface ClientFilters {
  userId?: string;
  taxId?: string;
  name?: string;
  email?: string;
  ivaCondition?: string;
  isActive?: boolean;
}

export interface ClientCreateInput {
  userId: string;
  taxId: string;
  taxIdType: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  ivaCondition: string;
  metadata?: Prisma.InputJsonValue;
}

export interface ClientUpdateInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  ivaCondition?: string;
  metadata?: Prisma.InputJsonValue;
}

export class ClientRepository {
  private prisma = getPrismaClient();

  /**
   * Create a new client
   */
  async create(data: ClientCreateInput): Promise<Client> {
    return this.prisma.client.create({
      data,
    });
  }

  /**
   * Find client by ID
   */
  async findById(id: string): Promise<Client | null> {
    return this.prisma.client.findUnique({
      where: { id },
    });
  }

  /**
   * Find client by user and tax ID
   */
  async findByUserAndTaxId(userId: string, taxId: string): Promise<Client | null> {
    return this.prisma.client.findUnique({
      where: {
        userId_taxId: {
          userId,
          taxId,
        },
      },
    });
  }

  /**
   * Find all clients matching filters
   */
  async findAll(filters: ClientFilters = {}): Promise<Client[]> {
    const where: Prisma.ClientWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.taxId) {
      where.taxId = { contains: filters.taxId, mode: 'insensitive' };
    }

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }

    if (filters.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }

    if (filters.ivaCondition) {
      where.ivaCondition = filters.ivaCondition;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update client
   */
  async update(id: string, data: ClientUpdateInput): Promise<Client> {
    return this.prisma.client.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete client (mark as inactive)
   */
  async softDelete(id: string): Promise<Client> {
    return this.prisma.client.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Hard delete client (permanent)
   */
  async delete(id: string): Promise<Client> {
    return this.prisma.client.delete({
      where: { id },
    });
  }

  /**
   * Count clients by user
   */
  async countByUser(userId: string): Promise<number> {
    return this.prisma.client.count({
      where: { userId, isActive: true },
    });
  }

  /**
   * Check if client exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.client.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Check if client exists by user and tax ID
   */
  async existsByUserAndTaxId(userId: string, taxId: string): Promise<boolean> {
    const count = await this.prisma.client.count({
      where: { userId, taxId },
    });
    return count > 0;
  }
}

// Export singleton instance
export const clientRepository = new ClientRepository();
