'use client';

import { useState } from 'react';
import { Environment } from '@/lib/types';

interface TestRunnerProps {
  availableTags: string[];
  onRun: (tags: string[], environment: Environment) => void;
  isRunning: boolean;
}

const environments: { value: Environment; label: string; icon: string; color: string; activeColor: string }[] = [
  { value: 'dev', label: 'Dev', icon: '🛠', color: 'border-blue-500/30 bg-blue-500/5', activeColor: 'border-blue-500 bg-blue-500/20 text-blue-300 shadow-blue-500/10' },
  { value: 'staging', label: 'Staging', icon: '🧪', color: 'border-yellow-500/30 bg-yellow-500/5', activeColor: 'border-yellow-500 bg-yellow-500/20 text-yellow-300 shadow-yellow-500/10' },
  { value: 'prod', label: 'Production', icon: '🚀', color: 'border-red-500/30 bg-red-500/5', activeColor: 'border-red-500 bg-red-500/20 text-red-300 shadow-red-500/10' },
  { value: 'map', label: 'Map', icon: '🗺', color: 'border-purple-500/30 bg-purple-500/5', activeColor: 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-purple-500/10' },
];

const popularTags = ['smoke', 'p0', 'p1', 'roi', 'interment', 'login', 'advanced-search-plot', 'sales', 'person'];

export function TestRunner({ availableTags, onRun, isRunning }: TestRunnerProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>('staging');
  const [customTag, setCustomTag] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags(prev => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleRun = () => {
    if (selectedTags.length === 0) {
      alert('Please select at least one tag');
      return;
    }
    onRun(selectedTags, selectedEnvironment);
  };

  return (
    <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-700">
        <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          </svg>
          Configure Test Run
        </h2>
      </div>

      <div className="p-4 space-y-3">
        {/* Environment Selection */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">Environment</label>
          <div className="grid grid-cols-4 gap-1.5">
            {environments.map(env => (
              <button
                key={env.value}
                onClick={() => setSelectedEnvironment(env.value)}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg border text-sm font-medium transition-all ${
                  selectedEnvironment === env.value
                    ? `${env.activeColor} shadow-md`
                    : `${env.color} text-zinc-300 hover:text-white`
                }`}
              >
                <span className="text-base">{env.icon}</span>
                <span className="text-xs">{env.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Tags */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">Quick Select</label>
          <div className="flex flex-wrap gap-1.5">
            {popularTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                    : 'bg-zinc-700 text-zinc-300 border border-zinc-600 hover:border-zinc-500 hover:text-white'
                }`}
              >
                @{tag}
              </button>
            ))}
          </div>
        </div>

        {/* All Available Tags (collapsible) */}
        {availableTags.length > 0 && (
          <div>
            <button
              onClick={() => setShowAllTags(!showAllTags)}
              className="flex items-center gap-1 text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2 hover:text-white transition-colors"
            >
              <svg className={`w-3 h-3 transition-transform ${showAllTags ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              All Tags ({availableTags.length})
            </button>
            {showAllTags && (
              <div className="max-h-32 overflow-y-auto bg-zinc-800 rounded-lg p-2 border border-zinc-600">
                <div className="flex flex-wrap gap-1">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        selectedTags.includes(tag)
                          ? 'bg-emerald-500/25 text-emerald-300'
                          : 'bg-zinc-700 text-zinc-300 hover:text-white'
                      }`}
                    >
                      @{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Tag Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
            placeholder="Add custom tag..."
            className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          />
          <button
            onClick={addCustomTag}
            disabled={!customTag.trim()}
            className="px-3 py-1.5 bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 hover:text-white transition-all text-sm font-medium disabled:opacity-30"
          >
            Add
          </button>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
                Selected ({selectedTags.length})
              </label>
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium group"
                >
                  @{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Run Button */}
      <div className="px-4 pb-4">
        <button
          onClick={handleRun}
          disabled={isRunning || selectedTags.length === 0}
          className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${
            isRunning || selectedTags.length === 0
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98]'
          }`}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Running Tests...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Run {selectedTags.length > 0 ? `${selectedTags.length} Tag${selectedTags.length > 1 ? 's' : ''}` : 'Tests'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
