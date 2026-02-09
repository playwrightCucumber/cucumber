/**
 * /api/steps/validate
 * Validate step text against known step definitions
 */

import { NextRequest, NextResponse } from 'next/server';
import { scanStepDefinitions, validateStep } from '@/lib/step-scanner';

// Cache step definitions
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
            { error: 'Failed to validate step', details: String(error) },
            { status: 500 }
        );
    }
}
