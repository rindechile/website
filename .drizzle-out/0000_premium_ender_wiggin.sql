CREATE TABLE `categories` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` integer PRIMARY KEY NOT NULL,
	`family_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `commodities` (
	`id` integer PRIMARY KEY NOT NULL,
	`class_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `families` (
	`id` integer PRIMARY KEY NOT NULL,
	`segment_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`segment_id`) REFERENCES `segments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` integer PRIMARY KEY NOT NULL,
	`commodity_id` integer,
	`expected_min_range` integer,
	`expected_max_range` integer,
	`max_acceptable_price` real,
	`name` text NOT NULL,
	`has_sufficient_data` integer NOT NULL,
	FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `municipalities` (
	`id` integer PRIMARY KEY NOT NULL,
	`region_id` integer NOT NULL,
	`name` text NOT NULL,
	`budget` real,
	`budget_per_capita` real,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` integer PRIMARY KEY NOT NULL,
	`item_id` integer NOT NULL,
	`municipality_id` integer NOT NULL,
	`supplier_rut` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_total_price` real,
	`is_expensive` integer,
	`price_excess_amount` real,
	`price_excess_percentage` real,
	`chilecompra_code` text NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`municipality_id`) REFERENCES `municipalities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_rut`) REFERENCES `suppliers`(`rut`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `regions` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `segments` (
	`id` integer PRIMARY KEY NOT NULL,
	`category_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`rut` text PRIMARY KEY NOT NULL,
	`name` text,
	`size` text
);
