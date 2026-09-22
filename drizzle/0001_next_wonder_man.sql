CREATE TABLE `panel_content` (
	`role` text PRIMARY KEY NOT NULL,
	`headline` text NOT NULL,
	`accent` text NOT NULL,
	`description` text NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `requested_role` text DEFAULT 'Builder' NOT NULL;--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `agent_access` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `builder_access` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `client_access` integer DEFAULT true NOT NULL;