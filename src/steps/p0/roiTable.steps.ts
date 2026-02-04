/**
 * ROI Table Menu Step Definitions
 * Steps for navigating to ROI table and managing ROIs from table menu
 * Selectors verified via MCP Playwright on 2026-02-04
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { RoiTableSelectors, RoiTableUrls } from '../../selectors/p0/roiTable.selectors.js';
import { ROI_DATA } from '../../data/test-data.js';

// ============================================
// NAVIGATION STEPS
// ============================================

When('I click the sidebar table menu', async function () {
    // Use verified selector with fallback
    const sidebarButton = this.page.locator(RoiTableSelectors.sidebarTableButton)
        .or(this.page.locator(RoiTableSelectors.sidebarTableButtonAlt));

    await sidebarButton.click();
    await this.page.waitForLoadState('networkidle');
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

When('I click the ROIs tab', async function () {
    // Use verified selector with data-testid fallback
    const roisTab = this.page.locator(RoiTableSelectors.roisTabDataTestId)
        .or(this.page.locator(RoiTableSelectors.roisTab));

    await roisTab.click();
    await this.page.waitForLoadState('networkidle');
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
