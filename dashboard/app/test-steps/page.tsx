/**
 * Test page for Step Scanner API
 */

'use client';

import { useState } from 'react';

interface StepDefinition {
  pattern: string;
  text: string;
  type: string;
  file: string;
  example?: string;
}

export default function StepsTestPage() {
  const [steps, setSteps] = useState<StepDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testStep, setTestStep] = useState('I am on the Chronicle login page');
  const [validationResult, setValidationResult] = useState<any>(null);

  const loadSteps = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/steps?type=Given');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSteps(data.steps.slice(0, 10));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = async () => {
    setLoading(true);
    setError('');
    setValidationResult(null);
    try {
      const res = await fetch('/api/steps/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: testStep })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setValidationResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Step Scanner API Test</h1>

      {/* Load Steps Test */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test 1: Load Step Definitions</h2>
        <button
          onClick={loadSteps}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Given Steps'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded text-red-400">
            Error: {error}
          </div>
        )}

        {steps.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Found {steps.length} steps:</h3>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="bg-zinc-900 p-3 rounded border border-zinc-700">
                  <div className="font-mono text-sm text-emerald-400">{step.text}</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {step.type} • {step.file}
                  </div>
                  {step.example && (
                    <div className="text-xs text-zinc-400 mt-1">
                      Example: {step.example}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Validation Test */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Test 2: Validate Step</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Step Text:</label>
          <input
            type="text"
            value={testStep}
            onChange={(e) => setTestStep(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-white"
          />
        </div>

        <button
          onClick={validateStep}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? 'Validating...' : 'Validate Step'}
        </button>

        {validationResult && (
          <div className="mt-4">
            <div className={`p-4 rounded border ${
              validationResult.valid 
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-red-500/20 border-red-500 text-red-400'
            }`}>
              {validationResult.valid ? '✓ Valid Step' : '✗ Invalid Step'}
            </div>

            {validationResult.matches?.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Matches:</h3>
                {validationResult.matches.map((match: any, i: number) => (
                  <div key={i} className="bg-zinc-900 p-3 rounded mb-2">
                    <div className="font-mono text-sm text-emerald-400">{match.text}</div>
                    <div className="text-xs text-zinc-500">{match.file}</div>
                  </div>
                ))}
              </div>
            )}

            {validationResult.suggestions?.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Suggestions:</h3>
                {validationResult.suggestions.map((sug: any, i: number) => (
                  <div key={i} className="bg-zinc-900 p-3 rounded mb-2">
                    <div className="font-mono text-sm text-yellow-400">{sug.text}</div>
                    <div className="text-xs text-zinc-500">{sug.file}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
