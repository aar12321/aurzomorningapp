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

async function verifyAllReady() {
  console.log('\n🔍 Verifying all user topics have Day 1 quizzes...\n');
  
  // Get all user_topics with topic names
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select(`
      id,
      user_id,
      topic_id,
      current_day,
      unlock_day,
      topics!inner (
        id,
        name
      )
    `);
  
  if (!userTopics || userTopics.length === 0) {
    console.log('No user_topics found');
    return;
  }
  
  console.log(`Found ${userTopics.length} user_topics\n`);
  
  const issues = [];
  
  for (const userTopic of userTopics) {
    const topic = userTopic.topics;
    const topicName = topic.name;
    const currentDay = userTopic.current_day || 1;
    const unlockDay = userTopic.unlock_day || 1;
    
    console.log(`📚 ${topicName}:`);
    console.log(`   Current day: ${currentDay}, Unlock day: ${unlockDay}`);
    
    // Check if quiz exists for current day
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('topic_id', userTopic.topic_id)
      .eq('day_number', currentDay)
      .maybeSingle();
    
    if (!quiz) {
      console.log(`   ❌ No quiz for Day ${currentDay}`);
      issues.push({ topicName, currentDay, issue: 'No quiz' });
      
      // Find first available day
      const { data: firstQuiz } = await supabase
        .from('quizzes')
        .select('day_number')
        .eq('topic_id', userTopic.topic_id)
        .order('day_number', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (firstQuiz) {
        console.log(`   → First available quiz is Day ${firstQuiz.day_number}`);
        console.log(`   → Updating user_topic to Day ${firstQuiz.day_number}`);
        
        const { error } = await supabase
          .from('user_topics')
          .update({
            current_day: firstQuiz.day_number,
            unlock_day: Math.max(unlockDay, firstQuiz.day_number)
          })
          .eq('id', userTopic.id);
        
        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
        } else {
          console.log(`   ✓ Fixed`);
        }
      } else {
        console.log(`   ❌ No quizzes exist for this topic at all!`);
      }
    } else {
      // Check if it has questions
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quiz.id);
      
      if (!count || count !== 3) {
        console.log(`   ${count === 3 ? '✓' : '⚠️ '} Quiz exists with ${count || 0} questions`);
      }
    }
    console.log();
  }
  
  if (issues.length === 0) {
    console.log('✅ All user topics have available quizzes!\n');
  } else {
    console.log(`⚠️  Found ${issues.length} issues\n`);
  }
}

verifyAllReady().catch(console.error);

