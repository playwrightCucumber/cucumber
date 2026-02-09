/**
 * Scenario Builder - Type Definitions
 * Types for custom scenarios created by users
 */

export type Priority = 'p0' | 'p1' | 'p2';
export type AccessLevel = 'public' | 'authenticated';
export type StepKeyword = 'Given' | 'When' | 'Then' | 'And' | 'But';

/**
 * A single step in a scenario
 */
export interface ScenarioStep {
    id: string;
    actionId: string;
    keyword: StepKeyword;
    parameters: Record<string, string>;
}

/**
 * A custom scenario created by user
 */
export interface CustomScenario {
    id: string;
    name: string;
    featureName: string;
    description?: string;
    priority: Priority;
    accessLevel: AccessLevel;
    tags: string[];
    background?: ScenarioStep[];
    steps: ScenarioStep[];
    createdAt: string;
    updatedAt: string;
}

/**
 * A saved element selector for reuse
 */
export interface SavedElement {
    id: string;
    name: string;
    selector: string;
    selectorType: 'css' | 'testid' | 'role' | 'text';
    pageUrl: string;
    description?: string;
    createdAt: string;
}

/**
 * Scenario storage file structure
 */
export interface ScenarioStorage {
    scenarios: CustomScenario[];
    elements: SavedElement[];
}

/**
 * API response types
 */
export interface ScenarioListResponse {
    scenarios: CustomScenario[];
    total: number;
}

export interface GenerateResultResponse {
    success: boolean;
    filePath?: string;
    gherkinContent?: string;
    error?: string;
}
