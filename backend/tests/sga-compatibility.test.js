/**
 * Tests para el algoritmo de compatibilidad SGA
 */

const {
  areCompatible,
  getMinimumDistance,
  getIncompatibleClasses,
  getDangerLevel,
  checkPlacementCompatibility,
  getAllDangerClasses,
  COMPATIBILITY_MATRIX,
  DANGER_LEVELS
} = require('../src/utils/sga-compatibility');

describe('SGA Compatibility Matrix', () => {
  describe('areCompatible', () => {
    test('Sin Riesgo es compatible con todo', () => {
      expect(areCompatible('Sin Riesgo', 'Inflamable')).toBe(true);
      expect(areCompatible('Sin Riesgo', 'Corrosivo')).toBe(true);
      expect(areCompatible('Sin Riesgo', 'Toxico')).toBe(true);
      expect(areCompatible('Sin Riesgo', 'Comburente')).toBe(true);
      expect(areCompatible('Sin Riesgo', 'Explosivo')).toBe(true);
    });

    test('Inflamable NO es compatible con Comburente', () => {
      expect(areCompatible('Inflamable', 'Comburente')).toBe(false);
      expect(areCompatible('Comburente', 'Inflamable')).toBe(false);
    });

    test('Inflamable es compatible consigo mismo', () => {
      expect(areCompatible('Inflamable', 'Inflamable')).toBe(true);
    });

    test('Corrosivo NO es compatible con Toxico', () => {
      expect(areCompatible('Corrosivo', 'Toxico')).toBe(false);
      expect(areCompatible('Toxico', 'Corrosivo')).toBe(false);
    });

    test('Explosivo solo es compatible con Sin Riesgo', () => {
      expect(areCompatible('Explosivo', 'Sin Riesgo')).toBe(true);
      expect(areCompatible('Explosivo', 'Inflamable')).toBe(false);
      expect(areCompatible('Explosivo', 'Corrosivo')).toBe(false);
      expect(areCompatible('Explosivo', 'Toxico')).toBe(false);
      expect(areCompatible('Explosivo', 'Comburente')).toBe(false);
    });

    test('Clase desconocida retorna false', () => {
      expect(areCompatible('Desconocido', 'Sin Riesgo')).toBe(false);
    });
  });

  describe('getMinimumDistance', () => {
    test('Sin Riesgo con Inflamable retorna distancia del mayor (1)', () => {
      // Sin Riesgo tiene distance 0, Inflamable tiene distance 1
      expect(getMinimumDistance('Sin Riesgo', 'Inflamable')).toBe(1);
    });

    test('Sin Riesgo con Sin Riesgo retorna 0', () => {
      expect(getMinimumDistance('Sin Riesgo', 'Sin Riesgo')).toBe(0);
    });

    test('Inflamable requiere distancia 1', () => {
      expect(getMinimumDistance('Inflamable', 'Comburente')).toBe(1);
    });

    test('Toxico requiere distancia 2', () => {
      expect(getMinimumDistance('Toxico', 'Corrosivo')).toBe(2);
    });

    test('Explosivo requiere distancia 3', () => {
      expect(getMinimumDistance('Explosivo', 'Inflamable')).toBe(3);
    });
  });

  describe('getIncompatibleClasses', () => {
    test('Sin Riesgo no tiene incompatibles', () => {
      expect(getIncompatibleClasses('Sin Riesgo')).toEqual([]);
    });

    test('Inflamable es incompatible con Comburente y Explosivo', () => {
      const incompatibles = getIncompatibleClasses('Inflamable');
      expect(incompatibles).toContain('Comburente');
      expect(incompatibles).toContain('Explosivo');
    });

    test('Explosivo es incompatible con casi todo', () => {
      const incompatibles = getIncompatibleClasses('Explosivo');
      expect(incompatibles).toContain('Inflamable');
      expect(incompatibles).toContain('Corrosivo');
      expect(incompatibles).toContain('Toxico');
      expect(incompatibles).toContain('Comburente');
    });
  });

  describe('getDangerLevel', () => {
    test('Sin Riesgo tiene nivel 0', () => {
      expect(getDangerLevel('Sin Riesgo')).toBe(0);
    });

    test('Explosivo tiene el nivel más alto (6)', () => {
      expect(getDangerLevel('Explosivo')).toBe(6);
    });

    test('Toxico tiene nivel 5', () => {
      expect(getDangerLevel('Toxico')).toBe(5);
    });

    test('Clase desconocida retorna 0', () => {
      expect(getDangerLevel('Desconocido')).toBe(0);
    });
  });

  describe('checkPlacementCompatibility', () => {
    test('Colocación compatible retorna sin conflictos', () => {
      const neighbors = [
        { id: '1', ghs_danger_class: 'Sin Riesgo', position_x: 0, position_y: 0 }
      ];
      const result = checkPlacementCompatibility('Inflamable', neighbors);
      expect(result.compatible).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    test('Colocación incompatible retorna conflictos', () => {
      const neighbors = [
        { id: '1', ghs_danger_class: 'Comburente', position_x: 0, position_y: 0 }
      ];
      const result = checkPlacementCompatibility('Inflamable', neighbors);
      expect(result.compatible).toBe(false);
      expect(result.conflicts).toHaveLength(1);
    });
  });

  describe('getAllDangerClasses', () => {
    test('Retorna las 6 clases de peligro', () => {
      const classes = getAllDangerClasses();
      expect(classes).toHaveLength(6);
      expect(classes).toContain('Sin Riesgo');
      expect(classes).toContain('Inflamable');
      expect(classes).toContain('Corrosivo');
      expect(classes).toContain('Toxico');
      expect(classes).toContain('Comburente');
      expect(classes).toContain('Explosivo');
    });
  });

  describe('COMPATIBILITY_MATRIX structure', () => {
    test('Todas las clases tienen compatible array', () => {
      const classes = getAllDangerClasses();
      for (const cls of classes) {
        expect(COMPATIBILITY_MATRIX[cls].compatible).toBeDefined();
        expect(Array.isArray(COMPATIBILITY_MATRIX[cls].compatible)).toBe(true);
      }
    });

    test('Todas las clases tienen distance definido', () => {
      const classes = getAllDangerClasses();
      for (const cls of classes) {
        expect(COMPATIBILITY_MATRIX[cls].distance).toBeDefined();
        expect(typeof COMPATIBILITY_MATRIX[cls].distance).toBe('number');
      }
    });
  });
});