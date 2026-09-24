ALTER TABLE `client_access_grants` ADD `project_id` text;--> statement-breakpoint
ALTER TABLE `registered_projects` ADD `published` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `registered_projects` ADD `view_count` integer DEFAULT 0 NOT NULL;