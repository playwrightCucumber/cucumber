import { Page, expect } from '@playwright/test';
import { IntermentSelectors } from '../../selectors/p0/interment.selectors.js';
import { Logger } from '../../utils/Logger.js';

export interface IntermentData {
  firstName: string;
  lastName: string;
  middleName?: string;
  title?: string;
  gender?: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  age?: string;
  religion?: string;
  causeOfDeath?: string;
  occupation?: string;
  specialBadge?: string;
  intermentType: string;
  intermentDepth?: string;
  intermentDate?: string;
  cremationLocation?: string;
  containerType?: string;
}

export class IntermentPage {
  readonly page: Page;
  private logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger('IntermentPage');
  }

  /**
   * Click Add Interment button from plot detail page
   */
  async clickAddIntermentButton(): Promise<void> {
    this.logger.info('Clicking Add Interment button');

    // Support multiple entry points:
    // 1. Plot detail page (/plots/{uuid})          → plot-details-edit-button-add-interment-btn
    // 2. Edit plot form, occupied plot (has items)  → plot-edit-button-adding
    // 3. Edit plot form, vacant plot (empty list)   → plot-edit-div-interments > plus-item-button-plus-button-0
    const detailPageBtn = this.page.locator(IntermentSelectors.addIntermentButton);
    const editFormBtnOccupied = this.page.locator('[data-testid="plot-edit-button-adding"]');
    const editFormBtnVacant = this.page.locator('[data-testid="plot-edit-div-interments"] [data-testid="plus-item-button-plus-button-0"]');

    const isDetailVisible = await detailPageBtn.isVisible({ timeout: 3000 }).catch(() => false);
    const isOccupiedFormVisible = !isDetailVisible
      ? await editFormBtnOccupied.isVisible({ timeout: 2000 }).catch(() => false)
      : false;

    if (isDetailVisible) {
      this.logger.info('Using detail page Add Interment button');
      await detailPageBtn.click();
    } else if (isOccupiedFormVisible) {
      this.logger.info('Using edit form Add Interment button (occupied plot)');
      await editFormBtnOccupied.click();
    } else {
      this.logger.info('Using edit form Add Interment button (vacant plot)');
      await editFormBtnVacant.waitFor({ state: 'visible', timeout: 10000 });
      await editFormBtnVacant.click();
    }

    // Wait for navigation to Add Interment form
    try {
      await this.page.waitForURL(url => url.href.includes('/manage/add/interment'), { timeout: 15000 });
      this.logger.info('✓ Navigated to Add Interment form');
    } catch (e) {
      const currentUrl = this.page.url();
      this.logger.info(`Current URL after click: ${currentUrl}`);
      if (currentUrl.includes('/manage/')) {
        this.logger.info('On a manage page, proceeding...');
      } else {
        throw new Error(`Failed to navigate to Add Interment form. Current URL: ${currentUrl}`);
      }
    }

    await this.page.waitForTimeout(3000);
    this.logger.success('Add Interment form loaded');
  }

  /**
   * Fill interment form with deceased person and interment details
   * @param data - Interment data object
   */
  async fillIntermentForm(data: IntermentData): Promise<void> {
    this.logger.info('Filling interment form');

    // Wait for form fields to be visible (production needs more time)
    await this.page.waitForTimeout(3000);
    
    // Fill Deceased Person section - required fields
    this.logger.info(`Filling first name: ${data.firstName}`);
    const firstNameField = this.page.getByLabel('First name').first();
    await firstNameField.waitFor({ state: 'visible', timeout: 10000 });
    await firstNameField.click(); // Click to focus
    await firstNameField.fill(data.firstName);
    await this.page.waitForTimeout(500);

    this.logger.info(`Filling last name: ${data.lastName}`);
    const lastNameField = this.page.getByLabel('Last name').first();
    await lastNameField.waitFor({ state: 'visible', timeout: 10000 });
    await lastNameField.click();
    await lastNameField.fill(data.lastName);
    await this.page.waitForTimeout(500);

    // Fill optional fields if provided
    if (data.middleName) {
      this.logger.info(`Filling middle name: ${data.middleName}`);
      await this.page.getByLabel('Middle name').first().fill(data.middleName);
    }

    if (data.title) {
      this.logger.info(`Filling title: ${data.title}`);
      await this.page.getByLabel('Title').first().fill(data.title);
    }

    if (data.dateOfBirth) {
      this.logger.info(`Filling date of birth: ${data.dateOfBirth}`);
      await this.page.getByLabel('Date of Birth').first().fill(data.dateOfBirth);
    }

    if (data.dateOfDeath) {
      this.logger.info(`Filling date of death: ${data.dateOfDeath}`);
      await this.page.getByLabel('Date of Death').first().fill(data.dateOfDeath);
    }

    if (data.age) {
      this.logger.info(`Filling age: ${data.age}`);
      await this.page.getByLabel('Age').first().fill(data.age);
    }

    if (data.causeOfDeath) {
      this.logger.info(`Filling cause of death: ${data.causeOfDeath}`);
      await this.page.getByLabel('Cause of death').first().fill(data.causeOfDeath);
    }

    if (data.occupation) {
      this.logger.info(`Filling occupation: ${data.occupation}`);
      await this.page.getByLabel('Occupation').first().fill(data.occupation);
    }

    // Scroll to Interment Details section
    await this.page.evaluate('window.scrollTo(0, 400)');
    await this.page.waitForTimeout(500);

    // Fill Interment Details section - required field
    this.logger.info(`Selecting interment type: ${data.intermentType}`);
    await this.selectIntermentType(data.intermentType);

    // Fill optional interment details
    if (data.intermentDepth) {
      this.logger.info(`Filling interment depth: ${data.intermentDepth}`);
      await this.page.getByLabel('Interment depth').first().fill(data.intermentDepth);
    }

    if (data.intermentDate) {
      this.logger.info(`Filling interment date: ${data.intermentDate}`);
      await this.page.getByLabel('Interment Date').first().fill(data.intermentDate);
    }

    this.logger.success('Interment form filled');
  }

  /**
   * Select interment type from dropdown
   * @param type - Interment type (Burial, Cremated, Entombment, Memorial, Unspecified)
   */
  async selectIntermentType(type: string): Promise<void> {
    this.logger.info(`Selecting interment type: ${type}`);
    
    // Click dropdown using getByLabel
    await this.page.getByLabel('Interment type').click();
    await this.page.waitForTimeout(500); // Wait for dropdown to open
    
    // Select option
    await this.page.getByRole('option', { name: type }).click();
    await this.page.waitForTimeout(500);
    
    this.logger.success(`Interment type ${type} selected`);
  }

  /**
   * Save the interment and wait for redirect
   */
  async saveInterment(): Promise<void> {
    this.logger.info('Saving interment');

    await this.page.click(IntermentSelectors.saveButton);

    // After save, redirect can go to:
    // 1. /plots/{uuid}        — when coming from plot detail page
    // 2. /manage/edit/plot    — when coming from edit plot form (backTo parameter)
    await this.page.waitForURL(
      url => url.href.includes('/plots/') || url.href.includes('/manage/edit/plot'),
      { timeout: 35000 }
    );
    await this.page.waitForTimeout(2000);

    // If landed on edit form, navigate to plot detail page for verification
    const currentUrl = this.page.url();
    if (currentUrl.includes('/manage/edit/plot')) {
      this.logger.info('Redirected to edit form — clicking Cancel to navigate to plot detail');
      // Wait for edit form to stabilize after backTo redirect before clicking Cancel
      await this.page.waitForTimeout(5000);
      const cancelBtn = this.page.locator('[data-testid="toolbar-manage-button-toolbar-button"]');
      await cancelBtn.waitFor({ state: 'visible', timeout: 8000 });
      await cancelBtn.click();
      // Use waitUntil:'commit' — SPA router navigation does not fire a 'load' event
      await this.page.waitForURL(url => url.href.includes('/plots/'), { timeout: 20000, waitUntil: 'commit' });
      await this.page.waitForTimeout(3000);
    }

    this.logger.success('Interment saved and on plot detail page');
  }

  /**
   * Click INTERMENTS tab on plot detail page
   */
  async clickIntermentsTab(): Promise<void> {
    this.logger.info('Clicking INTERMENTS tab');
    
    // Wait for tab to be visible first
    const intermentsTab = this.page.getByRole('tab', { name: /INTERMENTS/i });
    await intermentsTab.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);
    
    // Click the tab
    await intermentsTab.click();
    this.logger.info('INTERMENTS tab clicked, waiting for content to load...');
    
    // Wait for tab to be selected
    await this.page.waitForTimeout(2000);
    
    // Verify tab is selected
    const isSelected = await intermentsTab.getAttribute('aria-selected');
    if (isSelected === 'true') {
      this.logger.success('INTERMENTS tab selected successfully');
    } else {
      this.logger.info('Retrying tab click...');
      await intermentsTab.click();
      await this.page.waitForTimeout(2000);
    }
    
    // Wait for content to stabilize
    await this.page.waitForTimeout(3000);
    this.logger.success('INTERMENTS tab clicked');
  }

  /**
   * Verify deceased person appears in INTERMENTS tab
   * @param fullName - Full name of deceased (e.g., "John Doe")
   */
  async verifyDeceasedInTab(fullName: string): Promise<void> {
    this.logger.info(`Verifying deceased "${fullName}" appears in INTERMENTS tab`);
    
    // Check if we're already on INTERMENTS tab by looking for the tab
    const intermentsTab = this.page.getByRole('tab', { name: /INTERMENTS/i });
    const isSelected = await intermentsTab.getAttribute('aria-selected');
    
    // If not already selected, click it
    if (isSelected !== 'true') {
      this.logger.info('Clicking INTERMENTS tab');
      await this.clickIntermentsTab();
    } else {
      this.logger.info('Already on INTERMENTS tab');
      await this.page.waitForTimeout(2000); // Wait for content to stabilize
    }
    
    // Wait for page to load (longer for production)
    await this.page.waitForTimeout(3000);
    
    // Verify deceased name appears in collapsed interment list
    const deceasedHeading = this.page.locator(IntermentSelectors.deceasedNameHeading(fullName));
    await expect(deceasedHeading).toBeVisible({ timeout: 20000 });

    // Expand the specific interment item for this person so type can be verified next
    const intermentItem = this.page.locator('[data-testid="div-unknown-interment"]')
      .filter({ has: this.page.locator(IntermentSelectors.deceasedNameHeading(fullName)) });
    if (await intermentItem.count() > 0) {
      const header = intermentItem.locator('mat-expansion-panel-header').first();
      if (await header.isVisible()) {
        const isExpanded = await header.getAttribute('aria-expanded');
        if (isExpanded !== 'true') {
          await header.click();
          await this.page.locator('mat-expansion-panel.mat-expanded').waitFor({ state: 'attached', timeout: 5000 });
        }
      }
    }

    this.logger.success(`Deceased "${fullName}" found in INTERMENTS tab`);
  }

  /**
   * Verify interment type label
   * @param intermentType - Expected interment type (e.g., "Burial")
   */
  async verifyIntermentType(intermentType: string): Promise<void> {
    this.logger.info(`Verifying interment type: ${intermentType}`);

    const typeLabel = this.page.locator(IntermentSelectors.intermentTypeLabel(intermentType)).first();
    await expect(typeLabel).toBeVisible({ timeout: 10000 });

    this.logger.success(`Interment type ${intermentType} verified`);
  }

  /**
   * Add interment applicant person
   * This will open the person form in the right sidebar
   */
  async addIntermentApplicant(): Promise<void> {
    this.logger.info('Adding interment applicant');
    await this.page.click(IntermentSelectors.addIntermentApplicantButton);
    await this.page.waitForTimeout(1000);
    this.logger.success('Interment applicant form opened');
  }

  /**
   * Add next of kin person
   * This will open the person form in the right sidebar
   */
  async addNextOfKin(): Promise<void> {
    this.logger.info('Adding next of kin');
    await this.page.click(IntermentSelectors.addNextOfKinButton);
    await this.page.waitForTimeout(1000);
    this.logger.success('Next of kin form opened');
  }

  /**
   * Click INTERMENTS tab on plot detail page (for edit flow)
   */
  async clickIntermentTab(): Promise<void> {
    this.logger.info('Clicking INTERMENTS tab');

    // Wait for page to be ready - ensure tablist is loaded
    await this.page.waitForSelector('[role="tablist"]', { state: 'visible', timeout: 10000 });

    // Wait for tab to be visible first
    const intermentsTab = this.page.getByRole('tab', { name: /INTERMENTS/i });
    await intermentsTab.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);

    // Click the tab
    await intermentsTab.click();
    this.logger.info('INTERMENTS tab clicked, waiting for content to load...');

    // Wait for tab to be selected
    await this.page.waitForTimeout(2000);

    // Verify tab is selected
    const isSelected = await intermentsTab.getAttribute('aria-selected');
    if (isSelected === 'true') {
      this.logger.success('INTERMENTS tab selected successfully');
    } else {
      this.logger.info('Retrying tab click...');
      await intermentsTab.click();
      await this.page.waitForTimeout(2000);
    }

    // Wait for content to stabilize - wait for network to be idle
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
      // Network idle timeout is ok, continue
      this.logger.info('Network idle timeout, continuing...');
    }
    await this.page.waitForTimeout(2000);
    this.logger.success('INTERMENTS tab opened');
  }

  /**
   * Click Edit Interment button from INTERMENTS tab
   */
  async clickEditIntermentButton(): Promise<void> {
    this.logger.info('Clicking Edit Interment button');

    // Check if edit button is already visible (panel may already be expanded)
    const editButton = this.page.getByRole('button', { name: 'Edit interment' }).first();
    const isEditVisible = await editButton.isVisible().catch(() => false);

    if (!isEditVisible) {
      // Panel is collapsed — click to expand
      const firstInterment = this.page.locator('[data-testid="div-unknown-interment"]').first();
      await firstInterment.waitFor({ state: 'visible', timeout: 10000 });
      await firstInterment.click();
      await this.page.waitForTimeout(500);
    }

    // Wait for the edit button to become visible
    await editButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForTimeout(1000); // Wait for animations

    this.logger.info('Edit button found, clicking...');
    await editButton.click();
    
    // Wait for edit form to load
    try {
      await this.page.waitForURL('**/manage/edit/interment/**', { timeout: 15000 });
      this.logger.info('✓ Navigated to Edit Interment form');
    } catch (e) {
      const currentUrl = this.page.url();
      this.logger.info(`Current URL after click: ${currentUrl}`);
      if (!currentUrl.includes('/manage/edit/')) {
        throw new Error(`Failed to navigate to Edit form. Current URL: ${currentUrl}`);
      }
    }
    
    await this.page.waitForTimeout(3000); // Wait for form to fully load
    this.logger.success('Edit Interment form loaded');
  }

  /**
   * Update interment form with new data (for edit flow)
   * @param data - Interment data object with fields to update
   */
  async updateIntermentForm(data: Partial<IntermentData>): Promise<void> {
    this.logger.info('Updating interment form');

    // Click "Deceased person" tab to access the form fields
    await this.page.getByRole('button', { name: 'Deceased person' }).click();
    await this.page.waitForTimeout(1000);

    // Update first name if provided
    if (data.firstName) {
      this.logger.info(`Updating first name to: ${data.firstName}`);
      const firstNameField = this.page.getByLabel('First name').first();
      await firstNameField.click();
      await firstNameField.clear();
      await firstNameField.fill(data.firstName);
      await this.page.waitForTimeout(500);
    }

    // Update last name if provided
    if (data.lastName) {
      this.logger.info(`Updating last name to: ${data.lastName}`);
      const lastNameField = this.page.getByLabel('Last name').first();
      await lastNameField.click();
      await lastNameField.clear();
      await lastNameField.fill(data.lastName);
      await this.page.waitForTimeout(500);
    }

    // Clear middle name if both firstName and lastName are provided (full name replacement)
    if (data.firstName && data.lastName) {
      this.logger.info('Clearing middle name for clean full name');
      const middleNameField = this.page.getByLabel('Middle name').first();
      await middleNameField.click();
      await middleNameField.clear();
      await this.page.waitForTimeout(500);
    } else if (data.middleName !== undefined) {
      // Only update middle name if explicitly provided
      this.logger.info(`Updating middle name to: ${data.middleName}`);
      const middleNameField = this.page.getByLabel('Middle name').first();
      await middleNameField.click();
      await middleNameField.clear();
      if (data.middleName) {
        await middleNameField.fill(data.middleName);
      }
    }

    // Click "Interment details" tab if interment type needs to be updated
    if (data.intermentType) {
      await this.page.getByRole('button', { name: 'Interment details' }).click();
      await this.page.waitForTimeout(1000);
      
      this.logger.info(`Updating interment type to: ${data.intermentType}`);
      await this.selectIntermentType(data.intermentType);
    }

    this.logger.success('Interment form updated');
  }
}
