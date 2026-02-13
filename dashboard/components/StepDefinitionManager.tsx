'use client';

import { useState, useEffect } from 'react';

type ActionType = 'click' | 'fill' | 'navigate' | 'wait' | 'waitForSelector' | 'expect' | 'custom';

interface Action {
  id: string;
  type: ActionType;
  log?: string;
  selector?: string;
  value?: string;
  url?: string;
  duration?: number;
  expected?: string;
  code?: string;
}

interface StepDefinition {
  keyword: string;
  pattern: string;
  filePath: string;
  priority: string;
  hasParameters: boolean;
}

export function StepDefinitionManager() {
  const [keyword, setKeyword] = useState<'Given' | 'When' | 'Then' | 'And'>('Given');
  const [pattern, setPattern] = useState('');
  const [actions, setActions] = useState<Action[]>([]);
  const [priority, setPriority] = useState<'p0' | 'p1' | 'p2'>('p0');
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [existingSteps, setExistingSteps] = useState<StepDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  // Action types template
  const [currentAction, setCurrentAction] = useState<Action>({
    id: crypto.randomUUID(),
    type: 'click',
    log: '',
    selector: ''
  });

  useEffect(() => {
    loadExistingSteps();
  }, []);

  const loadExistingSteps = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/step-definitions');
      if (res.ok) {
        const data = await res.json();
        setExistingSteps(data.stepDefinitions || []);
      }
    } catch (error) {
      console.error('Failed to load step definitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAction = () => {
    if (!currentAction.type) return;
    
    setActions([...actions, { ...currentAction, id: crypto.randomUUID() }]);
    setCurrentAction({
      id: crypto.randomUUID(),
      type: 'click',
      log: '',
      selector: ''
    });
  };

  const removeAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id));
  };

  const handleSave = async () => {
    if (!pattern || actions.length === 0) {
      setMessage({ type: 'error', text: 'Please fill pattern and add at least one action' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/step-definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          pattern,
          actions,
          priority,
          filePath: fileName || undefined
        })
      });

      if (res.ok) {
        const result = await res.json();
        setMessage({ type: 'success', text: `Step definition created: ${result.filePath}` });
        
        // Reset form
        setPattern('');
        setActions([]);
        setFileName('');
        
        // Reload list
        loadExistingSteps();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to create step definition' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create step definition' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900 text-zinc-100">
      <div className="p-6 border-b border-zinc-800">
        <h2 className="text-2xl font-bold">Step Definition Manager</h2>
        <p className="text-zinc-400 text-sm mt-1">Create custom step definitions with multiple actions</p>
      </div>

      {message && (
        <div className={`mx-6 mt-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'}`}>
          {message.text}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-6 p-6">
          {/* Left: Step Definition Builder */}
          <div className="space-y-6">
            <div className="bg-zinc-800 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">Step Definition</h3>
              
              {/* Keyword */}
              <div>
                <label className="block text-sm font-medium mb-2">Keyword</label>
                <div className="flex gap-2">
                  {(['Given', 'When', 'Then', 'And'] as const).map(kw => (
                    <button
                      key={kw}
                      onClick={() => setKeyword(kw)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        keyword === kw
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      }`}
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pattern */}
              <div>
                <label className="block text-sm font-medium mb-2">Pattern</label>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder='e.g., I click the {string} button'
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500"
                />
                <p className="text-xs text-zinc-500 mt-1">Use {'{string}'} or {'{int}'} for parameters</p>
              </div>

              {/* Priority & File Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <div className="flex gap-2">
                    {(['p0', 'p1', 'p2'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          priority === p
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                        }`}
                      >
                        {p.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">File Name (optional)</label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="auto-generated"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Builder */}
            <div className="bg-zinc-800 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">Add Action</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">Action Type</label>
                <select
                  value={currentAction.type}
                  onChange={(e) => setCurrentAction({ ...currentAction, type: e.target.value as ActionType })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100"
                >
                  <option value="click">Click Element</option>
                  <option value="fill">Fill Input</option>
                  <option value="navigate">Navigate to URL</option>
                  <option value="wait">Wait (timeout)</option>
                  <option value="waitForSelector">Wait for Selector</option>
                  <option value="expect">Expect/Assert</option>
                  <option value="custom">Custom Code</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Log Message (optional)</label>
                <input
                  type="text"
                  value={currentAction.log || ''}
                  onChange={(e) => setCurrentAction({ ...currentAction, log: e.target.value })}
                  placeholder="e.g., Clicking submit button"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500"
                />
              </div>

              {/* Action-specific fields */}
              {(currentAction.type === 'click' || currentAction.type === 'fill' || currentAction.type === 'waitForSelector' || currentAction.type === 'expect') && (
                <div>
                  <label className="block text-sm font-medium mb-2">Selector</label>
                  <input
                    type="text"
                    value={currentAction.selector || ''}
                    onChange={(e) => setCurrentAction({ ...currentAction, selector: e.target.value })}
                    placeholder="e.g., button[data-testid='submit']"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500"
                  />
                </div>
              )}

              {currentAction.type === 'fill' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Value</label>
                  <input
                    type="text"
                    value={currentAction.value || ''}
                    onChange={(e) => setCurrentAction({ ...currentAction, value: e.target.value })}
                    placeholder="e.g., param0 (for parameters)"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500"
                  />
                </div>
              )}

              {currentAction.type === 'navigate' && (
                <div>
                  <label className="block text-sm font-medium mb-2">URL</label>
                  <input
                    type="text"
                    value={currentAction.url || ''}
                    onChange={(e) => setCurrentAction({ ...currentAction, url: e.target.value })}
                    placeholder="e.g., https://example.com"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500"
                  />
                </div>
              )}

              {currentAction.type === 'wait' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (ms)</label>
                  <input
                    type="number"
                    value={currentAction.duration || 1000}
                    onChange={(e) => setCurrentAction({ ...currentAction, duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100"
                  />
                </div>
              )}

              {currentAction.type === 'expect' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Expected Text</label>
                  <input
                    type="text"
                    value={currentAction.expected || ''}
                    onChange={(e) => setCurrentAction({ ...currentAction, expected: e.target.value })}
                    placeholder="e.g., Success"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500"
                  />
                </div>
              )}

              {currentAction.type === 'custom' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Custom Code</label>
                  <textarea
                    value={currentAction.code || ''}
                    onChange={(e) => setCurrentAction({ ...currentAction, code: e.target.value })}
                    placeholder="e.g., await this.page.evaluate(() => window.scrollTo(0, 0));"
                    rows={3}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 font-mono text-sm"
                  />
                </div>
              )}

              <button
                onClick={addAction}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors"
              >
                ➕ Add Action
              </button>
            </div>

            {/* Actions List */}
            {actions.length > 0 && (
              <div className="bg-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Actions ({actions.length})</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {actions.map((action, index) => (
                    <div key={action.id} className="flex items-start gap-3 p-3 bg-zinc-900 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-blue-400">{action.type}</div>
                        {action.log && <div className="text-zinc-400">Log: {action.log}</div>}
                        {action.selector && <div className="text-zinc-300">Selector: <code className="text-emerald-400">{action.selector}</code></div>}
                        {action.value && <div className="text-zinc-300">Value: {action.value}</div>}
                        {action.url && <div className="text-zinc-300">URL: {action.url}</div>}
                        {action.duration && <div className="text-zinc-300">Duration: {action.duration}ms</div>}
                        {action.expected && <div className="text-zinc-300">Expected: {action.expected}</div>}
                        {action.code && <div className="text-zinc-300 font-mono text-xs">{action.code}</div>}
                      </div>
                      <button
                        onClick={() => removeAction(action.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !pattern || actions.length === 0}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '💾 Saving...' : '💾 Create Step Definition'}
            </button>
          </div>

          {/* Right: Existing Step Definitions */}
          <div className="bg-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Existing Step Definitions ({existingSteps.length})</h3>
            
            {loading ? (
              <div className="text-center text-zinc-400 py-8">Loading...</div>
            ) : existingSteps.length === 0 ? (
              <div className="text-center text-zinc-400 py-8">No step definitions yet</div>
            ) : (
              <div className="space-y-2 max-h-[800px] overflow-auto">
                {existingSteps.map((step, index) => (
                  <div key={index} className="p-3 bg-zinc-900 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        step.keyword === 'Given' ? 'bg-purple-900 text-purple-300' :
                        step.keyword === 'When' ? 'bg-blue-900 text-blue-300' :
                        step.keyword === 'Then' ? 'bg-emerald-900 text-emerald-300' :
                        'bg-zinc-700 text-zinc-300'
                      }`}>
                        {step.keyword}
                      </span>
                      <div className="flex-1">
                        <code className="text-zinc-100 text-sm">{step.pattern}</code>
                        <div className="text-xs text-zinc-500 mt-1">{step.filePath}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
