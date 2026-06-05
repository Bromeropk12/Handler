/**
 * Tests unitarios para previewGroupPlacement (drag-en-grupo)
 *
 * Mockeamos la DB directamente (no HTTP). Estos tests validan la
 * lógica de previsualización: tipos, dimensiones, SGA, colisiones,
 * cross-shelf y shape del grupo.
 *
 * @see Plan_movimientos.md §4 (Módulo A.2.2)
 */

const groupOps = require('../src/modules/warehouse/group-operations');

const SHELF_ID = '00000000-0000-0000-0000-000000000001';
const TARGET_SHELF_ID = '00000000-0000-0000-0000-000000000002';
const SAMPLE_ID_1 = '00000000-0000-0000-0000-0000000000a1';
const SAMPLE_ID_2 = '00000000-0000-0000-0000-0000000000a2';
const SAMPLE_ID_3 = '00000000-0000-0000-0000-0000000000a3';
const SAMPLE_ID_OTHER = '00000000-0000-0000-0000-0000000000b1';
const SAMPLE_ID_TOXIC = '00000000-0000-0000-0000-0000000000c1';

/**
 * Crea un mock de la DB.
 *
 * `mock.query` se puede encadenar con mockResolvedValueOnce.
 * `mock.pool.connect` devuelve un client con query (para tx).
 */
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
  id: SHELF_ID,
  name: 'Shelf 1',
  grid_width: 10,
  grid_height: 10,
  shelf_depth: 10,
  market_line_id: '00000000-0000-0000-0000-0000000000f1',
};

const targetShelf = {
  id: TARGET_SHELF_ID,
  name: 'Shelf 2',
  grid_width: 10,
  grid_height: 10,
  shelf_depth: 10,
  market_line_id: '00000000-0000-0000-0000-0000000000f1',
};

describe('previewGroupPlacement', () => {
  test('grupo de 2 muestras en anaquel vacío retorna 100% válido', async () => {
    const db = createDbMock();

    // 1) validateGroupType: SELECT group samples
    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: SAMPLE_ID_1, global_sample_id: 'g1', shelf_id: SHELF_ID,
          position_x: 0, position_y: 0, position_z: 0,
          width: 1, height: 1, depth: 1, status: 'stored',
          global_sample_name: 'Acetone', lot: 'L1', ghs_danger_class: 'Inflamable',
        },
        {
          id: SAMPLE_ID_2, global_sample_id: 'g1', shelf_id: SHELF_ID,
          position_x: 1, position_y: 0, position_z: 0,
          width: 1, height: 1, depth: 1, status: 'stored',
          global_sample_name: 'Acetone', lot: 'L1', ghs_danger_class: 'Inflamable',
        },
      ],
    });
    // 2) SELECT target shelf
    db.query.mockResolvedValueOnce({ rows: [targetShelf] });
    // 3) SELECT source shelf (cross-shelf check)
    db.query.mockResolvedValueOnce({ rows: [baseShelf] });
    // 4) SELECT external samples (vacío)
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await groupOps.previewGroupPlacement({
      shelfId: SHELF_ID,
      targetShelfId: TARGET_SHELF_ID,
      sampleIds: [SAMPLE_ID_1, SAMPLE_ID_2],
      db,
    });

    expect(result.validCount).toBe(result.totalCandidates);
    expect(result.invalidCount).toBe(0);
    expect(result.totalCandidates).toBeGreaterThan(0);
    expect(result.groupShape.globalSampleId).toBe('g1');
    expect(result.groupShape.offsets).toHaveLength(2);
  });

  test('grupo 1x1x1 retorna matriz grid_width × grid_height × shelf_depth', async () => {
    const db = createDbMock();

    db.query.mockResolvedValueOnce({
      rows: [{
        id: SAMPLE_ID_1, global_sample_id: 'g1', shelf_id: SHELF_ID,
        position_x: 0, position_y: 0, position_z: 0,
        width: 1, height: 1, depth: 1, status: 'stored',
        global_sample_name: 'X', lot: 'L1', ghs_danger_class: 'Sin Riesgo',
      }],
    });
    db.query.mockResolvedValueOnce({ rows: [targetShelf] });
    db.query.mockResolvedValueOnce({ rows: [baseShelf] });
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await groupOps.previewGroupPlacement({
      shelfId: SHELF_ID,
      targetShelfId: TARGET_SHELF_ID,
      sampleIds: [SAMPLE_ID_1],
      db,
    });

    expect(result.totalCandidates).toBe(10 * 10 * 10);
  });

  test('grupo 2x1x1 solo retorna celdas donde cabe el bloque', async () => {
    const db = createDbMock();

    db.query.mockResolvedValueOnce({
      rows: [{
        id: SAMPLE_ID_1, global_sample_id: 'g1', shelf_id: SHELF_ID,
        position_x: 0, position_y: 0, position_z: 0,
        width: 2, height: 1, depth: 1, status: 'stored',
        global_sample_name: 'X', lot: 'L1', ghs_danger_class: 'Sin Riesgo',
      }],
    });
    db.query.mockResolvedValueOnce({ rows: [targetShelf] });
    db.query.mockResolvedValueOnce({ rows: [baseShelf] });
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await groupOps.previewGroupPlacement({
      shelfId: SHELF_ID,
      targetShelfId: TARGET_SHELF_ID,
      sampleIds: [SAMPLE_ID_1],
      db,
    });

    expect(result.totalCandidates).toBe(9 * 10 * 10);
  });

  test('grupo con Inflamable cerca de Comburente marca celda como conflictiva', async () => {
    const db = createDbMock();

    db.query.mockResolvedValueOnce({
      rows: [{
        id: SAMPLE_ID_1, global_sample_id: 'g1', shelf_id: SHELF_ID,
        position_x: 0, position_y: 0, position_z: 0,
        width: 1, height: 1, depth: 1, status: 'stored',
        global_sample_name: 'Acetone', lot: 'L1', ghs_danger_class: 'Inflamable',
      }],
    });
    // MISMO shelf (sin cross-shelf check)
    db.query.mockResolvedValueOnce({ rows: [baseShelf] });
    // No source shelf query needed (same shelf)
    // Externas: 1 Comburente en (2,0,0)
    db.query.mockResolvedValueOnce({
      rows: [{
        id: SAMPLE_ID_TOXIC,
        position_x: 2, position_y: 0, position_z: 0,
        width: 1, height: 1, depth: 1,
        ghs_danger_class: 'Comburente',
      }],
    });

    const result = await groupOps.previewGroupPlacement({
      shelfId: SHELF_ID,
      targetShelfId: SHELF_ID,
      sampleIds: [SAMPLE_ID_1],
      db,
    });

    const cell000 = result.cells.find((c) => c.x === 0 && c.y === 0 && c.z === 0);
    expect(cell000).toBeDefined();
    expect(cell000.compatible).toBe(false);
    expect(cell000.conflicts.length).toBeGreaterThan(0);
    expect(cell000.conflicts.some((c) => c.dangerClass === 'Comburente')).toBe(true);

    const cell555 = result.cells.find((c) => c.x === 5 && c.y === 5 && c.z === 5);
    expect(cell555).toBeDefined();
    expect(cell555.compatible).toBe(true);

    expect(result.invalidCount).toBeGreaterThan(0);
    expect(result.validCount).toBeGreaterThan(0);
  });

  test('grupo de tipos distintos retorna 400 con lista de IDs', async () => {
    const db = createDbMock();

    // 2 muestras con global_sample_id distinto
    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: SAMPLE_ID_1, global_sample_id: 'g1', shelf_id: SHELF_ID,
          position_x: 0, position_y: 0, position_z: 0,
          width: 1, height: 1, depth: 1, status: 'stored',
          global_sample_name: 'Acetone', lot: 'L1', ghs_danger_class: 'Inflamable',
        },
        {
          id: SAMPLE_ID_OTHER, global_sample_id: 'g2', shelf_id: SHELF_ID,
          position_x: 1, position_y: 0, position_z: 0,
          width: 1, height: 1, depth: 1, status: 'stored',
          global_sample_name: 'Sulfuric', lot: 'L2', ghs_danger_class: 'Corrosivo',
        },
      ],
    });

    await expect(
      groupOps.previewGroupPlacement({
        shelfId: SHELF_ID,
        targetShelfId: TARGET_SHELF_ID,
        sampleIds: [SAMPLE_ID_1, SAMPLE_ID_OTHER],
        db,
      })
    ).rejects.toMatchObject({ statusCode: 400, message: expect.stringMatching(/distintos/i) });
  });

  test('target_shelf en otra market_line retorna 400', async () => {
    const db = createDbMock();

    db.query.mockResolvedValueOnce({
      rows: [{
        id: SAMPLE_ID_1, global_sample_id: 'g1', shelf_id: SHELF_ID,
        position_x: 0, position_y: 0, position_z: 0,
        width: 1, height: 1, depth: 1, status: 'stored',
        global_sample_name: 'X', lot: 'L1', ghs_danger_class: 'Sin Riesgo',
      }],
    });
    // q2: target shelf (market_line_id distinto)
    db.query.mockResolvedValueOnce({
      rows: [{ ...targetShelf, market_line_id: '00000000-0000-0000-0000-0000000000f9' }],
    });
    // q3: source shelf lookup
    db.query.mockResolvedValueOnce({
      rows: [{ market_line_id: '00000000-0000-0000-0000-0000000000f1' }],
    });

    await expect(
      groupOps.previewGroupPlacement({
        shelfId: SHELF_ID,
        targetShelfId: TARGET_SHELF_ID,
        sampleIds: [SAMPLE_ID_1],
        db,
      })
    ).rejects.toMatchObject({ statusCode: 400, message: expect.stringMatching(/línea de mercado/i) });
  });

  test('shelf con 0 celdas válidas retorna valid_count: 0', async () => {
    // Anaquel 1x1x1 con 1 Comburente → colisión con el anchor.
    // Tóxico+Comburente son incompatibles (SGA).
    const smallShelf = {
      id: TARGET_SHELF_ID, name: 'Small',
      grid_width: 1, grid_height: 1, shelf_depth: 1,
      market_line_id: '00000000-0000-0000-0000-0000000000f1',
    };
    const db = createDbMock();

    db.query.mockResolvedValueOnce({
      rows: [{
        id: SAMPLE_ID_1, global_sample_id: 'g1', shelf_id: SHELF_ID,
        position_x: 0, position_y: 0, position_z: 0,
        width: 1, height: 1, depth: 1, status: 'stored',
        global_sample_name: 'Toxico', lot: 'L1', ghs_danger_class: 'Toxico',
      }],
    });
    db.query.mockResolvedValueOnce({ rows: [smallShelf] });
    // Source shelf (cross-shelf check)
    db.query.mockResolvedValueOnce({ rows: [baseShelf] });
    // Externas: un Comburente en (0,0,0) — bloquea la única celda
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 'com-1', position_x: 0, position_y: 0, position_z: 0,
        width: 1, height: 1, depth: 1, ghs_danger_class: 'Comburente',
      }],
    });

    const result = await groupOps.previewGroupPlacement({
      shelfId: SHELF_ID,
      targetShelfId: TARGET_SHELF_ID,
      sampleIds: [SAMPLE_ID_1],
      db,
    });

    expect(result.totalCandidates).toBe(1);
    expect(result.invalidCount).toBe(1);
    expect(result.validCount).toBe(0);
  });

  test('colisión interna del grupo se detecta y marca como invalid', async () => {
    const db = createDbMock();

    // 2 muestras con MISMO origen (caso patológico: validateGroupType
    // NO valida que NO se solapen en el origen, solo que sean del mismo
    // global_sample_id). Defensa en profundidad: si por bug del cliente
    // dos muestras del grupo se solapan, preview lo marca como inválido.
    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: SAMPLE_ID_1, global_sample_id: 'g1', shelf_id: SHELF_ID,
          position_x: 0, position_y: 0, position_z: 0,
          width: 1, height: 1, depth: 1, status: 'stored',
          global_sample_name: 'X', lot: 'L1', ghs_danger_class: 'Sin Riesgo',
        },
        {
          id: SAMPLE_ID_2, global_sample_id: 'g1', shelf_id: SHELF_ID,
          position_x: 0, position_y: 0, position_z: 0,
          width: 1, height: 1, depth: 1, status: 'stored',
          global_sample_name: 'X', lot: 'L1', ghs_danger_class: 'Sin Riesgo',
        },
      ],
    });
    db.query.mockResolvedValueOnce({ rows: [targetShelf] });
    db.query.mockResolvedValueOnce({ rows: [baseShelf] });
    // 1 muestra externa en (3,3,3)
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 'ext-1', position_x: 3, position_y: 3, position_z: 3,
        width: 1, height: 1, depth: 1, ghs_danger_class: 'Sin Riesgo',
      }],
    });

    const result = await groupOps.previewGroupPlacement({
      shelfId: SHELF_ID,
      targetShelfId: TARGET_SHELF_ID,
      sampleIds: [SAMPLE_ID_1, SAMPLE_ID_2],
      db,
    });

    // La celda (3,3,3): si el anchor cae ahí, las 2 muestras del grupo
    // intentarían ocupar la misma celda. Como la externa está en (3,3,3),
    // AMBAS muestras colisionan con ella → celda inválida.
    const cell333 = result.cells.find((c) => c.x === 3 && c.y === 3 && c.z === 3);
    expect(cell333).toBeDefined();
    expect(cell333.compatible).toBe(false);
  });
});

describe('validateGroupType', () => {
  test('rechaza array vacío con 400', async () => {
    const db = createDbMock();
    await expect(groupOps.validateGroupType([], db)).rejects.toMatchObject({ statusCode: 400 });
  });

  test('rechaza > MAX_GROUP_SIZE con 400', async () => {
    const db = createDbMock();
    const tooMany = Array.from({ length: 11 }, (_, i) => `id-${i}`);
    await expect(groupOps.validateGroupType(tooMany, db)).rejects.toMatchObject({ statusCode: 400 });
  });

  test('rechaza si alguna muestra no existe (404)', async () => {
    const db = createDbMock();
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(groupOps.validateGroupType(['ghost-1'], db)).rejects.toMatchObject({ statusCode: 404 });
  });

  test('rechaza si alguna muestra no es "stored" (409)', async () => {
    const db = createDbMock();
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 's-1', global_sample_id: 'g1', shelf_id: SHELF_ID,
        position_x: 0, position_y: 0, position_z: 0,
        width: 1, height: 1, depth: 1, status: 'dispensed',
        global_sample_name: 'X', lot: 'L1', ghs_danger_class: 'Sin Riesgo',
      }],
    });
    await expect(groupOps.validateGroupType(['s-1'], db)).rejects.toMatchObject({ statusCode: 409 });
  });

  test('rechaza si hay múltiples anaqueles origen (400)', async () => {
    const db = createDbMock();
    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: 's-1', global_sample_id: 'g1', shelf_id: 'shelf-A',
          position_x: 0, position_y: 0, position_z: 0,
          width: 1, height: 1, depth: 1, status: 'stored',
          global_sample_name: 'X', lot: 'L1', ghs_danger_class: 'Sin Riesgo',
        },
        {
          id: 's-2', global_sample_id: 'g1', shelf_id: 'shelf-B',
          position_x: 0, position_y: 0, position_z: 0,
          width: 1, height: 1, depth: 1, status: 'stored',
          global_sample_name: 'X', lot: 'L1', ghs_danger_class: 'Sin Riesgo',
        },
      ],
    });
    await expect(groupOps.validateGroupType(['s-1', 's-2'], db)).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('getNeighborsByAABB (helper)', () => {
  const samples = [
    { id: 'a', position_x: 0, position_y: 0, position_z: 0, width: 1, height: 1, depth: 1, ghs_danger_class: 'X' },
    { id: 'b', position_x: 1, position_y: 0, position_z: 0, width: 1, height: 1, depth: 1, ghs_danger_class: 'X' },
    { id: 'c', position_x: 5, position_y: 0, position_z: 0, width: 1, height: 1, depth: 1, ghs_danger_class: 'X' },
    { id: 'd', position_x: null, position_y: 0, position_z: 0, width: 1, height: 1, depth: 1, ghs_danger_class: 'X' },
  ];

  test('retorna solo vecinos dentro del radio Manhattan', () => {
    const aabb = { x: 0, y: 0, z: 0, w: 1, h: 1, d: 1 };
    const result = groupOps.getNeighborsByAABB(aabb, samples, 3);
    const ids = result.map((r) => r.id);
    expect(ids).toContain('b');
    expect(ids).not.toContain('c'); // dist 5 > 3
    expect(ids).not.toContain('a'); // misma celda, excluido
    expect(ids).not.toContain('d'); // position null
  });

  test('radio = 0 retorna vacío', () => {
    const aabb = { x: 0, y: 0, z: 0, w: 1, h: 1, d: 1 };
    const result = groupOps.getNeighborsByAABB(aabb, samples, 0);
    expect(result).toEqual([]);
  });
});
