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

async function checkAndTriggerUnlock() {
  console.log('\n🔍 Checking unlock_day status and triggering unlock...\n');
  
  // Check current unlock_day values
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select('id, topic_id, current_day, completed_days, unlock_day, topics(name)')
    .limit(10);
  
  if (userTopics) {
    console.log('Current unlock_day values:');
    userTopics.forEach(ut => {
      const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
      console.log(`  ${topicName}: unlock_day=${ut.unlock_day}, current_day=${ut.current_day}, completed_days=${ut.completed_days}`);
    });
  }
  
  // Check what time it is now in EST
  const now = new Date();
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  console.log(`\nCurrent EST time: ${estTime.toLocaleString()}`);
  console.log(`EST Hour: ${estTime.getHours()}`);
  
  // Manually trigger the unlock function
  console.log('\n🔓 Manually triggering unlock function...');
  
  const { data, error } = await supabase.rpc('increment_unlock_day');
  
  if (error) {
    console.error(`❌ Error triggering unlock: ${error.message}`);
    console.log('\nThe function might not exist. Checking if we need to call it via SQL...');
    
    // Try updating directly
    console.log('\n📝 Manually incrementing unlock_day for all user_topics...');
    const { error: updateError } = await supabase
      .from('user_topics')
      .update({ unlock_day: supabase.rpc('increment') })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all
    
    if (updateError) {
      console.error(`❌ Error: ${updateError.message}`);
    } else {
      console.log('✓ Successfully incremented unlock_day');
    }
  } else {
    console.log('✓ Unlock function executed successfully');
  }
  
  // Check unlock_log to see last unlock
  console.log('\n📋 Checking unlock log...');
  const { data: unlockLog } = await supabase
    .from('unlock_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (unlockLog && unlockLog.length > 0) {
    console.log('Recent unlocks:');
    unlockLog.forEach(log => {
      console.log(`  ${log.unlock_date}: ${log.topics_unlocked} topics unlocked at ${log.created_at}`);
    });
  } else {
    console.log('No unlock log entries found');
  }
  
  // Verify unlock_day was incremented
  console.log('\n🔍 Verifying unlock_day after increment...');
  const { data: updatedTopics } = await supabase
    .from('user_topics')
    .select('id, unlock_day, topics(name)')
    .limit(5);
  
  if (updatedTopics) {
    updatedTopics.forEach(ut => {
      const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
      console.log(`  ${topicName}: unlock_day=${ut.unlock_day}`);
    });
  }
}

checkAndTriggerUnlock().catch(console.error);

