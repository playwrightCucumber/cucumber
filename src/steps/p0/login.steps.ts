import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { LoginPage } from '../../pages/p0/LoginPage.js';
import { Logger } from '../../utils/Logger.js';

const logger = new Logger('LoginSteps');
let loginPage: LoginPage;

Given('I am on the Chronicle login page', { timeout: 30000 }, async function () {
  logger.info('Navigating to Chronicle login page');
  loginPage = new LoginPage(this.page);
  await loginPage.navigate();
});

When('I enter email {string}', async function (email: string) {
  logger.info(`Entering email: ${email}`);
  await loginPage.enterEmail(email);
});

When('I enter password {string}', async function (password: string) {
  logger.info('Entering password');
  await loginPage.enterPassword(password);
});

When('I click the login button', async function () {
  logger.info('Clicking login button');
  await loginPage.clickLoginButton();
});

Then('I should be logged in successfully', { timeout: 60000 }, async function () {
  logger.info('Verifying successful login');
  await loginPage.waitForSuccessfulLogin();
  const isLoggedIn = await loginPage.isLoggedIn();
  expect(isLoggedIn).toBeTruthy();
});

Then('I should see the organization name {string}', { timeout: 10000 }, async function (expectedOrgName: string) {
  logger.info(`Verifying organization name: ${expectedOrgName}`);
  const orgName = await loginPage.getOrganizationName();
  expect(orgName?.toLowerCase()).toContain(expectedOrgName.toLowerCase());
});

Then('I should see my email {string}', { timeout: 10000 }, async function (expectedEmail: string) {
  logger.info(`Verifying user email: ${expectedEmail}`);
  const userEmail = await loginPage.getUserEmail();
  expect(userEmail).toContain(expectedEmail);
});

Then('I should see an error message', async function () {
  logger.info('Verifying error message is displayed');
  const errorMessage = await loginPage.getErrorMessage();
  expect(errorMessage).toBeTruthy();
});

Then('the login button should be disabled', async function () {
  logger.info('Verifying login button is disabled');
  const isEnabled = await loginPage.isLoginButtonEnabled();
  expect(isEnabled).toBeFalsy();
});
