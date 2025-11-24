'use client';

import { useState, useEffect } from 'react';
import { ArtifactViewer } from '@/app/components/ArtifactViewer';

interface ArtifactsDisplayProps {
  projectId: string;
}

export function ArtifactsDisplay({ projectId }: ArtifactsDisplayProps) {
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/artifacts?projectId=${projectId}`);
        const data = await response.json();
        
        if (data.success) {
          setArtifacts(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch artifacts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtifacts();
    
    // Poll every 30 seconds for new artifacts
    const interval = setInterval(fetchArtifacts, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  if (loading && artifacts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (artifacts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Artifacts Yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Start the workflow to generate brand artifacts
          </p>
        </div>
      </div>
    );
  }

  // Group artifacts by type
  const groupedArtifacts = artifacts.reduce((acc, artifact) => {
    const type = artifact.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(artifact);
    return acc;
  }, {} as Record<string, any[]>);

  const typeIcons: Record<string, string> = {
    brand_profile: '🎨',
    strategy: '🎯',
    longform: '📝',
    shortform: '📱',
    calendar: '📅',
    industry_snapshot: '🔍',
    knowledge: '📚',
  };

  const typeNames: Record<string, string> = {
    brand_profile: 'Brand Profile',
    strategy: 'Content Strategy',
    longform: 'Long-form Content',
    shortform: 'Social Media Posts',
    calendar: 'Publishing Calendar',
    industry_snapshot: 'Industry Research',
    knowledge: 'Knowledge Base',
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📦 Generated Artifacts ({artifacts.length})
        </h2>

        {/* Artifact Type Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupedArtifacts).map(([type, items]) => (
            <div
              key={type}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => setSelectedArtifact(items[0].id)}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{typeIcons[type] || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {typeNames[type] || type}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Latest: {new Date(items[items.length - 1].createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Artifact Viewer */}
      {selectedArtifact && (
        <div className="relative">
          <button
            onClick={() => setSelectedArtifact(null)}
            className="absolute top-4 right-4 z-10 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
          >
            ✕ Close
          </button>
          <ArtifactViewer
            artifactId={selectedArtifact}
            projectId={projectId}
            type="json"
          />
        </div>
      )}

      {/* Recent Artifacts List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          Recent Artifacts
        </h3>
        <div className="space-y-2">
          {artifacts.slice(-5).reverse().map((artifact) => (
            <div
              key={artifact.id}
              onClick={() => setSelectedArtifact(artifact.id)}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xl">{typeIcons[artifact.type] || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {artifact.title || typeNames[artifact.type] || artifact.type}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Created by {artifact.createdBy} • {new Date(artifact.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
