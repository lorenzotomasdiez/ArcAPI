/**
 * Test data factories
 * Provides helper functions to create test data
 */

import { User, UserTier, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export interface CreateUserOptions {
  email?: string;
  name?: string;
  company?: string;
  tier?: UserTier;
  status?: UserStatus;
  emailVerifiedAt?: Date;
}

/**
 * Create user test data
 */
export function createUserData(options: CreateUserOptions = {}): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  const timestamp = new Date();

  return {
    email: options.email ?? `test-${uuidv4()}@example.com`,
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyE3H.jLO7C6', // "password123"
    name: options.name ?? 'Test User',
    company: options.company ?? null,
    taxId: null,
    phone: null,
    tier: options.tier ?? UserTier.FREE,
    status: options.status ?? UserStatus.ACTIVE,
    lastLoginAt: null,
    emailVerifiedAt: options.emailVerifiedAt ?? timestamp,
  };
}

export interface CreateApiKeyOptions {
  userId: string;
  name?: string;
  keyPrefix?: string;
  scopes?: string[];
  isActive?: boolean;
}

/**
 * Create API key test data
 */
export function createApiKeyData(options: CreateApiKeyOptions): {
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  scopes: string[];
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
} {
  return {
    userId: options.userId,
    name: options.name ?? 'Test API Key',
    keyHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyE3H.jLO7C6', // hash of "sk_test_123"
    keyPrefix: options.keyPrefix ?? 'sk_test_',
    scopes: options.scopes ?? ['invoices:read', 'invoices:write'],
    rateLimit: 100,
    isActive: options.isActive ?? true,
    lastUsedAt: null,
    expiresAt: null,
  };
}

export interface CreateClientOptions {
  userId: string;
  name?: string;
  taxId?: string;
  email?: string;
}

/**
 * Create client test data
 */
export function createClientData(options: CreateClientOptions): {
  userId: string;
  name: string;
  taxId: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string;
  taxCategory: string;
  isActive: boolean;
} {
  return {
    userId: options.userId,
    name: options.name ?? 'Test Client',
    taxId: options.taxId ?? '20-12345678-9',
    email: options.email ?? 'client@example.com',
    phone: null,
    address: null,
    city: null,
    state: null,
    zipCode: null,
    country: 'AR',
    taxCategory: 'Responsable Inscripto',
    isActive: true,
  };
}

export interface CreateInvoiceOptions {
  userId: string;
  clientId: string;
  pointOfSaleId: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
}

/**
 * Create invoice test data
 */
export function createInvoiceData(options: CreateInvoiceOptions): {
  userId: string;
  invoiceNumber: string | null;
  invoiceType: number;
  pointOfSaleId: string;
  clientId: string;
  issueDate: Date;
  dueDate: Date | null;
  currency: string;
  exchangeRate: number | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  arcaStatus: string;
  arcaCae: string | null;
  arcaCaeExpiry: Date | null;
  arcaResponse: any;
  arcaSubmittedAt: Date | null;
  status: string;
  notes: string | null;
  internalNotes: string | null;
  metadata: any;
} {
  const subtotal = options.subtotal ?? 1000;
  const taxAmount = options.taxAmount ?? 210; // 21% IVA
  const totalAmount = options.totalAmount ?? subtotal + taxAmount;

  return {
    userId: options.userId,
    invoiceNumber: null,
    invoiceType: 1, // Factura A
    pointOfSaleId: options.pointOfSaleId,
    clientId: options.clientId,
    issueDate: new Date(),
    dueDate: null,
    currency: 'ARS',
    exchangeRate: 1,
    subtotal,
    taxAmount,
    discountAmount: 0,
    totalAmount,
    arcaStatus: 'DRAFT',
    arcaCae: null,
    arcaCaeExpiry: null,
    arcaResponse: null,
    arcaSubmittedAt: null,
    status: 'DRAFT',
    notes: null,
    internalNotes: null,
    metadata: null,
  };
}
