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

    await this.page.waitForTimeout(2500);

    // Step 2: Click the PERSON or BUSINESS sub-option that appears in the dropdown panel.
    // After clicking a role button (e.g., "+ INTERMENT APPLICANT"), a small panel appears
    // with "PERSON" and "BUSINESS" choices (rendered uppercase via CSS). Click the right one.
    // NOTE: { force: true } is used because Angular Material CDK overlay backdrops can
    // intercept pointer events even when the target element is visible and stable.
    if (subType) {
      const subTitle = subType[0] + subType.slice(1).toLowerCase(); // 'Person' or 'Business'

      const subSelectors = [
        `[data-testid*="option"]:has-text("${subTitle}")`,
        `div.option.select:has-text("${subTitle}")`,
        `div[class*="option"]:has-text("${subTitle}")`,
        `div.option:has-text("${subTitle}")`,
        `button:has-text("${subTitle}")`,
        `a:has-text("${subTitle}")`,
        `mat-menu-item:has-text("${subTitle}")`,
        `[role="menuitem"]:has-text("${subTitle}")`,
        `[role="option"]:has-text("${subTitle}")`,
        `li:has-text("${subTitle}")`,
        `span:has-text("${subTitle}")`,
      ];

      let subClicked = false;
      for (const sel of subSelectors) {
        const el = this.page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          this.logger.info(`Clicking "${subType}" sub-option with: ${sel}`);
          await el.click({ force: true });
          subClicked = true;
          break;
        }
      }

      if (!subClicked) {
        // Case-insensitive exact-word regex fallback
        this.logger.info(`Sub-option selectors failed — trying regex getByText("${subTitle}")`);
        const el = this.page.getByText(new RegExp(`^${subTitle}$`, 'i')).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          await el.click({ force: true });
          subClicked = true;
        }
      }

      if (subClicked) {
        await this.page.waitForTimeout(3000);
      }
    }

    // Step 3: Interact with the dialog form that appeared after clicking the sub-option.
    // Branch explicitly on subType — BUSINESS forms have a "Business name *" required field
    // at the top, while PERSON forms start with "First name *".
    const addBtn = this.page.locator(
      '[role="dialog"] button:has-text("Add"), mat-dialog-container button:has-text("Add")'
    ).first();

    if (subType === 'BUSINESS') {
      // Business form: fill the required "Business name" field with searchTerm, then click ADD.
      // The "Business name *" field is the FIRST input in the dialog.
      this.logger.info(`Business form — filling Business name: "${searchTerm}"`);

      // Try specific selectors first, then fall back to the first input in dialog
      const businessNameSelectors = [
        'mat-dialog-container input[aria-label="Business name"]',
        '[role="dialog"] input[aria-label="Business name"]',
        'mat-dialog-container input[formcontrolname="name"]',
        '[role="dialog"] input[formcontrolname="name"]',
        'mat-dialog-container input[formcontrolname="business_name"]',
        '[role="dialog"] input[formcontrolname="business_name"]',
        'mat-dialog-container mat-form-field:first-of-type input',
        '[role="dialog"] mat-form-field:first-of-type input',
      ];

      let businessNameInput = this.page.locator(businessNameSelectors[0]);
      for (const sel of businessNameSelectors) {
        const el = this.page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          this.logger.info(`Found business name input with: ${sel}`);
          businessNameInput = el;
          break;
        }
      }
      await businessNameInput.waitFor({ state: 'visible', timeout: 10000 });
      await businessNameInput.click({ clickCount: 3 });
      await businessNameInput.fill(searchTerm);
      await this.page.waitForTimeout(500);
      await addBtn.waitFor({ state: 'visible', timeout: 8000 });
      await addBtn.click();
      await this.page.waitForTimeout(1000);
      this.logger.success(`Business relation added: "${searchTerm}"`);
      return;
    }

    // PERSON form: fill First name (required) + Last name (searchTerm), then click ADD.
    this.logger.info(`Person form — filling First name "Test" + Last name "${searchTerm}"`);
    const firstNameInput = this.page.locator([
      'mat-dialog-container input[aria-label="First name"]',
      '[role="dialog"] input[aria-label="First name"]',
      'mat-dialog-container input[formcontrolname="first_name"]',
      '[role="dialog"] input[formcontrolname="first_name"]',
    ].join(', ')).first();
    await firstNameInput.waitFor({ state: 'visible', timeout: 12000 });
    await firstNameInput.click({ clickCount: 3 });
    await firstNameInput.fill('Test');

    const lastNameInput = this.page.locator([
      'mat-dialog-container input[aria-label="Last name"]',
      '[role="dialog"] input[aria-label="Last name"]',
      'mat-dialog-container input[formcontrolname="last_name"]',
      '[role="dialog"] input[formcontrolname="last_name"]',
    ].join(', ')).first();
    await lastNameInput.click({ clickCount: 3 });
    await lastNameInput.fill(searchTerm);
    await this.page.waitForTimeout(500);
    await addBtn.waitFor({ state: 'visible', timeout: 8000 });
    await addBtn.click();
    await this.page.waitForTimeout(1000);
    this.logger.success(`Person relation added: Test ${searchTerm}`);
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
   *
   * Flow after clicking "Delete" from MORE menu:
   *   1st dialog: "Delete Interment — Are you sure? CANCEL / DELETE"
   *   2nd dialog (if plot is now empty): "This plot is empty. Keep the plot status as occupied? YES / NO"
   *     YES → navigates immediately  |  NO → submenu ("Change to vacant"/"Change to reserved")
   */
  async confirmIntermentDeletion(): Promise<void> {
    this.logger.info('Confirming interment deletion');

    // Step 1: Click the DELETE button in the primary "Are you sure?" dialog
    const deleteBtn = this.page.locator(
      '[role="dialog"] button:has-text("DELETE"), [role="dialog"] button:has-text("Delete")'
    ).first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 10000 });
    await deleteBtn.click();
    this.logger.info('Clicked DELETE in primary confirmation dialog');
    await this.page.waitForTimeout(1500);

    // Step 2: Handle the secondary "This plot is empty — keep as occupied?" dialog.
    // The dialog appears after the DELETE API call completes (may take several seconds on staging).
    // Clicking NO opens a submenu: "Change to vacant" / "Change to reserved".
    // We click NO then "Change to vacant" so the plot is freed for subsequent tests.
    const secondaryNoBtn = this.page.locator(
      'mat-dialog-container button:has-text("NO"), mat-dialog-container button:has-text("No"), ' +
      '[role="dialog"] button:has-text("NO"), [role="dialog"] button:has-text("No")'
    ).first();
    if (await secondaryNoBtn.isVisible({ timeout: 15000 }).catch(() => false)) {
      await secondaryNoBtn.click();
      this.logger.info('Clicked NO — waiting for "Change to vacant" submenu option');
      await this.page.waitForTimeout(500);

      // After NO, a submenu appears with "Change to vacant" and "Change to reserved"
      const changeToVacantBtn = this.page.locator('button:has-text("Change to vacant")').first();
      await changeToVacantBtn.waitFor({ state: 'visible', timeout: 5000 });
      await changeToVacantBtn.click();
      this.logger.info('Clicked "Change to vacant" — plot will return to vacant status');
      await this.page.waitForTimeout(1000);
    } else {
      this.logger.info('Secondary "This plot is empty?" dialog did not appear — proceeding');
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
   * In the Move Interment dialog, select the target plot from the "Plott *" mat-select.
   * The dialog has: Cemetery (1st mat-select, pre-filled) + Plott (2nd mat-select) + CANCEL / ASSIGN.
   *
   * The Plott mat-select has an integrated search: clicking it opens a CDK overlay panel that
   * contains a search input at the top. You type the plot ID there to filter results, then click
   * the matching mat-option.
   */
  async searchAndSelectMoveTargetPlot(plotId: string): Promise<void> {
    this.logger.info(`Searching for target plot in Move dialog: "${plotId}"`);

    // Wait for the Move dialog to fully render
    await this.page.waitForTimeout(1000);

    // Click the Plott mat-select (2nd mat-select in the dialog) to open the CDK overlay
    const plotSelect = this.page.locator('[role="dialog"] mat-select').nth(1);
    await plotSelect.waitFor({ state: 'visible', timeout: 10000 });
    await plotSelect.click();
    this.logger.info('Clicked Plott mat-select — waiting for CDK overlay search input');

    // The overlay panel opens outside the dialog in .cdk-overlay-container.
    // It has a search input at the top — wait for it to become visible.
    const overlayInput = this.page.locator('.cdk-overlay-container input').first();
    await overlayInput.waitFor({ state: 'visible', timeout: 8000 });
    this.logger.info('CDK overlay search input visible — typing plot ID');

    // Type using pressSequentially to fire real key events (Angular valueChanges / API search)
    await overlayInput.click();
    await overlayInput.pressSequentially(plotId, { delay: 80 });
    this.logger.info(`Typed "${plotId}" into overlay search input`);

    // Wait for the matching mat-option to appear (API call may take a few seconds)
    const option = this.page.locator(`mat-option:has-text("${plotId}")`).first();
    await option.waitFor({ state: 'visible', timeout: 15000 });
    await option.click();
    this.logger.success(`Plot "${plotId}" selected`);

    await this.page.waitForTimeout(500);
  }

  /**
   * Confirm the interment move and wait for navigation to the new plot detail
   */
  async confirmIntermentMove(): Promise<void> {
    this.logger.info('Confirming interment move');

    // Wait for any dropdown overlays to fully close and the ASSIGN button to become active
    await this.page.waitForTimeout(1500);

    // Try to find and click the ASSIGN/confirm button
    // First try getByRole for reliability; fall back to locator
    let clicked = false;

    const dialogAssign = this.page.locator('mat-dialog-container').getByRole('button', { name: /assign/i });
    if (await dialogAssign.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dialogAssign.click({ force: true });
      clicked = true;
      this.logger.info('Clicked ASSIGN button via getByRole');
    }

    if (!clicked) {
      const confirmBtn = this.page.locator(IntermentSelectors.moveConfirmButton).first();
      await confirmBtn.waitFor({ state: 'visible', timeout: 15000 });
      await confirmBtn.click({ force: true });
      this.logger.info('Clicked ASSIGN/confirm button via locator');
    }

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
   * Click INTERMENTS tab on plot detail page (for edit flow).
   *
   * Chronicle shows two layouts depending on the plot type:
   *   - Tabbed layout (catalog plots): DETAILS | INTERMENTS | MAP | DOCUMENTS tabs
   *   - MAP layout (map plots): sidebar with [aria-label="INTERMENTS"] chip + TARGETS/ACTIVITY tabs
   *
   * Both layouts have an element with [aria-label="INTERMENTS"] that reveals the interment list.
   * Using the aria-label selector handles both cases.
   */
  async clickIntermentTab(): Promise<void> {
    this.logger.info('Clicking INTERMENTS tab/chip');

    // [aria-label="INTERMENTS"] matches both the standard tab in tabbed layout
    // and the chip in MAP layout. Use .first() to handle multiple matches safely.
    const intermentsEl = this.page.locator(IntermentSelectors.intermentsTab).first();
    await intermentsEl.waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForTimeout(500);

    await intermentsEl.click();
    this.logger.info('INTERMENTS element clicked, waiting for content to load...');

    await this.page.waitForTimeout(2000);

    // Allow network to settle
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
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
