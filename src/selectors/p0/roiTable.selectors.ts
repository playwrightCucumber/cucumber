/**
 * ROI Table Menu Selectors
 * Real selectors from staging.chronicle.rip
 * Discovered via MCP Playwright manual exploration on 2026-02-04
 */

export const RoiTableSelectors = {
    // Sidebar navigation - VERIFIED
    sidebarTableButton: 'mat-button-toggle:has-text("Tables") button',
    sidebarTableButtonAlt: 'button:has([data-testid="side-menu-span-label-menu-sidebar-0"]:has-text("Tables"))',

    // Tables page - Tabs - VERIFIED
    roisTab: 'a.mat-tab-link:has-text("ROIS")',
    roisTabDataTestId: 'a[data-testid="content-wrapper-a-2"]',

    // Alternative tab selectors by text
    tabByText: (tabName: string) => `a.mat-tab-link:has-text("${tabName.toUpperCase()}")`,

    // ROIs tab - Actions - VERIFIED
    // Note: Add button uses data-testid="content-wrapper-button-add-plot" even though label is "ADD ROIS"
    addRoiButton: 'button[data-testid="content-wrapper-button-add-plot"]',
    addRoiButtonByText: 'button:has-text("ADD ROIS")',

    exportButton: 'button.action.export',
    exportButtonByText: 'button:has-text("EXPORT")',

    // Verification
    activeTab: '.mat-tab-link-active',
    activeTabText: (tabName: string) => `.mat-tab-link-active:has-text("${tabName.toUpperCase()}")`
};

export const RoiTableUrls = {
    tablesPage: '/advance-table',
    tablesRoisPage: '/advance-table?tab=rois'
};
