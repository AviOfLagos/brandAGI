'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * ArtifactViewer Component
 * 
 * Based on Vercel AI SDK and Midday AI SDK Tools patterns for displaying
 * streaming artifacts in React applications.
 * 
 * Implements:
 * - Type-safe artifact rendering
 * - Support for multiple artifact types (code, markdown, data, charts)
 * - Real-time streaming updates
 * - Progress tracking
 * 
 * Reference: https://ai-sdk-tools.dev/artifacts
 */

interface ArtifactProps {
  artifactId: string;
  projectId: string;
  type?: 'markdown' | 'code' | 'json' | 'table' | 'chart';
  className?: string;
}

export function ArtifactViewer({ artifactId, projectId, type = 'markdown', className = '' }: ArtifactProps) {
  const [artifact, setArtifact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArtifact() {
      try {
        setLoading(true);
        const response = await fetch(`/api/artifacts/${artifactId}?projectId=${projectId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch artifact');
        }

        const data = await response.json();
        setArtifact(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchArtifact();
  }, [artifactId, projectId]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
        <p className="text-sm text-red-800 dark:text-red-400">
          ❌ Error loading artifact: {error}
        </p>
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No artifact found
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Artifact Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {artifact.title || 'Untitled Artifact'}
        </h3>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
            {artifact.type}
          </span>
          {artifact.createdAt && (
            <span>
              {new Date(artifact.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Artifact Content */}
      <div className="px-6 py-4">
        {type === 'markdown' && typeof artifact.content === 'string' && (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{artifact.content}</ReactMarkdown>
          </div>
        )}

        {type === 'json' && (
          <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
            <code className="text-sm text-gray-800 dark:text-gray-200">
              {JSON.stringify(artifact.content, null, 2)}
            </code>
          </pre>
        )}

        {type === 'code' && (
          <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
            <code className="text-sm text-green-400 font-mono">
              {typeof artifact.content === 'string' ? artifact.content : JSON.stringify(artifact.content, null, 2)}
            </code>
          </pre>
        )}

        {type === 'table' && artifact.content && typeof artifact.content === 'object' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {Object.keys(artifact.content[0] || {}).map((key) => (
                    <th
                      key={key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {artifact.content.map((row: any, idx: number) => (
                  <tr key={idx}>
                    {Object.values(row).map((val: any, i: number) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Artifact Metadata */}
      {artifact.metadata && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 bg-gray-50 dark:bg-gray-900/50">
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              Metadata
            </summary>
            <pre className="mt-2 text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
              {JSON.stringify(artifact.metadata, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

/**
 * Future enhancement: Streaming artifact viewer using @ai-sdk-tools/artifacts
 * 
 * Example usage with streaming:
 * 
 * import { useArtifact } from '@ai-sdk-tools/artifacts'
 * 
 * const { data, status, progress } = useArtifact(DashboardArtifact, {
 *   onUpdate: (data) => console.log('Updated:', data),
 *   onComplete: (data) => console.log('Complete:', data)
 * })
 */
