/**
 * Database configuration
 * Prisma client initialization and connection management
 */

import { PrismaClient } from '@prisma/client';
import { env } from './env';

let prisma: PrismaClient;

/**
 * Get Prisma client instance (singleton)
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: env.databaseUrl,
        },
      },
      log: env.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  return prisma;
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}

/**
 * Connect to database and verify connection
 */
export async function connectDatabase(): Promise<void> {
  try {
    const client = getPrismaClient();
    await client.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}
