import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import { Logger } from '../utils/Logger.js';

/**
 * BrowserManager - Singleton class for browser management
 * Handles browser initialization, context creation, and cleanup
 */
export class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  private constructor() { }

  /**
   * Get singleton instance
   */
  public static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  /**
   * Initialize browser with optional scenario name for video recording
   */
  async initializeBrowser(scenarioName?: string): Promise<BrowserContext> {
    if (!this.browser) {
      const isHeadless = process.env.HEADLESS === 'true';
      // Use higher slowMo in headless mode for better video recording quality
      // In headless mode, actions happen too fast for video to capture properly
      const slowMoValue = isHeadless ? 200 : 50;

      this.browser = await chromium.launch({
        headless: isHeadless,
        slowMo: slowMoValue,
        args: [
          '--start-maximized',
          // Improve headless video quality
          ...(isHeadless ? [
            '--disable-gpu-vsync',
            '--run-all-compositor-stages-before-draw',
            '--disable-features=PaintHolding',
          ] : []),
        ],
      });
      Logger.info(`Browser launched: headless=${isHeadless}, slowMo=${slowMoValue}ms`);
    }

    // Use original videos/ directory so dashboard history keeps working
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: 'videos/',
        size: { width: 1920, height: 1080 }
      }
    });

    return this.context;
  }

  /**
   * Create new page with optional scenario name
   */
  async createPage(scenarioName?: string): Promise<Page> {
    if (!this.context) {
      await this.initializeBrowser(scenarioName);
    }
    const page = await this.context!.newPage();

    // Set consistent viewport for video recording
    await page.setViewportSize({ width: 1920, height: 1080 });

    return page;
  }

  /**
   * Close current context
   */
  async closeContext(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
  }

  /**
   * Close browser completely
   */
  async closeBrowser(): Promise<void> {
    await this.closeContext();
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
