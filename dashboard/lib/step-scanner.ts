/**
 * Step Definition Scanner
 * Scans src/steps/ directory and extracts all Cucumber step definitions
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface StepDefinition {
    pattern: string;          // Original regex pattern
    text: string;             // Human-readable text with {param} placeholders
    type: 'Given' | 'When' | 'Then' | 'And' | 'But';
    file: string;             // Source file path
    parameters: StepParameter[];
    example?: string;         // Example usage
}

export interface StepParameter {
    name: string;
    type: 'string' | 'number' | 'any';
    position: number;
}

const STEP_REGEX = /^(Given|When|Then|And|But)\(['"](.+?)['"]/gm;

/**
 * Parse TypeScript step definition file to extract step patterns
 */
async function parseStepFile(filePath: string): Promise<StepDefinition[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const steps: StepDefinition[] = [];
    const relativePath = path.relative(process.cwd(), filePath);

    // Match all Given/When/Then definitions
    const matches = content.matchAll(STEP_REGEX);

    for (const match of matches) {
        const [, type, pattern] = match;
        
        // Convert Cucumber expression to readable format
        // "I enter email {string}" → "I enter email {email}"
        // "I click on {string}" → "I click on {selector}"
        const params = extractParameters(pattern);
        const text = pattern;

        steps.push({
            pattern,
            text,
            type: type as StepDefinition['type'],
            file: relativePath,
            parameters: params,
            example: generateExample(text, params)
        });
    }

    return steps;
}

/**
 * Extract parameters from Cucumber expression
 */
function extractParameters(pattern: string): StepParameter[] {
    const params: StepParameter[] = [];
    let position = 0;

    // Match {string}, {int}, {float}, etc.
    const paramRegex = /\{(string|int|float|word)\}/g;
    let match;

    while ((match = paramRegex.exec(pattern)) !== null) {
        params.push({
            name: `param${position}`,
            type: match[1] === 'int' || match[1] === 'float' ? 'number' : 'string',
            position
        });
        position++;
    }

    return params;
}

/**
 * Generate example usage for a step
 */
function generateExample(text: string, params: StepParameter[]): string {
    let example = text;
    
    // Replace {string} with example values
    example = example.replace(/\{string\}/g, '"example"');
    example = example.replace(/\{int\}/g, '123');
    example = example.replace(/\{float\}/g, '1.23');
    example = example.replace(/\{word\}/g, 'value');

    return example;
}

/**
 * Recursively scan directory for step files
 */
async function scanDirectory(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            const subFiles = await scanDirectory(fullPath);
            files.push(...subFiles);
        } else if (entry.name.endsWith('.steps.ts')) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Scan all step definition files and return indexed steps
 */
export async function scanStepDefinitions(): Promise<StepDefinition[]> {
    const stepsDir = path.join(process.cwd(), '..', 'src', 'steps');
    
    try {
        // Check if steps directory exists
        await fs.access(stepsDir);
    } catch {
        console.warn(`Steps directory not found: ${stepsDir}`);
        return [];
    }

    const stepFiles = await scanDirectory(stepsDir);
    const allSteps: StepDefinition[] = [];

    for (const file of stepFiles) {
        try {
            const steps = await parseStepFile(file);
            allSteps.push(...steps);
        } catch (error) {
            console.error(`Error parsing ${file}:`, error);
        }
    }

    return allSteps;
}

/**
 * Search steps by text query
 */
export function searchSteps(steps: StepDefinition[], query: string): StepDefinition[] {
    const lowerQuery = query.toLowerCase();
    
    return steps.filter(step => 
        step.text.toLowerCase().includes(lowerQuery) ||
        step.example?.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Validate if a step text matches any known step definition
 */
export function validateStep(steps: StepDefinition[], stepText: string): {
    valid: boolean;
    matches: StepDefinition[];
    suggestions: StepDefinition[];
} {
    // Exact match
    const exactMatches = steps.filter(step => {
        const regex = convertCucumberExpressionToRegex(step.pattern);
        return regex.test(stepText);
    });

    if (exactMatches.length > 0) {
        return { valid: true, matches: exactMatches, suggestions: [] };
    }

    // Fuzzy match for suggestions
    const suggestions = searchSteps(steps, stepText.substring(0, 20)).slice(0, 5);

    return { valid: false, matches: [], suggestions };
}

/**
 * Convert Cucumber expression to regex for matching
 */
function convertCucumberExpressionToRegex(pattern: string): RegExp {
    // Escape special regex characters except {}
    let regex = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Replace {string} with regex group that matches quoted strings
    regex = regex.replace(/\\\{string\\\}/g, '"([^"]*)"');
    regex = regex.replace(/\\\{int\\\}/g, '(\\d+)');
    regex = regex.replace(/\\\{float\\\}/g, '(\\d+\\.\\d+)');
    regex = regex.replace(/\\\{word\\\}/g, '(\\w+)');
    
    return new RegExp(`^${regex}$`, 'i');
}
