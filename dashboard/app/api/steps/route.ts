/**
 * /api/steps
 * API to get available step definitions from src/steps/
 */

import { NextRequest, NextResponse } from 'next/server';
import { scanStepDefinitions, searchSteps, validateStep } from '@/lib/step-scanner';

// Cache step definitions to avoid re-scanning on every request
let cachedSteps: Awaited<ReturnType<typeof scanStepDefinitions>> | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 60000; // 1 minute

async function getSteps() {
    const now = Date.now();
    
    if (!cachedSteps || (now - cacheTime) > CACHE_TTL) {
        cachedSteps = await scanStepDefinitions();
        cacheTime = now;
    }
    
    return cachedSteps;
}

// GET /api/steps - List all available step definitions
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const type = searchParams.get('type'); // Given, When, Then

        const steps = await getSteps();
        
        let filteredSteps = steps;

        // Filter by type if specified
        if (type) {
            filteredSteps = filteredSteps.filter(s => s.type.toLowerCase() === type.toLowerCase());
        }

        // Search if query provided
        if (query) {
            filteredSteps = searchSteps(filteredSteps, query);
        }

        return NextResponse.json({
            steps: filteredSteps,
            total: filteredSteps.length,
            categories: {
                given: steps.filter(s => s.type === 'Given').length,
                when: steps.filter(s => s.type === 'When').length,
                then: steps.filter(s => s.type === 'Then').length
            }
        });
    } catch (error) {
        console.error('Error fetching steps:', error);
        return NextResponse.json(
            { error: 'Failed to fetch step definitions' },
            { status: 500 }
        );
    }
}

// POST /api/steps/validate - Validate a step text
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { step } = body;

        if (!step || typeof step !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid step text' },
                { status: 400 }
            );
        }

        const steps = await getSteps();
        const result = validateStep(steps, step);

        return NextResponse.json({
            valid: result.valid,
            matches: result.matches,
            suggestions: result.suggestions
        });
    } catch (error) {
        console.error('Error validating step:', error);
        return NextResponse.json(
            { error: 'Failed to validate step' },
            { status: 500 }
        );
    }
}
