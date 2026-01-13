// Check which quiz has 0 questions
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lnvebvrayuveygycpolc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REMOVED_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkQuizQuestions() {
  console.log('\n🔍 Checking quiz with 0 questions...\n');
  
  const topicId = 'ce24b8bf-6c80-40d0-ade5-126ff2d7ceff';
  const day = 2;
  
  // Get topic name
  const { data: topic } = await supabase
    .from('topics')
    .select('id, name')
    .eq('id', topicId)
    .maybeSingle();
  
  if (topic) {
    console.log(`Topic: ${topic.name} (${topic.id})`);
  } else {
    console.log(`Topic not found: ${topicId}`);
  }
  
  // Get quiz
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, day_number')
    .eq('topic_id', topicId)
    .eq('day_number', day)
    .maybeSingle();
  
  if (quiz) {
    console.log(`Quiz found: Day ${quiz.day_number} (${quiz.id})`);
    
    // Count questions
    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quiz.id);
    
    console.log(`Questions: ${count || 0}`);
    
    if (count === 0) {
      console.log('\n⚠️  This quiz has 0 questions!');
      console.log('This quiz should either be deleted or have questions added.');
    }
  } else {
    console.log(`Quiz not found for topic ${topicId} day ${day}`);
  }
}

checkQuizQuestions().catch(console.error);

