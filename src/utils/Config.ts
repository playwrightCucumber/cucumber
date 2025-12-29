import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Configuration Manager
 * Centralized configuration access
 */
export class Config {
  static get(key: string): string {
    return process.env[key] || '';
  }

  static get baseUrl(): string {
    return this.get('BASE_URL');
  }

  static get browser(): string {
    return this.get('BROWSER');
  }

  static get isHeadless(): boolean {
    return this.get('HEADLESS') === 'true';
  }

  static get timeout(): number {
    return parseInt(this.get('TIMEOUT') || '30000');
  }

  static get username(): string {
    return this.get('USERNAME');
  }

  static get password(): string {
    return this.get('PASSWORD');
  }
}
