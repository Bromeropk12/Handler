import CircuitBreaker from 'opossum';

class ApiCircuitBreaker {
  constructor() {
    this.breakers = new Map();
    this.defaultOptions = {
      timeout: 10000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10,
      name: 'api-breaker',
      errorFilter: (error) => {
        // Los errores HTTP 400-499 (errores de cliente, validación, auth) 
        // no deben disparar el circuit breaker
        if (error && error.status >= 400 && error.status < 500) {
          return true; // true = ignorar este error para las estadísticas del breaker
        }
        return false;
      }
    };
  }

  getBreaker(endpoint, customOptions = {}) {
    if (this.breakers.has(endpoint)) {
      return this.breakers.get(endpoint);
    }

    const options = { ...this.defaultOptions, ...customOptions, name: endpoint };
    const breaker = new CircuitBreaker(this.executeRequest.bind(this, endpoint), options);

    this.breakers.set(endpoint, breaker);
    return breaker;
  }

  async executeRequest(endpoint, requestFn, ...args) {
    return await requestFn(...args);
  }

  wrap(endpoint, fn, customOptions = {}) {
    const breaker = this.getBreaker(endpoint, customOptions);

    return async (...args) => {
      try {
        return await breaker.fire(fn, ...args);
      } catch (error) {
        if (breaker.opened) {
          throw new Error(`Servicio temporalmente no disponible: ${endpoint}`);
        }
        throw error;
      }
    };
  }

  getStats(endpoint) {
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

  getAllStats() {
    const stats = {};
    for (const [endpoint] of this.breakers) {
      stats[endpoint] = this.getStats(endpoint);
    }
    return stats;
  }

  forceClose(endpoint) {
    const breaker = this.breakers.get(endpoint);
    if (breaker) breaker.close();
  }

  forceOpen(endpoint) {
    const breaker = this.breakers.get(endpoint);
    if (breaker) breaker.open();
  }
}

export const apiCircuitBreaker = new ApiCircuitBreaker();
