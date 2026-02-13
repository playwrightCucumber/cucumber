/**
 * Gherkin Feature File Parser
 * Parses .feature files to extract scenarios, steps, tags, examples, etc.
 */

export interface ParsedStep {
  keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
  text: string;
  line: number;
}

export interface ExampleTable {
  headers: string[];
  rows: string[][];
}

export interface ParsedScenario {
  type: 'Scenario' | 'Scenario Outline';
  name: string;
  tags: string[];
  steps: ParsedStep[];
  examples?: ExampleTable;
  line: number;
}

export interface ParsedBackground {
  steps: ParsedStep[];
  line: number;
}

export interface ParsedFeature {
  name: string;
  description: string[];
  tags: string[];
  background?: ParsedBackground;
  scenarios: ParsedScenario[];
  filePath: string;
}

/**
 * Parse a Gherkin feature file content
 */
export function parseFeatureFile(content: string, filePath: string): ParsedFeature {
  const lines = content.split('\n');
  const feature: ParsedFeature = {
    name: '',
    description: [],
    tags: [],
    background: undefined,
    scenarios: [],
    filePath
  };

  let currentTags: string[] = [];
  let currentSection: 'feature' | 'background' | 'scenario' | 'examples' | null = null;
  let currentScenario: ParsedScenario | null = null;
  let currentBackground: ParsedBackground | null = null;
  let exampleHeaders: string[] = [];
  let exampleRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNumber = i + 1;

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Parse tags (e.g., @smoke @p0)
    if (trimmed.startsWith('@')) {
      const tags = trimmed.split(/\s+/).filter(t => t.startsWith('@'));
      currentTags.push(...tags);
      continue;
    }

    // Parse Feature
    if (trimmed.startsWith('Feature:')) {
      feature.name = trimmed.replace('Feature:', '').trim();
      feature.tags = [...currentTags];
      currentTags = [];
      currentSection = 'feature';
      continue;
    }

    // Feature description (lines after Feature: before Background/Scenario)
    if (currentSection === 'feature' && !trimmed.match(/^(Background|Scenario|Scenario Outline):/)) {
      feature.description.push(trimmed);
      continue;
    }

    // Parse Background
    if (trimmed.startsWith('Background:')) {
      currentBackground = { steps: [], line: lineNumber };
      currentSection = 'background';
      continue;
    }

    // Parse Scenario or Scenario Outline
    if (trimmed.match(/^Scenario( Outline)?:/)) {
      // Save previous scenario if exists
      if (currentScenario) {
        if (exampleHeaders.length > 0) {
          currentScenario.examples = { headers: exampleHeaders, rows: exampleRows };
        }
        feature.scenarios.push(currentScenario);
      }

      const isOutline = trimmed.startsWith('Scenario Outline:');
      const name = trimmed.replace(/^Scenario( Outline)?:/, '').trim();
      
      currentScenario = {
        type: isOutline ? 'Scenario Outline' : 'Scenario',
        name,
        tags: [...currentTags],
        steps: [],
        line: lineNumber
      };
      currentTags = [];
      currentSection = 'scenario';
      exampleHeaders = [];
      exampleRows = [];
      continue;
    }

    // Parse Examples section
    if (trimmed.startsWith('Examples:')) {
      currentSection = 'examples';
      continue;
    }

    // Parse example table
    if (currentSection === 'examples' && trimmed.startsWith('|')) {
      const cells = trimmed
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell);

      if (exampleHeaders.length === 0) {
        exampleHeaders = cells;
      } else {
        exampleRows.push(cells);
      }
      continue;
    }

    // Parse steps (Given, When, Then, And, But)
    const stepMatch = trimmed.match(/^(Given|When|Then|And|But)\s+(.+)$/);
    if (stepMatch) {
      const [, keyword, text] = stepMatch;
      const step: ParsedStep = {
        keyword: keyword as ParsedStep['keyword'],
        text: text.trim(),
        line: lineNumber
      };

      if (currentSection === 'background' && currentBackground) {
        currentBackground.steps.push(step);
      } else if (currentSection === 'scenario' && currentScenario) {
        currentScenario.steps.push(step);
      }
      continue;
    }
  }

  // Save last scenario
  if (currentScenario) {
    if (exampleHeaders.length > 0) {
      currentScenario.examples = { headers: exampleHeaders, rows: exampleRows };
    }
    feature.scenarios.push(currentScenario);
  }

  // Save background
  if (currentBackground && currentBackground.steps.length > 0) {
    feature.background = currentBackground;
  }

  return feature;
}

/**
 * Convert parsed feature back to Gherkin text
 */
export function featureToGherkin(feature: ParsedFeature): string {
  let gherkin = '';

  // Tags
  if (feature.tags.length > 0) {
    gherkin += `${feature.tags.join(' ')}\n`;
  }

  // Feature name
  gherkin += `Feature: ${feature.name}\n`;

  // Description
  if (feature.description.length > 0) {
    feature.description.forEach(line => {
      gherkin += `    ${line}\n`;
    });
  }

  // Background
  if (feature.background) {
    gherkin += `\n    Background:\n`;
    feature.background.steps.forEach(step => {
      gherkin += `        ${step.keyword} ${step.text}\n`;
    });
  }

  // Scenarios
  feature.scenarios.forEach(scenario => {
    gherkin += '\n';

    // Tags
    if (scenario.tags.length > 0) {
      gherkin += `    ${scenario.tags.join(' ')}\n`;
    }

    // Scenario name
    gherkin += `    ${scenario.type}: ${scenario.name}\n`;

    // Steps
    scenario.steps.forEach(step => {
      gherkin += `        ${step.keyword} ${step.text}\n`;
    });

    // Examples (for Scenario Outline)
    if (scenario.examples) {
      gherkin += `\n        Examples:\n`;
      
      // Header
      const headerRow = '| ' + scenario.examples.headers.join(' | ') + ' |';
      gherkin += `            ${headerRow}\n`;

      // Data rows
      scenario.examples.rows.forEach(row => {
        const dataRow = '| ' + row.join(' | ') + ' |';
        gherkin += `            ${dataRow}\n`;
      });
    }
  });

  return gherkin;
}

/**
 * Extract all unique tags from a feature
 */
export function extractTags(feature: ParsedFeature): string[] {
  const tags = new Set<string>();
  
  feature.tags.forEach(tag => tags.add(tag));
  feature.scenarios.forEach(scenario => {
    scenario.tags.forEach(tag => tags.add(tag));
  });

  return Array.from(tags).sort();
}

/**
 * Count total steps in a feature (including background)
 */
export function countSteps(feature: ParsedFeature): number {
  let count = 0;
  
  if (feature.background) {
    count += feature.background.steps.length;
  }

  feature.scenarios.forEach(scenario => {
    count += scenario.steps.length;
  });

  return count;
}
