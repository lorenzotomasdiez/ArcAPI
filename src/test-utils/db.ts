/**
 * Database test utilities
 * Provides helpers for database testing
 */

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

/**
 * Get or create Prisma test client
 */
export function getPrismaTestClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}

/**
 * Clean all tables in the test database
 */
export async function cleanDatabase(): Promise<void> {
  const client = getPrismaTestClient();

  // Delete in reverse order of dependencies
  await client.auditLog.deleteMany({});
  await client.webhookDelivery.deleteMany({});
  await client.webhookSubscription.deleteMany({});
  await client.integration.deleteMany({});
  await client.certificate.deleteMany({});
  await client.pointOfSale.deleteMany({});
  await client.invoiceItem.deleteMany({});
  await client.invoice.deleteMany({});
  await client.client.deleteMany({});
  await client.apiKey.deleteMany({});
  await client.user.deleteMany({});
}

/**
 * Disconnect from test database
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}

/**
 * Setup function to run before each test
 */
export async function setupTest(): Promise<void> {
  await cleanDatabase();
}

/**
 * Teardown function to run after each test
 */
export async function teardownTest(): Promise<void> {
  await cleanDatabase();
}

/**
 * Teardown function to run after all tests
 */
export async function teardownAllTests(): Promise<void> {
  await disconnectDatabase();
}
