/**
 * Search Selectors
 * Selectors for global search functionality
 */

export const SearchSelectors = {
  // Global search (header)
  globalSearchInput: 'input[type="text"]', // Search box in header
  searchResultsPanel: '.mat-autocomplete-panel, [role="listbox"]',
  searchResultOption: (plotName: string) => `mat-option:has-text("${plotName}"), [role="option"]:has-text("${plotName}")`,
  searchResultItem: 'cl-search-person-item',
};
