'use client';

import { TestRun, TestScenarioResult, TestStepResult } from '@/lib/types';
import { useState } from 'react';

interface TestResultsProps {
  run: TestRun;
}

function formatDuration(ms?: number): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

function StepStatusIcon({ status }: { status: TestStepResult['status'] }) {
  switch (status) {
    case 'passed':
      return (
        <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    case 'failed':
      return (
        <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      );
    case 'skipped':
    case 'pending':
      return (
        <svg className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    default:
      return <div className="w-3.5 h-3.5 rounded-full bg-zinc-700 flex-shrink-0" />;
  }
}

function ScenarioCard({ result, index }: { result: TestScenarioResult; index: number }) {
  const [isExpanded, setIsExpanded] = useState(result.status === 'failed');
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  const screenshots = result.screenshots || (result.screenshot ? [result.screenshot] : []);
  const hasMedia = screenshots.length > 0 || !!result.video;

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${
      result.status === 'failed'
        ? 'border-red-500/30 bg-red-500/5'
        : result.status === 'passed'
        ? 'border-zinc-600 bg-zinc-800/60'
        : 'border-zinc-700 bg-zinc-800/40'
    }`}>
      {/* Scenario Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-700/40 transition-colors"
      >
        {/* Status indicator */}
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          result.status === 'passed' ? 'bg-emerald-500/15' :
          result.status === 'failed' ? 'bg-red-500/15' :
          'bg-zinc-700'
        }`}>
          {result.status === 'passed' ? (
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : result.status === 'failed' ? (
            <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Scenario info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">{result.name}</span>
            {hasMedia && (
              <div className="flex items-center gap-1">
                {screenshots.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 bg-zinc-700 text-zinc-300 rounded">📸</span>
                )}
                {result.video && (
                  <span className="text-xs px-1.5 py-0.5 bg-zinc-700 text-zinc-300 rounded">🎬</span>
                )}
              </div>
            )}
          </div>
          {result.featureName && (
            <p className="text-xs text-zinc-400 truncate">{result.featureName}</p>
          )}
          {result.status === 'failed' && result.failedStep && (
            <p className="text-xs text-red-400 mt-0.5 truncate">
              ⚠ Failed at: {result.failedStep}
            </p>
          )}
        </div>

        {/* Duration + expand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono text-zinc-400">{formatDuration(result.duration)}</span>
          <svg
            className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-zinc-700/50">
          {/* Steps */}
          {result.steps && result.steps.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-zinc-300 uppercase tracking-widest mb-2">Steps</p>
              <div className="space-y-0.5">
                {result.steps.map((step, stepIdx) => (
                  <div
                    key={stepIdx}
                    className={`flex items-start gap-2 py-1.5 px-2 rounded ${
                      step.status === 'failed' ? 'bg-red-500/10 border border-red-500/30' : ''
                    }`}
                  >
                    <StepStatusIcon status={step.status} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs">
                        <span className="text-zinc-400 font-medium">{step.keyword}</span>{' '}
                        <span className={step.status === 'failed' ? 'text-red-300' : 'text-zinc-200'}>
                          {step.name}
                        </span>
                      </span>
                      {step.error && (
                        <div className="mt-1.5 bg-red-500/5 border border-red-500/10 rounded p-2">
                          <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono leading-relaxed break-all">
                            {step.error.length > 500 ? step.error.substring(0, 500) + '...' : step.error}
                          </pre>
                        </div>
                      )}
                    </div>
                    {step.duration !== undefined && step.duration > 0 && (
                      <span className="text-xs font-mono text-zinc-400 flex-shrink-0">
                        {formatDuration(step.duration)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error (fallback if no steps) */}
          {result.error && (!result.steps || result.steps.length === 0) && (
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-red-400 uppercase tracking-widest mb-2">Error</p>
              <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-3">
                <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono break-all">
                  {result.error.length > 800 ? result.error.substring(0, 800) + '...' : result.error}
                </pre>
              </div>
            </div>
          )}

          {/* Media: Screenshots + Video */}
          {hasMedia && (
            <div className="px-4 py-3 border-t border-zinc-700/40">
              <div className="flex gap-2 mb-2">
                {screenshots.length > 0 && (
                  <button
                    onClick={() => { setShowScreenshot(!showScreenshot); setShowVideo(false); }}
                    className={`text-xs font-medium px-2.5 py-1.5 rounded transition-all ${
                      showScreenshot ? 'bg-zinc-600 text-white' : 'bg-zinc-700 text-zinc-300 hover:text-white'
                    }`}
                  >
                    📸 Screenshots ({screenshots.length})
                  </button>
                )}
                {result.video && (
                  <button
                    onClick={() => { setShowVideo(!showVideo); setShowScreenshot(false); }}
                    className={`text-xs font-medium px-2.5 py-1.5 rounded transition-all ${
                      showVideo ? 'bg-zinc-600 text-white' : 'bg-zinc-700 text-zinc-300 hover:text-white'
                    }`}
                  >
                    🎬 Video
                  </button>
                )}
              </div>

              {/* Screenshot viewer */}
              {showScreenshot && screenshots.length > 0 && (
                <div className="space-y-2">
                  <div className="rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900">
                    <img
                      src={screenshots[activeScreenshot]}
                      alt={`Screenshot ${activeScreenshot + 1}`}
                      className="w-full max-h-80 object-contain"
                      loading="lazy"
                    />
                  </div>
                  {screenshots.length > 1 && (
                    <div className="flex items-center gap-2 justify-center">
                      <button
                        onClick={() => setActiveScreenshot(Math.max(0, activeScreenshot - 1))}
                        disabled={activeScreenshot === 0}
                        className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-xs text-zinc-300">{activeScreenshot + 1} / {screenshots.length}</span>
                      <button
                        onClick={() => setActiveScreenshot(Math.min(screenshots.length - 1, activeScreenshot + 1))}
                        disabled={activeScreenshot === screenshots.length - 1}
                        className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Video player */}
              {showVideo && result.video && (
                <div className="rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900">
                  <video
                    src={result.video}
                    controls
                    className="w-full max-h-80"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
            </div>
          )}

          {/* Passed scenario with no extra info */}
          {result.status === 'passed' && !result.error && (!result.steps || result.steps.length === 0) && !hasMedia && (
            <div className="px-4 py-3">
              <p className="text-xs text-emerald-400/60">✓ Scenario completed successfully</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TestResults({ run }: TestResultsProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed' | 'skipped'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandAll, setExpandAll] = useState(false);

  const passedCount = run.results.filter(r => r.status === 'passed').length;
  const failedCount = run.results.filter(r => r.status === 'failed').length;
  const skippedCount = run.results.filter(r => r.status === 'skipped').length;
  const totalDuration = run.duration || run.results.reduce((sum, r) => sum + (r.duration || 0), 0);

  const filteredResults = run.results.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch = !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Summary Header */}
      <div className="px-5 py-3 border-b border-zinc-700">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Test Results</h3>
            <p className="text-xs text-zinc-400">
              {new Date(run.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' · '}
              {new Date(run.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              {' · '}
              {run.tags.map(t => `@${t}`).join(' ')}
            </p>
          </div>
          <div className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
            run.status === 'passed' ? 'bg-emerald-500/10 text-emerald-400' :
            run.status === 'failed' ? 'bg-red-500/10 text-red-400' :
            'bg-zinc-800 text-zinc-400'
          }`}>
            {run.status}
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-zinc-700/50 rounded-lg px-2.5 py-1.5 text-center">
            <p className="text-base font-bold text-white">{run.results.length}</p>
            <p className="text-[10px] text-zinc-400 uppercase">Total</p>
          </div>
          <div className="bg-emerald-500/10 rounded-lg px-2.5 py-1.5 text-center border border-emerald-500/20">
            <p className="text-base font-bold text-emerald-400">{passedCount}</p>
            <p className="text-[10px] text-emerald-400/70 uppercase">Passed</p>
          </div>
          <div className={`rounded-lg px-2.5 py-1.5 text-center border ${failedCount > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-zinc-700/50 border-transparent'}`}>
            <p className={`text-base font-bold ${failedCount > 0 ? 'text-red-400' : 'text-zinc-500'}`}>{failedCount}</p>
            <p className={`text-[10px] uppercase ${failedCount > 0 ? 'text-red-400/70' : 'text-zinc-500'}`}>Failed</p>
          </div>
          <div className="bg-zinc-700/50 rounded-lg px-2.5 py-1.5 text-center">
            <p className="text-base font-bold text-zinc-200">{formatDuration(totalDuration)}</p>
            <p className="text-[10px] text-zinc-400 uppercase">Duration</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-5 py-2.5 border-b border-zinc-700/50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar mask-gradient-r">
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
              <svg className="w-3.5 h-3.5 text-zinc-500 group-focus-within:text-zinc-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900/50 border border-zinc-700/50 text-zinc-200 text-xs rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 w-48 placeholder-zinc-600 transition-all shadow-sm"
            />
          </div>

          <div className="h-4 w-px bg-zinc-700/50 mx-1"></div>

          {(['all', 'failed', 'passed', 'skipped'] as const).map(status => {
            const count = status === 'all' ? run.results.length :
              status === 'passed' ? passedCount :
              status === 'failed' ? failedCount : skippedCount;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filterStatus === status
                    ? status === 'failed' ? 'bg-red-500/20 text-red-400'
                      : status === 'passed' ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setExpandAll(!expandAll)}
          className="text-xs text-zinc-400 hover:text-white transition-colors"
        >
          {expandAll ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {/* Scenarios List */}
      <div className="p-3 space-y-2 flex-1 overflow-y-auto">
        {filteredResults.length === 0 ? (
          <p className="text-center text-sm text-zinc-400 py-8">No scenarios match the filter</p>
        ) : (
          filteredResults.map((result, index) => (
            <ScenarioCard key={index} result={result} index={index} />
          ))
        )}
      </div>
    </div>
  );
}
