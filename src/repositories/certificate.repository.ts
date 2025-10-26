/**
 * Certificate repository
 * Handles database operations for ARCA X.509 certificates
 */

import { Prisma, Certificate } from '@prisma/client';
import { getPrismaClient } from '../config/database';

export interface CertificateFilters {
  userId?: string;
  cuit?: string;
  isProduction?: boolean;
  isActive?: boolean;
}

export interface CertificateCreateInput {
  userId: string;
  cuit: string;
  certificate: string;
  privateKey: string;
  passphrase?: string | null;
  isProduction: boolean;
  expiresAt: Date;
  metadata?: Prisma.InputJsonValue;
}

export interface CertificateUpdateInput {
  certificate?: string;
  privateKey?: string;
  passphrase?: string | null;
  expiresAt?: Date;
  metadata?: Prisma.InputJsonValue;
}

export class CertificateRepository {
  private prisma = getPrismaClient();

  /**
   * Create a new certificate
   */
  async create(data: CertificateCreateInput): Promise<Certificate> {
    return this.prisma.certificate.create({
      data,
    });
  }

  /**
   * Find certificate by ID
   */
  async findById(id: string): Promise<Certificate | null> {
    return this.prisma.certificate.findUnique({
      where: { id },
    });
  }

  /**
   * Find certificate by user and CUIT
   */
  async findByUserAndCuit(userId: string, cuit: string, isProduction: boolean): Promise<Certificate | null> {
    return this.prisma.certificate.findFirst({
      where: {
        userId,
        cuit,
        isProduction,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find all certificates matching filters
   */
  async findAll(filters: CertificateFilters = {}): Promise<Certificate[]> {
    const where: Prisma.CertificateWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.cuit) {
      where.cuit = filters.cuit;
    }

    if (filters.isProduction !== undefined) {
      where.isProduction = filters.isProduction;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.certificate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update certificate
   */
  async update(id: string, data: CertificateUpdateInput): Promise<Certificate> {
    return this.prisma.certificate.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete certificate (mark as inactive)
   */
  async softDelete(id: string): Promise<Certificate> {
    return this.prisma.certificate.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Hard delete certificate (permanent)
   */
  async delete(id: string): Promise<Certificate> {
    return this.prisma.certificate.delete({
      where: { id },
    });
  }

  /**
   * Check if certificate is expired
   */
  async isExpired(id: string): Promise<boolean> {
    const certificate = await this.findById(id);
    if (!certificate) {
      return true;
    }
    return new Date() > certificate.expiresAt;
  }

  /**
   * Find certificates expiring soon (within days)
   */
  async findExpiringSoon(userId: string, days: number = 30): Promise<Certificate[]> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);

    return this.prisma.certificate.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          lte: expirationDate,
          gte: new Date(),
        },
      },
      orderBy: { expiresAt: 'asc' },
    });
  }

  /**
   * Get active certificate for user in specific environment
   */
  async getActiveCertificate(userId: string, cuit: string, isProduction: boolean): Promise<Certificate | null> {
    return this.prisma.certificate.findFirst({
      where: {
        userId,
        cuit,
        isProduction,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { expiresAt: 'desc' },
    });
  }

  /**
   * Count certificates by user
   */
  async countByUser(userId: string): Promise<number> {
    return this.prisma.certificate.count({
      where: { userId, isActive: true },
    });
  }
}

// Export singleton instance
export const certificateRepository = new CertificateRepository();
