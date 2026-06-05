/**
 * Tests unitarios para commitGroupMove (drag-en-grupo transaccional)
 *
 * Valida:
 *  - Atomicidad: si UN move falla, NINGÚN UPDATE se aplica (ROLLBACK).
 *  - batch_id compartido por todos los movements.
 *  - Concurrencia: si una muestra cambió de status/posición, 409.
 *  - Validación de tipos/estado/anaquel (defense in depth).
 *
 * @see Plan_movimientos.md §4 (Módulo A.2.3)
 */

const groupOps = require('../src/modules/warehouse/group-operations');

const SHELF_ID = '00000000-0000-0000-0000-000000000001';
const TARGET_SHELF_ID = '00000000-0000-0000-0000-000000000002';
const SAMPLE_ID_1 = '00000000-0000-0000-0000-0000000000a1';
const SAMPLE_ID_2 = '00000000-0000-0000-0000-0000000000a2';
const SAMPLE_ID_3 = '00000000-0000-0000-0000-0000000000a3';

function createDbMock() {
  const clientQuery = jest.fn();
  const client = {
    query: clientQuery,
    release: jest.fn(),
  };
  return {
    query: jest.fn(),
    pool: {
      connect: jest.fn().mockResolvedValue(client),
    },
    _clientQuery: clientQuery,
    _client: client,
  };
}

const baseShelf = {
  id: SHELF_ID, name: 'Shelf 1',
  grid_width: 10, grid_height: 10, shelf_depth: 10,
  market_line_id: '00000000-0000-0000-0000-0000000000f1',
};

function threeStoredSamples() {
  return [
    {
      id: SAMPLE_ID_1, global_sample_id: 'g1', shelf_id: SHELF_ID,
      position_x: 0, position_y: 0, position_z: 0,
      width: 1, height: 1, depth: 1, status: 'stored',
      global_sample_name: 'Acetone', lot: 'L1', ghs_danger_class: 'Sin Riesgo',
    },
    {
      id: SAMPLE_ID_2, global_sample_id: 'g1', shelf_id: SHELF_ID,
      position_x: 1, position_y: 0, position_z: 0,
      width: 1, height: 1, depth: 1, status: 'stored',
      global_sample_name: 'Acetone', lot: 'L1', ghs_danger_class: 'Sin Riesgo',
    },
    {
      id: SAMPLE_ID_3, global_sample_id: 'g1', shelf_id: SHELF_ID,
      position_x: 2, position_y: 0, position_z: 0,
      width: 1, height: 1, depth: 1, status: 'stored',
      global_sample_name: 'Acetone', lot: 'L1', ghs_danger_class: 'Sin Riesgo',
    },
  ];
}

describe('commitGroupMove', () => {
  test('commit exitoso: 3 muestras se mueven + log con mismo batch_id', async () => {
    const db = createDbMock();
    db.query.mockResolvedValueOnce({ rows: threeStoredSamples() });

    // BEGIN
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // Por cada move (3): SELECT shelf, externas, SGA, UPDATE, INSERT movement (5 client calls/move)
    for (let i = 0; i < 3; i++) {
      db._clientQuery.mockResolvedValueOnce({ rows: [baseShelf], rowCount: 1 });
      db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });   // externas
      db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });   // SGA
      db._clientQuery.mockResolvedValueOnce({ rows: [{ id: `upd-${i}` }], rowCount: 1 });
      db._clientQuery.mockResolvedValueOnce({ rows: [{ id: `mov-${i}` }] });
    }
    // COMMIT
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const result = await groupOps.commitGroupMove({
      sourceShelfId: SHELF_ID,
      targetShelfId: TARGET_SHELF_ID,
      sampleMoves: [
        { sample_id: SAMPLE_ID_1, new_position_x: 5, new_position_y: 0, new_position_z: 0 },
        { sample_id: SAMPLE_ID_2, new_position_x: 6, new_position_y: 0, new_position_z: 0 },
        { sample_id: SAMPLE_ID_3, new_position_x: 7, new_position_y: 0, new_position_z: 0 },
      ],
      userId: 'user-1',
      db,
    });

    expect(result.moved).toHaveLength(3);
    expect(result.movements).toBe(3);
    expect(result.batchId).toMatch(/^[0-9a-f-]{36}$/i);

    const calls = db._clientQuery.mock.calls.map((c) => c[0]);
    expect(calls[0]).toBe('BEGIN');
    expect(calls[calls.length - 1]).toBe('COMMIT');
    expect(calls).not.toContain('ROLLBACK');

    const insertCalls = db._clientQuery.mock.calls.filter(
      (c) => c[0] && c[0].includes('INSERT INTO movements')
    );
    expect(insertCalls.length).toBeGreaterThanOrEqual(3);
    const batchIds = insertCalls.map((c) => c[1][4]);
    const uniqueBatchIds = new Set(batchIds);
    expect(uniqueBatchIds.size).toBe(1);
    expect([...uniqueBatchIds][0]).toBe(result.batchId);
  });

  test('commit falla en move 2 de 3: ROLLBACK total, ningún UPDATE aplicado', async () => {
    const db = createDbMock();
    db.query.mockResolvedValueOnce({ rows: threeStoredSamples() });

    // BEGIN
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // Move 1: OK (5 calls)
    db._clientQuery.mockResolvedValueOnce({ rows: [baseShelf], rowCount: 1 });
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    db._clientQuery.mockResolvedValueOnce({ rows: [{ id: 'upd-1' }], rowCount: 1 });
    db._clientQuery.mockResolvedValueOnce({ rows: [{ id: 'mov-1' }] });
    // Move 2: FALLA en UPDATE (rowCount 0 → 409) (5 calls: SELECT shelf, externas, SGA, UPDATE, [ROLLBACK])
    db._clientQuery.mockResolvedValueOnce({ rows: [baseShelf], rowCount: 1 });
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // UPDATE rowCount 0
    // ROLLBACK
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await expect(
      groupOps.commitGroupMove({
        sourceShelfId: SHELF_ID,
        targetShelfId: TARGET_SHELF_ID,
        sampleMoves: [
          { sample_id: SAMPLE_ID_1, new_position_x: 5, new_position_y: 0, new_position_z: 0 },
          { sample_id: SAMPLE_ID_2, new_position_x: 6, new_position_y: 0, new_position_z: 0 },
          { sample_id: SAMPLE_ID_3, new_position_x: 7, new_position_y: 0, new_position_z: 0 },
        ],
        userId: 'user-1',
        db,
      })
    ).rejects.toMatchObject({ statusCode: 409 });

    const calls = db._clientQuery.mock.calls.map((c) => c[0]);
    expect(calls).toContain('ROLLBACK');
    expect(calls).not.toContain('COMMIT');
    expect(db._client.release).toHaveBeenCalled();
  });

  test('commit con status cambiado por otro user: retorna 409 con detalles', async () => {
    const db = createDbMock();
    db.query.mockResolvedValueOnce({ rows: threeStoredSamples() });

    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // BEGIN
    // Move 1: SELECT shelf, externas, SGA, UPDATE rowCount=0 → 409
    db._clientQuery.mockResolvedValueOnce({ rows: [baseShelf], rowCount: 1 });
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // ROLLBACK
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await expect(
      groupOps.commitGroupMove({
        sourceShelfId: SHELF_ID,
        targetShelfId: TARGET_SHELF_ID,
        sampleMoves: [
          { sample_id: SAMPLE_ID_1, new_position_x: 5, new_position_y: 0, new_position_z: 0 },
          { sample_id: SAMPLE_ID_2, new_position_x: 6, new_position_y: 0, new_position_z: 0 },
          { sample_id: SAMPLE_ID_3, new_position_x: 7, new_position_y: 0, new_position_z: 0 },
        ],
        userId: 'user-1',
        db,
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringMatching(/ya no está/i),
    });
  });

  test('commit con sample ya no en shelf origen: retorna 404', async () => {
    const db = createDbMock();
    db.query.mockResolvedValueOnce({
      rows: [{
        id: SAMPLE_ID_1, global_sample_id: 'g1', shelf_id: SHELF_ID,
        position_x: 0, position_y: 0, position_z: 0,
        width: 1, height: 1, depth: 1, status: 'stored',
        global_sample_name: 'X', lot: 'L1', ghs_danger_class: 'Sin Riesgo',
      }],
    });

    await expect(
      groupOps.commitGroupMove({
        sourceShelfId: SHELF_ID,
        targetShelfId: TARGET_SHELF_ID,
        sampleMoves: [
          { sample_id: SAMPLE_ID_1, new_position_x: 5, new_position_y: 0, new_position_z: 0 },
          { sample_id: SAMPLE_ID_2, new_position_x: 6, new_position_y: 0, new_position_z: 0 },
          { sample_id: SAMPLE_ID_3, new_position_x: 7, new_position_y: 0, new_position_z: 0 },
        ],
        userId: 'user-1',
        db,
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test('movements log se inserta DENTRO de la transacción (mismo client)', async () => {
    const db = createDbMock();
    db.query.mockResolvedValueOnce({ rows: threeStoredSamples() });

    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // BEGIN
    // 3 moves × 5 calls = 15 calls
    for (let i = 0; i < 3; i++) {
      db._clientQuery.mockResolvedValueOnce({ rows: [baseShelf], rowCount: 1 });
      db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      db._clientQuery.mockResolvedValueOnce({ rows: [{ id: `upd-${i}` }], rowCount: 1 });
      db._clientQuery.mockResolvedValueOnce({ rows: [{ id: `mov-${i}` }] });
    }
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

    await groupOps.commitGroupMove({
      sourceShelfId: SHELF_ID,
      targetShelfId: TARGET_SHELF_ID,
      sampleMoves: [
        { sample_id: SAMPLE_ID_1, new_position_x: 5, new_position_y: 0, new_position_z: 0 },
        { sample_id: SAMPLE_ID_2, new_position_x: 6, new_position_y: 0, new_position_z: 0 },
        { sample_id: SAMPLE_ID_3, new_position_x: 7, new_position_y: 0, new_position_z: 0 },
      ],
      userId: 'user-1',
      db,
    });

    const calls = db._clientQuery.mock.calls.map((c) => c[0]);
    const beginIdx = calls.indexOf('BEGIN');
    const commitIdx = calls.indexOf('COMMIT');
    const insertIdx = calls.findIndex((c) => c && c.includes('INSERT INTO movements'));
    expect(beginIdx).toBeGreaterThanOrEqual(0);
    expect(commitIdx).toBeGreaterThan(beginIdx);
    expect(insertIdx).toBeGreaterThan(beginIdx);
    expect(insertIdx).toBeLessThan(commitIdx);
  });

  test('commit concurrente: muestra en OTRO shelf → 409', async () => {
    const db = createDbMock();
    db.query.mockResolvedValueOnce({
      rows: [{
        id: SAMPLE_ID_1, global_sample_id: 'g1', shelf_id: 'OTHER-SHELF',
        position_x: 0, position_y: 0, position_z: 0,
        width: 1, height: 1, depth: 1, status: 'stored',
        global_sample_name: 'X', lot: 'L1', ghs_danger_class: 'Sin Riesgo',
      }],
    });

    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // BEGIN
    // Move 1: SELECT shelf, externas, SGA, UPDATE rowCount=0 → 409
    db._clientQuery.mockResolvedValueOnce({ rows: [baseShelf], rowCount: 1 });
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    // ROLLBACK
    db._clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await expect(
      groupOps.commitGroupMove({
        sourceShelfId: SHELF_ID,
        targetShelfId: TARGET_SHELF_ID,
        sampleMoves: [
          { sample_id: SAMPLE_ID_1, new_position_x: 5, new_position_y: 0, new_position_z: 0 },
        ],
        userId: 'user-1',
        db,
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test('rechaza moves vacío con 400', async () => {
    const db = createDbMock();
    await expect(
      groupOps.commitGroupMove({
        sourceShelfId: SHELF_ID,
        targetShelfId: TARGET_SHELF_ID,
        sampleMoves: [],
        userId: 'user-1',
        db,
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('rechaza > MAX_GROUP_SIZE moves con 400', async () => {
    const db = createDbMock();
    const tooMany = Array.from({ length: 11 }, (_, i) => ({
      sample_id: `id-${i}`, new_position_x: 0, new_position_y: 0, new_position_z: 0,
    }));
    await expect(
      groupOps.commitGroupMove({
        sourceShelfId: SHELF_ID,
        targetShelfId: TARGET_SHELF_ID,
        sampleMoves: tooMany,
        userId: 'user-1',
        db,
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
