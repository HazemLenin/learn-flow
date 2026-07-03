import { withRetry } from './retry';

describe('withRetry', () => {
  const sleep = jest.fn(() => Promise.resolve());

  beforeEach(() => sleep.mockClear());

  it('returns immediately on first success without sleeping', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    await expect(
      withRetry(fn, { maxAttempts: 3, baseDelayMs: 1000, sleep }),
    ).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('retries with exponential backoff (1s, 2s) then succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue('ok');

    await expect(
      withRetry(fn, { maxAttempts: 3, baseDelayMs: 1000, sleep }),
    ).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[1000], [2000]]);
  });

  it('throws the last error after exhausting attempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('permanent'));
    await expect(
      withRetry(fn, { maxAttempts: 3, baseDelayMs: 1000, sleep }),
    ).rejects.toThrow('permanent');
    expect(fn).toHaveBeenCalledTimes(3);
    // No sleep after the final attempt.
    expect(sleep).toHaveBeenCalledTimes(2);
  });
});
