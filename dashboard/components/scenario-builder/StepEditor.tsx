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
    const [showElementPicker, setShowElementPicker] = useState<string | null>(null);    const [showSaveModal, setShowSaveModal] = useState(false);
    const [elementToSave, setElementToSave] = useState({
        name: '',
        selector: '',
        selectorType: 'css' as 'css' | 'xpath' | 'text',
        pageUrl: '',
        description: ''
    });
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

    const validateSelector = (selector: string): { isValid: boolean; warning?: string } => {
        // Check for nested quotes
        const hasNestedDoubleQuotes = /"[^"]*"[^"]*"/.test(selector);
        const hasNestedSingleQuotes = /'[^']*'[^']*'/.test(selector);
        
        if (hasNestedDoubleQuotes || hasNestedSingleQuotes) {
            return {
                isValid: false,
                warning: '⚠️ Selector mengandung nested quotes. Gunakan attribute selector seperti [href="/path"] atau text locator.'
            };
        }

        // Check for :has-text() with quotes
        if (/:has-text\(["']/.test(selector)) {
            return {
                isValid: false,
                warning: '⚠️ Hindari :has-text() dengan quotes. Gunakan attribute selector atau text= sebagai gantinya.'
            };
        }

        return { isValid: true };
    };

    const handleSaveElement = async () => {
        try {
            const res = await fetch('/api/elements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...elementToSave,
                    id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: new Date().toISOString()
                })
            });

            if (res.ok) {
                await fetchSavedElements();
                setShowSaveModal(false);
                setElementToSave({
                    name: '',
                    selector: '',
                    selectorType: 'css',
                    pageUrl: '',
                    description: ''
                });
            }
        } catch (error) {
            console.error('Failed to save element:', error);
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
            const validation = validateSelector(value);
            
            return (
                <div className="space-y-2">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => updateParameter(param.name, e.target.value)}
                        placeholder={param.placeholder}
                        className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                    />
                    
                    {/* Validation Warning */}
                    {value && !validation.isValid && (
                        <div className="text-xs text-amber-400 bg-amber-950 border border-amber-700 rounded px-2 py-1">
                            {validation.warning}
                        </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                        {savedElements.length > 0 && (
                            <div className="relative flex-1">
                                <button
                                    type="button"
                                    onClick={() => setShowElementPicker(showElementPicker === param.name ? null : param.name)}
                                    className="text-xs text-emerald-400 hover:text-emerald-300"
                                >
                                    📁 Gunakan element tersimpan
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
                        
                        {value && validation.isValid && (
                            <button
                                type="button"
                                onClick={() => {
                                    setElementToSave({ ...elementToSave, selector: value });
                                    setShowSaveModal(true);
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300"
                            >
                                💾 Simpan ke Library
                            </button>
                        )}
                    </div>
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

            {/* Save Element Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSaveModal(false)}>
                    <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-white mb-4">💾 Simpan Element ke Library</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">
                                    Nama Element <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={elementToSave.name}
                                    onChange={(e) => setElementToSave({ ...elementToSave, name: e.target.value })}
                                    placeholder="e.g., Login Button"
                                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">
                                    Selector <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={elementToSave.selector}
                                    onChange={(e) => setElementToSave({ ...elementToSave, selector: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Tipe Selector</label>
                                <select
                                    value={elementToSave.selectorType}
                                    onChange={(e) => setElementToSave({ ...elementToSave, selectorType: e.target.value as any })}
                                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                                >
                                    <option value="css">CSS Selector</option>
                                    <option value="xpath">XPath</option>
                                    <option value="text">Text Locator</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">URL Halaman (opsional)</label>
                                <input
                                    type="url"
                                    value={elementToSave.pageUrl}
                                    onChange={(e) => setElementToSave({ ...elementToSave, pageUrl: e.target.value })}
                                    placeholder="https://example.com/page"
                                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Deskripsi (opsional)</label>
                                <textarea
                                    value={elementToSave.description}
                                    onChange={(e) => setElementToSave({ ...elementToSave, description: e.target.value })}
                                    placeholder="Tombol untuk login ke aplikasi"
                                    rows={2}
                                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowSaveModal(false)}
                                className="flex-1 px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveElement}
                                disabled={!elementToSave.name || !elementToSave.selector}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
