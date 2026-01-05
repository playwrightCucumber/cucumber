import { When, Then, Given } from '@cucumber/cucumber';
import { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { AdvanceSearchPlotSelectors } from '../../selectors/p0/advance-search-plot.selectors.js';
import { Logger } from '../../utils/Logger.js';

// Initialize logger
const logger = new Logger('AdvanceSearchPlotSteps');

// Background step
Given('I am on the Chronicle home page', { timeout: 10000 }, async function () {
  const page: Page = this.page;
  logger.info('Navigating to Chronicle home page');
  await page.goto('https://staging.chronicle.rip/');
  await page.waitForTimeout(3000); // Wait for page to load
  logger.success('Chronicle home page loaded');
});

// Advanced Search Steps (Without Login)
When('I click Advanced search button without login', { timeout: 10000 }, async function () {
  const page: Page = this.page;
  logger.info('Clicking Advanced search button');
  await page.locator(AdvanceSearchPlotSelectors.advancedSearchButton).click();
  await page.waitForTimeout(1000); // Wait for dialog to open
  logger.success('Advanced search dialog opened');
});

When('I select cemetery {string} in advanced search', { timeout: 10000 }, async function (cemeteryName: string) {
  const page: Page = this.page;
  logger.info(`Selecting cemetery: ${cemeteryName}`);

  // Click cemetery combobox using getByRole (more robust than CSS selector)
  await page.getByRole('combobox', { name: 'Cemeteries' }).click();
  await page.waitForTimeout(500);

  // Select the cemetery option using exact match to avoid strict mode violations
  await page.getByRole('option', { name: cemeteryName, exact: true }).click();
  await page.waitForTimeout(500);

  // Close the dropdown by pressing Escape (required before clicking Plot tab)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  logger.success(`Cemetery ${cemeteryName} selected`);
});

When('I select Plot tab in advanced search', { timeout: 15000 }, async function () {
  const page: Page = this.page;
  logger.info('Clicking Plot tab');

  // Wait a bit for the dialog to settle after cemetery selection
  await page.waitForTimeout(1000);

  // Click Plot tab using getByRole with aria-label
  await page.getByRole('button', { name: 'Plot', exact: true }).click();
  await page.waitForTimeout(500);

  logger.success('Plot tab selected');
});

When('I select section {string} in advanced search without login', { timeout: 10000 }, async function (section: string) {
  const page: Page = this.page;
  logger.info(`Selecting section: ${section}`);

  // Click section combobox using getByRole (the combobox has aria-label="Number")
  await page.getByRole('combobox', { name: 'Number' }).click();
  await page.waitForTimeout(500);

  // Select the section option
  await page.getByRole('option', { name: section, exact: true }).click();
  await page.waitForTimeout(500);

  logger.success(`Section ${section} selected`);
});

When('I select row {string} in advanced search without login', { timeout: 10000 }, async function (row: string) {
  const page: Page = this.page;
  logger.info(`Selecting row: ${row}`);

  // Click row combobox using getByRole
  await page.getByRole('combobox', { name: 'Row' }).click();
  await page.waitForTimeout(500);

  // Select the row option (use exact match for single letters)
  await page.getByRole('option', { name: row, exact: true }).click();
  await page.waitForTimeout(500);

  logger.success(`Row ${row} selected`);
});

When('I enter plot number {string} in advanced search without login', { timeout: 10000 }, async function (number: string) {
  const page: Page = this.page;
  logger.info(`Entering plot number: ${number}`);

  // Click on the number textbox
  await page.locator(AdvanceSearchPlotSelectors.numberTextbox).click();
  await page.waitForTimeout(300);

  // Fill the number
  await page.locator(AdvanceSearchPlotSelectors.numberTextbox).fill(number);
  await page.waitForTimeout(500);

  logger.success(`Plot number ${number} entered`);
});

When('I click Search button in advanced search without login', { timeout: 15000 }, async function () {
  const page: Page = this.page;
  logger.info('Clicking Search button in advanced search');

  await page.locator(AdvanceSearchPlotSelectors.searchButton).click();

  // Wait for navigation to search results page
  await page.waitForURL('**/search/advance', { timeout: 10000 });
  await page.waitForTimeout(2000); // Wait for results to load

  logger.success('Search completed, navigated to results page');
});

Then('I should be navigated to advance search results page', { timeout: 15000 }, async function () {
  const page: Page = this.page;
  logger.info('Verifying navigation to advance search results page');

  // Check URL
  await page.waitForURL('**/search/advance', { timeout: 10000 });

  // Check for search results heading
  const heading = page.locator(AdvanceSearchPlotSelectors.searchResultsHeading);
  await heading.waitFor({ state: 'visible', timeout: 10000 });

  logger.success('Verified on advance search results page');
});

Then('I should see search results information', { timeout: 10000 }, async function () {
  const page: Page = this.page;
  logger.info('Verifying search results information');

  // Check for search results heading (e.g., "0 plots found...")
  const heading = page.locator(AdvanceSearchPlotSelectors.searchResultsHeading);
  await expect(heading).toBeVisible({ timeout: 5000 });

  // Check for subheading (e.g., "in 0 cemeteries")
  const subheading = page.locator(AdvanceSearchPlotSelectors.searchResultsSubheading);
  await expect(subheading).toBeVisible({ timeout: 5000 });

  logger.success('Search results information verified');
});

When('I click close advance search button', { timeout: 10000 }, async function () {
  const page: Page = this.page;
  logger.info('Clicking close advance search button');

  await page.locator(AdvanceSearchPlotSelectors.closeAdvanceSearchButton).click();

  // Wait for navigation back to home page
  await page.waitForURL('https://staging.chronicle.rip/', { timeout: 10000 });
  await page.waitForTimeout(1000);

  logger.success('Advance search closed, navigated to home page');
});

Then('I should be on the home page', { timeout: 10000 }, async function () {
  const page: Page = this.page;
  logger.info('Verifying on home page with cemeteries list');

  // Check URL
  expect(page.url()).toBe('https://staging.chronicle.rip/');

  // Check for cemeteries heading
  const cemeteriesHeading = page.locator(AdvanceSearchPlotSelectors.cemeteriesHeading);
  await expect(cemeteriesHeading).toBeVisible({ timeout: 5000 });

  // Check for cemeteries count
  const cemeteriesCount = page.locator(AdvanceSearchPlotSelectors.cemeteriesCount);
  await expect(cemeteriesCount).toBeVisible({ timeout: 5000 });

  logger.success('Verified on home page with cemeteries list');
});

Then('I should see cemeteries list', { timeout: 10000 }, async function () {
  const page: Page = this.page;
  logger.info('Verifying cemeteries list is visible');

  // Check for cemeteries heading
  const cemeteriesHeading = page.locator(AdvanceSearchPlotSelectors.cemeteriesHeading);
  await expect(cemeteriesHeading).toBeVisible({ timeout: 5000 });

  // Check for cemeteries count
  const cemeteriesCount = page.locator(AdvanceSearchPlotSelectors.cemeteriesCount);
  await expect(cemeteriesCount).toBeVisible({ timeout: 5000 });

  logger.success('Cemeteries list verified');
});
