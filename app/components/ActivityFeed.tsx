'use client';

import { useEffect, useState, useRef } from 'react';

interface LogEvent {
  id: string;
  timestamp: string;
  agentName: string;
  eventType: string;
  payloadSummary: string;
  confidence: number | null;
  artifactId: string | null;
}

interface ActivityFeedProps {
  projectId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds, default 10000 (10 seconds)
  maxPolls?: number; // optional: stop after N polls to prevent infinite polling
}

export function ActivityFeed({ 
  projectId, 
  autoRefresh = true, 
  refreshInterval = 10000, // Changed from 3000 to 10000 (10 seconds)
  maxPolls
}: ActivityFeedProps) {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollCountRef = useRef(0);

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        `/api/logs?projectId=${projectId}&ownerVisible=true&limit=50`
      );
      const data = await response.json();

      if (data.success) {
        setLogs(data.data.logs);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch logs');
      }
    } catch (err) {
      setError('Failed to fetch activity logs');
      console.error(err);
    } finally {
      setIsLoading(false);
      pollCountRef.current += 1;
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLogs();

    if (autoRefresh) {
      const interval = setInterval(() => {
        // Check max polls using ref
        if (maxPolls && pollCountRef.current >= maxPolls) {
          console.log(`[ActivityFeed] Stopped polling after ${pollCountRef.current} requests`);
          clearInterval(interval);
          return;
        }
        fetchLogs();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [projectId, autoRefresh, refreshInterval, maxPolls]); // Removed pollCount from deps!

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'emit':
        return '📤';
      case 'error':
        return '❌';
      case 'decision':
        return '🤔';
      case 'complete':
        return '✅';
      default:
        return '📝';
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'emit':
        return 'text-blue-600 dark:text-blue-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'decision':
        return 'text-purple-600 dark:text-purple-400';
      case 'complete':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading activity...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <span className="text-3xl">📊</span>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          No activity yet. Start the workflow to see agent progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Activity Feed
        </h3>
        <span className="text-sm text-gray-500">
          {logs.length} {logs.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {logs.map((log, index) => (
          <div
            key={log.id}
            className="group relative p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
          >
            {/* Timeline connector */}
            {index < logs.length - 1 && (
              <div className="absolute left-[30px] top-[60px] w-0.5 h-6 bg-gray-200 dark:bg-gray-700"></div>
            )}

            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center text-xl">
                {getEventIcon(log.eventType)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {log.agentName}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      log.eventType === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      log.eventType === 'complete' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {log.eventType}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {log.payloadSummary}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs">
                  {log.confidence !== null && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Confidence:</span>
                      <span className={`font-medium ${
                        log.confidence >= 0.8 ? 'text-green-600 dark:text-green-400' :
                        log.confidence >= 0.6 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {(log.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}

                  {log.artifactId && (
                    <button className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View artifact
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
