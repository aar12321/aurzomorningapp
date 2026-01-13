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

async function checkMissingQuizzes() {
  console.log('\n🔍 Checking for missing quizzes...\n');
  
  // Get all user_topics
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select('id, user_id, topic_id, current_day, unlock_day, topics(name)');
  
  if (!userTopics) {
    console.log('No user_topics found');
    return;
  }
  
  console.log(`Found ${userTopics.length} user_topics\n`);
  
  // Get all topics from CSV
  const csv = fs.readFileSync('quizzes.csv', 'utf-8');
  const lines = csv.split('\n');
  const csvQuizzes = new Map(); // key: `${topicName}|${day}`, value: true
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = parseCSVLine(line);
    if (parts.length < 11) continue;
    
    const topicName = parts[0];
    const day = parseInt(parts[1]);
    
    if (topicName && !isNaN(day)) {
      const key = `${topicName}|${day}`;
      csvQuizzes.set(key, true);
    }
  }
  
  console.log(`Found ${csvQuizzes.size} quizzes in CSV\n`);
  
  // Check each user_topic
  const missingQuizzes = [];
  
  for (const userTopic of userTopics) {
    const topicName = Array.isArray(userTopic.topics) ? userTopic.topics[0]?.name : userTopic.topics?.name || 'Unknown';
    const unlockDay = userTopic.unlock_day || 1;
    const currentDay = userTopic.current_day || 1;
    
    // Check Day 1 specifically (most common)
    const { data: day1Quiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('topic_id', userTopic.topic_id)
      .eq('day_number', 1)
      .maybeSingle();
    
    if (!day1Quiz) {
      // Check if it should exist in CSV
      const csvKey = `${topicName}|1`;
      const shouldExist = csvQuizzes.has(csvKey);
      
      missingQuizzes.push({
        topicName,
        day: 1,
        shouldExist,
        unlockDay,
        currentDay
      });
      
      console.log(`❌ ${topicName} Day 1: Missing${shouldExist ? ' (SHOULD EXIST in CSV!)' : ' (not in CSV)'}`);
    }
  }
  
  console.log(`\n📊 Summary: ${missingQuizzes.length} missing Day 1 quizzes\n`);
  
  if (missingQuizzes.length > 0) {
    console.log('Missing quizzes that SHOULD exist (are in CSV):');
    missingQuizzes.filter(m => m.shouldExist).forEach(m => {
      console.log(`  - ${m.topicName} Day ${m.day}`);
    });
  }
}

checkMissingQuizzes().catch(console.error);

