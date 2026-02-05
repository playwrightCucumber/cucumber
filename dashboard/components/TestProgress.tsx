'use client';

import { useEffect, useState, useRef } from 'react';

interface TestProgressProps {
  runId: string | null;
  onComplete?: () => void;
}

interface ProgressData {
  type: 'started' | 'progress' | 'log' | 'error' | 'completed' | 'not_found';
  current?: number;
  total?: number;
  message?: string;
  run?: any;
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
function parseLogMessage(message: string): { type: string; content: string; timestamp?: string } | null {
  // Remove [TestRunner] stdout/stderr prefix if present
  const cleanMessage = message.replace(/\[TestRunner\] (stdout|stderr):\s*/, '');

  // Match patterns like: [INFO] 2026-02-05T07:01:58.608Z - [LoginSteps] Clicking login button
  const stepMatch = cleanMessage.match(/\[INFO\]\s+\S+\s+-\s+\[(\w+)Steps\]\s+(.+)/);
  if (stepMatch) {
    return { type: 'step', content: `[${stepMatch[1]}] ${stepMatch[2]}` };
  }

  // Match scenario start: Starting Scenario: ...
  const scenarioMatch = cleanMessage.match(/Starting Scenario:\s+(.+)/);
  if (scenarioMatch) {
    return { type: 'scenario', content: `📋 Scenario: ${scenarioMatch[1]}` };
  }

  // Match scenario passed/failed
  const resultMatch = cleanMessage.match(/\[SUCCESS\] Scenario (Passed|Failed):\s+(.+)/);
  if (resultMatch) {
    const icon = resultMatch[1] === 'Passed' ? '✅' : '❌';
    return { type: 'result', content: `${icon} ${resultMatch[1]}: ${resultMatch[2]}` };
  }

  // Match test execution completed
  if (cleanMessage.includes('Test execution completed')) {
    return { type: 'complete', content: '🏁 Test execution completed' };
  }

  // Match dots (step completion) - show as progress
  if (cleanMessage.trim() === '.') {
    return { type: 'step_progress', content: '.' };
  }

  return null;
}

export function TestProgress({ runId, onComplete }: TestProgressProps) {
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [parsedLogs, setParsedLogs] = useState<Array<{ type: string; content: string }>>([]);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!runId) {
      setStatus('idle');
      setParsedLogs([]);
      setCurrentStep('');
      setProgress({ current: 0, total: 0 });
      setError(null);
      return;
    }

    setStatus('running');
    setParsedLogs([]);
    setCurrentStep('Initializing test run...');
    setProgress({ current: 0, total: 0 });
    setError(null);

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
            setCurrentStep('Test run not found');
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
                // Skip step_progress (dots) in timeline
                if (parsed.type !== 'step_progress') {
                  setParsedLogs(prev => {
                    // Keep only last 50 logs to prevent memory issues
                    const newLogs = [...prev, parsed];
                    if (newLogs.length > 50) {
                      return newLogs.slice(-50);
                    }
                    return newLogs;
                  });
                }

                // Update current step based on log type
                if (parsed.type === 'scenario' || parsed.type === 'step') {
                  setCurrentStep(parsed.content);
                } else if (parsed.type === 'result') {
                  // Keep the result visible briefly
                  setCurrentStep(parsed.content);
                } else if (parsed.type === 'complete') {
                  setCurrentStep(parsed.content);
                }
              }
            }
            break;
          case 'error':
            if (data.message) {
              // Parse error message to extract step name only
              const errorMatch = data.message.match(/Scenario Failed:\s+(.+)/);
              if (errorMatch) {
                setCurrentStep(`❌ Failed: ${errorMatch[1]}`);
              } else {
                // For other errors, show brief message
                const briefError = data.message.split('\n')[0].substring(0, 100);
                setCurrentStep(`Error: ${briefError}`);
              }
            }
            break;
          case 'completed':
            setStatus('completed');
            setCurrentStep('Test completed!');
            onComplete?.();
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

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [parsedLogs]);

  if (!runId || status === 'idle') {
    return null;
  }

  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          {status === 'completed' ? (
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : status === 'error' ? (
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          Test Progress
        </h3>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${
            status === 'completed' ? 'text-emerald-500' :
            status === 'error' ? 'text-red-500' :
            'text-blue-500'
          }`}>
            {status === 'completed' ? 'Completed' : status === 'error' ? 'Error' : 'Running...'}
          </span>
          {status === 'running' && (
            <button
              onClick={async () => {
                if (runId && confirm('Are you sure you want to stop the test run?')) {
                  const success = await cancelTestRun(runId);
                  if (success) {
                    setCurrentStep('Test cancelled');
                    setStatus('error');
                  } else {
                    alert('Failed to cancel test run');
                  }
                }
              }}
              className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Current Step - Large and prominent */}
      <div className={`${
        status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/30' :
        status === 'error' ? 'bg-red-500/10 border-red-500/30' :
        'bg-blue-500/10 border-blue-500/30'
      } border rounded-lg p-4`}>
        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Current Step</div>
        <div className={`text-base font-medium ${
          status === 'completed' ? 'text-emerald-400' :
          status === 'error' ? 'text-red-400' :
          'text-white'
        }`}>
          {currentStep || 'Waiting...'}
        </div>
      </div>

      {/* Progress Bar */}
      {progress.total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-zinc-400">
            <span>Scenarios</span>
            <span className="font-medium">{progress.current} / {progress.total}</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                status === 'completed' ? 'bg-emerald-500' :
                status === 'error' ? 'bg-red-500' :
                'bg-gradient-to-r from-blue-500 to-emerald-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-right text-sm text-zinc-400">{percentage.toFixed(0)}%</div>
        </div>
      )}

      {/* Timeline of recent activity */}
      {parsedLogs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Activity Timeline
          </h4>
          <div className="bg-zinc-950 rounded-lg p-3 max-h-64 overflow-y-auto space-y-1">
            {parsedLogs.slice(-20).map((log, idx) => (
              <div
                key={idx}
                className={`text-xs font-mono ${
                  log.type === 'scenario' ? 'text-yellow-400 font-medium' :
                  log.type === 'result' ? (log.content.includes('✅') ? 'text-emerald-400' : 'text-red-400') :
                  log.type === 'complete' ? 'text-blue-400 font-medium' :
                  'text-zinc-500'
                }`}
              >
                {log.content}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
