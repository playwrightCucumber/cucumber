import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { config } from 'dotenv';
import { Environment, TestRun, TestScenarioResult } from './types';
import { addTestRun } from './storage';

const SCREENSHOTS_DIR = path.join(process.cwd(), '../screenshots');
const REPORTS_DIR = path.join(process.cwd(), '../reports');
// Project root directory (parent of dashboard)
const PROJECT_ROOT = path.join(process.cwd(), '..');

// Store active test runs
const activeRuns = new Map<string, {
  process: ChildProcess;
  status: 'running' | 'stopping';
}>();

// Event listeners for real-time updates
const progressListeners = new Map<string, (data: any) => void>();

export function getActiveRun(runId: string) {
  return activeRuns.get(runId);
}

export function addProgressListener(runId: string, callback: (data: any) => void) {
  progressListeners.set(runId, callback);
}

export function removeProgressListener(runId: string) {
  progressListeners.delete(runId);
}

function emitProgress(runId: string, data: any) {
  const listener = progressListeners.get(runId);
  if (listener) {
    listener(data);
  }
}

async function getAvailableScreenshots(): Promise<string[]> {
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    const files = await fs.readdir(SCREENSHOTS_DIR);
    return files.filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
  } catch {
    return [];
  }
}

async function parseCucumberReport(reportPath: string): Promise<TestScenarioResult[]> {
  try {
    // Wait a bit for the file to be fully written
    await new Promise(resolve => setTimeout(resolve, 500));

    const content = await fs.readFile(reportPath, 'utf-8');
    if (!content || content.trim() === '') {
      console.error('Report file is empty:', reportPath);
      return [];
    }
    const report = JSON.parse(content);

    const results: TestScenarioResult[] = [];

    for (const feature of (report || [])) {
      for (const element of feature.elements || []) {
        const name = element.name || 'Unknown Scenario';
        let status: 'passed' | 'failed' | 'skipped' = 'passed';
        let error: string | undefined;

        for (const step of element.steps || []) {
          if (step.result?.status === 'failed') {
            status = 'failed';
            error = step.result.error_message || 'Step failed';
          } else if (step.result?.status === 'skipped' || step.result?.status === 'pending') {
            status = 'skipped';
          }
        }

        results.push({
          name,
          status,
          error,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error parsing report:', error);
    return [];
  }
}

export async function runTests(
  tags: string[],
  environment: Environment,
  onProgress?: (data: any) => void
): Promise<string> {
  const runId = uuidv4();
  const tagsParam = tags.map(t => `@${t.replace(/^@/, '')}`).join(' and ');

  const run: TestRun = {
    id: runId,
    tags,
    environment,
    status: 'running',
    startedAt: new Date().toISOString(),
    results: [],
    logs: [],
  };

  // Emit started event IMMEDIATELY with runId
  onProgress?.({ type: 'started', runId, run });
  emitProgress(runId, { type: 'started', runId, run });

  // Ensure reports directory exists in project root
  await fs.mkdir(path.join(PROJECT_ROOT, 'reports'), { recursive: true });

  // Build env file path and load environment variables
  const envFile = environment === 'dev' ? '.env.dev'
    : environment === 'map' ? '.env.map'
    : environment === 'staging' ? '.env.chronicle'
    : '.env.chronicle.prod';

  const envFilePath = path.join(PROJECT_ROOT, envFile);

  // Load environment variables from .env file
  const envConfig = config({ path: envFilePath });
  const testEnv = {
    ...process.env,
    ...envConfig,
    HEADLESS: 'true',
    NODE_OPTIONS: '--loader ts-node/esm',
    TEST_RUN_ID: runId,
  };

  // Command to run cucumber (simplified without dotenv-cli)
  const command = `node scripts/check-playwright.js && npx cross-env HEADLESS=true NODE_OPTIONS='--loader ts-node/esm' cucumber-js "src/features/**/*.feature" --import "src/**/*.ts" --tags "${tagsParam}" --format json:reports/${runId}.json`;

  // Run from parent directory (the automation framework root)
  const projectRoot = PROJECT_ROOT;

  console.log('[TestRunner] Starting test with runId:', runId);
  console.log('[TestRunner] Project root:', projectRoot);
  console.log('[TestRunner] Env file:', envFilePath);
  console.log('[TestRunner] Command:', command);

  return new Promise((resolve, reject) => {
    const childProcess = spawn('sh', ['-c', command], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: testEnv,
    });

    console.log('[TestRunner] Process spawned, PID:', childProcess.pid);

    activeRuns.set(runId, { process: childProcess, status: 'running' });

    // Resolve runId IMMEDIATELY so API can respond
    resolve(runId);

    const logs: string[] = [];
    let output = '';

    childProcess.stdout?.on('data', (data) => {
      const text = data.toString();
      console.log('[TestRunner] stdout:', text.substring(0, 200));
      logs.push(text);
      output += text;

      // Parse progress from cucumber output
      const match = text.match(/\((\d+)\/(\d+)\)/);
      if (match) {
        onProgress?.({
          type: 'progress',
          runId,
          current: parseInt(match[1]),
          total: parseInt(match[2]),
        });
      }

      emitProgress(runId, { type: 'log', message: text });
    });

    childProcess.stderr?.on('data', (data) => {
      const text = data.toString();
      console.log('[TestRunner] stderr:', text.substring(0, 200));
      logs.push(text);
      emitProgress(runId, { type: 'error', message: text });
    });

    childProcess.on('close', async (code) => {
      console.log('[TestRunner] Process closed with exit code:', code);
      activeRuns.delete(runId);

      const reportPath = path.join(PROJECT_ROOT, 'reports', runId + '.json');
      console.log('[TestRunner] Reading report from:', reportPath);
      const results = await parseCucumberReport(reportPath);

      // Find screenshots for failed tests
      const screenshots = await getAvailableScreenshots();
      results.forEach(r => {
        if (r.status === 'failed') {
          const matchingScreenshot = screenshots.find(s =>
            s.toLowerCase().includes(r.name.toLowerCase().replace(/\s+/g, '_'))
          );
          if (matchingScreenshot) {
            r.screenshot = '/api/screenshots/' + matchingScreenshot;
          }
        }
      });

      run.status = code === 0 ? 'passed' : 'failed';
      run.completedAt = new Date().toISOString();
      run.results = results;
      run.logs = logs;

      await addTestRun(run);

      onProgress?.({ type: 'completed', run });
      emitProgress(runId, { type: 'completed', run });
      // runId already resolved earlier, no need to resolve again
    });

    childProcess.on('error', (error) => {
      activeRuns.delete(runId);
      run.status = 'failed';
      run.completedAt = new Date().toISOString();
      run.logs.push(error.message);

      onProgress?.({ type: 'error', run, error: error.message });
      emitProgress(runId, { type: 'error', error: error.message });

      reject(error);
    });
  });
}

export async function cancelTestRun(runId: string): Promise<boolean> {
  const activeRun = activeRuns.get(runId);
  if (!activeRun) {
    return false;
  }

  activeRun.status = 'stopping';
  activeRun.process.kill('SIGTERM');

  return true;
}

export async function getAvailableTags(): Promise<string[]> {
  const featuresDir = path.join(PROJECT_ROOT, 'src/features');
  const tags = new Set<string>();

  async function scanDirectory(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        await scanDirectory(path.join(dir, entry.name));
      } else if (entry.name.endsWith('.feature')) {
        const content = await fs.readFile(path.join(dir, entry.name), 'utf-8');
        const matches = content.matchAll(/@(\w+)/g);
        for (const match of matches) {
          tags.add(match[1]);
        }
      }
    }
  }

  try {
    await scanDirectory(featuresDir);
  } catch (error) {
    console.error('Error scanning features:', error);
  }

  return Array.from(tags).sort();
}

export async function getAvailableFeatures(): Promise<Array<{ name: string; tags: string[] }>> {
  const featuresDir = path.join(PROJECT_ROOT, 'src/features');
  const features: Array<{ name: string; tags: string[] }> = [];

  async function scanDirectory(dir: string, basePath = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        await scanDirectory(path.join(dir, entry.name), basePath + entry.name + '/');
      } else if (entry.name.endsWith('.feature')) {
        const content = await fs.readFile(path.join(dir, entry.name), 'utf-8');
        const featureMatch = content.match(/Feature:\s*(.+)/);
        const name = featureMatch ? featureMatch[1].trim() : entry.name;
        const tagsMatch = content.match(/@([\w\s]+)/);
        const tags = tagsMatch ? tagsMatch[1].trim().split(/\s+/) : [];

        features.push({
          name: basePath + name,
          tags,
        });
      }
    }
  }

  try {
    await scanDirectory(featuresDir);
  } catch (error) {
    console.error('Error scanning features:', error);
  }

  return features;
}
