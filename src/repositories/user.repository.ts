/**
 * User Repository
 * Handles all database operations for users
 */

import { User, UserTier, UserStatus, Prisma } from '@prisma/client';
import { getPrismaClient } from '@/config/database';

export interface CreateUserInput {
  email: string;
  passwordHash: string | null;
  name: string;
  company?: string | null;
  taxId?: string | null;
  phone?: string | null;
  tier?: UserTier;
  status?: UserStatus;
  emailVerifiedAt?: Date | null;
}

export interface UpdateUserInput {
  email?: string;
  passwordHash?: string;
  name?: string;
  company?: string | null;
  taxId?: string | null;
  phone?: string | null;
  tier?: UserTier;
  status?: UserStatus;
  emailVerifiedAt?: Date | null;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  status?: UserStatus;
  tier?: UserTier;
  search?: string;
}

export interface ListUsersResult {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CountUsersParams {
  status?: UserStatus;
  tier?: UserTier;
}

export class UserRepository {
  private prisma = getPrismaClient();

  /**
   * Create a new user
   */
  async create(input: CreateUserInput): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash: input.passwordHash,
          name: input.name,
          company: input.company ?? null,
          taxId: input.taxId ?? null,
          phone: input.phone ?? null,
          tier: input.tier ?? UserTier.FREE,
          status: input.status ?? UserStatus.ACTIVE,
          emailVerifiedAt: input.emailVerifiedAt ?? null,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('User with this email already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by email (case-insensitive)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Update user
   */
  async update(id: string, input: UpdateUserInput): Promise<User> {
    try {
      const updateData: Prisma.UserUpdateInput = {};

      if (input.email !== undefined) {
        updateData.email = input.email.toLowerCase();
      }
      if (input.passwordHash !== undefined) {
        updateData.passwordHash = input.passwordHash;
      }
      if (input.name !== undefined) {
        updateData.name = input.name;
      }
      if (input.company !== undefined) {
        updateData.company = input.company;
      }
      if (input.taxId !== undefined) {
        updateData.taxId = input.taxId;
      }
      if (input.phone !== undefined) {
        updateData.phone = input.phone;
      }
      if (input.tier !== undefined) {
        updateData.tier = input.tier;
      }
      if (input.status !== undefined) {
        updateData.status = input.status;
      }
      if (input.emailVerifiedAt !== undefined) {
        updateData.emailVerifiedAt = input.emailVerifiedAt;
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('User not found');
        }
        if (error.code === 'P2002') {
          throw new Error('User with this email already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Soft delete user (set status to DELETED)
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { status: UserStatus.DELETED },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('User not found');
        }
      }
      throw error;
    }
  }

  /**
   * List users with pagination and filters
   */
  async list(params: ListUsersParams = {}): Promise<ListUsersResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.tier) {
      where.tier = params.tier;
    }

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
        { company: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Count users with filters
   */
  async count(params: CountUsersParams = {}): Promise<number> {
    const where: Prisma.UserWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.tier) {
      where.tier = params.tier;
    }

    return this.prisma.user.count({ where });
  }
}
