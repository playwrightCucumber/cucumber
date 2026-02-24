/**
 * Toast/Snackbar Notification Selectors
 * Common selectors for toast notifications across all pages
 */

export const ToastSelectors = {
  // Main toast container - covers multiple UI frameworks
  toastNotification: 'simple-snack-bar, snack-bar-container, .mat-snack-bar-container, [role="alert"], .mat-mdc-snack-bar-container',

  // Toast message content
  toastMessage: 'simple-snack-bar span, snack-bar-container .mat-simple-snackbar-action, [role="alert"]',

  // Toast actions (buttons within toast)
  toastActionButton: 'simple-snack-bar button, snack-bar-container button, [role="alert"] button',

  // Success toast variant
  successToast: '[role="alert"]:has-text("success"), .mat-snack-bar-container:has-text("success")',

  // Error toast variant
  errorToast: '[role="alert"].mat-warn, .mat-snack-bar-container.mat-warn',

  // Info toast variant
  infoToast: '[role="alert"].mat-accent, .mat-snack-bar-container.mat-accent',
};
