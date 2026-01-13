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

async function verifyAndFixUnlock() {
  console.log('\n🔍 Verifying unlock logic and fixing if needed...\n');
  
  // Check current time in EST
  const now = new Date();
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const estHour = estTime.getHours();
  const estMinute = estTime.getMinutes();
  
  console.log(`Current EST time: ${estTime.toLocaleString()}`);
  console.log(`EST Hour: ${estHour}, Minute: ${estMinute}`);
  
  // Check if it's past 8 AM EST today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const today8AM = new Date(today);
  today8AM.setHours(8, 0, 0, 0); // 8 AM EST in local time (we'll check unlock_log for actual unlock)
  
  // Check unlock_log for today
  const { data: unlockLog } = await supabase
    .from('unlock_log')
    .select('*')
    .eq('unlock_date', today.toISOString().split('T')[0])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (unlockLog) {
    const unlockTime = new Date(unlockLog.created_at);
    console.log(`\n✅ Today's unlock happened at: ${unlockTime.toLocaleString()}`);
    console.log(`   (${unlockTime.toISOString()})`);
  } else {
    console.log('\n⚠️  No unlock log entry for today');
    if (estHour >= 8) {
      console.log('   It\'s past 8 AM EST, but unlock hasn\'t been logged. Triggering now...');
      
      // Manually trigger unlock
      const { error } = await supabase.rpc('increment_unlock_day');
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        
        // If RPC doesn't work, update directly
        console.log('\n📝 Updating unlock_day directly...');
        const { data: allTopics } = await supabase
          .from('user_topics')
          .select('id, unlock_day');
        
        if (allTopics) {
          for (const topic of allTopics) {
            const { error: updateError } = await supabase
              .from('user_topics')
              .update({ unlock_day: (topic.unlock_day || 1) + 1 })
              .eq('id', topic.id);
            
            if (updateError) {
              console.error(`Error updating topic ${topic.id}: ${updateError.message}`);
            }
          }
          console.log('✓ Successfully incremented all unlock_day values');
        }
      } else {
        console.log('✓ Unlock function executed successfully');
      }
    }
  }
  
  // Check all user topics and their unlock status
  console.log('\n📊 Current unlock status for all user topics:');
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
    `)
    .order('unlock_day', { ascending: false });
  
  if (userTopics) {
    userTopics.forEach(ut => {
      const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
      const userName = Array.isArray(ut.users) ? ut.users[0]?.full_name : ut.users?.full_name || 'Unknown';
      const isUnlocked = (ut.unlock_day || 1) >= ut.current_day;
      const status = isUnlocked ? '✅ Ready' : '🔒 Locked';
      
      console.log(`  ${topicName} (${userName}):`);
      console.log(`    unlock_day=${ut.unlock_day}, current_day=${ut.current_day}, completed_days=${ut.completed_days}`);
      console.log(`    Status: ${status} (unlock_day ${isUnlocked ? '>=' : '<'} current_day)`);
    });
  }
  
  // Check if there are topics that should be unlocked but aren't
  const needsUnlock = userTopics?.filter(ut => {
    const unlockDay = ut.unlock_day || 1;
    // If completed_days > 0, they should be able to access the next day
    // unlock_day should be >= completed_days + 1
    return ut.completed_days > 0 && unlockDay < ut.completed_days + 1;
  });
  
  if (needsUnlock && needsUnlock.length > 0) {
    console.log(`\n⚠️  Found ${needsUnlock.length} topics that need unlock adjustment:`);
    needsUnlock.forEach(ut => {
      const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
      console.log(`  ${topicName}: completed_days=${ut.completed_days}, unlock_day=${ut.unlock_day}, should be >= ${ut.completed_days + 1}`);
    });
    
    if (estHour >= 8) {
      console.log('\n🔧 Fixing unlock_day values...');
      for (const ut of needsUnlock) {
        const shouldUnlockDay = ut.completed_days + 1;
        if ((ut.unlock_day || 1) < shouldUnlockDay) {
          const { error } = await supabase
            .from('user_topics')
            .update({ unlock_day: shouldUnlockDay })
            .eq('id', ut.id);
          
          if (error) {
            console.error(`Error fixing ${ut.id}: ${error.message}`);
          } else {
            const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
            console.log(`  ✓ Fixed ${topicName}: unlock_day set to ${shouldUnlockDay}`);
          }
        }
      }
    }
  }
}

verifyAndFixUnlock().catch(console.error);

