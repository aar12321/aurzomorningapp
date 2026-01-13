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

async function restoreProgress() {
  console.log('\n🔧 Restoring user progress from quiz attempts...\n');
  
  // Get all users
  const { data: users } = await supabase
    .from('users')
    .select('id');
  
  if (!users) {
    console.log('No users found');
    return;
  }
  
  for (const user of users) {
    console.log(`\n👤 Processing user: ${user.id.substring(0, 8)}...`);
    
    // Get all quiz attempts for this user
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('quiz_id, completed_at, quizzes(topic_id, day_number)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: true });
    
    if (!attempts || attempts.length === 0) {
      console.log('  No quiz attempts found');
      continue;
    }
    
    // Group by topic and find the highest day completed
    const topicProgress = new Map(); // topic_id -> { maxDay, lastCompleted }
    
    for (const attempt of attempts) {
      const quiz = attempt.quizzes;
      if (!quiz || !quiz.topic_id) continue;
      
      const topicId = quiz.topic_id;
      const dayNum = quiz.day_number;
      
      if (!topicProgress.has(topicId)) {
        topicProgress.set(topicId, { maxDay: dayNum, lastCompleted: attempt.completed_at });
      } else {
        const current = topicProgress.get(topicId);
        if (dayNum > current.maxDay) {
          current.maxDay = dayNum;
          current.lastCompleted = attempt.completed_at;
        }
      }
    }
    
    console.log(`  Found progress for ${topicProgress.size} topics`);
    
    // Update user_topics based on quiz attempts
    for (const [topicId, progress] of topicProgress.entries()) {
      // Get the user_topic
      const { data: userTopic } = await supabase
        .from('user_topics')
        .select('id, topic_id, current_day, completed_days, topics(name)')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .maybeSingle();
      
      if (!userTopic) {
        console.log(`  ⚠️  No user_topic found for topic ${topicId}`);
        continue;
      }
      
      const topicName = Array.isArray(userTopic.topics) ? userTopic.topics[0]?.name : userTopic.topics?.name || 'Unknown';
      const maxDay = progress.maxDay;
      
      // The next day should be maxDay + 1, and completed_days should be maxDay
      const nextDay = maxDay + 1;
      
      if (userTopic.current_day !== nextDay || userTopic.completed_days !== maxDay) {
        console.log(`  📚 ${topicName}:`);
        console.log(`     Current: day ${userTopic.current_day}, completed: ${userTopic.completed_days}`);
        console.log(`     Should be: day ${nextDay}, completed: ${maxDay}`);
        console.log(`     → Updating...`);
        
        const { error } = await supabase
          .from('user_topics')
          .update({
            current_day: nextDay,
            completed_days: maxDay,
            unlock_day: nextDay // Also update unlock_day to allow access
          })
          .eq('id', userTopic.id);
        
        if (error) {
          console.log(`     ❌ Error: ${error.message}`);
        } else {
          console.log(`     ✓ Updated`);
        }
      } else {
        console.log(`  ✓ ${topicName}: Already correct (day ${nextDay}, completed: ${maxDay})`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Progress restoration complete!');
  console.log('='.repeat(50) + '\n');
}

restoreProgress().catch(console.error);

