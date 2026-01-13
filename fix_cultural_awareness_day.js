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

async function fixCulturalAwareness() {
  console.log('\n🔧 Checking Cultural Awareness & Global Events topic...\n');
  
  // Get the topic
  const { data: topic } = await supabase
    .from('topics')
    .select('id, name')
    .eq('name', 'Cultural Awareness & Global Events')
    .maybeSingle();
  
  if (!topic) {
    console.log('Topic not found');
    return;
  }
  
  // Get all quizzes for this topic to find the first day
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('day_number')
    .eq('topic_id', topic.id)
    .order('day_number', { ascending: true });
  
  if (!quizzes || quizzes.length === 0) {
    console.log('No quizzes found for this topic');
    return;
  }
  
  const firstDay = quizzes[0].day_number;
  console.log(`First quiz for this topic is Day ${firstDay}\n`);
  
  // Get user_topics for this topic
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select('id, user_id, current_day, unlock_day, topics(name)')
    .eq('topic_id', topic.id);
  
  if (!userTopics || userTopics.length === 0) {
    console.log('No user_topics found for this topic');
    return;
  }
  
  console.log(`Found ${userTopics.length} user_topic(s) for this topic\n`);
  
  // Update each user_topic to start at the first available day
  for (const userTopic of userTopics) {
    const topicName = Array.isArray(userTopic.topics) ? userTopic.topics[0]?.name : userTopic.topics?.name || 'Unknown';
    console.log(`Updating user_topic for ${topicName}:`);
    console.log(`  Current day: ${userTopic.current_day}`);
    console.log(`  Unlock day: ${userTopic.unlock_day}`);
    console.log(`  Setting to Day ${firstDay}`);
    
    const { error } = await supabase
      .from('user_topics')
      .update({
        current_day: firstDay,
        unlock_day: firstDay
      })
      .eq('id', userTopic.id);
    
    if (error) {
      console.error(`  ❌ Error: ${error.message}`);
    } else {
      console.log(`  ✓ Updated successfully\n`);
    }
  }
}

fixCulturalAwareness().catch(console.error);

