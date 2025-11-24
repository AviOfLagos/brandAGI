import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Log events table - stores all agent events with full traceability
 */
export const logEvents = sqliteTable('log_events', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull().default(sql`(datetime('now'))`),
  agentId: text('agent_id').notNull(),
  agentName: text('agent_name').notNull(),
  eventType: text('event_type').notNull(), // emit|query|decision|error
  payloadType: text('payload_type'), // brand_profile|draft|asset|question|decision
  payloadSummary: text('payload_summary'),
  payloadLink: text('payload_link'), // artifact storage path
  confidence: real('confidence'), // 0.0-1.0
  provenance: text('provenance'), // source/reasoning
  dependencies: text('dependencies'), // JSON array of log_ids
  consumedBy: text('consumed_by'), // JSON array of agent_ids
  ownerVisible: integer('owner_visible', { mode: 'boolean' }).default(false),
  metadata: text('metadata'), // JSON for additional data
  projectId: text('project_id'),
  sessionId: text('session_id'),
});

/**
 * Sessions table - tracks conversation/workflow sessions
 */
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  projectId: text('project_id'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  lastUpdated: text('last_updated').notNull().default(sql`(datetime('now'))`),
  metadata: text('metadata'), // JSON
});

/**
 * Projects table - stores project details and brand profiles
 */
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('draft'), // draft|active|paused|completed
  brandProfile: text('brand_profile'), // JSON
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  metadata: text('metadata'), // JSON
});

/**
 * Artifacts table - stores generated content and assets
 */
export const artifacts = sqliteTable('artifacts', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  type: text('type').notNull(), // brand_profile|strategy|calendar|longform|shortform|visual
  title: text('title').notNull(),
  content: text('content'), // JSON or text content
  filePath: text('file_path'), // path to file in artifacts directory
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  createdBy: text('created_by'), // agent_id
  metadata: text('metadata'), // JSON
});

/**
 * Schedules table - stores content publishing schedule
 */
export const schedules = sqliteTable('schedules', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  platform: text('platform').notNull(), // x|linkedin|instagram|tiktok|facebook
  contentId: text('content_id'), // reference to artifact
  publishTime: text('publish_time').notNull(),
  status: text('status').notNull().default('pending'), // pending|approved|published|failed
  metadata: text('metadata'), // JSON
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

/**
 * Decisions table - stores decision points requiring owner approval
 */
export const decisions = sqliteTable('decisions', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  agentId: text('agent_id').notNull(),
  question: text('question').notNull(),
  options: text('options').notNull(), // JSON array of options with confidence scores
  selectedOption: text('selected_option'),
  approvedAt: text('approved_at'),
  status: text('status').notNull().default('pending'), // pending|approved|rejected
  trace: text('trace'), // JSON array of log_ids
  metadata: text('metadata'), // JSON
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

/**
 * Workflow state table - tracks workflow execution state
 */
export const workflowStates = sqliteTable('workflow_states', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  currentNode: text('current_node'),
  completedNodes: text('completed_nodes'), // JSON array
  failedNodes: text('failed_nodes'), // JSON array
  pendingDecisions: text('pending_decisions'), // JSON array of decision_ids
  status: text('status').notNull().default('running'), // running|paused|completed|failed
  metadata: text('metadata'), // JSON
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// Type exports for TypeScript
export type LogEvent = typeof logEvents.$inferSelect;
export type NewLogEvent = typeof logEvents.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Artifact = typeof artifacts.$inferSelect;
export type NewArtifact = typeof artifacts.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;
export type Decision = typeof decisions.$inferSelect;
export type NewDecision = typeof decisions.$inferInsert;
export type WorkflowState = typeof workflowStates.$inferSelect;
export type NewWorkflowState = typeof workflowStates.$inferInsert;
