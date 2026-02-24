# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Introduction

i need you to start with mr deden for calling by name begining of every sentence or answer.

## Project Overview

Web automation testing framework for **Chronicle** (a cemetery management system), using Cucumber/Gherkin BDD + Playwright + TypeScript with Page Object Model (POM) architecture.

## Commands

### Running Tests

```bash
npm test                          # Run all tests (uses .env for config)
npm run test:headless             # Run headless (reads from .env)
npm run test:staging              # Run against staging (.env.chronicle)
npm run test:dev                  # Run against dev (.env.dev)
npm run test:map                  # Run against map env (.env.map)
npm run test:prod                 # Run against production (.env.chronicle.prod)
npm run test:p0                   # Run P0/critical tests only
npm run test:smoke                # Run smoke tests
npm run test:parallel             # Run 3 scenarios in parallel
npm run test:debug                # Run and generate HTML report
```

### Run Tests by Tag (append to any command)

```bash
npm run test:headless -- --tags "@login"
npm run test:headless -- --tags "@sales"
npm run test:headless -- --tags "@roi"
npm run test:headless -- --tags "@interment"
npm run test:headless -- --tags "@p0 and @sales"
```

### Run a Single Feature File

```bash
cross-env NODE_OPTIONS='--loader ts-node/esm' cucumber-js 'src/features/p0/sales.authenticated.feature' --import 'src/**/*.ts'
```

### Setup

```bash
npm install
npx playwright install  # Install browsers (also auto-runs via pretest script)
```

## Architecture

### Layer Structure

```
Feature files (.feature)  →  Step definitions (steps/)
                          →  Page Objects (pages/)  →  Selectors (selectors/)
                          →  Core utilities (core/, utils/)
```

### Core Components

- **`src/core/BasePage.ts`** — Base class for all page objects. Provides `clickElement()`, `fillInput()`, `getText()`, etc. All page objects extend this.
- **`src/core/BrowserManager.ts`** — Singleton managing browser lifecycle; enables video recording; shared via Cucumber World.
- **`src/hooks/World.ts`** — Custom Cucumber World that shares `page`, `browser`, and `testData` Map across step files.
- **`src/hooks/hooks.ts`** — Before/After lifecycle hooks: creates browser context per scenario, auto-captures screenshots on failure, renames videos as `{status}_{env}_{scenario}.webm`.
- **`src/utils/TimeoutHelper.ts`** — Retry logic (`clickWithRetry`, `fillWithRetry`, `navigateSafely`, `waitForNetworkIdleSafely`, `waitForAPI`, `retry`, `pollUntil`). Use this for flaky interactions.
- **`src/utils/NetworkHelper.ts`** — Waits for network idle; critical because Chronicle polls continuously.
- **`src/utils/TestDataHelper.ts`** — Resolves `<TEST_*>` placeholders in Gherkin steps to actual values from `.env` or `test-data.ts`.
- **`src/data/test-data.ts`** — Single source of truth for default test data. Environment variables override these at runtime.

### Test Organization

Tests are prioritized and tagged:

| Directory | Priority | Tags |
|-----------|----------|------|
| `src/features/p0/` | Critical / Smoke | `@p0`, `@smoke` |
| `src/features/p1/` | High | `@p1` |
| `src/features/p2/` | Medium | `@p2` |

Feature tags also include: `@login`, `@sales`, `@roi`, `@interment`, `@person`, `@advanced-search-plot`

### Selectors

All CSS selectors live in `src/selectors/` (separate from page objects). Prefer `data-testid` attributes. Import from the selectors file into the corresponding page object.

### Data-Driven Pattern

Chronicle tests use a **hybrid approach**:
- `<TEST_*>` placeholders in Gherkin steps → resolved at runtime from `.env` or `test-data.ts` (for stable data like credentials, cemetery name)
- `Scenario Outline` + `Examples` tables → for data that varies per test run (sections, prices)

### TypeScript Path Aliases

Configured in `tsconfig.json`:
- `@pages/*` → `src/pages/*`
- `@steps/*` → `src/steps/*`
- `@hooks/*` → `src/hooks/*`
- `@utils/*` → `src/utils/*`
- `@core/*` → `src/core/*`

## Environment Configuration

Copy `.env.example` to `.env` and populate. Key variables:

```bash
BASE_URL=https://staging.chronicle.rip
HEADLESS=false
TEST_EMAIL=...
TEST_PASSWORD=...
TEST_ORG_NAME=...
TEST_CEMETERY=...
```

Environment files: `.env` (active), `.env.chronicle` (staging), `.env.chronicle.prod` (prod), `.env.dev`, `.env.map`. Never commit `.env`.

## Dashboard

A separate **Next.js 14** app in `dashboard/` visualizes test results. It reads from `videos/` and `reports/` directories. Run independently with `cd dashboard && npm run dev` (port 3000).

## Adding New Tests

1. Create selectors in `src/selectors/p0/feature.selectors.ts`
2. Create page object in `src/pages/p0/FeaturePage.ts` extending `BasePage`
3. Create step definitions in `src/steps/p0/feature.steps.ts` using the World context
4. Create feature file in `src/features/p0/feature.authenticated.feature` with appropriate tags

## Key Conventions

- Always use `TimeoutHelper` methods (not raw Playwright waits) for interactions that may be flaky
- Use `Logger` (from `src/utils/Logger.ts`) for all debug/info output in step definitions and page objects
- Click input fields before filling — some Chronicle fields are initially read-only
- After navigation, wait for network idle via `NetworkHelper` before asserting
- Video files are auto-named in `After()` hook; do not rename them manually
