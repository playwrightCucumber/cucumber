import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { FeedbackPage, FeedbackData } from '../../pages/p0/FeedbackPage.js';
import { Logger } from '../../utils/Logger.js';
import { replacePlaceholders, replacePlaceholdersInObject } from '../../utils/TestDataHelper.js';
import { DataTable } from '@cucumber/cucumber';

const logger = new Logger('FeedbackSteps');
let feedbackPage: FeedbackPage;

// Navigation Steps
When('I click on Request button in sidebar', { timeout: 15000 }, async function () {
  logger.info('Clicking Request button in sidebar');
  feedbackPage = new FeedbackPage(this.page);
  await feedbackPage.clickRequestButton();
});

When('I select Feedback from the request menu', { timeout: 15000 }, async function () {
  logger.info('Selecting Feedback from request menu');
  await feedbackPage.selectFeedbackFromMenu();
});

When('I navigate to Feedback page via Request menu', { timeout: 30000 }, async function () {
  logger.info('Navigating to Feedback page via Request menu');
  feedbackPage = new FeedbackPage(this.page);
  await feedbackPage.navigateViaRequestMenu();
});

Then('I should be on the Feedback page', { timeout: 15000 }, async function () {
  logger.info('Verifying on Feedback page');
  await feedbackPage.waitForPageLoad();
  const isOnPage = await feedbackPage.isOnFeedbackPage();
  expect(isOnPage).toBeTruthy();
});

// Form Filling Steps
When('I fill feedback subject with {string}', { timeout: 10000 }, async function (subject: string) {
  const actualSubject = replacePlaceholders(subject);
  logger.info(`Filling subject: ${actualSubject}`);
  await feedbackPage.fillSubject(actualSubject);
});

When('I select feedback category {string}', { timeout: 10000 }, async function (category: string) {
  const actualCategory = replacePlaceholders(category);
  logger.info(`Selecting category: ${actualCategory}`);
  await feedbackPage.selectCategory(actualCategory);
});

When('I fill feedback message with {string}', { timeout: 10000 }, async function (message: string) {
  const actualMessage = replacePlaceholders(message);
  logger.info('Filling feedback message');
  await feedbackPage.fillMessage(actualMessage);
});

When('I fill feedback email with {string}', { timeout: 10000 }, async function (email: string) {
  const actualEmail = replacePlaceholders(email);
  logger.info(`Filling email: ${actualEmail}`);
  await feedbackPage.fillEmail(actualEmail);
});

When('I fill feedback name with {string}', { timeout: 10000 }, async function (name: string) {
  const actualName = replacePlaceholders(name);
  logger.info(`Filling name: ${actualName}`);
  await feedbackPage.fillName(actualName);
});

When('I fill feedback phone with {string}', { timeout: 10000 }, async function (phone: string) {
  const actualPhone = replacePlaceholders(phone);
  logger.info(`Filling phone: ${actualPhone}`);
  await feedbackPage.fillPhone(actualPhone);
});

When('I set feedback rating to {int}', { timeout: 10000 }, async function (rating: number) {
  logger.info(`Setting rating: ${rating}`);
  await feedbackPage.setRating(rating);
});

When('I fill feedback form with following details:', { timeout: 30000 }, async function (dataTable: DataTable) {
  logger.info('Filling feedback form with data table');
  const rawData = dataTable.rowsHash() as Record<string, string>;
  const feedbackData = replacePlaceholdersInObject(rawData) as Record<string, string>;

  const data: FeedbackData = {
    subject: feedbackData['subject'] || feedbackData['Subject'],
    category: feedbackData['category'] || feedbackData['Category'],
    message: feedbackData['message'] || feedbackData['Message'] || '',
    email: feedbackData['email'] || feedbackData['Email'],
    name: feedbackData['name'] || feedbackData['Name'],
    phone: feedbackData['phone'] || feedbackData['Phone'],
    rating: feedbackData['rating'] ? parseInt(feedbackData['rating']) : undefined,
  };

  await feedbackPage.fillFeedbackForm(data);
});

// Submit Steps
Then('the feedback submit button should be visible', { timeout: 10000 }, async function () {
  logger.info('Verifying submit button is visible');
  const isEnabled = await feedbackPage.isSubmitButtonEnabled();
  expect(isEnabled).toBeTruthy();
});

Then('the feedback submit button should be enabled', { timeout: 10000 }, async function () {
  logger.info('Verifying submit button is enabled');
  const isEnabled = await feedbackPage.isSubmitButtonEnabled();
  expect(isEnabled).toBeTruthy();
});

When('I click the feedback submit button', { timeout: 15000 }, async function () {
  logger.info('Clicking submit button');
  await feedbackPage.clickSubmitButton();
});

// Verification Steps
Then('the feedback should be submitted successfully', { timeout: 20000 }, async function () {
  logger.info('Verifying feedback submission success');
  const isSuccess = await feedbackPage.waitForSuccessMessage();
  expect(isSuccess).toBeTruthy();
});

Then('I should see feedback success message', { timeout: 15000 }, async function () {
  logger.info('Verifying success message is displayed');
  const isSuccess = await feedbackPage.waitForSuccessMessage();
  expect(isSuccess).toBeTruthy();
});

Then('I should see feedback success message containing {string}', { timeout: 15000 }, async function (expectedText: string) {
  const actualExpectedText = replacePlaceholders(expectedText);
  logger.info(`Verifying success message contains: ${actualExpectedText}`);
  const isSuccess = await feedbackPage.waitForSuccessMessage();
  expect(isSuccess).toBeTruthy();

  const successText = await feedbackPage.getSuccessMessageText();
  if (successText) {
    expect(successText.toLowerCase()).toContain(actualExpectedText.toLowerCase());
  }
});

When('I close the feedback success dialog', { timeout: 10000 }, async function () {
  logger.info('Closing success dialog');
  await feedbackPage.closeSuccessDialog();
});

// Error Steps
Then('I should see feedback error message', { timeout: 10000 }, async function () {
  logger.info('Verifying error message is displayed');
  const errorMessage = await feedbackPage.getErrorMessage();
  expect(errorMessage).toBeTruthy();
});

// Cancel Steps
When('I click the feedback cancel button', { timeout: 10000 }, async function () {
  logger.info('Clicking cancel button');
  await feedbackPage.clickCancelButton();
});

// Combined Flow Step
When('I submit feedback with following details:', { timeout: 60000 }, async function (dataTable: DataTable) {
  logger.info('Submitting feedback with data table');
  feedbackPage = new FeedbackPage(this.page);

  const rawData = dataTable.rowsHash() as Record<string, string>;
  const feedbackData = replacePlaceholdersInObject(rawData) as Record<string, string>;

  const data: FeedbackData = {
    subject: feedbackData['subject'] || feedbackData['Subject'],
    category: feedbackData['category'] || feedbackData['Category'],
    message: feedbackData['message'] || feedbackData['Message'] || '',
    email: feedbackData['email'] || feedbackData['Email'],
    name: feedbackData['name'] || feedbackData['Name'],
    phone: feedbackData['phone'] || feedbackData['Phone'],
    rating: feedbackData['rating'] ? parseInt(feedbackData['rating']) : undefined,
  };

  const isSuccess = await feedbackPage.submitFeedback(data);
  expect(isSuccess).toBeTruthy();
});
