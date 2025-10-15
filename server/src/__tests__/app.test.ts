import request from 'supertest';
import app from '../index';

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Auth service is healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Auth service is healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('cpu');
      expect(response.body).toHaveProperty('pid');
      expect(response.body).toHaveProperty('platform');
      expect(response.body).toHaveProperty('nodeVersion');
    });
  });
});

describe('Auth Routes', () => {
  describe('GET /api/auth', () => {
    it('should return auth routes message', async () => {
      const response = await request(app)
        .get('/api/auth')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Auth routes - coming soon!');
    });
  });
});

describe('Error Handling', () => {
  describe('GET /nonexistent', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Route /nonexistent not found');
    });
  });
});


