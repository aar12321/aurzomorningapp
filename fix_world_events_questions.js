// Fix World Events & Trends by copying questions from Cultural Awareness & Global Events
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lnvebvrayuveygycpolc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REMOVED_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixWorldEventsQuestions() {
  console.log('\n🔧 Fixing World Events & Trends questions...\n');
  
  // Step 1: Find both topics
  const { data: sourceTopic } = await supabase
    .from('topics')
    .select('id, name')
    .eq('name', 'Cultural Awareness & Global Events')
    .maybeSingle();
  
  const { data: targetTopic } = await supabase
    .from('topics')
    .select('id, name')
    .eq('name', 'World Events & Trends')
    .maybeSingle();
  
  if (!sourceTopic) {
    console.error('❌ Cultural Awareness & Global Events topic not found');
    return;
  }
  
  if (!targetTopic) {
    console.error('❌ World Events & Trends topic not found');
    return;
  }
  
  console.log(`✓ Found source topic: ${sourceTopic.name} (${sourceTopic.id})`);
  console.log(`✓ Found target topic: ${targetTopic.name} (${targetTopic.id})\n`);
  
  // Step 2: Get all quizzes for source topic
  const { data: sourceQuizzes } = await supabase
    .from('quizzes')
    .select('id, day_number')
    .eq('topic_id', sourceTopic.id)
    .order('day_number');
  
  if (!sourceQuizzes || sourceQuizzes.length === 0) {
    console.error('❌ No quizzes found for source topic');
    return;
  }
  
  console.log(`Found ${sourceQuizzes.length} quizzes for source topic\n`);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  // Step 3: For each source quiz, copy questions to target quiz
  for (const sourceQuiz of sourceQuizzes) {
    // Get or create target quiz
    let targetQuiz;
    const { data: existingTargetQuiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('topic_id', targetTopic.id)
      .eq('day_number', sourceQuiz.day_number)
      .maybeSingle();
    
    if (existingTargetQuiz) {
      targetQuiz = existingTargetQuiz;
    } else {
      // Create target quiz
      const { data: newQuiz, error: createError } = await supabase
        .from('quizzes')
        .insert({
          topic_id: targetTopic.id,
          day_number: sourceQuiz.day_number
        })
        .select()
        .single();
      
      if (createError || !newQuiz) {
        console.error(`  ❌ Error creating quiz for Day ${sourceQuiz.day_number}: ${createError?.message}`);
        errorCount++;
        continue;
      }
      targetQuiz = newQuiz;
    }
    
    // Check if target quiz already has questions
    const { count: existingCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', targetQuiz.id);
    
    if (existingCount >= 3) {
      console.log(`  ✓ Day ${sourceQuiz.day_number}: Already has ${existingCount} questions`);
      continue;
    }
    
    // Get questions from source quiz
    const { data: sourceQuestions } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', sourceQuiz.id)
      .order('order_number');
    
    if (!sourceQuestions || sourceQuestions.length === 0) {
      console.log(`  ⚠️  Day ${sourceQuiz.day_number}: No questions in source quiz`);
      continue;
    }
    
    // Delete existing questions from target (if any)
    await supabase
      .from('questions')
      .delete()
      .eq('quiz_id', targetQuiz.id);
    
    // Copy questions to target quiz (take first 3)
    const questionsToInsert = sourceQuestions.slice(0, 3).map((q, idx) => ({
      quiz_id: targetQuiz.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      order_number: idx + 1
    }));
    
    const { error: insertError } = await supabase
      .from('questions')
      .insert(questionsToInsert);
    
    if (insertError) {
      console.error(`  ❌ Day ${sourceQuiz.day_number}: Error inserting questions: ${insertError.message}`);
      errorCount++;
    } else {
      console.log(`  ✅ Day ${sourceQuiz.day_number}: Added ${questionsToInsert.length} questions`);
      fixedCount++;
    }
  }
  
  console.log('\n✅ FIX COMPLETE!');
  console.log(`  ✅ Fixed: ${fixedCount} quizzes`);
  console.log(`  ❌ Errors: ${errorCount}`);
  
  // Verify
  console.log('\n🔍 Verifying World Events & Trends...');
  const { data: targetQuizzes } = await supabase
    .from('quizzes')
    .select('id, day_number')
    .eq('topic_id', targetTopic.id)
    .order('day_number')
    .limit(5);
  
  if (targetQuizzes) {
    for (const quiz of targetQuizzes) {
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quiz.id);
      
      console.log(`  Day ${quiz.day_number}: ${count || 0} questions`);
    }
  }
}

fixWorldEventsQuestions().catch(console.error);

