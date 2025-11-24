'use client';

import { useState, useEffect } from 'react';
import { useChat } from 'ai/react'; // Vercel AI SDK hook
import Link from 'next/link';
import { ActivityFeed } from '@/app/components/ActivityFeed';

interface ProjectDashboardProps {
  project: any;
}

export function ProjectDashboard({ project }: ProjectDashboardProps) {
  const [isStartingWorkflow, setIsStartingWorkflow] = useState(false);
  const [workflowState, setWorkflowState] = useState<any>(null);

  // Vercel AI SDK useChat hook
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [],
  });

  // Fetch workflow state
  const fetchWorkflowState = async () => {
    try {
      const response = await fetch(`/api/orchestrator/state/${project.id}`);
      const data = await response.json();
      if (data.success) {
        setWorkflowState(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch workflow state:', error);
    }
  };

  // Fetch on mount and poll every 10 seconds
  useEffect(() => {
    fetchWorkflowState();
    
    // Poll for state updates every 10 seconds (reduced from 5s)
    const interval = setInterval(() => {
      fetchWorkflowState();
    }, 10000); // 10 seconds
    
    return () => clearInterval(interval);
  }, [project.id]);

  const handleStartWorkflow = async () => {
    setIsStartingWorkflow(true);
    try {
      const response = await fetch('/api/orchestrator/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          input: project.brandProfile,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Immediately fetch state to update button
        await fetchWorkflowState();
      } else {
        alert('Failed to start workflow: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to start workflow');
      console.error(error);
    } finally {
      setIsStartingWorkflow(false);
    }
  };

  const handleStopWorkflow = async () => {
    setIsStartingWorkflow(true);
    try {
      const response = await fetch('/api/orchestrator/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Immediately fetch state to update button
        await fetchWorkflowState();
        alert('Workflow stopped');
      } else {
        alert('Failed to stop workflow: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to stop workflow');
      console.error(error);
    } finally {
      setIsStartingWorkflow(false);
    }
  };

  const brandProfile = project.brandProfile || null;
  const isWorkflowRunning = workflowState?.status === 'running' || workflowState?.status === 'paused';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                project.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                project.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {project.status}
              </span>
              {isWorkflowRunning ? (
                <button
                  onClick={handleStopWorkflow}
                  disabled={isStartingWorkflow}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white font-medium rounded-lg hover:from-red-700 hover:to-orange-700 transition-all disabled:opacity-50"
                >
                  {isStartingWorkflow ? 'Stopping...' : '⏹ Stop Workflow'}
                </button>
              ) : (
                <button
                  onClick={handleStartWorkflow}
                  disabled={isStartingWorkflow}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {isStartingWorkflow ? 'Starting...' : '🚀 Start Workflow'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Brand Profile */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Brand Profile
              </h2>
              
              {brandProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Industry</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">{brandProfile.industry}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Target Audience</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">{brandProfile.targetAudience}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vision</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">{brandProfile.brandVision}</p>
                  </div>
                  
                  {brandProfile.brandValues && brandProfile.brandValues.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Values</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {brandProfile.brandValues.map((value: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No brand profile data</p>
              )}
            </div>

            {workflowState?.status === 'running' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-green-800 dark:text-green-400">
                  ✅ Workflow is running! Agents are analyzing your brand.
                </p>
              </div>
            )}

            {workflowState?.status === 'paused' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  ⏸️ Workflow paused - awaiting your decision.
                </p>
              </div>
            )}

            {workflowState?.status === 'failed' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-red-800 dark:text-red-400">
                  ❌ Workflow stopped or failed. Click "Start Workflow" to try again.
                </p>
              </div>
            )}

            {/* Activity Feed */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <ActivityFeed 
                projectId={project.id} 
                refreshInterval={15000} // Poll every 15 seconds
              />
            </div>
          </div>

          {/* Right Column - Agent Chat (Vercel AI SDK) */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm flex flex-col h-[700px]">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Agent Chat
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Ask questions or chat with AI agents
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Start a conversation with your brand agents
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2.5">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form (Vercel AI SDK) */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask about your brand strategy..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
