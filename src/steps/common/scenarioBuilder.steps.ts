/**
 * Scenario Builder Steps - Step definitions for actions from Scenario Builder
 * These steps correspond to the action library templates
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { Logger } from '../../utils/Logger.js';

const logger = new Logger('ScenarioBuilder');

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════

Given('I navigate to {string}', async function (url: string) {
    logger.info(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
});

Given('I go back', async function () {
    logger.info('Navigating back');
    await this.page.goBack();
});

Given('I reload the page', async function () {
    logger.info('Reloading page');
    await this.page.reload();
});

// ═══════════════════════════════════════════════════════════════
// INTERACTION
// ═══════════════════════════════════════════════════════════════

When('I click on {string}', async function (selector: string) {
    logger.info(`Clicking on: ${selector}`);
    await this.page.click(selector);
});

When('I double click on {string}', async function (selector: string) {
    logger.info(`Double clicking on: ${selector}`);
    await this.page.dblclick(selector);
});

When('I right click on {string}', async function (selector: string) {
    logger.info(`Right clicking on: ${selector}`);
    await this.page.click(selector, { button: 'right' });
});

When('I hover over {string}', async function (selector: string) {
    logger.info(`Hovering over: ${selector}`);
    await this.page.hover(selector);
});

// ═══════════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════════

When('I fill {string} into {string}', async function (value: string, selector: string) {
    logger.info(`Filling "${value}" into: ${selector}`);
    await this.page.fill(selector, value);
});

When('I clear {string}', async function (selector: string) {
    logger.info(`Clearing: ${selector}`);
    await this.page.fill(selector, '');
});

When('I type {string} into {string}', async function (value: string, selector: string) {
    logger.info(`Typing "${value}" into: ${selector}`);
    await this.page.type(selector, value);
});

When('I select {string} from {string}', async function (value: string, selector: string) {
    logger.info(`Selecting "${value}" from: ${selector}`);
    await this.page.selectOption(selector, value);
});

When('I check {string}', async function (selector: string) {
    logger.info(`Checking: ${selector}`);
    await this.page.check(selector);
});

When('I uncheck {string}', async function (selector: string) {
    logger.info(`Unchecking: ${selector}`);
    await this.page.uncheck(selector);
});

// ═══════════════════════════════════════════════════════════════
// WAIT
// ═══════════════════════════════════════════════════════════════

Then('I wait for {string} to be visible', async function (selector: string) {
    logger.info(`Waiting for element to be visible: ${selector}`);
    await this.page.waitForSelector(selector, { state: 'visible' });
});

Then('I wait for API {string} to respond', async function (endpoint: string) {
    logger.info(`Waiting for API response: ${endpoint}`);
    await this.page.waitForResponse((response: { url: () => string; status: () => number }) =>
        response.url().includes(endpoint) && response.status() === 200
    );
});

Then('I wait for URL to contain {string}', async function (urlPattern: string) {
    logger.info(`Waiting for URL to contain: ${urlPattern}`);
    await this.page.waitForURL((url: URL) => url.toString().includes(urlPattern));
});

Then('I wait for network to be idle', async function () {
    logger.info('Waiting for network to be idle');
    await this.page.waitForLoadState('networkidle');
});

Then('I wait for {int} seconds', async function (seconds: number) {
    logger.info(`Waiting for ${seconds} seconds`);
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
});

// ═══════════════════════════════════════════════════════════════
// ASSERTION
// ═══════════════════════════════════════════════════════════════

Then('I should see {string}', async function (selector: string) {
    logger.info(`Verifying element is visible: ${selector}`);
    await expect(this.page.locator(selector)).toBeVisible();
});

Then('I should not see {string}', async function (selector: string) {
    logger.info(`Verifying element is not visible: ${selector}`);
    await expect(this.page.locator(selector)).toBeHidden();
});

Then('I should see text {string} in {string}', async function (text: string, selector: string) {
    logger.info(`Verifying text "${text}" in: ${selector}`);
    await expect(this.page.locator(selector)).toContainText(text);
});

Then('the URL should contain {string}', async function (urlPattern: string) {
    logger.info(`Verifying URL contains: ${urlPattern}`);
    await expect(this.page).toHaveURL(new RegExp(urlPattern));
});

Then('{string} should be enabled', async function (selector: string) {
    logger.info(`Verifying element is enabled: ${selector}`);
    await expect(this.page.locator(selector)).toBeEnabled();
});

Then('{string} should be disabled', async function (selector: string) {
    logger.info(`Verifying element is disabled: ${selector}`);
    await expect(this.page.locator(selector)).toBeDisabled();
});

Then('{string} should have value {string}', async function (selector: string, value: string) {
    logger.info(`Verifying element has value "${value}": ${selector}`);
    await expect(this.page.locator(selector)).toHaveValue(value);
});
