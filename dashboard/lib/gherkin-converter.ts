/**
 * Gherkin Converter - Convert CustomScenario to Gherkin format
 */

import { CustomScenario, ScenarioStep } from './scenario-types';
import { getActionById } from './action-library';

/**
 * Convert a step to Gherkin line
 */
function stepToGherkin(step: ScenarioStep): string {
    const action = getActionById(step.actionId);
    if (!action) {
        return `    ${step.keyword} Unknown action: ${step.actionId}`;
    }

    // Replace template placeholders with actual values
    let line = action.gherkinTemplate;
    for (const [key, value] of Object.entries(step.parameters)) {
        line = line.replace(`{${key}}`, value);
    }

    return `    ${step.keyword} ${line}`;
}

/**
 * Convert CustomScenario to Gherkin content
 */
export function scenarioToGherkin(scenario: CustomScenario): string {
    const lines: string[] = [];

    // Feature-level tags
    const tags = [
        `@${scenario.priority}`,
        ...scenario.tags.map(t => t.startsWith('@') ? t : `@${t}`),
        `@${scenario.accessLevel}`
    ];
    lines.push(tags.join(' '));

    // Feature line
    lines.push(`Feature: ${scenario.featureName}`);

    // Description
    if (scenario.description) {
        lines.push(`  ${scenario.description}`);
    }
    lines.push('');

    // Background (if present)
    if (scenario.background && scenario.background.length > 0) {
        lines.push('  Background:');
        for (const step of scenario.background) {
            lines.push(stepToGherkin(step));
        }
        lines.push('');
    }

    // Scenario
    lines.push(`  Scenario: ${scenario.name}`);
    for (const step of scenario.steps) {
        lines.push(stepToGherkin(step));
    }

    return lines.join('\n');
}

/**
 * Generate feature file name from scenario
 */
export function generateFeatureFileName(scenario: CustomScenario): string {
    // Convert name to camelCase
    const baseName = scenario.featureName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
        .join('');

    return `${baseName}.${scenario.accessLevel}.feature`;
}

/**
 * Get the full path for the generated feature file
 */
export function getFeatureFilePath(scenario: CustomScenario): string {
    const fileName = generateFeatureFileName(scenario);
    return `src/features/${scenario.priority}/${fileName}`;
}
