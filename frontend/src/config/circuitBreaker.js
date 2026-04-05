// Configuración global del Circuit Breaker
export const CIRCUIT_BREAKER_CONFIG = {
  // Configuración por defecto para todas las APIs
  default: {
    timeout: 10000, // 10 segundos
    errorThresholdPercentage: 50, // Abrir si 50% de requests fallan
    resetTimeout: 30000, // Intentar cerrar después de 30 segundos
    rollingCountTimeout: 10000, // Estadísticas cada 10 segundos
    rollingCountBuckets: 10,
  },

  // Configuración específica por endpoint
  endpoints: {
    // Autenticación - más tolerante a fallos
    'auth/login': {
      timeout: 15000,
      errorThresholdPercentage: 30, // Más tolerante
      resetTimeout: 60000, // Más tiempo para recuperación
    },

    // Operaciones críticas del almacén
    'warehouse/map': {
      timeout: 8000, // Más rápido para UX
      errorThresholdPercentage: 40,
      resetTimeout: 20000,
    },

    // Operaciones de modificación
    'warehouse/place': {
      timeout: 12000,
      errorThresholdPercentage: 60, // Menos tolerante para operaciones críticas
      resetTimeout: 25000,
    },
  },
};

// Función para obtener configuración por endpoint
export const getEndpointConfig = (endpoint) => {
  return {
    ...CIRCUIT_BREAKER_CONFIG.default,
    ...CIRCUIT_BREAKER_CONFIG.endpoints[endpoint],
    name: endpoint,
  };
};