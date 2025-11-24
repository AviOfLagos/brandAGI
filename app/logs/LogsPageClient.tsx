'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LogEvent {
  id: string;
  timestamp: string;
  agentName: string;
  agentId: string;
  eventType: string;
  payloadSummary: string;
  confidence: number | null;
  projectId: string | null;
  ownerVisible: boolean;
}

interface LogsPageClientProps {
  initialLogs: LogEvent[];
  initialProjectId?: string;
}

export function LogsPageClient({ initialLogs, initialProjectId }: LogsPageClientProps) {
  const [logs, setLogs] = useState<LogEvent[]>(initialLogs);
  const [filter, setFilter] = useState({
    eventType: 'all',
    ownerVisible: true,
    projectId: initialProjectId || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '100',
        ownerVisible: filter.ownerVisible.toString(),
      });

      if (filter.projectId) {
        params.append('projectId', filter.projectId);
      }

      const response = await fetch(`/api/logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter.ownerVisible, filter.projectId]);

  const filteredLogs = filter.eventType === 'all' 
    ? logs 
    : logs.filter(log => log.eventType === filter.eventType);

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'emit': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'error': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'decision': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'complete': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  ← Back
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Event Logs
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Complete audit trail of all agent activities
              </p>
            </div>
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4">
            {/* Event Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Type
              </label>
              <select
                value={filter.eventType}
                onChange={(e) => setFilter({ ...filter, eventType: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="all">All Events</option>
                <option value="emit">Emit</option>
                <option value="error">Error</option>
                <option value="decision">Decision</option>
                <option value="complete">Complete</option>
              </select>
            </div>

            {/* Owner Visible Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Visibility
              </label>
              <select
                value={filter.ownerVisible.toString()}
                onChange={(e) => setFilter({ ...filter, ownerVisible: e.target.value === 'true' })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="true">Owner Visible</option>
                <option value="false">System Only</option>
              </select>
            </div>

            {/* Project Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project ID
              </label>
              <input
                type="text"
                value={filter.projectId}
                onChange={(e) => setFilter({ ...filter, projectId: e.target.value })}
                placeholder="Filter by project..."
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm w-64"
              />
            </div>

            {/* Results Count */}
            <div className="ml-auto flex items-end">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredLogs.length} {filteredLogs.length === 1 ? 'result' : 'results'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400">
                No logs found matching your filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Summary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.agentName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {log.agentId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventBadgeColor(log.eventType)}`}>
                          {log.eventType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-md truncate">
                        {log.payloadSummary}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.confidence !== null ? (
                          <span className={`font-medium ${
                            log.confidence >= 0.8 ? 'text-green-600 dark:text-green-400' :
                            log.confidence >= 0.6 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {(log.confidence * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
