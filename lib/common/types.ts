/**
 * Common types and interfaces for the Agentic Brand Engine
 */

import type {
  LogEventType,
  DecisionReportType,
  BrandProfileType,
  ContentStrategyType,
  ContentCalendarType,
  ArtifactType,
  ToolInputType,
  ToolOutputType,
  AgentOutputType,
  WorkflowNodeType,
  WorkflowType,
} from './schemas';

export type {
  LogEventType,
  DecisionReportType,
  BrandProfileType,
  ContentStrategyType,
  ContentCalendarType,
  ArtifactType,
  ToolInputType,
  ToolOutputType,
  AgentOutputType,
  WorkflowNodeType,
  WorkflowType,
};

/**
 * Agent interface - all agents must implement this
 */
export interface Agent {
  id: string;
  name: string;
  description: string;
  version: string;
  tools: string[];
  run: (input: AgentInput) => Promise<AgentOutputType>;
}

/**
 * Agent input interface
 */
export interface AgentInput {
  input: string | Record<string, any>;
  projectId: string;
  sessionId?: string;
  context?: Record<string, any>;
  memory?: any;
}

/**
 * Tool interface
 */
export interface Tool {
  name: string;
  description: string;
  execute: (input: ToolInputType) => Promise<ToolOutputType>;
}

/**
 * Orchestrator interface
 */
export interface OrchestratorCommand {
  type: 'start_workflow' | 'approve_decision' | 'get_state' | 'pause' | 'resume';
  projectId: string;
  data?: any;
}

export interface OrchestratorResponse {
  success: boolean;
  data?: any;
  error?: string;
  workflowState?: any;
}

/**
 * Event types for real-time updates
 */
export type RealtimeEventType =
  | 'agent_started'
  | 'agent_completed'
  | 'agent_failed'
  | 'decision_required'
  | 'workflow_completed'
  | 'workflow_failed';

export interface RealtimeEvent {
  type: RealtimeEventType;
  projectId: string;
  data: any;
  timestamp: string;
}

/**
 * Platform types for social media
 */
export type SocialPlatform = 'x' | 'linkedin' | 'instagram' | 'tiktok' | 'facebook';

/**
 * Content types
 */
export type ContentType =
  | 'article'
  | 'post'
  | 'thread'
  | 'image'
  | 'video'
  | 'carousel'
  | 'story';

/**
 * Project status types
 */
export type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed';

/**
 * Workflow status types
 */
export type WorkflowStatus = 'running' | 'paused' | 'completed' | 'failed';
