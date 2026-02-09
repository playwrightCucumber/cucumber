'use client';

import { useState, useEffect } from 'react';
import { ParsedFeature, ParsedScenario } from '@/lib/feature-parser';

interface FeatureFile {
  id: string;
  path: string;
  name: string;
  directory: string;
  size: number;
  modified: string;
}

interface FeatureFileBrowserProps {
  onSelectScenario?: (feature: ParsedFeature, scenario: ParsedScenario) => void;
}

export default function FeatureFileBrowser({ onSelectScenario }: FeatureFileBrowserProps) {
  const [files, setFiles] = useState<FeatureFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<FeatureFile | null>(null);
  const [parsedFeature, setParsedFeature] = useState<ParsedFeature | null>(null);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load feature files on mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/features');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load feature files');
      }

      setFiles(data.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const parseFile = async (file: FeatureFile) => {
    setParsing(true);
    setError(null);
    setSelectedFile(file);

    try {
      const response = await fetch('/api/features/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: file.path })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse feature file');
      }

      setParsedFeature(data.feature);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setParsedFeature(null);
    } finally {
      setParsing(false);
    }
  };

  const handleSelectScenario = (scenario: ParsedScenario) => {
    if (parsedFeature && onSelectScenario) {
      onSelectScenario(parsedFeature, scenario);
    }
  };

  // Filter files by search query
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group files by directory
  const groupedFiles = filteredFiles.reduce((acc, file) => {
    const dir = file.directory || 'root';
    if (!acc[dir]) acc[dir] = [];
    acc[dir].push(file);
    return acc;
  }, {} as Record<string, FeatureFile[]>);

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
      {/* File List - Left Panel */}
      <div className="col-span-4 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Feature Files</h3>
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {!loading && (
            <div className="text-xs text-gray-500 mt-2">
              {filteredFiles.length} of {files.length} files
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && !parsedFeature && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading && Object.keys(groupedFiles).length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No feature files found
            </div>
          )}

          {!loading && Object.entries(groupedFiles).map(([dir, dirFiles]) => (
            <div key={dir} className="mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1 mb-1">
                📁 {dir}
              </div>
              {dirFiles.map(file => (
                <button
                  key={file.id}
                  onClick={() => parseFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedFile?.id === file.id
                      ? 'bg-blue-50 border border-blue-200 text-blue-900'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="font-medium truncate">{file.name.replace('.feature', '')}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(file.modified).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Feature Details - Right Panel */}
      <div className="col-span-8 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
        {!selectedFile && (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Select a feature file to view details</p>
            </div>
          </div>
        )}

        {selectedFile && parsing && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Parsing feature file...</p>
            </div>
          </div>
        )}

        {selectedFile && !parsing && error && !parsedFeature && (
          <div className="p-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          </div>
        )}

        {parsedFeature && (
          <>
            {/* Feature Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{parsedFeature.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{parsedFeature.filePath}</p>
                </div>
              </div>

              {parsedFeature.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {parsedFeature.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {parsedFeature.description.length > 0 && (
                <div className="text-sm text-gray-600 space-y-1">
                  {parsedFeature.description.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}

              {parsedFeature.background && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="font-semibold text-sm text-yellow-900 mb-2">📋 Background</div>
                  <div className="space-y-1">
                    {parsedFeature.background.steps.map((step, i) => (
                      <div key={i} className="text-sm text-gray-700">
                        <span className="font-medium text-yellow-700">{step.keyword}</span> {step.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Scenarios List */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Scenarios ({parsedFeature.scenarios.length})
              </h3>

              <div className="space-y-4">
                {parsedFeature.scenarios.map((scenario, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors">
                    <div className="p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase">
                              {scenario.type}
                            </span>
                            {scenario.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {scenario.tags.map(tag => (
                                  <span key={tag} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900">{scenario.name}</h4>
                        </div>
                        <button
                          onClick={() => handleSelectScenario(scenario)}
                          className="ml-4 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
                        >
                          Load to Builder
                        </button>
                      </div>

                      <div className="mt-3 space-y-1">
                        {scenario.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="text-sm font-mono text-gray-700">
                            <span className="font-bold text-emerald-600">{step.keyword}</span> {step.text}
                          </div>
                        ))}
                      </div>

                      {scenario.examples && (
                        <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Examples</div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                              <thead>
                                <tr className="bg-gray-50">
                                  {scenario.examples.headers.map((header, i) => (
                                    <th key={i} className="px-2 py-1 text-left font-semibold text-gray-700 border border-gray-200">
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {scenario.examples.rows.map((row, rowIndex) => (
                                  <tr key={rowIndex} className="hover:bg-gray-50">
                                    {row.map((cell, cellIndex) => (
                                      <td key={cellIndex} className="px-2 py-1 text-gray-600 border border-gray-200">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
