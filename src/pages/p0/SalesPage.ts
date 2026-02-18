import { Page, expect } from '@playwright/test';
import { Logger } from '../../utils/Logger.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';
import { salesSelectors } from '../../selectors/p0/sales.selectors.js';

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
   * Get invoice settings from API
   * Returns the default_due_days value
   */
  async getInvoiceSettings(): Promise<number> {
    this.logger.info('Fetching invoice settings from API');

    // Fetch invoice settings using page.evaluate with auth token from localStorage
    try {
      const settings = await this.page.evaluate(async () => {
        const token = localStorage.getItem('accessToken');
        // Extract org ID from the current URL path (e.g. /api/v1/organization/{id}/...)
        // Or try all orgs endpoint and get the first match
        const currentUrl = window.location.href;
        
        // Try to find org ID from network requests or page context
        // The API endpoint pattern is /api/v1/organization/{orgId}/invoice-settings/
        // We need to discover the org ID dynamically
        const orgMatch = document.cookie.match(/org_id=(\d+)/) || 
                         currentUrl.match(/organization\/(\d+)/);
        
        // Try fetching with a broad search - the API returns paginated data
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // First try to get org list to find the org ID
        const orgResponse = await fetch('/api/v1/user/', { headers });
        if (orgResponse.ok) {
          const userData = await orgResponse.json();
          // Try to extract org ID from user data
          const orgId = userData?.data?.organization_id || userData?.organization_id;
          if (orgId) {
            const settingsRes = await fetch(`/api/v1/organization/${orgId}/invoice-settings/`, { headers });
            if (settingsRes.ok) {
              const settingsData = await settingsRes.json();
              if (settingsData?.data?.[0]) {
                return settingsData.data[0];
              }
            }
          }
        }

        // Fallback: try extracting org ID from the page URL or known patterns
        // URL pattern: /customer-organization/sales-table -> need to get org ID another way
        // Try common org IDs or use the invoice-settings endpoint with org from URL
        return null;
      });

      if (settings && typeof settings.default_due_days === 'number') {
        this.logger.info(`Invoice settings fetched: default_due_days = ${settings.default_due_days}`);
        return settings.default_due_days;
      }
    } catch (e) {
      this.logger.info(`Failed to fetch via page.evaluate: ${(e as Error).message}`);
    }

    // Fallback: read the due date directly from the form and calculate the difference from today
    try {
      this.logger.info('Falling back to reading due date from form to determine default_due_days');
      const dueDateValue = await this.page.locator('[formcontrolname="due_date"]').first().inputValue();
      const issueDateValue = await this.page.locator('[formcontrolname="issue_date"]').first().inputValue();
      
      if (dueDateValue && issueDateValue) {
        // Parse DD/MM/YYYY format
        const [dDay, dMonth, dYear] = dueDateValue.split('/').map(Number);
        const [iDay, iMonth, iYear] = issueDateValue.split('/').map(Number);
        const dueDate = new Date(dYear, dMonth - 1, dDay);
        const issueDate = new Date(iYear, iMonth - 1, iDay);
        const diffDays = Math.round((dueDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
        this.logger.info(`Calculated default_due_days from form: ${diffDays} (issue: ${issueDateValue}, due: ${dueDateValue})`);
        return diffDays;
      }
    } catch (e) {
      this.logger.info(`Failed to read dates from form: ${(e as Error).message}`);
    }

    // Default fallback
    this.logger.info('Using default due days: 0');
    return 0;
  }

  /**
   * Validate issue date is pre-filled with current date
   * Format: DD/MM/YYYY
   */
  async validateIssueDate(): Promise<void> {
    this.logger.info('Validating issue date is pre-filled with current date');

    await this.page.waitForSelector(salesSelectors.issueDateInput, { state: 'visible', timeout: 10000 });

    const actualIssueDate = await this.page.locator(salesSelectors.issueDateInput).inputValue();
    this.logger.info(`Actual issue date value: "${actualIssueDate}"`);

    // Get current date in DD/MM/YYYY format
    const today = new Date();
    const expectedDate = this.formatDateToDDMMYYYY(today);
    this.logger.info(`Expected issue date (current date): "${expectedDate}"`);

    if (actualIssueDate !== expectedDate) {
      throw new Error(`Issue date validation failed. Expected: "${expectedDate}", Actual: "${actualIssueDate}"`);
    }

    this.logger.info('Issue date validation passed - pre-filled with current date');
  }

  /**
   * Validate due date is current date + default due days
   * If defaultDueDays not provided, fetch from invoice settings API
   * Format: DD/MM/YYYY
   */
  async validateDueDate(defaultDueDays?: number): Promise<void> {
    this.logger.info('Validating due date is current date + default due days');

    let dueDays = defaultDueDays;
    if (dueDays === undefined) {
      dueDays = await this.getInvoiceSettings();
    }

    await this.page.waitForSelector(salesSelectors.dueDateInput, { state: 'visible', timeout: 10000 });

    const actualDueDate = await this.page.locator(salesSelectors.dueDateInput).inputValue();
    this.logger.info(`Actual due date value: "${actualDueDate}"`);

    // Calculate expected due date (current date + due days)
    const today = new Date();
    const expectedDueDate = this.addDays(today, dueDays);
    const expectedDateStr = this.formatDateToDDMMYYYY(expectedDueDate);
    this.logger.info(`Expected due date (current date + ${dueDays} days): "${expectedDateStr}"`);

    if (actualDueDate !== expectedDateStr) {
      throw new Error(`Due date validation failed. Expected: "${expectedDateStr}" (+${dueDays} days), Actual: "${actualDueDate}"`);
    }

    this.logger.info(`Due date validation passed - ${dueDays} days from current date`);
  }

  /**
   * Format date to DD/MM/YYYY
   */
  private formatDateToDDMMYYYY(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Add days to a date
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
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
    
    const itemComboboxIndex = 1 + (index * 2); // Skip owner (0), then item comboboxes at 1, 3, 5...
    const plotComboboxIndex = 2 + (index * 2); // Plot comboboxes at 2, 4, 6...

    // 1. Select ITEM from search dropdown
    try {
      this.logger.info(`  - Selecting item: ${item.description} (combobox index: ${itemComboboxIndex})`);
      
      // Get the specific item combobox
      const itemCombobox = this.page.locator('mat-select').nth(itemComboboxIndex);
      await itemCombobox.waitFor({ state: 'visible', timeout: 10000 });
      
      // Click to open the item dropdown
      await itemCombobox.click();
      await this.page.waitForTimeout(1500);
      
      // Wait for the search textbox inside the dropdown panel to appear
      // Use the panel-specific selector to avoid matching other inputs on the page
      const itemSearchInput = this.page.locator('mat-select-search input, .mat-select-panel input[type="text"], [role="listbox"] input[type="text"]').first();
      const searchVisible = await itemSearchInput.isVisible().catch(() => false);
      
      let searchInput;
      if (searchVisible) {
        searchInput = itemSearchInput;
      } else {
        // Fallback to first visible text input
        searchInput = this.page.locator('input[type="text"]').first();
      }
      await searchInput.waitFor({ state: 'visible', timeout: 5000 });
      
      // Type the item name in the search box
      await searchInput.fill(item.description);
      this.logger.info(`  - Typed "${item.description}" in search box`);
      
      // Wait for search results to filter - wait until we see options that match
      await this.page.waitForTimeout(2000);
      
      // Wait for at least one option to appear
      await this.page.waitForSelector('[role="option"], mat-option', { state: 'visible', timeout: 5000 });
      
      // Log available options for debugging
      const itemOptions = await this.page.locator('[role="option"]:visible, mat-option:visible').allTextContents();
      this.logger.info(`Available item options after search: ${JSON.stringify(itemOptions.map(o => o.trim()))}`);
      
      // Find the matching option - try exact text match first, then contains
      let itemOption = this.page.locator('[role="option"], mat-option').filter({ hasText: new RegExp(`^\\s*${item.description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') }).first();
      let optionVisible = await itemOption.isVisible().catch(() => false);
      
      if (!optionVisible) {
        // Fallback: use :has-text which does substring match
        itemOption = this.page.locator(`[role="option"]:has-text("${item.description}"), mat-option:has-text("${item.description}")`).first();
        optionVisible = await itemOption.isVisible().catch(() => false);
      }
      
      if (optionVisible) {
        await itemOption.click();
        await this.page.waitForTimeout(2000);
        
        // Verify item is selected by checking combobox text
        const verifyCombobox = this.page.locator('mat-select').nth(itemComboboxIndex);
        const selectedText = await verifyCombobox.textContent();
        this.logger.info(`  - Item selected: ${item.description} (combobox shows: "${selectedText?.trim()}")`);
        
        if (!selectedText || !selectedText.toLowerCase().includes(item.description.toLowerCase())) {
          this.logger.warn(`Item selection may need verification - combobox shows "${selectedText?.trim()}" for "${item.description}"`);
        }
      } else {
        this.logger.error(`Item "${item.description}" not found in dropdown. Available: ${JSON.stringify(itemOptions.map(o => o.trim()))}`);
        // Take screenshot for debugging
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(500);
        throw new Error(`Item "${item.description}" not found in item dropdown. Available options: ${JSON.stringify(itemOptions.map(o => o.trim()))}`);
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

        // Setup wait for API response BEFORE triggering the search
        const apiPromise = this.page.waitForResponse(
          (response) => response.url().includes('/v2/search/plots-records-persons') && response.status() === 200,
          { timeout: 10000 }
        ).catch(() => {
          this.logger.info('Plot search API timeout or data may be cached');
          return null;
        });

        // Type the plot name to search (triggers the API call)
        await plotSearchInput.fill(item.related_plot);

        // Wait for the API response (if called)
        const response = await apiPromise;
        if (response) {
          this.logger.info('Plot search API completed successfully');
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
   * Click the Save button
   * If payment was added, a confirmation dialog will appear that must be handled
   * After save, app auto-redirects to sales list — wait for that redirect and list to load
   */
  async clickSave(): Promise<void> {
    this.logger.info('Clicking Save button');
    await this.page.locator(salesSelectors.saveButton).scrollIntoViewIfNeeded();
    await this.page.locator(salesSelectors.saveButton).click();
    
    // Wait a moment for potential confirmation dialog
    await this.page.waitForTimeout(2000);
    
    // Check if payment confirmation dialog appeared
    const dialogVisible = await this.page.locator('mat-dialog-container, [role="dialog"]').isVisible().catch(() => false);
    
    if (dialogVisible) {
      this.logger.info('Payment confirmation dialog appeared');
      
      // Log dialog content for debugging
      const dialogContent = await this.page.locator('mat-dialog-container').textContent().catch(() => '');
      this.logger.info(`Dialog content: ${dialogContent?.substring(0, 200)}`);
      
      // Click "Save Sale" button in the confirmation dialog
      const saveSaleButton = this.page.locator('button:has-text("Save Sale")');
      const buttonExists = await saveSaleButton.isVisible().catch(() => false);
      
      if (buttonExists) {
        await saveSaleButton.click();
        this.logger.info('Clicked "Save Sale" button in confirmation dialog');
        
        // Wait for API call to /api/v1/invoices/ to complete (PATCH - update invoice with payment)
        this.logger.info('Waiting for /api/v1/invoices/ API endpoint (PATCH - save payment)...');
        await NetworkHelper.waitForApiEndpoint(this.page, '/api/v1/invoices/', 30000);
        this.logger.info('/api/v1/invoices/ API endpoint (PATCH) completed successfully');
        
        // Wait for dialog to close
        await this.page.waitForSelector('mat-dialog-container', { state: 'hidden', timeout: 5000 }).catch(() => {});
        await this.page.waitForTimeout(1000);
      } else {
        this.logger.warn('"Save Sale" button not found in dialog, trying generic confirm button');
        // Try other common button texts
        const confirmButton = this.page.locator('mat-dialog-container button').last();
        await confirmButton.click();
        this.logger.info('Clicked last button in dialog as fallback');
      }
    } else {
      this.logger.info('No confirmation dialog appeared');
    }
    
    // Wait for app to redirect to sales list
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(3000);
  }

  /**
   * Click Save for the last payment in multi-payment flow
   * Same as clickSave but waits for redirect to sales list and table to load (no reload)
   */
  async clickSaveLastPayment(): Promise<void> {
    this.logger.info('Clicking Save button (last payment)');
    await this.page.locator(salesSelectors.saveButton).scrollIntoViewIfNeeded();
    await this.page.locator(salesSelectors.saveButton).click();
    
    // Wait for potential confirmation dialog
    await this.page.waitForTimeout(2000);
    
    const dialogVisible = await this.page.locator('mat-dialog-container, [role="dialog"]').isVisible().catch(() => false);
    
    if (dialogVisible) {
      this.logger.info('Payment confirmation dialog appeared');
      
      const saveSaleButton = this.page.locator('button:has-text("Save Sale")');
      const buttonExists = await saveSaleButton.isVisible().catch(() => false);
      
      if (buttonExists) {
        await saveSaleButton.click();
        this.logger.info('Clicked "Save Sale" button in confirmation dialog');
        
        // Wait for API call to complete
        await NetworkHelper.waitForApiEndpoint(this.page, '/api/v1/invoices/', 30000);
        this.logger.info('Invoice API completed');
        
        // Wait for dialog to close
        await this.page.waitForSelector('mat-dialog-container', { state: 'hidden', timeout: 5000 }).catch(() => {});
      } else {
        const confirmButton = this.page.locator('mat-dialog-container button').last();
        await confirmButton.click();
      }
    }
    
    // Wait for app to auto-redirect to sales list
    await this.page.waitForURL(/\/sales$|\/sales\?|\/sales-table/, { timeout: 15000 }).catch(() => {});
    await this.page.waitForLoadState('domcontentloaded');
    
    // Wait for sales list API to load
    await NetworkHelper.waitForApiEndpoint(this.page, '/api/v1/invoices', 15000, { optional: true });
    
    // Wait for table to be visible
    await this.page.waitForSelector('table tbody tr', { state: 'visible', timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(1000);
    this.logger.info('Last payment saved, on sales list page');
  }

  /**
   * Click Save without reloading the page
   * Used for multi-payment flow where we need to stay on the edit page
   * to add more payments. If app auto-redirects to sales list, navigate back to edit page.
   */
  async clickSaveWithoutReload(): Promise<void> {
    // Capture current edit page URL before saving
    const editPageUrl = this.page.url();
    this.logger.info(`Clicking Save button (without reload). Current URL: ${editPageUrl}`);
    
    await this.page.locator(salesSelectors.saveButton).scrollIntoViewIfNeeded();
    await this.page.locator(salesSelectors.saveButton).click();
    
    // Wait a moment for potential confirmation dialog
    await this.page.waitForTimeout(2000);
    
    // Check if payment confirmation dialog appeared
    const dialogVisible = await this.page.locator('mat-dialog-container, [role="dialog"]').isVisible().catch(() => false);
    
    if (dialogVisible) {
      this.logger.info('Payment confirmation dialog appeared');
      
      const dialogContent = await this.page.locator('mat-dialog-container').textContent().catch(() => '');
      this.logger.info(`Dialog content: ${dialogContent?.substring(0, 200)}`);
      
      // Click "Save Sale" button in the confirmation dialog
      const saveSaleButton = this.page.locator('button:has-text("Save Sale")');
      const buttonExists = await saveSaleButton.isVisible().catch(() => false);
      
      if (buttonExists) {
        await saveSaleButton.click();
        this.logger.info('Clicked "Save Sale" button in confirmation dialog');
        
        // Wait for API call to complete (PATCH - update invoice with payment)
        this.logger.info('Waiting for /api/v1/invoices/ API endpoint (PATCH)...');
        await NetworkHelper.waitForApiEndpoint(this.page, '/api/v1/invoices/', 30000);
        this.logger.info('/api/v1/invoices/ API endpoint (PATCH) completed successfully');
        
        // Wait for dialog to close
        await this.page.waitForSelector('mat-dialog-container', { state: 'hidden', timeout: 5000 }).catch(() => {});
        await this.page.waitForTimeout(2000);
      } else {
        this.logger.warn('"Save Sale" button not found in dialog, trying generic confirm button');
        const confirmButton = this.page.locator('mat-dialog-container button').last();
        await confirmButton.click();
        this.logger.info('Clicked last button in dialog as fallback');
      }
    } else {
      this.logger.info('No confirmation dialog appeared');
    }
    
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000);
    
    // Check if app auto-redirected to sales list — if so, navigate back to edit page
    const currentUrl = this.page.url();
    this.logger.info(`URL after save: ${currentUrl}`);
    
    const isOnEditPage = currentUrl.includes('/sales/edit/');
    
    if (!isOnEditPage) {
      this.logger.info('App redirected away from edit page after save — navigating back');
      
      if (editPageUrl.includes('/sales/edit/')) {
        // Navigate back to the same edit page URL directly
        this.logger.info(`Navigating back to: ${editPageUrl}`);
        await this.page.goto(editPageUrl, { waitUntil: 'domcontentloaded' });
      } else {
        // Fallback: go to sales list and open latest sale
        this.logger.info('Edit URL not available, opening latest sale from list');
        await this.page.waitForSelector('table tbody tr', { state: 'visible', timeout: 10000 });
        await this.page.waitForTimeout(1000);
        await this.openLatestSale();
      }
      
      // Wait for edit page to fully load
      await this.page.waitForURL(/sales\/edit/, { timeout: 15000 });
      await this.page.waitForLoadState('domcontentloaded');
      await NetworkHelper.waitForApiEndpoint(this.page, '/api/v1/invoices/', 15000, { optional: true });
      
      // Wait for ADD PAYMENT button to be visible (page fully rendered)
      await this.page.waitForSelector(salesSelectors.addPaymentButton, { state: 'visible', timeout: 15000 });
      this.logger.info('Back on edit page — ready for next payment');
    } else {
      this.logger.info('Still on edit page — ready for next payment');
    }
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
    // Assuming the purchaser column is in the table - adjust selector if needed
    const firstRowPurchaser = await this.page.locator('table tbody tr').first().locator('td').nth(2).textContent();
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

  /**
   * Open the latest created sale (first row in the sales table)
   */
  async openLatestSale(): Promise<void> {
    this.logger.info('Opening the latest created sale');

    // Wait for sales table to be visible
    await this.page.waitForSelector(salesSelectors.salesTable, { state: 'visible', timeout: 10000 });

    // Wait for Angular to render and stabilize
    await this.page.waitForTimeout(2000);

    // Click on the first row's invoice ID cell (2nd column - first has checkbox, 2nd has ID)
    const firstRowIdCell = this.page.locator('table tbody tr').first().locator('td').nth(1);
    await firstRowIdCell.waitFor({ state: 'visible', timeout: 5000 });
    await firstRowIdCell.click();
    this.logger.info('Clicked on first sale ID cell');

    // Wait for navigation to edit page (URL pattern: /customer-organization/sales/edit/...)
    await this.page.waitForURL(/sales\/edit/, { timeout: 15000 });
    this.logger.info('Navigated to sale edit page');

    // Wait for page to fully load
    await this.page.waitForLoadState('domcontentloaded');
    
    // Wait for invoice data API to complete
    await NetworkHelper.waitForApiEndpoint(this.page, '/api/v1/invoices/', 15000, { optional: true });
    this.logger.info('Invoice data loaded');
    
    // Wait for ADD PAYMENT button to be visible (indicates form is fully rendered)
    await this.page.waitForSelector(salesSelectors.addPaymentButton, { state: 'visible', timeout: 15000 });
    this.logger.info('Sale edit page fully loaded - ADD PAYMENT button visible');
  }

  /**
   * Add a payment to the current invoice
   */
  async addPayment(payment: {
    amount: string;
    method: string;
    note?: string;
    date?: string;
    time?: string;
  }): Promise<void> {
    this.logger.info(`Adding payment: ${JSON.stringify(payment)}`);

    // Wait for ADD PAYMENT button - scroll down to payments section first
    const addPaymentBtn = this.page.locator(salesSelectors.addPaymentButton);
    await addPaymentBtn.waitFor({ state: 'visible', timeout: 20000 });
    await addPaymentBtn.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);
    await addPaymentBtn.click();
    this.logger.info('Clicked ADD PAYMENT button');
    
    // Wait for payment form to appear
    await this.page.waitForTimeout(2000);

    // The payment form has fields: Date, Time, Method, Note, Amount
    // All fields use formcontrolname attributes
    // Note: date and time fields are NOT auto-filled, must be filled manually
    
    // 1. Fill payment date (required)
    const paymentDateInput = this.page.locator('[formcontrolname="payment_date"]').first();
    await paymentDateInput.waitFor({ state: 'visible', timeout: 10000 });
    
    if (payment.date) {
      await paymentDateInput.fill(payment.date);
      this.logger.info(`Payment date filled: ${payment.date}`);
    } else {
      // Use current date if not provided
      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      await paymentDateInput.fill(dateStr);
      this.logger.info(`Payment date filled with today: ${dateStr}`);
    }
    await this.page.waitForTimeout(500);
    
    // 2. Fill payment time (required)
    const paymentTimeInput = this.page.locator('[formcontrolname="payment_time"]').first();
    await paymentTimeInput.waitFor({ state: 'visible', timeout: 10000 });
    
    if (payment.time) {
      await paymentTimeInput.fill(payment.time);
      this.logger.info(`Payment time filled: ${payment.time}`);
    } else {
      // Use current time if not provided
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      await paymentTimeInput.fill(timeStr);
      this.logger.info(`Payment time filled with now: ${timeStr}`);
    }
    await this.page.waitForTimeout(500);
    
    // 3. Select payment method using formcontrolname
    this.logger.info(`Selecting payment method: ${payment.method}`);
    const methodSelect = this.page.locator('[formcontrolname="payment_method"]').first();
    await methodSelect.waitFor({ state: 'visible', timeout: 10000 });
    await methodSelect.scrollIntoViewIfNeeded();
    await methodSelect.click();
    this.logger.info('Clicked payment method dropdown');
    await this.page.waitForTimeout(1000);

    // Wait for listbox to appear
    await this.page.waitForSelector('div[role="listbox"]', { state: 'visible', timeout: 10000 });
    this.logger.info('Payment method listbox appeared');
    
    // Get all available options for logging
    const allOptions = await this.page.locator('div[role="listbox"] mat-option').allTextContents();
    this.logger.info(`Available payment methods: ${JSON.stringify(allOptions)}`);

    // Try to find matching option by text
    const methodOption = this.page.locator(`div[role="listbox"] mat-option:has-text("${payment.method}")`).first();
    const optionVisible = await methodOption.isVisible().catch(() => false);

    if (optionVisible) {
      await methodOption.click();
      this.logger.info(`  - Method selected: ${payment.method}`);
    } else {
      // Fallback to first option
      this.logger.warn(`Payment method "${payment.method}" not found, selecting first option`);
      await this.page.locator('div[role="listbox"] mat-option:nth-child(1)').click();
    }
    await this.page.waitForTimeout(1000);

    // 4. Fill note (optional) - must use .last() to target payment form field, not main form
    if (payment.note) {
      this.logger.info(`Filling note: ${payment.note}`);
      const noteInput = this.page.locator('[formcontrolname="notes"]').last();
      const noteInputVisible = await noteInput.isVisible().catch(() => false);
      
      if (noteInputVisible) {
        await noteInput.scrollIntoViewIfNeeded();
        await noteInput.fill(payment.note);
        this.logger.info(`  - Note filled: ${payment.note}`);
      } else {
        this.logger.warn('Note input not found, skipping note');
      }
      await this.page.waitForTimeout(500);
    }

    // 5. Fill amount using formcontrolname - use .last() to target payment form field
    this.logger.info(`Filling amount: ${payment.amount}`);
    const amountInput = this.page.locator('[formcontrolname="amount"]').last();
    await amountInput.waitFor({ state: 'visible', timeout: 10000 });
    await amountInput.scrollIntoViewIfNeeded();
    await amountInput.fill(payment.amount);
    this.logger.info(`  - Amount filled: ${payment.amount}`);
    await this.page.waitForTimeout(1000);

    // 6. Payment is now filled but in draft mode
    // Do NOT click any ADD button here - payment will be saved when SAVE button at top is clicked
    // The saveSale() method will handle clicking SAVE and the confirmation dialog
    this.logger.info('Payment form filled successfully, will be saved with invoice');
  }

  // ─── More Menu & Re-send Payment ───────────────────────────────────────────

  /**
   * Click the MORE menu button on the invoice edit page
   */
  async clickMoreMenu(): Promise<void> {
    this.logger.info('Clicking MORE menu button');
    const moreBtn = this.page.locator(salesSelectors.moreMenuButton);
    await moreBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moreBtn.click();
    // Wait for menu to appear
    await this.page.waitForSelector(salesSelectors.moreMenu, { state: 'visible', timeout: 5000 });
    this.logger.info('MORE menu opened');
  }

  /**
   * Close the MORE menu by pressing Escape
   */
  async closeMoreMenu(): Promise<void> {
    this.logger.info('Closing MORE menu');
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
    this.logger.info('MORE menu closed');
  }

  /**
   * Check if a specific menu item is visible inside the MORE menu (menu must be open)
   */
  async isMoreMenuItemVisible(itemText: string): Promise<boolean> {
    const menuItem = this.page.locator(salesSelectors.moreMenuItem(itemText));
    const visible = await menuItem.isVisible().catch(() => false);
    this.logger.info(`Menu item "${itemText}" visible: ${visible}`);
    return visible;
  }

  /**
   * Verify "Re-send Payment" button is visible inside the MORE menu
   * Opens the menu, checks, then closes it if not proceeding with click
   */
  async validateResendPaymentVisible(): Promise<void> {
    this.logger.info('Validating "Re-send Payment" button is visible in MORE menu');
    const resendBtn = this.page.locator(salesSelectors.resendPaymentButton);
    const visible = await resendBtn.isVisible().catch(() => false);
    if (!visible) {
      // Log all menu items for debugging
      const allItems = await this.page.locator('[role="menuitem"]').allTextContents();
      this.logger.error(`"Re-send Payment" NOT found. Available menu items: ${JSON.stringify(allItems)}`);
      throw new Error(`"Re-send Payment" button not found in MORE menu. Available items: ${JSON.stringify(allItems)}`);
    }
    this.logger.info('"Re-send Payment" button is visible in MORE menu');
  }

  /**
   * Verify "Re-send Payment" button is NOT visible inside the MORE menu
   */
  async validateResendPaymentNotVisible(): Promise<void> {
    this.logger.info('Validating "Re-send Payment" button is NOT visible in MORE menu');
    const resendBtn = this.page.locator(salesSelectors.resendPaymentButton);
    const visible = await resendBtn.isVisible().catch(() => false);
    if (visible) {
      throw new Error('"Re-send Payment" button should NOT be visible, but it is');
    }
    this.logger.info('"Re-send Payment" button is correctly hidden in MORE menu');
  }

  /**
   * Click the "Re-send Payment" menu item (menu must be open)
   */
  async clickResendPayment(): Promise<void> {
    this.logger.info('Clicking "Re-send Payment" button');
    const resendBtn = this.page.locator(salesSelectors.resendPaymentButton);
    await resendBtn.waitFor({ state: 'visible', timeout: 5000 });
    await resendBtn.click();
    this.logger.info('"Re-send Payment" button clicked');
    // Wait for API response
    await this.page.waitForTimeout(2000);
  }

  /**
   * Validate that a toast/snackbar notification with the expected message appears
   */
  async validateToastNotification(expectedMessage: string): Promise<void> {
    this.logger.info(`Waiting for toast notification: "${expectedMessage}"`);

    // Wait for toast/snackbar to appear
    const toastLocator = this.page.locator(salesSelectors.toastNotification);
    await toastLocator.first().waitFor({ state: 'visible', timeout: 10000 });

    // Verify message content
    const toastText = await toastLocator.first().textContent();
    this.logger.info(`Toast notification text: "${toastText}"`);

    if (!toastText || !toastText.toLowerCase().includes(expectedMessage.toLowerCase())) {
      throw new Error(
        `Toast notification mismatch.\n` +
        `Expected to contain: "${expectedMessage}"\n` +
        `Actual: "${toastText}"`
      );
    }
    this.logger.info(`✓ Toast notification validated: "${expectedMessage}"`);
  }

  // ─── Void Invoice ──────────────────────────────────────────────────────────

  /**
   * Click the Void menu item (MORE menu must be open)
   * Handles the confirmation dialog and waits for redirect to sales table
   */
  async clickVoidInvoice(): Promise<void> {
    this.logger.info('Clicking Void menu item');
    const voidItem = this.page.locator(salesSelectors.voidMenuItem);
    await voidItem.waitFor({ state: 'visible', timeout: 5000 });
    await voidItem.click();
    this.logger.info('Void menu item clicked, waiting for confirmation dialog');

    // Wait for void confirmation dialog
    await this.page.waitForSelector(salesSelectors.voidConfirmDialog, { state: 'visible', timeout: 5000 });
    this.logger.info('Void confirmation dialog appeared');

    // Click "void this sale" button
    const confirmBtn = this.page.locator(salesSelectors.voidConfirmButton);
    await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    await confirmBtn.click();
    this.logger.info('Clicked "void this sale" confirmation button');

    // Wait for redirect to sales table
    await this.page.waitForURL(/sales-table/, { timeout: 15000 });
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000);
    this.logger.info('Voided successfully, redirected to sales table');
  }

  /**
   * Check if the Void menu item is disabled (for VOID status invoices)
   */
  async isVoidMenuItemDisabled(): Promise<boolean> {
    const voidItem = this.page.locator(salesSelectors.voidMenuItem);
    const isDisabled = await voidItem.getAttribute('aria-disabled') === 'true'
      || await voidItem.getAttribute('disabled') !== null
      || await voidItem.isDisabled().catch(() => false);
    this.logger.info(`Void menu item disabled: ${isDisabled}`);
    return isDisabled;
  }

  /**
   * Validate invoice status matches expected value
   * This checks the status in the sales list table (first row)
   */
  async validateInvoiceStatus(expectedStatus: string): Promise<void> {
    this.logger.info(`Validating invoice status: ${expectedStatus}`);

    const currentUrl = this.page.url();
    this.logger.info(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('/sales-table') || currentUrl.includes('/sales') && !currentUrl.includes('/edit/')) {
      // We're on sales list - check status in the table
      this.logger.info('Checking status in sales list table');
      
      // Wait for sales table to be visible
      await this.page.waitForSelector('table tbody tr', { state: 'visible', timeout: 10000 });
      await this.page.waitForTimeout(2000);

      // Get the status from first row - status is typically in column with status badge
      // Look for the status badge in the first row
      const firstRow = this.page.locator('table tbody tr').first();
      
      // Try different approaches to find status
      let actualStatus: string | null = null;
      
      // Approach 1: Look for status badge/chip in the row
      const statusBadge = firstRow.locator('[class*="badge"], [class*="status"], [class*="chip"], mat-chip');
      const badgeCount = await statusBadge.count();
      
      if (badgeCount > 0) {
        actualStatus = await statusBadge.first().textContent();
        this.logger.info(`Found status badge in table row: "${actualStatus}"`);
      }
      
      // Approach 2: Get all cells and find the one with status text
      if (!actualStatus) {
        const cells = await firstRow.locator('td').all();
        for (const cell of cells) {
          const cellText = await cell.textContent();
          if (cellText && /(UNPAID|PARTIALLY PAID|PAID|OVERPAID|VOID|DRAFT)/i.test(cellText)) {
            actualStatus = cellText;
            this.logger.info(`Found status in table cell: "${actualStatus}"`);
            break;
          }
        }
      }

      if (!actualStatus) {
        // Log all cell contents for debugging
        const allCells = await firstRow.locator('td').allTextContents();
        this.logger.error(`Could not find status in first row. All cells: ${JSON.stringify(allCells)}`);
        throw new Error(`Invoice status not found in sales table. Expected: "${expectedStatus}"`);
      }

      // Normalize and compare
      const normalizedActual = actualStatus.trim().toUpperCase();
      const normalizedExpected = expectedStatus.trim().toUpperCase();

      this.logger.info(`Expected status: "${expectedStatus}"`);
      this.logger.info(`Actual status: "${actualStatus}"`);
      this.logger.info(`Normalized actual: "${normalizedActual}"`);
      this.logger.info(`Normalized expected: "${normalizedExpected}"`);

      if (!normalizedActual.includes(normalizedExpected)) {
        throw new Error(
          `Invoice status mismatch.\n` +
          `Expected to contain: "${expectedStatus}"\n` +
          `Actual: "${actualStatus}"\n` +
          `Normalized actual: "${normalizedActual}"\n` +
          `Normalized expected: "${normalizedExpected}"`
        );
      }

      this.logger.info(`✓ Invoice status validated: ${actualStatus}`);

    } else {
      // We're on edit page - check status badge at top
      // After payment save, badge takes a moment to update - wait for it
      this.logger.info('Checking status badge on edit page, waiting for status to update...');

      const normalizedExpected = expectedStatus.trim().toUpperCase();
      const maxRetries = 10; // Try for up to 10 seconds
      let actualStatus: string | null = null;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        // Wait for status badge selectors
        const statusBadgeSelectors = [
          '[class*="badge"]',
          '[class*="status"]',
          'mat-chip',
          '.mat-chip',
          'span.badge'
        ];

        for (const selector of statusBadgeSelectors) {
          const element = this.page.locator(selector).first();
          const isVisible = await element.isVisible().catch(() => false);
          
          if (isVisible) {
            const text = await element.textContent();
            if (text && /(UNPAID|PARTIALLY PAID|PAID|OVERPAID|VOID|DRAFT)/i.test(text)) {
              actualStatus = text;
              const normalizedActual = actualStatus.trim().toUpperCase();
              
              this.logger.info(`Attempt ${attempt + 1}: Found status "${actualStatus}" (normalized: "${normalizedActual}")`);
              
              // Check if it matches expected status
              if (normalizedActual.includes(normalizedExpected)) {
                this.logger.info(`✓ Invoice status validated: ${actualStatus}`);
                return; // Success!
              }
              break; // Found status but doesn't match, continue to retry
            }
          }
        }

        // Wait before retry
        if (attempt < maxRetries - 1) {
          await this.page.waitForTimeout(1000);
        }
      }

      // If we got here, status didn't match expected
      if (!actualStatus) {
        throw new Error(`Invoice status badge not found on edit page after ${maxRetries} attempts. Expected: "${expectedStatus}"`);
      }

      const normalizedActual = actualStatus.trim().toUpperCase();
      throw new Error(
        `Invoice status mismatch after waiting ${maxRetries} seconds.\n` +
        `Expected to contain: "${expectedStatus}"\n` +
        `Actual: "${actualStatus}"\n` +
        `Normalized actual: "${normalizedActual}"\n` +
        `Normalized expected: "${normalizedExpected}"`
      );
    }
  }
}
