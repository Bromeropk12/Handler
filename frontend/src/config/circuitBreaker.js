// Configuración global del Circuit Breaker
export const CIRCUIT_BREAKER_CONFIG = {
  // Configuración por defecto para todas las APIs (nube Supabase puede tener latencia mayor)
  default: {
    timeout: 30000, // 30 segundos
    errorThresholdPercentage: 50, // Abrir si 50% de requests fallan
    resetTimeout: 30000, // Intentar cerrar después de 30 segundos
    rollingCountTimeout: 10000, // Estadísticas cada 10 segundos
    rollingCountBuckets: 10,
  },

  // Configuración específica por endpoint
  endpoints: {
    // Autenticación - más tolerante a fallos
    'auth/login': {
      timeout: 30000,
      errorThresholdPercentage: 30, // Más tolerante
      resetTimeout: 60000, // Más tiempo para recuperación
    },

    // Backup/restauración - operación lenta en la nube, necesita tiempo extra
    'backup/restore': {
      timeout: 120000, // 2 minutos para restauración completa
      errorThresholdPercentage: 80,
      resetTimeout: 30000,
    },
    'backup/create': {
      timeout: 120000, // 2 minutos para exportar y escribir
      errorThresholdPercentage: 80,
      resetTimeout: 30000,
    },

    // Operaciones críticas del almacén
    'warehouse/map': {
      timeout: 20000,
      errorThresholdPercentage: 40,
      resetTimeout: 20000,
    },

    // Operaciones de modificación
    'warehouse/place': {
      timeout: 30000,
      errorThresholdPercentage: 60,
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