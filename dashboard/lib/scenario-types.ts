/**
 * Scenario Builder - Type Definitions
 * Types for custom scenarios created by users
 */

export type Priority = 'p0' | 'p1' | 'p2';
export type AccessLevel = 'public' | 'authenticated';
export type StepKeyword = 'Given' | 'When' | 'Then' | 'And' | 'But';
export type ScenarioType = 'scenario' | 'scenario_outline';

/**
 * A single step in a scenario
 * Can be either action-based (from library) or free-text
 */
export interface ScenarioStep {
    id: string;
    keyword: StepKeyword;
    
    // Action-based step (from ActionLibrary)
    actionId?: string;
    parameters?: Record<string, string>;
    
    // Free-text step (user-defined)
    text?: string;
}

/**
 * Example table for Scenario Outline
 */
export interface ExampleTable {
    headers: string[];
    rows: string[][];
}

/**
 * A scenario within a feature (supports multiple scenarios per feature)
 */
export interface Scenario {
    id: string;
    name: string;
    type: ScenarioType;
    tags: string[]; // Scenario-level tags
    steps: ScenarioStep[];
    
    // For Scenario Outline
    examples?: ExampleTable;
}

/**
 * A feature file with multiple scenarios
 * This is the new enhanced structure that supports full Gherkin flexibility
 */
export interface Feature {
    id: string;
    name: string;
    description?: string;
    priority: Priority;
    accessLevel: AccessLevel;
    tags: string[]; // Feature-level tags
    background?: ScenarioStep[];
    scenarios: Scenario[];
    createdAt: string;
    updatedAt: string;
}

/**
 * Legacy: A custom scenario created by user (single scenario per feature)
 * @deprecated Use Feature type for new scenarios
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
