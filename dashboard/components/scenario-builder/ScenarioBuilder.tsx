'use client';

/**
 * ScenarioBuilder - Main component for no-code scenario creation
 */

import { useState, useCallback, useEffect } from 'react';
import { ActionPalette } from './ActionPalette';
import { StepEditor } from './StepEditor';
import { StepCanvas } from './StepCanvas';
import { GherkinPreview } from './GherkinPreview';
import FreeTextStepInput from './FreeTextStepInput';
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
                {/* Left: Action Palette (only in action-library mode) */}
                {editorMode === 'action-library' && (
                    <div className="w-[220px] flex-shrink-0">
                        <ActionPalette
                            onActionSelect={handleActionSelect}
                            selectedActionId={selectedAction?.id}
                        />
                    </div>
                )}

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

                    {/* Mode Toggle */}
                    <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl p-4">
                        <label className="block text-xs font-medium text-zinc-400 mb-2">Step Input Mode</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleModeChange('action-library')}
                                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    editorMode === 'action-library'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-zinc-700 text-zinc-400 hover:text-white'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span>🎯</span>
                                    <span>Action Library</span>
                                </div>
                                <div className="text-xs opacity-75 mt-1">No-code templates</div>
                            </button>
                            <button
                                onClick={() => handleModeChange('free-text')}
                                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    editorMode === 'free-text'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-zinc-700 text-zinc-400 hover:text-white'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span>✍️</span>
                                    <span>Free Text</span>
                                </div>
                                <div className="text-xs opacity-75 mt-1">Type step text</div>
                            </button>
                        </div>
                    </div>

                    {/* Step Editor (when action selected - action-library mode) */}
                    {editorMode === 'action-library' && selectedAction && (
                        <StepEditor
                            action={selectedAction}
                            step={editingStep || undefined}
                            onSave={handleStepSave}
                            onCancel={() => { setSelectedAction(null); setEditingStep(null); }}
                            suggestedKeyword={getSuggestedKeyword()}
                        />
                    )}

                    {/* Free Text Step Input */}
                    {editorMode === 'free-text' && (
                        <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-white mb-3">
                                {editingStep ? 'Edit Step' : 'Add Step'}
                            </h3>
                            
                            <div className="space-y-3">
                                {/* Keyword Selector */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-2">Keyword</label>
                                    <div className="flex gap-2">
                                        {(['Given', 'When', 'Then', 'And', 'But'] as StepKeyword[]).map((kw) => (
                                            <button
                                                key={kw}
                                                onClick={() => setFreeTextKeyword(kw)}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                                    freeTextKeyword === kw
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-zinc-700 text-zinc-400 hover:text-white'
                                                }`}
                                            >
                                                {kw}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Free Text Input with Autocomplete */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                                        Step Text *
                                    </label>
                                    <FreeTextStepInput
                                        value={freeTextValue}
                                        stepType={freeTextKeyword === 'And' || freeTextKeyword === 'But' ? 'Given' : freeTextKeyword}
                                        onChange={setFreeTextValue}
                                        onValidationChange={setFreeTextValid}
                                        placeholder="Start typing step text..."
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-2">
                                    {editingStep && (
                                        <button
                                            onClick={() => {
                                                setEditingStep(null);
                                                setFreeTextValue('');
                                                setFreeTextKeyword(getSuggestedKeyword());
                                            }}
                                            className="px-4 py-2 bg-zinc-700 text-white rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button
                                        onClick={handleAddFreeTextStep}
                                        disabled={!freeTextValue.trim() || !freeTextValid}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {editingStep ? '✓ Update Step' : '➕ Add Step'}
                                    </button>
                                </div>
                            </div>
                        </div>
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
                        {loadedFilePath ? (
                            <button
                                onClick={handleSaveToFile}
                                disabled={saving || !featureName || !scenarioName || steps.length === 0}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        Saving...
                                    </>
                                ) : (
                                    <>💾 Save to File</>
                                )}
                            </button>
                        ) : (
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
                        )}
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
