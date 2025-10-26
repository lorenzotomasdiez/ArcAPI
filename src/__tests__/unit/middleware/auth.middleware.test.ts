/**
 * Unit tests for Authentication Middleware
 * Following TDD approach - tests written first
 */

import { Request, Response, NextFunction } from 'express';
import { authenticate, requireScope } from '@/middleware/auth.middleware';
import { ApiKeyService } from '@/services/api-key.service';
import { UserRepository } from '@/repositories/user.repository';
import { setupTest, teardownTest, teardownAllTests } from '@tests/db';
import { createUserData } from '@tests/factories';

describe('Auth Middleware', () => {
  let apiKeyService: ApiKeyService;
  let userRepository: UserRepository;
  let testUserId: string;
  let validApiKey: string;

  beforeAll(() => {
    apiKeyService = new ApiKeyService();
    userRepository = new UserRepository();
  });

  beforeEach(async () => {
    await setupTest();

    // Create test user and API key
    const user = await userRepository.create(
      createUserData({ email: 'auth-test@example.com' })
    );
    testUserId = user.id;

    const result = await apiKeyService.generateApiKey({
      userId: testUserId,
      name: 'Test Auth Key',
      scopes: ['invoices:read', 'invoices:write'],
    });
    validApiKey = result.apiKey;
  });

  afterEach(async () => {
    await teardownTest();
  });

  afterAll(async () => {
    await teardownAllTests();
  });

  describe('authenticate', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
      req = {
        headers: {},
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      next = jest.fn();
    });

    it('should authenticate valid API key from Authorization header', async () => {
      req.headers = {
        authorization: `Bearer ${validApiKey}`,
      };

      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.apiKey).toBeDefined();
      expect(req.user?.id).toBe(testUserId);
    });

    it('should authenticate valid API key from x-api-key header', async () => {
      req.headers = {
        'x-api-key': validApiKey,
      };

      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.apiKey).toBeDefined();
    });

    it('should return 401 when no API key provided', async () => {
      req.headers = {};

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'API key is required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when API key is invalid', async () => {
      req.headers = {
        authorization: 'Bearer sk_test_invalidkey123',
      };

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user does not exist', async () => {
      // Create API key for non-existent user (simulate deleted user)
      const deletedUser = await userRepository.create(
        createUserData({ email: 'deleted@example.com' })
      );

      const result = await apiKeyService.generateApiKey({
        userId: deletedUser.id,
        name: 'Deleted User Key',
      });

      // Soft delete the user
      await userRepository.delete(deletedUser.id);

      req.headers = {
        authorization: `Bearer ${result.apiKey}`,
      };

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'User not found',
      });
    });

    it('should handle Bearer token format correctly', async () => {
      // Test with "Bearer " prefix (with space)
      req.headers = {
        authorization: `Bearer ${validApiKey}`,
      };

      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      req.headers = {
        authorization: 'Bearer malformed-key',
      };

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireScope', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.MockedFunction<NextFunction>;

    beforeEach(async () => {
      // Setup authenticated request
      const user = await userRepository.findById(testUserId);
      const keyRecord = await apiKeyService.listApiKeys(testUserId);

      req = {
        user: user ?? undefined,
        apiKey: keyRecord[0],
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      next = jest.fn();
    });

    it('should allow request with required scope', async () => {
      const middleware = requireScope('invoices:read');

      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny request without required scope', async () => {
      const middleware = requireScope('clients:write');

      await middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when apiKey is not set', async () => {
      req.apiKey = undefined;

      const middleware = requireScope('invoices:read');

      await middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    });

    it('should allow multiple scopes (OR logic)', async () => {
      const middleware = requireScope(['invoices:read', 'invoices:write']);

      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny when none of the required scopes match', async () => {
      const middleware = requireScope(['clients:read', 'clients:write']);

      await middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
