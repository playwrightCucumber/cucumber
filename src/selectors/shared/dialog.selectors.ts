/**
 * Dialog Selectors
 * Common selectors for modal dialogs across all pages
 */

export const DialogSelectors = {
  // Main dialog container
  dialog: 'mat-dialog-container, [role="dialog"]',

  // Dialog title
  dialogTitle: 'mat-dialog-container h2, [role="dialog"] h2, [role="dialog"] h3',

  // Dialog content
  dialogContent: 'mat-dialog-container mat-dialog-content, [role="dialog"] .mat-dialog-content',

  // Dialog actions (buttons container)
  dialogActions: 'mat-dialog-container mat-dialog-actions, [role="dialog"] .mat-dialog-actions',

  // Common dialog buttons
  confirmButton: '[role="dialog"] button:has-text("OK"), [role="dialog"] button:has-text("Confirm")',
  cancelButton: '[role="dialog"] button:has-text("Cancel"), [role="dialog"] button:has-text("cancel")',
  closeButton: '[role="dialog"] button:has-text("Close"), [role="dialog"] button[aria-label="Close"]',
  continueButton: '[role="dialog"] button:has-text("Continue")',
  deleteButton: '[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("delete")',

  // Success dialog variant
  successDialog: '[role="dialog"]:has-text("success"), mat-dialog-container:has-text("success")',

  // Confirmation dialog
  confirmationDialog: '[role="dialog"]:has-text("Are you"), [role="dialog"]:has-text("Confirm"), [role="dialog"]:has-text("Delete")',
};
