-- Migration: Recreate UNSPSC tables with categories support
-- This will drop and recreate all UNSPSC tables

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS commodities;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS families;
DROP TABLE IF EXISTS segments;
DROP TABLE IF EXISTS categories;

-- Create categories table
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);

-- Create segments table with category_id
CREATE TABLE `segments` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` integer NOT NULL REFERENCES categories(id),
	`name` text NOT NULL
);

-- Create families table
CREATE TABLE `families` (
	`id` text PRIMARY KEY NOT NULL,
	`segment_id` text NOT NULL REFERENCES segments(id),
	`name` text NOT NULL
);

-- Create classes table
CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL REFERENCES families(id),
	`name` text NOT NULL
);

-- Create commodities table
CREATE TABLE `commodities` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL REFERENCES classes(id),
	`name` text NOT NULL
);

-- Recreate purchases table if it was dropped
CREATE TABLE IF NOT EXISTS `purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`municipality_id` integer NOT NULL REFERENCES municipalities(id),
	`supplier_id` integer NOT NULL REFERENCES suppliers(id),
	`commodity_id` text NOT NULL REFERENCES commodities(id),
	`amount` integer NOT NULL,
	`unit_price` integer NOT NULL
);
