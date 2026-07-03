export interface RetryOptions {
  maxAttempts: number;
  /** Delay before the first retry; doubles each attempt (1s, 2s, 4s…). */
  baseDelayMs: number;
  /** Injectable for tests. */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Runs `fn`, retrying with exponential backoff. Throws the last error
 * once maxAttempts is exhausted.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts, baseDelayMs, sleep = defaultSleep }: RetryOptions,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await sleep(baseDelayMs * 2 ** (attempt - 1));
      }
    }
  }
  throw lastError;
}
