import { NextRequest, NextResponse } from 'next/server';
import { runTests } from '@/lib/test-runner';
import { Environment } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tags, environment }: { tags: string[]; environment: Environment } = body;

    if (!tags || tags.length === 0) {
      return NextResponse.json({ error: 'Tags are required' }, { status: 400 });
    }

    if (!environment) {
      return NextResponse.json({ error: 'Environment is required' }, { status: 400 });
    }

    // runTests now returns runId immediately
    // Start tests and get runId - this will resolve quickly with the runId
    const runId = await runTests(tags, environment);

    return NextResponse.json({ runId });
  } catch (error) {
    console.error('Error running tests:', error);
    return NextResponse.json(
      { error: 'Failed to run tests', message: (error as Error).message },
      { status: 500 }
    );
  }
}
