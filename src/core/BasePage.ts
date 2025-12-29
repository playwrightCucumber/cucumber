import { Page, Locator } from '@playwright/test';

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

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL
   */
  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  /**
   * Click on an element with wait and error handling
   */
  async clickElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: this.timeout });
    await locator.click();
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
}
