import { Page, Route } from '@playwright/test';
import { Logger } from './Logger.js';

/**
 * RequestThrottler - limits concurrent outgoing requests per page
 * to prevent Sentry / server-side rate limiting during test execution.
 *
 * How it works:
 *  - Intercepts every request via page.route
 *  - Allows at most maxConcurrent requests in-flight at once
 *  - Queues the rest and releases them as earlier requests finish
 *  - Adds a small minDelay between consecutive requests
 */
export class RequestThrottler {
  private static readonly MAX_CONCURRENT = 6;   // max parallel requests
  private static readonly MIN_DELAY_MS = 100;   // minimum gap between requests

  private inFlight = 0;
  private queue: Array<() => void> = [];
  private lastRequestTime = 0;
  private logger = new Logger('RequestThrottler');

  private constructor(
    private maxConcurrent: number,
    private minDelay: number,
  ) {}

  /**
   * Attach the throttler to a Playwright page.
   * Call once per page (typically in the Before hook).
   */
  static async attach(
    page: Page,
    options?: { maxConcurrent?: number; minDelay?: number },
  ): Promise<void> {
    const throttler = new RequestThrottler(
      options?.maxConcurrent ?? RequestThrottler.MAX_CONCURRENT,
      options?.minDelay ?? RequestThrottler.MIN_DELAY_MS,
    );

    await page.route('**/*', (route) => throttler.handle(route));
    throttler.logger.info(
      `Attached (max=${throttler.maxConcurrent}, delay=${throttler.minDelay}ms)`,
    );
  }

  private async handle(route: Route): Promise<void> {
    // If we're at capacity, wait in the queue
    if (this.inFlight >= this.maxConcurrent) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    // Enforce minimum gap between requests
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minDelay) {
      await new Promise((r) => setTimeout(r, this.minDelay - elapsed));
    }

    this.inFlight++;
    this.lastRequestTime = Date.now();

    try {
      await route.continue();
    } catch {
      // Route may have been disposed if the page navigated — safe to ignore
    } finally {
      this.inFlight--;
      // Release next queued request
      if (this.queue.length > 0) {
        const next = this.queue.shift()!;
        next();
      }
    }
  }
}
