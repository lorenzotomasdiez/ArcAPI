/**
 * Express type extensions
 * Augment Express Request type with custom properties
 */

import { User, ApiKey } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      apiKey?: ApiKey;
    }
  }
}

export {};
