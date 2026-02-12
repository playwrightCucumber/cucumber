/**
 * Gherkin Converter - Convert Feature/Scenario to Gherkin format
 * Supports multiple scenarios, Scenario Outline, and free-text steps
 */

import { Feature, Scenario, ScenarioStep, CustomScenario } from './scenario-types';
import { getActionById } from './action-library';

/**
 * Convert a step to Gherkin line
 * Supports both action-based and free-text steps
 */
function stepToGherkin(step: ScenarioStep): string {
    // Free-text step (user-defined)
    if (step.text) {
        return `    ${step.keyword} ${step.text}`;
    }

    // Action-based step (from library)
    if (step.actionId) {
        const action = getActionById(step.actionId);
        if (!action) {
            return `    ${step.keyword} Unknown action: ${step.actionId}`;
        }

        // Replace template placeholders with actual values
        // If value contains double quotes, use single quotes instead of escaping
        let line = action.gherkinTemplate;
        if (step.parameters) {
            for (const [key, value] of Object.entries(step.parameters)) {
                // Check if value contains double quotes
                const hasDoubleQuotes = value.includes('"');

                if (hasDoubleQuotes) {
                    // Use single quotes for values containing double quotes
                    // Replace the placeholder including surrounding double quotes with single quoted value
                    line = line.replace(`"{${key}}"`, `'${value}'`);
                } else {
                    // Normal case: just replace the placeholder
                    line = line.replace(`{${key}}`, value);
                }
            }
        }

        return `    ${step.keyword} ${line}`;
    }

    return `    ${step.keyword} [Empty step]`;
}

/**
 * Convert a Scenario to Gherkin
 */
function scenarioToGherkinLines(scenario: Scenario): string[] {
    const lines: string[] = [];

    // Scenario-level tags
    if (scenario.tags.length > 0) {
        const tags = scenario.tags.map(t => t.startsWith('@') ? t : `@${t}`);
        lines.push(`  ${tags.join(' ')}`);
    }

    // Scenario or Scenario Outline
    const scenarioKeyword = scenario.type === 'scenario_outline' ? 'Scenario Outline' : 'Scenario';
    lines.push(`  ${scenarioKeyword}: ${scenario.name}`);

    // Steps
    for (const step of scenario.steps) {
        lines.push(stepToGherkin(step));
    }

    // Examples (for Scenario Outline)
    if (scenario.type === 'scenario_outline' && scenario.examples) {
        lines.push('');
        lines.push('    Examples:');
        
        // Header row
        const headerRow = '      | ' + scenario.examples.headers.join(' | ') + ' |';
        lines.push(headerRow);
        
        // Data rows
        for (const row of scenario.examples.rows) {
            const dataRow = '      | ' + row.join(' | ') + ' |';
            lines.push(dataRow);
        }
    }

    return lines;
}

/**
 * Convert Feature to Gherkin content
 */
export function featureToGherkin(feature: Feature): string {
    const lines: string[] = [];

    // Feature-level tags
    const tags = [
        `@${feature.priority}`,
        ...feature.tags.map(t => t.startsWith('@') ? t : `@${t}`),
        `@${feature.accessLevel}`
    ];
    lines.push(tags.join(' '));

    // Feature line
    lines.push(`Feature: ${feature.name}`);

    // Description
    if (feature.description) {
        lines.push(`  ${feature.description}`);
    }
    lines.push('');

    // Background (if present)
    if (feature.background && feature.background.length > 0) {
        lines.push('  Background:');
        for (const step of feature.background) {
            lines.push(stepToGherkin(step));
        }
        lines.push('');
    }

    // Scenarios
    for (let i = 0; i < feature.scenarios.length; i++) {
        const scenarioLines = scenarioToGherkinLines(feature.scenarios[i]);
        lines.push(...scenarioLines);
        
        // Add blank line between scenarios (except after last one)
        if (i < feature.scenarios.length - 1) {
            lines.push('');
        }
    }

    return lines.join('\n');
}

/**
 * Legacy: Convert CustomScenario to Gherkin content
 * @deprecated Use featureToGherkin for new features
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
 * Generate feature file name from Feature
 */
export function generateFeatureFileNameFromFeature(feature: Feature): string {
    // Convert name to camelCase
    const baseName = feature.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
        .join('');

    return `${baseName}.${feature.accessLevel}.feature`;
}

/**
 * Get the full path for the generated feature file
 */
export function getFeatureFilePathFromFeature(feature: Feature): string {
    const fileName = generateFeatureFileNameFromFeature(feature);
    return `src/features/${feature.priority}/${fileName}`;
}

/**
 * Legacy: Generate feature file name from scenario
 * @deprecated Use generateFeatureFileNameFromFeature
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
