import { NextRequest } from 'next/server';
import { addProgressListener, removeProgressListener, getActiveRun } from '@/lib/test-runner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const runId = searchParams.get('runId');

  if (!runId) {
    return new Response('runId is required', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const listener = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      addProgressListener(runId, listener);

      // Send initial state
      const activeRun = getActiveRun(runId);
      if (activeRun) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', runId })}\n\n`));
      } else {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'not_found' })}\n\n`));
        controller.close();
        return;
      }

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        removeProgressListener(runId);
        controller.close();
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
