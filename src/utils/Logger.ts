/**
 * Simple Logger Utility
 * Can be used as static or instance method
 */
export class Logger {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  private static getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(message: string): string {
    const contextStr = this.context ? `[${this.context}] ` : '';
    return `${contextStr}${message}`;
  }

  info(message: string): void {
    console.log(`[INFO] ${Logger.getTimestamp()} - ${this.formatMessage(message)}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${Logger.getTimestamp()} - ${this.formatMessage(message)}`);
  }

  warn(message: string): void {
    console.warn(`[WARN] ${Logger.getTimestamp()} - ${this.formatMessage(message)}`);
  }

  debug(message: string): void {
    console.debug(`[DEBUG] ${Logger.getTimestamp()} - ${this.formatMessage(message)}`);
  }

  success(message: string): void {
    console.log(`\x1b[32m[SUCCESS] ${Logger.getTimestamp()} - ${this.formatMessage(message)}\x1b[0m`);
  }

  // Static methods for global usage
  static info(message: string): void {
    console.log(`[INFO] ${this.getTimestamp()} - ${message}`);
  }

  static error(message: string): void {
    console.error(`[ERROR] ${this.getTimestamp()} - ${message}`);
  }

  static warn(message: string): void {
    console.warn(`[WARN] ${this.getTimestamp()} - ${message}`);
  }

  static success(message: string): void {
    console.log(`\x1b[32m[SUCCESS] ${this.getTimestamp()} - ${message}\x1b[0m`);
  }
}
