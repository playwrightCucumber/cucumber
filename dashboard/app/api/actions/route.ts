/**
 * GET /api/actions
 * Returns the complete action library for the Scenario Builder
 */

import { NextResponse } from 'next/server';
import { ACTION_LIBRARY, CATEGORY_INFO, getCategories } from '@/lib/action-library';

export async function GET() {
    try {
        const categories = getCategories().map(category => ({
            id: category,
            ...CATEGORY_INFO[category],
            actions: ACTION_LIBRARY.filter(action => action.category === category)
        }));

        return NextResponse.json({
            categories,
            totalActions: ACTION_LIBRARY.length
        });
    } catch (error) {
        console.error('Error fetching actions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch actions' },
            { status: 500 }
        );
    }
}
