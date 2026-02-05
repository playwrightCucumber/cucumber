'use client';

import { TestRun } from '@/lib/types';
import { useState } from 'react';

interface TestResultsProps {
  run: TestRun;
}

export function TestResults({ run }: TestResultsProps) {
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set());

  const toggleScenario = (name: string) => {
    setExpandedScenarios(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const passedCount = run.results.filter(r => r.status === 'passed').length;
  const failedCount = run.results.filter(r => r.status === 'failed').length;
  const skippedCount = run.results.filter(r => r.status === 'skipped').length;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Test Results</h3>
            <p className="text-sm text-zinc-400 mt-1">
              {new Date(run.startedAt).toLocaleString()} - {run.tags.map(t => `@${t}`).join(', ')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">{passedCount}</div>
              <div className="text-xs text-zinc-400">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{failedCount}</div>
              <div className="text-xs text-zinc-400">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-zinc-500">{skippedCount}</div>
              <div className="text-xs text-zinc-400">Skipped</div>
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="divide-y divide-zinc-800">
        {run.results.map((result, index) => (
          <div key={index} className="p-4">
            <button
              onClick={() => toggleScenario(result.name)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${
                  result.status === 'passed' ? 'bg-emerald-500' :
                  result.status === 'failed' ? 'bg-red-500' :
                  'bg-zinc-500'
                }`} />
                <span className="text-white font-medium">{result.name}</span>
                {result.duration && (
                  <span className="text-xs text-zinc-500">{result.duration}ms</span>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-zinc-400 transition-transform ${
                  expandedScenarios.has(result.name) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedScenarios.has(result.name) && (
              <div className="mt-4 pl-5 space-y-3">
                {result.error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-400 mb-2">Error</p>
                    <pre className="text-xs text-red-300 whitespace-pre-wrap">{result.error}</pre>
                  </div>
                )}

                {result.screenshot && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-zinc-400">Screenshot</p>
                    <div className="rounded-lg overflow-hidden border border-zinc-700">
                      <img
                        src={result.screenshot}
                        alt={result.name}
                        className="w-full max-h-64 object-contain bg-zinc-950"
                      />
                    </div>
                  </div>
                )}

                {result.status === 'passed' && !result.error && (
                  <p className="text-sm text-emerald-400">This scenario passed successfully.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
