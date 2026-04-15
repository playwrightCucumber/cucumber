import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlotPage } from '../../pages/p0/PlotPage.js';
import { ROIPage } from '../../pages/p0/ROIPage.js';
import { replacePlaceholdersInObject, replacePlaceholders } from '../../utils/TestDataHelper.js';

// Initialize page objects
let plotPage: PlotPage;
let roiPage: ROIPage;

When('I navigate to all plots page', { timeout: 15000 }, async function () {
  const page = this.page;
  plotPage = new PlotPage(page);
  roiPage = new ROIPage(page);
  await plotPage.clickSeeAllPlots();
});

When('I open the filter dialog', async function () {
  await plotPage.openFilter();
});

When('I select vacant filter', async function () {
  await plotPage.selectVacantFilter();
});

When('I select reserved filter', async function () {
  await plotPage.selectReservedFilter();
});

When('I select occupied filter', async function () {
  await plotPage.selectOccupiedFilter();
});

When('I apply the filter plot', { timeout: 10000 }, async function () {
  await plotPage.applyFilter();
});

When('I expand section {string}', async function (section: string) {
  await plotPage.expandSection(section);
});

When('I expand the first section', { timeout: 15000 }, async function () {
  const expandedSection = await plotPage.expandFirstSection();
  this.expandedSection = expandedSection; // Store for reference if needed
  this.logger?.info(`Expanded section: ${expandedSection.toUpperCase()}`);
});

When('I select plot {string}', { timeout: 15000 }, async function (plotName: string) {
  await plotPage.selectPlot(plotName);
});

Then('the plot status should be {string}', { timeout: 10000 }, async function (expectedStatus: string) {
  // Always reinitialize to avoid stale page reference from a previous scenario
  plotPage = new PlotPage(this.page);
  const isCorrect = await plotPage.verifyStatusChanged(expectedStatus);
  expect(isCorrect).toBeTruthy();
});

When('I click Add ROI button', { timeout: 50000 }, async function () {
  // Always reinitialize with the current scenario's page to avoid stale page references
  roiPage = new ROIPage(this.page);
  await roiPage.clickAddRoi();
});

When('I click ROI tab', async function () {
  if (!roiPage) {
    roiPage = new ROIPage(this.page);
  }
  await roiPage.clickRoiTab();
});

When('I click Edit ROI button', { timeout: 50000 }, async function () {
  if (!roiPage) {
    roiPage = new ROIPage(this.page);
  }
  // EDIT ROI button is at bottom of plot detail page, no need to click ROI tab first
  await roiPage.clickEditRoi();
});

When('I fill ROI form with following details', { timeout: 30000 }, async function (dataTable: any) {
  if (!roiPage) {
    roiPage = new ROIPage(this.page);
  }
  const roiData = dataTable.rowsHash(); // For vertical tables with key-value pairs
  const actualData = replacePlaceholdersInObject(roiData);
  await roiPage.fillRoiForm(actualData);
});

When('I select the first vacant plot', { timeout: 15000 }, async function () {
  const plotName = await plotPage.selectFirstVacantPlot();
  this.selectedPlotName = plotName; // Store for later reference
  // Click the plot to navigate to plot detail page
  await plotPage.page.getByText(`${plotName} Vacant`).click();
  await plotPage.page.waitForTimeout(3000);
});

When('I select the first reserved plot', { timeout: 15000 }, async function () {
  const plotName = await plotPage.selectFirstReservedPlot();
  this.selectedPlotName = plotName; // Store for later reference
});

When('I select the first occupied plot', { timeout: 60000 }, async function () {
  const plotName = await plotPage.selectFirstOccupiedPlot();
  this.selectedPlotName = plotName; // Store for later reference
});

When('I add ROI holder person with following details', { timeout: 15000 }, async function (dataTable: any) {
  const holderData = dataTable.rowsHash(); // For vertical tables with key-value pairs
  const actualData = replacePlaceholdersInObject(holderData);
  await roiPage.addRoiHolderPerson(actualData as any);
});

When('I add ROI applicant person with following details', { timeout: 15000 }, async function (dataTable: any) {
  const applicantData = dataTable.rowsHash(); // For vertical tables with key-value pairs
  const actualData = replacePlaceholdersInObject(applicantData);
  await roiPage.addRoiApplicantPerson(actualData as any);
});

When('I search and select ROI holder {string}', { timeout: 15000 }, async function (personName: string) {
  await roiPage.searchAndSelectRoiHolder(personName);
});

When('I save the ROI', { timeout: 120000 }, async function () {
  const page = this.page;
  if (!roiPage) {
    roiPage = new ROIPage(page);
  }

  // saveRoi() handles navigation back to plot detail page (or stays on edit form for verification)
  await roiPage.saveRoi();

  // Wait for page to settle after navigation
  await page.waitForTimeout(2000);

  // If on detail page, click ROI tab for downstream steps that verify ROI data
  // Check if we're on the detail page (has tablist) or still on edit form
  const hasTablist = await page.locator('[role="tablist"]').isVisible({ timeout: 3000 }).catch(() => false);
  if (hasTablist) {
    // On detail page — click ROI tab for any downstream ROI verification steps
    const roiTab = page.getByRole('tab', { name: 'ROI' });
    if (await roiTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await roiTab.click();
      await page.waitForTimeout(500);
      const isSelected = await roiTab.getAttribute('aria-selected');
      if (isSelected !== 'true') {
        await roiTab.click();
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(2000);
    }
  } else {
    // Still on edit form — ROI was saved but navigation failed, wait for status update
    await page.waitForTimeout(3000);
  }
});

Then('I should see ROI holder {string} in the ROI tab', { timeout: 20000 }, async function (holderName: string) {
  const actualName = replacePlaceholders(holderName);
  const page = this.page;

  // Wait for ROI content to load after tab click
  await page.waitForTimeout(3000);

  // Verify ROI tab is selected
  const roiTab = page.getByRole('tab', { name: 'ROI' });
  const isSelected = await roiTab.getAttribute('aria-selected');

  if (isSelected !== 'true') {
    throw new Error(`❌ ROI tab is not selected (aria-selected=${isSelected})`);
  }

  // Get page content and verify both name and role exist
  const pageContent = await page.content();

  const hasName = pageContent.includes(actualName);
  const hasRole = pageContent.toUpperCase().includes('ROI HOLDER');

  if (!hasName) {
    // Debug: show what's on page
    const bodyText = await page.locator('body').textContent();
    console.log('Page content preview:', bodyText?.substring(0, 500));
    throw new Error(`❌ ROI holder "${actualName}" not found on page`);
  }

  if (!hasRole) {
    throw new Error(`❌ Label "ROI HOLDER" not found on page`);
  }

  console.log(`✓ ROI holder verified: "${actualName}" with label "ROI HOLDER"`);
});

Then('I should see ROI applicant {string} in the ROI tab', { timeout: 15000 }, async function (applicantName: string) {
  const actualName = replacePlaceholders(applicantName);
  const isVisible = await roiPage.verifyRoiPerson(actualName, 'applicant');
  if (!isVisible) {
    throw new Error(`❌ Verification failed: ROI applicant "${actualName}" not found or label "ROI APPLICANT" missing. Check logs above for details.`);
  }
});

Then('I should see both ROI holder {string} and applicant {string}', { timeout: 15000 }, async function (holderName: string, applicantName: string) {
  const actualHolder = replacePlaceholders(holderName);
  const actualApplicant = replacePlaceholders(applicantName);
  const isVisible = await roiPage.verifyRoiHolderAndApplicant(actualHolder, actualApplicant);
  if (!isVisible) {
    throw new Error(`❌ Verification failed: Either holder "${actualHolder}" or applicant "${actualApplicant}" not found with correct labels. Check logs above for details.`);
  }
});

Then('I should see fee {string} in ROI form', { timeout: 10000 }, async function (expectedFee: string) {
  const isValid = await roiPage.verifyFeeInForm(expectedFee);
  if (!isValid) {
    throw new Error(`❌ Verification failed: Fee "${expectedFee}" not found in ROI form. Check logs above for details.`);
  }
});

Then('I should see certificate number {string} in ROI form', { timeout: 10000 }, async function (expectedCertificate: string) {
  const isValid = await roiPage.verifyCertificateInForm(expectedCertificate);
  if (!isValid) {
    throw new Error(`❌ Verification failed: Certificate number "${expectedCertificate}" not found in ROI form. Check logs above for details.`);
  }
});

// Activity Notes steps
When('I add activity note {string}', { timeout: 10000 }, async function (noteText: string) {
  await roiPage.addActivityNote(noteText);
});

Then('I should see activity note {string}', { timeout: 10000 }, async function (expectedNote: string) {
  const isVisible = await roiPage.verifyActivityNote(expectedNote);
  if (!isVisible) {
    throw new Error(`❌ Verification failed: Activity note "${expectedNote}" not found. Check logs above for details.`);
  }
});

When('I edit activity note {string} to {string}', { timeout: 15000 }, async function (oldText: string, newText: string) {
  await roiPage.editActivityNote(oldText, newText);
});
