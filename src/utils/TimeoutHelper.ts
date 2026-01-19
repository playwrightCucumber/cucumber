import { Page, Locator, Response } from '@playwright/test';
import { Logger } from './Logger.js';

/**
 * TimeoutHelper - Comprehensive utility for handling timeouts and retries
 * Use this class to make your tests more robust against timing issues
 * 
 * @example
 * const helper = new TimeoutHelper(page);
 * await helper.clickWithRetry('button:has-text("SUBMIT")');
 * await helper.navigateSafely('https://example.com');
 */
export class TimeoutHelper {
    private page: Page;
    private logger: Logger;
    private defaultTimeout: number;

    constructor(page: Page, defaultTimeout: number = 30000) {
        this.page = page;
        this.logger = new Logger('TimeoutHelper');
        this.defaultTimeout = defaultTimeout;
    }

    // ============================================
    // NAVIGATION HELPERS
    // ============================================

    /**
     * Navigate to URL with safe timeout handling
     * Uses domcontentloaded (faster) and optional networkidle with fallback
     */
    async navigateSafely(
        url: string,
        options?: { waitForNetworkIdle?: boolean; timeout?: number }
    ): Promise<void> {
        const timeout = options?.timeout || this.defaultTimeout;
        this.logger.info(`Navigating to: ${url}`);

        await this.page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout
        });

        if (options?.waitForNetworkIdle !== false) {
            try {
                await this.page.waitForLoadState('networkidle', { timeout: 15000 });
            } catch {
                this.logger.info('Network idle timeout, page is usable');
            }
        }
    }

    /**
     * Wait for URL to match pattern with timeout
     */
    async waitForURLSafely(
        urlPattern: RegExp | string,
        timeout?: number
    ): Promise<boolean> {
        try {
            await this.page.waitForURL(urlPattern, {
                timeout: timeout || this.defaultTimeout,
                waitUntil: 'domcontentloaded'
            });
            return true;
        } catch {
            this.logger.warn(`URL pattern ${urlPattern} not matched within timeout`);
            return false;
        }
    }

    // ============================================
    // ELEMENT INTERACTION HELPERS
    // ============================================

    /**
     * Wait for element to be visible with timeout
     * Returns the locator if found, null if not
     */
    async waitForElement(
        selector: string,
        options?: { timeout?: number; state?: 'visible' | 'attached' | 'hidden' }
    ): Promise<Locator | null> {
        const locator = this.page.locator(selector).first();
        try {
            await locator.waitFor({
                state: options?.state || 'visible',
                timeout: options?.timeout || this.defaultTimeout
            });
            return locator;
        } catch {
            this.logger.warn(`Element not found: ${selector}`);
            return null;
        }
    }

    /**
     * Click element with retry logic
     */
    async clickWithRetry(
        selector: string,
        options?: { retries?: number; timeout?: number; delay?: number }
    ): Promise<boolean> {
        const retries = options?.retries || 3;
        const timeout = options?.timeout || 10000;
        const delay = options?.delay || 1000;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                this.logger.info(`Click attempt ${attempt}/${retries}: ${selector}`);
                const locator = this.page.locator(selector).first();

                await locator.waitFor({ state: 'visible', timeout });
                await locator.click({ timeout: 5000 });

                this.logger.info(`✓ Click successful: ${selector}`);
                return true;
            } catch (error) {
                this.logger.warn(`Click attempt ${attempt} failed: ${error}`);
                if (attempt < retries) {
                    await this.page.waitForTimeout(delay);
                }
            }
        }

        this.logger.error(`All ${retries} click attempts failed for: ${selector}`);
        return false;
    }

    /**
     * Fill input field with retry and verification
     */
    async fillWithRetry(
        selector: string,
        value: string,
        options?: { retries?: number; timeout?: number; verify?: boolean }
    ): Promise<boolean> {
        const retries = options?.retries || 3;
        const timeout = options?.timeout || 10000;
        const verify = options?.verify !== false;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                this.logger.info(`Fill attempt ${attempt}/${retries}: ${selector}`);
                const locator = this.page.locator(selector).first();

                await locator.waitFor({ state: 'visible', timeout });
                await locator.clear();
                await locator.fill(value);

                if (verify) {
                    const actualValue = await locator.inputValue();
                    if (actualValue !== value) {
                        throw new Error(`Value mismatch: expected "${value}", got "${actualValue}"`);
                    }
                }

                this.logger.info(`✓ Fill successful: ${selector}`);
                return true;
            } catch (error) {
                this.logger.warn(`Fill attempt ${attempt} failed: ${error}`);
                if (attempt < retries) {
                    await this.page.waitForTimeout(500);
                }
            }
        }

        this.logger.error(`All ${retries} fill attempts failed for: ${selector}`);
        return false;
    }

    // ============================================
    // WAIT HELPERS
    // ============================================

    /**
     * Wait for network idle safely (won't hang forever)
     */
    async waitForNetworkIdleSafely(timeout?: number): Promise<boolean> {
        try {
            await this.page.waitForLoadState('networkidle', {
                timeout: timeout || 15000
            });
            return true;
        } catch {
            this.logger.info('Network idle not achieved, continuing...');
            return false;
        }
    }

    /**
     * Wait for specific API response
     */
    async waitForAPI(
        endpoint: string,
        options?: { statusCode?: number; timeout?: number }
    ): Promise<Response | null> {
        const statusCode = options?.statusCode || 200;
        const timeout = options?.timeout || this.defaultTimeout;

        try {
            const response = await this.page.waitForResponse(
                (response) => response.url().includes(endpoint) && response.status() === statusCode,
                { timeout }
            );
            this.logger.info(`✓ API response received: ${endpoint} (${statusCode})`);
            return response;
        } catch {
            this.logger.warn(`API response timeout: ${endpoint}`);
            return null;
        }
    }

    /**
     * Wait for element to contain specific text
     */
    async waitForText(
        selector: string,
        text: string,
        options?: { timeout?: number; exact?: boolean }
    ): Promise<boolean> {
        const timeout = options?.timeout || this.defaultTimeout;
        const exact = options?.exact || false;

        try {
            const locator = exact
                ? this.page.locator(selector).filter({ hasText: text })
                : this.page.locator(selector).filter({ hasText: new RegExp(text, 'i') });

            await locator.waitFor({ state: 'visible', timeout });
            return true;
        } catch {
            this.logger.warn(`Text "${text}" not found in ${selector}`);
            return false;
        }
    }

    // ============================================
    // ADVANCED PATTERNS
    // ============================================

    /**
     * Execute action with timeout race
     * Useful for operations that might hang
     */
    async withTimeout<T>(
        action: () => Promise<T>,
        timeout?: number,
        errorMessage?: string
    ): Promise<T> {
        const ms = timeout || this.defaultTimeout;

        return Promise.race([
            action(),
            new Promise<T>((_, reject) =>
                setTimeout(
                    () => reject(new Error(errorMessage || `Operation timed out after ${ms}ms`)),
                    ms
                )
            )
        ]);
    }

    /**
     * Retry any async action with configurable options
     */
    async retry<T>(
        action: () => Promise<T>,
        options?: {
            retries?: number;
            delay?: number;
            shouldRetry?: (error: Error) => boolean;
            onRetry?: (attempt: number, error: Error) => void;
        }
    ): Promise<T> {
        const retries = options?.retries || 3;
        const delay = options?.delay || 1000;
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await action();
            } catch (error) {
                lastError = error as Error;

                if (options?.shouldRetry && !options.shouldRetry(lastError)) {
                    throw lastError;
                }

                if (options?.onRetry) {
                    options.onRetry(attempt, lastError);
                } else {
                    this.logger.warn(`Attempt ${attempt}/${retries} failed: ${lastError.message}`);
                }

                if (attempt < retries) {
                    await this.page.waitForTimeout(delay);
                }
            }
        }

        throw lastError;
    }

    /**
     * Wait for one of multiple conditions to be true
     */
    async waitForAny(
        conditions: Array<{ name: string; check: () => Promise<boolean> }>,
        timeout?: number
    ): Promise<string | null> {
        const ms = timeout || this.defaultTimeout;
        const startTime = Date.now();

        while (Date.now() - startTime < ms) {
            for (const condition of conditions) {
                try {
                    if (await condition.check()) {
                        this.logger.info(`✓ Condition met: ${condition.name}`);
                        return condition.name;
                    }
                } catch {
                    // Condition check failed, try next
                }
            }
            await this.page.waitForTimeout(500);
        }

        this.logger.warn('No conditions met within timeout');
        return null;
    }

    /**
     * Poll until condition is true or timeout
     */
    async pollUntil(
        condition: () => Promise<boolean>,
        options?: { timeout?: number; interval?: number; description?: string }
    ): Promise<boolean> {
        const timeout = options?.timeout || this.defaultTimeout;
        const interval = options?.interval || 500;
        const description = options?.description || 'condition';
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            try {
                if (await condition()) {
                    this.logger.info(`✓ Poll successful: ${description}`);
                    return true;
                }
            } catch {
                // Condition threw error, keep polling
            }
            await this.page.waitForTimeout(interval);
        }

        this.logger.warn(`Poll timeout: ${description}`);
        return false;
    }
}

// ============================================
// STANDALONE UTILITY FUNCTIONS
// ============================================

/**
 * Create a timeout promise for use with Promise.race
 */
export function createTimeout(ms: number, message?: string): Promise<never> {
    return new Promise((_, reject) =>
        setTimeout(() => reject(new Error(message || `Timeout after ${ms}ms`)), ms)
    );
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for any async function
 */
export async function retryAsync<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            if (i < retries - 1) {
                await sleep(delay);
            }
        }
    }

    throw lastError;
}
