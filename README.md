# Chronicle Web Automation Framework

A web automation framework for Chronicle using Playwright, Cucumber, and TypeScript with real test scenarios against staging.chronicle.rip.

## ⚠️ Known Issues

**Add ROI Bug in Staging** (Dec 28, 2025): The "Add ROI" button on plot detail pages does not navigate to the form. See [BUG-REPORT.md](BUG-REPORT.md) for details. Screenshot evidence available in `screenshots/` directory.

## 📁 Project Structure

```
automation_web/
├── src/
│   ├── core/              # Core framework components
│   │   ├── BasePage.ts
│   │   └── BrowserManager.ts
│   ├── features/          # Feature files organized by priority
│   │   ├── p0/           # P0 - Critical test scenarios (Smoke tests)
│   │   │   └── login.feature
│   │   ├── p1/           # P1 - High priority test scenarios
│   │   └── p2/           # P2 - Medium priority test scenarios
│   ├── pages/            # Page Object Models organized by priority
│   │   ├── p0/
│   │   │   └── LoginPage.ts
│   │   ├── p1/
│   │   └── p2/
│   ├── steps/            # Step definitions organized by priority
│   │   ├── p0/
│   │   │   └── login.steps.ts
│   │   ├── p1/
│   │   └── p2/
│   ├── selectors/        # CSS selectors organized by priority
│   │   ├── p0/
│   │   │   └── login.selectors.ts
│   │   ├── p1/
│   │   └── p2/
│   ├── hooks/            # Cucumber hooks
│   │   ├── hooks.ts
│   │   └── World.ts
│   └── utils/            # Utility functions
│       └── Logger.ts
├── cucumber.js           # Cucumber configuration
├── package.json
└── tsconfig.json
```

## 🎯 Priority Classification

- **P0**: Critical functionality, must pass for every release (smoke tests)
  - Example: Login, Core user flows
- **P1**: High priority features, important business functionality
  - Example: Key features, Common user scenarios
- **P2**: Medium priority features, secondary functionality
  - Example: Edge cases, Nice-to-have features

## 🌐 Test Environment

- **Target URL**: https://staging.chronicle.rip
- **Test Organization**: Astana Tegal Gundul
- **Test Credentials**:
  - Email: `faris+astanaorg@chronicle.rip`
  - Password: `12345`

## 🎯 Element Selectors

All CSS selectors are organized in separate files under `src/selectors/` directory for better maintainability and reusability.

### Login Page Selectors (`src/selectors/p0/login.selectors.ts`)
- Email input: `[data-testid="login-mat-form-field-input-mat-input-element"]`
- Password input: `[data-testid="login-mat-form-field-input-password"]`
- Login button: `[data-testid="login-login-screen-button-mat-focus-indicator"]`
- Hide password button: `[data-testid="login-button-hide-password"]`

### Why Separate Selectors?
✅ **Reusability**: Share selectors across multiple page objects  
✅ **Maintainability**: Update selectors in one place when UI changes  
✅ **Readability**: Page objects focus on logic, not selector details  
✅ **Documentation**: Selectors are self-documenting with comments  

See [src/selectors/README.md](src/selectors/README.md) for more details.

3. **Failed login with empty credentials**
   - Login dengan field kosong

4. **Successful logout**
   - Test flow login dan logout

5. **Scenario Outline: Login with different credentials**
   - Test multiple scenarios sekaligus

## 🎯 Selector Strategy

Framework menggunakan `data-testid` selectors untuk stability:

```typescript
// Example dari ChronicleLoginPage.ts
this.emailInput = page.locator('[data-testid="login-email-input"]');
this.passwordInput = page.locator('[data-testid="login-password-input"]');
this.loginButton = page.locator('[data-testid="login-submit-button"]');
```

Contoh dari requirement:
```typescript
this.cemeteryName = page.locator('[data-testid="perfect-scrollbar-h3-cemetery-name"]');
```

## 📊 Reports

Setelah test run selesai, reports akan di-generate:

- **HTML Report**: `cucumber-report.html`
- **JSON Report**: `cucumber-report.json`
- **Screenshots**: `screenshots/` (jika test gagal)
- **Videos**: `videos/` (rekam test execution)

## 🔧 Configuration

## 🚀 Running Tests
```bash
 npm run test:headless -- --tags "@p0"
```

### Run all tests
```bash
npm test
```

### Run tests by priority
```bash
npm run test:p0   # Run P0 critical tests (smoke tests)
npm run test:p1   # Run P1 high priority tests
npm run test:p2   # Run P2 medium priority tests
```

### Run tests by tag
```bash
npm run test:login    # Run all login tests
npm run test:smoke    # Run smoke tests
```

### Run tests in parallel
```bash
npm run test:parallel
```

### Run with HTML report
```bash
npm run test:debug
```

## 📝 Available Test Scenarios

### P0 - Login Tests

1. **Successful login with valid credentials** (@p0 @login @smoke)
   - Verify user can login with valid credentials
   - Verify organization name is displayed: "astana tegal gundul"
   - Verify user email is displayed: "faris+astanaorg@chronicle.rip"

2. **Login with invalid credentials** (@p0 @login @negative)
   - Verify error message is shown for invalid credentials

3. **Login with empty email** (@p0 @login @negative)
   - Verify login button is disabled when email is empty

4. **Login with empty password** (@p0 @login @negative)
   - Verify login button is disabled when password is empty

## 🔧 Development Guide

### Adding New Tests

1. **Create feature file** in appropriate priority folder:
   ```
   src/features/p0/new-feature.feature
   ```

2. **Create selectors file** with real data-testid selectors:
   ```typescript
   // src/selectors/p0/new-feature.selectors.ts
   export const NewFeatureSelectors = {
     element: '[data-testid="real-testid-from-staging"]'
   } as const;
   ```

3. **Create page object** that imports selectors:
   ```typescript
   // src/pages/p0/NewFeaturePage.ts
   import { NewFeatureSelectors } from '../../selectors/p0/new-feature.selectors';
   
   export class NewFeaturePage {
     async clickElement() {
       await this.page.locator(NewFeatureSelectors.element).click();
     }
   }
   ```

4. **Create step definitions**:
   ```typescript
   // src/steps/p0/new-feature.steps.ts
   import { Given, When, Then } from '@cucumber/cucumber';
   import { NewFeaturePage } from '../../pages/p0/NewFeaturePage';
   ```

### Best Practices

- ✅ Always use real `data-testid` selectors from staging environment
- ✅ Click on input fields before filling (they may be readonly initially)
- ✅ Wait for network idle after navigation
- ✅ Use proper logging for debugging
- ✅ Organize tests by priority (p0, p1, p2)
- ✅ Tag scenarios appropriately (@smoke, @negative, @login, etc.)
- ✅ Test against real staging environment

### Important Notes

**Input Field Interaction:**
```typescript
// Chronicle inputs are readonly initially, must click first
await page.locator(selector).click();
await page.locator(selector).fill(value);
```

## 📦 Dependencies

- **@playwright/test**: Browser automation
- **@cucumber/cucumber**: BDD framework  
- **TypeScript**: Type-safe code
- **ts-node**: TypeScript execution

## 🏗️ Framework Architecture

### Core Components

- **BasePage**: Base class with common page methods
- **BrowserManager**: Singleton for browser instance management
- **Logger**: Structured logging utility
- **Config**: Environment configuration

### OOP Principles

- **Encapsulation**: Each Page Object encapsulates selectors and methods
- **Inheritance**: All pages extend BasePage
- **Abstraction**: BasePage abstracts Playwright complexity
- **Singleton**: BrowserManager uses singleton pattern

## 📊 Reports

After test execution, check:
- Console output for detailed logs
- `cucumber-report.html` for HTML report
- `cucumber-report.json` for JSON report

## 📚 Examples

See the P0 login implementation:
- **Feature file**: [src/features/p0/login.feature](src/features/p0/login.feature)
- **Selectors**: [src/selectors/p0/login.selectors.ts](src/selectors/p0/login.selectors.ts)
- **Page Object**: [src/pages/p0/LoginPage.ts](src/pages/p0/LoginPage.ts)
- **Step definitions**: [src/steps/p0/login.steps.ts](src/steps/p0/login.steps.ts)

### Example: Using Separated Selectors

**Selectors file** (`src/selectors/p0/login.selectors.ts`):
```typescript
export const LoginSelectors = {
  emailInput: '[data-testid="login-mat-form-field-input-mat-input-element"]',
  passwordInput: '[data-testid="login-mat-form-field-input-password"]',
  loginButton: '[data-testid="login-login-screen-button-mat-focus-indicator"]',
} as const;
```

**Page Object** (`src/pages/p0/LoginPage.ts`):
```typescript
import { LoginSelectors } from '../../selectors/p0/login.selectors';

export class LoginPage {
  async enterEmail(email: string) {
    await this.page.locator(LoginSelectors.emailInput).fill(email);
  }
}
```

This approach keeps selectors organized and easy to update when UI changes!
