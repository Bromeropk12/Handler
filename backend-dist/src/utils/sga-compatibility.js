/**
 * SGA Compatibility Matrix
 * Matriz de compatibilidad química basada en el Sistema Globalmente Armonizado
 * 
 * Define qué clases de peligro pueden almacenarse juntas en el mismo anaquel
 * y cuáles deben mantenerse separadas por riesgo de reacción química.
 * 
 * @see https://unece.org/transport/dangerous-goods/ghs
 */

// Nivel de riesgo de cada clase de peligro
const DANGER_LEVELS = {
  'Sin Riesgo': 0,
  'Inflamable': 3,
  'Corrosivo': 4,
  'Toxico': 5,
  'Comburente': 3,
  'Explosivo': 6
};

/**
 * Matriz de compatibilidad SGA
 * 
 * Cada clase de peligro define con cuáles otras es compatible para almacenamiento adyacente.
 * Basada en principios reales de seguridad química:
 * 
 * - Inflamables + Comburentes = REACCIÓN VIOLENTA (incendio)
 * - Corrosivos + Tóxicos = GASES TÓXICOS posibles
 * - Explosivos = AISLAMIENTO TOTAL requerido
 * - Comburentes + Inflamables = REACCIÓN VIOLENTA
 */
const COMPATIBILITY_MATRIX = {
  // Sin Riesgo: compatible con todo (no reacciona con nada)
  'Sin Riesgo': {
    compatible: ['Sin Riesgo', 'Inflamable', 'Corrosivo', 'Toxico', 'Comburente', 'Explosivo'],
    distance: 0 // No requiere distancia mínima
  },
  
  // Inflamable: NO compatible con Comburente (reacción violenta = incendio)
  // Tampoco con Explosivo por riesgo de detonación
  'Inflamable': {
    compatible: ['Sin Riesgo', 'Inflamable'],
    incompatible: ['Comburente', 'Explosivo', 'Corrosivo', 'Toxico'],
    distance: 1 // Requiere al menos 1 celda de separación de incompatibles
  },
  
  // Corrosivo: NO compatible con Tóxico (puede generar gases tóxicos)
  // NO compatible con Inflamable (algunos corrosivos son oxidantes)
  'Corrosivo': {
    compatible: ['Sin Riesgo', 'Corrosivo'],
    incompatible: ['Toxico', 'Inflamable', 'Explosivo'],
    distance: 1
  },
  
  // Tóxico: solo con Sin Riesgo (máxima precaución)
  // NO compatible con Corrosivo (gases tóxicos), Comburente, Inflamable
  'Toxico': {
    compatible: ['Sin Riesgo', 'Toxico'],
    incompatible: ['Corrosivo', 'Comburente', 'Inflamable', 'Explosivo'],
    distance: 2 // Requiere mayor separación
  },
  
  // Comburente: NO compatible con Inflamable (incendio seguro)
  // NO compatible con Tóxico (reacciones peligrosas)
  'Comburente': {
    compatible: ['Sin Riesgo', 'Comburente'],
    incompatible: ['Inflamable', 'Toxico', 'Explosivo'],
    distance: 1
  },
  
  // Explosivo: AISLAMIENTO TOTAL
  // Solo con Sin Riesgo. Requiere máxima separación de todo lo demás
  'Explosivo': {
    compatible: ['Sin Riesgo'],
    incompatible: ['Inflamable', 'Corrosivo', 'Toxico', 'Comburente'],
    distance: 3 // Máxima separación requerida
  }
};

/**
 * Verifica si dos clases de peligro SGA son compatibles para almacenamiento adyacente
 * 
 * @param {string} dangerClass1 - Primera clase de peligro SGA
 * @param {string} dangerClass2 - Segunda clase de peligro SGA
 * @returns {boolean} true si son compatibles, false si no
 */
function areCompatible(dangerClass1, dangerClass2) {
  if (!COMPATIBILITY_MATRIX[dangerClass1] || !COMPATIBILITY_MATRIX[dangerClass2]) {
    return false; // Clase desconocida = incompatible por seguridad
  }
  
  return COMPATIBILITY_MATRIX[dangerClass1].compatible.includes(dangerClass2);
}

/**
 * Obtiene la distancia mínima requerida entre dos clases de peligro
 * 
 * @param {string} dangerClass1 - Primera clase de peligro SGA
 * @param {string} dangerClass2 - Segunda clase de peligro SGA
 * @returns {number} Distancia mínima en celdas del grid
 */
function getMinimumDistance(dangerClass1, dangerClass2) {
  if (!COMPATIBILITY_MATRIX[dangerClass1] || !COMPATIBILITY_MATRIX[dangerClass2]) {
    return 999; // Distancia máxima para desconocidos
  }
  
  const dist1 = COMPATIBILITY_MATRIX[dangerClass1].distance || 0;
  const dist2 = COMPATIBILITY_MATRIX[dangerClass2].distance || 0;
  
  // Usar la mayor distancia requerida
  return Math.max(dist1, dist2);
}

/**
 * Obtiene la lista de clases incompatibles con una clase dada
 * 
 * @param {string} dangerClass - Clase de peligro SGA
 * @returns {string[]} Array de clases incompatibles
 */
function getIncompatibleClasses(dangerClass) {
  if (!COMPATIBILITY_MATRIX[dangerClass]) return [];
  return COMPATIBILITY_MATRIX[dangerClass].incompatible || [];
}

/**
 * Obtiene el nivel de riesgo de una clase de peligro
 * 
 * @param {string} dangerClass - Clase de peligro SGA
 * @returns {number} Nivel de riesgo (0-6)
 */
function getDangerLevel(dangerClass) {
  return DANGER_LEVELS[dangerClass] || 0;
}

/**
 * Verifica si una muestra puede colocarse en una posición dada
 * considerando la compatibilidad SGA con las muestras vecinas
 * 
 * @param {string} sampleDangerClass - Clase de peligro de la muestra a colocar
 * @param {Array} neighbors - Array de muestras vecinas {ghs_danger_class, position_x, position_y}
 * @returns {object} {compatible: boolean, conflicts: string[]}
 */
function checkPlacementCompatibility(sampleDangerClass, neighbors) {
  const conflicts = [];
  
  for (const neighbor of neighbors) {
    if (!areCompatible(sampleDangerClass, neighbor.ghs_danger_class)) {
      conflicts.push({
        sample_id: neighbor.id,
        danger_class: neighbor.ghs_danger_class,
        position: { x: neighbor.position_x, y: neighbor.position_y },
        reason: `Incompatible con ${sampleDangerClass}`
      });
    }
  }
  
  return {
    compatible: conflicts.length === 0,
    conflicts
  };
}

/**
 * Obtiene todas las clases de peligro SGA disponibles
 * 
 * @returns {string[]} Array de clases de peligro
 */
function getAllDangerClasses() {
  return Object.keys(COMPATIBILITY_MATRIX);
}

/**
 * Genera un reporte de compatibilidad para un anaquel
 * 
 * @param {Array} samples - Muestras en el anaquel
 * @returns {object} Reporte de compatibilidad
 */
function generateCompatibilityReport(samples) {
  const issues = [];
  
  for (let i = 0; i < samples.length; i++) {
    for (let j = i + 1; j < samples.length; j++) {
      const s1 = samples[i];
      const s2 = samples[j];
      
      // Verificar si están adyacentes (misma fila o columna, distancia <= 2)
      const distance = Math.abs(s1.position_x - s2.position_x) + Math.abs(s1.position_y - s2.position_y);
      
      if (distance <= 2 && !areCompatible(s1.ghs_danger_class, s2.ghs_danger_class)) {
        issues.push({
          sample1: { id: s1.id, name: s1.name, danger_class: s1.ghs_danger_class, position: { x: s1.position_x, y: s1.position_y } },
          sample2: { id: s2.id, name: s2.name, danger_class: s2.ghs_danger_class, position: { x: s2.position_x, y: s2.position_y } },
          distance,
          severity: getDangerLevel(s1.ghs_danger_class) + getDangerLevel(s2.ghs_danger_class)
        });
      }
    }
  }
  
  // Ordenar por severidad (mayor primero)
  issues.sort((a, b) => b.severity - a.severity);
  
  return {
    total_samples: samples.length,
    total_issues: issues.length,
    safe: issues.length === 0,
    issues
  };
}

module.exports = {
  COMPATIBILITY_MATRIX,
  DANGER_LEVELS,
  areCompatible,
  getMinimumDistance,
  getIncompatibleClasses,
  getDangerLevel,
  checkPlacementCompatibility,
  getAllDangerClasses,
  generateCompatibilityReport
};
