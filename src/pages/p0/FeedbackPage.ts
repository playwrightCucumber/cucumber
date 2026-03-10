import { Page, Locator } from '@playwright/test';
import { Logger } from '../../utils/Logger.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';
import { FeedbackSelectors } from '../../selectors/p0/feedback/index.js';

export interface FeedbackApplicantData {
  firstName: string;
  lastName: string;
  email: string;
  middleName?: string;
  gender?: string;
  title?: string;
  phoneMobile?: string;
  phoneHome?: string;
  phoneOffice?: string;
  address?: string;
  suburb?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

export interface FeedbackSubmissionData {
  applicant: FeedbackApplicantData;
  feedbackType: string;
  details: string;
}

export class FeedbackPage {
  private readonly page: Page;
  private readonly logger = new Logger('FeedbackPage');

  constructor(page: Page) {
    this.page = page;
  }

  // ============================================
  // PANEL HELPERS
  // ============================================

  private getPanel(index: number): Locator {
    return this.page.locator('mat-expansion-panel').nth(index);
  }

  private getPanelBody(index: number): Locator {
    return this.getPanel(index).locator('.mat-expansion-panel-body');
  }

  /**
   * Ensure a panel is expanded. If not, click its header to expand it.
   */
  private async ensurePanelExpanded(index: number): Promise<void> {
    const panel = this.getPanel(index);
    const body = this.getPanelBody(index);

    const isVisible = await body.isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) {
      this.logger.info(`Panel ${index} not expanded, clicking header to expand`);
      await panel.locator('mat-expansion-panel-header').click();
      await body.waitFor({ state: 'visible', timeout: 5000 });
    }
  }

  /**
   * Click continue button within the currently expanded section.
   * All continue buttons share the same data-testid, so we target
   * the visible one scoped to the panel body.
   */
  private async clickContinueInPanel(panelIndex: number): Promise<void> {
    const body = this.getPanelBody(panelIndex);
    const continueBtn = body.locator('button:has-text("continue")');
    await continueBtn.scrollIntoViewIfNeeded();
    await continueBtn.click();
  }

  // ============================================
  // NAVIGATION
  // ============================================

  async clickRequestsButton(): Promise<void> {
    this.logger.info('Clicking REQUESTS button in content area');
    await this.page.locator(FeedbackSelectors.navigation.requestsButton).click();
    await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 3000 });
  }

  async selectFeedbackFromMenu(): Promise<void> {
    this.logger.info('Selecting Feedback from menu');
    await this.page.locator(FeedbackSelectors.navigation.feedbackMenuItem).click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await NetworkHelper.waitForApiRequestsComplete(this.page, 5000);
  }

  async navigateToFeedback(): Promise<void> {
    this.logger.info('Navigating to Feedback page');
    await this.clickRequestsButton();
    await this.selectFeedbackFromMenu();
    this.logger.success('Navigated to Feedback page');
  }

  // ============================================
  // PAGE VERIFICATION
  // ============================================

  async isFeedbackPageDisplayed(): Promise<boolean> {
    try {
      const title = this.page.locator(FeedbackSelectors.page.title);
      return await title.isVisible({ timeout: 10000 });
    } catch {
      return false;
    }
  }

  async getFeedbackPageTitle(): Promise<string> {
    const title = this.page.locator(FeedbackSelectors.page.title);
    await title.waitFor({ state: 'visible', timeout: 10000 });
    return await title.textContent() || '';
  }

  // ============================================
  // SECTION 1: INSIGHTS (no fields, just continue)
  // ============================================

  async continueInsightsSection(): Promise<void> {
    this.logger.info('Section 1: Continuing past Insights');
    await this.ensurePanelExpanded(0);
    await this.clickContinueInPanel(0);
    this.logger.success('Section 1 completed');
  }

  // ============================================
  // SECTION 2: APPLICANT
  // ============================================

  private async fillFieldInPanel(panelIndex: number, selector: string, value: string): Promise<void> {
    const body = this.getPanelBody(panelIndex);
    const input = body.locator(selector);
    await input.click();
    await input.fill(value);
  }

  private async selectDropdownInPanel(panelIndex: number, selectSelector: string, optionText: string): Promise<void> {
    const body = this.getPanelBody(panelIndex);
    const select = body.locator(selectSelector);
    await select.click();
    const option = this.page.locator(`mat-option:has-text("${optionText}")`);
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
  }

  async fillApplicantForm(data: FeedbackApplicantData): Promise<void> {
    this.logger.info('Section 2: Filling applicant form');
    await this.ensurePanelExpanded(1);

    // Required fields
    await this.fillFieldInPanel(1, FeedbackSelectors.section2_applicant.firstName, data.firstName);
    await this.fillFieldInPanel(1, FeedbackSelectors.section2_applicant.lastName, data.lastName);
    await this.fillFieldInPanel(1, FeedbackSelectors.section2_applicant.email, data.email);

    // Optional fields
    if (data.middleName) {
      await this.fillFieldInPanel(1, FeedbackSelectors.section2_applicant.middleName, data.middleName);
    }
    if (data.gender) {
      await this.selectDropdownInPanel(1, FeedbackSelectors.section2_applicant.gender, data.gender);
    }
    if (data.title) {
      await this.fillFieldInPanel(1, FeedbackSelectors.section2_applicant.title, data.title);
    }
    if (data.phoneMobile) {
      await this.fillFieldInPanel(1, FeedbackSelectors.section2_applicant.phoneMobile, data.phoneMobile);
    }
    if (data.phoneHome) {
      await this.fillFieldInPanel(1, FeedbackSelectors.section2_applicant.phoneHome, data.phoneHome);
    }
    if (data.phoneOffice) {
      await this.fillFieldInPanel(1, FeedbackSelectors.section2_applicant.phoneOffice, data.phoneOffice);
    }
    if (data.address) {
      await this.fillFieldInPanel(1, FeedbackSelectors.section2_applicant.address, data.address);
    }
    if (data.suburb) {
      await this.fillFieldInPanel(1, FeedbackSelectors.section2_applicant.suburb, data.suburb);
    }
    if (data.state) {
      await this.fillFieldInPanel(1, FeedbackSelectors.section2_applicant.state, data.state);
    }
    if (data.country) {
      await this.fillFieldInPanel(1, FeedbackSelectors.section2_applicant.country, data.country);
    }
    if (data.postcode) {
      await this.fillFieldInPanel(1, FeedbackSelectors.section2_applicant.postcode, data.postcode);
    }

    this.logger.success('Applicant form filled');
  }

  async continueApplicantSection(): Promise<void> {
    this.logger.info('Section 2: Clicking continue');
    await this.clickContinueInPanel(1);
    this.logger.success('Section 2 completed');
  }

  // ============================================
  // SECTION 3: CATEGORY
  // ============================================

  async selectFeedbackCategory(type: string): Promise<void> {
    this.logger.info(`Section 3: Selecting feedback type "${type}"`);
    await this.ensurePanelExpanded(2);

    // Use the expanded panel's mat-select (more reliable than label matching)
    const body = this.getPanelBody(2);
    const select = body.locator('mat-select').first();
    await select.waitFor({ state: 'visible', timeout: 10000 });
    await select.click();
    const option = this.page.locator(FeedbackSelectors.section3_category.option(type));
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    this.logger.success(`Feedback type "${type}" selected`);
  }

  async continueCategorySection(): Promise<void> {
    this.logger.info('Section 3: Clicking continue');
    await this.clickContinueInPanel(2);
    this.logger.success('Section 3 completed');
  }

  // ============================================
  // SECTION 4: DETAILS
  // ============================================

  async fillDetails(message: string): Promise<void> {
    this.logger.info('Section 4: Filling feedback details');
    await this.ensurePanelExpanded(3);

    const body = this.getPanelBody(3);
    const textarea = body.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 10000 });
    await textarea.click();
    await textarea.fill(message);
    this.logger.success('Feedback details filled');
  }

  async continueDetailsSection(): Promise<void> {
    this.logger.info('Section 4: Clicking continue');
    await this.clickContinueInPanel(3);
    this.logger.success('Section 4 completed');
  }

  // ============================================
  // SECTION 5: THANKS (no fields, just continue)
  // ============================================

  async continueThanksSection(): Promise<void> {
    this.logger.info('Section 5: Continuing past Thanks');
    await this.ensurePanelExpanded(4);
    await this.clickContinueInPanel(4);
    this.logger.success('Section 5 completed');
  }

  // ============================================
  // SUBMIT
  // ============================================

  async isSubmitEnabled(): Promise<boolean> {
    const submitBtn = this.page.locator(FeedbackSelectors.page.submitButton);
    try {
      await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
      return !(await submitBtn.isDisabled());
    } catch {
      return false;
    }
  }

  async waitForSubmitEnabled(timeout: number = 10000): Promise<boolean> {
    try {
      const submitBtn = this.page.locator(FeedbackSelectors.page.submitButton);
      await submitBtn.waitFor({ state: 'visible', timeout });
      await submitBtn.waitFor({ state: 'attached', timeout });
      return !(await submitBtn.isDisabled());
    } catch {
      return false;
    }
  }

  async clickSubmitButton(): Promise<void> {
    this.logger.info('Clicking Submit Request button');
    const submitBtn = this.page.locator(FeedbackSelectors.page.submitButton);
    await submitBtn.waitFor({ state: 'visible', timeout: 10000 });
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    this.logger.success('Submit button clicked');
  }

  // ============================================
  // COMBINED FLOW
  // ============================================

  async submitFeedback(data: FeedbackSubmissionData): Promise<void> {
    this.logger.info('Starting full feedback submission flow');

    // Section 1: Insights - just continue
    await this.continueInsightsSection();

    // Section 2: Applicant - fill and continue
    await this.fillApplicantForm(data.applicant);
    await this.continueApplicantSection();

    // Section 3: Category - select and continue
    await this.selectFeedbackCategory(data.feedbackType);
    await this.continueCategorySection();

    // Section 4: Details - fill and continue
    await this.fillDetails(data.details);
    await this.continueDetailsSection();

    // Section 5: Thanks - continue
    await this.continueThanksSection();

    // Submit
    await this.waitForSubmitEnabled();
    await this.clickSubmitButton();

    this.logger.success('Feedback submission flow completed');
  }
}
