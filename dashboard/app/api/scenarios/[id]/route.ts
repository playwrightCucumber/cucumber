/**
 * /api/scenarios/[id]
 * Single scenario operations: GET, PUT, DELETE
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScenarioById, updateScenario, deleteScenario } from '@/lib/scenario-storage';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/scenarios/:id - Get single scenario
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

        return NextResponse.json(scenario);
    } catch (error) {
        console.error('Error fetching scenario:', error);
        return NextResponse.json(
            { error: 'Failed to fetch scenario' },
            { status: 500 }
        );
    }
}

// PUT /api/scenarios/:id - Update scenario
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const scenario = await updateScenario(id, body);

        if (!scenario) {
            return NextResponse.json(
                { error: 'Scenario not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(scenario);
    } catch (error) {
        console.error('Error updating scenario:', error);
        return NextResponse.json(
            { error: 'Failed to update scenario' },
            { status: 500 }
        );
    }
}

// DELETE /api/scenarios/:id - Delete scenario
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const success = await deleteScenario(id);

        if (!success) {
            return NextResponse.json(
                { error: 'Scenario not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting scenario:', error);
        return NextResponse.json(
            { error: 'Failed to delete scenario' },
            { status: 500 }
        );
    }
}
