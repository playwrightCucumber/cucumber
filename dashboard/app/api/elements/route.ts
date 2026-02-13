/**
 * /api/elements
 * CRUD operations for saved element selectors
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllElements, createElement, deleteElement } from '@/lib/scenario-storage';

// GET /api/elements - List all saved elements
export async function GET() {
    try {
        const elements = await getAllElements();
        return NextResponse.json({
            elements,
            total: elements.length
        });
    } catch (error) {
        console.error('Error fetching elements:', error);
        return NextResponse.json(
            { error: 'Failed to fetch elements' },
            { status: 500 }
        );
    }
}

// POST /api/elements - Save new element
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.name || !body.selector) {
            return NextResponse.json(
                { error: 'Missing required fields: name, selector' },
                { status: 400 }
            );
        }

        const element = await createElement({
            name: body.name,
            selector: body.selector,
            selectorType: body.selectorType || 'css',
            pageUrl: body.pageUrl || '',
            description: body.description || ''
        });

        return NextResponse.json(element, { status: 201 });
    } catch (error) {
        console.error('Error creating element:', error);
        return NextResponse.json(
            { error: 'Failed to create element' },
            { status: 500 }
        );
    }
}

// DELETE /api/elements/:id - Delete element
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Missing element ID' },
                { status: 400 }
            );
        }

        const success = await deleteElement(id);

        if (!success) {
            return NextResponse.json(
                { error: 'Element not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting element:', error);
        return NextResponse.json(
            { error: 'Failed to delete element' },
            { status: 500 }
        );
    }
}
