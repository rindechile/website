#!/usr/bin/env node
/**
 * Validates foreign key references in purchase.csv against other CSV files
 * Run this before seeding to identify missing foreign keys
 */

import { join } from 'path';
import { parseCsv } from './seed-utils';

interface Purchase {
  id: number;
  municipality_id: number;
  supplier_rut: string;
  item_id: number;
}

function parsePurchases(csvPath: string): Purchase[] {
  const rows = parseCsv(csvPath);
  console.log(`📄 Parsed ${rows.length} purchase rows from CSV\n`);

  const purchases: Purchase[] = [];
  for (const parts of rows) {
    purchases.push({
      id: parseInt(parts[0], 10),
      municipality_id: parseInt(parts[2], 10),
      supplier_rut: parts[3].toUpperCase(), // Normalize to uppercase
      item_id: parseInt(parts[9], 10),
    });
  }

  return purchases;
}

function parseMunicipalityIds(csvPath: string): Set<number> {
  const rows = parseCsv(csvPath);
  const ids = new Set<number>();

  for (const parts of rows) {
    const id = parseInt(parts[0], 10); // id is first column
    ids.add(id);
  }

  console.log(`📄 Parsed ${ids.size} municipalities from CSV`);
  return ids;
}

function parseSupplierRuts(csvPath: string): Set<string> {
  const rows = parseCsv(csvPath);
  const ruts = new Set<string>();

  for (const parts of rows) {
    const rut = parts[0].toUpperCase(); // Normalize to uppercase for comparison
    ruts.add(rut);
  }

  console.log(`📄 Parsed ${ruts.size} suppliers from CSV`);
  return ruts;
}

function parseItemIds(csvPath: string): Set<number> {
  const rows = parseCsv(csvPath);
  const ids = new Set<number>();

  for (const parts of rows) {
    const id = parseInt(parts[4], 10); // id is in column 5 (index 4)
    ids.add(id);
  }

  console.log(`📄 Parsed ${ids.size} items from CSV`);
  return ids;
}

async function validateForeignKeys() {
  console.log('🔍 Validating Purchase Foreign Keys (CSV-based)\n');
  console.log('=' .repeat(60) + '\n');

  const dataDir = join(__dirname, '..', 'schemas', 'data');

  // 1. Parse purchase.csv
  const purchaseCsvPath = join(dataDir, 'purchase.csv');
  const purchases = parsePurchases(purchaseCsvPath);

  // Extract unique foreign key values from purchases
  const csvMunicipalityIds = new Set(purchases.map(p => p.municipality_id));
  const csvSupplierRuts = new Set(purchases.map(p => p.supplier_rut));
  const csvItemIds = new Set(purchases.map(p => p.item_id));

  console.log('📊 Purchase CSV Statistics:');
  console.log(`   Total purchases: ${purchases.length}`);
  console.log(`   Unique municipality_ids referenced: ${csvMunicipalityIds.size}`);
  console.log(`   Unique supplier_ruts referenced: ${csvSupplierRuts.size}`);
  console.log(`   Unique item_ids referenced: ${csvItemIds.size}\n`);

  // 2. Parse the reference CSV files
  console.log('🔄 Parsing reference CSV files...\n');

  const municipalityIds = parseMunicipalityIds(join(dataDir, 'municipalities.csv'));
  const supplierRuts = parseSupplierRuts(join(dataDir, 'proveedor.csv'));
  const itemIds = parseItemIds(join(dataDir, 'tipo_producto.csv'));

  console.log();
  console.log('=' .repeat(60) + '\n');

  // 3. Find missing foreign keys
  let hasErrors = false;

  // Check municipalities
  const missingMunicipalities = Array.from(csvMunicipalityIds).filter(
    id => !municipalityIds.has(id)
  );

  if (missingMunicipalities.length > 0) {
    hasErrors = true;
    console.log('❌ MISSING MUNICIPALITY IDS:');
    console.log(`   Count: ${missingMunicipalities.length} (${((missingMunicipalities.length / csvMunicipalityIds.size) * 100).toFixed(1)}% of unique IDs)`);
    console.log(`   Sample IDs: ${missingMunicipalities.slice(0, 50).sort((a, b) => a - b).join(', ')}`);
    if (missingMunicipalities.length > 50) {
      console.log(`   ... and ${missingMunicipalities.length - 50} more`);
    }
    console.log();
  } else {
    console.log('✅ All municipality_ids are valid\n');
  }

  // Check suppliers
  const missingSuppliers = Array.from(csvSupplierRuts).filter(
    rut => !supplierRuts.has(rut)
  );

  if (missingSuppliers.length > 0) {
    hasErrors = true;
    console.log('❌ MISSING SUPPLIER RUTS:');
    console.log(`   Count: ${missingSuppliers.length} (${((missingSuppliers.length / csvSupplierRuts.size) * 100).toFixed(1)}% of unique RUTs)`);
    console.log(`   Sample RUTs: ${missingSuppliers.slice(0, 50).sort().join(', ')}`);
    if (missingSuppliers.length > 50) {
      console.log(`   ... and ${missingSuppliers.length - 50} more`);
    }
    console.log();
  } else {
    console.log('✅ All supplier_ruts are valid\n');
  }

  // Check items
  const missingItems = Array.from(csvItemIds).filter(
    id => !itemIds.has(id)
  );

  if (missingItems.length > 0) {
    hasErrors = true;
    console.log('❌ MISSING ITEM IDS:');
    console.log(`   Count: ${missingItems.length} (${((missingItems.length / csvItemIds.size) * 100).toFixed(1)}% of unique IDs)`);
    console.log(`   Sample IDs: ${missingItems.slice(0, 50).sort((a, b) => a - b).join(', ')}`);
    if (missingItems.length > 50) {
      console.log(`   ... and ${missingItems.length - 50} more`);
    }
    console.log();
  } else {
    console.log('✅ All item_ids are valid\n');
  }

  console.log('=' .repeat(60) + '\n');

  // 4. Sample invalid purchases
  if (hasErrors) {
    console.log('🔍 Sample Invalid Purchases:\n');
    let sampleCount = 0;
    for (const p of purchases) {
      const invalidMunicipality = !municipalityIds.has(p.municipality_id);
      const invalidSupplier = !supplierRuts.has(p.supplier_rut);
      const invalidItem = !itemIds.has(p.item_id);

      if (invalidMunicipality || invalidSupplier || invalidItem) {
        console.log(`   Purchase ID: ${p.id}`);
        if (invalidMunicipality) {
          console.log(`      ❌ municipality_id: ${p.municipality_id} (NOT IN municipalities.csv)`);
        }
        if (invalidSupplier) {
          console.log(`      ❌ supplier_rut: ${p.supplier_rut} (NOT IN proveedor.csv)`);
        }
        if (invalidItem) {
          console.log(`      ❌ item_id: ${p.item_id} (NOT IN tipo_producto.csv)`);
        }
        console.log();

        sampleCount++;
        if (sampleCount >= 10) break;
      }
    }

    console.log('\n⚠️  Foreign key validation FAILED');
    console.log('💡 The purchase.csv file references IDs that don\'t exist in the source CSV files.\n');
    console.log('This means the CSV data itself is inconsistent. You should either:\n');

    if (missingMunicipalities.length > 0) {
      console.log(`   1. Fix municipalities.csv to include the ${missingMunicipalities.length} missing municipality IDs`);
    }
    if (missingSuppliers.length > 0) {
      console.log(`   2. Fix proveedor.csv to include the ${missingSuppliers.length} missing supplier RUTs`);
    }
    if (missingItems.length > 0) {
      console.log(`   3. Fix tipo_producto.csv to include the ${missingItems.length} missing item IDs`);
    }
    console.log('   OR');
    console.log('   4. Remove/filter the invalid purchases from purchase.csv\n');

    process.exit(1);
  } else {
    console.log('✅ All foreign keys are valid! The CSV data is consistent.\n');
    console.log('You can safely proceed with seeding in this order:');
    console.log('   1. pnpm db:seed:unspsc');
    console.log('   2. pnpm db:seed:items');
    console.log('   3. pnpm db:seed:locations');
    console.log('   4. pnpm db:seed:suppliers');
    console.log('   5. pnpm db:seed:purchases\n');
    process.exit(0);
  }
}

validateForeignKeys().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
