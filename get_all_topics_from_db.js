#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lnvebvrayuveygycpolc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REMOVED_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function getAllTopics() {
  console.log('\n📋 Fetching all topics from database...\n');
  
  const { data: topics, error } = await supabase
    .from('topics')
    .select('id, name, category')
    .order('category, name');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${topics.length} topics:\n`);
  
  // Group by category
  const byCategory = {};
  topics.forEach(topic => {
    if (!byCategory[topic.category]) {
      byCategory[topic.category] = [];
    }
    byCategory[topic.category].push(topic);
  });
  
  // Print grouped
  Object.entries(byCategory).forEach(([category, topicList]) => {
    console.log(`${category}:`);
    topicList.forEach(topic => {
      console.log(`  - ${topic.name} (ID: ${topic.id})`);
    });
    console.log('');
  });
  
  // Generate code for Index.tsx
  console.log('\n📝 Code for Index.tsx:\n');
  console.log('const TOPICS = [');
  
  Object.entries(byCategory).forEach(([category, topicList]) => {
    topicList.forEach((topic, idx) => {
      // Determine icon based on topic name
      let icon = '📖'; // default
      const name = topic.name.toLowerCase();
      
      if (name.includes('math') || name.includes('algebra') || name.includes('geometry') || name.includes('calculus') || name.includes('pre-calculus')) {
        icon = '📊';
      } else if (name.includes('science') || name.includes('chemistry') || name.includes('biology') || name.includes('physics') || name.includes('physiology')) {
        icon = '🔬';
      } else if (name.includes('english')) {
        icon = '📚';
      } else if (name.includes('business') || name.includes('career')) {
        icon = '💼';
      } else if (name.includes('financial') || name.includes('retirement') || name.includes('credit') || name.includes('debt')) {
        icon = '💰';
      } else if (name.includes('knowledge') || name.includes('general')) {
        icon = '🧠';
      } else if (name.includes('world') || name.includes('geography') || name.includes('cultural') || name.includes('global')) {
        icon = '🌍';
      } else if (name.includes('ai') || name.includes('tech') || name.includes('technology') || name.includes('computer') || name.includes('cybersecurity') || name.includes('power bi') || name.includes('excel') || name.includes('email')) {
        icon = '🤖';
      } else if (name.includes('health') || name.includes('wellness') || name.includes('fitness') || name.includes('nutrition') || name.includes('mental health')) {
        icon = '💚';
      } else if (name.includes('history') || name.includes('culture')) {
        icon = '🏛️';
      } else if (name.includes('logic') || name.includes('problem solving')) {
        icon = '🧩';
      } else if (name.includes('sat') || name.includes('act')) {
        icon = '🎯';
      } else if (name.includes('fun') || name.includes('pop culture')) {
        icon = '🎬';
      } else if (name.includes('entrepreneurship') || name.includes('leadership') || name.includes('teamwork') || name.includes('small business')) {
        icon = '🚀';
      } else if (name.includes('resume') || name.includes('linkedin') || name.includes('interview') || name.includes('workplace') || name.includes('communication')) {
        icon = '📝';
      }
      
      const categoryName = category === 'Academic' ? 'Academic' : 
                          category === 'Math' ? 'Math' :
                          category === 'Adult Learning' ? 'Adult Learning' :
                          category === 'Geography' ? 'Geography' :
                          category === 'Health' ? 'Health' :
                          category === 'History' ? 'History' :
                          category === 'Technology' ? 'Technology' :
                          'Adult Learning';
      
      const comma = (idx === topicList.length - 1 && Object.keys(byCategory).indexOf(category) === Object.keys(byCategory).length - 1) ? '' : ',';
      
      console.log(`  { id: "${topic.id}", name: "${topic.name}", category: "${categoryName}", icon: "${icon}" }${comma}`);
    });
  });
  
  console.log('];');
  console.log('\n✅ Done!\n');
}

getAllTopics().catch(console.error);

