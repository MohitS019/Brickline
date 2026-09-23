CREATE TABLE `area_signals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`area` text NOT NULL,
	`state` text NOT NULL,
	`category` text NOT NULL,
	`detail` text NOT NULL,
	`source_note` text NOT NULL,
	`event_date` text NOT NULL,
	`created_at` integer NOT NULL,
	`created_by` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_signals_created` ON `area_signals` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_signals_area` ON `area_signals` (`state`,`area`);--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `business_address` text;--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `contact_person` text;--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `agency_name` text;--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `phone_encrypted` text;--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `account_rera_encrypted` text;--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `gst_encrypted` text;--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `account_rera_fingerprint` text;--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `gst_fingerprint` text;--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `rejection_reason` text;--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `verified_at` integer;--> statement-breakpoint
ALTER TABLE `client_access_grants` ADD `device_label` text;