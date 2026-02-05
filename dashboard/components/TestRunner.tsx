'use client';

import { useState } from 'react';
import { Environment } from '@/lib/types';

interface TestRunnerProps {
  availableTags: string[];
  onRun: (tags: string[], environment: Environment) => void;
  isRunning: boolean;
}

const environments: { value: Environment; label: string; color: string }[] = [
  { value: 'dev', label: 'Development', color: 'bg-blue-500' },
  { value: 'staging', label: 'Staging', color: 'bg-yellow-500' },
  { value: 'prod', label: 'Production', color: 'bg-red-500' },
  { value: 'map', label: 'Map', color: 'bg-purple-500' },
];

const popularTags = ['smoke', 'p0', 'p1', 'roi', 'interment', 'login', 'advanced-search-plot', 'sales', 'person'];

export function TestRunner({ availableTags, onRun, isRunning }: TestRunnerProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>('staging');
  const [customTag, setCustomTag] = useState('');

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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Test Runner
        </h2>

        {/* Environment Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-400 mb-2">Environment</label>
          <div className="flex flex-wrap gap-2">
            {environments.map(env => (
              <button
                key={env.value}
                onClick={() => setSelectedEnvironment(env.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedEnvironment === env.value
                    ? `${env.color} text-white shadow-lg`
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {env.label}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Tags */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-400 mb-2">Popular Tags</label>
          <div className="flex flex-wrap gap-2">
            {popularTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                @{tag}
              </button>
            ))}
          </div>
        </div>

        {/* All Available Tags */}
        {availableTags.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              All Available Tags ({availableTags.length})
            </label>
            <div className="max-h-40 overflow-y-auto bg-zinc-800 rounded-lg p-3">
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                    }`}
                  >
                    @{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Custom Tag Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-400 mb-2">Custom Tag</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
              placeholder="Enter tag name..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={addCustomTag}
              className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Selected Tags ({selectedTags.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm"
                >
                  @{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Run Button */}
      <button
        onClick={handleRun}
        disabled={isRunning || selectedTags.length === 0}
        className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
          isRunning || selectedTags.length === 0
            ? 'bg-zinc-700 cursor-not-allowed'
            : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-emerald-500/25'
        }`}
      >
        {isRunning ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Running Tests...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Run Tests
          </span>
        )}
      </button>
    </div>
  );
}
