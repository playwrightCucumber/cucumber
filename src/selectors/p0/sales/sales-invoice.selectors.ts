/**
 * Sales Invoice Selectors
 * Covers invoice status, table row, more menu, void, toast
 */

export const SalesInvoiceSelectors = {
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

  // More menu (toolbar)
  moreMenuButton: '[data-testid="toolbar-manage-button-sales-btn"], button:has-text("MORE")',
  moreMenu: '[role="menu"]',
  moreMenuItem: (text: string) => `[role="menuitem"]:has-text("${text}")`,
  resendPaymentButton: '[role="menuitem"]:has-text("Re-send Payment")',

  // Void menu item & dialog
  voidMenuItem: '[role="menuitem"]:has-text("Void")',
  voidConfirmDialog: 'mat-dialog-container, [role="dialog"]',
  voidConfirmButton: '[data-testid="modal-sales-void-button-btn-modal"], button:has-text("void this sale")',
  voidCancelButton: 'mat-dialog-container button:has-text("cancel")',

  // Toast / Snackbar notifications
  toastNotification: 'simple-snack-bar, snack-bar-container, .mat-snack-bar-container, [role="alert"], .mat-mdc-snack-bar-container',
};
