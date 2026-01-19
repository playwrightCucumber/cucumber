import { Page, Locator } from '@playwright/test';
import { TimeoutHelper } from '../utils/TimeoutHelper.js';

/**
 * BasePage class - Foundation for all Page Objects
 * Implements common functionality and provides reusable methods
 *
 * Following OOP principles:
 * - Encapsulation: Private methods for internal logic
 * - Inheritance: Child pages extend this base class
 * - Abstraction: Hides complex Playwright operations
 */
export class BasePage {
  protected page: Page;
  protected timeout: number = parseInt(process.env.TIMEOUT || '30000');
  protected timeoutHelper: TimeoutHelper;

  constructor(page: Page) {
    this.page = page;
    this.timeoutHelper = new TimeoutHelper(page, this.timeout);
  }

  /**
   * Get TimeoutHelper instance for advanced timeout operations
   */
  get helper(): TimeoutHelper {
    return this.timeoutHelper;
  }

  /**
   * Navigate to a specific URL (safe version with timeout handling)
   */
  async navigateTo(url: string): Promise<void> {
    await this.timeoutHelper.navigateSafely(url);
  }

  /**
   * Click on an element with wait and error handling
   */
  async clickElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: this.timeout });
    await locator.click();
  }

  /**
   * Click element by selector with retry logic
   */
  async clickWithRetry(selector: string, retries: number = 3): Promise<boolean> {
    return this.timeoutHelper.clickWithRetry(selector, { retries });
  }

  /**
   * Fill text into an input field
   */
  async fillInput(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: this.timeout });
    await locator.clear();
    await locator.fill(value);
  }

  /**
   * Fill input by selector with retry logic and verification
   */
  async fillWithRetry(selector: string, value: string, retries: number = 3): Promise<boolean> {
    return this.timeoutHelper.fillWithRetry(selector, value, { retries, verify: true });
  }

  /**
   * Get text from an element
   */
  async getText(locator: Locator): Promise<string> {
    await locator.waitFor({ state: 'visible', timeout: this.timeout });
    return await locator.textContent() || '';
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: this.timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for element to be hidden
   */
  async waitForElementHidden(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout: this.timeout });
  }

  /**
   * Select dropdown option
   */
  async selectDropdown(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: this.timeout });
    await locator.selectOption(value);
  }

  /**
   * Hover over element
   */
  async hoverElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: this.timeout });
    await locator.hover();
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  /**
   * Wait for specified time (use sparingly)
   */
  async waitFor(milliseconds: number): Promise<void> {
    await this.page.waitForTimeout(milliseconds);
  }

  /**
   * Wait for network idle safely (won't hang forever)
   */
  async waitForNetworkIdle(timeout: number = 15000): Promise<boolean> {
    return this.timeoutHelper.waitForNetworkIdleSafely(timeout);
  }

  /**
   * Wait for API response
   */
  async waitForAPI(endpoint: string, statusCode: number = 200): Promise<boolean> {
    const response = await this.timeoutHelper.waitForAPI(endpoint, { statusCode });
    return response !== null;
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  async getUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Retry any action with configurable options
   */
  async retry<T>(action: () => Promise<T>, retries: number = 3): Promise<T> {
    return this.timeoutHelper.retry(action, { retries });
  }

  /**
   * Poll until condition is true
   */
  async pollUntil(condition: () => Promise<boolean>, timeout: number = 30000): Promise<boolean> {
    return this.timeoutHelper.pollUntil(condition, { timeout });
  }
}
