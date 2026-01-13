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

async function ensureAllQuizzesReady() {
  console.log('\n🔧 Ensuring ALL user topics have available quizzes...\n');
  
  // Get all user_topics
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select('id, user_id, topic_id, current_day, unlock_day, topics(name)');
  
  if (!userTopics || userTopics.length === 0) {
    console.log('No user_topics found');
    return;
  }
  
  console.log(`Found ${userTopics.length} user_topics\n`);
  
  // Build map of first day for each topic from CSV
  const csv = fs.readFileSync('quizzes.csv', 'utf-8');
  const lines = csv.split('\n');
  const topicFirstDay = new Map(); // topicName -> firstDay
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = parseCSVLine(line);
    if (parts.length < 11) continue;
    
    const topicName = parts[0];
    const day = parseInt(parts[1]);
    
    if (topicName && !isNaN(day)) {
      if (!topicFirstDay.has(topicName) || topicFirstDay.get(topicName) > day) {
        topicFirstDay.set(topicName, day);
      }
    }
  }
  
  let fixedCount = 0;
  let missingQuizCount = 0;
  
  for (const userTopic of userTopics) {
    const topicName = Array.isArray(userTopic.topics) ? userTopic.topics[0]?.name : userTopic.topics?.name || 'Unknown';
    const currentDay = userTopic.current_day || 1;
    const unlockDay = userTopic.unlock_day || 1;
    
    // Find first day for this topic in CSV
    const csvFirstDay = topicFirstDay.get(topicName);
    
    if (!csvFirstDay) {
      console.log(`⚠️  ${topicName}: Not found in CSV`);
      continue;
    }
    
    // Check if quiz exists for the current day they're on
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('topic_id', userTopic.topic_id)
      .eq('day_number', currentDay)
      .maybeSingle();
    
    if (!quiz) {
      console.log(`❌ ${topicName} Day ${currentDay}: Quiz missing`);
      missingQuizCount++;
      
      // If current day is before the first available day, update it
      if (currentDay < csvFirstDay) {
        console.log(`  → Updating to Day ${csvFirstDay} (first available day)`);
        
        const { error } = await supabase
          .from('user_topics')
          .update({
            current_day: csvFirstDay,
            unlock_day: Math.max(unlockDay, csvFirstDay)
          })
          .eq('id', userTopic.id);
        
        if (error) {
          console.error(`  ❌ Error updating: ${error.message}`);
        } else {
          console.log(`  ✓ Updated`);
          fixedCount++;
        }
      } else {
        console.log(`  → Day ${currentDay} is >= first day ${csvFirstDay}, but quiz doesn't exist - needs to be created`);
      }
    } else {
      // Verify quiz has questions
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quiz.id);
      
      if (!count || count === 0) {
        console.log(`⚠️  ${topicName} Day ${currentDay}: Quiz exists but has no questions`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`✓ Fixed: ${fixedCount} user_topics`);
  console.log(`⚠️  Missing quizzes: ${missingQuizCount}`);
  console.log('='.repeat(50) + '\n');
}

ensureAllQuizzesReady().catch(console.error);

