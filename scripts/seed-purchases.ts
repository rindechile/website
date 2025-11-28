#!/usr/bin/env node
/**
 * Seeds purchases data
 * Reads from purchase.csv and populates purchases table
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface PurchaseRow {
  purchase_id: string;
  purchase_code: string;
  municipality_id: string;
  supplier_rut: string;
  item_quantity: string;
  unit_total_price: string;
  is_expensive: string;
  price_excess_amount: string;
  price_excess_percentage: string;
  item_id: string;
}

interface PurchaseData {
  purchases: Map<string, {
    purchase_id: number;
    purchase_code: string;
    municipality_id: number;
    supplier_rut: string;
    item_quantity: number;
    unit_total_price: number;
    is_expensive: boolean;
    price_excess_amount: number;
    price_excess_percentage: number;
    item_id: number;
  }>;
}

function parseCsv(filePath: string): PurchaseRow[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  // Skip header row
  const rows = lines.slice(1);
  
  return rows.map(line => {
    const parts = line.split(',');
    return {
      purchase_id: parts[0],
      purchase_code: parts[1],
      municipality_id: parts[2],
      supplier_rut: parts[3],
      item_quantity: parts[4],
      unit_total_price: parts[5],
      is_expensive: parts[6],
      price_excess_amount: parts[7],
      price_excess_percentage: parts[8],
      item_id: parts[9],
    };
  });
}

function extractPurchaseData(rows: PurchaseRow[]): PurchaseData {
  const purchases = new Map<string, {
    purchase_id: number;
    purchase_code: string;
    municipality_id: number;
    supplier_rut: string;
    item_quantity: number;
    unit_total_price: number;
    is_expensive: boolean;
    price_excess_amount: number;
    price_excess_percentage: number;
    item_id: number;
  }>();

  for (const row of rows) {
    // Skip if already exists
    if (purchases.has(row.purchase_id)) {
      continue;
    }

    purchases.set(row.purchase_id, {
      purchase_id: parseInt(row.purchase_id, 10),
      purchase_code: row.purchase_code,
      municipality_id: parseInt(row.municipality_id, 10),
      supplier_rut: row.supplier_rut,
      item_quantity: parseInt(row.item_quantity, 10),
      unit_total_price: parseFloat(row.unit_total_price),
      is_expensive: row.is_expensive.toLowerCase() === 'true',
      price_excess_amount: parseFloat(row.price_excess_amount),
      price_excess_percentage: parseFloat(row.price_excess_percentage),
      item_id: parseInt(row.item_id, 10),
    });
  }

  return { purchases };
}

function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

function generateSqlInserts(data: PurchaseData, batchSize: number = 500): string {
  const lines: string[] = [];

  // Insert purchases
  console.log(`Generating SQL for ${data.purchases.size} purchases...`);
  const purchaseEntries = Array.from(data.purchases.entries());
  
  for (let i = 0; i < purchaseEntries.length; i += batchSize) {
    const batch = purchaseEntries.slice(i, i + batchSize);
    const values = batch
      .map(([, { purchase_id, purchase_code, municipality_id, supplier_rut, item_quantity, unit_total_price, is_expensive, price_excess_amount, price_excess_percentage, item_id }]) => 
        `(${purchase_id}, '${escapeSqlString(purchase_code)}', ${municipality_id}, '${escapeSqlString(supplier_rut)}', ${item_quantity}, ${unit_total_price}, ${is_expensive ? 1 : 0}, ${price_excess_amount}, ${price_excess_percentage}, ${item_id})`)
      .join(',\n  ');
    lines.push(`INSERT OR IGNORE INTO purchases (id, chilecompra_code, municipality_id, supplier_rut, quantity, unit_total_price, is_expensive, price_excess_amount, price_excess_percentage, item_id) VALUES\n  ${values};`);
  }

  return lines.join('\n\n');
}

function main() {
  const isRemote = process.argv.includes('--remote');
  const environment = isRemote ? 'remote' : 'local';
  
  console.log(`🌱 Seeding purchases data to ${environment} database...\n`);

  // Read CSV file
  const csvPath = join(__dirname, '..', 'schemas', 'data', 'purchase.csv');
  console.log('📖 Reading CSV file...');
  const rows = parseCsv(csvPath);
  console.log(`✅ Parsed ${rows.length} rows\n`);

  // Extract unique data
  console.log('🔍 Extracting unique purchases...');
  const data = extractPurchaseData(rows);
  console.log(`✅ Found:`);
  console.log(`   - ${data.purchases.size} purchases\n`);

  // Generate SQL
  console.log('📝 Generating SQL inserts...');
  const sql = generateSqlInserts(data);
  
  // Write SQL file
  const sqlPath = join(__dirname, 'sql/seed-purchases.sql');
  writeFileSync(sqlPath, sql, 'utf-8');
  console.log(`✅ SQL file written to ${sqlPath}\n`);

  // Execute via Wrangler
  console.log(`🚀 Executing SQL via Wrangler (${environment})...`);
  try {
    const flag = isRemote ? '--remote' : '--local';
    // Use database binding name 'DB' from wrangler.toml
    const command = `wrangler d1 execute DB ${flag} --file=${sqlPath}`;
    console.log(`Running: ${command}\n`);
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: join(__dirname, '..')
    });
    
    console.log(`\n✅ Successfully seeded purchases data to ${environment} database!`);
  } catch (error) {
    console.error(`\n❌ Error executing SQL:`, error);
    process.exit(1);
  }
}

main();