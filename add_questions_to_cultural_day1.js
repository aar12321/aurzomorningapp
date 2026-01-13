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

async function addQuestionsToCulturalDay1() {
  console.log('\n🔧 Adding questions to Cultural Awareness & Global Events Day 1...\n');
  
  // Get the topic
  const { data: topic } = await supabase
    .from('topics')
    .select('id, name')
    .eq('name', 'Cultural Awareness & Global Events')
    .maybeSingle();
  
  if (!topic) {
    console.log('Topic not found');
    return;
  }
  
  // Get Day 1 quiz
  const { data: day1Quiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('topic_id', topic.id)
    .eq('day_number', 1)
    .maybeSingle();
  
  if (!day1Quiz) {
    console.log('Day 1 quiz not found');
    return;
  }
  
  // Check if it already has questions
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('quiz_id', day1Quiz.id);
  
  if (count && count > 0) {
    console.log(`Day 1 quiz already has ${count} questions`);
    return;
  }
  
  // Get the first available quiz (Day 301) and copy its questions
  const { data: firstQuiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('topic_id', topic.id)
    .neq('id', day1Quiz.id)
    .order('day_number', { ascending: true })
    .limit(1)
    .maybeSingle();
  
  if (!firstQuiz) {
    console.log('No other quizzes found to copy from');
    return;
  }
  
  console.log('Copying questions from first available quiz...');
  
  const { data: sourceQuestions } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', firstQuiz.id)
    .order('order_number', { ascending: true })
    .limit(3);
  
  if (!sourceQuestions || sourceQuestions.length === 0) {
    console.log('No questions found in source quiz');
    return;
  }
  
  const questionsToInsert = sourceQuestions.map((q, idx) => ({
    quiz_id: day1Quiz.id,
    question_text: q.question_text,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: q.option_d,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    order_number: idx + 1
  }));
  
  const { error } = await supabase
    .from('questions')
    .insert(questionsToInsert);
  
  if (error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.log(`✓ Added ${questionsToInsert.length} questions to Day 1`);
  }
}

addQuestionsToCulturalDay1().catch(console.error);

