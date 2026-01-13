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

async function fixCurrentDay() {
  console.log('\n🔧 Fixing current_day for completed quizzes...\n');
  
  // Get all user topics
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select(`
      id,
      topic_id,
      current_day,
      completed_days,
      unlock_day,
      topics(name),
      users(full_name)
    `);
  
  if (!userTopics) {
    console.log('No user topics found');
    return;
  }
  
  let fixed = 0;
  
  for (const ut of userTopics) {
    const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
    const userName = Array.isArray(ut.users) ? ut.users[0]?.full_name : ut.users?.full_name || 'Unknown';
    
    // If completed_days > 0, current_day should be completed_days + 1
    // But it should never exceed unlock_day (they can't access beyond what's unlocked)
    const expectedCurrentDay = ut.completed_days > 0 ? ut.completed_days + 1 : ut.current_day;
    const maxAllowedDay = ut.unlock_day || 1;
    const correctCurrentDay = Math.min(expectedCurrentDay, maxAllowedDay);
    
    if (ut.current_day !== correctCurrentDay) {
      console.log(`Fixing ${topicName} (${userName}):`);
      console.log(`  current_day: ${ut.current_day} → ${correctCurrentDay}`);
      console.log(`  completed_days: ${ut.completed_days}, unlock_day: ${ut.unlock_day}`);
      
      const { error } = await supabase
        .from('user_topics')
        .update({ current_day: correctCurrentDay })
        .eq('id', ut.id);
      
      if (error) {
        console.error(`  ❌ Error: ${error.message}`);
      } else {
        console.log(`  ✅ Fixed`);
        fixed++;
      }
    }
  }
  
  console.log(`\n✅ Fixed ${fixed} user topics`);
  console.log('\n📊 Final status:');
  
  // Show updated status
  const { data: updatedTopics } = await supabase
    .from('user_topics')
    .select(`
      id,
      topic_id,
      current_day,
      completed_days,
      unlock_day,
      topics(name),
      users(full_name)
    `)
    .order('unlock_day', { ascending: false })
    .limit(10);
  
  if (updatedTopics) {
    updatedTopics.forEach(ut => {
      const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
      const userName = Array.isArray(ut.users) ? ut.users[0]?.full_name : ut.users?.full_name || 'Unknown';
      const isUnlocked = (ut.unlock_day || 1) >= ut.current_day;
      const status = isUnlocked ? '✅ Ready' : '🔒 Locked';
      
      console.log(`  ${topicName} (${userName}): current_day=${ut.current_day}, completed_days=${ut.completed_days}, unlock_day=${ut.unlock_day} ${status}`);
    });
  }
}

fixCurrentDay().catch(console.error);

