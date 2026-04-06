/**
 * Tests para validaciones 3D del almacén
 */

const {
  parseDimensions,
  boxesOverlap,
  hasPhysicalSpace
} = require('../src/modules/warehouse/validations');

describe('Warehouse Validations 3D', () => {
  describe('parseDimensions', () => {
    test('Parsea dimensiones 3D correctamente', () => {
      expect(parseDimensions('1x1x1')).toEqual({ width: 1, height: 1, depth: 1 });
      expect(parseDimensions('1x2x1')).toEqual({ width: 1, height: 2, depth: 1 });
      expect(parseDimensions('2x1x1')).toEqual({ width: 2, height: 1, depth: 1 });
      expect(parseDimensions('2x2x1')).toEqual({ width: 2, height: 2, depth: 1 });
      expect(parseDimensions('1x1x2')).toEqual({ width: 1, height: 1, depth: 2 });
      expect(parseDimensions('1x2x2')).toEqual({ width: 1, height: 2, depth: 2 });
      expect(parseDimensions('2x1x2')).toEqual({ width: 2, height: 1, depth: 2 });
      expect(parseDimensions('2x2x2')).toEqual({ width: 2, height: 2, depth: 2 });
    });

    test('Soporte retroactivo para formato 2D', () => {
      expect(parseDimensions('1x1')).toEqual({ width: 1, height: 1, depth: 1 });
      expect(parseDimensions('1x2')).toEqual({ width: 1, height: 2, depth: 1 });
      expect(parseDimensions('2x1')).toEqual({ width: 2, height: 1, depth: 1 });
      expect(parseDimensions('2x2')).toEqual({ width: 2, height: 2, depth: 1 });
    });

    test('Retorna default para valores desconocidos', () => {
      expect(parseDimensions('invalido')).toEqual({ width: 1, height: 1, depth: 1 });
    });
  });

  describe('boxesOverlap', () => {
    test('Cajas separadas no se superponen', () => {
      const box1 = { x: 0, y: 0, z: 0, w: 1, h: 1, d: 1 };
      const box2 = { x: 2, y: 0, z: 0, w: 1, h: 1, d: 1 };
      expect(boxesOverlap(box1, box2)).toBe(false);
    });

    test('Cajas adyacentes no se superponen', () => {
      const box1 = { x: 0, y: 0, z: 0, w: 1, h: 1, d: 1 };
      const box2 = { x: 1, y: 0, z: 0, w: 1, h: 1, d: 1 };
      expect(boxesOverlap(box1, box2)).toBe(false);
    });

    test('Cajas en la misma posición se superponen', () => {
      const box1 = { x: 0, y: 0, z: 0, w: 1, h: 1, d: 1 };
      const box2 = { x: 0, y: 0, z: 0, w: 1, h: 1, d: 1 };
      expect(boxesOverlap(box1, box2)).toBe(true);
    });

    test('Cajas parcialmente superpuestas se detectan', () => {
      const box1 = { x: 0, y: 0, z: 0, w: 2, h: 2, d: 2 };
      const box2 = { x: 1, y: 1, z: 1, w: 2, h: 2, d: 2 };
      expect(boxesOverlap(box1, box2)).toBe(true);
    });

    test('Superposición solo en eje X', () => {
      const box1 = { x: 0, y: 0, z: 0, w: 2, h: 1, d: 1 };
      const box2 = { x: 1, y: 0, z: 0, w: 2, h: 1, d: 1 };
      expect(boxesOverlap(box1, box2)).toBe(true);
    });

    test('Superposición solo en eje Z', () => {
      const box1 = { x: 0, y: 0, z: 0, w: 1, h: 1, d: 2 };
      const box2 = { x: 0, y: 0, z: 1, w: 1, h: 1, d: 2 };
      expect(boxesOverlap(box1, box2)).toBe(true);
    });
  });

  describe('hasPhysicalSpace', () => {
    const shelf = { grid_width: 10, grid_height: 10, shelf_depth: 10 };

    test('Muestra pequeña cabe en anaquel grande', () => {
      expect(hasPhysicalSpace(shelf, { width: 1, height: 1, depth: 1 })).toBe(true);
    });

    test('Muestra 2x2x2 cabe en anaquel 10x10x10', () => {
      expect(hasPhysicalSpace(shelf, { width: 2, height: 2, depth: 2 })).toBe(true);
    });

    test('Muestra más ancha que el anaquel no cabe', () => {
      expect(hasPhysicalSpace(shelf, { width: 11, height: 1, depth: 1 })).toBe(false);
    });

    test('Muestra más alta que el anaquel no cabe', () => {
      expect(hasPhysicalSpace(shelf, { width: 1, height: 11, depth: 1 })).toBe(false);
    });

    test('Muestra más profunda que el anaquel no cabe', () => {
      expect(hasPhysicalSpace(shelf, { width: 1, height: 1, depth: 11 })).toBe(false);
    });
  });
});