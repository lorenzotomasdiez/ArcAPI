/**
 * Unit tests for ApiKeyService
 * Following TDD approach - tests written first
 */

import { ApiKeyService } from '@/services/api-key.service';
import { UserRepository } from '@/repositories/user.repository';
import { setupTest, teardownTest, teardownAllTests } from '@tests/db';
import { createUserData } from '@tests/factories';

describe('ApiKeyService', () => {
  let service: ApiKeyService;
  let userRepository: UserRepository;
  let testUserId: string;

  beforeAll(() => {
    service = new ApiKeyService();
    userRepository = new UserRepository();
  });

  beforeEach(async () => {
    await setupTest();

    // Create a test user
    const user = await userRepository.create(
      createUserData({ email: 'apikey-test@example.com' })
    );
    testUserId = user.id;
  });

  afterEach(async () => {
    await teardownTest();
  });

  afterAll(async () => {
    await teardownAllTests();
  });

  describe('generateApiKey', () => {
    it('should generate a valid API key with correct prefix', async () => {
      const { apiKey, keyRecord } = await service.generateApiKey({
        userId: testUserId,
        name: 'Test API Key',
        prefix: 'sk_test_',
        scopes: ['invoices:read', 'invoices:write'],
      });

      // API key should start with prefix
      expect(apiKey).toMatch(/^sk_test_/);

      // API key should have sufficient length (prefix + random string)
      expect(apiKey.length).toBeGreaterThan(32);

      // Key record should be saved
      expect(keyRecord).toHaveProperty('id');
      expect(keyRecord.userId).toBe(testUserId);
      expect(keyRecord.name).toBe('Test API Key');
      expect(keyRecord.keyPrefix).toBe('sk_test_');
      expect(keyRecord.scopes).toEqual(['invoices:read', 'invoices:write']);
      expect(keyRecord.isActive).toBe(true);

      // keyHash should be different from the plain key
      expect(keyRecord.keyHash).not.toBe(apiKey);
      expect(keyRecord.keyHash.length).toBeGreaterThan(0);
    });

    it('should generate unique API keys', async () => {
      const result1 = await service.generateApiKey({
        userId: testUserId,
        name: 'Key 1',
      });

      const result2 = await service.generateApiKey({
        userId: testUserId,
        name: 'Key 2',
      });

      expect(result1.apiKey).not.toBe(result2.apiKey);
      expect(result1.keyRecord.keyHash).not.toBe(result2.keyRecord.keyHash);
    });

    it('should use default values when not provided', async () => {
      const { keyRecord } = await service.generateApiKey({
        userId: testUserId,
        name: 'Default Test Key',
      });

      expect(keyRecord.keyPrefix).toBe('sk_live_');
      expect(keyRecord.scopes).toEqual([]);
      expect(keyRecord.rateLimit).toBe(100);
      expect(keyRecord.isActive).toBe(true);
    });

    it('should accept custom rate limit', async () => {
      const { keyRecord } = await service.generateApiKey({
        userId: testUserId,
        name: 'Custom Rate Key',
        rateLimit: 1000,
      });

      expect(keyRecord.rateLimit).toBe(1000);
    });

    it('should accept expiration date', async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const { keyRecord } = await service.generateApiKey({
        userId: testUserId,
        name: 'Expiring Key',
        expiresAt,
      });

      expect(keyRecord.expiresAt).toEqual(expiresAt);
    });
  });

  describe('validateApiKey', () => {
    it('should validate correct API key', async () => {
      const { apiKey } = await service.generateApiKey({
        userId: testUserId,
        name: 'Validation Test Key',
      });

      const result = await service.validateApiKey(apiKey);

      expect(result).not.toBeNull();
      expect(result?.userId).toBe(testUserId);
      expect(result?.name).toBe('Validation Test Key');
      expect(result?.isActive).toBe(true);
    });

    it('should return null for invalid API key', async () => {
      const result = await service.validateApiKey('sk_test_invalidkey123');

      expect(result).toBeNull();
    });

    it('should return null for inactive API key', async () => {
      const { apiKey, keyRecord } = await service.generateApiKey({
        userId: testUserId,
        name: 'Inactive Key',
      });

      // Deactivate the key
      await service.revokeApiKey(keyRecord.id);

      const result = await service.validateApiKey(apiKey);

      expect(result).toBeNull();
    });

    it('should return null for expired API key', async () => {
      const expiresAt = new Date(Date.now() - 1000); // Expired 1 second ago

      const { apiKey } = await service.generateApiKey({
        userId: testUserId,
        name: 'Expired Key',
        expiresAt,
      });

      const result = await service.validateApiKey(apiKey);

      expect(result).toBeNull();
    });

    it('should update lastUsedAt timestamp', async () => {
      const { apiKey, keyRecord } = await service.generateApiKey({
        userId: testUserId,
        name: 'Usage Track Key',
      });

      expect(keyRecord.lastUsedAt).toBeNull();

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      await service.validateApiKey(apiKey);

      // Re-fetch to check lastUsedAt was updated
      const updatedKey = await service.getApiKeyById(keyRecord.id);

      expect(updatedKey?.lastUsedAt).toBeInstanceOf(Date);
      expect(updatedKey?.lastUsedAt?.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('listApiKeys', () => {
    it('should list all API keys for a user', async () => {
      await service.generateApiKey({ userId: testUserId, name: 'Key 1' });
      await service.generateApiKey({ userId: testUserId, name: 'Key 2' });
      await service.generateApiKey({ userId: testUserId, name: 'Key 3' });

      const keys = await service.listApiKeys(testUserId);

      expect(keys).toHaveLength(3);
      expect(keys[0]?.name).toBe('Key 3'); // Most recent first
    });

    it('should only list active keys when specified', async () => {
      const { keyRecord: key1 } = await service.generateApiKey({
        userId: testUserId,
        name: 'Active Key',
      });
      const { keyRecord: key2 } = await service.generateApiKey({
        userId: testUserId,
        name: 'Inactive Key',
      });

      await service.revokeApiKey(key2.id);

      const activeKeys = await service.listApiKeys(testUserId, { activeOnly: true });

      expect(activeKeys).toHaveLength(1);
      expect(activeKeys[0]?.id).toBe(key1.id);
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke (deactivate) an API key', async () => {
      const { keyRecord } = await service.generateApiKey({
        userId: testUserId,
        name: 'To Be Revoked',
      });

      expect(keyRecord.isActive).toBe(true);

      await service.revokeApiKey(keyRecord.id);

      const revokedKey = await service.getApiKeyById(keyRecord.id);

      expect(revokedKey?.isActive).toBe(false);
    });

    it('should throw error when revoking non-existent key', async () => {
      await expect(service.revokeApiKey('non-existent-id')).rejects.toThrow();
    });
  });

  describe('deleteApiKey', () => {
    it('should permanently delete an API key', async () => {
      const { keyRecord } = await service.generateApiKey({
        userId: testUserId,
        name: 'To Be Deleted',
      });

      await service.deleteApiKey(keyRecord.id);

      const deletedKey = await service.getApiKeyById(keyRecord.id);

      expect(deletedKey).toBeNull();
    });

    it('should throw error when deleting non-existent key', async () => {
      await expect(service.deleteApiKey('non-existent-id')).rejects.toThrow();
    });
  });

  describe('updateApiKey', () => {
    it('should update API key properties', async () => {
      const { keyRecord } = await service.generateApiKey({
        userId: testUserId,
        name: 'Original Name',
        scopes: ['invoices:read'],
      });

      const updatedKey = await service.updateApiKey(keyRecord.id, {
        name: 'Updated Name',
        scopes: ['invoices:read', 'invoices:write'],
        rateLimit: 500,
      });

      expect(updatedKey.name).toBe('Updated Name');
      expect(updatedKey.scopes).toEqual(['invoices:read', 'invoices:write']);
      expect(updatedKey.rateLimit).toBe(500);
    });
  });

  describe('hasScope', () => {
    it('should check if API key has required scope', async () => {
      const { keyRecord } = await service.generateApiKey({
        userId: testUserId,
        name: 'Scoped Key',
        scopes: ['invoices:read', 'invoices:write', 'clients:read'],
      });

      expect(service.hasScope(keyRecord, 'invoices:read')).toBe(true);
      expect(service.hasScope(keyRecord, 'invoices:write')).toBe(true);
      expect(service.hasScope(keyRecord, 'clients:read')).toBe(true);
      expect(service.hasScope(keyRecord, 'clients:write')).toBe(false);
    });

    it('should return false when key has no scopes', async () => {
      const { keyRecord } = await service.generateApiKey({
        userId: testUserId,
        name: 'No Scopes Key',
        scopes: [],
      });

      expect(service.hasScope(keyRecord, 'invoices:read')).toBe(false);
    });
  });
});
