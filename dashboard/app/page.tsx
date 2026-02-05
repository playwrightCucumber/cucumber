'use client';

import { useState, useEffect } from 'react';
import { TestRunner } from '@/components/TestRunner';
import { TestProgress } from '@/components/TestProgress';
import { TestResults } from '@/components/TestResults';
import { HistoryList } from '@/components/HistoryList';
import { ScheduleManager } from '@/components/ScheduleManager';
import { TestRun, Environment } from '@/lib/types';

export default function HomePage() {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [history, setHistory] = useState<TestRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'run' | 'history' | 'schedule'>('run');

  useEffect(() => {
    fetchTags();
    fetchHistory();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setAvailableTags(data.tags || []);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleRun = async (tags: string[], environment: Environment) => {
    setIsRunning(true);
    setSelectedRun(null);
    setActiveTab('run');

    try {
      const res = await fetch('/api/run-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags, environment }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentRunId(data.runId);
      } else {
        const error = await res.json();
        alert('Failed to run tests: ' + error.error);
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Failed to run tests:', error);
      alert('Failed to run tests');
      setIsRunning(false);
    }
  };

  const handleTestComplete = () => {
    setIsRunning(false);
    fetchHistory();
  };

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Automation Dashboard</h1>
                <p className="text-sm text-zinc-400">Playwright Test Runner</p>
              </div>
            </div>

            {/* Tabs */}
            <nav className="flex gap-2">
              <button
                onClick={() => setActiveTab('run')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'run'
                    ? 'bg-emerald-500 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                Run Tests
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-emerald-500 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'schedule'
                    ? 'bg-emerald-500 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                Schedules
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'run' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <TestRunner
                availableTags={availableTags}
                onRun={handleRun}
                isRunning={isRunning}
              />
              {currentRunId && (
                <TestProgress
                  runId={currentRunId}
                  onComplete={handleTestComplete}
                />
              )}
            </div>
            <div className="space-y-6">
              {selectedRun ? (
                <div>
                  <button
                    onClick={() => setSelectedRun(null)}
                    className="mb-4 text-sm text-zinc-400 hover:text-white flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to History
                  </button>
                  <TestResults run={selectedRun} />
                </div>
              ) : (
                <div>
                  <h3 className="text-white font-medium mb-3">Recent Runs</h3>
                  <HistoryList
                    history={history.slice(0, 10)}
                    onSelectRun={setSelectedRun}
                    selectedRun={null}
                    onClearHistory={fetchHistory}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <HistoryList
                history={history}
                onSelectRun={setSelectedRun}
                selectedRun={selectedRun}
                onClearHistory={fetchHistory}
              />
            </div>
            <div className="lg:col-span-2">
              {selectedRun ? (
                <TestResults run={selectedRun} />
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                  <svg className="w-16 h-16 text-zinc-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-white mb-2">No Test Run Selected</h3>
                  <p className="text-zinc-400">Select a test run from the history to view detailed results.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="max-w-2xl mx-auto">
            <ScheduleManager />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-zinc-500">
          Automation Dashboard v1.0.0 - Powered by Playwright & Cucumber
        </div>
      </footer>
    </main>
  );
}
