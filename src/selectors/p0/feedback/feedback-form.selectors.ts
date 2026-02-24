/**
 * Selectors for Feedback feature at Cemetery level
 * Used for submitting feedback via sidebar request menu
 */

export const FeedbackSelectors = {
  // Sidebar / Cemetery Navigation
  sidebar: {
    cemeterySection: '[data-testid="sidebar-cemetery"], .sidebar-cemetery, [class*="cemetery"]',
    requestButton: 'button:has-text("Request"), button:has-text("REQUEST"), [data-testid*="request"]',
    requestMenu: '[role="menu"], .mat-menu-panel',
    feedbackMenuItem: '[role="menuitem"]:has-text("Feedback"), [role="menuitem"]:has-text("feedback")',
  },

  // Feedback Form Page
  feedbackPage: {
    heading: 'h1:has-text("Feedback"), h2:has-text("Feedback"), [class*="heading"]:has-text("Feedback")',
    pageContainer: '[class*="feedback"], [data-testid*="feedback"]',
  },

  // Feedback Form Fields
  form: {
    // Subject / Title field
    subjectInput: 'input[formcontrolname="subject"], input[placeholder*="Subject"], input[placeholder*="Title"], #subject',

    // Category / Type dropdown
    categorySelect: 'mat-select[formcontrolname="category"], [data-testid*="category"], mat-select:has-text("Category")',
    categoryOption: (category: string) => `mat-option:has-text("${category}"), [role="option"]:has-text("${category}")`,

    // Message / Description textarea
    messageInput: 'textarea[formcontrolname="message"], textarea[formcontrolname="description"], textarea[placeholder*="Message"], textarea[placeholder*="Description"], #message',

    // Email field (if required)
    emailInput: 'input[formcontrolname="email"], input[type="email"], input[placeholder*="Email"]',

    // Name field (if required)
    nameInput: 'input[formcontrolname="name"], input[placeholder*="Name"]',

    // Phone field (if required)
    phoneInput: 'input[formcontrolname="phone"], input[type="tel"], input[placeholder*="Phone"]',

    // Rating (if applicable)
    ratingStars: '[class*="rating"], [data-testid*="rating"]',
    ratingStar: (rating: number) => `[data-testid*="rating-${rating}"], [class*="rating"] button:nth-child(${rating})`,

    // File upload (if applicable)
    attachmentButton: 'button:has-text("Attach"), button:has-text("Upload"), input[type="file"]',
    attachmentInput: 'input[type="file"]',
  },

  // Form Actions
  actions: {
    submitButton: 'button:has-text("Submit"), button:has-text("SUBMIT"), button[type="submit"]',
    cancelButton: 'button:has-text("Cancel"), button:has-text("CANCEL")',
    clearButton: 'button:has-text("Clear"), button:has-text("CLEAR")',
  },

  // Success / Confirmation
  confirmation: {
    successMessage: '[class*="success"]:has-text("success"), .mat-snack-bar-container:has-text("success"), [role="alert"]:has-text("success"), h3:has-text("success"), p:has-text("submitted successfully")',
    successDialog: '[role="dialog"]:has-text("success"), mat-dialog-container:has-text("success")',
    confirmationText: 'text=feedback has been submitted, text=successfully submitted, text=Thank you',
    okButton: '[role="dialog"] button:has-text("OK"), [role="dialog"] button:has-text("Close")',
  },

  // Error states
  errors: {
    errorMessage: '.mat-error, [class*="error-message"], [role="alert"]:has-text("error")',
    requiredFieldError: '.mat-error:has-text("required"), [class*="error"]:has-text("required")',
  },

  // Loading states
  loading: {
    spinner: '.mat-spinner, [class*="spinner"], [class*="loading"]',
    progressBar: '.mat-progress-bar, [role="progressbar"]',
  },
} as const;

export const FeedbackUrls = {
  feedbackPage: '/feedback',
  feedbackPattern: '**/feedback**',
} as const;
