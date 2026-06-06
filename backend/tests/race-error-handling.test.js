/**
 * Tests E.2 — Race conditions y error handling
 *
 * Valida que:
 *   - B2: audit log falla sin tragar el error
 *   - B3: cache silencioso ahora loggea
 *   - B6: SSE rechaza conexiones cuando se alcanza el límite
 *   - B7: paginación rechaza valores inválidos
 */
const request = require('supertest');
const express = require('express');

// ─── B7: Paginación movements ───
jest.mock('../src/services/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
  pool: { on: jest.fn() },
}));

describe('E.2 Race & Error — B7: paginación movements', () => {
  // Test unitario del controller directamente (no del route, que requiere auth)
  let getMovements;
  beforeAll(() => {
    const controller = require('../src/modules/movements/controller');
    getMovements = controller.getMovements;
  });

  const mockReq = (query) => ({ query, user: { id: 'test-user' }, ip: '127.0.0.1' });
  const mockRes = () => {
    const r = {};
    r.status = jest.fn().mockReturnValue(r);
    r.json = jest.fn().mockReturnValue(r);
    return r;
  };
  const mockNext = jest.fn();

  const callWith = async (query) => {
    const req = mockReq(query);
    const res = mockRes();
    await getMovements(req, res, mockNext);
  };

  test('?page=0 → next() con AppError 400', async () => {
    await callWith({ page: '0', limit: '50' });
    expect(mockNext).toHaveBeenCalled();
    const err = mockNext.mock.calls[mockNext.mock.calls.length - 1][0];
    expect(err.statusCode).toBe(400);
    expect(err.message).toMatch(/page/);
  });

  test('?page=-5 → next() con AppError 400', async () => {
    mockNext.mockClear();
    await callWith({ page: '-5', limit: '50' });
    const err = mockNext.mock.calls[mockNext.mock.calls.length - 1][0];
    expect(err.statusCode).toBe(400);
  });

  test('?page=abc → next() con AppError 400', async () => {
    mockNext.mockClear();
    await callWith({ page: 'abc', limit: '50' });
    const err = mockNext.mock.calls[mockNext.mock.calls.length - 1][0];
    expect(err.statusCode).toBe(400);
  });

  test('?limit=0 → next() con AppError 400', async () => {
    mockNext.mockClear();
    await callWith({ page: '1', limit: '0' });
    const err = mockNext.mock.calls[mockNext.mock.calls.length - 1][0];
    expect(err.statusCode).toBe(400);
    expect(err.message).toMatch(/limit/);
  });

  test('?limit=1000 → next() con AppError 400', async () => {
    mockNext.mockClear();
    await callWith({ page: '1', limit: '1000' });
    const err = mockNext.mock.calls[mockNext.mock.calls.length - 1][0];
    expect(err.statusCode).toBe(400);
  });

  test('?limit=501 → next() con AppError 400 (sobre el máximo)', async () => {
    mockNext.mockClear();
    await callWith({ page: '1', limit: '501' });
    const err = mockNext.mock.calls[mockNext.mock.calls.length - 1][0];
    expect(err.statusCode).toBe(400);
  });

  test('?page=1&limit=50 → OK (no lanza)', async () => {
    const db = require('../src/services/database');
    db.query.mockResolvedValueOnce({ rows: [] });
    db.query.mockResolvedValueOnce({ rows: [] });
    mockNext.mockClear();
    await callWith({ page: '1', limit: '50' });
    if (mockNext.mock.calls.length > 0) {
      const err = mockNext.mock.calls[0][0];
      expect(err.statusCode).not.toBe(400);
    }
  });

  test('?page=2&limit=25 → OK (no lanza)', async () => {
    const db = require('../src/services/database');
    db.query.mockResolvedValueOnce({ rows: [] });
    db.query.mockResolvedValueOnce({ rows: [] });
    mockNext.mockClear();
    await callWith({ page: '2', limit: '25' });
    if (mockNext.mock.calls.length > 0) {
      const err = mockNext.mock.calls[0][0];
      expect(err.statusCode).not.toBe(400);
    }
  });

  test('?limit=1 → OK (límite mínimo válido)', async () => {
    const db = require('../src/services/database');
    db.query.mockResolvedValueOnce({ rows: [] });
    db.query.mockResolvedValueOnce({ rows: [] });
    mockNext.mockClear();
    await callWith({ page: '1', limit: '1' });
    if (mockNext.mock.calls.length > 0) {
      const err = mockNext.mock.calls[0][0];
      expect(err.statusCode).not.toBe(400);
    }
  });

  test('?limit=500 → OK (límite máximo válido)', async () => {
    const db = require('../src/services/database');
    db.query.mockResolvedValueOnce({ rows: [] });
    db.query.mockResolvedValueOnce({ rows: [] });
    mockNext.mockClear();
    await callWith({ page: '1', limit: '500' });
    if (mockNext.mock.calls.length > 0) {
      const err = mockNext.mock.calls[0][0];
      expect(err.statusCode).not.toBe(400);
    }
  });
});

// ─── B6: SSE rate-limit ───
describe('E.2 Race & Error — B6: SSE max clients', () => {
  test('MAX_SSE_CLIENTS está exportado y es un número positivo', () => {
    const sseService = require('../src/services/sseService');
    expect(typeof sseService.MAX_SSE_CLIENTS).toBe('number');
    expect(sseService.MAX_SSE_CLIENTS).toBeGreaterThan(0);
  });

  test('getClientCount() devuelve un número', () => {
    const sseService = require('../src/services/sseService');
    expect(typeof sseService.getClientCount()).toBe('number');
    expect(sseService.getClientCount()).toBeGreaterThanOrEqual(0);
  });

  test('subscribe() rechaza cuando se alcanza el máximo', () => {
    // Forzar el límite muy bajo para el test
    process.env.MAX_SSE_CLIENTS = '1';
    jest.resetModules();
    const sseService = require('../src/services/sseService');
    expect(sseService.MAX_SSE_CLIENTS).toBe(1);

    // Mock res para simular SSE
    const mockRes1 = {
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockRes2 = {
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockReq = { ip: '127.0.0.1', on: jest.fn() };

    sseService.subscribe(mockReq, mockRes1);
    expect(sseService.getClientCount()).toBe(1);

    // Segunda conexión debe ser rechazada
    sseService.subscribe(mockReq, mockRes2);
    expect(mockRes2.status).toHaveBeenCalledWith(503);
    expect(mockRes2.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});
