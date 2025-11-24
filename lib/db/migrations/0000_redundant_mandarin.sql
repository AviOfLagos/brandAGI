CREATE TABLE `artifacts` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`file_path` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`created_by` text,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`question` text NOT NULL,
	`options` text NOT NULL,
	`selected_option` text,
	`approved_at` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`trace` text,
	`metadata` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `log_events` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` text DEFAULT (datetime('now')) NOT NULL,
	`agent_id` text NOT NULL,
	`agent_name` text NOT NULL,
	`event_type` text NOT NULL,
	`payload_type` text,
	`payload_summary` text,
	`payload_link` text,
	`confidence` real,
	`provenance` text,
	`dependencies` text,
	`consumed_by` text,
	`owner_visible` integer DEFAULT false,
	`metadata` text,
	`project_id` text,
	`session_id` text
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`brand_profile` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`platform` text NOT NULL,
	`content_id` text,
	`publish_time` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`metadata` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`last_updated` text DEFAULT (datetime('now')) NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `workflow_states` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`current_node` text,
	`completed_nodes` text,
	`failed_nodes` text,
	`pending_decisions` text,
	`status` text DEFAULT 'running' NOT NULL,
	`metadata` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
