/**
 * API Key Service
 * Handles API key generation, validation, and management
 */

import { ApiKey, Prisma } from '@prisma/client';
import { getPrismaClient } from '@/config/database';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { env } from '@/config/env';

export interface GenerateApiKeyInput {
  userId: string;
  name: string;
  prefix?: string;
  scopes?: string[];
  rateLimit?: number;
  expiresAt?: Date;
}

export interface GenerateApiKeyResult {
  apiKey: string; // Plain text key (only returned once)
  keyRecord: ApiKey; // Database record
}

export interface ListApiKeysOptions {
  activeOnly?: boolean;
}

export interface UpdateApiKeyInput {
  name?: string;
  scopes?: string[];
  rateLimit?: number;
  expiresAt?: Date | null;
}

export class ApiKeyService {
  private prisma = getPrismaClient();

  /**
   * Generate a new API key for a user
   */
  async generateApiKey(input: GenerateApiKeyInput): Promise<GenerateApiKeyResult> {
    const prefix = input.prefix ?? 'sk_live_';
    const randomPart = this.generateRandomString(32);
    const apiKey = `${prefix}${randomPart}`;

    // Hash the API key before storing
    const keyHash = await this.hashApiKey(apiKey);

    const keyRecord = await this.prisma.apiKey.create({
      data: {
        userId: input.userId,
        name: input.name,
        keyHash,
        keyPrefix: prefix,
        scopes: input.scopes ?? [],
        rateLimit: input.rateLimit ?? 100,
        isActive: true,
        expiresAt: input.expiresAt ?? null,
      },
    });

    return {
      apiKey,
      keyRecord,
    };
  }

  /**
   * Validate an API key and return the key record if valid
   */
  async validateApiKey(apiKey: string): Promise<ApiKey | null> {
    // Extract prefix to narrow down search
    const prefix = this.extractPrefix(apiKey);

    // Find potential matches by prefix
    const keys = await this.prisma.apiKey.findMany({
      where: {
        keyPrefix: prefix,
        isActive: true,
      },
    });

    // Check each key's hash
    for (const key of keys) {
      const isMatch = await this.compareApiKey(apiKey, key.keyHash);

      if (isMatch) {
        // Check if key is expired
        if (key.expiresAt && key.expiresAt < new Date()) {
          return null;
        }

        // Update last used timestamp (fire and forget)
        this.updateLastUsed(key.id).catch((error) => {
          console.error('Failed to update lastUsedAt:', error);
        });

        return key;
      }
    }

    return null;
  }

  /**
   * List all API keys for a user
   */
  async listApiKeys(userId: string, options: ListApiKeysOptions = {}): Promise<ApiKey[]> {
    const where: Prisma.ApiKeyWhereInput = {
      userId,
    };

    if (options.activeOnly) {
      where.isActive = true;
    }

    return this.prisma.apiKey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get API key by ID
   */
  async getApiKeyById(id: string): Promise<ApiKey | null> {
    return this.prisma.apiKey.findUnique({
      where: { id },
    });
  }

  /**
   * Revoke (deactivate) an API key
   */
  async revokeApiKey(id: string): Promise<void> {
    try {
      await this.prisma.apiKey.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('API key not found');
        }
      }
      throw error;
    }
  }

  /**
   * Permanently delete an API key
   */
  async deleteApiKey(id: string): Promise<void> {
    try {
      await this.prisma.apiKey.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('API key not found');
        }
      }
      throw error;
    }
  }

  /**
   * Update API key properties
   */
  async updateApiKey(id: string, input: UpdateApiKeyInput): Promise<ApiKey> {
    try {
      const updateData: Prisma.ApiKeyUpdateInput = {};

      if (input.name !== undefined) {
        updateData.name = input.name;
      }
      if (input.scopes !== undefined) {
        updateData.scopes = input.scopes;
      }
      if (input.rateLimit !== undefined) {
        updateData.rateLimit = input.rateLimit;
      }
      if (input.expiresAt !== undefined) {
        updateData.expiresAt = input.expiresAt;
      }

      return await this.prisma.apiKey.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('API key not found');
        }
      }
      throw error;
    }
  }

  /**
   * Check if API key has a specific scope
   */
  hasScope(apiKey: ApiKey, requiredScope: string): boolean {
    return apiKey.scopes.includes(requiredScope);
  }

  /**
   * Update lastUsedAt timestamp
   */
  private async updateLastUsed(id: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * Hash an API key using bcrypt
   */
  private async hashApiKey(apiKey: string): Promise<string> {
    return bcrypt.hash(apiKey, env.apiKeySaltRounds);
  }

  /**
   * Compare plain API key with hash
   */
  private async compareApiKey(apiKey: string, hash: string): Promise<boolean> {
    return bcrypt.compare(apiKey, hash);
  }

  /**
   * Extract prefix from API key
   */
  private extractPrefix(apiKey: string): string {
    // Common prefixes: sk_test_, sk_live_
    const match = apiKey.match(/^(sk_[a-z]+_)/);
    return match ? match[1] : '';
  }

  /**
   * Generate a random string for API key
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    // Use UUID for additional entropy
    const uuid = uuidv4().replace(/-/g, '');
    result += uuid;

    // Add more random characters if needed
    while (result.length < length) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result.substring(0, length);
  }
}
