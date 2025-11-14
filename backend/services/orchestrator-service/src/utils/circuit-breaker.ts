import logger from '../config/logger.config';
import { sentryService } from '../services/sentry.service';

/**
 * Circuit Breaker States
 */
export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject requests immediately
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Circuit Breaker Options
 */
export interface CircuitBreakerOptions {
  failureThreshold: number;      // Number of failures before opening circuit
  successThreshold: number;      // Number of successes to close circuit from half-open
  timeout: number;               // Time to wait before trying again (ms)
  monitoringPeriod: number;      // Time window to track failures (ms)
}

/**
 * Circuit Breaker Implementation
 * Prevents cascading failures by stopping requests to failing services
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  private failureTimestamps: number[] = [];

  private readonly name: string;
  private readonly options: CircuitBreakerOptions;

  constructor(
    name: string,
    options: Partial<CircuitBreakerOptions> = {}
  ) {
    this.name = name;
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 2,
      timeout: options.timeout || 60000, // 1 minute
      monitoringPeriod: options.monitoringPeriod || 120000, // 2 minutes
    };

    logger.info(`[CircuitBreaker] Initialized: ${name}`, this.options);
  }

  /**
   * Execute function with circuit breaker protection
   */
  public async call<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        logger.info(`[CircuitBreaker:${this.name}] Attempting reset (OPEN -> HALF_OPEN)`);
        this.state = CircuitState.HALF_OPEN;
      } else {
        const error = new Error(`Circuit breaker is OPEN for ${this.name}`);
        logger.warn(`[CircuitBreaker:${this.name}] Circuit OPEN, rejecting request`);

        sentryService.captureException(error, {
          component: 'circuit-breaker',
          operation: this.name,
          metadata: {
            state: this.state,
            failures: this.failures,
            nextAttemptTime: this.nextAttemptTime,
          },
        });

        throw error;
      }
    }

    try {
      // Execute function
      const result = await fn();

      // Success
      this.onSuccess();
      return result;

    } catch (error) {
      // Failure
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Handle successful call
   */
  private onSuccess(): void {
    this.successes++;

    // Clean old failure timestamps
    this.cleanOldFailures();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successes >= this.options.successThreshold) {
        logger.info(`[CircuitBreaker:${this.name}] Circuit closed after ${this.successes} successes`);
        this.reset();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in CLOSED state
      this.failures = 0;
      this.failureTimestamps = [];
    }
  }

  /**
   * Handle failed call
   */
  private onFailure(error: any): void {
    this.failures++;
    this.lastFailureTime = new Date();
    this.failureTimestamps.push(Date.now());
    this.successes = 0; // Reset success count

    // Clean old failures
    this.cleanOldFailures();

    logger.warn(`[CircuitBreaker:${this.name}] Failure ${this.failures}/${this.options.failureThreshold}`, {
      error: error instanceof Error ? error.message : String(error),
      state: this.state,
    });

    // Check if we should open the circuit
    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in HALF_OPEN immediately opens circuit
      logger.error(`[CircuitBreaker:${this.name}] Circuit reopened (HALF_OPEN -> OPEN)`);
      this.openCircuit();
    } else if (this.state === CircuitState.CLOSED && this.failures >= this.options.failureThreshold) {
      // Too many failures in CLOSED state
      logger.error(`[CircuitBreaker:${this.name}] Circuit opened (CLOSED -> OPEN)`);
      this.openCircuit();

      sentryService.captureMessage(
        `Circuit breaker opened for ${this.name} after ${this.failures} failures`,
        'error',
        {
          component: 'circuit-breaker',
          metadata: {
            name: this.name,
            failures: this.failures,
            threshold: this.options.failureThreshold,
          },
        }
      );
    }
  }

  /**
   * Open the circuit
   */
  private openCircuit(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.options.timeout);

    logger.error(`[CircuitBreaker:${this.name}] Circuit OPEN until ${this.nextAttemptTime.toISOString()}`);
  }

  /**
   * Check if we should attempt to reset the circuit
   */
  private shouldAttemptReset(): boolean {
    if (!this.nextAttemptTime) {
      return false;
    }

    return Date.now() >= this.nextAttemptTime.getTime();
  }

  /**
   * Reset circuit to CLOSED state
   */
  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
    this.failureTimestamps = [];

    logger.info(`[CircuitBreaker:${this.name}] Circuit reset to CLOSED`);
  }

  /**
   * Clean old failure timestamps outside monitoring period
   */
  private cleanOldFailures(): void {
    const cutoff = Date.now() - this.options.monitoringPeriod;
    this.failureTimestamps = this.failureTimestamps.filter(ts => ts > cutoff);
    this.failures = this.failureTimestamps.length;
  }

  /**
   * Get current circuit state
   */
  public getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  public getStats() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      options: this.options,
    };
  }

  /**
   * Force open the circuit (for testing/manual intervention)
   */
  public forceOpen(): void {
    logger.warn(`[CircuitBreaker:${this.name}] Circuit force-opened`);
    this.openCircuit();
  }

  /**
   * Force close the circuit (for testing/manual intervention)
   */
  public forceClose(): void {
    logger.warn(`[CircuitBreaker:${this.name}] Circuit force-closed`);
    this.reset();
  }
}

/**
 * Global circuit breakers for external services
 */
export const circuitBreakers = {
  openai: new CircuitBreaker('OpenAI', {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute
    monitoringPeriod: 120000, // 2 minutes
  }),

  pinecone: new CircuitBreaker('Pinecone', {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000, // 30 seconds
    monitoringPeriod: 60000, // 1 minute
  }),

  redis: new CircuitBreaker('Redis', {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 10000, // 10 seconds
    monitoringPeriod: 30000, // 30 seconds
  }),
};
