import { Page, expect } from '@playwright/test';
import { IntermentSelectors } from '../../selectors/p0/interment/index.js';
import { Logger } from '../../utils/Logger.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';

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

  // ============================================================
  // FLOW 2: Add Interment via Advance Table (Tables → INTERMENTS tab)
  // Entry: Tables → INTERMENTS tab → "+ ADD INTERMENTS" button
  // URL: /customer-organization/advance-table/manage/add/interment-table/{id}
  // ============================================================

  /**
   * Navigate to Advance Table and switch to INTERMENTS tab
   */
  async navigateToAdvanceTableInterments(): Promise<void> {
    this.logger.info('Navigating to Advance Table INTERMENTS tab');
    // Extract base URL (e.g. https://aus.chronicle.rip) from current URL
    const baseUrl = this.page.url().match(/https?:\/\/[^/]+/)?.[0] || '';
    await this.page.goto(`${baseUrl}/customer-organization/advance-table?tab=interments`, { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('[data-testid="content-wrapper-button-add-plot"]', { state: 'visible', timeout: 15000 });
    this.logger.success('On Advance Table INTERMENTS tab');
  }

  /**
   * Click "+ ADD INTERMENTS" button from Advance Table INTERMENTS tab
   */
  async clickAddIntermentFromTable(): Promise<void> {
    this.logger.info('Clicking ADD INTERMENTS button from Advance Table');
    const addBtn = this.page.locator('[data-testid="content-wrapper-button-add-plot"]');
    await addBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addBtn.click();
    // Wait for the Add Interment form (different URL pattern from plot detail flow)
    await this.page.waitForURL('**/manage/add/interment-table/**', { timeout: 15000 });
    await this.page.getByLabel('First name').first().waitFor({ state: 'visible', timeout: 10000 });
    this.logger.success('Add Interment form loaded (from Advance Table)');
  }

  /**
   * Search and select a specific plot in the Add Interment form (Advance Table flow)
   * Uses the same search combobox pattern as ROI Table flow.
   * @param plotName - Plot name previously saved (e.g. "B G 2")
   */
  async selectPlotInIntermentForm(plotName: string): Promise<void> {
    this.logger.info(`Selecting plot "${plotName}" in interment form`);

    // The form has a plot search combobox with aria-label="Event Type"
    // Use CSS selector directly to avoid Angular dynamic aria-labelledby timing issues
    const plotCombobox = this.page.locator('mat-select[aria-label="Event Type"]').first();
    await plotCombobox.waitFor({ state: 'visible', timeout: 10000 });

    // Open the plot dropdown — try click then wait for search input.
    // In headless mode there can be a render delay before .mat-select-panel appears.
    // Strategy: click → wait up to 1s for search input → if not visible, try Space key.
    await plotCombobox.click();

    const searchInput = this.page.locator('[data-testid="input-start-typing-to-search"], [data-testid="input-start-typing-to-search-0"]').first();

    // Try waiting for search input; if it doesn't appear, use keyboard to open
    const inputVisible = await searchInput.isVisible().catch(() => false);
    if (!inputVisible) {
      await this.page.waitForTimeout(600);
      const stillNotVisible = !(await searchInput.isVisible().catch(() => false));
      if (stillNotVisible) {
        this.logger.info('Search input not visible after click, using Space key to open dropdown...');
        await plotCombobox.press('Space');
        await this.page.waitForTimeout(600);
      }
    }

    await searchInput.waitFor({ state: 'visible', timeout: 10000 });

    // Type plot name, then delete last char & retype to ensure Angular CDK triggers filtering.
    // This double-input trick forces Angular's change detection to re-evaluate the search.
    await searchInput.clear();
    await searchInput.type(plotName, { delay: 80 });
    await this.page.waitForTimeout(300);
    // Delete last character then retype it
    await searchInput.press('Backspace');
    await this.page.waitForTimeout(200);
    await searchInput.type(plotName.slice(-1), { delay: 80 });
    await this.page.waitForTimeout(500);

    // Select matching option with exact match to avoid strict mode violations
    // (e.g. "B G 1" would also match "B G 10", "B G 11" etc. without exact: true)
    const plotOption = this.page.getByRole('option', { name: plotName, exact: true });
    await plotOption.waitFor({ state: 'visible', timeout: 10000 });
    await plotOption.click();

    await NetworkHelper.waitForAnimation(this.page);
    this.logger.success(`Plot "${plotName}" selected in interment form`);
  }

  /**
   * @deprecated Use selectPlotInIntermentForm(plotName) instead
   */
  async selectVacantPlotInIntermentForm(): Promise<void> {
    this.logger.info('Selecting a vacant plot in interment form (deprecated method)');
    const options = this.page.locator('.cdk-overlay-pane mat-option');
    await options.first().waitFor({ state: 'visible', timeout: 10000 });
    await options.first().click();
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  // ============================================================
  // FLOW 4: Delete Interment
  // Entry: Edit Interment form → MORE menu → Delete → Confirm
  // ============================================================

  /**
   * Click the MORE menu button on the Edit Interment form
   * testid: "button-toolbar-button" (the first button in toolbar, which is MORE)
   */
  async clickMoreMenuOnIntermentForm(): Promise<void> {
    this.logger.info('Clicking MORE menu on interment form');
    const moreBtn = this.page.locator('button:has-text("MORE")').first();
    await moreBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moreBtn.click();
    // Wait for menu to appear
    await this.page.locator('[data-testid="button-toolbar-button-0"]').waitFor({ state: 'visible', timeout: 5000 });
    this.logger.success('MORE menu opened');
  }

  /**
   * Click Delete option from MORE menu
   * testid: "button-toolbar-button-0"
   */
  async clickDeleteIntermentOption(): Promise<void> {
    this.logger.info('Clicking Delete option from MORE menu');
    const deleteOption = this.page.locator('[data-testid="button-toolbar-button-0"]');
    await deleteOption.click();
    // Wait for confirmation dialog — testid can vary: "button-remove" or "button-remove-1"
    const confirmBtn = this.page.locator('[data-testid="button-remove"], [data-testid="button-remove-1"]').first();
    await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    this.logger.success('Delete confirmation dialog appeared');
  }

  /**
   * Confirm delete interment in dialog
   */
  async confirmDeleteInterment(): Promise<void> {
    this.logger.info('Confirming delete interment');
    // testid can vary: "button-remove" or "button-remove-1"
    const confirmBtn = this.page.locator('[data-testid="button-remove"], [data-testid="button-remove-1"]').first();
    await confirmBtn.click();
    // Wait briefly for delete API to complete
    await this.page.waitForTimeout(1500);
    await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 3000 });

    // After delete, navigate to plot detail (extract plot ID from current URL)
    // Current URL pattern: /customer-organization/{org}/{plotId}/manage/edit/interment/{id}
    const currentUrl = this.page.url();
    const plotMatch = currentUrl.match(/\/customer-organization\/([^/]+)\/([^/]+)\/manage\//);
    if (plotMatch) {
      const org = plotMatch[1];
      const plotId = decodeURIComponent(plotMatch[2]);
      const baseUrl = currentUrl.match(/https?:\/\/[^/]+/)?.[0] || '';
      const plotDetailUrl = `${baseUrl}/customer-organization/${org}/plots/${encodeURIComponent(plotId)}`;
      this.logger.info(`Navigating to plot detail: ${plotDetailUrl}`);
      await this.page.goto(plotDetailUrl, { waitUntil: 'domcontentloaded' });
      await NetworkHelper.waitForStabilization(this.page, { minWait: 1000, maxWait: 5000 });
    }
    this.logger.success(`Interment deleted, navigated to: ${this.page.url()}`);
  }

  /**
   * Verify plot status badge on plot detail page
   */
  async verifyPlotStatus(expectedStatus: string): Promise<void> {
    this.logger.info(`Verifying plot status is: ${expectedStatus}`);
    const statusBadge = this.page.locator('[data-testid*="badge-status"], [class*="badge-status"], [class*="status"]')
      .filter({ hasText: new RegExp(expectedStatus, 'i') })
      .first();
    await statusBadge.waitFor({ state: 'visible', timeout: 10000 });
    this.logger.success(`Plot status verified: ${expectedStatus}`);
  }

  /**
   * Verify plot name appears in Advance Table INTERMENTS list
   */
  async verifyPlotInIntermentList(plotName: string): Promise<void> {
    this.logger.info(`Verifying plot "${plotName}" in interments list`);
    const plotCell = this.page.locator('[data-testid="content-wrapper-div-plot-id"]').filter({ hasText: plotName }).first();
    await plotCell.waitFor({ state: 'visible', timeout: 10000 });
    this.logger.success(`Plot "${plotName}" found in interments list`);
  }

  /**
   * Verify deceased first name appears in Advance Table INTERMENTS list
   */
  async verifyDeceasedFirstNameInList(firstName: string): Promise<void> {
    this.logger.info(`Verifying first name "${firstName}" in interments list`);
    // First name is in the 4th column (index 3): Plot ID, #, First Name, Last Name...
    const rows = this.page.locator('[role="table"] [role="row"]');
    const count = await rows.count();
    let found = false;
    for (let i = 1; i < Math.min(count, 5); i++) {
      const cells = rows.nth(i).locator('[role="cell"]');
      const firstNameCell = cells.nth(3); // 4th column = First Name
      const text = await firstNameCell.textContent().catch(() => '');
      if (text?.trim() === firstName) {
        found = true;
        break;
      }
    }
    if (!found) {
      // Fallback: just check if name appears anywhere in the table
      const nameInTable = this.page.locator('[role="table"]').getByText(firstName, { exact: true }).first();
      await nameInTable.waitFor({ state: 'visible', timeout: 5000 });
    }
    this.logger.success(`First name "${firstName}" found in interments list`);
  }

  /**
   * Save interment from Advance Table flow — redirect goes back to advance-table
   */
  async saveIntermentFromTable(): Promise<void> {
    this.logger.info('Saving interment from Advance Table');
    await this.page.click(IntermentSelectors.saveButton);
    // After save from table, redirects back to advance-table
    await this.page.waitForURL(/advance-table/, { timeout: 30000 });
    await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 5000 });
    this.logger.success('Interment saved, redirected back to Advance Table');
  }

  // ============================================================
  // FLOW 1: Add Interment via Plot Detail page
  // Entry: Map → See all Plots → Filter Vacant → Select plot → "Add interment" button
  // URL: /customer-organization/{org}/{plotId}/manage/add/interment
  // ============================================================

  /**
   * Click Add Interment button from plot detail page
   */
  async clickAddIntermentButton(): Promise<void> {
    this.logger.info('Clicking Add Interment button');
    
    // Wait for button to be visible and clickable
    const button = this.page.locator(IntermentSelectors.addIntermentButton);
    await button.waitFor({ state: 'visible' });
    
    this.logger.info('Add Interment button found, clicking...');
    
    // Setup navigation listener BEFORE clicking (waitForURL must be set up first)
    const navigationPromise = this.page.waitForURL('**/manage/add/interment', { timeout: 30000 }).catch(() => null);
    await button.click();
    
    const navigated = await navigationPromise;
    const currentUrl = this.page.url();
    
    if (currentUrl.includes('/manage/add/interment')) {
      this.logger.info('✓ Navigated to Add Interment form');
    } else {
      this.logger.info(`URL after first click: ${currentUrl}`);
      // Retry click - button may need a second click or the first was intercepted
      this.logger.info('Retrying Add Interment button click...');
      await button.click();
      await this.page.waitForURL('**/manage/add/interment', { timeout: 30000 });
      this.logger.info('✓ Navigated to Add Interment form after retry');
    }
    
    // Wait for form to be visible
    await this.page.getByLabel('First name').first().waitFor({ state: 'visible' });
    this.logger.success('Add Interment form loaded');
  }

  /**
   * Fill interment form with deceased person and interment details
   * @param data - Interment data object
   */
  async fillIntermentForm(data: IntermentData): Promise<void> {
    this.logger.info('Filling interment form');

    // Dismiss any open CDK overlay/dropdown before filling form
    // (e.g. search autocomplete may still be open after plot selection)
    const overlay = this.page.locator('.cdk-overlay-backdrop, .cdk-overlay-transparent-backdrop');
    if (await overlay.count() > 0) {
      this.logger.info('CDK overlay detected, pressing Escape to dismiss...');
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(300);
    }
    // Also wait for any person-info dropdown to disappear
    await this.page.locator('[data-testid="div-person-info-0"]').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    // Wait for form fields to be visible
    const firstNameField = this.page.getByLabel('First name').first();
    await firstNameField.waitFor({ state: 'visible' });
    
    // Fill Deceased Person section - required fields
    this.logger.info(`Filling first name: ${data.firstName}`);
    await firstNameField.click(); // Click to focus
    await firstNameField.fill(data.firstName);

    this.logger.info(`Filling last name: ${data.lastName}`);
    const lastNameField = this.page.getByLabel('Last name').first();
    await lastNameField.waitFor({ state: 'visible' });
    await lastNameField.click();
    await lastNameField.fill(data.lastName);

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
    
    // Select option
    const typeOption = this.page.getByRole('option', { name: type });
    await typeOption.waitFor({ state: 'visible' });
    await typeOption.click();
    
    // Wait for dropdown to close
    await typeOption.waitFor({ state: 'hidden' }).catch(() => {});
    
    this.logger.success(`Interment type ${type} selected`);
  }

  /**
   * Save the interment and wait for redirect
   */
  async saveInterment(): Promise<void> {
    this.logger.info('Saving interment');

    const isFromTable = this.page.url().includes('interment-table');

    // Setup waitForURL BEFORE clicking (per CLAUDE.md: must be set up before action)
    const urlPattern = isFromTable ? '**/advance-table**' : '**/plots/**';
    const navigationPromise = this.page.waitForURL(urlPattern, { timeout: 30000 });

    // Click save button
    await this.page.click(IntermentSelectors.saveButton);

    if (isFromTable) {
      await navigationPromise;
      this.logger.success('Interment saved and redirected to Advance Table');
    } else {
      await navigationPromise;
      this.logger.success('Interment saved and redirected to plot detail');
    }

    await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 5000 });
  }

  /**
   * Click INTERMENTS tab on plot detail page
   */
  async clickIntermentsTab(): Promise<void> {
    this.logger.info('Clicking INTERMENTS tab');
    
    // Wait for tab to be visible first
    const intermentsTab = this.page.getByRole('tab', { name: /INTERMENTS/i });
    await intermentsTab.waitFor({ state: 'visible' });
    
    // Click the tab
    await intermentsTab.click();
    this.logger.info('INTERMENTS tab clicked, waiting for content to load...');
    
    // Wait for tab to be selected
    await expect(intermentsTab).toHaveAttribute('aria-selected', 'true').catch(async () => {
      this.logger.info('Retrying tab click...');
      await intermentsTab.click();
      await expect(intermentsTab).toHaveAttribute('aria-selected', 'true').catch(() => {});
    });
    
    // Wait for content to stabilize
    await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 5000 });
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
      await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 3000 });
    }
    
    // Verify deceased name appears as heading
    const deceasedHeading = this.page.locator(IntermentSelectors.deceasedNameHeading(fullName));
    await expect(deceasedHeading).toBeVisible();
    
    this.logger.success(`Deceased "${fullName}" found in INTERMENTS tab`);
  }

  /**
   * Verify interment type label
   * @param intermentType - Expected interment type (e.g., "Burial")
   */
  async verifyIntermentType(intermentType: string): Promise<void> {
    this.logger.info(`Verifying interment type: ${intermentType}`);
    
    const typeLabel = this.page.locator(IntermentSelectors.intermentTypeLabel(intermentType));
    await expect(typeLabel).toBeVisible();
    
    this.logger.success(`Interment type ${intermentType} verified`);
  }

  /**
   * Add interment applicant person
   * This will open the person form in the right sidebar
   */
  async addIntermentApplicant(): Promise<void> {
    this.logger.info('Adding interment applicant');
    await this.page.click(IntermentSelectors.addIntermentApplicantButton);
    await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 2000 });
    this.logger.success('Interment applicant form opened');
  }

  /**
   * Add next of kin person
   * This will open the person form in the right sidebar
   */
  async addNextOfKin(): Promise<void> {
    this.logger.info('Adding next of kin');
    await this.page.click(IntermentSelectors.addNextOfKinButton);
    await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 2000 });
    this.logger.success('Next of kin form opened');
  }

  /**
   * Click INTERMENTS tab on plot detail page (for edit flow)
   */
  async clickIntermentTab(): Promise<void> {
    this.logger.info('Clicking INTERMENTS tab');

    // Wait for page to be ready - ensure tablist is loaded
    await this.page.waitForSelector('[role="tablist"]', { state: 'visible' });

    // Wait for tab to be visible first
    const intermentsTab = this.page.getByRole('tab', { name: /INTERMENTS/i });
    await intermentsTab.waitFor({ state: 'visible' });

    // Click the tab
    await intermentsTab.click();
    this.logger.info('INTERMENTS tab clicked, waiting for content to load...');

    // Wait for tab to be selected
    await expect(intermentsTab).toHaveAttribute('aria-selected', 'true').catch(async () => {
      this.logger.info('Retrying tab click...');
      await intermentsTab.click();
      await expect(intermentsTab).toHaveAttribute('aria-selected', 'true').catch(() => {});
    });

    // Wait for content to stabilize - wait for network to be idle
    try {
      await this.page.waitForLoadState('networkidle');
    } catch {
      // Network idle timeout is ok, continue
      this.logger.info('Network idle timeout, continuing...');
    }
    await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 3000 });
    this.logger.success('INTERMENTS tab opened');
  }

  /**
   * Click Edit Interment button from INTERMENTS tab
   */
  async clickEditIntermentButton(): Promise<void> {
    this.logger.info('Clicking Edit Interment button');
    
    // First, check and expand interment list if needed (for plots with multiple interments)
    await this.checkAndExpandIntermentList();
    
    // Wait for button to be visible and enabled
    const editButton = this.page.getByTestId('interment-item-button-edit-interment');
    await editButton.waitFor({ state: 'visible' });
    
    this.logger.info('Edit button found, clicking...');
    await editButton.click();
    
    // Wait for edit form to load
    try {
      await this.page.waitForURL('**/manage/edit/interment/**');
      this.logger.info('✓ Navigated to Edit Interment form');
    } catch (e) {
      const currentUrl = this.page.url();
      this.logger.info(`Current URL after click: ${currentUrl}`);
      if (!currentUrl.includes('/manage/edit/')) {
        throw new Error(`Failed to navigate to Edit form. Current URL: ${currentUrl}`);
      }
    }
    
    await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 5000 });
    this.logger.success('Edit Interment form loaded');
  }

  /**
   * Check if plot has multiple interments and expand the list if needed
   * This handles the case where interments are shown as a collapsed list
   */
  async checkAndExpandIntermentList(): Promise<void> {
    this.logger.info('Checking if interment list needs to be expanded');
    
    // Wait for INTERMENTS tab content to be visible
    await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 3000 });
    
    // Check if there's an expand button for interment list
    // This button typically appears when there are multiple interments in a plot
    const expandButton = this.page.locator('button[aria-label*="expand"], button[aria-expanded="false"]').first();
    
    try {
      // Check if expand button is visible (timeout quickly if not found)
      const isVisible = await expandButton.isVisible();
      
      if (isVisible) {
        this.logger.info('Multiple interments detected, expanding list...');
        await expandButton.click();
        await NetworkHelper.waitForAnimation(this.page);
        this.logger.success('Interment list expanded');
      } else {
        this.logger.info('Single interment detected, no need to expand');
      }
    } catch (e) {
      // No expand button found - likely single interment, this is fine
      this.logger.info('No expand button found - single interment or already expanded');
    }
  }

  /**
   * Update interment form with new data (for edit flow)
   * @param data - Interment data object with fields to update
   */
  async updateIntermentForm(data: Partial<IntermentData>): Promise<void> {
    this.logger.info('========== UPDATE INTERMENT FORM START ==========');
    this.logger.info(`Current URL: ${this.page.url()}`);
    this.logger.info(`Data to update: ${JSON.stringify(data)}`);

    // Log page state before starting
    const pageTitle = await this.page.title();
    this.logger.info(`Page title: ${pageTitle}`);

    // Click "Deceased person" tab to access the form fields
    this.logger.info('Looking for "Deceased person" button...');
    try {
      const deceasedPersonButton = this.page.getByRole('button', { name: 'Deceased person' });
      const isVisible = await deceasedPersonButton.isVisible();
      this.logger.info(`"Deceased person" button visible: ${isVisible}`);

      // Log all buttons on page for debugging
      const allButtons = await this.page.locator('button').allTextContents();
      this.logger.info(`All buttons on page: ${JSON.stringify(allButtons.filter(b => b.trim()))}`);

      await deceasedPersonButton.click();
      this.logger.success('Clicked "Deceased person" button');
      // Wait for form fields to appear
      await this.page.getByLabel('First name').first().waitFor({ state: 'visible' });
    } catch (e) {
      this.logger.error(`Failed to click "Deceased person" button: ${e}`);
      throw e;
    }

    // Update first name if provided
    if (data.firstName) {
      this.logger.info(`Updating first name to: ${data.firstName}`);
      try {
        const firstNameField = this.page.getByLabel('First name').first();
        await firstNameField.waitFor({ state: 'visible' });
        this.logger.info('First name field found and visible');

        await firstNameField.click();
        await firstNameField.clear();
        await firstNameField.fill(data.firstName);
        this.logger.success(`First name updated to: ${data.firstName}`);
      } catch (e) {
        this.logger.error(`Failed to update first name: ${e}`);

        // Log all input labels for debugging
        const allLabels = await this.page.locator('label').allTextContents();
        this.logger.info(`All labels on page: ${JSON.stringify(allLabels.filter(l => l.trim()))}`);
        throw e;
      }
    }

    // Update last name if provided
    if (data.lastName) {
      this.logger.info(`Updating last name to: ${data.lastName}`);
      try {
        const lastNameField = this.page.getByLabel('Last name').first();
        await lastNameField.waitFor({ state: 'visible' });
        this.logger.info('Last name field found and visible');

        await lastNameField.click();
        await lastNameField.clear();
        await lastNameField.fill(data.lastName);
        this.logger.success(`Last name updated to: ${data.lastName}`);
      } catch (e) {
        this.logger.error(`Failed to update last name: ${e}`);
        throw e;
      }
    }

    // Clear middle name if both firstName and lastName are provided (full name replacement)
    if (data.firstName && data.lastName) {
      this.logger.info('Clearing middle name for clean full name');
      try {
        const middleNameField = this.page.getByLabel('Middle name').first();
        await middleNameField.click();
        await middleNameField.clear();
        this.logger.success('Middle name cleared');
      } catch (e) {
        this.logger.info(`Middle name field not found or error clearing: ${e}`);
      }
    } else if (data.middleName !== undefined) {
      // Only update middle name if explicitly provided
      this.logger.info(`Updating middle name to: ${data.middleName}`);
      try {
        const middleNameField = this.page.getByLabel('Middle name').first();
        await middleNameField.click();
        await middleNameField.clear();
        if (data.middleName) {
          await middleNameField.fill(data.middleName);
        }
        this.logger.success('Middle name updated');
      } catch (e) {
        this.logger.info(`Middle name field not found or error updating: ${e}`);
      }
    }

    // Click "Interment details" tab if interment type needs to be updated
    if (data.intermentType) {
      this.logger.info('Looking for "Interment details" button...');
      try {
        const intermentDetailsButton = this.page.getByRole('button', { name: 'Interment details' });
        const isVisible = await intermentDetailsButton.isVisible();
        this.logger.info(`"Interment details" button visible: ${isVisible}`);

        await intermentDetailsButton.click();
        this.logger.success('Clicked "Interment details" button');
        // Wait for interment type dropdown to be visible
        await this.page.getByLabel('Interment type').waitFor({ state: 'visible' });

        this.logger.info(`Updating interment type to: ${data.intermentType}`);
        await this.selectIntermentType(data.intermentType);
        this.logger.success(`Interment type updated to: ${data.intermentType}`);
      } catch (e) {
        this.logger.error(`Failed to update interment type: ${e}`);
        throw e;
      }
    }

    this.logger.success('========== INTERMENT FORM UPDATED SUCCESSFULLY ==========');
  }
}
