/**
 * Integration tests for Health Check endpoints
 */

import request from 'supertest';
import { app } from '@/app';
import { setupTest, teardownTest, teardownAllTests } from '@tests/db';

describe('Health Check Endpoints', () => {
  beforeEach(async () => {
    await setupTest();
  });

  afterEach(async () => {
    await teardownTest();
  });

  afterAll(async () => {
    await teardownAllTests();
  });

  describe('GET /health', () => {
    it('should return 200 and basic health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('service', 'arca-api');
    });
  });

  describe('GET /health/database', () => {
    it('should return 200 when database is healthy', async () => {
      const response = await request(app).get('/health/database');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('database', 'connected');
    });
  });

  describe('GET /', () => {
    it('should return API info', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'ARCA API');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('description');
    });
  });

  describe('GET /unknown-route', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });
});
