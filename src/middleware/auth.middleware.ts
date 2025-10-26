/**
 * Authentication Middleware
 * Validates API keys and attaches user/apiKey to request
 */

import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '@/services/api-key.service';
import { UserRepository } from '@/repositories/user.repository';
import { ApiKey, UserStatus } from '@prisma/client';
import { logger } from '@/config/logger';

const apiKeyService = new ApiKeyService();
const userRepository = new UserRepository();

/**
 * Extract API key from request headers
 */
function extractApiKey(req: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // Check x-api-key header
  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string') {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Authenticate middleware
 * Validates API key and attaches user and apiKey to request
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = extractApiKey(req);

    if (!apiKey) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'API key is required',
      });
      return;
    }

    // Validate API key
    const keyRecord = await apiKeyService.validateApiKey(apiKey);

    if (!keyRecord) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
      return;
    }

    // Fetch user
    const user = await userRepository.findById(keyRecord.userId);

    if (!user) {
      logger.warn('API key belongs to non-existent user', {
        apiKeyId: keyRecord.id,
        userId: keyRecord.userId,
      });

      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
      return;
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      logger.warn('API key belongs to inactive user', {
        apiKeyId: keyRecord.id,
        userId: user.id,
        userStatus: user.status,
      });

      res.status(401).json({
        error: 'Unauthorized',
        message: 'User account is not active',
      });
      return;
    }

    // Attach user and apiKey to request
    req.user = user;
    req.apiKey = keyRecord;

    next();
  } catch (error) {
    logger.error('Authentication error', { error });

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
}

/**
 * Require scope middleware
 * Checks if the authenticated API key has the required scope(s)
 * @param requiredScope - Single scope or array of scopes (OR logic)
 */
export function requireScope(requiredScope: string | string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.apiKey) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const scopes = Array.isArray(requiredScope) ? requiredScope : [requiredScope];
      const hasRequiredScope = scopes.some((scope) =>
        apiKeyService.hasScope(req.apiKey as ApiKey, scope)
      );

      if (!hasRequiredScope) {
        logger.warn('Insufficient permissions', {
          userId: req.user?.id,
          apiKeyId: req.apiKey.id,
          requiredScopes: scopes,
          actualScopes: req.apiKey.scopes,
        });

        res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions',
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Authorization error', { error });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authorization check failed',
      });
    }
  };
}

/**
 * Optional authentication middleware
 * Attaches user/apiKey if valid, but doesn't fail if missing
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = extractApiKey(req);

    if (!apiKey) {
      next();
      return;
    }

    const keyRecord = await apiKeyService.validateApiKey(apiKey);

    if (keyRecord) {
      const user = await userRepository.findById(keyRecord.userId);

      if (user && user.status === UserStatus.ACTIVE) {
        req.user = user;
        req.apiKey = keyRecord;
      }
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error', { error });
    next();
  }
}
