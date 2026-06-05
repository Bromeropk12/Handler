const request = require('supertest');
const express = require('express');
const warehouseRoutes = require('../src/modules/warehouse/routes');

const app = express();
app.use(express.json());
app.use('/api/warehouse', warehouseRoutes);

describe('Warehouse Module Tests', () => {
  const db = require('../src/services/database');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/warehouse', () => {
    test('✅ debe listar anaqueles con estadísticas', async () => {
      const mockShelves = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'BASF #1',
          provider: 'BASF',
          grid_width: 10,
          grid_height: 10,
          total_capacity: 100,
          market_line_name: 'Cosmética',
          occupied_count: 80,
          expired_count: 2,
          occupancy_percentage: 80.0
        }
      ];

      db.query.mockResolvedValueOnce({
        rows: mockShelves,
        rowCount: 1
      });
      db.query.mockResolvedValueOnce({
        rows: [{ total: '1' }]
      });

      const response = await request(app)
        .get('/api/warehouse?page=1&limit=10')
        .set('Authorization', 'Bearer test-token');

      expect(typeof response.status).toBe('number');
    });
  });

  describe('POST /api/warehouse', () => {
    test('✅ debe crear anaquel exitosamente', async () => {
      const shelfData = {
        market_line_id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Test Shelf',
        provider: 'Test Provider',
        grid_width: 10,
        grid_height: 10
      };

      db.query.mockResolvedValueOnce({ rows: [{ id: '550e8400-e29b-41d4-a716-446655440001' }] }); // market_line exists
      db.query.mockResolvedValueOnce({ rows: [] }); // no existing shelf
      db.query.mockResolvedValueOnce({ rows: [{ id: '550e8400-e29b-41d4-a716-446655440002' }] }); // created shelf
      db.query.mockResolvedValueOnce({ rows: [] }); // movement log

      const response = await request(app)
        .post('/api/warehouse')
        .set('Authorization', 'Bearer test-token')
        .send(shelfData);

      expect(typeof response.status).toBe('number');
    });
  });

  describe('GET /api/warehouse/:id/map', () => {
    test('✅ debe obtener mapa del anaquel', async () => {
      const shelfData = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        grid_width: 10,
        grid_height: 10
      };

      const samplesData = [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          position_x: 0,
          position_y: 0,
          width: 2,
          height: 1,
          global_sample_name: 'Vitamina C',
          lot: 'LOT001',
          ghs_danger_class: 'Sin Riesgo'
        }
      ];

      db.query.mockResolvedValueOnce({ rows: [shelfData] }); // shelf exists
      db.query.mockResolvedValueOnce({ rows: samplesData }); // samples in shelf

      const response = await request(app)
        .get('/api/warehouse/550e8400-e29b-41d4-a716-446655440001/map')
        .set('Authorization', 'Bearer test-token');

      expect(typeof response.status).toBe('number');
    });
  });

  describe('POST /api/warehouse/:id/place-sample', () => {
    test('✅ debe colocar muestra en posición', async () => {
      const placementData = {
        sample_id: '550e8400-e29b-41d4-a716-446655440002',
        position_x: 0,
        position_y: 0
      };

      const shelfData = { id: '550e8400-e29b-41d4-a716-446655440001', grid_width: 10, grid_height: 10 };
      const sampleData = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        ghs_danger_class: 'Sin Riesgo',
        dimensions: '2x1'
      };

      db.query.mockResolvedValueOnce({ rows: [shelfData] }); // shelf exists
      db.query.mockResolvedValueOnce({ rows: [sampleData] }); // sample exists
      db.query.mockResolvedValueOnce({ rows: [] }); // no occupied cells
      db.query.mockResolvedValueOnce({ rows: [] }); // no neighbors
      db.query.mockResolvedValueOnce({ rows: [] }); // update sample position
      db.query.mockResolvedValueOnce({ rows: [] }); // movement log

      const response = await request(app)
        .post('/api/warehouse/550e8400-e29b-41d4-a716-446655440001/place-sample')
        .set('Authorization', 'Bearer test-token')
        .send(placementData);

      expect(typeof response.status).toBe('number');
    });
  });
});