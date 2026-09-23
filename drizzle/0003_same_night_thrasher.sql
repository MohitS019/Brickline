CREATE TABLE `registered_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`name` text NOT NULL,
	`area` text NOT NULL,
	`country` text NOT NULL,
	`site_address` text,
	`currency` text NOT NULL,
	`rera_encrypted` text,
	`status` text NOT NULL,
	`builder` text NOT NULL,
	`value` integer NOT NULL,
	`homes` integer NOT NULL,
	`description` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_projects_owner_updated` ON `registered_projects` (`owner_user_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_projects_country_status` ON `registered_projects` (`country`,`status`);