CREATE TABLE `attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`document_scrape_id` integer NOT NULL,
	`filename` text NOT NULL,
	`file_type` text,
	`original_date` text,
	`r2_key` text NOT NULL,
	`file_size` integer,
	`content_type` text,
	FOREIGN KEY (`document_scrape_id`) REFERENCES `document_scrapes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_attachments_scrape` ON `attachments` (`document_scrape_id`);--> statement-breakpoint
CREATE TABLE `document_scrapes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purchase_id` integer NOT NULL,
	`chilecompra_code` text NOT NULL,
	`detail_url` text NOT NULL,
	`pdf_report_url` text,
	`scrape_status` text DEFAULT 'pending' NOT NULL,
	`scrape_error` text,
	`scrape_attempts` integer DEFAULT 0 NOT NULL,
	`last_scrape_at` text,
	`r2_folder` text,
	`attachment_count` integer DEFAULT 0,
	`total_file_size` integer DEFAULT 0,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_document_scrapes_purchase` ON `document_scrapes` (`purchase_id`);--> statement-breakpoint
CREATE INDEX `idx_document_scrapes_status` ON `document_scrapes` (`scrape_status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_document_scrapes_code` ON `document_scrapes` (`chilecompra_code`);