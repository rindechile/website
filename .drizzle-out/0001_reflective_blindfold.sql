CREATE INDEX `idx_classes_family` ON `classes` (`family_id`);--> statement-breakpoint
CREATE INDEX `idx_commodities_class` ON `commodities` (`class_id`);--> statement-breakpoint
CREATE INDEX `idx_families_segment` ON `families` (`segment_id`);--> statement-breakpoint
CREATE INDEX `idx_items_commodity` ON `items` (`commodity_id`);--> statement-breakpoint
CREATE INDEX `idx_municipalities_region` ON `municipalities` (`region_id`);--> statement-breakpoint
CREATE INDEX `idx_purchases_municipality_item` ON `purchases` (`municipality_id`,`item_id`);--> statement-breakpoint
CREATE INDEX `idx_purchases_item` ON `purchases` (`item_id`);--> statement-breakpoint
CREATE INDEX `idx_purchases_supplier` ON `purchases` (`supplier_rut`);--> statement-breakpoint
CREATE INDEX `idx_segments_category` ON `segments` (`category_id`);