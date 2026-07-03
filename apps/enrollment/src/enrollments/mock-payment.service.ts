import { Injectable, Logger } from '@nestjs/common';

export interface MockPaymentResult {
  success: boolean;
  reason?: string;
}

/**
 * Stand-in for a real payment gateway. Deterministic on purpose:
 * `simulateFailure` is the only way a charge fails, so demos are
 * reproducible.
 */
@Injectable()
export class MockPaymentService {
  private readonly logger = new Logger(MockPaymentService.name);

  /** Simulated gateway latency in ms. */
  static readonly PROCESSING_DELAY_MS = 500;

  async charge(
    amount: number,
    simulateFailure = false,
  ): Promise<MockPaymentResult> {
    await new Promise((resolve) =>
      setTimeout(resolve, MockPaymentService.PROCESSING_DELAY_MS),
    );
    if (simulateFailure) {
      this.logger.warn(`Mock charge of ${amount} failed (simulated)`);
      return { success: false, reason: 'Simulated card decline' };
    }
    this.logger.log(`Mock charge of ${amount} succeeded`);
    return { success: true };
  }
}
