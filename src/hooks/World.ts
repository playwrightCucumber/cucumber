import { setWorldConstructor, World } from '@cucumber/cucumber';

/**
 * Custom World class for Cucumber
 * Shares context between step definitions
 */
export class CustomWorld extends World {
  public page: any;
  public browser: any;
  // Add any shared state variables here
  public testData: Map<string, any> = new Map();

  constructor(options: any) {
    super(options);
  }
}

setWorldConstructor(CustomWorld);
