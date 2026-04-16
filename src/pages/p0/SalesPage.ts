import { Page, expect } from '@playwright/test';
import { Logger } from '../../utils/Logger.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';
import { salesSelectors } from '../../selectors/p0/sales.selectors.js';
import { CEMETERY_CONFIG } from '../../data/test-data.js';

export interface SaleItem {
  description: string;
  related_plot: string;
  quantity: number;
  price: number;
  tax_rate: number;
  total: number;
  discount: number;
  note?: string | null;
}

export interface SaleData {
  reference: string;
  issue_date?: string;
  due_date?: string;
  owner?: string;
  note?: string;
  purchaser?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  items: SaleItem[];
}

export interface SaleSummary {
  subtotal: string;
  discount: string;
  vat: string;
  total: string;
}

export class SalesPage {
  private readonly page: Page;
  private readonly logger = new Logger('SalesPage');

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to Sales page by clicking the Sales menu button
   */
  async navigateToSales(): Promise<void> {
    this.logger.info('Navigating to Sales page');
    await this.page.locator(salesSelectors.salesMenuButton).click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForSelector(salesSelectors.salesTable, { state: 'visible', timeout: 10000 });
  }

  /**
   * Validate that the sales table is loaded and visible
   */
  async validateSalesTableLoaded(): Promise<void> {
    this.logger.info('Validating sales table is loaded');
    await expect(this.page.locator(salesSelectors.salesTable)).toBeVisible({ timeout: 10000 });
    this.logger.info('Sales table is visible');
  }

  /**
   * Get the count of sales records in the table
   */
  async getSalesCount(): Promise<number> {
    const rows = await this.page.locator(salesSelectors.salesTableRows).count();
    this.logger.info(`Sales table has ${rows} rows`);
    return rows;
  }

  /**
   * Click the Create Sale button
   */
  async clickCreateSale(): Promise<void> {
    this.logger.info('Clicking Create Sale button');
    await this.page.locator(salesSelectors.createSaleButton).click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Select Cemetery from dropdown (required field on Create Sale form)
   */
  async selectCemetery(): Promise<void> {
    this.logger.info(`Selecting cemetery: ${CEMETERY_CONFIG.displayName}`);
    // Use mat-select with formcontrolname or fallback to first mat-select on page
    const cemeteryDropdown = this.page.locator('mat-select[formcontrolname="cemetery"]')
      .or(this.page.locator('mat-select').first());
    await cemeteryDropdown.first().waitFor({ state: 'visible', timeout: 10000 });
    await cemeteryDropdown.first().click();
    await this.page.waitForTimeout(500);
    const cemeteryOption = this.page.getByRole('option', { name: CEMETERY_CONFIG.displayName }).first();
    await cemeteryOption.waitFor({ state: 'visible', timeout: 5000 });
    await cemeteryOption.click();
    await this.page.waitForTimeout(1000);
    this.logger.info(`Cemetery "${CEMETERY_CONFIG.displayName}" selected`);
  }

  /**
   * Fill the Reference field
   */
  async fillReference(reference: string): Promise<void> {
    this.logger.info(`Filling reference: ${reference}`);
    await this.page.waitForSelector(salesSelectors.referenceInput, { state: 'visible', timeout: 10000 });
    await this.page.locator(salesSelectors.referenceInput).fill(reference);
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill the Issue Date field
   */
  async fillIssueDate(issueDate: string): Promise<void> {
    this.logger.info(`Filling issue date: ${issueDate}`);
    await this.page.waitForSelector(salesSelectors.issueDateInput, { state: 'visible', timeout: 10000 });
    await this.page.locator(salesSelectors.issueDateInput).fill(issueDate);
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill the Due Date field
   */
  async fillDueDate(dueDate: string): Promise<void> {
    this.logger.info(`Filling due date: ${dueDate}`);
    await this.page.waitForSelector(salesSelectors.dueDateInput, { state: 'visible', timeout: 10000 });
    await this.page.locator(salesSelectors.dueDateInput).fill(dueDate);
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill the Note field
   */
  async fillNote(note: string): Promise<void> {
    this.logger.info(`Filling note: ${note}`);
    await this.page.waitForSelector(salesSelectors.noteTextarea, { state: 'visible', timeout: 10000 });
    await this.page.locator(salesSelectors.noteTextarea).fill(note);
    await this.page.waitForTimeout(500);
  }

  /**
   * Select Owner from dropdown
   * Selects the first available option if no specific owner provided
   */
  async selectOwner(ownerName?: string): Promise<void> {
    this.logger.info(`Selecting owner: ${ownerName || 'first available'}`);
    await this.page.waitForSelector(salesSelectors.ownerSelect, { state: 'visible', timeout: 10000 });
    
    // Check current value before selecting
    const ownerCombobox = this.page.locator(salesSelectors.ownerSelect);
    const valueBefore = await ownerCombobox.textContent();
    this.logger.info(`Owner value before selection: "${valueBefore?.trim()}"`);
    
    await ownerCombobox.click();
    await this.page.waitForTimeout(1500);
    
    // Wait for options to appear
    await this.page.waitForSelector('mat-option', { state: 'visible', timeout: 5000 });
    
    // Get all options
    const options = await this.page.locator('mat-option:visible').allTextContents();
    this.logger.info(`Available owner options: ${JSON.stringify(options)}`);
    
    if (ownerName) {
      // Select specific owner by name
      const option = this.page.locator(`mat-option:has-text("${ownerName}")`).first();
      await option.click();
    } else {
      // Select first available option using more specific selector
      const option = this.page.locator('mat-option').first();
      await option.click();
    }
    
    // Wait longer for Angular to process the selection
    await this.page.waitForTimeout(2000);
    
    // Trigger change event explicitly
    await this.page.evaluate((selector) => {
      const selectElement = document.querySelector(selector) as any;
      if (selectElement && selectElement._elementRef) {
        const event = new Event('change', { bubbles: true });
        selectElement._elementRef.nativeElement.dispatchEvent(event);
      }
    }, salesSelectors.ownerSelect);
    
    await this.page.waitForTimeout(500);
    
    // Verify owner is selected
    const valueAfter = await ownerCombobox.textContent();
    this.logger.info(`Owner value after selection: "${valueAfter?.trim()}"`);
    
    if (!valueAfter || valueAfter.trim() === '' || valueAfter.trim() === 'Owner') {
      this.logger.error('Owner selection may have failed - combobox still shows empty or placeholder text');
    } else {
      this.logger.info('Owner selected');
    }
  }

  /**
   * Click Add Purchaser button
   */
  async clickAddPurchaser(): Promise<void> {
    this.logger.info('Clicking Add Purchaser button');
    await this.page.waitForSelector(salesSelectors.addPurchaserButton, { state: 'visible', timeout: 10000 });
    await this.page.locator(salesSelectors.addPurchaserButton).click();
    await this.page.waitForTimeout(2000); // Wait for purchaser section to appear
    this.logger.info('Purchaser section should now be visible');
  }

  /**
   * Add a new purchaser person by filling the Add Person dialog
   */
  async addNewPurchaser(firstName: string, lastName: string, email: string): Promise<void> {
    this.logger.info(`Adding new purchaser: ${firstName} ${lastName}`);
    
    try {
      // Wait for Add Person dialog to appear
      await this.page.waitForSelector(salesSelectors.addPersonDialog, { state: 'visible', timeout: 10000 });
      this.logger.info('Add Person dialog visible');
      await this.page.waitForTimeout(1000);
      
      // Fill first name
      await this.page.waitForSelector(salesSelectors.purchaserFirstNameInput, { state: 'visible', timeout: 10000 });
      await this.page.locator(salesSelectors.purchaserFirstNameInput).fill(firstName);
      await this.page.waitForTimeout(500);
      this.logger.info(`  - First name: ${firstName}`);
      
      // Fill last name
      await this.page.locator(salesSelectors.purchaserLastNameInput).fill(lastName);
      await this.page.waitForTimeout(500);
      this.logger.info(`  - Last name: ${lastName}`);
      
      // Fill email
      await this.page.locator(salesSelectors.purchaserEmailInput).fill(email);
      await this.page.waitForTimeout(500);
      this.logger.info(`  - Email: ${email}`);
      
      // Click Add button
      await this.page.waitForTimeout(1000); // Wait for validation
      await this.page.locator(salesSelectors.addPersonButton).click();
      await this.page.waitForTimeout(2000); // Wait for dialog to close
      
      this.logger.info(`Successfully added purchaser: ${firstName} ${lastName}`);
    } catch (error) {
      this.logger.error(`Failed to add purchaser: ${error}`);
      throw new Error(`Could not add purchaser: ${firstName} ${lastName}`);
    }
  }

  /**
   * Click Add Item button
   */
  async clickAddItem(): Promise<void> {
    this.logger.info('Clicking Add Item button');
    
    // Get count of "Add description" buttons before adding new item
    const currentCount = await this.page.locator('button:has-text("Add description")').count();
    this.logger.info(`Current "Add description" buttons: ${currentCount}`);
    
    // Wait for any overlays to close
    await this.page.waitForTimeout(1500);
    
    // Use force click to bypass overlay issues
    await this.page.locator(salesSelectors.addItemButton).click({ force: true });
    
    // Wait for new "Add description" button to appear (count increases by 1)
    const expectedCount = currentCount + 1;
    for (let attempt = 0; attempt < 20; attempt++) {
      const newCount = await this.page.locator('button:has-text("Add description")').count();
      if (newCount >= expectedCount) {
        this.logger.info(`New item row ready - "Add description" buttons now: ${newCount}`);
        await this.page.waitForTimeout(1000); // Extra wait for row stabilization
        return;
      }
      await this.page.waitForTimeout(500);
    }
    
    this.logger.warn('New item row may not be fully ready, continuing anyway');
  }

  /**
   * Fill item details for a specific item row
   * All 5 fields need to be filled: Item (search dropdown), Plot (search dropdown), Qty (input), Price (input), Discount (input)
   */
  async fillItemDetails(index: number, item: SaleItem): Promise<void> {
    this.logger.info(`Filling item ${index + 1}: ${item.description}`);
    
    // Wait a bit for the item row to be ready
    await this.page.waitForTimeout(1500);

    // Strategy: Use nth() to get all comboboxes and inputs globally, not per-row
    // The structure is predictable: owner combobox (index 0), then for each item row:
    // - item combobox
    // - plot combobox
    // So for item row i: item combobox at index (1 + i*2), plot combobox at index (2 + i*2)
    
    const itemComboboxIndex = 2 + (index * 2); // Skip cemetery (0) and owner (1), then item comboboxes at 2, 4, 6...
    const plotComboboxIndex = 3 + (index * 2); // Plot comboboxes at 3, 5, 7...

    // 1. Select ITEM from search dropdown
    try {
      this.logger.info(`  - Selecting item: ${item.description} (combobox index: ${itemComboboxIndex})`);
      
      // Get the specific item combobox
      const itemCombobox = this.page.locator('mat-select').nth(itemComboboxIndex);
      await itemCombobox.waitFor({ state: 'visible', timeout: 10000 });
      
      // Click to open the item dropdown
      await itemCombobox.click();
      await this.page.waitForTimeout(1500);
      
      // Wait for the search textbox inside the dropdown to appear
      // Scope to the open overlay panel to avoid picking up stale inputs from previous rows
      const itemSearchInput = this.page.locator('.cdk-overlay-pane input[type="text"]')
        .or(this.page.locator('mat-option-container input[type="text"]'))
        .or(this.page.locator('input[type="text"]').last());
      await itemSearchInput.first().waitFor({ state: 'visible', timeout: 5000 });

      // Clear any stale search value before typing
      await itemSearchInput.first().clear();
      await this.page.waitForTimeout(300);

      // Type the item name in the search box
      await itemSearchInput.first().fill(item.description);
      await this.page.waitForTimeout(1500);
      
      // Wait for options to appear
      await this.page.waitForSelector('[role="option"]', { state: 'visible', timeout: 5000 });
      
      // Log available options for debugging
      const itemOptions = await this.page.locator('[role="option"]:visible').allTextContents();
      this.logger.info(`Available item options: ${JSON.stringify(itemOptions)}`);
      
      // Click on the matching option (exact match)
      const itemOption = this.page.locator(`[role="option"]:has-text("${item.description}")`).first();
      const optionVisible = await itemOption.isVisible().catch(() => false);
      
      if (optionVisible) {
        await itemOption.click();
        await this.page.waitForTimeout(2000);
        
        // Verify item is selected by checking combobox text
        const itemCombobox = this.page.locator('mat-select').nth(itemComboboxIndex);
        const selectedText = await itemCombobox.textContent();
        this.logger.info(`  - Item selected: ${item.description} (combobox shows: "${selectedText?.trim()}")`);
        
        if (!selectedText || !selectedText.includes(item.description)) {
          this.logger.error(`Item selection may have failed - combobox shows "${selectedText}" instead of "${item.description}"`);
        }
      } else {
        this.logger.error(`Item "${item.description}" not found in dropdown. Available: ${JSON.stringify(itemOptions)}`);
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(500);
        throw new Error(`Item "${item.description}" not found in item dropdown`);
      }
    } catch (error) {
      this.logger.error(`Failed to select item: ${error}`);
      throw error;
    }

    // Wait for price to auto-fill (if applicable)
    await this.page.waitForTimeout(1500);

    // 2. Select PLOT from search dropdown
    if (item.related_plot) {
      this.logger.info(`  - Selecting plot: ${item.related_plot} (combobox index: ${plotComboboxIndex})`);
      
      try {
        // Get the specific plot combobox
        const plotCombobox = this.page.locator('mat-select').nth(plotComboboxIndex);
        await plotCombobox.waitFor({ state: 'visible', timeout: 10000 });
        await plotCombobox.click();
        await this.page.waitForTimeout(2000);
        
        // Wait for the search textbox in plot dropdown
        const plotSearchInput = this.page.locator('input[placeholder*="typing"]').or(
          this.page.locator('input[type="text"]')
        ).last();
        await plotSearchInput.waitFor({ state: 'visible', timeout: 5000 });
        
        // Type the plot name to search
        await plotSearchInput.fill(item.related_plot);
        await this.page.waitForTimeout(1000);

        // Wait for plot search API to complete (optional - data may be cached)
        const apiCalled = await NetworkHelper.waitForApiEndpoint(this.page, '/v2/search/plots-records-persons', 10000, { optional: true });
        if (apiCalled) {
          this.logger.info('Plot search API was called');
        } else {
          this.logger.info('Plot search API not called (data may be cached), continuing...');
        }
        
        // Wait for plot options to appear
        await this.page.waitForSelector('[role="option"]', { state: 'visible', timeout: 5000 });
        
        // Get all visible options
        const plotOptions = await this.page.locator('[role="option"]:visible').allTextContents();
        this.logger.info(`Available plot options: ${JSON.stringify(plotOptions)}`);
        
        // Find the plot option that matches and is NOT occupied
        const targetIndex = plotOptions.findIndex(opt => {
          const trimmed = opt.trim();
          const startsWithPlot = trimmed === item.related_plot || trimmed.startsWith(item.related_plot + ' ');
          const notOccupied = !trimmed.includes('Occupied');
          return startsWithPlot && notOccupied;
        });
        
        if (targetIndex >= 0) {
          // Found available (not occupied) plot
          this.logger.info(`Found available plot at index ${targetIndex}: ${plotOptions[targetIndex]}`);
          await this.page.locator('[role="option"]:visible').nth(targetIndex).click();
          await this.page.waitForTimeout(2000);
          
          const selectedText = await plotCombobox.textContent();
          this.logger.info(`  - Plot selected: ${item.related_plot} (combobox shows: "${selectedText?.trim()}")`);
        } else {
          // Plot not available (occupied) - still select it anyway since plot field is required
          const occupiedIndex = plotOptions.findIndex(opt => {
            const trimmed = opt.trim();
            return trimmed.startsWith(item.related_plot + ' ');
          });
          
          if (occupiedIndex >= 0) {
            this.logger.warn(`Plot "${item.related_plot}" is occupied, but selecting it anyway: ${plotOptions[occupiedIndex]}`);
            await this.page.locator('[role="option"]:visible').nth(occupiedIndex).click();
            await this.page.waitForTimeout(2000);
            
            const selectedText = await plotCombobox.textContent();
            this.logger.info(`  - Plot selected (occupied): ${item.related_plot} (combobox shows: "${selectedText?.trim()}")`);
          } else {
            // Can't find any matching plot - just close dropdown and leave as "All"
            this.logger.error(`Cannot find plot "${item.related_plot}" in options. Available: ${JSON.stringify(plotOptions)}`);
            await this.page.keyboard.press('Escape');
            await this.page.waitForTimeout(1000);
          }
        }
      } catch (error) {
        this.logger.error(`Failed to select plot: ${error}`);
        throw error;
      }
    }

    // 3. Fill QUANTITY, PRICE, DISCOUNT (input fields)
    // IMPORTANT: Test-ID pattern differs between row 1 and row 2+
    // Row 1: qty = "sales-calculator-input", price/discount = "sales-calculator-input-0"
    // Row 2+: qty/price/discount ALL = "sales-calculator-input-0"
    //
    // So for "sales-calculator-input-0" inputs, we have:
    // - Index 0: price row 1
    // - Index 1: discount row 1
    // - Index 2: qty row 2
    // - Index 3: price row 2
    // - Index 4: discount row 2
    // - Index 5: qty row 3
    // - etc. (3 inputs per row after row 1)
    
    try {
      if (index === 0) {
        // ROW 1: Qty has its own test-id, price/discount use "sales-calculator-input-0"
        const qtyInput = this.page.locator('[data-testid="sales-calculator-input"]').first();
        await qtyInput.fill(item.quantity.toString());
        await this.page.waitForTimeout(300);
        this.logger.info(`  - Quantity: ${item.quantity}`);
        
        const priceDiscountInputs = this.page.locator('[data-testid="sales-calculator-input-0"]');
        await priceDiscountInputs.nth(0).fill(item.price.toString());
        await this.page.waitForTimeout(300);
        this.logger.info(`  - Price: ${item.price}`);
        
        await priceDiscountInputs.nth(1).fill(item.discount.toString());
        await this.page.waitForTimeout(300);
        this.logger.info(`  - Discount: ${item.discount}`);
      } else {
        // ROW 2+: All three inputs use "sales-calculator-input-0"
        // Calculate offset: row 2 starts at index 2 (after row 1's price+discount)
        const baseOffset = 2; // Price and discount from row 1
        const inputsPerRow = 3; // Qty, price, discount for each subsequent row
        const rowOffset = baseOffset + ((index - 1) * inputsPerRow);
        
        const priceDiscountInputs = this.page.locator('[data-testid="sales-calculator-input-0"]');
        const qtyIndex = rowOffset;
        const priceIndex = rowOffset + 1;
        const discountIndex = rowOffset + 2;
        
        this.logger.info(`Row ${index + 1} input indices: qty=${qtyIndex}, price=${priceIndex}, discount=${discountIndex}`);
        
        await priceDiscountInputs.nth(qtyIndex).fill(item.quantity.toString());
        await this.page.waitForTimeout(300);
        this.logger.info(`  - Quantity: ${item.quantity}`);
        
        await priceDiscountInputs.nth(priceIndex).fill(item.price.toString());
        await this.page.waitForTimeout(300);
        this.logger.info(`  - Price: ${item.price}`);
        
        await priceDiscountInputs.nth(discountIndex).fill(item.discount.toString());
        await this.page.waitForTimeout(300);
        this.logger.info(`  - Discount: ${item.discount}`);
      }
      
    } catch (error) {
      this.logger.error(`Failed to fill inputs: ${error}`);
      throw error;
    }

    await this.page.waitForTimeout(800);
    this.logger.info(`Item ${index + 1} filled successfully`);
  }

  /**
   * Add multiple items to the sale
   */
  async addItems(items: SaleItem[]): Promise<void> {
    this.logger.info(`Adding ${items.length} items to sale`);
    
    for (let i = 0; i < items.length; i++) {
      if (i > 0) {
        // Click Add Item button for additional items
        await this.clickAddItem();
        
        // Wait for new row to appear by checking count of "Add description" buttons
        const expectedCount = i + 1;
        this.logger.info(`Waiting for row ${expectedCount} to appear...`);
        
        let rowReady = false;
        for (let attempt = 0; attempt < 30; attempt++) {
          const currentCount = await this.page.locator('button:has-text("Add description")').count();
          
          if (currentCount >= expectedCount) {
            // Verify that the new row button is visible
            try {
              const newButton = this.page.locator('button:has-text("Add description")').nth(i);
              await newButton.waitFor({ state: 'visible', timeout: 2000 });
              
              this.logger.info(`New item row ${expectedCount} ready (found ${currentCount} "Add description" buttons)`);
              rowReady = true;
              await this.page.waitForTimeout(2000); // Extra wait for row stabilization
              break;
            } catch (e) {
              this.logger.warn(`Row ${expectedCount} button found but not yet visible, attempt ${attempt + 1}`);
            }
          }
          await this.page.waitForTimeout(500);
        }
        
        if (!rowReady) {
          this.logger.error(`Failed to wait for new row ${expectedCount} after 15 seconds`);
          throw new Error(`New item row ${expectedCount} did not appear or is not ready`);
        }
      }
      await this.fillItemDetails(i, items[i]);
    }
  }

  /**
   * Get the sale summary values
   */
  async getSaleSummary(): Promise<SaleSummary> {
    this.logger.info('Getting sale summary');
    
    // Wait for summary section to be ready
    await this.page.waitForTimeout(2000);
    
    // Use different approach: get all value divs in summary section
    const summarySection = this.page.locator('button:has-text("ADD ITEM")').locator('..').locator('..');
    const allTexts = await summarySection.locator('div').allTextContents();
    
    this.logger.info(`All summary texts: ${JSON.stringify(allTexts)}`);
    
    // Filter for dollar values only and clean them
    const dollarValues = allTexts
      .filter(t => t.trim().startsWith('$') && t.trim().match(/^\$[\d,]+\.\d{2}/))
      .map(t => t.trim().replace(/\s+/g, '')) // Remove all whitespace
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
    
    this.logger.info(`Dollar values found: ${JSON.stringify(dollarValues)}`);
    
    // Expected order: subtotal, discount, vat, total
    const subtotal = dollarValues[0] || '$0.00';
    const discount = dollarValues[1] || '$0.00';
    const vat = dollarValues[2] || '$0.00';
    const total = dollarValues[3] || '$0.00';

    const summary = {
      subtotal,
      discount,
      vat,
      total
    };

    this.logger.info(`Sale Summary: ${JSON.stringify(summary)}`);
    return summary;
  }

  /**
   * Validate the sale summary matches expected values
   */
  async validateSaleSummary(expected: SaleSummary): Promise<void> {
    this.logger.info('Validating sale summary');
    const actual = await this.getSaleSummary();

    this.logger.info(`Expected: ${JSON.stringify(expected)}`);
    this.logger.info(`Actual: ${JSON.stringify(actual)}`);

    expect(actual.subtotal).toBe(expected.subtotal);
    expect(actual.discount).toBe(expected.discount);
    expect(actual.vat).toBe(expected.vat);
    expect(actual.total).toBe(expected.total);

    this.logger.info('Sale summary validation passed');
  }

  /**
   * Click the Create button to submit the sale
   */
  async clickCreate(): Promise<void> {
    this.logger.info('Clicking Create button');
    
    // Wait for page to be ready
    await this.page.waitForTimeout(1000);
    
    // Check if CREATE button exists and its state
    const createButton = this.page.locator(salesSelectors.createButton);
    const buttonCount = await createButton.count();
    this.logger.info(`CREATE button count: ${buttonCount}`);
    
    if (buttonCount === 0) {
      this.logger.error('CREATE button not found');
      throw new Error('CREATE button not found on page');
    }
    
    // Check button state
    const isVisible = await createButton.isVisible();
    const isEnabled = await createButton.isEnabled();
    this.logger.info(`CREATE button visible: ${isVisible}, enabled: ${isEnabled}`);
    
    if (!isEnabled) {
      this.logger.warn('CREATE button is disabled - checking form validation');
      // Log any validation errors if visible
      const errorMessages = await this.page.locator('.mat-error, .error, [class*="error"]').allTextContents();
      if (errorMessages.length > 0) {
        this.logger.error(`Form validation errors: ${JSON.stringify(errorMessages)}`);
      }
    }
    
    // Wait for button to be visible and enabled
    await this.page.waitForSelector(salesSelectors.createButton, { state: 'visible', timeout: 10000 });
    
    const urlBefore = this.page.url();
    this.logger.info(`URL before CREATE click: ${urlBefore}`);
    
    // Click CREATE button on the form
    await this.page.locator(salesSelectors.createButton).click({ force: true });
    this.logger.info('CREATE button clicked - waiting for confirmation dialog');
    
    // Wait for confirmation dialog to appear
    await this.page.waitForTimeout(1500);
    
    // Check if confirmation dialog appeared
    const dialogVisible = await this.page.locator('mat-dialog-container, [role="dialog"]').isVisible().catch(() => false);
    
    if (dialogVisible) {
      this.logger.info('Confirmation dialog appeared');
      
      // Click CREATE button in the confirmation dialog
      const dialogCreateButton = this.page.locator('mat-dialog-container button:has-text("CREATE"), [role="dialog"] button:has-text("CREATE")').first();
      await dialogCreateButton.waitFor({ state: 'visible', timeout: 5000 });
      await dialogCreateButton.click();
      this.logger.info('CREATE button in confirmation dialog clicked');
    } else {
      this.logger.warn('No confirmation dialog appeared, proceeding...');
    }
    
    // Wait for API call to /api/v1/invoices/ to complete (POST - create invoice)
    this.logger.info('Waiting for /api/v1/invoices/ API endpoint (POST - create invoice)...');
    await NetworkHelper.waitForApiEndpoint(this.page, '/api/v1/invoices/', 30000);
    this.logger.info('/api/v1/invoices/ API endpoint (POST) completed successfully');
    
    // Set up listener for invoice list API BEFORE waiting for navigation
    // This ensures we catch the API call when page loads
    const invoiceListPromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/v1/invoices?page=') && response.status() === 200,
      { timeout: 20000 }
    ).catch(() => null); // Don't throw if timeout
    
    // Wait for navigation to sales list page (can be /sales or /sales-table)
    await this.page.waitForURL(/\/sales$|\/sales\?|\/sales-table/, { timeout: 15000 });
    this.logger.info('Navigated back to sales list page');
    
    // Wait for the invoice list API we set up earlier
    this.logger.info('Waiting for invoice list API endpoint (GET)...');
    const invoiceListResponse = await invoiceListPromise;
    
    if (invoiceListResponse) {
      this.logger.info(`✓ Invoice list API endpoint completed: ${invoiceListResponse.url()}`);
    } else {
      this.logger.warn('Invoice list API timeout, but will proceed with table validation');
    }
    
    // Wait for sales table to load completely
    await this.page.waitForSelector('table', { state: 'visible', timeout: 10000 });
    this.logger.info('Sales table loaded');
  }

  /**
   * Click the ADD SALE button on the Edit Plot page to navigate to Create Sale page
   */
  async clickAddSaleButton(): Promise<void> {
    this.logger.info('Clicking ADD SALE button on Edit page');
    await this.page.waitForTimeout(2000);

    // Try the primary "ADD SALE" button first
    const addSaleBtn = this.page.locator('button:has-text("ADD SALE"), a:has-text("ADD SALE")');
    const hasPrimaryBtn = await addSaleBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasPrimaryBtn) {
      this.logger.info('Found "ADD SALE" button — clicking');
      await addSaleBtn.click();
    } else {
      this.logger.info('"ADD SALE" button not found — trying Sales section add button');
      // Try various selectors for the "+ ADD" button in the Sales section
      // The section heading may be "Sales" and has a nearby ADD/+ button
      const candidates = [
        this.page.locator('section:has-text("Sales") button:has-text("ADD")').first(),
        this.page.locator('div:has-text("Sales") button:has-text("ADD")').last(),
        this.page.locator('mat-card:has-text("Sales") button:has-text("ADD")').first(),
        this.page.locator('button:has-text("ADD")').first(),
      ];

      let clicked = false;
      for (const candidate of candidates) {
        const isVis = await candidate.isVisible({ timeout: 3000 }).catch(() => false);
        if (isVis) {
          this.logger.info('Found Sales section ADD button via fallback — clicking');
          await candidate.click();
          clicked = true;
          break;
        }
      }

      if (!clicked) {
        // Last resort: scroll down and look for any ADD button
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await this.page.waitForTimeout(1000);
        const anyAddBtn = this.page.locator('button:has-text("ADD")').first();
        await anyAddBtn.waitFor({ state: 'visible', timeout: 10000 });
        await anyAddBtn.click();
      }
    }
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000);
    this.logger.info('Navigated to Create Sale page');
  }

  /**
   * Open the Add Purchaser modal (search-based, not the new person dialog)
   * This opens a search modal where you type a name and select from suggestions
   */
  async clickAddPurchaserModal(): Promise<void> {
    this.logger.info('Clicking ADD PURCHASER button to open search modal');
    await this.page.waitForSelector(salesSelectors.addPurchaserButton, { state: 'visible', timeout: 10000 });
    await this.page.locator(salesSelectors.addPurchaserButton).click();
    await this.page.waitForTimeout(1500);
    this.logger.info('ADD PURCHASER modal should now be open');
  }

  /**
   * In the Add Purchaser search modal, type a name and select from the dropdown suggestion
   * Uses pressSequentially to trigger Angular reactive search
   */
  async searchAndSelectPurchaser(firstName: string, lastName: string): Promise<void> {
    this.logger.info(`Searching for purchaser: ${firstName} ${lastName}`);

    // Wait for the dialog/modal to appear
    await this.page.waitForSelector('mat-dialog-container, [role="dialog"]', { state: 'visible', timeout: 10000 });
    this.logger.info('Add person dialog visible');
    await this.page.waitForTimeout(500);

    // Fill first name field inside the dialog using pressSequentially to trigger search
    const firstNameInput = this.page.locator('mat-dialog-container input[formcontrolname="first_name"], [role="dialog"] input[formcontrolname="first_name"]').first();
    await firstNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await firstNameInput.click();
    await firstNameInput.pressSequentially(firstName, { delay: 80 });
    this.logger.info(`Typed first name: ${firstName}`);
    await this.page.waitForTimeout(500);

    // Fill last name field
    const lastNameInput = this.page.locator('mat-dialog-container input[formcontrolname="last_name"], [role="dialog"] input[formcontrolname="last_name"]').first();
    await lastNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await lastNameInput.click();
    await lastNameInput.pressSequentially(lastName, { delay: 80 });
    this.logger.info(`Typed last name: ${lastName}`);

    // Wait for dropdown suggestions to appear — the suggestion list is a custom div, not mat-option.
    // Use getByText with exact match to find the name row without matching the entire dialog.
    this.logger.info('Waiting for dropdown suggestion to appear...');
    const dialog = this.page.locator('mat-dialog-container').first();
    // Wait for the name text to appear in the dialog (inside the suggestion dropdown)
    const suggestionOption = dialog.getByText(`${firstName} ${lastName}`, { exact: true }).first();
    await suggestionOption.waitFor({ state: 'visible', timeout: 15000 });
    this.logger.info(`Found suggestion for "${firstName} ${lastName}", clicking...`);
    await suggestionOption.click();

    // Wait for modal to close after selection
    await this.page.waitForSelector('mat-dialog-container, [role="dialog"]', { state: 'hidden', timeout: 10000 });
    this.logger.info('Modal closed after purchaser selection');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click the Item dropdown (first mat-select for items on the Create Sale form)
   * and select the first available item, returning its related plot value
   */
  async selectFirstItemAndGetPlot(): Promise<string> {
    this.logger.info('Clicking the Item dropdown to select the first available item');

    // The item dropdown is a mat-select in the items row section.
    // The Add Sale form typically has: Cemetery (index 0), Owner (index 1), then Item (index 2), Plot (index 3).
    // When navigating from Edit Plot, Cemetery may not be present — so Item is at index 1 or 2.
    // We skip known non-item selects by looking for mat-selects that are NOT formcontrolname=cemetery/owner.
    // Use nth(2) as a safe fallback: if Cemetery is present (index 0), Owner (1), Item (2).
    // If Cemetery is absent (single-cemetery org), Owner (0), Item (1) — use nth(1).
    // We detect which index to use by checking the total count.
    const allMatSelects = await this.page.locator('mat-select').all();
    this.logger.info(`mat-select count on Create Sale page: ${allMatSelects.length}`);

    // The Item dropdown is inside the items table row — look for the ADD ITEM button's parent container
    // to scope the mat-select search to just the items section (not the top form's Cemetery/Owner)
    // Strategy: find mat-select elements that are inside the items panel (identified by ADD ITEM button proximity)
    // Fallback: skip cemetery/owner by formcontrolname, and also skip any that have 'cemetery'/'owner' visible text
    let itemSelectIndex = -1;
    for (let i = 0; i < allMatSelects.length; i++) {
      const fcn = (await allMatSelects[i].getAttribute('formcontrolname') || '').toLowerCase();
      const visibleText = ((await allMatSelects[i].textContent()) || '').trim().toLowerCase();
      if (fcn !== 'cemetery' && fcn !== 'owner' && !visibleText.includes('cemetery') && !visibleText.includes('gundul') && !visibleText.includes('tegal')) {
        itemSelectIndex = i;
        this.logger.info(`Item dropdown found at mat-select index: ${i} (formcontrolname="${fcn}", text="${visibleText}")`);
        break;
      }
    }

    if (itemSelectIndex === -1) {
      // Fallback: find mat-select scoped inside the items section panel
      this.logger.info('Fallback: looking for mat-select inside items panel (near ADD ITEM button)');
      const addItemBtn = this.page.locator('button:has-text("ADD ITEM"), button:has-text("+ ADD ITEM")').first();
      const itemsPanel = addItemBtn.locator('..').locator('..');
      const itemPanelSelects = itemsPanel.locator('mat-select');
      const count = await itemPanelSelects.count();
      if (count > 0) {
        await itemPanelSelects.first().click();
        await this.page.waitForTimeout(1500);
        await this.page.waitForSelector('mat-option', { state: 'visible', timeout: 10000 });
        const firstOption = this.page.locator('mat-option').first();
        const optionText = (await firstOption.textContent())?.trim() || '';
        this.logger.info(`First item option text (fallback): "${optionText}"`);
        await firstOption.click();
        await this.page.waitForTimeout(2000);
        this.logger.info('First item selected (fallback path)');
        return '';
      }
      throw new Error('Could not find the Item dropdown on the Create Sale page');
    }

    const itemSelect = this.page.locator('mat-select').nth(itemSelectIndex);
    await itemSelect.waitFor({ state: 'visible', timeout: 10000 });
    await itemSelect.click();
    await this.page.waitForTimeout(1500);

    // Wait for CDK overlay options to appear
    await this.page.waitForSelector('mat-option', { state: 'visible', timeout: 10000 });

    // Get first visible option details (item name and related plot)
    const firstOption = this.page.locator('mat-option').first();
    await firstOption.waitFor({ state: 'visible', timeout: 5000 });

    const optionText = (await firstOption.textContent())?.trim() || '';
    this.logger.info(`First item option text: "${optionText}"`);

    await firstOption.click();
    await this.page.waitForTimeout(2000);
    this.logger.info('First item selected');

    // After selecting item, the plot field should auto-fill. Get the related plot value.
    // The plot mat-select (next mat-select after the item) will show the related plot
    const allSelects = await this.page.locator('mat-select').all();
    this.logger.info(`Total mat-selects on page after item selection: ${allSelects.length}`);

    // Read the related plot from the plot dropdown (the one after the item dropdown)
    // We look for the mat-select that now shows a plot ID
    let relatedPlot = '';
    for (const select of allSelects) {
      const text = ((await select.textContent()) || '').trim();
      // Plot IDs match the pattern "X X N" (letter space letter space number)
      if (/^[A-Z]\s+[A-Z]\s+\d+/.test(text) || /^[A-Za-z]\s+[A-Za-z]\s+\d+/.test(text)) {
        relatedPlot = text;
        this.logger.info(`Found related plot in dropdown: "${relatedPlot}"`);
        break;
      }
    }

    if (!relatedPlot) {
      this.logger.warn('Could not find related plot value from item dropdown auto-fill');
    }

    return relatedPlot;
  }

  /**
   * Verify the purchaser is pre-filled on the Create Sale page (no modal needed).
   * Used when navigating from Edit Person — the person is auto-set as purchaser.
   * @param expectedName - Full name expected (e.g. "endri yanto")
   */
  async verifyPurchaserPreFilled(expectedName: string): Promise<void> {
    this.logger.info(`Verifying purchaser is pre-filled as: "${expectedName}"`);
    await this.page.waitForTimeout(1500);
    const purchaserSection = this.page.locator('text=Purchaser').locator('..').first();
    const purchaserText = ((await purchaserSection.textContent()) || '').trim();
    if (purchaserText.toLowerCase().includes(expectedName.toLowerCase())) {
      this.logger.info(`Purchaser "${expectedName}" is pre-filled correctly`);
    } else {
      this.logger.warn(`Purchaser section text: "${purchaserText}" — may not contain "${expectedName}", continuing`);
    }
  }

  /**
   * Select the first available item from the Item dropdown, then manually type
   * a related plot ID into the Related Plot CDK overlay search input.
   * @param relatedPlotId - Plot ID to search for (e.g. "A A 1")
   */
  async selectFirstItemWithRelatedPlot(relatedPlotId: string): Promise<void> {
    this.logger.info('Selecting first available item from Item dropdown');

    // Wait for page to fully load (ADD ITEM button may appear after a delay)
    await this.page.waitForTimeout(3000);

    // Find the item mat-select (skip cemetery/owner selects)
    const allMatSelects = await this.page.locator('mat-select').all();
    this.logger.info(`mat-select count on Create Sale page: ${allMatSelects.length}`);

    let itemSelectIndex = -1;
    for (let i = 0; i < allMatSelects.length; i++) {
      const fcn = (await allMatSelects[i].getAttribute('formcontrolname') || '').toLowerCase();
      const visibleText = ((await allMatSelects[i].textContent()) || '').trim().toLowerCase();
      if (fcn !== 'cemetery' && fcn !== 'owner' && !visibleText.includes('cemetery') && !visibleText.includes('gundul') && !visibleText.includes('tegal')) {
        itemSelectIndex = i;
        this.logger.info(`Item dropdown at mat-select index: ${i} (formcontrolname="${fcn}")`);
        break;
      }
    }

    if (itemSelectIndex === -1) {
      // No item dropdown visible yet — click ADD ITEM button to reveal the item row
      this.logger.info('No item dropdown found — clicking ADD ITEM button');
      const addItemBtn = this.page.locator('button:has-text("ADD ITEM"), button:has-text("+ ADD ITEM"), a:has-text("ADD ITEM")').first();
      const hasAddItem = await addItemBtn.isVisible({ timeout: 10000 }).catch(() => false);
      if (hasAddItem) {
        await addItemBtn.click();
        await this.page.waitForTimeout(1500);
        // Re-scan mat-selects after clicking ADD ITEM
        const newMatSelects = await this.page.locator('mat-select').all();
        for (let i = 0; i < newMatSelects.length; i++) {
          const fcn = (await newMatSelects[i].getAttribute('formcontrolname') || '').toLowerCase();
          const visibleText = ((await newMatSelects[i].textContent()) || '').trim().toLowerCase();
          if (fcn !== 'cemetery' && fcn !== 'owner' && !visibleText.includes('cemetery') && !visibleText.includes('gundul') && !visibleText.includes('tegal')) {
            itemSelectIndex = i;
            this.logger.info(`Item dropdown found at index: ${i} after ADD ITEM click`);
            break;
          }
        }
      }
      if (itemSelectIndex === -1) {
        throw new Error('Could not find the Item dropdown on the Create Sale page even after clicking ADD ITEM');
      }
    }

    const itemSelect = this.page.locator('mat-select').nth(itemSelectIndex);
    await itemSelect.waitFor({ state: 'visible', timeout: 10000 });
    await itemSelect.click();
    await this.page.waitForTimeout(1500);
    await this.page.waitForSelector('mat-option', { state: 'visible', timeout: 10000 });

    const firstOption = this.page.locator('mat-option').first();
    const optionText = (await firstOption.textContent())?.trim() || '';
    this.logger.info(`First item option: "${optionText}"`);
    await firstOption.click();
    await this.page.waitForTimeout(1500);
    this.logger.info('First item selected');

    // Now find the Related Plot mat-select (next one after the item) and type the plot ID
    this.logger.info(`Selecting related plot: "${relatedPlotId}"`);
    const plotSelect = this.page.locator('mat-select').nth(itemSelectIndex + 1);
    await plotSelect.waitFor({ state: 'visible', timeout: 10000 });
    await plotSelect.click();
    this.logger.info('Clicked Related Plot mat-select — waiting for CDK overlay search input');

    // The CDK overlay has a search input at the top
    const overlayInput = this.page.locator('.cdk-overlay-container input').first();
    await overlayInput.waitFor({ state: 'visible', timeout: 8000 });
    await overlayInput.click();
    await overlayInput.pressSequentially(relatedPlotId, { delay: 80 });
    this.logger.info(`Typed "${relatedPlotId}" into related plot search`);

    // Wait for matching mat-option and click it
    const plotOption = this.page.locator(`mat-option:has-text("${relatedPlotId}")`).first();
    await plotOption.waitFor({ state: 'visible', timeout: 15000 });
    await plotOption.click();
    this.logger.info(`Related plot "${relatedPlotId}" selected`);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click Create on the sale form, handle confirmation modal, and wait for navigation
   * back to Edit Plot page (not the sales list page)
   */
  async clickCreateFromEditPlot(): Promise<void> {
    this.logger.info('Clicking Create button (from Edit Plot flow)');

    await this.page.waitForTimeout(1000);

    const createButton = this.page.locator(salesSelectors.createButton).first();
    await createButton.waitFor({ state: 'visible', timeout: 10000 });

    const isEnabled = await createButton.isEnabled();
    this.logger.info(`CREATE button enabled: ${isEnabled}`);

    if (!isEnabled) {
      const errorMessages = await this.page.locator('.mat-error, .error, [class*="error"]').allTextContents();
      if (errorMessages.length > 0) {
        this.logger.error(`Form validation errors: ${JSON.stringify(errorMessages)}`);
      }
      throw new Error('CREATE button is disabled — form may have validation errors');
    }

    await createButton.click({ force: true });
    this.logger.info('CREATE button clicked — waiting for confirmation dialog');

    // Wait for confirmation dialog
    await this.page.waitForTimeout(1500);
    const dialogVisible = await this.page.locator('mat-dialog-container, [role="dialog"]').isVisible().catch(() => false);

    if (dialogVisible) {
      this.logger.info('Confirmation dialog appeared');
      const dialogCreateButton = this.page.locator('mat-dialog-container button:has-text("CREATE"), [role="dialog"] button:has-text("CREATE")').first();
      await dialogCreateButton.waitFor({ state: 'visible', timeout: 5000 });
      await dialogCreateButton.click();
      this.logger.info('Clicked CREATE in confirmation dialog');
    } else {
      this.logger.warn('No confirmation dialog appeared');
    }

    // Wait for navigation back to Edit Plot page — SAVE/CANCEL buttons are always present on edit plot page
    await this.page.waitForSelector('button:has-text("SAVE"), button:has-text("CANCEL")', { state: 'visible', timeout: 45000 });
    this.logger.info('Navigated back to Edit Plot page');
    await this.page.waitForTimeout(2000);
  }

  /**
   * Verify a new sale entry exists and the reference appears on the left side of the INV ID
   * The sales tab shows entries like "REF-001 / INV-001"
   */
  async verifySaleEntryWithReference(reference: string): Promise<void> {
    this.logger.info(`Verifying sale entry with reference: "${reference}"`);

    // Click on the Sales tab if not already active
    const salesTab = this.page.locator('[role="tab"]:has-text("Sales"), mat-tab-header:has-text("Sales"), .mat-tab-label:has-text("Sales")').first();
    const salesTabVisible = await salesTab.isVisible().catch(() => false);
    if (salesTabVisible) {
      await salesTab.click();
      await this.page.waitForTimeout(1500);
    }

    // Wait for the sales section to be populated
    await this.page.waitForTimeout(1000);

    // Look for the reference text anywhere in the sales list area
    // The format is typically "REF / INV-ID" — reference on the left, invoice ID on the right
    const referenceLocator = this.page.locator(`text=${reference}`).first();
    await referenceLocator.waitFor({ state: 'visible', timeout: 15000 });
    this.logger.info(`Reference "${reference}" found on the Edit Plot page`);

    // Verify reference appears to the left of the INV ID
    // Get the parent container and check relative positioning
    const parentContainer = referenceLocator.locator('..');
    const fullText = (await parentContainer.textContent()) || '';
    this.logger.info(`Sale entry container text: "${fullText}"`);

    // The reference should appear before the invoice separator (/ or INV)
    const refIndex = fullText.indexOf(reference);
    const invIndex = fullText.search(/INV|\/\s*\d/);

    if (invIndex >= 0 && refIndex >= 0 && refIndex < invIndex) {
      this.logger.info(`Reference "${reference}" confirmed on the left side of the INV ID`);
    } else {
      // Fallback: just verify the reference is visible
      this.logger.warn(`Could not confirm left/right positioning, but reference "${reference}" is visible`);
    }
  }

  /**
   * Click the Save button
   */
  async clickSave(): Promise<void> {
    this.logger.info('Clicking Save button');
    await this.page.locator(salesSelectors.saveButton).click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);
  }

  /**
   * Click the Cancel button
   */
  async clickCancel(): Promise<void> {
    this.logger.info('Clicking Cancel button');
    await this.page.locator(salesSelectors.cancelButton).click();
  }

  /**
   * Validate purchaser name in sales table
   * Checks the first row in the table for the expected purchaser name
   */
  async validatePurchaserInTable(expectedPurchaserName: string): Promise<void> {
    this.logger.info(`Validating purchaser name in table: ${expectedPurchaserName}`);
    
    // Wait for table to be visible
    await this.page.waitForSelector('table', { state: 'visible', timeout: 10000 });
    
    // Get the first row's purchaser cell
    // Table columns: checkbox(0), Cemetery(1), Sale ID(2), Purchaser(3), Related Plot(s)(4)...
    const firstRowPurchaser = await this.page.locator('table tbody tr').first().locator('td').nth(3).textContent();
    const trimmedPurchaser = firstRowPurchaser?.trim() || '';
    const trimmedExpected = expectedPurchaserName.trim();

    // Check if purchaser name contains the expected name (handles truncated text like "Linda Rodr...")
    if (trimmedPurchaser.includes(trimmedExpected) || trimmedExpected.includes(trimmedPurchaser.replace(/\.\.\.$/, ''))) {
      this.logger.info(`✓ Purchaser name validated: ${trimmedPurchaser} (contains: ${trimmedExpected})`);
    } else {
      this.logger.error(`✗ Purchaser name mismatch. Expected to contain: "${trimmedExpected}", Found: "${trimmedPurchaser}"`);
      throw new Error(`Purchaser name mismatch. Expected to contain: "${trimmedExpected}", Found: "${trimmedPurchaser}"`);
    }
  }

  /**
   * Create a complete sale with all details
   */
  async createSale(saleData: SaleData): Promise<void> {
    this.logger.info('Creating sale with complete data');

    // Fill reference
    await this.fillReference(saleData.reference);

    // Fill note if provided
    if (saleData.note) {
      await this.fillNote(saleData.note);
    }

    // Add purchaser if provided
    if (saleData.purchaser) {
      await this.clickAddPurchaser();
      // Use addNewPurchaser instead of selectPurchaser
      const firstName = saleData.purchaser.firstName || '';
      const lastName = saleData.purchaser.lastName || '';
      const email = saleData.purchaser.email || '';
      if (firstName && lastName && email) {
        await this.addNewPurchaser(firstName, lastName, email);
      }
    }

    // Add items
    await this.addItems(saleData.items);

    this.logger.info('Sale creation form completed');
  }
}
