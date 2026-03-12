import { When, Then } from '@cucumber/cucumber';
import { IntermentPage } from '../../pages/p0/IntermentPage.js';
import { replacePlaceholdersInObject, replacePlaceholders } from '../../utils/TestDataHelper.js';

// Initialize page object - Reset for each scenario
let intermentPage: IntermentPage;

When('I click Add Interment button', async function () {
  const page = this.page;
  intermentPage = new IntermentPage(page);
  await intermentPage.clickAddIntermentButton();
});

When('I fill interment form with following details', async function (dataTable: any) {
  const intermentData = dataTable.rowsHash(); // For vertical tables with key-value pairs
  const actualData = replacePlaceholdersInObject(intermentData);
  await intermentPage.fillIntermentForm(actualData as any);
});

When('I save the Interment', async function () {
  await intermentPage.saveInterment();
});

Then('I should see deceased {string} in the Interment tab', async function (deceasedName: string) {
  const actualName = replacePlaceholders(deceasedName);
  await intermentPage.verifyDeceasedInTab(actualName);
});

Then('I should see interment type {string}', async function (intermentType: string) {
  const actualType = replacePlaceholders(intermentType);
  await intermentPage.verifyIntermentType(actualType);
});

When('I add interment applicant', async function () {
  await intermentPage.addIntermentApplicant();
});

When('I add next of kin', async function () {
  await intermentPage.addNextOfKin();
});

When('I click on Interments tab', async function () {
  const page = this.page;
  // Always create a new instance to ensure we have the current page
  intermentPage = new IntermentPage(page);
  await intermentPage.clickIntermentTab();
});

When('I click Edit Interment button', async function () {
  await intermentPage.clickEditIntermentButton();
});

When('I update interment form with following details', async function (dataTable: any) {
  console.log('========== UPDATE INTERMENT STEP START ==========');
  const intermentData = dataTable.rowsHash();
  console.log('Raw data from feature file:', JSON.stringify(intermentData, null, 2));
  const actualData = replacePlaceholdersInObject(intermentData);
  console.log('Data after placeholder replacement:', JSON.stringify(actualData, null, 2));
  console.log('========== UPDATE INTERMENT STEP END ==========');
  await intermentPage.updateIntermentForm(actualData as any);
});
