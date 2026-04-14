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
   * Click a relation role button and search/select a person or business via autocomplete.
   * Used for: Interment applicant, Next of kin (search by person last name)
   *           Funeral minister, Funeral director (search by business name)
   *
   * @param buttonSelector - CSS selector (or label text) of the role button
   * @param searchTerm - Last name (person) or business name to type in the search field
   * @param subType - Optional: 'PERSON' or 'BUSINESS' to click the sub-option that appears
   *                  after expanding a collapsible relation section
   */
  async searchAndAddRelation(buttonSelector: string, searchTerm: string, subType?: 'PERSON' | 'BUSINESS'): Promise<void> {
    this.logger.info(`Adding relation "${buttonSelector}" by searching for "${searchTerm}"`);

    // Extract label text from a :has-text("...") selector for fallback matching
    const textMatch = buttonSelector.match(/:has-text\("([^"]+)"\)/i);
    const labelText = textMatch ? textMatch[1] : buttonSelector;
    const upperLabel = labelText.toUpperCase();

    // Try multiple strategies to find and click the relation section header
    const fallbackSelectors = [
      buttonSelector,
      `button:has-text("${upperLabel}")`,
      `[role="button"]:has-text("${labelText}")`,
      `[role="button"]:has-text("${upperLabel}")`,
      `mat-expansion-panel-header:has-text("${labelText}")`,
      `mat-expansion-panel-header:has-text("${upperLabel}")`,
    ];

    let clicked = false;
    for (const sel of fallbackSelectors) {
      try {
        const el = this.page.locator(sel).first();
        if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
          await el.click();
          this.logger.info(`Clicked relation element with selector: "${sel}"`);
          clicked = true;
          break;
        }
      } catch {
        // continue trying next selector
      }
    }

    if (!clicked) {
      // Last resort: getByText searches any element type broadly
      this.logger.info(`Using getByText fallback for: "${upperLabel}"`);
      const el = this.page.getByText(upperLabel, { exact: false }).first();
      await el.waitFor({ state: 'visible', timeout: 8000 });
      await el.click();
    }

    await this.page.waitForTimeout(1200);

    // Handle sub-options (PERSON / BUSINESS) that may appear after expanding the section.
    // IMPORTANT: Use CSS :has-text() which is CASE-SENSITIVE — this avoids accidentally
    // matching "Deceased person" when searching for "PERSON".
    // getByText({ exact: false }) is case-insensitive and would hit the wrong elements.
    if (subType) {
      const subLabel = subType; // 'PERSON' or 'BUSINESS'

      // The sub-options are <div class="option select"> elements with text "Person"/"Business".
      // These are displayed as "PERSON"/"BUSINESS" via CSS text-transform:uppercase.
      // From DOM inspection: data-testid="interment-add-form-div-option-1" for Person.
      const subLower = subLabel.toLowerCase();  // 'person' or 'business'
      const subTitle = subLabel[0] + subLabel.slice(1).toLowerCase(); // 'Person' or 'Business'

      // Priority order: exact testid match, then class+text, then broader fallbacks
      const subSelectors = [
        `[data-testid*="option"]:has-text("${subTitle}")`,   // e.g., data-testid="interment-add-form-div-option-1"
        `div.option.select:has-text("${subTitle}")`,          // <div class="option select"> with "Person"/"Business" text
        `div[class*="option"]:has-text("${subTitle}")`,       // any option-classed div with the text
        `div.option:has-text("${subTitle}")`,                 // option div with title-case text
        `button:has-text("${subTitle}")`,
        `cl-plus-item[text="${subLower}"]`,
        `a:has-text("${subTitle}")`,
      ];

      let subClicked = false;
      for (const sel of subSelectors) {
        const el = this.page.locator(sel).first();
        if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
          const html = await el.evaluate((e: Element) => e.outerHTML.substring(0, 300)).catch(() => '?');
          this.logger.info(`Found "${subLabel}" sub-option with: ${sel} → ${html}`);
          await el.click();
          this.logger.info(`Clicked "${subLabel}" sub-option with: ${sel}`);
          subClicked = true;
          break;
        }
      }

      if (!subClicked) {
        this.logger.info(`No "${subLabel}" sub-option found, proceeding to search directly`);
      } else {
        await this.page.waitForTimeout(1500);
      }
    } else {
      // Auto-detect: check if PERSON sub-option appears using case-sensitive :has-text()
      const personEl = this.page.locator('[data-testid*="option"]:has-text("Person"), div.option.select:has-text("Person")').first();
      if (await personEl.isVisible({ timeout: 1500 }).catch(() => false)) {
        this.logger.info('Auto-clicking PERSON sub-option');
        await personEl.click();
        await this.page.waitForTimeout(1000);
      }
    }

    // Find the search input. After clicking PERSON sub-option, an "Interment Applicant" dialog
    // appears — search via the Last name autocomplete field inside the dialog.
    // For BUSINESS (funeral minister/director), a direct search panel may appear.
    const searchInputSelectors = [
      'mat-dialog-container input[formcontrolname="last_name"]',  // Person dialog: Last name
      '[role="dialog"] input[formcontrolname="last_name"]',        // Dialog last name
      'mat-dialog-container input[formcontrolname="name"]',        // Business dialog: business name
      '[role="dialog"] input[formcontrolname="name"]',             // Business dialog name
      ...IntermentSelectors.relationSearchInput.split(', '),       // Original selectors
      'input[placeholder*="name"]',
      'input[placeholder*="Search"]',
    ];

    let searchInputEl = this.page.locator(searchInputSelectors[0]);
    for (const sel of searchInputSelectors) {
      const el = this.page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        this.logger.info(`Found search input with selector: ${sel}`);
        searchInputEl = el;
        break;
      }
    }
    await searchInputEl.waitFor({ state: 'visible', timeout: 10000 });
    await searchInputEl.click();
    await searchInputEl.fill(searchTerm);
    await this.page.waitForTimeout(1500);

    // Select the first autocomplete suggestion
    const firstOption = this.page.locator('mat-option').first();
    await firstOption.waitFor({ state: 'visible', timeout: 10000 });
    const optionText = await firstOption.textContent();
    this.logger.info(`Selecting autocomplete option: "${optionText?.trim()}"`);
    await firstOption.click();
    await this.page.waitForTimeout(800);

    this.logger.success(`Relation added via search for: "${searchTerm}"`);
  }

  /**
   * Click the MORE (⋮) button on the edit interment toolbar
   */
  async clickMoreMenuOnEditInterment(): Promise<void> {
    this.logger.info('Clicking MORE button on edit interment page');
    const moreBtn = this.page.locator(IntermentSelectors.moreButton);
    await moreBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moreBtn.click();
    await this.page.waitForTimeout(800);
    this.logger.success('MORE menu opened');
  }

  /**
   * Click "Delete" from the MORE menu on edit interment page
   */
  async clickDeleteIntermentFromMenu(): Promise<void> {
    this.logger.info('Clicking Delete from MORE menu');
    const deleteItem = this.page.locator(IntermentSelectors.deleteIntermentMenuItem).first();
    await deleteItem.waitFor({ state: 'visible', timeout: 5000 });
    await deleteItem.click();
    await this.page.waitForTimeout(1000);
    this.logger.success('Delete option clicked');
  }

  /**
   * Confirm the interment deletion dialog and wait for navigation away from the manage page.
   * Handles a secondary dialog that may ask "This plot is empty. Keep the plot status as occupied?"
   */
  async confirmIntermentDeletion(): Promise<void> {
    this.logger.info('Confirming interment deletion');

    // Click primary delete confirmation button if a dialog is showing
    const confirmBtn = this.page.locator(IntermentSelectors.confirmDeleteIntermentButton).first();
    if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmBtn.click();
      this.logger.success('Clicked primary delete confirmation');
    } else {
      this.logger.info('No primary confirmation dialog found — proceeding');
    }

    await this.page.waitForTimeout(1000);

    // Handle secondary dialog: "This plot is empty. Would you like to keep the plot status as occupied?"
    const secondaryDialog = this.page.locator('[role="dialog"]');
    if (await secondaryDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      this.logger.info('Secondary "keep occupied" dialog appeared');
      // Click "No" to set plot as vacant; fall back to "Yes" if No is absent
      const noBtn = this.page.locator('[role="dialog"] button:has-text("No")').first();
      const yesBtn = this.page.locator('[role="dialog"] button:has-text("Yes")').first();

      if (await noBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await noBtn.click();
        this.logger.info('Clicked "No" in secondary dialog');
      } else if (await yesBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await yesBtn.click();
        this.logger.info('Clicked "Yes" in secondary dialog');
      } else {
        const anyBtn = this.page.locator('[role="dialog"] button').first();
        if (await anyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await anyBtn.click();
          this.logger.info('Clicked first available dialog button');
        }
      }
    }

    // Wait for navigation away from the interment manage page
    await this.page.waitForURL(
      url => !url.href.includes('/manage/edit/interment') && !url.href.includes('/manage/add/interment'),
      { timeout: 20000 }
    );
    await this.page.waitForTimeout(2000);
    this.logger.success('Interment deleted — navigated away from manage page');
  }

  /**
   * Click "Move" from the MORE menu on edit interment page
   */
  async clickMoveIntermentFromMenu(): Promise<void> {
    this.logger.info('Clicking Move from MORE menu');
    const moveItem = this.page.locator(IntermentSelectors.moveIntermentMenuItem).first();
    await moveItem.waitFor({ state: 'visible', timeout: 5000 });
    await moveItem.click();
    await this.page.waitForTimeout(1000);
    this.logger.success('Move option clicked');
  }

  /**
   * In the move interment dialog, search for and select a target plot by its ID
   */
  async searchAndSelectMoveTargetPlot(plotId: string): Promise<void> {
    this.logger.info(`Searching for plot to move interment to: "${plotId}"`);
    const searchInput = this.page.locator(IntermentSelectors.movePlotSearchInput).first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.click();
    await searchInput.fill(plotId);
    await this.page.waitForTimeout(1500);

    const option = this.page.locator(IntermentSelectors.autocompleteOption(plotId)).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
    await this.page.waitForTimeout(500);
    this.logger.success(`Target plot "${plotId}" selected`);
  }

  /**
   * Confirm the interment move and wait for navigation to the new plot detail
   */
  async confirmIntermentMove(): Promise<void> {
    this.logger.info('Confirming interment move');
    const confirmBtn = this.page.locator(IntermentSelectors.moveConfirmButton).first();
    await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
    await confirmBtn.click();

    // After move, expect to land on the target plot detail page
    try {
      await this.page.waitForURL('**/plots/**', { timeout: 20000 });
    } catch {
      // If not /plots/, at minimum wait for navigation away from interment manage page
      this.logger.info('Did not navigate to /plots/ — waiting for any navigation away from manage page');
      await this.page.waitForURL(
        url => !url.href.includes('/manage/edit/interment'),
        { timeout: 10000 }
      );
    }

    await this.page.waitForTimeout(2000);
    this.logger.success('Interment moved successfully');
  }

  /**
   * Verify we have navigated away from the interment manage page after an action.
   * Accepts /plots/ (plot detail) or /customer-organization/ (advance table after delete).
   */
  async verifyOnPlotDetailPage(): Promise<void> {
    const url = this.page.url();
    if (url.includes('/manage/edit/interment') || url.includes('/manage/add/interment')) {
      throw new Error(`Still on interment manage page — action may have failed: ${url}`);
    }
    if (url.includes('/plots/') || url.includes('/customer-organization/')) {
      this.logger.success(`On expected page after interment action: ${url}`);
    } else {
      // Any other page is acceptable (SPA may redirect differently)
      this.logger.info(`Navigated to: ${url}`);
    }
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
