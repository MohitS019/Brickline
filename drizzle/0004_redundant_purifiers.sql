CREATE TABLE `privacy_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`request_type` text NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	`resolved_by` text
);
--> statement-breakpoint
CREATE INDEX `idx_privacy_user_created` ON `privacy_requests` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_privacy_status_created` ON `privacy_requests` (`status`,`created_at`);--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `consent_version` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `consent_at` integer;--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `consent_withdrawn_at` integer;--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `deletion_requested_at` integer;--> statement-breakpoint
ALTER TABLE `client_access_grants` ADD `open_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `client_access_grants` ADD `bound_device_hash` text;--> statement-breakpoint
ALTER TABLE `client_access_grants` ADD `last_opened_at` integer;--> statement-breakpoint
ALTER TABLE `client_access_grants` ADD `last_country` text;--> statement-breakpoint
ALTER TABLE `registered_projects` ADD `rera_fingerprint` text;--> statement-breakpoint
CREATE INDEX `idx_projects_rera_fingerprint` ON `registered_projects` (`rera_fingerprint`);