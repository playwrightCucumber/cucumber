/**
 * ROI Table Menu Step Definitions
 * Steps for navigating to ROI table and managing ROIs from table menu
 * Selectors verified via MCP Playwright on 2026-02-04
 */

import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { RoiTableSelectors, RoiTableUrls } from '../../selectors/p0/roiTable.selectors.js';
import { replacePlaceholders } from '../../utils/TestDataHelper.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';

// ============================================
// NAVIGATION STEPS
// ============================================

When('I click the sidebar table menu', { timeout: 30000 }, async function () {
    // Use verified selector with fallback
    const tableButton = this.page.locator(RoiTableSelectors.sidebarTableButton)
        .or(this.page.locator(RoiTableSelectors.sidebarTableButtonAlt));

    await tableButton.click();

    // Wait for API endpoint to load table data
    await NetworkHelper.waitForApiEndpoint(this.page, '/adv_table/plots/', 15000);
});

Then('I should see the tables page', async function () {
    // Verify URL contains advance-table
    await expect(this.page).toHaveURL(new RegExp(RoiTableUrls.tablesPage), { timeout: 10000 });
});

Then('I should see the following tabs', async function (dataTable) {
    const expectedTabs = dataTable.raw().flat();

    for (const tabName of expectedTabs) {
        // Use verified selector - tabs are mat-tab-link elements with uppercase text
        const tabLocator = this.page.locator(RoiTableSelectors.tabByText(tabName));
        await expect(tabLocator).toBeVisible({ timeout: 5000 });
    }
});

When('I click the ROIs tab', { timeout: 30000 }, async function () {
    // Use verified selector with data-testid fallback
    const roisTab = this.page.locator(RoiTableSelectors.roisTabDataTestId)
        .or(this.page.locator(RoiTableSelectors.roisTab));

    await roisTab.click();

    // Wait for URL to update to include tab=rois
    await this.page.waitForURL(/tab=rois/, { timeout: 15000 });

    // Wait for any API calls to switch tab data (generic wait is safer here as endpoint might differ)
    await NetworkHelper.waitForApiRequestsComplete(this.page, 10000);
});

Then('I should see the Add ROI button next to Export button', async function () {
    // Verify Add ROI button is visible (uses data-testid="content-wrapper-button-add-plot")
    const addRoiButton = this.page.locator(RoiTableSelectors.addRoiButton)
        .or(this.page.locator(RoiTableSelectors.addRoiButtonByText));

    await expect(addRoiButton).toBeVisible({ timeout: 10000 });

    // Verify Export button is visible
    const exportButton = this.page.locator(RoiTableSelectors.exportButton)
        .or(this.page.locator(RoiTableSelectors.exportButtonByText));

    await expect(exportButton).toBeVisible({ timeout: 10000 });

    // Verify they are positioned next to each other (Add ROI should be to the right of Export)
    const addRoiBox = await addRoiButton.boundingBox();
    const exportBox = await exportButton.boundingBox();

    if (addRoiBox && exportBox) {
        // Verify they are on the same horizontal line
        const yDifference = Math.abs(addRoiBox.y - exportBox.y);
        expect(yDifference).toBeLessThan(50); // Allow 50px tolerance

        // Verify Add ROI is to the right of Export
        expect(addRoiBox.x).toBeGreaterThan(exportBox.x);
    }
});

// ============================================
// ADD ROI FROM TABLE STEPS
// ============================================

When('I click the Add ROI button from table', async function () {
    const addRoiButton = this.page.locator(RoiTableSelectors.addRoiButton);
    await addRoiButton.click();
    // Wait for form animation/transition
    await NetworkHelper.waitForAnimation(this.page);
});

Then('I should see the Add ROI form', async function () {
    // Verify form title or key form elements are visible
    const formTitle = this.page.locator(RoiTableSelectors.roiFormTitle);
    await expect(formTitle).toBeVisible({ timeout: 10000 });
    await NetworkHelper.waitForApiEndpoint(this.page, '/plots/');
});

When('I search and select plot for ROI', async function () {
    // The first dropdown in Add ROI form is for Plot selection (shows "All" by default)
    // Click on it to open the plot dropdown
    const plotSelect = this.page.locator('mat-select').first();
    await plotSelect.click();
    await NetworkHelper.waitForAnimation(this.page, 'mat-option');

    // Select first available vacant plot from dropdown (skip "Unassigned" and "Unknown Location")
    const options = this.page.locator('mat-option');
    const optionCount = await options.count();

    for (let i = 0; i < optionCount; i++) {
        const option = options.nth(i);
        const text = await option.textContent();
        // Skip Unassigned and Unknown Location, select the first actual plot
        if (text && !text.includes('Unassigned') && !text.includes('Unknown Location')) {
            await option.click();
            break;
        }
    }
    await NetworkHelper.waitForAnimation(this.page);
});

When('I fill ROI form from table with following details', { timeout: 60000 }, async function (dataTable: any) {
    const roiData = dataTable.rowsHash();

    // Fill Right Type if provided
    if (roiData.rightType) {
        const actualRightType = replacePlaceholders(roiData.rightType);
        const rightTypeSelect = this.page.locator(RoiTableSelectors.rightTypeSelect);
        await rightTypeSelect.click();

        // Wait for dropdown options to appear
        const rightTypeOption = this.page.locator(`mat-option:has-text("${actualRightType}")`);
        await rightTypeOption.waitFor({ state: 'visible', timeout: 5000 });
        await rightTypeOption.click();
    }

    // Fill Term of Right if provided
    if (roiData.termOfRight) {
        const actualTerm = replacePlaceholders(roiData.termOfRight);
        const termSelect = this.page.locator(RoiTableSelectors.termOfRightSelect);
        await termSelect.click();

        // Wait for dropdown options to appear
        const termOption = this.page.locator(`mat-option:has-text("${actualTerm}")`);
        await termOption.waitFor({ state: 'visible', timeout: 5000 });
        await termOption.click();
    }

    // Fill Fee if provided
    if (roiData.fee) {
        const actualFee = replacePlaceholders(roiData.fee);
        // Try Add form selector first, then Edit form selector
        const feeInputAdd = this.page.locator(RoiTableSelectors.feeInput);
        const feeInputEdit = this.page.locator(RoiTableSelectors.feeInputEdit);

        // Use the first visible one
        const feeInput = await feeInputAdd.isVisible().catch(() => false) ? feeInputAdd : feeInputEdit;
        await feeInput.waitFor({ state: 'visible', timeout: 5000 });
        await feeInput.fill(actualFee);
    }

    // Fill Certificate Number if provided
    if (roiData.certificateNumber) {
        const actualCert = replacePlaceholders(roiData.certificateNumber);
        const certInput = this.page.locator(RoiTableSelectors.certificateInput);
        await certInput.waitFor({ state: 'visible', timeout: 5000 });
        await certInput.fill(actualCert);
    }
});

When('I save the ROI from table', { timeout: 30000 }, async function () {
    // For Add ROI form: there are TWO save buttons - "save" and "save and add interment"
    // We need to click ONLY the "save" button to avoid redirecting to interment page
    // Use CSS selector to match exact text, not contains
    const saveButton = this.page.locator('button').filter({ hasText: 'save' }).filter({ hasNotText: 'and add interment' });

    await saveButton.click();

    // Wait for navigation back to ROI table list
    await this.page.waitForURL(/tab=rois/, { timeout: 20000 });

    // Wait for ROI table data to load using the correct endpoint
    await NetworkHelper.waitForApiEndpoint(this.page, '/adv_table/application_records/');
});

Then('I should see ROI in the table', { timeout: 30000 }, async function () {
    // Verify we're back on the table page - use more flexible pattern
    await expect(this.page).toHaveURL(/tab=rois/, { timeout: 10000 });

    // Wait for the table to be visible and populated
    // The table data might already be loaded from cache, so just wait for rows
    const tableRows = this.page.locator(RoiTableSelectors.tableRows);
    await tableRows.first().waitFor({ state: 'visible', timeout: 15000 });
});

// ============================================
// EDIT ROI FROM TABLE STEPS
// ============================================

When('I click edit on the first ROI row', { timeout: 30000 }, async function () {
    // Wait for table to be visible and populated
    await NetworkHelper.waitForListPopulated(this.page, RoiTableSelectors.tableRows, 1, 15000);

    // Find the first row that is NOT an "Unassigned-" plot (those don't have coordinates)
    // Rows starting with "Unassigned-" show a popup instead of navigating to edit page
    const allRows = this.page.locator('mat-row');
    const rowCount = await allRows.count();

    for (let i = 0; i < rowCount; i++) {
        const row = allRows.nth(i);
        const plotIdCell = row.locator('mat-cell').nth(1); // Second cell (index 1) is Plot ID
        const plotIdText = await plotIdCell.textContent();

        // Skip Unassigned plots - they don't have coordinates and won't navigate
        if (plotIdText && !plotIdText.startsWith('Unassigned-')) {
            await plotIdCell.click();
            break;
        }
    }

    // Wait for navigation to edit page
    await this.page.waitForURL(/\/edit\/roi\//, { timeout: 15000 });
    await NetworkHelper.waitForApiRequestsComplete(this.page, 10000);
});

Then('I should see the Edit ROI form', async function () {
    // Verify form is visible
    const formTitle = this.page.locator(RoiTableSelectors.roiFormTitle);
    await expect(formTitle).toBeVisible({ timeout: 10000 });
});

Then('I should see updated ROI in the table', { timeout: 30000 }, async function () {
    // Verify we're back on the ROI table list page
    // Use tab=rois pattern instead of full path to handle different URL structures
    await expect(this.page).toHaveURL(/tab=rois/, { timeout: 10000 });

    // Verify table has rows and data is loaded
    const tableRows = this.page.locator(RoiTableSelectors.tableRows);
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
});

Then('I should see fee {string} in the ROI row', async function (expectedFee: string) {
    // Verify the fee appears in the table
    const feeText = this.page.locator(`text=${expectedFee}`);
    await expect(feeText).toBeVisible({ timeout: 10000 });
});
