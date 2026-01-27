#!/usr/bin/env node

/**
 * Check if Playwright browsers are installed
 * If not, automatically install them
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkPlaywrightInstalled() {
  // Check common Playwright browser cache locations
  const cacheDir = join(homedir(), 'Library', 'Caches', 'ms-playwright');
  
  // Check if chromium directory exists (primary browser for this project)
  const chromiumExists = existsSync(cacheDir) && 
    execSync(`ls -d ${cacheDir}/chromium-* 2>/dev/null || true`, { encoding: 'utf8' }).trim();
  
  return !!chromiumExists;
}

function installPlaywright() {
  log('\n╔════════════════════════════════════════════════════════════════╗', colors.yellow);
  log('║  Playwright browsers not found!                                ║', colors.yellow);
  log('║  Installing browsers now... (this may take a few minutes)      ║', colors.yellow);
  log('╚════════════════════════════════════════════════════════════════╝\n', colors.yellow);
  
  try {
    execSync('npx playwright install chromium', { stdio: 'inherit' });
    
    log('\n╔════════════════════════════════════════════════════════════════╗', colors.green);
    log('║  ✓ Playwright browsers installed successfully!                 ║', colors.green);
    log('╚════════════════════════════════════════════════════════════════╝\n', colors.green);
    
    return true;
  } catch (error) {
    log('\n╔════════════════════════════════════════════════════════════════╗', colors.red);
    log('║  ✗ Failed to install Playwright browsers                       ║', colors.red);
    log('║  Please run manually: npx playwright install                   ║', colors.red);
    log('╚════════════════════════════════════════════════════════════════╝\n', colors.red);
    
    process.exit(1);
  }
}

// Main execution
try {
  if (!checkPlaywrightInstalled()) {
    installPlaywright();
  } else {
    log('✓ Playwright browsers are ready', colors.green);
  }
} catch (error) {
  log(`Error checking Playwright installation: ${error.message}`, colors.red);
  process.exit(1);
}
