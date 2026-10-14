CREATE TABLE `attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sentence_id` text NOT NULL,
	`session_id` text NOT NULL,
	`submitted_order` text NOT NULL,
	`verdict` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`sentence_id`) REFERENCES `sentences`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `attempts_session_idx` ON `attempts` (`session_id`);--> statement-breakpoint
CREATE INDEX `attempts_sentence_idx` ON `attempts` (`sentence_id`);--> statement-breakpoint
CREATE TABLE `progress` (
	`id` integer PRIMARY KEY NOT NULL,
	`tier` integer DEFAULT 1 NOT NULL,
	`recent_sessions` text DEFAULT '[]' NOT NULL,
	`streak_days` integer DEFAULT 0 NOT NULL,
	`last_session_date` text,
	`sessions_today` integer DEFAULT 0 NOT NULL,
	`seed_version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `review_queue` (
	`sentence_id` text PRIMARY KEY NOT NULL,
	`stage` integer DEFAULT 0 NOT NULL,
	`due_at` integer NOT NULL,
	FOREIGN KEY (`sentence_id`) REFERENCES `sentences`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `review_queue_due_idx` ON `review_queue` (`due_at`);--> statement-breakpoint
CREATE TABLE `sentences` (
	`id` text PRIMARY KEY NOT NULL,
	`tier` integer NOT NULL,
	`rule_id` text NOT NULL,
	`gloss` text NOT NULL,
	`matrix` text,
	`chunks` text NOT NULL,
	`canonical` text NOT NULL,
	`accepted_hashes` text NOT NULL,
	`seed_version` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sentences_tier_idx` ON `sentences` (`tier`);