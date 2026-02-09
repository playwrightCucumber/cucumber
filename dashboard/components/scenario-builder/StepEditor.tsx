'use client';

/**
 * StepEditor - Inline editor for configuring action parameters
 */

import { useState, useEffect } from 'react';
import { ActionDefinition, ActionParameter } from '@/lib/action-library';
import { ScenarioStep, StepKeyword, SavedElement } from '@/lib/scenario-types';

interface StepEditorProps {
    action: ActionDefinition;
    step?: ScenarioStep;
    onSave: (step: Omit<ScenarioStep, 'id'>) => void;
    onCancel: () => void;
    suggestedKeyword: StepKeyword;
}

export function StepEditor({ action, step, onSave, onCancel, suggestedKeyword }: StepEditorProps) {
    const [keyword, setKeyword] = useState<StepKeyword>(step?.keyword || suggestedKeyword);
    const [parameters, setParameters] = useState<Record<string, string>>(step?.parameters || {});
    const [savedElements, setSavedElements] = useState<SavedElement[]>([]);
    const [showElementPicker, setShowElementPicker] = useState<string | null>(null);

    useEffect(() => {
        fetchSavedElements();
        // Initialize default values
        const defaults: Record<string, string> = {};
        action.parameters.forEach(param => {
            if (param.defaultValue && !parameters[param.name]) {
                defaults[param.name] = param.defaultValue;
            }
        });
        if (Object.keys(defaults).length > 0) {
            setParameters(prev => ({ ...defaults, ...prev }));
        }
    }, [action]);

    const fetchSavedElements = async () => {
        try {
            const res = await fetch('/api/elements');
            if (res.ok) {
                const data = await res.json();
                setSavedElements(data.elements);
            }
        } catch (error) {
            console.error('Failed to fetch elements:', error);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            actionId: action.id,
            keyword,
            parameters
        });
    };

    const updateParameter = (name: string, value: string) => {
        setParameters(prev => ({ ...prev, [name]: value }));
    };

    const isValid = action.parameters.every(param =>
        !param.required || (parameters[param.name] && parameters[param.name].trim() !== '')
    );

    const renderParameterInput = (param: ActionParameter) => {
        const value = parameters[param.name] || '';

        // Special handling for selector type - show saved elements dropdown
        if (param.type === 'selector') {
            return (
                <div className="space-y-1">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => updateParameter(param.name, e.target.value)}
                        placeholder={param.placeholder}
                        className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                    />
                    {savedElements.length > 0 && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowElementPicker(showElementPicker === param.name ? null : param.name)}
                                className="text-xs text-emerald-400 hover:text-emerald-300"
                            >
                                📁 Use saved element
                            </button>
                            {showElementPicker === param.name && (
                                <div className="absolute z-10 mt-1 w-full bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl max-h-32 overflow-y-auto">
                                    {savedElements.map(el => (
                                        <button
                                            key={el.id}
                                            type="button"
                                            onClick={() => {
                                                updateParameter(param.name, el.selector);
                                                setShowElementPicker(null);
                                            }}
                                            className="w-full px-3 py-2 text-left text-xs hover:bg-zinc-700 border-b border-zinc-700 last:border-0"
                                        >
                                            <div className="text-white font-medium">{el.name}</div>
                                            <div className="text-zinc-400 truncate">{el.selector}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        // URL input
        if (param.type === 'url') {
            return (
                <input
                    type="url"
                    value={value}
                    onChange={(e) => updateParameter(param.name, e.target.value)}
                    placeholder={param.placeholder}
                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
            );
        }

        // Number input
        if (param.type === 'number') {
            return (
                <input
                    type="number"
                    value={value}
                    onChange={(e) => updateParameter(param.name, e.target.value)}
                    placeholder={param.placeholder}
                    min="0"
                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
            );
        }

        // Select input
        if (param.type === 'select' && param.options) {
            return (
                <select
                    value={value}
                    onChange={(e) => updateParameter(param.name, e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                    <option value="">Select...</option>
                    {param.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            );
        }

        // Default string input
        return (
            <input
                type="text"
                value={value}
                onChange={(e) => updateParameter(param.name, e.target.value)}
                placeholder={param.placeholder}
                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
        );
    };

    return (
        <form onSubmit={handleSubmit} className="bg-zinc-800 border border-zinc-600 rounded-xl p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <span className="text-lg">{action.icon}</span>
                <div>
                    <h4 className="text-sm font-semibold text-white">{action.name}</h4>
                    <p className="text-xs text-zinc-400">{action.description}</p>
                </div>
            </div>

            {/* Keyword selector */}
            <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Step Keyword</label>
                <div className="flex gap-1">
                    {(['Given', 'When', 'Then', 'And', 'But'] as StepKeyword[]).map(kw => (
                        <button
                            key={kw}
                            type="button"
                            onClick={() => setKeyword(kw)}
                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${keyword === kw
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-zinc-700 text-zinc-400 hover:text-white'
                                }`}
                        >
                            {kw}
                        </button>
                    ))}
                </div>
            </div>

            {/* Parameters */}
            {action.parameters.length > 0 && (
                <div className="space-y-3">
                    {action.parameters.map(param => (
                        <div key={param.name}>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">
                                {param.label}
                                {param.required && <span className="text-red-400 ml-1">*</span>}
                            </label>
                            {renderParameterInput(param)}
                        </div>
                    ))}
                </div>
            )}

            {/* Preview */}
            <div className="bg-zinc-900 rounded-lg p-3">
                <div className="text-xs text-zinc-500 mb-1">Preview:</div>
                <code className="text-sm text-emerald-400">
                    {keyword} {action.gherkinTemplate.replace(/\{(\w+)\}/g, (_, key) => parameters[key] || `{${key}}`)}
                </code>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!isValid}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {step ? 'Update Step' : 'Add Step'}
                </button>
            </div>
        </form>
    );
}
