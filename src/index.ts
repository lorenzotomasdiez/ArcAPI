/**
 * Server entry point
 * Starts the Express server
 */

import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    const port = env.port;
    app.listen(port, () => {
      logger.info(`Server started`, {
        port,
        environment: env.nodeEnv,
        nodeVersion: process.version,
      });

      logger.info(`Health check available at http://localhost:${port}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');

      await disconnectDatabase();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');

      await disconnectDatabase();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

export { startServer };
