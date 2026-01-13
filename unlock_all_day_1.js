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

async function unlockAllDay1() {
  console.log('\n🔓 Unlocking Day 1 for all user topics...\n');
  
  // Get all user_topics
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select('id, user_id, topic_id, current_day, unlock_day, topics(name)');
  
  if (!userTopics || userTopics.length === 0) {
    console.log('No user_topics found');
    return;
  }
  
  console.log(`Found ${userTopics.length} user_topics\n`);
  
  let updatedCount = 0;
  
  for (const userTopic of userTopics) {
    const topicName = Array.isArray(userTopic.topics) ? userTopic.topics[0]?.name : userTopic.topics?.name || 'Unknown';
    const currentDay = userTopic.current_day || 1;
    const unlockDay = userTopic.unlock_day || 1;
    
    // Find the first available quiz day for this topic
    const { data: firstQuiz } = await supabase
      .from('quizzes')
      .select('day_number')
      .eq('topic_id', userTopic.topic_id)
      .order('day_number', { ascending: true })
      .limit(1)
      .maybeSingle();
    
    if (!firstQuiz) {
      console.log(`⚠️  ${topicName}: No quizzes exist, skipping`);
      continue;
    }
    
    const firstAvailableDay = firstQuiz.day_number;
    
    // If unlock_day is greater than first available day, or if current_day is before first available day
    if (unlockDay > firstAvailableDay || currentDay < firstAvailableDay) {
      console.log(`📚 ${topicName}:`);
      console.log(`   Current: Day ${currentDay}, Unlock: Day ${unlockDay}`);
      console.log(`   First available quiz: Day ${firstAvailableDay}`);
      console.log(`   → Unlocking Day ${firstAvailableDay}`);
      
      const { error } = await supabase
        .from('user_topics')
        .update({
          current_day: firstAvailableDay,
          unlock_day: firstAvailableDay
        })
        .eq('id', userTopic.id);
      
      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✓ Updated\n`);
        updatedCount++;
      }
    }
  }
  
  console.log('='.repeat(50));
  console.log(`✅ Updated ${updatedCount} user_topics`);
  console.log('All topics now have Day 1 (or first available day) unlocked!\n');
}

unlockAllDay1().catch(console.error);

