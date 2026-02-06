import { NextRequest } from 'next/server';
import { addProgressListener, removeProgressListener, getActiveRun } from '@/lib/test-runner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper to wait briefly for a run to appear (handles race condition)
async function waitForActiveRun(runId: string, maxRetries = 10, delayMs = 200): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    if (getActiveRun(runId)) return true;
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return false;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const runId = searchParams.get('runId');

  if (!runId) {
    return new Response('runId is required', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const listener = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream might be closed already
        }
      };

      addProgressListener(runId, listener);

      // Wait for the run to appear (handles module re-compilation race condition)
      const found = await waitForActiveRun(runId);

      if (found) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', runId })}\n\n`));
      } else {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'not_found' })}\n\n`));
        removeProgressListener(runId);
        controller.close();
        return;
      }

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        removeProgressListener(runId);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
