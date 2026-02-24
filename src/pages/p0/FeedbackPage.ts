import { Page } from '@playwright/test';
import { Logger } from '../../utils/Logger.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';
import { FeedbackSelectors, FeedbackUrls } from '../../selectors/p0/feedback.selectors.js';

export interface FeedbackData {
  subject?: string;
  category?: string;
  message: string;
  email?: string;
  name?: string;
  phone?: string;
  rating?: number;
}

export class FeedbackPage {
  private readonly page: Page;
  private readonly logger = new Logger('FeedbackPage');

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Click on Request button in sidebar to open the menu
   */
  async clickRequestButton(): Promise<void> {
    this.logger.info('Clicking Request button in sidebar');
    await this.page.locator(FeedbackSelectors.sidebar.requestButton).first().click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Select Feedback from the request menu dropdown
   */
  async selectFeedbackFromMenu(): Promise<void> {
    this.logger.info('Selecting Feedback from request menu');
    await this.page.locator(FeedbackSelectors.sidebar.feedbackMenuItem).click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await NetworkHelper.waitForApiRequestsComplete(this.page, 5000);
  }

  /**
   * Navigate to feedback page via sidebar request menu
   */
  async navigateViaRequestMenu(): Promise<void> {
    this.logger.info('Navigating to Feedback page via Request menu');
    await this.clickRequestButton();
    await this.selectFeedbackFromMenu();
    this.logger.success('Navigated to Feedback page');
  }

  /**
   * Wait for feedback page to be loaded
   */
  async waitForPageLoad(): Promise<void> {
    this.logger.info('Waiting for Feedback page to load');
    try {
      await this.page.waitForURL(new RegExp(FeedbackUrls.feedbackPattern), { timeout: 15000 });
    } catch {
      this.logger.warn('URL pattern not matched, checking for page heading');
    }
    await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    await NetworkHelper.waitForApiRequestsComplete(this.page, 3000);
    this.logger.success('Feedback page loaded');
  }

  /**
   * Check if feedback page is displayed
   */
  async isOnFeedbackPage(): Promise<boolean> {
    try {
      const heading = this.page.locator(FeedbackSelectors.feedbackPage.heading);
      return await heading.isVisible({ timeout: 5000 });
    } catch {
      return false;
    }
  }

  /**
   * Fill subject/title field
   */
  async fillSubject(subject: string): Promise<void> {
    this.logger.info(`Filling subject: ${subject}`);
    const subjectInput = this.page.locator(FeedbackSelectors.form.subjectInput);
    await subjectInput.click();
    await this.page.waitForTimeout(200);
    await subjectInput.fill(subject);
  }

  /**
   * Select category from dropdown
   */
  async selectCategory(category: string): Promise<void> {
    this.logger.info(`Selecting category: ${category}`);
    const categorySelect = this.page.locator(FeedbackSelectors.form.categorySelect);
    await categorySelect.click();
    await this.page.waitForTimeout(300);
    await this.page.locator(FeedbackSelectors.form.categoryOption(category)).click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Fill message/description textarea
   */
  async fillMessage(message: string): Promise<void> {
    this.logger.info('Filling message/description');
    const messageInput = this.page.locator(FeedbackSelectors.form.messageInput);
    await messageInput.click();
    await this.page.waitForTimeout(200);
    await messageInput.fill(message);
  }

  /**
   * Fill email field (if visible)
   */
  async fillEmail(email: string): Promise<void> {
    const emailInput = this.page.locator(FeedbackSelectors.form.emailInput);
    if (await emailInput.isVisible({ timeout: 2000 })) {
      this.logger.info(`Filling email: ${email}`);
      await emailInput.click();
      await this.page.waitForTimeout(200);
      await emailInput.fill(email);
    }
  }

  /**
   * Fill name field (if visible)
   */
  async fillName(name: string): Promise<void> {
    const nameInput = this.page.locator(FeedbackSelectors.form.nameInput);
    if (await nameInput.isVisible({ timeout: 2000 })) {
      this.logger.info(`Filling name: ${name}`);
      await nameInput.click();
      await this.page.waitForTimeout(200);
      await nameInput.fill(name);
    }
  }

  /**
   * Fill phone field (if visible)
   */
  async fillPhone(phone: string): Promise<void> {
    const phoneInput = this.page.locator(FeedbackSelectors.form.phoneInput);
    if (await phoneInput.isVisible({ timeout: 2000 })) {
      this.logger.info(`Filling phone: ${phone}`);
      await phoneInput.click();
      await this.page.waitForTimeout(200);
      await phoneInput.fill(phone);
    }
  }

  /**
   * Set rating stars (if visible)
   */
  async setRating(rating: number): Promise<void> {
    const ratingElement = this.page.locator(FeedbackSelectors.form.ratingStars);
    if (await ratingElement.isVisible({ timeout: 2000 })) {
      this.logger.info(`Setting rating: ${rating}`);
      await this.page.locator(FeedbackSelectors.form.ratingStar(rating)).click();
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Fill the feedback form with provided data
   */
  async fillFeedbackForm(data: FeedbackData): Promise<void> {
    this.logger.info('Filling feedback form');

    // Fill subject if provided
    if (data.subject) {
      await this.fillSubject(data.subject);
    }

    // Select category if provided
    if (data.category) {
      await this.selectCategory(data.category);
    }

    // Fill message (required)
    await this.fillMessage(data.message);

    // Fill optional fields if provided
    if (data.email) {
      await this.fillEmail(data.email);
    }

    if (data.name) {
      await this.fillName(data.name);
    }

    if (data.phone) {
      await this.fillPhone(data.phone);
    }

    if (data.rating) {
      await this.setRating(data.rating);
    }

    this.logger.success('Feedback form filled successfully');
  }

  /**
   * Check if submit button is visible and enabled
   */
  async isSubmitButtonEnabled(): Promise<boolean> {
    const submitButton = this.page.locator(FeedbackSelectors.actions.submitButton);
    try {
      await submitButton.waitFor({ state: 'visible', timeout: 5000 });
      const isDisabled = await submitButton.isDisabled();
      return !isDisabled;
    } catch {
      return false;
    }
  }

  /**
   * Click submit button to submit feedback
   */
  async clickSubmitButton(): Promise<void> {
    this.logger.info('Clicking Submit button');
    const submitButton = this.page.locator(FeedbackSelectors.actions.submitButton);
    await submitButton.waitFor({ state: 'visible', timeout: 10000 });
    await submitButton.click();
    this.logger.info('Submit button clicked');
  }

  /**
   * Wait for and verify success message
   */
  async waitForSuccessMessage(): Promise<boolean> {
    this.logger.info('Waiting for success message');
    try {
      // Wait for any success indicator
      const successLocator = this.page.locator(FeedbackSelectors.confirmation.successMessage);
      await successLocator.first().waitFor({ state: 'visible', timeout: 15000 });
      this.logger.success('Success message displayed');
      return true;
    } catch {
      this.logger.warn('Success message not found, checking for confirmation text');
      try {
        const confirmationLocator = this.page.locator(FeedbackSelectors.confirmation.confirmationText);
        await confirmationLocator.first().waitFor({ state: 'visible', timeout: 5000 });
        this.logger.success('Confirmation text displayed');
        return true;
      } catch {
        this.logger.error('No success indicator found');
        return false;
      }
    }
  }

  /**
   * Get success message text
   */
  async getSuccessMessageText(): Promise<string | null> {
    try {
      const successElement = this.page.locator(FeedbackSelectors.confirmation.successMessage).first();
      if (await successElement.isVisible({ timeout: 3000 })) {
        return await successElement.textContent();
      }
    } catch {
      this.logger.debug('Could not get success message text');
    }
    return null;
  }

  /**
   * Click OK/Close button on success dialog (if present)
   */
  async closeSuccessDialog(): Promise<void> {
    const okButton = this.page.locator(FeedbackSelectors.confirmation.okButton);
    if (await okButton.isVisible({ timeout: 3000 })) {
      this.logger.info('Closing success dialog');
      await okButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Get error message if displayed
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      const errorElement = this.page.locator(FeedbackSelectors.errors.errorMessage).first();
      if (await errorElement.isVisible({ timeout: 3000 })) {
        return await errorElement.textContent();
      }
    } catch {
      this.logger.debug('No error message found');
    }
    return null;
  }

  /**
   * Click cancel button
   */
  async clickCancelButton(): Promise<void> {
    this.logger.info('Clicking Cancel button');
    await this.page.locator(FeedbackSelectors.actions.cancelButton).click();
  }

  /**
   * Complete feedback submission flow
   */
  async submitFeedback(data: FeedbackData): Promise<boolean> {
    this.logger.info('Starting feedback submission flow');

    // Fill the form
    await this.fillFeedbackForm(data);

    // Verify submit button is enabled
    const isSubmitEnabled = await this.isSubmitButtonEnabled();
    if (!isSubmitEnabled) {
      this.logger.error('Submit button is not enabled');
      return false;
    }

    // Click submit
    await this.clickSubmitButton();

    // Wait for success
    const isSuccess = await this.waitForSuccessMessage();

    // Close dialog if present
    await this.closeSuccessDialog();

    return isSuccess;
  }
}
