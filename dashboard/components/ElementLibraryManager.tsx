'use client';

/**
 * ElementLibraryManager - Komponen untuk mengelola element library
 * Fitur: view, search, edit, delete saved elements
 */

import { useState, useEffect } from 'react';
import { SavedElement } from '@/lib/scenario-types';

export function ElementLibraryManager() {
    const [elements, setElements] = useState<SavedElement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPage, setFilterPage] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingElement, setEditingElement] = useState<SavedElement | null>(null);

    useEffect(() => {
        fetchElements();
    }, []);

    const fetchElements = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/elements');
            if (res.ok) {
                const data = await res.json();
                setElements(data.elements || []);
            }
        } catch (error) {
            console.error('Failed to fetch elements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus element ini?')) return;

        try {
            const res = await fetch(`/api/elements?id=${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                await fetchElements();
            }
        } catch (error) {
            console.error('Failed to delete element:', error);
        }
    };

    const handleEdit = (element: SavedElement) => {
        setEditingElement(element);
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editingElement) return;

        try {
            const res = await fetch('/api/elements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingElement)
            });

            if (res.ok) {
                await fetchElements();
                setShowEditModal(false);
                setEditingElement(null);
            }
        } catch (error) {
            console.error('Failed to update element:', error);
        }
    };

    const filteredElements = elements.filter(el => {
        const matchesSearch = el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            el.selector.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPage = !filterPage || el.pageUrl?.includes(filterPage);
        return matchesSearch && matchesPage;
    });

    const uniquePages = Array.from(new Set(elements.map(el => el.pageUrl).filter(Boolean)));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-zinc-400">Memuat element library...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header & Stats */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">📚 Element Library</h2>
                    <p className="text-sm text-zinc-400 mt-1">
                        Kelola semua element yang tersimpan untuk digunakan kembali
                    </p>
                </div>
                <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg px-4 py-2">
                    <div className="text-2xl font-bold text-emerald-400">{elements.length}</div>
                    <div className="text-xs text-zinc-400">Total Elements</div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-3">
                <div className="flex-1">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 Cari element berdasarkan nama atau selector..."
                        className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                    />
                </div>
                <select
                    value={filterPage}
                    onChange={(e) => setFilterPage(e.target.value)}
                    className="bg-zinc-900 border border-zinc-600 rounded-lg px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                    <option value="">Semua Halaman</option>
                    {uniquePages.map(page => (
                        <option key={page} value={page}>{page}</option>
                    ))}
                </select>
            </div>

            {/* Elements Table */}
            {filteredElements.length === 0 ? (
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-12 text-center">
                    <div className="text-5xl mb-4">📦</div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                        {searchQuery || filterPage ? 'Tidak ada element yang cocok' : 'Belum ada element tersimpan'}
                    </h3>
                    <p className="text-sm text-zinc-400">
                        {searchQuery || filterPage
                            ? 'Coba ubah filter atau pencarian Anda'
                            : 'Simpan element dari Builder untuk digunakan kembali'}
                    </p>
                </div>
            ) : (
                <div className="bg-zinc-800 border border-zinc-600 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-zinc-900 border-b border-zinc-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">Nama</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">Selector</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">Tipe</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">Halaman</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-700">
                            {filteredElements.map(element => (
                                <tr key={element.id} className="hover:bg-zinc-700/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-medium text-white">{element.name}</div>
                                        {element.description && (
                                            <div className="text-xs text-zinc-400 mt-1">{element.description}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <code className="text-xs text-emerald-400 bg-zinc-900 px-2 py-1 rounded">
                                            {element.selector}
                                        </code>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700">
                                            {element.selectorType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {element.pageUrl ? (
                                            <a
                                                href={element.pageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-400 hover:underline"
                                            >
                                                {new URL(element.pageUrl).pathname}
                                            </a>
                                        ) : (
                                            <span className="text-xs text-zinc-500">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => handleEdit(element)}
                                                className="px-3 py-1 text-xs bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 transition-colors"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(element.id)}
                                                className="px-3 py-1 text-xs bg-red-900/30 text-red-400 border border-red-700 rounded hover:bg-red-900/50 transition-colors"
                                            >
                                                🗑️ Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingElement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEditModal(false)}>
                    <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-white mb-4">✏️ Edit Element</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">
                                    Nama Element <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editingElement.name}
                                    onChange={(e) => setEditingElement({ ...editingElement, name: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">
                                    Selector <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editingElement.selector}
                                    onChange={(e) => setEditingElement({ ...editingElement, selector: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Tipe Selector</label>
                                <select
                                    value={editingElement.selectorType}
                                    onChange={(e) => setEditingElement({ ...editingElement, selectorType: e.target.value as any })}
                                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                                >
                                    <option value="css">CSS Selector</option>
                                    <option value="xpath">XPath</option>
                                    <option value="text">Text Locator</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">URL Halaman</label>
                                <input
                                    type="url"
                                    value={editingElement.pageUrl || ''}
                                    onChange={(e) => setEditingElement({ ...editingElement, pageUrl: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Deskripsi</label>
                                <textarea
                                    value={editingElement.description || ''}
                                    onChange={(e) => setEditingElement({ ...editingElement, description: e.target.value })}
                                    rows={2}
                                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={!editingElement.name || !editingElement.selector}
                                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
