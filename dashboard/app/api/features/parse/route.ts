/**
 * /api/features/parse
 * Parse a specific .feature file and return structured data
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { parseFeatureFile, extractTags, countSteps } from '@/lib/feature-parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath } = body;

    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid filePath' },
        { status: 400 }
      );
    }

    // Construct full path
    const fullPath = path.join(process.cwd(), '..', 'src', 'features', filePath);

    // Security check: ensure path is within features directory
    const featuresDir = path.join(process.cwd(), '..', 'src', 'features');
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(featuresDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 403 }
      );
    }

    // Read file content
    let content: string;
    try {
      content = await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      return NextResponse.json(
        { error: 'Feature file not found', path: filePath },
        { status: 404 }
      );
    }

    // Parse the feature file
    const parsedFeature = parseFeatureFile(content, filePath);

    // Extract metadata
    const tags = extractTags(parsedFeature);
    const stepCount = countSteps(parsedFeature);

    return NextResponse.json({
      feature: parsedFeature,
      metadata: {
        tags,
        stepCount,
        scenarioCount: parsedFeature.scenarios.length,
        hasBackground: !!parsedFeature.background,
        hasOutlines: parsedFeature.scenarios.some(s => s.type === 'Scenario Outline')
      }
    });
  } catch (error) {
    console.error('Error parsing feature file:', error);
    return NextResponse.json(
      { error: 'Failed to parse feature file', details: String(error) },
      { status: 500 }
    );
  }
}
