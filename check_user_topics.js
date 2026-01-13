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

async function checkUserTopics() {
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select('id, user_id, topic_id, current_day, topics(name)')
    .order('user_id');
  
  console.log('\n📋 Current user_topics:\n');
  
  if (!userTopics || userTopics.length === 0) {
    console.log('No user_topics found');
    return;
  }
  
  // Group by user
  const byUser = new Map();
  userTopics.forEach(ut => {
    const userId = ut.user_id;
    if (!byUser.has(userId)) {
      byUser.set(userId, []);
    }
    const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
    byUser.get(userId).push(topicName);
  });
  
  for (const [userId, topics] of byUser.entries()) {
    console.log(`User: ${userId.substring(0, 8)}...`);
    topics.forEach(topic => {
      console.log(`  - ${topic}`);
    });
    console.log();
  }
  
  // Check if Financial Literacy exists
  const { data: financialLiteracyTopic } = await supabase
    .from('topics')
    .select('id, name')
    .eq('name', 'Financial Literacy')
    .maybeSingle();
  
  if (financialLiteracyTopic) {
    const { data: flUserTopics } = await supabase
      .from('user_topics')
      .select('id, user_id')
      .eq('topic_id', financialLiteracyTopic.id);
    
    console.log(`\nFinancial Literacy user_topics: ${flUserTopics?.length || 0}`);
  }
}

checkUserTopics().catch(console.error);

