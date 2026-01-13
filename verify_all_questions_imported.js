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

async function verifyQuestions() {
  console.log('\n🔍 Verifying all questions are imported...\n');
  
  // Count total questions in database
  const { count, error } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log(`📊 Total questions in database: ${count}`);
  console.log(`📊 Expected from CSV: 3240\n`);
  
  if (count === 3240) {
    console.log('✅ SUCCESS: All 3240 questions from CSV are in the database!');
  } else if (count < 3240) {
    console.log(`⚠️  WARNING: Missing ${3240 - count} questions`);
  } else {
    console.log(`⚠️  WARNING: Extra ${count - 3240} questions found`);
  }
  
  // Count quizzes
  const { count: quizCount } = await supabase
    .from('quizzes')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📊 Total quizzes in database: ${quizCount}`);
  console.log(`📊 Expected from CSV: 1080\n`);
  
  // Check question distribution
  const { data: quizData } = await supabase
    .from('quizzes')
    .select('id, topic_id, day_number, topics(name)');
  
  if (quizData) {
    let totalQuestions = 0;
    let quizzesWithWrongCount = 0;
    
    for (const quiz of quizData.slice(0, 20)) {
      const topicName = Array.isArray(quiz.topics) ? quiz.topics[0]?.name : quiz.topics?.name || 'Unknown';
      const { count: qCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quiz.id);
      
      totalQuestions += qCount || 0;
      
      if (qCount !== 3) {
        quizzesWithWrongCount++;
        console.log(`⚠️  ${topicName} Day ${quiz.day_number}: ${qCount} questions (should be 3)`);
      }
    }
    
    if (quizzesWithWrongCount === 0) {
      console.log(`\n✅ First 20 quizzes all have exactly 3 questions`);
    }
  }
}

verifyQuestions().catch(console.error);

