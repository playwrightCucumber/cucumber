/**
 * Selectors for Request Sales Form Page
 * Used for public plot purchase request functionality
 */

export const RequestSalesFormSelectors = {
  // Sell plots page
  sellPlotsPage: {
    heading: 'h1:has-text("Plots for sale")',
    filterButton: 'button:has-text("FILTER")',
  },

  // Section tree
  sectionTree: {
    treeRoot: '[role="tree"]',
    toggleButton: (sectionName: string) => `button[data-testid*="toggle-${sectionName.toLowerCase().replace(/\s+/g, '-')}"]`,
    plotListItem: (plotName: string) => `[role="listitem"]:has-text("${plotName}")`,
    firstPlotInSection: 'list[role="list"] > [role="listitem"]:first-child',
  },

  // Plot details page
  plotDetails: {
    plotName: 'h1, h3',
    plotStatus: 'p:has-text("FOR SALES")',
    requestToBuyButton: 'button:has-text("REQUEST TO BUY")',
    cemetery: 'p',
  },

  // Request menu
  requestMenu: {
    preNeedOption: '[role="menuitem"]:has-text("Pre-need plot purchase")',
    atNeedOption: '[role="menuitem"]:has-text("At-need plot purchase")',
  },

  // Purchase form
  purchaseForm: {
    heading: 'h1:has-text("Pre-need Plot Purchase")',
    
    // Description section
    description: {
      continueButton: 'button:has-text("CONTINUE")',
    },

    // ROI Applicant section
    roiApplicant: {
      firstName: '#mat-input-0',
      lastName: '#mat-input-1',
      middleName: '#mat-input-2',
      phoneMobile: '#mat-input-3',
      phoneHome: '#mat-input-4',
      phoneOffice: '#mat-input-5',
      email: '#mat-input-6',
      address: '#mat-input-7',
      suburb: '#mat-input-8',
      state: '#mat-input-9',
      country: '#mat-input-10',
      postcode: '#mat-input-11',
      postalAddressDifferent: 'input[type="checkbox"]#mat-checkbox-1-input',
      alsoROIHolder: 'input[type="checkbox"]#mat-checkbox-2-input',
      continueButton: 'button:has-text("continue")',
    },

    // Interment Details section (At-need only)
    intermentDetails: {
      deceasedFirstName: 'input[placeholder*="First Name"], input[formcontrolname="firstName"]',
      deceasedLastName: 'input[placeholder*="Last Name"], input[formcontrolname="lastName"]',
      deceasedMiddleName: 'input[placeholder*="Middle Name"], input[formcontrolname="middleName"]',
      dateOfBirth: 'input[placeholder*="Date of Birth"]',
      dateOfDeath: 'input[placeholder*="Date of Death"]',
      placeOfDeath: 'input[placeholder*="Place of Death"]',
      intermentDate: 'input[placeholder*="Date of Interment"]',
      intermentTime: 'input[placeholder*="Time of Interment"]',
      funeralDirector: 'input[placeholder*="Funeral Director"]',
      continueButton: 'button:has-text("continue")',
    },

    // ROI section
    roi: {
      rightType: '[role="combobox"]:has-text("Right Type")',
      rightTypeOption: (type: string) => `[role="option"]:has-text("${type}")`,
      termOfRight: '[role="combobox"]:has-text("Term of Right")',
      termOfRightOption: (term: string) => `[role="option"]:has-text("${term}")`,
      fee: 'input[type="number"]',
      paymentDate: 'input[placeholder*="Payment Date"]',
      charged: 'input[type="checkbox"]:has(~ * >> text="Charged")',
      applicationDate: 'input[placeholder*="Application Date"]',
      expiryDate: 'input[placeholder*="Expiry Date"]',
      serviceNeed: '[role="combobox"]:has-text("Service Need")',
      certificateNumber: 'input[placeholder*="Certificate Number"]',
      note: 'textarea, input[placeholder*="Note"]',
      selectFileButton: 'button:has-text("SELECT FILE")',
      continueButton: 'button:has-text("continue")',
    },

    // Terms and conditions section
    terms: {
      agreeCheckbox: '.mat-checkbox-inner-container',
      continueButton: 'button:has-text("continue")',
    },

    // Signature section
    signature: {
      signaturePad: 'signature-pad',
      canvas: 'canvas',
      continueButton: 'button:has-text("continue")',
    },

    // Form summary
    summary: {
      plotName: 'h3',
      cemetery: 'p',
      submitButton: 'button:has-text("SUBMIT A REQUEST")',
    },
  },

  // Confirmation dialog
  confirmationDialog: {
    dialog: '[role="dialog"]',
    heading: 'h1:has-text("Pre-need plot purchase")',
    successMessage: 'h3:has-text("✅ Request was sent")',
    plotName: '[role="dialog"] h3',
    cemetery: '[role="dialog"] p',
    description: 'p:has-text("Cemetery administration will contact you")',
    viewPdfButton: 'button:has-text("View submission as PDF")',
    continueButton: '[role="dialog"] button:has-text("Continue")',
  },
} as const;
