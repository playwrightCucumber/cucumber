/**
 * Loading State Selectors
 * Common selectors for loading indicators across all pages
 */

export const LoadingSelectors = {
  // Main spinner
  spinner: '.mat-spinner, [class*="spinner"], [class*="loading"]',

  // Material Design spinner overlay
  matSpinnerOverlay: '.mat-spinner-overlay, .cdk-overlay-container .mat-spinner',

  // Progress bar
  progressBar: 'mat-progress-bar, [role="progressbar"]',

  // Loading text/message
  loadingText: ':has-text("Loading"), :has-text("loading")',

  // Skeleton loaders
  skeletonLoader: '.mat-skeleton, [class*="skeleton"]',

  // Full page loader
  fullPageLoader: '.mat-progress-bar, .loading-indicator, [role="progressbar"][aria-busy="true"]',

  // Button loading state
  buttonLoading: 'button.mat-progress-spinner, button .mat-spinner, button[disabled]:has(.mat-spinner)',
};
