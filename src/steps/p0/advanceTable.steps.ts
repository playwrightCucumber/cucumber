import { When, Then } from '@cucumber/cucumber';
import { AdvanceTablePage } from '../../pages/p0/AdvanceTablePage.js';

// Page object stored per-scenario via module scope
let advanceTablePage: AdvanceTablePage;

function getOrCreatePage(world: any): AdvanceTablePage {
  if (!advanceTablePage) {
    advanceTablePage = new AdvanceTablePage(world.page);
  }
  return advanceTablePage;
}

// --- Shared navigation steps (used by person & advance-table features) ---

When('I navigate to the advance table page', { timeout: 15000 }, async function () {
  advanceTablePage = new AdvanceTablePage(this.page);
  await advanceTablePage.navigateToAdvanceTable();
});

When('I click the filter button', { timeout: 15000 }, async function () {
  const page = getOrCreatePage(this);
  await page.clickFilterButton();
});

// --- Advance table specific steps ---

When('I am on the PLOTS tab', { timeout: 15000 }, async function () {
  const page = getOrCreatePage(this);
  await page.verifyOnPlotsTab();
});

Then('I should see the filter modal form', { timeout: 10000 }, async function () {
  const page = getOrCreatePage(this);
  await page.verifyFilterModalVisible();
});

When('I fill in the plot filter with section {string} row {string} and number {string}', { timeout: 15000 }, async function (
  section: string,
  row: string,
  number: string
) {
  await advanceTablePage.fillPlotFilter({ section, row, number });
});

When('I click the apply filter button', { timeout: 30000 }, async function () {
  await advanceTablePage.clickApplyFilter();
});

Then('the first row should display plot ID {string}', { timeout: 15000 }, async function (expectedPlotId: string) {
  await advanceTablePage.verifyFirstRowPlotId(expectedPlotId);
});

Then('the first row section should be {string}', { timeout: 15000 }, async function (expectedSection: string) {
  await advanceTablePage.verifyFirstRowSection(expectedSection);
});

Then('the first row row should be {string}', { timeout: 15000 }, async function (expectedRow: string) {
  await advanceTablePage.verifyFirstRowRow(expectedRow);
});

Then('the first row number should be {string}', { timeout: 15000 }, async function (expectedNumber: string) {
  await advanceTablePage.verifyFirstRowNumber(expectedNumber);
});
