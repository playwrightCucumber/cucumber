/**
 * Sales Payment Selectors
 * Covers payment form, method, submit, history
 */

export const SalesPaymentSelectors = {
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
};
