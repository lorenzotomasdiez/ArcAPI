/**
 * Unit tests for UserRepository
 * Following TDD approach - tests written first
 */

import { UserRepository } from '@/repositories/user.repository';
import { UserTier, UserStatus } from '@prisma/client';
import { setupTest, teardownTest, teardownAllTests, getPrismaTestClient } from '@tests/db';
import { createUserData } from '@tests/factories';

describe('UserRepository', () => {
  let repository: UserRepository;

  beforeAll(() => {
    repository = new UserRepository();
  });

  beforeEach(async () => {
    await setupTest();
  });

  afterEach(async () => {
    await teardownTest();
  });

  afterAll(async () => {
    await teardownAllTests();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = createUserData({
        email: 'test@example.com',
        name: 'Test User',
      });

      const user = await repository.create(userData);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.tier).toBe(UserTier.FREE);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error when creating user with duplicate email', async () => {
      const userData = createUserData({ email: 'duplicate@example.com' });

      await repository.create(userData);

      await expect(repository.create(userData)).rejects.toThrow();
    });

    it('should create user with custom tier', async () => {
      const userData = createUserData({
        email: 'pro@example.com',
        tier: UserTier.PRO,
      });

      const user = await repository.create(userData);

      expect(user.tier).toBe(UserTier.PRO);
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const userData = createUserData({ email: 'find@example.com' });
      const createdUser = await repository.create(userData);

      const foundUser = await repository.findById(createdUser.id);

      expect(foundUser).not.toBeNull();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe('find@example.com');
    });

    it('should return null when user not found', async () => {
      const user = await repository.findById('non-existent-id');

      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData = createUserData({ email: 'unique@example.com' });
      await repository.create(userData);

      const user = await repository.findByEmail('unique@example.com');

      expect(user).not.toBeNull();
      expect(user?.email).toBe('unique@example.com');
    });

    it('should return null when email not found', async () => {
      const user = await repository.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });

    it('should be case-insensitive', async () => {
      const userData = createUserData({ email: 'CaseSensitive@example.com' });
      await repository.create(userData);

      const user = await repository.findByEmail('casesensitive@example.com');

      expect(user).not.toBeNull();
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const userData = createUserData({ email: 'update@example.com' });
      const user = await repository.create(userData);

      const updatedUser = await repository.update(user.id, {
        name: 'Updated Name',
        company: 'Updated Company',
      });

      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.company).toBe('Updated Company');
      expect(updatedUser.email).toBe('update@example.com'); // Unchanged
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime());
    });

    it('should update user tier', async () => {
      const userData = createUserData({ email: 'tier@example.com' });
      const user = await repository.create(userData);

      const updatedUser = await repository.update(user.id, {
        tier: UserTier.ENTERPRISE,
      });

      expect(updatedUser.tier).toBe(UserTier.ENTERPRISE);
    });

    it('should throw error when updating non-existent user', async () => {
      await expect(
        repository.update('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should soft delete user by setting status to DELETED', async () => {
      const userData = createUserData({ email: 'delete@example.com' });
      const user = await repository.create(userData);

      await repository.delete(user.id);

      const deletedUser = await repository.findById(user.id);
      expect(deletedUser?.status).toBe(UserStatus.DELETED);
    });

    it('should throw error when deleting non-existent user', async () => {
      await expect(repository.delete('non-existent-id')).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should list all users with pagination', async () => {
      // Create 5 users
      for (let i = 0; i < 5; i++) {
        await repository.create(createUserData({ email: `user${i}@example.com` }));
      }

      const result = await repository.list({ page: 1, limit: 3 });

      expect(result.users).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(2);
    });

    it('should filter users by status', async () => {
      const user1 = await repository.create(createUserData({ email: 'active@example.com' }));
      const user2 = await repository.create(createUserData({ email: 'suspended@example.com' }));

      await repository.update(user2.id, { status: UserStatus.SUSPENDED });

      const result = await repository.list({ status: UserStatus.ACTIVE });

      expect(result.users).toHaveLength(1);
      expect(result.users[0]?.email).toBe('active@example.com');
    });

    it('should filter users by tier', async () => {
      await repository.create(createUserData({ email: 'free@example.com', tier: UserTier.FREE }));
      await repository.create(createUserData({ email: 'pro@example.com', tier: UserTier.PRO }));

      const result = await repository.list({ tier: UserTier.PRO });

      expect(result.users).toHaveLength(1);
      expect(result.users[0]?.tier).toBe(UserTier.PRO);
    });
  });

  describe('updateLastLogin', () => {
    it('should update lastLoginAt timestamp', async () => {
      const userData = createUserData({ email: 'login@example.com' });
      const user = await repository.create(userData);

      expect(user.lastLoginAt).toBeNull();

      const updatedUser = await repository.updateLastLogin(user.id);

      expect(updatedUser.lastLoginAt).toBeInstanceOf(Date);
      expect(updatedUser.lastLoginAt?.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('count', () => {
    it('should count total users', async () => {
      await repository.create(createUserData({ email: 'count1@example.com' }));
      await repository.create(createUserData({ email: 'count2@example.com' }));
      await repository.create(createUserData({ email: 'count3@example.com' }));

      const count = await repository.count();

      expect(count).toBe(3);
    });

    it('should count users by status', async () => {
      const user1 = await repository.create(createUserData({ email: 'count-active@example.com' }));
      const user2 = await repository.create(createUserData({ email: 'count-suspended@example.com' }));

      await repository.update(user2.id, { status: UserStatus.SUSPENDED });

      const activeCount = await repository.count({ status: UserStatus.ACTIVE });
      const suspendedCount = await repository.count({ status: UserStatus.SUSPENDED });

      expect(activeCount).toBe(1);
      expect(suspendedCount).toBe(1);
    });
  });
});
