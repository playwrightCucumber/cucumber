import { chromium, Browser, BrowserContext, Page } from '@playwright/test';

/**
 * BrowserManager - Singleton class for browser management
 * Handles browser initialization, context creation, and cleanup
 */
export class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  private constructor() {}

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
      this.browser = await chromium.launch({
        headless: isHeadless,
        slowMo: 50, // Slow down actions for better visibility
        args: ['--start-maximized'], // Open browser maximized
      });
    }

    // Always create fresh context for each scenario
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const sanitizedName = scenarioName 
      ? scenarioName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)
      : 'test';
    
    this.context = await this.browser.newContext({
      viewport: null, // Disable fixed viewport to allow fullscreen
      recordVideo: {
        dir: 'videos/',
        size: { width: 1920, height: 1080 }
      }
    });

    // Store scenario name for video file naming
    (this.context as any)._scenarioName = `${sanitizedName}_${timestamp}`;

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
    
    // Maximize the page window
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
