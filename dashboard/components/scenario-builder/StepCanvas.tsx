'use client';

/**
 * StepCanvas - List of steps with drag-and-drop reordering
 */

import { useState } from 'react';
import { ScenarioStep } from '@/lib/scenario-types';
import { getActionById } from '@/lib/action-library';

interface StepCanvasProps {
    steps: ScenarioStep[];
    onStepsChange: (steps: ScenarioStep[]) => void;
    onEditStep: (step: ScenarioStep) => void;
    onDeleteStep: (stepId: string) => void;
}

export function StepCanvas({ steps, onStepsChange, onEditStep, onDeleteStep }: StepCanvasProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDragEnd = () => {
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            const newSteps = [...steps];
            const [draggedItem] = newSteps.splice(draggedIndex, 1);
            newSteps.splice(dragOverIndex, 0, draggedItem);
            onStepsChange(newSteps);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const getGherkinLine = (step: ScenarioStep): string => {
        const action = getActionById(step.actionId);
        if (!action) return `${step.keyword} Unknown action`;

        let line = action.gherkinTemplate;
        for (const [key, value] of Object.entries(step.parameters)) {
            line = line.replace(`{${key}}`, value);
        }
        return `${step.keyword} ${line}`;
    };

    if (steps.length === 0) {
        return (
            <div className="flex-1 bg-zinc-800/50 border border-dashed border-zinc-600 rounded-xl flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-700 flex items-center justify-center">
                        <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-medium text-zinc-300 mb-1">No steps yet</h3>
                    <p className="text-xs text-zinc-500">Select an action from the palette to add steps</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-zinc-800/80 border border-zinc-700 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-zinc-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Steps ({steps.length})</h3>
                <span className="text-xs text-zinc-500">Drag to reorder</span>
            </div>
            <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
                {steps.map((step, index) => {
                    const action = getActionById(step.actionId);
                    const isDragging = draggedIndex === index;
                    const isDragOver = dragOverIndex === index;

                    return (
                        <div
                            key={step.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-move ${isDragging ? 'opacity-50 bg-zinc-700' :
                                    isDragOver ? 'bg-emerald-900/30 border-t-2 border-emerald-500' :
                                        'bg-zinc-700/50 hover:bg-zinc-700'
                                }`}
                        >
                            {/* Drag handle */}
                            <div className="text-zinc-500 hover:text-zinc-300">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="9" cy="6" r="1.5" />
                                    <circle cx="15" cy="6" r="1.5" />
                                    <circle cx="9" cy="12" r="1.5" />
                                    <circle cx="15" cy="12" r="1.5" />
                                    <circle cx="9" cy="18" r="1.5" />
                                    <circle cx="15" cy="18" r="1.5" />
                                </svg>
                            </div>

                            {/* Step number */}
                            <span className="w-5 h-5 flex items-center justify-center bg-zinc-600 rounded text-xs text-zinc-300 font-medium">
                                {index + 1}
                            </span>

                            {/* Action icon */}
                            <span className="text-sm">{action?.icon || '❓'}</span>

                            {/* Step content */}
                            <div className="flex-1 min-w-0">
                                <code className="text-xs text-zinc-300 truncate block">{getGherkinLine(step)}</code>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onEditStep(step)}
                                    className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
                                    title="Edit step"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => onDeleteStep(step.id)}
                                    className="p-1 text-zinc-400 hover:text-red-400 rounded transition-colors"
                                    title="Delete step"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
