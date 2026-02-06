'use client';

import { useEffect, useState, useRef } from 'react';
import { TestRun } from '@/lib/types';

interface TestProgressProps {
  runId: string | null;
  onComplete?: (completedRun?: TestRun) => void;
}

interface ProgressData {
  type: 'started' | 'progress' | 'log' | 'error' | 'completed' | 'not_found' | 'connected';
  current?: number;
  total?: number;
  message?: string;
  run?: TestRun;
}

interface TimelineEntry {
  type: 'scenario' | 'step' | 'result' | 'complete' | 'error';
  content: string;
  timestamp: Date;
}

// Function to cancel test run
async function cancelTestRun(runId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/run-tests/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Parse log message to extract meaningful information
function parseLogMessage(message: string): { type: string; content: string } | null {
  const cleanMessage = message.replace(/\[TestRunner\] (stdout|stderr):\s*/, '');

  const stepMatch = cleanMessage.match(/\[INFO\]\s+\S+\s+-\s+\[(\w+)Steps?\]\s+(.+)/);
  if (stepMatch) {
    return { type: 'step', content: `${stepMatch[1]}: ${stepMatch[2]}` };
  }

  const scenarioMatch = cleanMessage.match(/Starting Scenario:\s+(.+)/);
  if (scenarioMatch) {
    return { type: 'scenario', content: scenarioMatch[1] };
  }

  const resultMatch = cleanMessage.match(/\[SUCCESS\] Scenario (Passed|Failed):\s+(.+)/);
  if (resultMatch) {
    return { type: 'result', content: `${resultMatch[1]}: ${resultMatch[2]}` };
  }

  if (cleanMessage.includes('Test execution completed')) {
    return { type: 'complete', content: 'Test execution completed' };
  }

  if (cleanMessage.trim() === '.') {
    return { type: 'step_progress', content: '.' };
  }

  return null;
}

export function TestProgress({ runId, onComplete }: TestProgressProps) {
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [currentScenario, setCurrentScenario] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [passCount, setPassCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const timelineEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Elapsed time counter
  useEffect(() => {
    if (status !== 'running') return;
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (!runId) {
      setStatus('idle');
      setTimeline([]);
      setCurrentScenario('');
      setCurrentStep('');
      setProgress({ current: 0, total: 0 });
      setError(null);
      setElapsed(0);
      setPassCount(0);
      setFailCount(0);
      return;
    }

    setStatus('running');
    setTimeline([]);
    setCurrentScenario('');
    setCurrentStep('Initializing...');
    setProgress({ current: 0, total: 0 });
    setError(null);
    setElapsed(0);
    setPassCount(0);
    setFailCount(0);

    const eventSource = new EventSource(`/api/run-tests/stream?runId=${runId}`);

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressData = JSON.parse(event.data);

        switch (data.type) {
          case 'connected':
            setCurrentStep('Connected to test runner');
            break;
          case 'not_found':
            setStatus('error');
            setError('Test run not found');
            break;
          case 'progress':
            if (data.current !== undefined && data.total !== undefined) {
              setProgress({ current: data.current, total: data.total });
            }
            break;
          case 'log':
            if (data.message) {
              const parsed = parseLogMessage(data.message);
              if (parsed) {
                if (parsed.type === 'scenario') {
                  setCurrentScenario(parsed.content);
                  setCurrentStep('');
                  setTimeline(prev => [...prev.slice(-30), { type: 'scenario', content: parsed.content, timestamp: new Date() }]);
                } else if (parsed.type === 'step') {
                  setCurrentStep(parsed.content);
                  setTimeline(prev => [...prev.slice(-30), { type: 'step', content: parsed.content, timestamp: new Date() }]);
                } else if (parsed.type === 'result') {
                  const isPassed = parsed.content.startsWith('Passed');
                  if (isPassed) setPassCount(p => p + 1);
                  else setFailCount(f => f + 1);
                  setTimeline(prev => [...prev.slice(-30), { type: 'result', content: parsed.content, timestamp: new Date() }]);
                } else if (parsed.type === 'complete') {
                  setTimeline(prev => [...prev.slice(-30), { type: 'complete', content: parsed.content, timestamp: new Date() }]);
                }
              }
            }
            break;
          case 'error':
            if (data.message) {
              const brief = data.message.split('\n')[0].substring(0, 120);
              setTimeline(prev => [...prev.slice(-30), { type: 'error', content: brief, timestamp: new Date() }]);
            }
            break;
          case 'completed':
            setStatus('completed');
            setCurrentStep('Complete');
            onComplete?.(data.run);
            eventSource.close();
            break;
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [runId, onComplete]);

  // Auto-scroll
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline]);

  if (!runId || status === 'idle') return null;

  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const statusConfig = {
    running: { color: 'text-blue-400', bg: 'bg-blue-500', border: 'border-blue-500/40', label: 'RUNNING' },
    completed: { color: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/40', label: 'COMPLETED' },
    error: { color: 'text-red-400', bg: 'bg-red-500', border: 'border-red-500/40', label: 'ERROR' },
    idle: { color: 'text-zinc-400', bg: 'bg-zinc-500', border: 'border-zinc-600', label: 'IDLE' },
  };

  const cfg = statusConfig[status];

  return (
    <div className={`bg-zinc-800/80 border ${cfg.border} rounded-xl overflow-hidden`}>
      {/* Status Bar */}
      <div className="px-4 py-2 border-b border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status === 'running' ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
          ) : status === 'completed' ? (
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className={`text-xs font-bold uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
          <span className="text-xs text-zinc-400">•</span>
          <span className="text-xs text-zinc-300 font-mono">{formatTime(elapsed)}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mini counters */}
          <div className="flex items-center gap-2 text-xs">
            {passCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-400">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                {passCount}
              </span>
            )}
            {failCount > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                {failCount}
              </span>
            )}
          </div>

          {status === 'running' && (
            <button
              onClick={async () => {
                if (runId && confirm('Stop this test run?')) {
                  const success = await cancelTestRun(runId);
                  if (success) {
                    setStatus('error');
                    setCurrentStep('Cancelled');
                  }
                }
              }}
              className="px-2.5 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md text-xs font-medium transition-all flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Current Info */}
      <div className="px-4 py-2 border-b border-zinc-700/50">
        {currentScenario && (
          <div className="text-xs text-zinc-300 mb-1 truncate">
            📋 {currentScenario}
          </div>
        )}
        <div className={`text-sm font-medium truncate ${status === 'completed' ? 'text-emerald-400' : status === 'error' ? 'text-red-400' : 'text-white'}`}>
          {currentStep || 'Waiting...'}
        </div>
      </div>

      {/* Progress Bar */}
      {progress.total > 0 && (
        <div className="px-4 py-2 border-b border-zinc-700/50">
          <div className="flex items-center justify-between text-xs text-zinc-300 mb-1.5">
            <span>Progress</span>
            <span className="font-mono">{progress.current}/{progress.total} scenarios • {percentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                status === 'completed' ? 'bg-emerald-500' :
                status === 'error' ? 'bg-red-500' :
                'bg-gradient-to-r from-blue-500 to-emerald-500 animate-progress-stripe'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Live Timeline */}
      {timeline.length > 0 && (
        <div className="max-h-40 overflow-y-auto">
          <div className="px-4 py-2 space-y-0.5">
            {timeline.slice(-15).map((entry, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 text-xs py-0.5 ${
                  entry.type === 'scenario' ? 'text-yellow-300 font-medium mt-1' :
                  entry.type === 'result' ? (entry.content.startsWith('Passed') ? 'text-emerald-400' : 'text-red-400 font-medium') :
                  entry.type === 'error' ? 'text-red-400' :
                  entry.type === 'complete' ? 'text-blue-400 font-medium' :
                  'text-zinc-300'
                }`}
              >
                <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{
                  backgroundColor: entry.type === 'scenario' ? '#eab308' :
                    entry.type === 'result' ? (entry.content.startsWith('Passed') ? '#10b981' : '#ef4444') :
                    entry.type === 'error' ? '#ef4444' :
                    entry.type === 'complete' ? '#3b82f6' : '#52525b'
                }} />
                <span className="truncate font-mono">{entry.content}</span>
              </div>
            ))}
            <div ref={timelineEndRef} />
          </div>
        </div>
      )}

      {error && (
        <div className="mx-5 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
