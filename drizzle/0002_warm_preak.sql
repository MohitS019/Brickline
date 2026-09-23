CREATE TABLE `client_access_grants` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_user_id` text NOT NULL,
	`client_user_id` text NOT NULL,
	`client_email` text NOT NULL,
	`builder_profile_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`first_opened_at` integer,
	`revoked_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_grants_client_expiry` ON `client_access_grants` (`client_user_id`,`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_grants_agent_created` ON `client_access_grants` (`agent_user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `security_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text NOT NULL,
	`event_type` text NOT NULL,
	`target_id` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_actor_created` ON `security_audit_log` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_event_created` ON `security_audit_log` (`event_type`,`created_at`);