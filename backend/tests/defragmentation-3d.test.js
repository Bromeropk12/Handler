/**
 * Tests para el algoritmo de desfragmentación 3D
 */

const {
  calculateDefragmentation3D,
  buildOccupancyMap3D,
  findFreeBlock3D
} = require('../src/utils/defragmentation');

describe('Defragmentation 3D Algorithm', () => {
  describe('buildOccupancyMap3D', () => {
    test('Construye matriz 3D vacía sin muestras', () => {
      const matrix = buildOccupancyMap3D(5, 5, 5, []);
      expect(matrix).toHaveLength(5);
      expect(matrix[0]).toHaveLength(5);
      expect(matrix[0][0]).toHaveLength(5);
      expect(matrix[0][0][0].occupied).toBe(false);
    });

    test('Marca celdas ocupadas para una muestra 1x1x1', () => {
      const samples = [{
        id: '1',
        position_x: 2,
        position_y: 1,
        position_z: 3,
        width: 1,
        height: 1,
        depth: 1,
        ghs_danger_class: 'Sin Riesgo'
      }];
      const matrix = buildOccupancyMap3D(5, 5, 5, samples);
      expect(matrix[1][3][2].occupied).toBe(true);
      expect(matrix[1][3][2].sampleId).toBe('1');
      expect(matrix[0][0][0].occupied).toBe(false);
    });

    test('Marca celdas ocupadas para una muestra 2x2x2', () => {
      const samples = [{
        id: '1',
        position_x: 0,
        position_y: 0,
        position_z: 0,
        width: 2,
        height: 2,
        depth: 2,
        ghs_danger_class: 'Inflamable'
      }];
      const matrix = buildOccupancyMap3D(5, 5, 5, samples);
      expect(matrix[0][0][0].occupied).toBe(true);
      expect(matrix[0][0][1].occupied).toBe(true);
      expect(matrix[0][1][0].occupied).toBe(true);
      expect(matrix[0][1][1].occupied).toBe(true);
      expect(matrix[1][0][0].occupied).toBe(true);
      expect(matrix[1][0][1].occupied).toBe(true);
      expect(matrix[1][1][0].occupied).toBe(true);
      expect(matrix[1][1][1].occupied).toBe(true);
      expect(matrix[2][0][0].occupied).toBe(false);
    });
  });

  describe('findFreeBlock3D', () => {
    test('Encuentra bloque libre en matriz vacía', () => {
      const matrix = buildOccupancyMap3D(5, 5, 5, []);
      const result = findFreeBlock3D(matrix, 5, 5, 5, 2, 2, 2);
      expect(result).not.toBeNull();
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.z).toBe(0);
    });

    test('No encuentra bloque si no hay espacio', () => {
      const samples = [
        { id: '1', position_x: 0, position_y: 0, position_z: 0, width: 5, height: 5, depth: 5, ghs_danger_class: 'Sin Riesgo' }
      ];
      const matrix = buildOccupancyMap3D(5, 5, 5, samples);
      const result = findFreeBlock3D(matrix, 5, 5, 5, 2, 2, 2);
      expect(result).toBeNull();
    });

    test('Encuentra bloque después de espacio ocupado', () => {
      const samples = [
        { id: '1', position_x: 0, position_y: 0, position_z: 0, width: 2, height: 1, depth: 1, ghs_danger_class: 'Sin Riesgo' }
      ];
      const matrix = buildOccupancyMap3D(5, 5, 5, samples);
      const result = findFreeBlock3D(matrix, 5, 5, 5, 2, 1, 1);
      expect(result).not.toBeNull();
      expect(result.x).toBe(2);
    });
  });

  describe('calculateDefragmentation3D', () => {
    const createShelf = (overrides = {}) => ({
      id: 'shelf-1',
      name: 'Test Shelf',
      grid_width: 5,
      grid_height: 5,
      shelf_depth: 5,
      ...overrides
    });

    test('Retorna espacio libre si ya existe', () => {
      const shelf = createShelf();
      const samples = [
        { id: '1', position_x: 0, position_y: 0, position_z: 0, width: 1, height: 1, depth: 1, ghs_danger_class: 'Sin Riesgo' }
      ];
      const result = calculateDefragmentation3D(shelf, samples, 2, 2, 2);
      expect(result.possible).toBe(true);
      expect(result.freeSpaceFound).toBe(true);
      expect(result.moves).toHaveLength(0);
    });

    test('Genera movimientos si no hay espacio', () => {
      const shelf = createShelf({ grid_width: 3, grid_height: 3, shelf_depth: 3 });
      const samples = [
        { id: '1', position_x: 0, position_y: 0, position_z: 0, width: 2, height: 1, depth: 1, ghs_danger_class: 'Sin Riesgo', name: 'Sample 1' },
        { id: '2', position_x: 2, position_y: 0, position_z: 0, width: 1, height: 1, depth: 1, ghs_danger_class: 'Sin Riesgo', name: 'Sample 2' }
      ];
      const result = calculateDefragmentation3D(shelf, samples, 2, 2, 1);
      expect(result.possible).toBeDefined();
      expect(result.freeBlock).toBeDefined();
    });

    test('Rechaza muestra más grande que el anaquel', () => {
      const shelf = createShelf({ grid_width: 2, grid_height: 2, shelf_depth: 2 });
      const result = calculateDefragmentation3D(shelf, [], 3, 3, 3);
      expect(result.possible).toBe(false);
      expect(result.freeSpaceFound).toBe(false);
    });

    test('Muestra 1x1x1 siempre cabe si hay espacio', () => {
      const shelf = createShelf();
      const samples = [
        { id: '1', position_x: 0, position_y: 0, position_z: 0, width: 1, height: 1, depth: 1, ghs_danger_class: 'Sin Riesgo' }
      ];
      const result = calculateDefragmentation3D(shelf, samples, 1, 1, 1);
      expect(result.possible).toBe(true);
      expect(result.freeSpaceFound).toBe(true);
    });
  });
});