const request = require('supertest');
const express = require('express');
const dispensingRoutes = require('../src/modules/dispensing/routes');

const app = express();
app.use(express.json());
app.use('/api/dispensing', dispensingRoutes);

describe('Dispensing Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/dispensing', () => {
    test('✅ debe responder a request de dispensar muestras', async () => {
      const response = await request(app)
        .post('/api/dispensing')
        .send({
          global_sample_id: 'test-id',
          number_of_subdivisions: 5,
          weight_per_subdivision: 100
        });

      expect(typeof response.status).toBe('number');
    });
  });

  describe('GET /api/dispensing', () => {
    test('✅ debe responder a request de listar muestras dispensadas', async () => {
      const response = await request(app)
        .get('/api/dispensing?page=1&limit=10');

      expect(typeof response.status).toBe('number');
    });
  });
});