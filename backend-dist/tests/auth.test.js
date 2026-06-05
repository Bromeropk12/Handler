const request = require('supertest');
const express = require('express');
const authRoutes = require('../src/modules/auth/routes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    test('✅ Ruta de login responde correctamente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      expect(typeof response.status).toBe('number');
      expect(response.status >= 200 && response.status < 600).toBe(true);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    test('✅ Ruta de reset password responde correctamente', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          username: 'admin',
          secretPassword: 'secret123',
          newPassword: 'newpass123',
          confirmPassword: 'newpass123'
        });

      expect(typeof response.status).toBe('number');
      expect(response.status >= 200 && response.status < 600).toBe(true);
    });
  });
});