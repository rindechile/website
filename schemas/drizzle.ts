import { text, integer, real, sqliteTable, index, uniqueIndex } from "drizzle-orm/sqlite-core";

// 
// UNSPSC Tables
//

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
});

export const segments = sqliteTable("segments", {
  id: integer("id").primaryKey(),
  category_id: integer("category_id")
    .notNull()
    .references(() => categories.id),
  name: text("name").notNull(),
}, (table) => [
  index("idx_segments_category").on(table.category_id),
]);

export const families = sqliteTable("families", {
  id: integer("id").primaryKey(),
  segment_id: integer("segment_id")
    .notNull()
    .references(() => segments.id),
  name: text("name").notNull(),
}, (table) => [
  index("idx_families_segment").on(table.segment_id),
]);

export const classes = sqliteTable("classes", {
  id: integer("id").primaryKey(),
  family_id: integer("family_id")
    .notNull()
    .references(() => families.id),
  name: text("name").notNull(),
}, (table) => [
  index("idx_classes_family").on(table.family_id),
]);

export const commodities = sqliteTable("commodities", {
  id: integer("id").primaryKey(),
  class_id: integer("class_id")
    .notNull()
    .references(() => classes.id),
  name: text("name").notNull(),
}, (table) => [
  index("idx_commodities_class").on(table.class_id),
]);

// 
// Regions & Municipalities Tables
//

export const regions = sqliteTable("regions", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
});

export const municipalities = sqliteTable("municipalities", {
  id: integer("id").primaryKey(),
  region_id: integer("region_id")
    .notNull()
    .references(() => regions.id),
  name: text("name").notNull(),
  budget: real("budget"),
  budget_per_capita: real("budget_per_capita"),
}, (table) => [
  index("idx_municipalities_region").on(table.region_id),
]);

// 
// Item Table
//

export const items = sqliteTable("items", {
  id: integer("id").primaryKey(),
  commodity_id: integer("commodity_id")
    .references(() => commodities.id),
  expected_min_range: integer("expected_min_range"),
  expected_max_range: integer("expected_max_range"),
  max_acceptable_price: real("max_acceptable_price"),
  name: text("name").notNull(),
  has_sufficient_data: integer("has_sufficient_data").notNull(), // boolean as 0/1
}, (table) => [
  index("idx_items_commodity").on(table.commodity_id),
]);

// 
// Supplier Table
//

export const suppliers = sqliteTable("suppliers", {
  rut: text("rut").primaryKey(),
  name: text("name"),
  size: text("size"),
});

// 
// Purchases Tables
//

export const purchases = sqliteTable("purchases", {
  id: integer("id").primaryKey(),
  item_id: integer("item_id")
    .notNull()
    .references(() => items.id),
  municipality_id: integer("municipality_id")
    .notNull()
    .references(() => municipalities.id),
  supplier_rut: text("supplier_rut")
    .notNull()
    .references(() => suppliers.rut),
  quantity: integer("quantity").notNull(),
  unit_total_price: real("unit_total_price"),
  is_expensive: integer("is_expensive"),
  price_excess_amount: real("price_excess_amount"),
  price_excess_percentage: real("price_excess_percentage"),
  chilecompra_code: text("chilecompra_code").notNull(),
}, (table) => [
  // Composite index for most common query pattern (municipality + item lookups)
  index("idx_purchases_municipality_item").on(table.municipality_id, table.item_id),
  // Individual indexes for other common queries
  index("idx_purchases_item").on(table.item_id),
  index("idx_purchases_supplier").on(table.supplier_rut),
]);

//
// Document Scraping Tables
//

export const documentScrapes = sqliteTable("document_scrapes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  purchase_id: integer("purchase_id")
    .notNull()
    .references(() => purchases.id),
  chilecompra_code: text("chilecompra_code").notNull(),

  // URLs
  detail_url: text("detail_url").notNull(),
  pdf_report_url: text("pdf_report_url"),

  // Scraping status
  scrape_status: text("scrape_status").notNull().default("pending"), // pending, scraping, scraped, failed
  scrape_error: text("scrape_error"),
  scrape_attempts: integer("scrape_attempts").notNull().default(0),
  last_scrape_at: text("last_scrape_at"),

  // R2 storage references
  r2_folder: text("r2_folder"),
  attachment_count: integer("attachment_count").default(0),
  total_file_size: integer("total_file_size").default(0),

  // Timestamps
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
}, (table) => [
  index("idx_document_scrapes_purchase").on(table.purchase_id),
  index("idx_document_scrapes_status").on(table.scrape_status),
  uniqueIndex("idx_document_scrapes_code").on(table.chilecompra_code),
]);

export const attachments = sqliteTable("attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  document_scrape_id: integer("document_scrape_id")
    .notNull()
    .references(() => documentScrapes.id),
  filename: text("filename").notNull(),
  file_type: text("file_type"), // "Cotización", "Documento", etc.
  original_date: text("original_date"),
  r2_key: text("r2_key").notNull(),
  file_size: integer("file_size"),
  content_type: text("content_type"),
}, (table) => [
  index("idx_attachments_scrape").on(table.document_scrape_id),
]);