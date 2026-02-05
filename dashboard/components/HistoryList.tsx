'use client';

import { TestRun } from '@/lib/types';
import { useState } from 'react';

interface HistoryListProps {
  history: TestRun[];
  onSelectRun: (run: TestRun) => void;
  selectedRun: TestRun | null;
  onClearHistory?: () => void;
}

export function HistoryList({ history, onSelectRun, selectedRun, onClearHistory }: HistoryListProps) {
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all test history? This cannot be undone.')) return;

    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      if (res.ok) {
        onClearHistory?.();
      } else {
        alert('Failed to clear history');
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
      alert('Failed to clear history');
    }
  };

  const filteredHistory = history.filter(run => {
    if (filter === 'all') return true;
    return run.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-emerald-500';
      case 'failed': return 'text-red-500';
      case 'running': return 'text-blue-500';
      case 'cancelled': return 'text-zinc-500';
      default: return 'text-zinc-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-emerald-500/10';
      case 'failed': return 'bg-red-500/10';
      case 'running': return 'bg-blue-500/10';
      case 'cancelled': return 'bg-zinc-500/10';
      default: return 'bg-zinc-800';
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History ({filteredHistory.length})
          </h3>
          <div className="flex gap-2">
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="px-3 py-1 rounded-lg text-sm font-medium transition-colors text-zinc-400 hover:bg-red-500/20 hover:text-red-400"
                title="Clear all history"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('passed')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === 'passed' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              Passed
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === 'failed' ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              Failed
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-zinc-800 max-h-96 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            No test runs found
          </div>
        ) : (
          filteredHistory.map(run => (
            <button
              key={run.id}
              onClick={() => onSelectRun(run)}
              className={`w-full p-4 text-left transition-colors hover:bg-zinc-800/50 ${
                selectedRun?.id === run.id ? 'bg-zinc-800' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBg(run.status)} ${getStatusColor(run.status)}`}>
                      {run.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      run.environment === 'prod' ? 'bg-red-500/20 text-red-400' :
                      run.environment === 'staging' ? 'bg-yellow-500/20 text-yellow-400' :
                      run.environment === 'map' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {run.environment}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">
                    {run.tags.map(t => `@${t}`).join(', ')}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {new Date(run.startedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-emerald-500">{run.results.filter(r => r.status === 'passed').length} passed</span>
                  <span className="text-red-500">{run.results.filter(r => r.status === 'failed').length} failed</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
