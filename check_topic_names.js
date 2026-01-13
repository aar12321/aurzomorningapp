#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lnvebvrayuveygycpolc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REMOVED_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTopics() {
  const { data: topics } = await supabase
    .from('topics')
    .select('id, name, category')
    .order('category, name');
  
  console.log('\n📋 All Topics in Database:\n');
  let currentCategory = '';
  topics?.forEach(t => {
    if (t.category !== currentCategory) {
      currentCategory = t.category;
      console.log(`\n${currentCategory}:`);
    }
    console.log(`  - ${t.name} (${t.id})`);
  });
  
  // Check for Math topics specifically
  console.log('\n\n🔍 Math-related topics:');
  topics?.filter(t => 
    t.name.toLowerCase().includes('math') || 
    t.name.toLowerCase().includes('geometry') ||
    t.name.toLowerCase().includes('algebra') ||
    t.name.toLowerCase().includes('calculus')
  ).forEach(t => {
    console.log(`  - ${t.name} (${t.category})`);
  });
}

checkTopics().catch(console.error);


