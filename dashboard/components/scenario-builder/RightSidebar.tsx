'use client';

import { useState } from 'react';
import { ScenarioSettings } from './ScenarioSettings';
import { GherkinPreview } from './GherkinPreview';
import { Priority, AccessLevel, ScenarioStep } from '@/lib/scenario-types';

interface RightSidebarProps {
    // Settings Props
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

    // Preview Props
    description: string;
    steps: ScenarioStep[];
}

export function RightSidebar(props: RightSidebarProps) {
    const [activeTab, setActiveTab] = useState<'settings' | 'preview'>('settings');

    return (
        <div className="flex flex-col h-full bg-zinc-900/50 border-l border-zinc-700 w-[350px]">
            {/* Tabs */}
            <div className="flex border-b border-zinc-700">
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'settings'
                            ? 'text-white'
                            : 'text-zinc-400 hover:text-zinc-300'
                        }`}
                >
                    Settings
                    {activeTab === 'settings' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'preview'
                            ? 'text-white'
                            : 'text-zinc-400 hover:text-zinc-300'
                        }`}
                >
                    Preview
                    {activeTab === 'preview' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'settings' ? (
                    <ScenarioSettings
                        featureName={props.featureName}
                        setFeatureName={props.setFeatureName}
                        scenarioName={props.scenarioName}
                        setScenarioName={props.setScenarioName}
                        priority={props.priority}
                        setPriority={props.setPriority}
                        accessLevel={props.accessLevel}
                        setAccessLevel={props.setAccessLevel}
                        tags={props.tags}
                        tagInput={props.tagInput}
                        setTagInput={props.setTagInput}
                        onAddTag={props.onAddTag}
                        onRemoveTag={props.onRemoveTag}
                    />
                ) : (
                    <GherkinPreview
                        featureName={props.featureName}
                        scenarioName={props.scenarioName}
                        description={props.description}
                        priority={props.priority}
                        accessLevel={props.accessLevel}
                        tags={props.tags}
                        steps={props.steps}
                    />
                )}
            </div>
        </div>
    );
}
