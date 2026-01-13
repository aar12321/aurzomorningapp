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

async function fixAllQuizzes() {
  console.log('\n🔧 Fixing ALL quizzes to have exactly 3 questions...\n');
  
  // Get all quizzes
  const { data: allQuizzes } = await supabase
    .from('quizzes')
    .select('id, topic_id, day_number, topics(name)');
  
  if (!allQuizzes) {
    console.log('No quizzes found');
    return;
  }
  
  console.log(`Found ${allQuizzes.length} quizzes to check\n`);
  
  let fixedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  for (const quiz of allQuizzes) {
    const topicName = Array.isArray(quiz.topics) ? quiz.topics[0]?.name : quiz.topics?.name || 'Unknown';
    
    // Get all questions for this quiz
    const { data: questions } = await supabase
      .from('questions')
      .select('id, order_number')
      .eq('quiz_id', quiz.id)
      .order('order_number', { ascending: true });
    
    if (!questions) continue;
    
    const questionCount = questions.length;
    
    if (questionCount === 3) {
      // Already correct, skip
      skippedCount++;
      continue;
    }
    
    if (questionCount < 3) {
      console.log(`⚠️  ${topicName} Day ${quiz.day_number}: Only ${questionCount} questions (should be 3) - cannot fix automatically`);
      errorCount++;
      continue;
    }
    
    // More than 3 questions - keep only first 3
    const questionsToKeep = questions.slice(0, 3);
    const questionsToDelete = questions.slice(3);
    
    const idsToDelete = questionsToDelete.map(q => q.id);
    
    // Delete extra questions
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .in('id', idsToDelete);
    
    if (deleteError) {
      console.error(`❌ ${topicName} Day ${quiz.day_number}: Error deleting questions: ${deleteError.message}`);
      errorCount++;
      continue;
    }
    
    console.log(`✓ ${topicName} Day ${quiz.day_number}: Removed ${questionCount - 3} extra questions (now has 3)`);
    fixedCount++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`✓ Fixed: ${fixedCount} quizzes`);
  console.log(`⚠️  Skipped (already correct): ${skippedCount} quizzes`);
  console.log(`❌ Errors: ${errorCount} quizzes`);
  console.log('='.repeat(50) + '\n');
  
  // Verify English quiz specifically
  console.log('\n🔍 Checking English quiz specifically...\n');
  const { data: englishTopic } = await supabase
    .from('topics')
    .select('id, name')
    .eq('name', 'English')
    .maybeSingle();
  
  if (englishTopic) {
    const { data: englishQuizzes } = await supabase
      .from('quizzes')
      .select('id, day_number')
      .eq('topic_id', englishTopic.id)
      .order('day_number', { ascending: true });
    
    if (englishQuizzes) {
      for (const quiz of englishQuizzes) {
        const { data: questions } = await supabase
          .from('questions')
          .select('id')
          .eq('quiz_id', quiz.id);
        
        const count = questions?.length || 0;
        console.log(`English Day ${quiz.day_number}: ${count} questions`);
      }
    }
  }
}

fixAllQuizzes().catch(console.error);


