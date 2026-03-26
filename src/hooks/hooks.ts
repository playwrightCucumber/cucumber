import { Before, After, BeforeAll, AfterAll, BeforeStep, setDefaultTimeout } from '@cucumber/cucumber';
import { BrowserManager } from '../core/BrowserManager.js';
import { Logger } from '../utils/Logger.js';
import { NetworkHelper } from '../utils/NetworkHelper.js';
import { RequestThrottler } from '../utils/RequestThrottler.js';
import { BASE_CONFIG } from '../data/test-data.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global Hooks for Cucumber
 * setDefaultTimeout MUST be at module level — inside BeforeAll it does NOT apply to steps/hooks
 */
setDefaultTimeout(120000);

BeforeAll(async function () {
  Logger.info('Starting test execution...');
  Logger.info('Default step timeout set to 120s');

  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    Logger.info('Created screenshots directory');
  }
});

AfterAll(async function () {
  const browserManager = BrowserManager.getInstance();
  await browserManager.closeBrowser();
  Logger.info('Test execution completed');
});

Before(async function (scenario) {
  Logger.info(`\n========================================`);
  Logger.info(`Starting Scenario: ${scenario.pickle.name}`);
  Logger.info(`========================================`);

  // Create fresh context and page for each scenario
  const browserManager = BrowserManager.getInstance();
  await browserManager.closeContext(); // Close previous context if exists
  this.page = await browserManager.createPage(scenario.pickle.name);
  this.scenarioName = scenario.pickle.name;

  // Attach request throttler to prevent Sentry rate limiting
  await RequestThrottler.attach(this.page);
});

/**
 * BeforeStep — ensure previous step's network activity is fully settled
 * before starting the next step. Prevents request spam / Sentry rate limiting.
 */
BeforeStep(async function () {
  if (!this.page || this.page.isClosed()) return;

  try {
    // Wait for any in-flight API requests from the previous step to finish
    await NetworkHelper.waitForApiRequestsComplete(this.page, 5000);
    // Small stabilization gap so the server is not hammered
    await NetworkHelper.waitForStabilization(this.page, { minWait: 200, maxWait: 1000 });
  } catch {
    // Page may have navigated or closed — safe to ignore
  }
});

After({ timeout: 30000 }, async function (scenario) {
  const status = scenario.result?.status.toLowerCase() === 'passed' ? 'PASSED' : 'FAILED';

  // Auto-capture screenshot on failure
  if (status === 'FAILED' && this.page) {
    try {
      // Clean scenario name
      const scenarioName = scenario.pickle.name
        .replace(/[^a-zA-Z0-9\s]/g, '_')
        .replace(/\s+/g, '_')
        .toLowerCase()
        .substring(0, 100);

      const screenshotPath = path.join(process.cwd(), 'screenshots', `FAILED_${scenarioName}.png`);

      // Wait for page to stabilize before taking screenshot
      await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { });
      await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 1000 });

      await this.page.screenshot({
        path: screenshotPath,
        fullPage: true,
        animations: 'disabled' // Disable CSS animations for consistent screenshot
      });
      Logger.info(`Screenshot saved: ${screenshotPath}`);

      // Also log current URL for debugging
      const currentUrl = this.page.url();
      Logger.info(`Current URL at failure: ${currentUrl}`);
    } catch (error) {
      Logger.error(`Failed to capture screenshot: ${error}`);
    }
  }

  // Close page/context after each scenario
  if (this.page) {
    try {
      // Wait a bit before closing to ensure video captures the final state
      await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 2000 });

      const videoPath = await this.page.video()?.path();
      await this.page.close();
      Logger.info('Page closed for scenario');

      // Rename video file with scenario name, environment, and status (NO TIMESTAMP)
      if (videoPath) {
        // Clean scenario name
        const sanitizedName = this.scenarioName
          ? this.scenarioName
            .replace(/[^a-zA-Z0-9\s]/g, '_')
            .replace(/\s+/g, '_')
            .toLowerCase()
            .substring(0, 100)
          : 'test';

        // Get environment from centralized config (single source of truth)
        const env = BASE_CONFIG.environment;

        // Get status prefix
        const statusPrefix = status === 'PASSED' ? 'pass' : 'fail';

        const newVideoPath = path.join(path.dirname(videoPath), `${statusPrefix}_${env}_${sanitizedName}.webm`);

        // Wait a bit for video to finish writing
        await new Promise(resolve => setTimeout(resolve, 500));

        if (fs.existsSync(videoPath)) {
          fs.renameSync(videoPath, newVideoPath);
          Logger.info(`Video saved: ${newVideoPath}`);
        }
      }
    } catch (error) {
      Logger.error(`Failed to close page or rename video: ${error}`);
    }
  }

  if (status === 'PASSED') {
    Logger.success(`Scenario Passed: ${scenario.pickle.name}`);
  } else {
    Logger.error(`Scenario Failed: ${scenario.pickle.name}`);
  }
  Logger.info(`========================================\n`);
});
