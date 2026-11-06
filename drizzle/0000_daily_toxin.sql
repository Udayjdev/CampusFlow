CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`actor` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `blueprints` (
	`id` text PRIMARY KEY NOT NULL,
	`building` text NOT NULL,
	`floor` integer NOT NULL,
	`name` text NOT NULL,
	`key` text NOT NULL,
	`mime` text NOT NULL,
	`uploaded` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`purpose` text NOT NULL,
	`capacity` integer NOT NULL,
	`branch` text NOT NULL,
	`year` text NOT NULL,
	`section` text NOT NULL,
	`batch` text NOT NULL,
	`owner` text NOT NULL,
	`faculty` text NOT NULL,
	`status` text NOT NULL,
	`test` integer NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notices` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`kind` text NOT NULL,
	`branch` text NOT NULL,
	`year` text NOT NULL,
	`section` text NOT NULL,
	`batch` text NOT NULL,
	`created` text NOT NULL,
	`author` text NOT NULL,
	`test` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text,
	`message` text NOT NULL,
	`author` text NOT NULL,
	`status` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`building` text NOT NULL,
	`floor` integer NOT NULL,
	`type` text NOT NULL,
	`capacity` integer,
	`uses` text NOT NULL,
	`features` text NOT NULL,
	`source` text NOT NULL,
	`availability` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`branch` text NOT NULL,
	`year` text NOT NULL,
	`section` text NOT NULL,
	`batch` text NOT NULL,
	`source` text NOT NULL
);

--> statement-breakpoint
CREATE INDEX booking_slot_idx ON bookings (room_id,date,status,start,end);
--> statement-breakpoint
CREATE TRIGGER prevent_booking_overlap_insert BEFORE INSERT ON bookings
WHEN NEW.status='confirmed' AND EXISTS(SELECT 1 FROM bookings b WHERE b.id<>NEW.id AND b.room_id=NEW.room_id AND b.date=NEW.date AND b.status='confirmed' AND b.start<NEW.end AND b.end>NEW.start)
BEGIN SELECT RAISE(ABORT,'booking_overlap'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_booking_overlap_update BEFORE UPDATE ON bookings
WHEN NEW.status='confirmed' AND EXISTS(SELECT 1 FROM bookings b WHERE b.id<>NEW.id AND b.room_id=NEW.room_id AND b.date=NEW.date AND b.status='confirmed' AND b.start<NEW.end AND b.end>NEW.start)
BEGIN SELECT RAISE(ABORT,'booking_overlap'); END;
