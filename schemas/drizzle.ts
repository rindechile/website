import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

// UNSPSC Tables
export const segments = sqliteTable("segments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const families = sqliteTable("families", {
  id: text("id").primaryKey(),
  segmentId: text("segment_id")
    .notNull()
    .references(() => segments.id),
  name: text("name").notNull(),
});

export const classes = sqliteTable("classes", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id),
  name: text("name").notNull(),
});

export const commodities = sqliteTable("commodities", {
  id: text("id").primaryKey(),
  classId: text("class_id")
    .notNull()
    .references(() => classes.id),
  name: text("name").notNull(),
});

// Data Tables
export const regions = sqliteTable("regions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const municipalities = sqliteTable("municipalities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  regionId: text("region_id")
    .notNull()
    .references(() => regions.id),
  name: text("name").notNull(),
});

export const suppliers = sqliteTable("suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
});

export const purchases = sqliteTable("purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  municipalityId: integer("municipality_id")
    .notNull()
    .references(() => municipalities.id),
  supplierId: integer("supplier_id")
    .notNull()
    .references(() => suppliers.id),
  commodityId: text("commodity_id")
    .notNull()
    .references(() => commodities.id),
  amount: integer("amount").notNull(),
  unit_price: integer("unit_price").notNull()
});