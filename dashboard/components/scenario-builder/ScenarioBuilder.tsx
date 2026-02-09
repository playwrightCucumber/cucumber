'use client';

/**
 * ScenarioBuilder - Main component for no-code scenario creation
 */

import { useState, useCallback } from 'react';
import { ActionPalette } from './ActionPalette';
import { StepEditor } from './StepEditor';
import { StepCanvas } from './StepCanvas';
import { GherkinPreview } from './GherkinPreview';
import { ActionDefinition } from '@/lib/action-library';
import { ScenarioStep, Priority, AccessLevel, StepKeyword, CustomScenario } from '@/lib/scenario-types';

interface ScenarioBuilderProps {
    onScenarioSaved?: (scenario: CustomScenario) => void;
}

export function ScenarioBuilder({ onScenarioSaved }: ScenarioBuilderProps) {
    // Scenario metadata
    const [featureName, setFeatureName] = useState('');
    const [scenarioName, setScenarioName] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Priority>('p1');
    const [accessLevel, setAccessLevel] = useState<AccessLevel>('public');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    // Steps
    const [steps, setSteps] = useState<ScenarioStep[]>([]);

    // Editor state
    const [selectedAction, setSelectedAction] = useState<ActionDefinition | null>(null);
    const [editingStep, setEditingStep] = useState<ScenarioStep | null>(null);

    // UI state
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const getSuggestedKeyword = useCallback((): StepKeyword => {
        if (steps.length === 0) return 'Given';
        const lastStep = steps[steps.length - 1];
        if (lastStep.keyword === 'Given') return 'When';
        if (lastStep.keyword === 'When') return 'Then';
        return 'And';
    }, [steps]);

    const handleActionSelect = (action: ActionDefinition) => {
        setSelectedAction(action);
        setEditingStep(null);
    };

    const handleStepSave = (stepData: Omit<ScenarioStep, 'id'>) => {
        if (editingStep) {
            // Update existing step
            setSteps(prev => prev.map(s =>
                s.id === editingStep.id ? { ...stepData, id: s.id } : s
            ));
        } else {
            // Add new step
            const newStep: ScenarioStep = {
                ...stepData,
                id: crypto.randomUUID()
            };
            setSteps(prev => [...prev, newStep]);
        }
        setSelectedAction(null);
        setEditingStep(null);
    };

    const handleEditStep = (step: ScenarioStep) => {
        setEditingStep(step);
        // Find the action for this step
        import('@/lib/action-library').then(({ getActionById }) => {
            const action = getActionById(step.actionId);
            if (action) setSelectedAction(action);
        });
    };

    const handleDeleteStep = (stepId: string) => {
        setSteps(prev => prev.filter(s => s.id !== stepId));
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags(prev => [...prev, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(prev => prev.filter(t => t !== tag));
    };

    const handleSave = async () => {
        if (!featureName || !scenarioName || steps.length === 0) {
            setMessage({ type: 'error', text: 'Please fill in feature name, scenario name, and add at least one step' });
            return;
        }

        // Auto-add tag if there's text in input
        const finalTags = [...tags];
        if (tagInput.trim() && !finalTags.includes(tagInput.trim())) {
            finalTags.push(tagInput.trim());
            setTags(finalTags);
            setTagInput('');
        }

        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/scenarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: scenarioName,
                    featureName,
                    description,
                    priority,
                    accessLevel,
                    tags: finalTags,
                    steps
                })
            });

            if (res.ok) {
                const scenario = await res.json();
                setMessage({ type: 'success', text: 'Scenario saved successfully!' });
                onScenarioSaved?.(scenario);
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.error || 'Failed to save scenario' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save scenario' });
        } finally {
            setSaving(false);
        }
    };

    const handleGenerate = async () => {
        if (!featureName || !scenarioName || steps.length === 0) {
            setMessage({ type: 'error', text: 'Please fill in all required fields first' });
            return;
        }

        // Auto-add tag if there's text in input
        const finalTags = [...tags];
        if (tagInput.trim() && !finalTags.includes(tagInput.trim())) {
            finalTags.push(tagInput.trim());
            setTags(finalTags);
            setTagInput('');
        }

        setGenerating(true);
        setMessage(null);

        try {
            // First save, then generate
            const saveRes = await fetch('/api/scenarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: scenarioName,
                    featureName,
                    description,
                    priority,
                    accessLevel,
                    tags: finalTags,
                    steps
                })
            });

            if (!saveRes.ok) {
                throw new Error('Failed to save scenario');
            }

            const scenario = await saveRes.json();

            // Now generate feature file
            const genRes = await fetch(`/api/scenarios/${scenario.id}/generate`, {
                method: 'POST'
            });

            if (genRes.ok) {
                const result = await genRes.json();
                setMessage({ type: 'success', text: `Feature file generated: ${result.filePath}` });
            } else {
                const error = await genRes.json();
                setMessage({ type: 'error', text: error.error || 'Failed to generate feature file' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to generate feature file' });
        } finally {
            setGenerating(false);
        }
    };

    const handleClear = () => {
        if (confirm('Clear all steps and start over?')) {
            setSteps([]);
            setSelectedAction(null);
            setEditingStep(null);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Message */}
            {message && (
                <div className={`mb-3 px-4 py-2 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="flex gap-4 flex-1 min-h-0">
                {/* Left: Action Palette */}
                <div className="w-[220px] flex-shrink-0">
                    <ActionPalette
                        onActionSelect={handleActionSelect}
                        selectedActionId={selectedAction?.id}
                    />
                </div>

                {/* Center: Main Editor */}
                <div className="flex-1 flex flex-col gap-3 min-w-0">
                    {/* Metadata Form */}
                    <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Feature Name *</label>
                                <input
                                    type="text"
                                    value={featureName}
                                    onChange={(e) => setFeatureName(e.target.value)}
                                    placeholder="e.g., User Login"
                                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Scenario Name *</label>
                                <input
                                    type="text"
                                    value={scenarioName}
                                    onChange={(e) => setScenarioName(e.target.value)}
                                    placeholder="e.g., Login with valid credentials"
                                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Priority</label>
                                <div className="flex gap-1">
                                    {(['p0', 'p1', 'p2'] as Priority[]).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setPriority(p)}
                                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${priority === p
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-zinc-700 text-zinc-400 hover:text-white'
                                                }`}
                                        >
                                            {p.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Access Level</label>
                                <div className="flex gap-1">
                                    {(['public', 'authenticated'] as AccessLevel[]).map(a => (
                                        <button
                                            key={a}
                                            onClick={() => setAccessLevel(a)}
                                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors capitalize ${accessLevel === a
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-zinc-700 text-zinc-400 hover:text-white'
                                                }`}
                                        >
                                            {a}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Tags</label>
                                <div className="flex gap-2 items-start">
                                    <div className="flex-1 flex gap-2 flex-wrap items-center min-h-[32px] bg-zinc-900 border border-zinc-600 rounded-lg px-2 py-1.5">
                                        {tags.map(tag => (
                                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs border border-purple-500/30">
                                                @{tag}
                                                <button onClick={() => handleRemoveTag(tag)} className="hover:text-white text-purple-300">×</button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                            placeholder="Type tag and press Enter or click +"
                                            className="flex-1 min-w-[120px] bg-transparent border-none text-xs text-white placeholder-zinc-500 focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddTag}
                                        disabled={!tagInput.trim()}
                                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step Editor (when action selected) */}
                    {selectedAction && (
                        <StepEditor
                            action={selectedAction}
                            step={editingStep || undefined}
                            onSave={handleStepSave}
                            onCancel={() => { setSelectedAction(null); setEditingStep(null); }}
                            suggestedKeyword={getSuggestedKeyword()}
                        />
                    )}

                    {/* Steps List */}
                    <StepCanvas
                        steps={steps}
                        onStepsChange={setSteps}
                        onEditStep={handleEditStep}
                        onDeleteStep={handleDeleteStep}
                    />

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleClear}
                            disabled={steps.length === 0}
                            className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50"
                        >
                            Clear All
                        </button>
                        <div className="flex-1" />
                        <button
                            onClick={handleSave}
                            disabled={saving || !featureName || !scenarioName || steps.length === 0}
                            className="px-4 py-2 bg-zinc-700 text-white rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Saving...
                                </>
                            ) : (
                                <>💾 Save Scenario</>
                            )}
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={generating || !featureName || !scenarioName || steps.length === 0}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {generating ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Generating...
                                </>
                            ) : (
                                <>📄 Generate Feature File</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right: Gherkin Preview */}
                <div className="w-[300px] flex-shrink-0">
                    <GherkinPreview
                        featureName={featureName}
                        scenarioName={scenarioName}
                        description={description}
                        priority={priority}
                        accessLevel={accessLevel}
                        tags={tags}
                        steps={steps}
                    />
                </div>
            </div>
        </div>
    );
}
