#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://lnvebvrayuveygycpolc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REMOVED_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function fixNonCSVTopics() {
  console.log('\n🔧 Fixing topics that are not in CSV...\n');
  
  // Get CSV topics
  const csv = fs.readFileSync('quizzes.csv', 'utf-8');
  const lines = csv.split('\n');
  const csvTopics = new Set();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = parseCSVLine(line);
    if (parts.length > 0 && parts[0]) {
      csvTopics.add(parts[0]);
    }
  }
  
  // Topic mappings for variations
  const topicMappings = {
    'Calculus': 'Pre-Calculus', // Map Calculus to Pre-Calculus
    'General Knowledge': 'General Knowledge (Ongoing)',
    'Business': 'Business & Career (Ongoing)'
  };
  
  // Get all user_topics
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select('id, user_id, topic_id, topics(name)');
  
  if (!userTopics) {
    console.log('No user_topics found');
    return;
  }
  
  console.log(`Found ${userTopics.length} user_topics to check\n`);
  
  let fixedCount = 0;
  
  for (const userTopic of userTopics) {
    const topicName = Array.isArray(userTopic.topics) ? userTopic.topics[0]?.name : userTopic.topics?.name || 'Unknown';
    
    // Check if topic is in CSV or has a mapping
    const mappedName = topicMappings[topicName];
    const csvName = mappedName || topicName;
    const isInCSV = csvTopics.has(csvName);
    
    if (!isInCSV) {
      console.log(`⚠️  ${topicName} is not in CSV`);
      continue;
    }
    
    if (mappedName && mappedName !== topicName) {
      // Need to update to mapped topic
      console.log(`🔄 Mapping ${topicName} → ${mappedName}`);
      
      // Get mapped topic
      const { data: mappedTopic } = await supabase
        .from('topics')
        .select('id, name')
        .eq('name', mappedName)
        .maybeSingle();
      
      if (!mappedTopic) {
        console.log(`  ❌ Mapped topic '${mappedName}' not found in database`);
        continue;
      }
      
      // Check if user already has mapped topic
      const { data: existing } = await supabase
        .from('user_topics')
        .select('id')
        .eq('user_id', userTopic.user_id)
        .eq('topic_id', mappedTopic.id)
        .maybeSingle();
      
      if (existing) {
        // User already has it, just delete the old one
        const { error } = await supabase
          .from('user_topics')
          .delete()
          .eq('id', userTopic.id);
        
        if (error) {
          console.log(`  ❌ Error deleting: ${error.message}`);
        } else {
          console.log(`  ✓ Removed duplicate (user already has ${mappedName})`);
          fixedCount++;
        }
      } else {
        // Update to mapped topic
        const { error } = await supabase
          .from('user_topics')
          .update({ topic_id: mappedTopic.id })
          .eq('id', userTopic.id);
        
        if (error) {
          console.log(`  ❌ Error updating: ${error.message}`);
        } else {
          console.log(`  ✓ Updated to ${mappedName}`);
          fixedCount++;
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Fixed ${fixedCount} topics`);
  console.log('='.repeat(50) + '\n');
}

fixNonCSVTopics().catch(console.error);

