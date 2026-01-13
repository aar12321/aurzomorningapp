#!/usr/bin/env node
/**
 * Setup script to help run Supabase migrations
 * This provides instructions and can use npx to run the Supabase CLI
 */

import { execSync } from 'child_process';

console.log('🚀 Supabase Migration Setup\n');

const projectRef = 'lnvebvrayuveygycpolc'; // From config.toml

console.log('📋 Options to run migrations:\n');

console.log('Option 1: Use Supabase CLI (Recommended)');
console.log('─────────────────────────────────────────');
console.log('1. Install Supabase CLI:');
console.log('   Windows (Scoop): scoop install supabase');
console.log('   Windows (Chocolatey): choco install supabase');
console.log('   Or download from: https://github.com/supabase/cli/releases\n');
console.log('2. Login to Supabase:');
console.log('   supabase login\n');
console.log('3. Link your project:');
console.log(`   supabase link --project-ref ${projectRef}\n`);
console.log('4. Push migrations:');
console.log('   supabase db push\n');

console.log('Option 2: Use npx (No installation needed)');
console.log('──────────────────────────────────────────');
console.log('Run this command:');
console.log('   npx supabase db push --project-ref ' + projectRef + '\n');

console.log('Option 3: Manual SQL Execution');
console.log('───────────────────────────────');
console.log('Copy and paste the SQL from these files into Supabase Dashboard → SQL Editor:');
console.log('   1. supabase/migrations/20251201000002_add_location_and_game_scores.sql');
console.log('   2. supabase/migrations/20251207000000_create_user_preferences.sql');
console.log('   3. supabase/migrations/20251207000001_consolidate_preferences.sql');
console.log('   4. supabase/migrations/20250120000001_add_flashcards_and_goals.sql\n');

// Try to use npx if available
try {
  console.log('🔄 Attempting to use npx supabase...\n');
  execSync('npx --version', { stdio: 'ignore' });
  
  console.log('✅ npx is available. Running: npx supabase db push\n');
  console.log('⚠️  Note: You may need to login first with: npx supabase login\n');
  
  // Uncomment the line below to actually run the command
  // execSync(`npx supabase db push --project-ref ${projectRef}`, { stdio: 'inherit' });
  console.log('💡 To actually run migrations, uncomment the execSync line in this script\n');
  
} catch (error) {
  console.log('❌ npx not available. Please use one of the options above.\n');
}

