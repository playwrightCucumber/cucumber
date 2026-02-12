/**
 * Scenario Builder Steps - Step definitions for actions from Scenario Builder
 * These steps correspond to the action library templates
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════

Given('I navigate to {string}', async function (url: string) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
});

Given('I go back', async function () {
    await this.page.goBack();
});

Given('I reload the page', async function () {
    await this.page.reload();
});

// ═══════════════════════════════════════════════════════════════
// INTERACTION
// ═══════════════════════════════════════════════════════════════

When('I click on {string}', async function (selector: string) {
    await this.page.click(selector);
});

When('I double click on {string}', async function (selector: string) {
    await this.page.dblclick(selector);
});

When('I right click on {string}', async function (selector: string) {
    await this.page.click(selector, { button: 'right' });
});

When('I hover over {string}', async function (selector: string) {
    await this.page.hover(selector);
});

// ═══════════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════════

When('I fill {string} into {string}', async function (value: string, selector: string) {
    await this.page.fill(selector, value);
});

When('I clear {string}', async function (selector: string) {
    await this.page.fill(selector, '');
});

When('I type {string} into {string}', async function (value: string, selector: string) {
    await this.page.type(selector, value);
});

When('I select {string} from {string}', async function (value: string, selector: string) {
    await this.page.selectOption(selector, value);
});

When('I check {string}', async function (selector: string) {
    await this.page.check(selector);
});

When('I uncheck {string}', async function (selector: string) {
    await this.page.uncheck(selector);
});

// ═══════════════════════════════════════════════════════════════
// WAIT
// ═══════════════════════════════════════════════════════════════

Then('I wait for {string} to be visible', async function (selector: string) {
    await this.page.waitForSelector(selector, { state: 'visible' });
});

Then('I wait for API {string} to respond', async function (endpoint: string) {
    await this.page.waitForResponse((response: { url: () => string; status: () => number }) =>
        response.url().includes(endpoint) && response.status() === 200
    );
});

Then('I wait for URL to contain {string}', async function (urlPattern: string) {
    await this.page.waitForURL((url: URL) => url.toString().includes(urlPattern));
});

Then('I wait for network to be idle', async function () {
    await this.page.waitForLoadState('networkidle');
});

Then('I wait for {int} seconds', { timeout: 120000 }, async function (seconds: number) {
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
});

// ═══════════════════════════════════════════════════════════════
// ASSERTION
// ═══════════════════════════════════════════════════════════════

Then('I should see {string}', async function (selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
});

Then('I should not see {string}', async function (selector: string) {
    await expect(this.page.locator(selector)).toBeHidden();
});

Then('I should see text {string} in {string}', async function (text: string, selector: string) {
    await expect(this.page.locator(selector)).toContainText(text);
});

Then('the URL should contain {string}', async function (urlPattern: string) {
    await expect(this.page).toHaveURL(new RegExp(urlPattern));
});

Then('{string} should be enabled', async function (selector: string) {
    await expect(this.page.locator(selector)).toBeEnabled();
});

Then('{string} should be disabled', async function (selector: string) {
    await expect(this.page.locator(selector)).toBeDisabled();
});

Then('{string} should have value {string}', async function (selector: string, value: string) {
    await expect(this.page.locator(selector)).toHaveValue(value);
});
