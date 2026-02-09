'use client';

/**
 * ActionPalette - Sidebar with available actions grouped by category
 */

import { useState, useEffect } from 'react';
import { ActionDefinition, ActionCategory, CATEGORY_INFO } from '@/lib/action-library';

interface ActionCategoryGroup {
    id: ActionCategory;
    label: string;
    icon: string;
    description: string;
    actions: ActionDefinition[];
}

interface ActionPaletteProps {
    onActionSelect: (action: ActionDefinition) => void;
    selectedActionId?: string;
}

export function ActionPalette({ onActionSelect, selectedActionId }: ActionPaletteProps) {
    const [categories, setCategories] = useState<ActionCategoryGroup[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['navigation', 'interaction', 'input']));
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActions();
    }, []);

    const fetchActions = async () => {
        try {
            const res = await fetch('/api/actions');
            if (res.ok) {
                const data = await res.json();
                setCategories(data.categories);
            }
        } catch (error) {
            console.error('Failed to fetch actions:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const filteredCategories = categories.map(category => ({
        ...category,
        actions: category.actions.filter(action =>
            action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            action.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.actions.length > 0);

    if (loading) {
        return (
            <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl p-4 h-full">
                <div className="animate-pulse space-y-3">
                    <div className="h-8 bg-zinc-700 rounded"></div>
                    <div className="h-6 bg-zinc-700 rounded w-3/4"></div>
                    <div className="h-6 bg-zinc-700 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl flex flex-col h-full">
            {/* Header */}
            <div className="p-3 border-b border-zinc-700">
                <h3 className="text-sm font-semibold text-white mb-2">Actions</h3>
                <input
                    type="text"
                    placeholder="Search actions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
            </div>

            {/* Categories */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredCategories.map(category => (
                    <div key={category.id}>
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(category.id)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-zinc-700/50 rounded-lg transition-colors group"
                        >
                            <span className="text-sm">{category.icon}</span>
                            <span className="text-xs font-medium text-zinc-300 flex-1">{category.label}</span>
                            <span className="text-xs text-zinc-500">{category.actions.length}</span>
                            <svg
                                className={`w-3 h-3 text-zinc-500 transition-transform ${expandedCategories.has(category.id) ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* Actions */}
                        {expandedCategories.has(category.id) && (
                            <div className="ml-4 space-y-0.5 mt-1">
                                {category.actions.map(action => (
                                    <button
                                        key={action.id}
                                        onClick={() => onActionSelect(action)}
                                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-lg transition-all text-xs group ${selectedActionId === action.id
                                                ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-400'
                                                : 'hover:bg-zinc-700/50 text-zinc-400 hover:text-white'
                                            }`}
                                        title={action.description}
                                    >
                                        <span>{action.icon}</span>
                                        <span className="truncate">{action.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-zinc-700">
                <p className="text-xs text-zinc-500 text-center">
                    Click to add action
                </p>
            </div>
        </div>
    );
}
