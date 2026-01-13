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

async function checkUserProgress() {
  console.log('\n🔍 Checking user progress data...\n');
  
  // Get all user_topics with progress
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select('id, user_id, topic_id, current_day, completed_days, unlock_day, topics(name)')
    .order('current_day', { ascending: false });
  
  if (!userTopics || userTopics.length === 0) {
    console.log('No user_topics found');
    return;
  }
  
  console.log(`Found ${userTopics.length} user_topics\n`);
  
  for (const ut of userTopics) {
    const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
    console.log(`📚 ${topicName}:`);
    console.log(`   current_day: ${ut.current_day}`);
    console.log(`   completed_days: ${ut.completed_days}`);
    console.log(`   unlock_day: ${ut.unlock_day || 1}`);
    console.log();
  }
  
  // Check quiz attempts
  console.log('\n📊 Checking quiz attempts...\n');
  
  // Get user IDs
  const userIds = [...new Set(userTopics.map(ut => ut.user_id))];
  
  for (const userId of userIds) {
    const { data: attempts, count } = await supabase
      .from('quiz_attempts')
      .select('id, quiz_id, completed_at, quizzes(topic_id, day_number, topics(name))', { count: 'exact' })
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(10);
    
    if (attempts && attempts.length > 0) {
      console.log(`User ${userId.substring(0, 8)}... has ${count} total attempts`);
      console.log('Recent attempts:');
      attempts.forEach(attempt => {
        const quiz = attempt.quizzes;
        const topicName = Array.isArray(quiz?.topics) ? quiz?.topics[0]?.name : quiz?.topics?.name || 'Unknown';
        const dayNum = quiz?.day_number || 'Unknown';
        console.log(`  - ${topicName} Day ${dayNum} at ${attempt.completed_at}`);
      });
      console.log();
    }
  }
}

checkUserProgress().catch(console.error);

