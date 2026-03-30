/**
 * Import Page Selectors
 * Selectors for cemetery import page
 * All selectors use data-testid attributes or stable DOM identifiers
 */

export const ImportSelectors = {
  // Navigation
  // "More" is rendered as <span>More</span> inside <cl-cemetery-action-wrapper>
  moreButton: 'span:text("More")',
  importMenuItem: '[role="menuitem"]:has-text("Import")',

  // Import page header
  importPageTitle: 'h1:has-text("Import data")',
  backToCemeteryButton: 'button:has-text("Back to the Cemetery")',

  // Data categories
  sectionsCategory: 'h3:has-text("Sections")',
  plotsCategory: 'h3:has-text("Plots")',
  personsCategory: 'h3:has-text("Persons")',
  roisCategory: 'h3:has-text("ROIs")',
  intermentsCategory: 'h3:has-text("Interments")',
  storiesCategory: 'h3:has-text("Stories")',
  eventsCategory: 'h3:has-text("Events")',
  lotCategory: 'h3:has-text("LOT")',
  notesCategory: 'h3:has-text("Notes")',
  invoicesCategory: 'h3:has-text("Invoices")',

  // Actions — confirmed testids from playwright-cli debug session
  wipeDataButton: '[data-testid="toolbar-manage-button-wipe-data"]',
  downloadTemplateLink: 'a:has-text("Download Import Template"), [class*="download-template"]',
  importButton: 'button:has-text("Import")',

  // Wipe data confirmation dialog (title: "Сlear Cemetery database")
  wipeDialogCancelButton: '[data-testid="confirmation-dialog-button-cancel"]',
  wipeDialogConfirmButton: '[data-testid="confirmation-dialog-button-action"]',

  // Import confirmation dialog (title: "Confirm data import")
  // Appears after clicking the main Import button — must be confirmed to start the job.
  // Reuses the same data-testid pattern as the wipe dialog.
  importConfirmButton: '[data-testid="confirmation-dialog-button-action"]',
  importCancelButton: '[data-testid="confirmation-dialog-button-cancel"]',

  // Drop zones — each category uses cl-section-item Angular component
  // Clicking the drop zone opens a native file chooser dialog
  // Use getDropZone() helper below to find the right drop zone by category + file type
  dropZoneGeojson: 'div:has-text("Drag here to import .geojson")',
  dropZoneCsv: 'div:has-text("Drag here to import .csv")',
  fileInput: 'input[type="file"]',

  // cl-section-item component — confirmed testids from DOM inspection (no Shadow DOM)
  // NOTE: Angular alternates testid suffixes per component instance:
  //   1st cl-section-item (Sections): section-item-h3-name, section-item-div-text-0, section-item-span-filetype-1
  //   2nd+ cl-section-items (Plots etc): section-item-h3-name-0, section-item-div-text, section-item-span-filetype
  // Use *= (contains) attribute selectors to match both variants.
  sectionItemComponent: 'cl-section-item',
  sectionItemH3Name: '[data-testid*="section-item-h3-name"]',         // exact category name heading (suffix varies)
  sectionItemFiletype: '[data-testid*="section-item-span-filetype"]',  // file type text (no dot, just "geojson"/"csv")
  dragContainer: '[data-testid*="section-item-div-drag-container"]',   // clickable drop zone — always present
  dropZoneTestId: '[data-testid="section-item-div-text"]',           // drop zone for 2nd+ items (no -0 suffix)
  dropZoneTestIdAlt: '[data-testid="section-item-div-text-0"]',      // drop zone for 1st item (Sections, with -0 suffix)

  // Post-upload UI elements (shown after file is selected)
  mergeStrategyDropdown: 'mat-select:has-text("Merge"), mat-select:has-text("Replace")',
  uploadedFilename: '[data-testid="section-item-h6-name-0"], h6',
  uploadMoreButton: '[data-testid="section-item-button-upload-more"], [data-testid="section-item-button-upload-more-0"]',
  deleteFileButton: (filename: string) => `h6:has-text("${filename}") + *`, // sibling of filename h6

  // Count badges — h4 immediately after h3 with category name
  getCategoryCount: (category: string) => `h3:text-is("${category}") + h4`,

  // Post-import progress — appears in the LEFT SIDEBAR of the cemetery admin page after Import.
  // After confirming the import dialog, the app auto-navigates back to the cemetery admin page.
  // The sidebar shows "Import in progress ..." label and mat-progress-bar elements per category.
  importProgressText: 'text=Import in progress',
  importProgressBar: 'mat-progress-bar',
} as const;

/**
 * URLs related to import
 */
export const ImportUrls = {
  importDataPage: '/import-data',
} as const;
