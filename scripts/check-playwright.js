#!/usr/bin/env node

/**
 * Check if Playwright browsers are installed
 * If not, automatically install them
 * 
 * Cross-platform support: Windows, macOS, Linux
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { homedir, platform } from 'os';
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

/**
 * Get Playwright cache directory based on OS
 */
function getPlaywrightCacheDir() {
  const os = platform();
  
  switch (os) {
    case 'win32': // Windows
      return join(homedir(), 'AppData', 'Local', 'ms-playwright');
    case 'darwin': // macOS
      return join(homedir(), 'Library', 'Caches', 'ms-playwright');
    case 'linux': // Linux
      return join(homedir(), '.cache', 'ms-playwright');
    default:
      // Fallback to Linux-style path
      return join(homedir(), '.cache', 'ms-playwright');
  }
}

function checkPlaywrightInstalled() {
  try {
    const cacheDir = getPlaywrightCacheDir();
    
    // Check if cache directory exists
    if (!existsSync(cacheDir)) {
      return false;
    }
    
    // Check if chromium directory exists (primary browser for this project)
    const files = readdirSync(cacheDir);
    const chromiumExists = files.some(file => file.startsWith('chromium-'));
    
    return chromiumExists;
  } catch (error) {
    // If any error occurs, assume not installed
    return false;
  }
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
  const os = platform();
  const osName = os === 'win32' ? 'Windows' : os === 'darwin' ? 'macOS' : 'Linux';
  
  if (!checkPlaywrightInstalled()) {
    log(`\n🖥️  Detected OS: ${osName}`, colors.blue);
    installPlaywright();
  } else {
    log(`✓ Playwright browsers are ready (${osName})`, colors.green);
  }
} catch (error) {
  log(`Error checking Playwright installation: ${error.message}`, colors.red);
  process.exit(1);
}
