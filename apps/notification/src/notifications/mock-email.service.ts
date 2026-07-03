import { Injectable, Logger } from '@nestjs/common';

/**
 * Stand-in for an email provider. Deterministic failure hook: any
 * address containing "fail" always throws, so retries exhaust and the
 * instructor-summary path is demoable (see seed data in Catalog).
 */
@Injectable()
export class MockEmailService {
  private readonly logger = new Logger(MockEmailService.name);

  async send(to: string, subject: string, body: string): Promise<void> {
    if (to.includes('fail')) {
      throw new Error(`SMTP rejected recipient ${to} (simulated)`);
    }
    this.logger.log(`📧 -> ${to} | ${subject} | ${body}`);
  }
}
