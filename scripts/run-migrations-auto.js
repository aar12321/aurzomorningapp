#!/usr/bin/env node
/**
 * Automated migration runner using Supabase CLI via npx
 * This script attempts to automatically run migrations
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRef = 'lnvebvrayuveygycpolc';

console.log('🚀 Automated Supabase Migration Runner\n');
console.log('This script will attempt to run migrations using Supabase CLI.\n');

try {
  // Check if project is linked
  console.log('📋 Checking project status...\n');
  
  try {
    execSync('npx supabase status', { stdio: 'pipe' });
    console.log('✅ Project is linked. Proceeding with migration push...\n');
  } catch (error) {
    console.log('⚠️  Project not linked. Attempting to link...\n');
    console.log('📝 You may need to authenticate first.\n');
    console.log('   Run: npx supabase login\n');
    console.log('   Then run: npx supabase link --project-ref ' + projectRef + '\n');
    console.log('   Or continue manually with the steps below.\n');
  }

  // Try to push migrations
  console.log('🔄 Attempting to push migrations...\n');
  console.log('   Command: npx supabase db push\n');
  console.log('   ⚠️  If this fails, you may need to:');
  console.log('      1. Run: npx supabase login');
  console.log('      2. Run: npx supabase link --project-ref ' + projectRef);
  console.log('      3. Then run: npx supabase db push\n');
  
  // Uncomment to actually run (commented for safety)
  // execSync('npx supabase db push', { stdio: 'inherit' });
  
  console.log('💡 To actually run migrations, uncomment the execSync line in this script');
  console.log('   Or run manually: npx supabase db push\n');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\n📝 Please run migrations manually:');
  console.error('   1. npx supabase login');
  console.error('   2. npx supabase link --project-ref ' + projectRef);
  console.error('   3. npx supabase db push');
  console.error('\n   Or use the SQL Editor in Supabase Dashboard (see MIGRATIONS.md)');
  process.exit(1);
}

