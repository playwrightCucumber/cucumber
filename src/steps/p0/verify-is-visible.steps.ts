import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { Logger } from '../../utils/Logger.js';

const logger = new Logger('CustomSteps');

Given('I verify the {string} is visible and contains text', async function (param0: string) {
  logger.info('Checking element visibility and content');
  await this.page.waitForSelector(param0);

  logger.info('Verifying element contains expected text');
  const element = await this.page.locator(param0).textContent();
  expect(element).toContain('Expected content text');
});

