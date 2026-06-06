/**
 * Tests de seguridad E.1 — Backup SQL injection (H5)
 *
 * Valida que el controller de backup filtra columnas inválidas del JSON
 * del cliente. Un backup manipulado con keys tipo
 * `"; DROP TABLE users; --` debe ser rechazado / descartado.
 */
const path = require('path');
const { getValidColumns } = require('../src/modules/backup/controller');

// Mock de database
jest.mock('../src/services/database', () => {
  const mClient = {
    query: jest.fn(),
  };
  return {
    query: jest.fn(),
    transaction: jest.fn(async (fn) => fn(mClient)),
    pool: mClient,
    _mClient: mClient,
  };
});

const db = require('../src/services/database');

describe('E.1 Security — Backup SQL injection (H5)', () => {
  let mClient;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Re-require después de resetModules
    const freshDb = require('../src/services/database');
    mClient = freshDb._mClient;
    Object.assign(db, freshDb);
  });

  test('getValidColumns filtra keys que no son columnas reales', async () => {
    const freshController = require('../src/modules/backup/controller');
    const maliciousRow = {
      id: 'real-uuid',
      name: 'legit',
      '"; DROP TABLE users; --': 'injection',
      'isAdmin; --': 'injection',
      '<script>alert(1)</script>': 'xss',
    };
    mClient.query.mockResolvedValueOnce({
      rows: [
        { column_name: 'id' },
        { column_name: 'name' },
        { column_name: 'created_at' },
      ],
    });
    const validCols = await freshController.getValidColumns(mClient, 'global_samples');
    const filteredKeys = Object.keys(maliciousRow).filter(k => validCols.has(k));
    expect(filteredKeys).toEqual(['id', 'name']);
    expect(filteredKeys).not.toContain('"; DROP TABLE users; --');
  });

  test('whitelist cacheada entre llamadas (no re-query)', async () => {
    const freshController = require('../src/modules/backup/controller');
    mClient.query.mockResolvedValueOnce({
      rows: [{ column_name: 'id' }],
    });
    await freshController.getValidColumns(mClient, 'users');
    const callCount1 = mClient.query.mock.calls.length;
    await freshController.getValidColumns(mClient, 'users');
    const callCount2 = mClient.query.mock.calls.length;
    expect(callCount2).toBe(callCount1); // No re-query
  });

  test('whitelist es independiente por tabla', async () => {
    const freshController = require('../src/modules/backup/controller');
    mClient.query.mockResolvedValueOnce({
      rows: [{ column_name: 'id' }, { column_name: 'username' }],
    });
    const userCols = await freshController.getValidColumns(mClient, 'users');
    mClient.query.mockResolvedValueOnce({
      rows: [{ column_name: 'id' }, { column_name: 'name' }],
    });
    const sampleCols = await freshController.getValidColumns(mClient, 'global_samples');
    expect(userCols.has('username')).toBe(true);
    expect(sampleCols.has('username')).toBe(false);
    expect(sampleCols.has('name')).toBe(true);
  });
});
