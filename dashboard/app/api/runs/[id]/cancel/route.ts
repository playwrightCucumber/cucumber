import { NextRequest, NextResponse } from 'next/server';
import { cancelTestRun } from '@/lib/test-runner';
import { getHistory } from '@/lib/storage';
import { saveHistory } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cancelled = await cancelTestRun(params.id);

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Run not found or already completed' },
        { status: 404 }
      );
    }

    // Update history
    const history = await getHistory();
    const run = history.find(r => r.id === params.id);
    if (run) {
      run.status = 'cancelled';
      run.completedAt = new Date().toISOString();
      await saveHistory(history);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling run:', error);
    return NextResponse.json(
      { error: 'Failed to cancel run' },
      { status: 500 }
    );
  }
}
