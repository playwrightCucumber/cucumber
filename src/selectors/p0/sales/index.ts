/**
 * Sales Selectors Index
 * Merges all sales selectors via spread for backward compatibility
 */

import { SalesFormSelectors } from './sales-form.selectors.js';
import { SalesPaymentSelectors } from './sales-payment.selectors.js';
import { SalesInvoiceSelectors } from './sales-invoice.selectors.js';

// Merge all selectors via spread for backward compatibility
export const salesSelectors = {
  ...SalesFormSelectors,
  ...SalesPaymentSelectors,
  ...SalesInvoiceSelectors,
};

// Export individual selectors for fine-grained imports
export { SalesFormSelectors, SalesPaymentSelectors, SalesInvoiceSelectors };

// Default export for backward compatibility
export default salesSelectors;
