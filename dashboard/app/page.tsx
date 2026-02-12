'use client';

import { useState, useEffect, useCallback } from 'react';
import { TestRunner } from '@/components/TestRunner';
import { TestProgress } from '@/components/TestProgress';
import { TestResults } from '@/components/TestResults';
import { HistoryList } from '@/components/HistoryList';
import { ScheduleManager } from '@/components/ScheduleManager';
import { ScenarioBuilder } from '@/components/scenario-builder';
import FeatureFileBrowser from '@/components/FeatureFileBrowser';
import { StepDefinitionManager } from '@/components/StepDefinitionManager';
import { WelcomeGuide } from '@/components/WelcomeGuide';
import { ElementLibraryManager } from '@/components/ElementLibraryManager';
import { TestRun, Environment } from '@/lib/types';
import { ParsedFeature, ParsedScenario } from '@/lib/feature-parser';

export default function HomePage() {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [history, setHistory] = useState<TestRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'run' | 'history' | 'schedule' | 'builder' | 'elements' | 'features' | 'steps'>('run');
  const [lastCompletedRun, setLastCompletedRun] = useState<TestRun | null>(null);
  const [loadedScenario, setLoadedScenario] = useState<{ feature: ParsedFeature; scenario: ParsedScenario } | null>(null);

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
    setLastCompletedRun(null);
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
        alert('Gagal menjalankan test: ' + error.error);
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Failed to run tests:', error);
      alert('Gagal menjalankan test. Pastikan server berjalan.');
      setIsRunning(false);
    }
  };

  const handleTestComplete = useCallback((completedRun?: TestRun) => {
    setIsRunning(false);
    if (completedRun) {
      setLastCompletedRun(completedRun);
    }
    fetchHistory();
  }, []);

  const handleViewRun = (run: TestRun) => {
    setSelectedRun(run);
    setActiveTab('history');
  };

  const handleLoadScenario = (feature: ParsedFeature, scenario: ParsedScenario) => {
    setLoadedScenario({ feature, scenario });
    setActiveTab('builder');
  };

  // Stats
  const totalRuns = history.length;
  const passedRuns = history.filter(r => r.status === 'passed').length;
  const failedRuns = history.filter(r => r.status === 'failed').length;
  const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#111113]">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-700 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-semibold text-white leading-tight">Test Dashboard</h1>
                <p className="text-xs text-zinc-400">Dashboard Automation Test</p>
              </div>
            </div>

            {/* Tabs */}
            <nav className="flex items-center bg-zinc-800 rounded-lg p-1 gap-0.5 border border-zinc-700">
              {[
                {
                  key: 'run', label: '▶ Jalankan Test', tooltip: 'Pilih & jalankan test otomatis', icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                  )
                },
                {
                  key: 'history', label: '📊 Riwayat', tooltip: 'Lihat hasil test sebelumnya', icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ), badge: totalRuns
                },
                {
                  key: 'schedule', label: '📅 Jadwal', tooltip: 'Atur jadwal test otomatis', icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )
                },
                {
                  key: 'builder', label: '🔨 Buat Test', tooltip: 'Buat skenario test baru dengan mudah', icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )
                },
                {
                  key: 'elements', label: '📚 Library Element', tooltip: 'Kelola element yang tersimpan untuk digunakan kembali', icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  )
                },
                {
                  key: 'features', label: '📁 Daftar Test', tooltip: 'Browse semua skenario test yang ada', icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )
                },
                {
                  key: 'steps', label: '⚙ Langkah', tooltip: 'Definisi langkah-langkah test (teknis)', icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  )
                },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  title={(tab as any).tooltip || ''}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.key
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-700'
                    }`}
                >
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-zinc-600 text-white text-xs rounded-full font-medium">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Live indicator */}
            {isRunning && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-medium text-emerald-400">Running</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 py-4">
        {/* Run Tests Tab - always mounted, hidden via CSS to preserve SSE connection & logs */}
        <div className={`space-y-3 ${activeTab === 'run' ? 'animate-fade-in' : 'hidden'}`}>
          {/* Welcome Guide */}
          <WelcomeGuide onNavigate={(tab) => setActiveTab(tab as typeof activeTab)} />

          {/* Inline Stats Bar */}
          <div className="flex items-center gap-3 bg-zinc-800/80 border border-zinc-700 rounded-lg px-4 py-2">
            {[
              { label: 'Total Test', value: totalRuns, color: 'text-white' },
              { label: 'Berhasil', value: passedRuns, color: 'text-emerald-400' },
              { label: 'Gagal', value: failedRuns, color: 'text-red-400' },
              { label: 'Tingkat Sukses', value: `${passRate}%`, color: passRate >= 80 ? 'text-emerald-400' : passRate >= 50 ? 'text-yellow-400' : 'text-red-400' },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-2">
                {i > 0 && <span className="text-zinc-600">·</span>}
                <span className="text-xs text-zinc-400 uppercase font-medium">{stat.label}</span>
                <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            {/* Left: Runner + Progress */}
            <div className="flex-1 min-w-0 space-y-3">
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
              {/* Show last completed run results inline */}
              {lastCompletedRun && !isRunning && (
                <div className="animate-fade-in">
                  <TestResults run={lastCompletedRun} />
                </div>
              )}
            </div>

            {/* Right: Recent Runs */}
            <div className="w-[340px] flex-shrink-0 hidden lg:block">
              <div className="sticky top-16">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Test Terakhir</h3>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    Lihat semua →
                  </button>
                </div>
                <HistoryList
                  history={history.slice(0, 10)}
                  onSelectRun={handleViewRun}
                  selectedRun={null}
                  onClearHistory={fetchHistory}
                  compact
                />
              </div>
            </div>
          </div>
        </div>

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="animate-fade-in h-[calc(100vh-64px)]">
            <div className="flex gap-3 h-full">
              <div className="w-[300px] flex-shrink-0 flex flex-col h-full">
                <HistoryList
                  history={history}
                  onSelectRun={setSelectedRun}
                  selectedRun={selectedRun}
                  onClearHistory={fetchHistory}
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col h-full">
                {selectedRun ? (
                  <div className="animate-slide-in flex-1 flex flex-col min-h-0">
                    <TestResults run={selectedRun} />
                  </div>
                ) : (
                  <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-zinc-700 flex items-center justify-center">
                        <svg className="w-7 h-7 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-base font-semibold text-zinc-200 mb-1">Pilih Test Run</h3>
                      <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                        Pilih salah satu test dari daftar di sebelah kiri untuk melihat hasilnya.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="animate-fade-in max-w-3xl mx-auto">
            <ScheduleManager />
          </div>
        )}

        {/* Builder Tab */}
        {activeTab === 'builder' && (
          <div className="animate-fade-in h-[calc(100vh-120px)]">
            <ScenarioBuilder loadedScenario={loadedScenario} />
          </div>
        )}

        {/* Element Library Tab */}
        {activeTab === 'elements' && (
          <div className="animate-fade-in">
            <ElementLibraryManager />
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="animate-fade-in">
            <FeatureFileBrowser onSelectScenario={handleLoadScenario} />
          </div>
        )}

        {/* Step Definitions Tab */}
        {activeTab === 'steps' && (
          <div className="animate-fade-in h-[calc(100vh-120px)]">
            <StepDefinitionManager />
          </div>
        )}
      </div>
    </main>
  );
}
