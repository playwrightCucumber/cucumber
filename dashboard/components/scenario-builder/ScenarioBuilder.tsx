'use client';

/**
 * ScenarioBuilder - Main component for no-code scenario creation
 */

import { useState, useCallback, useEffect } from 'react';
import { ActionPalette } from './ActionPalette';
import { StepEditor } from './StepEditor';
import { StepCanvas } from './StepCanvas';
import FreeTextStepInput from './FreeTextStepInput';
import { RightSidebar } from './RightSidebar';
import { ActionDefinition } from '@/lib/action-library';
import { ScenarioStep, Priority, AccessLevel, StepKeyword, CustomScenario } from '@/lib/scenario-types';
import { ParsedFeature, ParsedScenario } from '@/lib/feature-parser';

type EditorMode = 'action-library' | 'free-text';

interface ScenarioBuilderProps {
    onScenarioSaved?: (scenario: CustomScenario) => void;
    loadedScenario?: { feature: ParsedFeature; scenario: ParsedScenario } | null;
}

export function ScenarioBuilder({ onScenarioSaved, loadedScenario }: ScenarioBuilderProps) {
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
    const [editorMode, setEditorMode] = useState<EditorMode>('action-library');
    const [selectedAction, setSelectedAction] = useState<ActionDefinition | null>(null);
    const [editingStep, setEditingStep] = useState<ScenarioStep | null>(null);

    // Free-text editor state
    const [freeTextKeyword, setFreeTextKeyword] = useState<StepKeyword>('Given');
    const [freeTextValue, setFreeTextValue] = useState('');
    const [freeTextValid, setFreeTextValid] = useState(true);

    // UI state
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Track loaded scenario source for save-to-file
    const [loadedFilePath, setLoadedFilePath] = useState<string | null>(null);
    const [originalScenarioName, setOriginalScenarioName] = useState<string | null>(null);

    // Load scenario from parsed feature file
    useEffect(() => {
        if (!loadedScenario) return;

        const { feature, scenario } = loadedScenario;

        // Track source file for save-to-file
        setLoadedFilePath(feature.filePath);
        setOriginalScenarioName(scenario.name);

        // Set feature/scenario names
        setFeatureName(feature.name);
        setScenarioName(scenario.name);

        // Extract priority from tags (@p0, @p1, @p2)
        const allTags = [...feature.tags, ...scenario.tags];
        const priorityTag = allTags.find(tag => tag.match(/@p[012]/));
        if (priorityTag) {
            setPriority(priorityTag.replace('@', '') as Priority);
        }

        // Extract access level (@public, @authenticated)
        const accessTag = allTags.find(tag => tag.match(/@(public|authenticated)/));
        if (accessTag) {
            setAccessLevel(accessTag.replace('@', '') as AccessLevel);
        }

        // Set tags (filter out priority and access level tags)
        const scenarioTags = allTags.filter(tag =>
            !tag.match(/@p[012]/) && !tag.match(/@(public|authenticated)/)
        );
        setTags(scenarioTags);

        // Convert parsed steps to ScenarioSteps
        const convertedSteps: ScenarioStep[] = scenario.steps.map(step => ({
            id: crypto.randomUUID(),
            keyword: step.keyword,
            text: step.text
        }));
        setSteps(convertedSteps);

        // Switch to free-text mode for better editing
        setEditorMode('free-text');

        // Show success message
        setMessage({
            type: 'success',
            text: `Loaded: ${scenario.name} (${scenario.steps.length} steps)`
        });
        setTimeout(() => setMessage(null), 5000);
    }, [loadedScenario]);

    const getSuggestedKeyword = useCallback((): StepKeyword => {
        if (steps.length === 0) return 'Given';
        const lastStep = steps[steps.length - 1];
        if (lastStep.keyword === 'Given') return 'When';
        if (lastStep.keyword === 'When') return 'Then';
        return 'And';
    }, [steps]);

    const handleModeChange = (mode: EditorMode) => {
        setEditorMode(mode);
        setSelectedAction(null);
        setEditingStep(null);
        setFreeTextValue('');
        setFreeTextKeyword(getSuggestedKeyword());
    };

    const handleActionSelect = (action: ActionDefinition) => {
        setSelectedAction(action);
        setEditingStep(null);
    };

    const handleAddFreeTextStep = () => {
        if (!freeTextValue.trim() || !freeTextValid) return;

        if (editingStep) {
            // Update existing free-text step
            setSteps(prev => prev.map(s =>
                s.id === editingStep.id
                    ? { ...s, keyword: freeTextKeyword, text: freeTextValue.trim() }
                    : s
            ));
            setEditingStep(null);
        } else {
            // Add new free-text step
            const newStep: ScenarioStep = {
                id: crypto.randomUUID(),
                keyword: freeTextKeyword,
                text: freeTextValue.trim()
            };
            setSteps(prev => [...prev, newStep]);
        }

        setFreeTextValue('');
        setFreeTextKeyword(getSuggestedKeyword());
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

        // Free-text step
        if (step.text) {
            setEditorMode('free-text');
            setFreeTextKeyword(step.keyword);
            setFreeTextValue(step.text);
            setSelectedAction(null);
            return;
        }

        // Action-based step
        if (step.actionId) {
            setEditorMode('action-library');
            // Find the action for this step
            import('@/lib/action-library').then(({ getActionById }) => {
                const action = getActionById(step.actionId!);
                if (action) setSelectedAction(action);
            });
        }
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

    const handleSaveToFile = async () => {
        if (!featureName || !scenarioName || steps.length === 0) {
            setMessage({ type: 'error', text: 'Please fill in feature name, scenario name, and add at least one step' });
            return;
        }

        if (!loadedFilePath || !originalScenarioName) {
            setMessage({ type: 'error', text: 'No source file to save to. Use "Save Scenario" instead.' });
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
            // Prepare feature-level tags (priority + access level + feature tags)
            const featureTags = [
                `@${priority}`,
                `@${accessLevel}`,
            ];

            // Convert steps to format expected by parser
            const updatedSteps = steps.map(step => ({
                keyword: step.keyword,
                text: step.text
            }));

            const res = await fetch('/api/features/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filePath: loadedFilePath,
                    scenarioName: originalScenarioName,
                    updatedScenario: {
                        name: scenarioName,
                        tags: finalTags,
                        steps: updatedSteps,
                        featureTags
                    }
                })
            });

            if (res.ok) {
                const result = await res.json();
                setMessage({ type: 'success', text: `Saved to ${loadedFilePath}!` });
                // Update original scenario name if it changed
                setOriginalScenarioName(scenarioName);
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.error || 'Failed to save to file' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save to file' });
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

            // Now generate Feature file
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
        <div className="h-full flex overflow-hidden">
            {/* Left Sidebar - Actions */}
            {editorMode === 'action-library' && (
                <div className="w-[280px] bg-zinc-900/50 border-r border-zinc-700 flex flex-col">
                    <ActionPalette
                        onActionSelect={handleActionSelect}
                        selectedActionId={selectedAction?.id}
                    />
                </div>
            )}

            {/* Center - Playground */}
            <div className="flex-1 flex flex-col min-w-0 bg-zinc-950/50 relative">
                {/* Message Overlay */}
                {message && (
                    <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-md ${message.type === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Toolbar / Input Area */}
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 backdrop-blur-sm">
                    {/* Mode Switcher */}
                    <div className="flex justify-center mb-4">
                        <div className="bg-zinc-800 p-1 rounded-lg inline-flex">
                            <button
                                onClick={() => handleModeChange('action-library')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${editorMode === 'action-library'
                                        ? 'bg-zinc-600 text-white shadow-sm'
                                        : 'text-zinc-400 hover:text-white'
                                    }`}
                            >
                                🎯 Action Library
                            </button>
                            <button
                                onClick={() => handleModeChange('free-text')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${editorMode === 'free-text'
                                        ? 'bg-zinc-600 text-white shadow-sm'
                                        : 'text-zinc-400 hover:text-white'
                                    }`}
                            >
                                ✍️ Free Text
                            </button>
                        </div>
                    </div>

                    {/* Step Editor (within center column) */}
                    {editorMode === 'action-library' && selectedAction && (
                        <div className="max-w-3xl mx-auto">
                            <StepEditor
                                action={selectedAction}
                                step={editingStep || undefined}
                                onSave={handleStepSave}
                                onCancel={() => { setSelectedAction(null); setEditingStep(null); }}
                                suggestedKeyword={getSuggestedKeyword()}
                            />
                        </div>
                    )}

                    {/* Free Text Input */}
                    {editorMode === 'free-text' && (
                        <div className="max-w-3xl mx-auto space-y-3">
                            {/* Keyword & Input Row */}
                            <div className="flex items-start gap-2">
                                <select
                                    value={freeTextKeyword}
                                    onChange={(e) => setFreeTextKeyword(e.target.value as StepKeyword)}
                                    className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 min-w-[90px]"
                                >
                                    {['Given', 'When', 'Then', 'And', 'But'].map(kw => (
                                        <option key={kw} value={kw}>{kw}</option>
                                    ))}
                                </select>
                                <div className="flex-1">
                                    <FreeTextStepInput
                                        value={freeTextValue}
                                        stepType={freeTextKeyword === 'And' || freeTextKeyword === 'But' ? 'Given' : freeTextKeyword}
                                        onChange={setFreeTextValue}
                                        onValidationChange={setFreeTextValid}
                                        placeholder="Start typing step..."
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        if (editingStep) {
                                            setEditingStep(null);
                                            setFreeTextValue('');
                                        }
                                        // Reset logic handled in handler if adding new
                                        if (!editingStep) {
                                            if (!freeTextValue.trim() || !freeTextValid) return;
                                            // Add new free-text step logic duplicated here for inline button
                                            const newStep: ScenarioStep = {
                                                id: crypto.randomUUID(),
                                                keyword: freeTextKeyword,
                                                text: freeTextValue.trim()
                                            };
                                            setSteps(prev => [...prev, newStep]);
                                            setFreeTextValue('');
                                            setFreeTextKeyword(getSuggestedKeyword());
                                        }
                                    }}
                                    disabled={!freeTextValue.trim() || !freeTextValid}
                                    className="p-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>

                            {/* Edit Mode Cancel */}
                            {editingStep && (
                                <div className="flex justify-end gap-2">
                                    <span className="text-xs text-zinc-400 self-center">Editing step...</span>
                                    <button
                                        onClick={() => {
                                            setEditingStep(null);
                                            setFreeTextValue('');
                                        }}
                                        className="text-xs text-red-400 hover:text-red-300"
                                    >
                                        Cancel Edit
                                    </button>
                                    <button
                                        onClick={handleAddFreeTextStep}
                                        disabled={!freeTextValue.trim() || !freeTextValid}
                                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Main Canvas - Full Height */}
                <div className="flex-1 overflow-y-auto p-4 content-start custom-scrollbar">
                    <div className="max-w-3xl mx-auto h-full flex flex-col">
                        <StepCanvas
                            steps={steps}
                            onStepsChange={setSteps}
                            onEditStep={handleEditStep}
                            onDeleteStep={handleDeleteStep}
                        />

                        {/* Action Footer */}
                        <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-800">
                            <button
                                onClick={handleClear}
                                disabled={steps.length === 0}
                                className="px-4 py-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                            >
                                Clear Steps
                            </button>

                            <div className="flex gap-2">
                                {loadedFilePath ? (
                                    <button
                                        onClick={handleSaveToFile}
                                        disabled={saving || !featureName || !scenarioName || steps.length === 0}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
                                    >
                                        {saving ? <span className="animate-spin">⏳</span> : '💾'} Save to File
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSave}
                                        disabled={saving || !featureName || !scenarioName || steps.length === 0}
                                        className="px-6 py-2 bg-zinc-700 text-white rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors flex items-center gap-2"
                                    >
                                        {saving ? <span className="animate-spin">⏳</span> : '💾'} Save Scenario
                                    </button>
                                )}

                                <button
                                    onClick={handleGenerate}
                                    disabled={generating || !featureName || !scenarioName || steps.length === 0}
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                                >
                                    {generating ? <span className="animate-spin">⏳</span> : '⚡'} Generate Feature File
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Settings & Preview */}
            <RightSidebar
                featureName={featureName}
                setFeatureName={setFeatureName}
                scenarioName={scenarioName}
                setScenarioName={setScenarioName}
                priority={priority}
                setPriority={setPriority}
                accessLevel={accessLevel}
                setAccessLevel={setAccessLevel}
                tags={tags}
                tagInput={tagInput}
                setTagInput={setTagInput}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                description={description}
                steps={steps}
            />
        </div>
    );
}
