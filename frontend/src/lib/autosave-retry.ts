/**
 * Autosave Retry Logic
 * 
 * This module provides robust retry mechanisms for autosave operations,
 * including exponential backoff, jitter, and circuit breaker patterns.
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  timeoutMs: number;
  retryableErrors: string[];
  onRetry?: (attempt: number) => void;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  jitter: true,
  timeoutMs: 10000, // 10 seconds
  retryableErrors: [
    'NetworkError',
    'TimeoutError',
    'ConnectionError',
    'AbortError',
    'InternalServerError',
    'BadGateway',
    'ServiceUnavailable',
    'GatewayTimeout',
  ],
};

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
  lastAttemptTime: number;
}

export interface RetryAttempt {
  attempt: number;
  delay: number;
  timestamp: number;
  error?: Error;
}

export class AutosaveRetryManager {
  private config: RetryConfig;
  private circuitBreaker: CircuitBreaker;
  private metrics: RetryMetrics;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
    this.circuitBreaker = new CircuitBreaker();
    this.metrics = new RetryMetrics();
  }

  /**
   * Execute an operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'autosave',
    customConfig?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const config = { ...this.config, ...customConfig };
    const startTime = Date.now();
    const attempts: RetryAttempt[] = [];

    // Check circuit breaker
    if (this.circuitBreaker.isOpen()) {
      this.metrics.recordCircuitBreakerOpen(operationName);
      return {
        success: false,
        error: new Error('Circuit breaker is open'),
        attempts: 0,
        totalTime: 0,
        lastAttemptTime: startTime,
      };
    }

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      const attemptStartTime = Date.now();
      
      try {
        // Execute the operation with timeout
        const result = await this.executeWithTimeout(operation, config.timeoutMs);
        
        // Success - record metrics and reset circuit breaker
        const totalTime = Date.now() - startTime;
        this.metrics.recordSuccess(operationName, attempt, totalTime);
        this.circuitBreaker.recordSuccess();
        
        return {
          success: true,
          result,
          attempts: attempt,
          totalTime,
          lastAttemptTime: attemptStartTime,
        };
        
      } catch (error) {
        const attemptTime = Date.now() - attemptStartTime;
        const attemptError = error instanceof Error ? error : new Error(String(error));
        
        attempts.push({
          attempt,
          delay: 0,
          timestamp: attemptStartTime,
          error: attemptError,
        });

        // Check if error is retryable
        if (!this.isRetryableError(attemptError, config)) {
          // Non-retryable error - fail immediately
          this.metrics.recordNonRetryableError(operationName, attemptError);
          this.circuitBreaker.recordFailure();
          
          return {
            success: false,
            error: attemptError,
            attempts: attempt,
            totalTime: Date.now() - startTime,
            lastAttemptTime: attemptStartTime,
          };
        }

        // Record retryable error
        this.metrics.recordRetryableError(operationName, attempt, attemptError);

        // If this was the last attempt, fail
        if (attempt === config.maxAttempts) {
          this.circuitBreaker.recordFailure();
          return {
            success: false,
            error: attemptError,
            attempts: attempt,
            totalTime: Date.now() - startTime,
            lastAttemptTime: attemptStartTime,
          };
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, config);
        attempts[attempts.length - 1].delay = delay;

        console.warn(
          `[AutosaveRetry] ${operationName} failed on attempt ${attempt}/${config.maxAttempts}. ` +
          `Retrying in ${delay}ms. Error: ${attemptError.message}`
        );

        // Call retry callback if provided
        if (config.onRetry) {
          config.onRetry(attempt + 1); // Next attempt number
        }

        // Wait before retry
        await this.delay(delay);
      }
    }

    // This should never be reached, but just in case
    return {
      success: false,
      error: new Error('Maximum retry attempts exceeded'),
      attempts: config.maxAttempts,
      totalTime: Date.now() - startTime,
      lastAttemptTime: Date.now(),
    };
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Operation timeout'));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error, config: RetryConfig): boolean {
    // Check error type/name
    if (config.retryableErrors.includes(error.name)) {
      return true;
    }

    // Check error message patterns
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /connection/i,
      /abort/i,
      /fetch/i,
      /5\d{2}/i, // 5xx HTTP errors
    ];

    return retryablePatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Calculate delay for retry with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Exponential backoff
    let delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
    
    // Cap at maximum delay
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter if enabled
    if (config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }
    
    return Math.max(0, Math.floor(delay));
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get retry metrics
   */
  getMetrics(): RetryMetrics {
    return this.metrics;
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): CircuitBreakerStatus {
    return this.circuitBreaker.getStatus();
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }
}

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly failureThreshold: number = 5;
  private readonly recoveryTimeout: number = 60000; // 1 minute

  isOpen(): boolean {
    if (this.state === 'open') {
      // Check if enough time has passed to try again
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }

  getStatus(): CircuitBreakerStatus {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      failureThreshold: this.failureThreshold,
      recoveryTimeout: this.recoveryTimeout,
    };
  }
}

/**
 * Metrics collection
 */
class RetryMetrics {
  private operations: Map<string, OperationMetrics> = new Map();

  recordSuccess(operationName: string, attempts: number, totalTime: number): void {
    const metrics = this.getOrCreateMetrics(operationName);
    metrics.successes++;
    metrics.totalAttempts += attempts;
    metrics.totalTime += totalTime;
    metrics.lastSuccess = Date.now();
  }

  recordRetryableError(operationName: string, attempt: number, error: Error): void {
    const metrics = this.getOrCreateMetrics(operationName);
    metrics.retryableErrors++;
    metrics.totalAttempts++;
    metrics.lastError = {
      message: error.message,
      timestamp: Date.now(),
      attempt,
    };
  }

  recordNonRetryableError(operationName: string, error: Error): void {
    const metrics = this.getOrCreateMetrics(operationName);
    metrics.nonRetryableErrors++;
    metrics.totalAttempts++;
    metrics.lastError = {
      message: error.message,
      timestamp: Date.now(),
      attempt: 1,
    };
  }

  recordCircuitBreakerOpen(operationName: string): void {
    const metrics = this.getOrCreateMetrics(operationName);
    metrics.circuitBreakerOpens++;
  }

  private getOrCreateMetrics(operationName: string): OperationMetrics {
    if (!this.operations.has(operationName)) {
      this.operations.set(operationName, {
        successes: 0,
        retryableErrors: 0,
        nonRetryableErrors: 0,
        totalAttempts: 0,
        totalTime: 0,
        circuitBreakerOpens: 0,
        lastSuccess: null,
        lastError: null,
      });
    }
    return this.operations.get(operationName)!;
  }

  getMetrics(operationName?: string): Map<string, OperationMetrics> | OperationMetrics {
    if (operationName) {
      return this.getOrCreateMetrics(operationName);
    }
    return this.operations;
  }

  reset(operationName?: string): void {
    if (operationName) {
      this.operations.delete(operationName);
    } else {
      this.operations.clear();
    }
  }
}

// Type definitions
export interface CircuitBreakerStatus {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailureTime: number;
  failureThreshold: number;
  recoveryTimeout: number;
}

export interface OperationMetrics {
  successes: number;
  retryableErrors: number;
  nonRetryableErrors: number;
  totalAttempts: number;
  totalTime: number;
  circuitBreakerOpens: number;
  lastSuccess: number | null;
  lastError: {
    message: string;
    timestamp: number;
    attempt: number;
  } | null;
}

// Global retry manager instance
let globalRetryManager: AutosaveRetryManager | null = null;

/**
 * Get or create the global retry manager
 */
export function getGlobalRetryManager(config?: Partial<RetryConfig>): AutosaveRetryManager {
  if (!globalRetryManager) {
    globalRetryManager = new AutosaveRetryManager(config);
  }
  return globalRetryManager;
}

/**
 * Execute operation with retry using global manager
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'autosave',
  config?: Partial<RetryConfig>
): Promise<RetryResult<T>> {
  const retryManager = getGlobalRetryManager(config);
  return retryManager.executeWithRetry(operation, operationName, config);
}