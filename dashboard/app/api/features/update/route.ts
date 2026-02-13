import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { parseFeatureFile, featureToGherkin, ParsedScenario } from '@/lib/feature-parser';

export async function POST(request: NextRequest) {
  try {
    const { filePath, scenarioName, updatedScenario } = await request.json();

    if (!filePath || !scenarioName || !updatedScenario) {
      return NextResponse.json(
        { error: 'Missing required fields: filePath, scenarioName, updatedScenario' },
        { status: 400 }
      );
    }

    // Security: Ensure the file path is within the features directory
    const featuresDir = path.join(process.cwd(), '..', 'src', 'features');
    const fullPath = path.join(featuresDir, filePath);
    const normalizedPath = path.normalize(fullPath);

    if (!normalizedPath.startsWith(featuresDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 403 }
      );
    }

    // Read the existing file
    const fileContent = await fs.readFile(normalizedPath, 'utf-8');
    
    // Parse the feature file
    const parsed = parseFeatureFile(fileContent, filePath);

    // Find the scenario to update
    const scenarioIndex = parsed.scenarios.findIndex(
      s => s.name === scenarioName
    );

    if (scenarioIndex === -1) {
      return NextResponse.json(
        { error: `Scenario "${scenarioName}" not found in file` },
        { status: 404 }
      );
    }

    // Update the scenario while preserving type and examples
    const originalScenario = parsed.scenarios[scenarioIndex];
    parsed.scenarios[scenarioIndex] = {
      ...originalScenario,
      name: updatedScenario.name || originalScenario.name,
      tags: updatedScenario.tags || originalScenario.tags,
      steps: updatedScenario.steps || originalScenario.steps,
      // Preserve type and examples from original
      type: originalScenario.type,
      examples: originalScenario.examples,
    };

    // Update feature-level tags if provided
    if (updatedScenario.featureTags) {
      parsed.tags = updatedScenario.featureTags;
    }

    // Convert back to Gherkin
    const updatedContent = featureToGherkin(parsed);

    // Write back to file
    await fs.writeFile(normalizedPath, updatedContent, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Scenario updated successfully',
      filePath,
      scenarioName: updatedScenario.name || scenarioName,
    });

  } catch (error) {
    console.error('Error updating feature file:', error);
    return NextResponse.json(
      { error: 'Failed to update feature file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
