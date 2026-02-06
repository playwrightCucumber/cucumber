import fs from 'fs/promises';
import path from 'path';
import { TestRun, ScheduledRun } from './types';

const DATA_DIR = path.join(process.cwd(), '../data');
const HISTORY_FILE = path.join(DATA_DIR, 'test-history.json');
const SCHEDULES_FILE = path.join(DATA_DIR, 'schedules.json');

export async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Ignore if directory exists
  }
}

export async function getHistory(): Promise<TestRun[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveHistory(history: TestRun[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
}

export async function addTestRun(run: TestRun): Promise<void> {
  const history = await getHistory();
  history.unshift(run);
  // Keep only last 100 runs
  await saveHistory(history.slice(0, 100));
}

export async function clearHistory(): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(HISTORY_FILE, '[]', 'utf-8');
}

export async function getSchedules(): Promise<ScheduledRun[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(SCHEDULES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveSchedules(schedules: ScheduledRun[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(SCHEDULES_FILE, JSON.stringify(schedules, null, 2));
}

export async function addSchedule(schedule: ScheduledRun): Promise<void> {
  const schedules = await getSchedules();
  schedules.push(schedule);
  await saveSchedules(schedules);
}

export async function updateSchedule(id: string, updates: Partial<ScheduledRun>): Promise<void> {
  const schedules = await getSchedules();
  const index = schedules.findIndex(s => s.id === id);
  if (index !== -1) {
    schedules[index] = { ...schedules[index], ...updates };
    await saveSchedules(schedules);
  }
}

export async function deleteSchedule(id: string): Promise<void> {
  const schedules = await getSchedules();
  await saveSchedules(schedules.filter(s => s.id !== id));
}
