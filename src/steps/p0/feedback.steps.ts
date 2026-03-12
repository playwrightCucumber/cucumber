import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { FeedbackPage, FeedbackApplicantData } from '../../pages/p0/FeedbackPage.js';
import { Logger } from '../../utils/Logger.js';
import { replacePlaceholders, replacePlaceholdersInObject } from '../../utils/TestDataHelper.js';
import { DataTable } from '@cucumber/cucumber';

const logger = new Logger('FeedbackSteps');
let feedbackPage: FeedbackPage;

// ============================================
// NAVIGATION
// ============================================

When('I click on REQUESTS button', async function () {
  logger.info('Clicking REQUESTS button');
  feedbackPage = new FeedbackPage(this.page);
  await feedbackPage.clickRequestsButton();
});

When('I select Feedback from the request menu', async function () {
  logger.info('Selecting Feedback from request menu');
  await feedbackPage.selectFeedbackFromMenu();
});

When('I navigate to Feedback page', async function () {
  logger.info('Navigating to Feedback page');
  feedbackPage = new FeedbackPage(this.page);
  await feedbackPage.navigateToFeedback();
});

Then('I should see the Feedback form', async function () {
  logger.info('Verifying Feedback form is displayed');
  if (!feedbackPage) feedbackPage = new FeedbackPage(this.page);
  const isDisplayed = await feedbackPage.isFeedbackPageDisplayed();
  expect(isDisplayed).toBeTruthy();
});

// ============================================
// SECTION 1: INSIGHTS
// ============================================

When('I continue past the Insights section', async function () {
  logger.info('Continuing past Insights section');
  await feedbackPage.continueInsightsSection();
});

// ============================================
// SECTION 2: APPLICANT
// ============================================

When('I fill the applicant form with the following details:', async function (dataTable: DataTable) {
  logger.info('Filling applicant form from data table');
  const rawData = dataTable.rowsHash() as Record<string, string>;
  const data = replacePlaceholdersInObject(rawData) as Record<string, string>;

  const applicantData: FeedbackApplicantData = {
    firstName: data['firstName'] || data['First Name'] || '',
    lastName: data['lastName'] || data['Last Name'] || '',
    email: data['email'] || data['Email'] || '',
    middleName: data['middleName'] || data['Middle Name'],
    gender: data['gender'] || data['Gender'],
    title: data['title'] || data['Title'],
    phoneMobile: data['phoneMobile'] || data['Phone Mobile'],
    phoneHome: data['phoneHome'] || data['Phone Home'],
    phoneOffice: data['phoneOffice'] || data['Phone Office'],
    address: data['address'] || data['Address'],
    suburb: data['suburb'] || data['Suburb'],
    state: data['state'] || data['State'],
    country: data['country'] || data['Country'],
    postcode: data['postcode'] || data['Postcode'],
  };

  await feedbackPage.fillApplicantForm(applicantData);
});

When('I continue past the Applicant section', async function () {
  logger.info('Continuing past Applicant section');
  await feedbackPage.continueApplicantSection();
});

// ============================================
// SECTION 3: CATEGORY
// ============================================

When('I select feedback type {string}', async function (type: string) {
  const actualType = replacePlaceholders(type);
  logger.info(`Selecting feedback type: ${actualType}`);
  await feedbackPage.selectFeedbackCategory(actualType);
});

When('I continue past the Category section', async function () {
  logger.info('Continuing past Category section');
  await feedbackPage.continueCategorySection();
});

// ============================================
// SECTION 4: DETAILS
// ============================================

When('I fill feedback details with {string}', async function (message: string) {
  const actualMessage = replacePlaceholders(message);
  logger.info('Filling feedback details');
  await feedbackPage.fillDetails(actualMessage);
});

When('I continue past the Details section', async function () {
  logger.info('Continuing past Details section');
  await feedbackPage.continueDetailsSection();
});

// ============================================
// SECTION 5: THANKS
// ============================================

When('I continue past the Thanks section', async function () {
  logger.info('Continuing past Thanks section');
  await feedbackPage.continueThanksSection();
});

// ============================================
// SUBMIT
// ============================================

Then('the feedback submit button should be enabled', async function () {
  logger.info('Verifying submit button is enabled');
  const isEnabled = await feedbackPage.waitForSubmitEnabled();
  expect(isEnabled).toBeTruthy();
});

When('I click the feedback submit button', async function () {
  logger.info('Clicking submit button');
  await feedbackPage.clickSubmitButton();
});

// ============================================
// COMBINED FLOW
// ============================================

When('I submit feedback with the following details:', async function (dataTable: DataTable) {
  logger.info('Starting full feedback submission flow');
  feedbackPage = new FeedbackPage(this.page);
  const rawData = dataTable.rowsHash() as Record<string, string>;
  const data = replacePlaceholdersInObject(rawData) as Record<string, string>;

  const submissionData = {
    applicant: {
      firstName: data['firstName'] || data['First Name'] || '',
      lastName: data['lastName'] || data['Last Name'] || '',
      email: data['email'] || data['Email'] || '',
      middleName: data['middleName'] || data['Middle Name'],
      gender: data['gender'] || data['Gender'],
      title: data['title'] || data['Title'],
      phoneMobile: data['phoneMobile'] || data['Phone Mobile'],
      phoneHome: data['phoneHome'] || data['Phone Home'],
      phoneOffice: data['phoneOffice'] || data['Phone Office'],
      address: data['address'] || data['Address'],
      suburb: data['suburb'] || data['Suburb'],
      state: data['state'] || data['State'],
      country: data['country'] || data['Country'],
      postcode: data['postcode'] || data['Postcode'],
    },
    feedbackType: data['feedbackType'] || data['Feedback Type'] || '',
    details: data['details'] || data['Details'] || '',
  };

  await feedbackPage.submitFeedback(submissionData);
});
