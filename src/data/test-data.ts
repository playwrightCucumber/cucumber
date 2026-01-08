/**
 * Test Data Configuration
 * Centralized test data for all test scenarios
 * Can be overridden via environment variables for different environments/regression testing
 * 
 * Usage:
 * - Default: Uses hardcoded values below
 * - Environment: Set environment variables to override (e.g., TEST_EMAIL=new@email.com)
 * - Regression: Create .env file with new test data for bulk updates
 */

// ============================================
// LOGIN DATA
// ============================================
export const LOGIN_DATA = {
  valid: {
    email: process.env.TEST_EMAIL || process.env.CHRONICLE_EMAIL || 'faris+astanaorg@chronicle.rip',
    password: process.env.TEST_PASSWORD || process.env.CHRONICLE_PASSWORD || '12345',
    organizationName: process.env.TEST_ORG_NAME || 'astana tegal gundul'
  },
  invalid: {
    email: 'invalid@chronicle.rip',
    password: 'wrongpassword'
  }
};

// ============================================
// CEMETERY DATA
// ============================================
export const CEMETERY = process.env.TEST_CEMETERY || 'Astana Tegal Gundul';

// ============================================
// PLOT SEARCH DATA
// ============================================
export const PLOT_SEARCH = {
  section: process.env.TEST_SECTION || 'A',
  row: process.env.TEST_ROW || 'A',
  number: process.env.TEST_NUMBER || '1'
};

// Status options for scenario outline examples
export const STATUSES = ['For Sale', 'Vacant', 'Reserved', 'Occupied'];

// ============================================
// INTERMENT DATA
// ============================================
export const INTERMENT_DATA = {
  add: {
    firstName: process.env.TEST_INTERMENT_FIRSTNAME || 'John',
    lastName: process.env.TEST_INTERMENT_LASTNAME || 'Doe',
    intermentType: process.env.TEST_INTERMENT_TYPE || 'Burial'
  },
  edit: {
    firstName: process.env.TEST_INTERMENT_EDIT_FIRSTNAME || 'Jane',
    lastName: process.env.TEST_INTERMENT_EDIT_LASTNAME || 'Smith',
    intermentType: process.env.TEST_INTERMENT_EDIT_TYPE || 'Cremated'
  }
};

// ============================================
// ROI (RECORD OF INTEREST) DATA
// ============================================
export const ROI_DATA = {
  basic: {
    rightType: process.env.TEST_ROI_RIGHT_TYPE || 'Cremation',
    termOfRight: process.env.TEST_ROI_TERM || '25 Years',
    fee: process.env.TEST_ROI_FEE || '1000',
    certificateNumber: process.env.TEST_ROI_CERT || 'CERT-TEST-001',
    notes: process.env.TEST_ROI_NOTES || 'Test ROI for automation'
  },
  withPerson: {
    rightType: 'Cremation',
    termOfRight: '25 Years',
    fee: '1000',
    certificateNumber: process.env.TEST_ROI_CERT_2 || 'CERT-TEST-002',
    notes: 'Test ROI with person holder',
    holder: {
      firstName: process.env.TEST_ROI_HOLDER_FIRSTNAME || 'John',
      lastName: process.env.TEST_ROI_HOLDER_LASTNAME || 'Doe',
      phone: process.env.TEST_ROI_HOLDER_PHONE || '+1234567890'
    }
  }
};

// ============================================
// FULL TEST DATA OBJECT (For easy access)
// ============================================
export const TEST_DATA = {
  login: LOGIN_DATA,
  cemetery: CEMETERY,
  plot: PLOT_SEARCH,
  statuses: STATUSES,
  interment: INTERMENT_DATA,
  roi: ROI_DATA
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Helper function to get plot detail text (format: "A A 1")
export function getPlotDetailText(): string {
  return `${PLOT_SEARCH.section} ${PLOT_SEARCH.row} ${PLOT_SEARCH.number}`;
}

// Helper function to get full deceased name
export function getDeceasedName(type: 'add' | 'edit' = 'add'): string {
  const data = type === 'add' ? INTERMENT_DATA.add : INTERMENT_DATA.edit;
  return `${data.firstName} ${data.lastName}`;
}
