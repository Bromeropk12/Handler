import { default as CircuitBreaker } from 'opossum';

export interface CircuitBreakerOptions {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
  rollingCountTimeout: number;
  rollingCountBuckets: number;
  name: string;
  errorFilter?: (err: any) => boolean;
}

export class ApiCircuitBreaker {
  private breakers: Map<string, any> = new Map();

  // Configuración por defecto para APIs
  private defaultOptions: CircuitBreakerOptions = {
    timeout: 10000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    rollingCountTimeout: 10000,
    rollingCountBuckets: 10,
    name: 'api-breaker',
    errorFilter: (err: any) => err?.response?.status && err.response.status < 500
  };

  /**
   * Obtiene o crea un circuit breaker para un endpoint específico
   */
  getBreaker(endpoint: string, customOptions?: Partial<CircuitBreakerOptions>): any {
    if (this.breakers.has(endpoint)) {
      return this.breakers.get(endpoint)!;
    }

    const options = { ...this.defaultOptions, ...customOptions, name: endpoint };
    const breaker = new CircuitBreaker((...args: any[]) => this.executeRequest(endpoint, args[0], ...args.slice(1)), options);

    // Logging de eventos del circuit breaker (simplified)
    console.log(`🔧 Circuit Breaker initialized for ${endpoint}`);

    this.breakers.set(endpoint, breaker);
    return breaker;
  }

  /**
   * Ejecuta una petición HTTP con circuit breaker
   */
  private async executeRequest(endpoint: string, requestFn: (...args: any[]) => Promise<any>, ...args: any[]): Promise<any> {
    return await requestFn(...args);
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