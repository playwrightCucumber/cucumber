/**
 * Selectors for Sales page functionality
 */

export const salesSelectors = {
  // Sales List/Table Page
  salesMenuButton: 'button:has-text("Sales")',
  createSaleButton: '[data-testid="content-wrapper-button-create-sale-btn"]',
  salesTable: 'table',
  salesTableRows: 'tbody tr',
  filterButton: 'button:has-text("FILTER")',

  // Create/Edit Sale Form
  referenceInput: 'input[formcontrolname="reference"]',
  issueDateInput: 'input[formcontrolname="issue_date"], input[placeholder*="ssue"], input[id*="issue"]',
  dueDateInput: 'input[formcontrolname="due_date"], input[placeholder*="ue date"], input[id*="due"]',
  ownerSelect: 'mat-select[formcontrolname="owner"]',
  noteTextarea: 'textarea[formcontrolname="notes"]',

  // Purchaser Section
  addPurchaserButton: 'button:has-text("ADD PURCHASER")',
  purchaserSection: '[class*="purchaser"]',
  
  // Add Person Dialog (appears after clicking ADD PURCHASER)
  addPersonDialog: 'mat-dialog-container, [role="dialog"]',
  purchaserFirstNameInput: 'mat-dialog-container input[formcontrolname="first_name"]',
  purchaserLastNameInput: 'mat-dialog-container input[formcontrolname="last_name"]',
  purchaserEmailInput: 'mat-dialog-container input[formcontrolname="email"]',
  addPersonButton: 'mat-dialog-container button:has-text("add")',
  cancelPersonButton: 'mat-dialog-container button:has-text("cancel")',

  // Item Section
  itemSection: '.item-section, [class*="item"]',
  addItemButton: 'button:has-text("ADD ITEM")',
  
  // Item fields - use generic selectors that work with dynamic forms
  // Note: First item row is already present, additional items added via ADD ITEM button
  allItemDescriptions: 'textarea.mat-input-element',
  allItemPlots: 'mat-select[placeholder="All"]',
  allItemQuantities: '[data-testid="sales-calculator-input"]',
  allItemPrices: '[data-testid="sales-calculator-input-0"]',
  allItemDiscounts: '[data-testid="sales-calculator-input-1"]',
  itemTaxRate: (index: number) => `(//input[contains(@formcontrolname, 'tax')])[${index + 1}]`,
  itemTotal: (index: number) => `(.//div[contains(@class, 'total')])[${index + 1}]`,
  itemNoteButton: (index: number) => `(//button[contains(text(), 'Add description')])[${index + 1}]`,
  
  // Plot selection in dropdown
  plotOption: (plotName: string) => `mat-option .mat-option-text:text-is("${plotName} (Occupied)")`,
  plotInput: 'input[placeholder*="Plot"]',
  
  // Summary Section - Simple text-based selectors
  subtotalValue: 'text=Subtotal >> xpath=following-sibling::*[1]',
  discountValue: 'text=Discount >> xpath=following-sibling::*[1]',
  vatLabel: 'text=VAT',
  vatValue: 'text=VAT >> xpath=following-sibling::*//*[contains(text(), "$")]',
  totalValue: 'text=Total >> xpath=following-sibling::*[1]',
  
  // Action Buttons
  saveButton: 'button:has-text("SAVE")',
  createButton: 'button:has-text("CREATE")',
  cancelButton: 'button:has-text("CANCEL")',

  // Documents Section
  selectFileButton: 'button:has-text("SELECT FILE")',
  dragDropArea: 'text=or drag it here',

  // Validation Messages
  errorMessage: '.mat-error, [class*="error"]',
  successMessage: '.mat-success, [class*="success"]',
  
  // Loading States
  loadingSpinner: '.spinner, [class*="loading"]',

  // Payment Section
  addPaymentButton: 'button:has-text("ADD PAYMENT")',
  
  // Payment form fields - using formcontrolname attributes
  paymentDateInput: '[formcontrolname="payment_date"]',
  paymentTimeInput: '[formcontrolname="payment_time"]',
  paymentMethodSelect: '[formcontrolname="payment_method"]',
  paymentNoteInput: '[formcontrolname="notes"]',
  paymentAmountInput: '[formcontrolname="amount"]',
  
  // Payment method dropdown
  paymentMethodListbox: 'div[role="listbox"]',
  paymentMethodOption: (method: string) => `div[role="listbox"] mat-option:has-text("${method}")`,
  paymentMethodFirstOption: 'div[role="listbox"] mat-option:nth-child(1)',

  // Payment submit buttons
  paymentAddButton: 'button:has-text("ADD"):visible',
  paymentCancelButton: 'button:has-text("CANCEL"):visible',

  // Payment history table
  paymentHistorySection: 'text=Payments >> ..',
  paymentHistoryRows: 'text=Payments >> .. >> .. >> tbody tr',

  // Invoice status badges
  invoiceStatus: '.mat-badge, [class*="badge"], [class*="status"]',
  invoiceStatusPartialPaid: '.mat-badge:has-text("PARTIALLY PAID"), [class*="partial"]',
  invoiceStatusUnpaid: '.mat-badge:has-text("UNPAID")',
  invoiceStatusPaid: '.mat-badge:has-text("PAID"), [class*="paid"]',
  invoiceStatusOverpaid: '.mat-badge:has-text("OVERPAID")',
  invoiceStatusDraft: '.mat-badge:has-text("DRAFT")',

  // Invoice table row
  invoiceTableRow: (invoiceId: string) => `tr:has-text("${invoiceId}")`,
  invoiceStatusInTable: (invoiceId: string) => `tr:has-text("${invoiceId}") .mat-badge, tr:has-text("${invoiceId}") [class*="badge"], tr:has-text("${invoiceId}") [class*="status"]`,
  invoicePaidAmountInTable: (invoiceId: string) => `tr:has-text("${invoiceId}") >> td >> nth=8`,
};

export default salesSelectors;
