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

async function replaceFinancialLiteracy() {
  console.log('\n🔄 Replacing Financial Literacy with CSV topics...\n');
  
  // Step 1: Get all topics from CSV
  console.log('📖 Reading topics from CSV...');
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
  
  console.log(`✓ Found ${csvTopics.size} unique topics in CSV\n`);
  
  // Step 2: Get Financial Literacy topic
  const { data: financialLiteracyTopic } = await supabase
    .from('topics')
    .select('id, name')
    .eq('name', 'Financial Literacy')
    .maybeSingle();
  
  if (!financialLiteracyTopic) {
    console.log('⚠️  Financial Literacy topic not found, nothing to replace');
    return;
  }
  
  console.log(`✓ Found Financial Literacy topic (ID: ${financialLiteracyTopic.id})\n`);
  
  // Step 3: Find all user_topics that use Financial Literacy
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select('id, user_id, topic_id')
    .eq('topic_id', financialLiteracyTopic.id);
  
  if (!userTopics || userTopics.length === 0) {
    console.log('⚠️  No user_topics found for Financial Literacy');
    return;
  }
  
  console.log(`Found ${userTopics.length} user_topic(s) to replace\n`);
  
  // Step 4: Get all topics from database that match CSV
  const { data: allDbTopics } = await supabase
    .from('topics')
    .select('id, name');
  
  if (!allDbTopics) {
    console.error('❌ Error fetching topics from database');
    return;
  }
  
  // Find CSV topics that exist in database
  const availableTopics = allDbTopics.filter(t => csvTopics.has(t.name));
  
  console.log(`✓ Found ${availableTopics.length} CSV topics in database\n`);
  
  // Step 5: Replace each user_topic
  // For each user, we'll replace Financial Literacy with topics they don't already have
  for (const userTopic of userTopics) {
    console.log(`\n👤 Processing user: ${userTopic.user_id}`);
    
    // Get user's current topics
    const { data: userCurrentTopics } = await supabase
      .from('user_topics')
      .select('topic_id')
      .eq('user_id', userTopic.user_id);
    
    const userTopicIds = new Set(userCurrentTopics?.map(ut => ut.topic_id) || []);
    
    // Find CSV topics user doesn't have yet
    const newTopics = availableTopics.filter(t => !userTopicIds.has(t.id));
    
    if (newTopics.length === 0) {
      console.log('  ⚠️  User already has all CSV topics, just removing Financial Literacy');
      // Just delete Financial Literacy
      const { error } = await supabase
        .from('user_topics')
        .delete()
        .eq('id', userTopic.id);
      
      if (error) {
        console.error(`  ❌ Error deleting: ${error.message}`);
      } else {
        console.log('  ✓ Removed Financial Literacy');
      }
      continue;
    }
    
    // Replace with first available CSV topic (or multiple if needed)
    // Let's replace with up to 2 topics to keep similar number
    const topicsToAdd = newTopics.slice(0, 2);
    
    console.log(`  Replacing with: ${topicsToAdd.map(t => t.name).join(', ')}`);
    
    // Delete Financial Literacy
    const { error: deleteError } = await supabase
      .from('user_topics')
      .delete()
      .eq('id', userTopic.id);
    
    if (deleteError) {
      console.error(`  ❌ Error deleting Financial Literacy: ${deleteError.message}`);
      continue;
    }
    
    // Add new topics
    const topicsToInsert = topicsToAdd.map(topic => ({
      user_id: userTopic.user_id,
      topic_id: topic.id,
      current_day: 1,
      completed_days: 0
    }));
    
    const { error: insertError } = await supabase
      .from('user_topics')
      .insert(topicsToInsert);
    
    if (insertError) {
      console.error(`  ❌ Error inserting new topics: ${insertError.message}`);
    } else {
      console.log(`  ✓ Successfully replaced with ${topicsToAdd.length} topic(s)`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Replacement complete!');
  console.log('='.repeat(50) + '\n');
  
  // Show updated user topics
  if (userTopics.length > 0) {
    const userId = userTopics[0].user_id;
    const { data: updatedTopics } = await supabase
      .from('user_topics')
      .select('id, topics(name)')
      .eq('user_id', userId);
    
    console.log('📋 Updated user topics:');
    updatedTopics?.forEach(ut => {
      const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
      console.log(`  - ${topicName}`);
    });
  }
}

replaceFinancialLiteracy().catch(console.error);

