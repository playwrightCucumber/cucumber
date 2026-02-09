'use client';

/**
 * GherkinPreview - Live preview of generated Gherkin syntax
 */

import { useMemo } from 'react';
import { ScenarioStep, Priority, AccessLevel } from '@/lib/scenario-types';
import { getActionById } from '@/lib/action-library';

interface GherkinPreviewProps {
    featureName: string;
    scenarioName: string;
    description?: string;
    priority: Priority;
    accessLevel: AccessLevel;
    tags: string[];
    steps: ScenarioStep[];
}

export function GherkinPreview({
    featureName,
    scenarioName,
    description,
    priority,
    accessLevel,
    tags,
    steps
}: GherkinPreviewProps) {
    const gherkinContent = useMemo(() => {
        const lines: string[] = [];

        // Tags
        const allTags = [
            `@${priority}`,
            ...tags.filter(t => t.trim()).map(t => t.startsWith('@') ? t : `@${t}`),
            `@${accessLevel}`
        ];
        lines.push(allTags.join(' '));

        // Feature
        lines.push(`Feature: ${featureName || 'Untitled Feature'}`);
        if (description) {
            lines.push(`  ${description}`);
        }
        lines.push('');

        // Scenario
        lines.push(`  Scenario: ${scenarioName || 'Untitled Scenario'}`);

        // Steps
        for (const step of steps) {
            // Free-text step
            if (step.text) {
                lines.push(`    ${step.keyword} ${step.text}`);
                continue;
            }
            
            // Action-based step
            if (step.actionId) {
                const action = getActionById(step.actionId);
                if (action) {
                    let line = action.gherkinTemplate;
                    if (step.parameters) {
                        for (const [key, value] of Object.entries(step.parameters)) {
                            line = line.replace(`{${key}}`, value);
                        }
                    }
                    lines.push(`    ${step.keyword} ${line}`);
                }
            }
        }

        return lines.join('\n');
    }, [featureName, scenarioName, description, priority, accessLevel, tags, steps]);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(gherkinContent);
            // Could add toast notification here
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    return (
        <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-zinc-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>📄</span>
                    Gherkin Preview
                </h3>
                <button
                    onClick={copyToClipboard}
                    className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-700 hover:bg-zinc-600 rounded transition-colors flex items-center gap-1"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                </button>
            </div>
            <div className="p-4 bg-zinc-900/50 overflow-x-auto">
                <pre className="text-xs font-mono leading-relaxed">
                    {gherkinContent.split('\n').map((line, i) => {
                        // Syntax highlighting
                        let className = 'text-zinc-400';
                        if (line.startsWith('@')) className = 'text-purple-400';
                        else if (line.startsWith('Feature:')) className = 'text-blue-400 font-semibold';
                        else if (line.trim().startsWith('Scenario:')) className = 'text-cyan-400 font-semibold';
                        else if (line.trim().match(/^(Given|When|Then|And|But)/)) {
                            className = 'text-emerald-400';
                        }

                        return (
                            <div key={i} className={className}>
                                {line || '\u00A0'}
                            </div>
                        );
                    })}
                </pre>
            </div>
        </div>
    );
}
