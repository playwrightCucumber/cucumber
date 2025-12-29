import { Page } from '@playwright/test';
import { Logger } from '../../utils/Logger.js';
import { LoginSelectors, LoginUrls } from '../../selectors/p0/login.selectors.js';

export class LoginPage {
  private readonly page: Page;
  private readonly logger = new Logger('LoginPage');

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    this.logger.info('Navigating to login page');
    await this.page.goto(`https://staging.chronicle.rip${LoginUrls.loginPage}`);
    await this.page.waitForLoadState('networkidle');
  }

  async enterEmail(email: string): Promise<void> {
    this.logger.info(`Entering email: ${email}`);
    // Click first to enable the input (it's readonly initially)
    await this.page.locator(LoginSelectors.emailInput).click();
    await this.page.locator(LoginSelectors.emailInput).fill(email);
  }

  async enterPassword(password: string): Promise<void> {
    this.logger.info('Entering password');
    // Click first to enable the input (it's readonly initially)
    await this.page.locator(LoginSelectors.passwordInput).click();
    await this.page.locator(LoginSelectors.passwordInput).fill(password);
  }

  async clickLoginButton(): Promise<void> {
    this.logger.info('Clicking login button');
    await this.page.locator(LoginSelectors.loginButton).click();
  }

  async isLoginButtonEnabled(): Promise<boolean> {
    const isDisabled = await this.page.locator(LoginSelectors.loginButton).isDisabled();
    return !isDisabled;
  }

  async getErrorMessage(): Promise<string | null> {
    try {
      const errorElement = this.page.locator(LoginSelectors.errorMessage).first();
      if (await errorElement.isVisible({ timeout: 3000 })) {
        return await errorElement.textContent();
      }
    } catch (error) {
      this.logger.debug('No error message found');
    }
    return null;
  }

  async waitForSuccessfulLogin(): Promise<void> {
    this.logger.info('Waiting for successful login');
    // Wait for redirect to dashboard
    await this.page.waitForURL(new RegExp(LoginUrls.dashboardPattern), { timeout: 15000 });
    await this.page.waitForLoadState('networkidle');
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      // Check if we're on the dashboard URL
      const url = this.page.url();
      return url.includes(LoginUrls.dashboardPattern);
    } catch (error) {
      return false;
    }
  }

  async getOrganizationName(): Promise<string | null> {
    try {
      const orgElement = this.page.locator(LoginSelectors.organizationName).first();
      if (await orgElement.isVisible({ timeout: 5000 })) {
        return await orgElement.textContent();
      }
    } catch (error) {
      this.logger.error('Organization name not found');
    }
    return null;
  }

  async getUserEmail(): Promise<string | null> {
    try {
      const emailElement = this.page.locator(LoginSelectors.userEmail).first();
      if (await emailElement.isVisible({ timeout: 5000 })) {
        return await emailElement.textContent();
      }
    } catch (error) {
      this.logger.error('User email not found');
    }
    return null;
  }
}
