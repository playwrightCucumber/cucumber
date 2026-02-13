'use client';

import { Priority, AccessLevel } from '@/lib/scenario-types';

interface ScenarioSettingsProps {
    featureName: string;
    setFeatureName: (name: string) => void;
    scenarioName: string;
    setScenarioName: (name: string) => void;
    priority: Priority;
    setPriority: (priority: Priority) => void;
    accessLevel: AccessLevel;
    setAccessLevel: (level: AccessLevel) => void;
    tags: string[];
    tagInput: string;
    setTagInput: (input: string) => void;
    onAddTag: () => void;
    onRemoveTag: (tag: string) => void;
}

export function ScenarioSettings({
    featureName,
    setFeatureName,
    scenarioName,
    setScenarioName,
    priority,
    setPriority,
    accessLevel,
    setAccessLevel,
    tags,
    tagInput,
    setTagInput,
    onAddTag,
    onRemoveTag
}: ScenarioSettingsProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Feature Name *</label>
                    <input
                        type="text"
                        value={featureName}
                        onChange={(e) => setFeatureName(e.target.value)}
                        placeholder="e.g., User Login"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Scenario Name *</label>
                    <input
                        type="text"
                        value={scenarioName}
                        onChange={(e) => setScenarioName(e.target.value)}
                        placeholder="e.g., Login with valid credentials"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">Priority</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['p0', 'p1', 'p2'] as Priority[]).map(p => (
                            <button
                                key={p}
                                onClick={() => setPriority(p)}
                                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all border ${priority === p
                                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
                                    }`}
                            >
                                {p.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">Access Level</label>
                    <div className="grid grid-cols-2 gap-2">
                        {(['public', 'authenticated'] as AccessLevel[]).map(a => (
                            <button
                                key={a}
                                onClick={() => setAccessLevel(a)}
                                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all border capitalize ${accessLevel === a
                                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
                                    }`}
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Tags</label>
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddTag())}
                            placeholder="Add tag..."
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none transition-colors"
                        />
                        <button
                            onClick={onAddTag}
                            disabled={!tagInput.trim()}
                            className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            +
                        </button>
                    </div>

                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                            {tags.map(tag => (
                                <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-md text-xs border border-purple-500/20">
                                    @{tag}
                                    <button
                                        onClick={() => onRemoveTag(tag)}
                                        className="hover:text-purple-200 transition-colors ml-0.5"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
