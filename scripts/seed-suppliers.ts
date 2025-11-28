#!/usr/bin/env node
/**
 * Seeds suppliers data
 * Reads from proveedor.csv and populates suppliers table
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface SupplierRow {
  supplier_rut: string;
  supplier_name: string;
  supplier_size: string;
}

interface SupplierData {
  suppliers: Map<string, {
    supplier_rut: string;
    supplier_name: string;
    supplier_size: string;
  }>;
}

function parseCsv(filePath: string): SupplierRow[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  // Skip header row
  const rows = lines.slice(1);
  
  return rows.map(line => {
    const parts = line.split(',');
    return {
      supplier_rut: parts[0],
      supplier_name: parts[1],
      supplier_size: parts[2],
    };
  });
}

function extractSupplierData(rows: SupplierRow[]): SupplierData {
  const suppliers = new Map<string, {
    supplier_rut: string;
    supplier_name: string;
    supplier_size: string;
  }>();

  for (const row of rows) {
    // Skip if already exists
    if (suppliers.has(row.supplier_rut)) {
      continue;
    }

    suppliers.set(row.supplier_rut, {
      supplier_rut: row.supplier_rut,
      supplier_name: row.supplier_name,
      supplier_size: row.supplier_size,
    });
  }

  return { suppliers };
}

function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

function generateSqlInserts(data: SupplierData, batchSize: number = 500): string {
  const lines: string[] = [];

  // Insert suppliers
  console.log(`Generating SQL for ${data.suppliers.size} suppliers...`);
  const supplierEntries = Array.from(data.suppliers.entries());
  
  for (let i = 0; i < supplierEntries.length; i += batchSize) {
    const batch = supplierEntries.slice(i, i + batchSize);
    const values = batch
      .map(([, { supplier_rut, supplier_name, supplier_size }]) => 
        `('${escapeSqlString(supplier_rut)}', '${escapeSqlString(supplier_name)}', '${escapeSqlString(supplier_size)}')`)
      .join(',\n  ');
    lines.push(`INSERT OR IGNORE INTO suppliers (rut, name, size) VALUES\n  ${values};`);
  }

  return lines.join('\n\n');
}

function main() {
  const isRemote = process.argv.includes('--remote');
  const environment = isRemote ? 'remote' : 'local';
  
  console.log(`🌱 Seeding suppliers data to ${environment} database...\n`);

  // Read CSV file
  const csvPath = join(__dirname, '..', 'schemas', 'data', 'proveedor.csv');
  console.log('📖 Reading CSV file...');
  const rows = parseCsv(csvPath);
  console.log(`✅ Parsed ${rows.length} rows\n`);

  // Extract unique data
  console.log('🔍 Extracting unique suppliers...');
  const data = extractSupplierData(rows);
  console.log(`✅ Found:`);
  console.log(`   - ${data.suppliers.size} suppliers\n`);

  // Generate SQL
  console.log('📝 Generating SQL inserts...');
  const sql = generateSqlInserts(data);
  
  // Write SQL file
  const sqlPath = join(__dirname, 'sql/seed-suppliers.sql');
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
    
    console.log(`\n✅ Successfully seeded suppliers data to ${environment} database!`);
  } catch (error) {
    console.error(`\n❌ Error executing SQL:`, error);
    process.exit(1);
  }
}

main();