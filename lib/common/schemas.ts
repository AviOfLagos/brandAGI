import { z } from 'zod';

/**
 * Log Event Schema - matches database schema
 */
export const LogEventSchema = z.object({
  id: z.string().optional(),
  timestamp: z.string().optional(),
  agentId: z.string(),
  agentName: z.string(),
  eventType: z.enum(['emit', 'query', 'decision', 'error']),
  payloadType: z.enum([
    'brand_profile',
    'draft',
    'asset',
    'question',
    'decision',
    'strategy',
    'calendar',
    'knowledge',
    'industry_snapshot',
  ]).optional(),
  payloadSummary: z.string().optional(),
  payloadLink: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  provenance: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  consumedBy: z.array(z.string()).optional(),
  ownerVisible: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
  projectId: z.string().optional(),
  sessionId: z.string().optional(),
});

export type LogEventType = z.infer<typeof LogEventSchema>;

/**
 * Decision Report Schema - for decision approval flow
 */
export const DecisionReportSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  agentId: z.string(),
  question: z.string(),
  options: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
      confidence: z.number().min(0).max(1),
      provenance: z.string(),
    })
  ),
  trace: z.array(z.string()), // log_ids
  systemConfidence: z.number().min(0).max(1),
  metadata: z.record(z.any()).optional(),
});

export type DecisionReportType = z.infer<typeof DecisionReportSchema>;

/**
 * Brand Profile Schema
 */
export const BrandProfileSchema = z.object({
  name: z.string(),
  industry: z.string(),
  targetAudience: z.string(),
  brandVision: z.string(),
  brandValues: z.array(z.string()),
  uniqueSellingProposition: z.string().optional(),
  tone: z.string().optional(),
  messaging: z.string().optional(),
  contentPillars: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1),
  provenance: z.string(),
});

export type BrandProfileType = z.infer<typeof BrandProfileSchema>;

/**
 * Content Strategy Schema
 */
export const ContentStrategySchema = z.object({
  objectives: z.array(z.string()),
  platforms: z.array(z.string()),
  contentTypes: z.array(z.string()),
  postingFrequency: z.record(z.string()), // platform -> frequency
  keyMessages: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  provenance: z.string(),
});

export type ContentStrategyType = z.infer<typeof ContentStrategySchema>;

/**
 * Content Calendar Schema
 */
export const ContentCalendarSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  entries: z.array(
    z.object({
      date: z.string(),
      platform: z.string(),
      contentType: z.string(),
      topic: z.string(),
      pillar: z.string(),
      status: z.enum(['planned', 'drafted', 'approved', 'scheduled', 'published']),
    })
  ),
  confidence: z.number().min(0).max(1),
  provenance: z.string(),
});

export type ContentCalendarType = z.infer<typeof ContentCalendarSchema>;

/**
 * Artifact Schema
 */
export const ArtifactSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  type: z.enum([
    'brand_profile',
    'strategy',
    'calendar',
    'longform',
    'shortform',
    'visual',
    'knowledge',
    'industry_snapshot',
  ]),
  title: z.string(),
  content: z.any(), // flexible content structure
  filePath: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type ArtifactType = z.infer<typeof ArtifactSchema>;

/**
 * Tool Input/Output Schemas - standardized interfaces
 */
export const ToolInputSchema = z.object({
  toolName: z.string(),
  parameters: z.record(z.any()),
  context: z
    .object({
      projectId: z.string().optional(),
      sessionId: z.string().optional(),
      agentId: z.string().optional(),
    })
    .optional(),
});

export const ToolOutputSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type ToolInputType = z.infer<typeof ToolInputSchema>;
export type ToolOutputType = z.infer<typeof ToolOutputSchema>;

/**npm
 * Agent Output Schema - all agents must return this structure
 */
export const AgentOutputSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  confidence: z.number().min(0).max(1),
  provenance: z.string(),
  artifacts: z.array(z.string()).optional(), // artifact IDs
  nextSteps: z.array(z.string()).optional(),
  error: z.string().optional(),
});

export type AgentOutputType = z.infer<typeof AgentOutputSchema>;

/**
 * Workflow Node Schema
 */
export const WorkflowNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  agentId: z.string(),
  dependencies: z.array(z.string()).default([]),
  requiresApproval: z.boolean().default(false),
  retryPolicy: z
    .object({
      maxRetries: z.number().default(2),
      backoffMs: z.number().default(1000),
    })
    .optional(),
  runQA: z.boolean().default(true),
  runCodeReview: z.boolean().default(true),
});

export type WorkflowNodeType = z.infer<typeof WorkflowNodeSchema>;

/**
 * Workflow Schema
 */
export const WorkflowSchema = z.object({
  name: z.string(),
  description: z.string(),
  nodes: z.array(WorkflowNodeSchema),
  metadata: z.record(z.any()).optional(),
});

export type WorkflowType = z.infer<typeof WorkflowSchema>;
