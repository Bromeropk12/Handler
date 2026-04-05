import { default as CircuitBreaker } from 'opossum';

export interface CircuitBreakerOptions {
  timeout: number; // Tiempo máximo de espera
  errorThresholdPercentage: number; // Porcentaje de error para abrir
  resetTimeout: number; // Tiempo para intentar cerrar
  rollingCountTimeout: number; // Ventana de tiempo para estadísticas
  rollingCountBuckets: number; // Número de buckets para estadísticas
  name: string; // Nombre del circuit breaker
}

export class ApiCircuitBreaker {
  private breakers: Map<string, any> = new Map();

  // Configuración por defecto para APIs
  private defaultOptions: CircuitBreakerOptions = {
    timeout: 10000, // 10 segundos
    errorThresholdPercentage: 50, // Abrir si 50% de requests fallan
    resetTimeout: 30000, // Intentar cerrar después de 30 segundos
    rollingCountTimeout: 10000, // Estadísticas cada 10 segundos
    rollingCountBuckets: 10,
    name: 'api-breaker'
  };

  /**
   * Obtiene o crea un circuit breaker para un endpoint específico
   */
  getBreaker(endpoint: string, customOptions?: Partial<CircuitBreakerOptions>): any {
    if (this.breakers.has(endpoint)) {
      return this.breakers.get(endpoint)!;
    }

    const options = { ...this.defaultOptions, ...customOptions, name: endpoint };
    const breaker = new CircuitBreaker(this.executeRequest.bind(this, endpoint), options);

    // Logging de eventos del circuit breaker (simplified)
    console.log(`🔧 Circuit Breaker initialized for ${endpoint}`);

    this.breakers.set(endpoint, breaker);
    return breaker;
  }

  /**
   * Ejecuta una petición HTTP con circuit breaker
   */
  private async executeRequest(endpoint: string, requestFn: () => Promise<any>): Promise<any> {
    return await requestFn();
  }

  /**
   * Envuelve una función API con circuit breaker
   */
  wrap<T extends any[], R>(
    endpoint: string,
    fn: (...args: T) => Promise<R>,
    customOptions?: Partial<CircuitBreakerOptions>
  ): (...args: T) => Promise<R> {
    const breaker = this.getBreaker(endpoint, customOptions);

    return async (...args: T): Promise<R> => {
      try {
        const result = await breaker.fire(fn, ...args);
        return result;
      } catch (error) {
        // Si el circuit breaker está abierto, devolver un error específico
        if (breaker.opened) {
          throw new Error(`Servicio temporalmente no disponible: ${endpoint}`);
        }
        throw error;
      }
    };
  }

  /**
   * Obtiene estadísticas de un circuit breaker
   */
  getStats(endpoint: string) {
    const breaker = this.breakers.get(endpoint);
    if (!breaker) return null;

    return {
      name: breaker.name,
      opened: breaker.opened,
      closed: breaker.closed,
      halfOpen: breaker.halfOpen,
      stats: breaker.stats,
      options: breaker.options
    };
  }

  /**
   * Obtiene estadísticas de todos los circuit breakers
   */
  getAllStats() {
    const stats: Record<string, any> = {};
    for (const [endpoint, breaker] of this.breakers) {
      stats[endpoint] = this.getStats(endpoint);
    }
    return stats;
  }

  /**
   * Fuerza el cierre de un circuit breaker
   */
  forceClose(endpoint: string) {
    const breaker = this.breakers.get(endpoint);
    if (breaker) {
      breaker.close();
    }
  }

  /**
   * Fuerza la apertura de un circuit breaker
   */
  forceOpen(endpoint: string) {
    const breaker = this.breakers.get(endpoint);
    if (breaker) {
      breaker.open();
    }
  }
}

// Instancia global del circuit breaker
export const apiCircuitBreaker = new ApiCircuitBreaker();