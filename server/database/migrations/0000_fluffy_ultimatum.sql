-- server/database/migrations/0000_fluffy_ultimatum.sql

-- 1️⃣ Create users first
CREATE TABLE IF NOT EXISTS `users` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `name` TEXT NOT NULL,
  `username` TEXT NOT NULL,
  `password` TEXT NOT NULL,
  `avatar` TEXT,
  `created_at` TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
  `updated_at` TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS `users_username_unique`
  ON `users` (`username`);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS `users_email_unique`
  ON `users` (`email`);
--> statement-breakpoint

-- 2️⃣ Now create notes (which references users.id)
CREATE TABLE IF NOT EXISTS `notes` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `text` TEXT NOT NULL,
  `user_id` TEXT,
  `created_at` TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
  `updated_at` TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
  `audio_urls` TEXT,
  `caller_name` TEXT NOT NULL,
  `caller_email` TEXT NOT NULL,
  `caller_location` TEXT NOT NULL,
  `caller_address` TEXT NOT NULL,
  `call_reason` TEXT NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
