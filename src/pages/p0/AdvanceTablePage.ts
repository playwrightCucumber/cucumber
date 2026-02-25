import { Page, expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { AdvanceTableSelectors } from '../../selectors/p0/advance-table/index.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';
import { Logger } from '../../utils/Logger.js';

export interface PlotFilterData {
  section?: string;
  row?: string;
  number?: string;
}

export class AdvanceTablePage extends BasePage {
  private logger: Logger;

  constructor(page: Page) {
    super(page);
    this.logger = new Logger('AdvanceTablePage');
  }

  /**
   * Navigate to advance table page with plots tab
   */
  async navigateToAdvanceTable(): Promise<void> {
    this.logger.info('Navigating to advance table page');

    const baseUrl = this.page.url().split('/customer-organization')[0];
    await this.navigateTo(`${baseUrl}/customer-organization/advance-table?tab=plots`);
    await NetworkHelper.waitForNetworkIdle(this.page, 10000);

    this.logger.success('Navigated to advance table page');
  }

  /**
   * Verify we are on the PLOTS tab
   */
  async verifyOnPlotsTab(): Promise<void> {
    this.logger.info('Verifying on PLOTS tab');

    const table = this.page.locator(AdvanceTableSelectors.table);
    await this.isElementVisible(table);

    const url = await this.getUrl();
    if (!url.includes('tab=plots')) {
      this.logger.warn('URL does not contain tab=plots, clicking PLOTS tab');
      await this.clickWithRetry(AdvanceTableSelectors.plotsTab);
      await NetworkHelper.waitForStabilization(this.page);
    }

    this.logger.success('On PLOTS tab');
  }

  /**
   * Click filter button to open filter dialog
   */
  async clickFilterButton(): Promise<void> {
    this.logger.info('Clicking filter button');

    await this.clickWithRetry(AdvanceTableSelectors.filterButton);
    await NetworkHelper.waitForAnimation(this.page);

    this.logger.success('Filter button clicked');
  }

  /**
   * Verify filter modal is visible
   */
  async verifyFilterModalVisible(): Promise<void> {
    this.logger.info('Verifying filter modal is visible');

    const filterHeading = this.page.getByRole('heading', { name: 'Filter' });
    await this.isElementVisible(filterHeading);

    const applyButton = this.page.locator(AdvanceTableSelectors.filterApplyButton);
    await this.isElementVisible(applyButton);

    this.logger.success('Filter modal is visible');
  }

  /**
   * Fill plot filter form with section, row, and number
   */
  async fillPlotFilter(data: PlotFilterData): Promise<void> {
    this.logger.info(`Filling plot filter with: Section=${data.section}, Row=${data.row}, Number=${data.number}`);

    if (data.section) {
      await this.fillWithRetry(AdvanceTableSelectors.filterSectionInput, data.section);
    }

    if (data.row) {
      await this.fillWithRetry(AdvanceTableSelectors.filterRowInput, data.row);
    }

    if (data.number) {
      await this.fillWithRetry(AdvanceTableSelectors.filterNumberInput, data.number);
    }

    this.logger.success('Plot filter form filled');
  }

  /**
   * Click apply filter button
   */
  async clickApplyFilter(): Promise<void> {
    this.logger.info('Clicking apply filter button');

    // Set up API listener BEFORE clicking apply
    const plotApiCalled = NetworkHelper.waitForApiEndpoint(this.page, '/plot', 30000, { optional: true });

    await this.clickWithRetry(AdvanceTableSelectors.filterApplyButton);

    this.logger.info('Apply filter clicked, waiting for table to reload');

    await plotApiCalled;

    // Wait for filter dialog to close and table to stabilize
    await NetworkHelper.waitForStabilization(this.page);

    // Wait for table loading to complete
    await this.waitForTableData();

    this.logger.success('Filter applied successfully');
  }

  /**
   * Get plot ID from first row
   */
  async getFirstRowPlotId(): Promise<string> {
    this.logger.info('Getting plot ID from first row');
    await this.waitForTableData();

    const plotIdCell = this.page.locator(AdvanceTableSelectors.firstRowPlotIdCell);
    const plotId = (await this.getText(plotIdCell)).trim();

    this.logger.info(`First row plot ID: ${plotId}`);
    return plotId;
  }

  async getFirstRowSection(): Promise<string> {
    this.logger.info('Getting section from first row');

    const sectionCell = this.page.locator(AdvanceTableSelectors.firstRowSectionCell);
    const section = (await this.getText(sectionCell)).trim();

    this.logger.info(`First row section: ${section}`);
    return section;
  }

  async getFirstRowRow(): Promise<string> {
    this.logger.info('Getting row from first row');

    const rowCell = this.page.locator(AdvanceTableSelectors.firstRowRowCell);
    const row = (await this.getText(rowCell)).trim();

    this.logger.info(`First row row: ${row}`);
    return row;
  }

  async getFirstRowNumber(): Promise<string> {
    this.logger.info('Getting number from first row');

    const numberCell = this.page.locator(AdvanceTableSelectors.firstRowNumberCell);
    const number = (await this.getText(numberCell)).trim();

    this.logger.info(`First row number: ${number}`);
    return number;
  }

  /**
   * Verify first row plot ID
   */
  async verifyFirstRowPlotId(expectedPlotId: string): Promise<void> {
    this.logger.info(`Verifying first row plot ID is: ${expectedPlotId}`);

    const actualPlotId = await this.getFirstRowPlotId();
    expect(actualPlotId).toBe(expectedPlotId);

    this.logger.success(`First row plot ID verified: ${actualPlotId}`);
  }

  /**
   * Verify first row section
   */
  async verifyFirstRowSection(expectedSection: string): Promise<void> {
    this.logger.info(`Verifying first row section is: ${expectedSection}`);

    const actualSection = await this.getFirstRowSection();
    expect(actualSection).toBe(expectedSection);

    this.logger.success(`First row section verified: ${actualSection}`);
  }

  /**
   * Verify first row row value
   */
  async verifyFirstRowRow(expectedRow: string): Promise<void> {
    this.logger.info(`Verifying first row row is: ${expectedRow}`);

    const actualRow = await this.getFirstRowRow();
    expect(actualRow).toBe(expectedRow);

    this.logger.success(`First row row verified: ${actualRow}`);
  }

  /**
   * Verify first row number
   */
  async verifyFirstRowNumber(expectedNumber: string): Promise<void> {
    this.logger.info(`Verifying first row number is: ${expectedNumber}`);

    const actualNumber = await this.getFirstRowNumber();
    expect(actualNumber).toBe(expectedNumber);

    this.logger.success(`First row number verified: ${actualNumber}`);
  }

  /**
   * Wait for table to have data rows
   */
  private async waitForTableData(): Promise<void> {
    this.logger.info('Waiting for table data');

    // Wait for loading indicator to disappear
    try {
      await this.page.waitForSelector(AdvanceTableSelectors.tableLoading, { state: 'detached', timeout: 15000 });
    } catch {
      // No loading indicator or already loaded
    }

    // Wait for table rows to be populated
    await NetworkHelper.waitForListPopulated(this.page, AdvanceTableSelectors.table, 2, 15000);

    this.logger.success('Table data loaded');
  }
}
