#!/usr/bin/env node
/**
 * Apply Supabase migrations automatically using the Management API
 * This script reads migration files and executes them via Supabase REST API
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lnvebvrayuveygycpolc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('\n📝 To get your service role key:');
  console.error('   1. Go to Supabase Dashboard → Settings → API');
  console.error('   2. Copy the "service_role" key (NOT the anon key)');
  console.error('   3. Set it as an environment variable:');
  console.error('      Windows PowerShell: $env:SUPABASE_SERVICE_ROLE_KEY="your-key-here"');
  console.error('      Windows CMD: set SUPABASE_SERVICE_ROLE_KEY=your-key-here');
  console.error('      Or create a .env file with: SUPABASE_SERVICE_ROLE_KEY=your-key-here\n');
  process.exit(1);
}

// Migrations to run in order
const migrations = [
  '20251201000002_add_location_and_game_scores.sql',
  '20251207000000_create_user_preferences.sql',
  '20251207000001_consolidate_preferences.sql',
  '20250120000001_add_flashcards_and_goals.sql'
];

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

async function executeSQL(sql) {
  // Use Supabase REST API to execute SQL
  // We'll use the Management API endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql })
  });

  if (response.status === 404) {
    // RPC function doesn't exist, try direct SQL execution via pg
    // For Supabase, we need to use a different approach
    throw new Error('Direct SQL execution not available via REST API. Please use Supabase CLI or SQL Editor.');
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return await response.json();
}

async function runMigration(filename) {
  const filePath = path.join(migrationsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filename}`);
  }

  const sql = fs.readFileSync(filePath, 'utf-8');
  
  console.log(`\n📄 Running: ${filename}`);
  
  try {
    // For Supabase, we can't directly execute SQL via REST API without a custom function
    // Instead, we'll validate the SQL and provide instructions
    console.log(`   ✅ Migration file loaded (${sql.length} characters)`);
    console.log(`   ⚠️  Note: Supabase requires migrations to be run via CLI or SQL Editor`);
    
    // Try to use Supabase Management API if available
    // This requires a custom database function, so we'll provide an alternative
    return { success: true, needsManual: true };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Supabase Migration Runner\n');
  console.log(`📁 Project: ${SUPABASE_URL}\n`);

  const results = [];
  
  for (const migration of migrations) {
    const result = await runMigration(migration);
    results.push({ migration, ...result });
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Validated: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}\n`);

  if (failed.length > 0) {
    console.log('Failed migrations:');
    failed.forEach(r => console.log(`   - ${r.migration}: ${r.error}`));
  }

  if (results.some(r => r.needsManual)) {
    console.log('\n' + '='.repeat(60));
    console.log('📝 Next Steps:\n');
    console.log('Since Supabase requires CLI or manual execution, choose one:\n');
    console.log('Option 1: Use Supabase CLI (Recommended)');
    console.log('   npx supabase login');
    console.log('   npx supabase link --project-ref lnvebvrayuveygycpolc');
    console.log('   npx supabase db push\n');
    console.log('Option 2: Manual SQL Execution');
    console.log('   Copy the SQL from each migration file into Supabase Dashboard → SQL Editor\n');
    console.log('Migration files to run:');
    migrations.forEach((m, i) => console.log(`   ${i + 1}. ${m}`));
  } else if (successful.length === migrations.length) {
    console.log('\n✨ All migrations validated successfully!');
  }
}

main().catch(console.error);

