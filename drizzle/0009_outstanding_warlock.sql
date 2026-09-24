ALTER TABLE `area_signals` ADD `is_demo` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `builder_access_requests` ADD `is_demo` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `registered_projects` ADD `completion` text DEFAULT 'Not scheduled' NOT NULL;--> statement-breakpoint
ALTER TABLE `registered_projects` ADD `is_demo` integer DEFAULT false NOT NULL;