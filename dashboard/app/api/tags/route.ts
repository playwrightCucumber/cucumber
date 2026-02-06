import { NextResponse } from 'next/server';
import { getAvailableTags, getAvailableFeatures } from '@/lib/test-runner';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [tags, features] = await Promise.all([
      getAvailableTags(),
      getAvailableFeatures(),
    ]);

    return NextResponse.json({ tags, features });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
