/**
 * /api/scenarios
 * CRUD operations for custom scenarios
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllScenarios, createScenario } from '@/lib/scenario-storage';

// GET /api/scenarios - List all scenarios
export async function GET() {
    try {
        const scenarios = await getAllScenarios();
        return NextResponse.json({
            scenarios,
            total: scenarios.length
        });
    } catch (error) {
        console.error('Error fetching scenarios:', error);
        return NextResponse.json(
            { error: 'Failed to fetch scenarios' },
            { status: 500 }
        );
    }
}

// POST /api/scenarios - Create new scenario
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.name || !body.featureName || !body.steps) {
            return NextResponse.json(
                { error: 'Missing required fields: name, featureName, steps' },
                { status: 400 }
            );
        }

        const scenario = await createScenario({
            name: body.name,
            featureName: body.featureName,
            description: body.description || '',
            priority: body.priority || 'p1',
            accessLevel: body.accessLevel || 'public',
            tags: body.tags || [],
            background: body.background || [],
            steps: body.steps
        });

        return NextResponse.json(scenario, { status: 201 });
    } catch (error) {
        console.error('Error creating scenario:', error);
        return NextResponse.json(
            { error: 'Failed to create scenario' },
            { status: 500 }
        );
    }
}
