/**
 * Express application setup
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import { env } from './config/env';
import { logger } from './config/logger';
import { getPrismaClient } from './config/database';

// Import routes
import referenceRoutes from './routes/reference.routes';
import clientRoutes from './routes/client.routes';
import pointOfSaleRoutes from './routes/point-of-sale.routes';
import certificateRoutes from './routes/certificate.routes';
import invoiceRoutes from './routes/invoice.routes';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
});

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

/**
 * GET /
 * API info endpoint
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'ARCA API',
    version: '0.1.0',
    description: 'Modern REST API for electronic invoicing in Argentina',
    documentation: 'https://docs.arca-api.com',
    endpoints: {
      health: '/health',
      healthDatabase: '/health/database',
      reference: '/api/v1/reference',
      clients: '/api/v1/clients',
      pointsOfSale: '/api/v1/points-of-sale',
      certificates: '/api/v1/certificates',
      invoices: '/api/v1/invoices',
    },
  });
});

/**
 * GET /health
 * Basic health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'arca-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.nodeEnv,
  });
});

/**
 * GET /health/database
 * Database health check
 */
app.get('/health/database', async (req: Request, res: Response) => {
  try {
    const prisma = getPrismaClient();

    // Simple query to check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Database health check failed', { error });

    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * Mount API routes under /api/v1
 */
app.use('/api/v1/reference', referenceRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/points-of-sale', pointOfSaleRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/invoices', invoiceRoutes);

// ============================================================================
// ERROR HANDLERS
// ============================================================================

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Global error handler
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: env.nodeEnv === 'production' ? 'An unexpected error occurred' : err.message,
    timestamp: new Date().toISOString(),
  });
});

export { app };
