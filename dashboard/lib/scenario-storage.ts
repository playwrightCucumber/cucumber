/**
 * Scenario Storage - File-based storage for custom scenarios
 */

import { promises as fs } from 'fs';
import path from 'path';
import { CustomScenario, SavedElement, ScenarioStorage } from './scenario-types';

const DATA_DIR = path.join(process.cwd(), 'data');
const SCENARIOS_FILE = path.join(DATA_DIR, 'scenarios.json');

/**
 * Ensure data directory exists
 */
async function ensureDataDir(): Promise<void> {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch {
        // Directory already exists
    }
}

/**
 * Read storage file
 */
async function readStorage(): Promise<ScenarioStorage> {
    await ensureDataDir();
    try {
        const content = await fs.readFile(SCENARIOS_FILE, 'utf-8');
        return JSON.parse(content);
    } catch {
        // File doesn't exist or is invalid, return empty storage
        return { scenarios: [], elements: [] };
    }
}

/**
 * Write storage file
 */
async function writeStorage(data: ScenarioStorage): Promise<void> {
    await ensureDataDir();
    await fs.writeFile(SCENARIOS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ═══════════════════════════════════════════════════════════════
// SCENARIO CRUD
// ═══════════════════════════════════════════════════════════════

export async function getAllScenarios(): Promise<CustomScenario[]> {
    const storage = await readStorage();
    return storage.scenarios;
}

export async function getScenarioById(id: string): Promise<CustomScenario | null> {
    const storage = await readStorage();
    return storage.scenarios.find(s => s.id === id) || null;
}

export async function createScenario(scenario: Omit<CustomScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomScenario> {
    const storage = await readStorage();

    const newScenario: CustomScenario = {
        ...scenario,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    storage.scenarios.push(newScenario);
    await writeStorage(storage);

    return newScenario;
}

export async function updateScenario(id: string, updates: Partial<CustomScenario>): Promise<CustomScenario | null> {
    const storage = await readStorage();
    const index = storage.scenarios.findIndex(s => s.id === id);

    if (index === -1) return null;

    storage.scenarios[index] = {
        ...storage.scenarios[index],
        ...updates,
        id, // Ensure ID can't be changed
        updatedAt: new Date().toISOString()
    };

    await writeStorage(storage);
    return storage.scenarios[index];
}

export async function deleteScenario(id: string): Promise<boolean> {
    const storage = await readStorage();
    const index = storage.scenarios.findIndex(s => s.id === id);

    if (index === -1) return false;

    storage.scenarios.splice(index, 1);
    await writeStorage(storage);

    return true;
}

// ═══════════════════════════════════════════════════════════════
// ELEMENT CRUD
// ═══════════════════════════════════════════════════════════════

export async function getAllElements(): Promise<SavedElement[]> {
    const storage = await readStorage();
    return storage.elements;
}

export async function createElement(element: Omit<SavedElement, 'id' | 'createdAt'>): Promise<SavedElement> {
    const storage = await readStorage();

    const newElement: SavedElement = {
        ...element,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
    };

    storage.elements.push(newElement);
    await writeStorage(storage);

    return newElement;
}

export async function deleteElement(id: string): Promise<boolean> {
    const storage = await readStorage();
    const index = storage.elements.findIndex(e => e.id === id);

    if (index === -1) return false;

    storage.elements.splice(index, 1);
    await writeStorage(storage);

    return true;
}
