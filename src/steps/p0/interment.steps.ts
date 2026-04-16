import { When, Then } from '@cucumber/cucumber';
import { IntermentPage } from '../../pages/p0/IntermentPage.js';
import { replacePlaceholdersInObject, replacePlaceholders } from '../../utils/TestDataHelper.js';

// Initialize page objects - Reset for each scenario
let intermentPage: IntermentPage;

When('I click Add Interment button', { timeout: 45000 }, async function () {
  const page = this.page;
  intermentPage = new IntermentPage(page);
  await intermentPage.clickAddIntermentButton();
});

When('I fill interment form with following details', { timeout: 60000 }, async function (dataTable: any) {
  const intermentData = dataTable.rowsHash(); // For vertical tables with key-value pairs
  const actualData = replacePlaceholdersInObject(intermentData);
  await intermentPage.fillIntermentForm(actualData as any);
});

When('I save the Interment', { timeout: 40000 }, async function () {
  await intermentPage.saveInterment();
});

Then('I should see deceased {string} in the Interment tab', { timeout: 90000 }, async function (deceasedName: string) {
  const actualName = replacePlaceholders(deceasedName);
  await intermentPage.verifyDeceasedInTab(actualName);
});

Then('I should see interment type {string}', { timeout: 20000 }, async function (intermentType: string) {
  const actualType = replacePlaceholders(intermentType);
  await intermentPage.verifyIntermentType(actualType);
});

When('I add interment applicant', { timeout: 15000 }, async function () {
  await intermentPage.addIntermentApplicant();
});

When('I add next of kin', { timeout: 15000 }, async function () {
  await intermentPage.addNextOfKin();
});

When('I click on Interments tab', { timeout: 25000 }, async function () {
  const page = this.page;
  // Always create a new instance to ensure we have the current page
  intermentPage = new IntermentPage(page);
  await intermentPage.clickIntermentTab();
});

When('I click Edit Interment button', { timeout: 15000 }, async function () {
  await intermentPage.clickEditIntermentButton();
});

When('I update interment form with following details', { timeout: 60000 }, async function (dataTable: any) {
  const intermentData = dataTable.rowsHash();
  const actualData = replacePlaceholdersInObject(intermentData);
  await intermentPage.updateIntermentForm(actualData as any);
});

// ===== Relations: Interment applicant, Next of kin, Funeral minister, Funeral director =====

When('I add interment applicant by searching {string}', { timeout: 45000 }, async function (lastName: string) {
  const actualLastName = replacePlaceholders(lastName);
  await intermentPage.searchAndAddRelation('button:has-text("Interment applicant")', actualLastName, 'PERSON');
});

When('I add next of kin by searching {string}', { timeout: 45000 }, async function (lastName: string) {
  const actualLastName = replacePlaceholders(lastName);
  await intermentPage.searchAndAddRelation('button:has-text("Next of kin")', actualLastName, 'PERSON');
});

When('I add funeral minister by searching {string}', { timeout: 45000 }, async function (businessName: string) {
  const actualName = replacePlaceholders(businessName);
  await intermentPage.searchAndAddRelation('button:has-text("Funeral minister")', actualName, 'BUSINESS');
});

When('I add funeral director by searching {string}', { timeout: 45000 }, async function (businessName: string) {
  const actualName = replacePlaceholders(businessName);
  await intermentPage.searchAndAddRelation('button:has-text("Funeral director")', actualName, 'BUSINESS');
});

Then('I should be on the plot detail page after save', { timeout: 20000 }, async function () {
  await intermentPage.verifyOnPlotDetailPage();
});

// ===== Delete interment =====

When('I click more options on edit interment page', { timeout: 10000 }, async function () {
  await intermentPage.clickMoreMenuOnEditInterment();
});

When('I click delete interment from menu', { timeout: 10000 }, async function () {
  await intermentPage.clickDeleteIntermentFromMenu();
});

When('I confirm the interment deletion', { timeout: 25000 }, async function () {
  await intermentPage.confirmIntermentDeletion();
});

// ===== Move interment =====

When('I click move interment from menu', { timeout: 10000 }, async function () {
  await intermentPage.clickMoveIntermentFromMenu();
});

When('I select a vacant plot to move interment to {string}', { timeout: 30000 }, async function (plotId: string) {
  const actualPlotId = replacePlaceholders(plotId);
  await intermentPage.searchAndSelectMoveTargetPlot(actualPlotId);
});

When('I confirm the interment move', { timeout: 60000 }, async function () {
  await intermentPage.confirmIntermentMove();
});

Then('the interment should be moved successfully', { timeout: 20000 }, async function () {
  await intermentPage.verifyOnPlotDetailPage();
  this.logger?.info(`Interment moved successfully. URL: ${this.page.url()}`);
});

// ===== Add Sale from Edit Interment =====

When('I navigate to the advance table and open the second interment', { timeout: 60000 }, async function () {
  const page = this.page;
  intermentPage = new IntermentPage(page);

  const baseUrl = page.url().split('/customer-organization')[0];
  await page.goto(`${baseUrl}/customer-organization/advance-table?tab=interments`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Click the second interment row
  const rows = page.locator('mat-row');
  await rows.first().waitFor({ state: 'visible', timeout: 10000 });
  const secondRow = rows.nth(1);
  this.logger?.info('Clicking second interment row in advance table');

  await secondRow.click();
  // Wait for Edit Interment page — SAVE/CANCEL buttons are always present
  await page.waitForSelector('button:has-text("SAVE"), button:has-text("CANCEL")', { state: 'visible', timeout: 45000 });
  await page.waitForTimeout(1000);
  this.logger?.info(`Opened Edit Interment page. URL: ${page.url()}`);
});
