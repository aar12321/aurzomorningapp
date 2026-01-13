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

// Map CSV topic names to dashboard "Math – *" topic names
const MATH_TOPIC_MAP = {
  'Algebra': 'Math – Algebra',
  'Geometry': 'Math – Geometry',
  'Pre-Calculus': 'Math – Calculus'  // Note: CSV has "Pre-Calculus" but dashboard shows "Math – Calculus"
};

async function fixMathTopics() {
  console.log('\n🔧 Fixing Math – * topics by copying questions from base topics...\n');
  
  for (const [csvTopicName, dashboardTopicName] of Object.entries(MATH_TOPIC_MAP)) {
    console.log(`\n📚 Processing: ${csvTopicName} → ${dashboardTopicName}`);
    
    // Get base topic (from CSV)
    const { data: baseTopic, error: baseErr } = await supabase
      .from('topics')
      .select('id, name')
      .eq('name', csvTopicName)
      .maybeSingle();
    
    if (baseErr || !baseTopic) {
      console.error(`❌ Base topic '${csvTopicName}' not found`);
      continue;
    }
    
    // Get dashboard topic (Math – *)
    const { data: dashboardTopic, error: dashErr } = await supabase
      .from('topics')
      .select('id, name')
      .eq('name', dashboardTopicName)
      .maybeSingle();
    
    if (dashErr || !dashboardTopic) {
      console.error(`❌ Dashboard topic '${dashboardTopicName}' not found`);
      continue;
    }
    
    console.log(`  Base topic ID: ${baseTopic.id}`);
    console.log(`  Dashboard topic ID: ${dashboardTopic.id}`);
    
    // Get all quizzes for base topic
    const { data: baseQuizzes, error: quizzesErr } = await supabase
      .from('quizzes')
      .select('id, day_number')
      .eq('topic_id', baseTopic.id)
      .order('day_number', { ascending: true });
    
    if (quizzesErr || !baseQuizzes || baseQuizzes.length === 0) {
      console.error(`❌ No quizzes found for base topic '${csvTopicName}'`);
      continue;
    }
    
    console.log(`  Found ${baseQuizzes.length} quizzes for base topic`);
    
    let createdCount = 0;
    let questionsCopiedCount = 0;
    
    for (const baseQuiz of baseQuizzes) {
      // Check if quiz already exists for dashboard topic
      const { data: existingQuiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('topic_id', dashboardTopic.id)
        .eq('day_number', baseQuiz.day_number)
        .maybeSingle();
      
      let dashboardQuizId;
      
      if (existingQuiz) {
        dashboardQuizId = existingQuiz.id;
        console.log(`  Day ${baseQuiz.day_number}: Quiz already exists`);
      } else {
        // Create quiz for dashboard topic
        const { data: newQuiz, error: createErr } = await supabase
          .from('quizzes')
          .insert({
            topic_id: dashboardTopic.id,
            day_number: baseQuiz.day_number
          })
          .select()
          .single();
        
        if (createErr || !newQuiz) {
          console.error(`  ❌ Error creating quiz for Day ${baseQuiz.day_number}: ${createErr?.message || 'Unknown error'}`);
          continue;
        }
        
        dashboardQuizId = newQuiz.id;
        createdCount++;
        console.log(`  Day ${baseQuiz.day_number}: Created new quiz`);
      }
      
      // Check if questions already exist
      const { count: existingCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', dashboardQuizId);
      
      if (existingCount && existingCount > 0) {
        console.log(`  Day ${baseQuiz.day_number}: Already has ${existingCount} questions, skipping`);
        continue;
      }
      
      // Get questions from base quiz (all of them, up to 3)
      const { data: baseQuestions, error: questionsErr } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', baseQuiz.id)
        .order('order_number', { ascending: true })
        .limit(3);
      
      if (questionsErr || !baseQuestions || baseQuestions.length === 0) {
        console.error(`  ❌ No questions found for base quiz Day ${baseQuiz.day_number}`);
        continue;
      }
      
      // Copy questions to dashboard quiz
      const questionsToInsert = baseQuestions.map(q => ({
        quiz_id: dashboardQuizId,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        order_number: q.order_number
      }));
      
      const { error: insertErr } = await supabase
        .from('questions')
        .insert(questionsToInsert);
      
      if (insertErr) {
        console.error(`  ❌ Error inserting questions for Day ${baseQuiz.day_number}: ${insertErr.message}`);
        continue;
      }
      
      console.log(`  ✓ Day ${baseQuiz.day_number}: Copied ${questionsToInsert.length} questions`);
      questionsCopiedCount += questionsToInsert.length;
    }
    
    console.log(`\n  ✅ ${dashboardTopicName}: Created ${createdCount} quizzes, copied ${questionsCopiedCount} questions`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Fix complete!');
  console.log('='.repeat(50) + '\n');
  
  // Verify Math – Algebra specifically
  console.log('🔍 Verifying Math – Algebra...\n');
  const { data: algebraTopic } = await supabase
    .from('topics')
    .select('id, name')
    .eq('name', 'Math – Algebra')
    .maybeSingle();
  
  if (algebraTopic) {
    const { data: algebraQuizzes } = await supabase
      .from('quizzes')
      .select('id, day_number')
      .eq('topic_id', algebraTopic.id)
      .order('day_number', { ascending: true })
      .limit(5);
    
    if (algebraQuizzes) {
      for (const quiz of algebraQuizzes) {
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', quiz.id);
        
        console.log(`Math – Algebra Day ${quiz.day_number}: ${count} questions`);
      }
    }
  }
}

fixMathTopics().catch(console.error);
