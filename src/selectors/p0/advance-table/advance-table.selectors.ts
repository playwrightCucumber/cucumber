/**
 * Advance Table Selectors
 * Selectors for the advance-table page (plots, persons, etc.)
 */

export const AdvanceTableSelectors = {
  // Tabs - using text-based selectors
  plotsTab: 'a:has-text("PLOTS")',
  intermentsTab: 'a:has-text("INTERMENTS")',
  roisTab: 'a:has-text("ROIS")',
  personsTab: 'a:has-text("PERSONS")',
  businessTab: 'a:has-text("BUSINESS")',

  // Filter button (top right corner)
  filterButton: 'button:has-text("FILTER")',

  // Filter modal
  filterModal: '[role="dialog"], mat-dialog-container, .cdk-overlay-pane',

  // Filter form - Plot fields (using placeholder or label)
  filterSectionInput: 'input[placeholder="Section"], mat-form-field:has-text("Section") input',
  filterRowInput: 'input[placeholder="Row"], mat-form-field:has-text("Row") input',
  filterNumberInput: 'input[placeholder="Number"], mat-form-field:has-text("Number") input',

  // Filter form - Status dropdown
  filterStatusDropdown: 'mat-select[formcontrolname="status"], mat-form-field:has-text("Status") mat-select',

  // Filter form buttons
  filterApplyButton: 'button:has-text("APPLY")',
  filterClearButton: 'button:has-text("CLEAR")',
  filterCancelButton: 'button:has-text("Cancel")',

  // Table structure
  table: '[role="table"]',
  tableHeader: '[role="table"] [role="row"]:first-child',
  tableFirstDataRow: '[role="table"] [role="row"]:nth-child(2)',

  // Table columns (using role="cell")
  // Columns: checkbox, Plot ID, Section, Row, Number, Status, Price, ...
  firstRowPlotIdCell: '[role="table"] [role="row"]:nth-child(2) [role="cell"]:nth-child(2)',
  firstRowSectionCell: '[role="table"] [role="row"]:nth-child(2) [role="cell"]:nth-child(3)',
  firstRowRowCell: '[role="table"] [role="row"]:nth-child(2) [role="cell"]:nth-child(4)',
  firstRowNumberCell: '[role="table"] [role="row"]:nth-child(2) [role="cell"]:nth-child(5)',
  firstRowStatusCell: '[role="table"] [role="row"]:nth-child(2) [role="cell"]:nth-child(6)',

  // Dynamic row selector
  tableRow: (index: number) => `[role="table"] [role="row"]:nth-child(${index + 2})`, // +2 because header is first
  tableCell: (rowIndex: number, colIndex: number) =>
    `[role="table"] [role="row"]:nth-child(${rowIndex + 2}) [role="cell"]:nth-child(${colIndex})`,

  // Loading indicator
  tableLoading: '[role="table"] progressbar',
};
