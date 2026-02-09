/**
 * POST /api/scenarios/[id]/generate
 * Generate .feature file from scenario
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getScenarioById } from '@/lib/scenario-storage';
import { scenarioToGherkin, getFeatureFilePath } from '@/lib/gherkin-converter';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/scenarios/:id/generate - Generate feature file
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const scenario = await getScenarioById(id);

        if (!scenario) {
            return NextResponse.json(
                { error: 'Scenario not found' },
                { status: 404 }
            );
        }

        // Generate Gherkin content
        const gherkinContent = scenarioToGherkin(scenario);
        const relativePath = getFeatureFilePath(scenario);

        // Full path relative to project root (parent of dashboard)
        const projectRoot = path.join(process.cwd(), '..');
        const fullPath = path.join(projectRoot, relativePath);

        // Ensure directory exists
        await fs.mkdir(path.dirname(fullPath), { recursive: true });

        // Write file
        await fs.writeFile(fullPath, gherkinContent, 'utf-8');

        return NextResponse.json({
            success: true,
            filePath: relativePath,
            gherkinContent
        });
    } catch (error) {
        console.error('Error generating feature file:', error);
        return NextResponse.json(
            { error: 'Failed to generate feature file' },
            { status: 500 }
        );
    }
}

// GET /api/scenarios/:id/generate - Preview Gherkin without saving
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const scenario = await getScenarioById(id);

        if (!scenario) {
            return NextResponse.json(
                { error: 'Scenario not found' },
                { status: 404 }
            );
        }

        const gherkinContent = scenarioToGherkin(scenario);
        const relativePath = getFeatureFilePath(scenario);

        return NextResponse.json({
            filePath: relativePath,
            gherkinContent
        });
    } catch (error) {
        console.error('Error previewing feature file:', error);
        return NextResponse.json(
            { error: 'Failed to preview feature file' },
            { status: 500 }
        );
    }
}
