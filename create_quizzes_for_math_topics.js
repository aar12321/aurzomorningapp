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

// Map Math category topics to Academic "Math – *" topics
// Note: The Academic topics use em-dash (–) not hyphen (-)
const MATH_TOPIC_MAP = {
  'Geometry': 'Math – Geometry',
  'Algebra': 'Math – Algebra',
  'Pre-Calculus': 'Math – Calculus', // Map Pre-Calculus to Math – Calculus
};

async function createQuizzesForMathTopics() {
  console.log('\n📚 Creating quizzes for Math - * topic variants...\n');
  
  let createdCount = 0;
  let questionsCopied = 0;
  
  for (const [baseTopic, mathTopic] of Object.entries(MATH_TOPIC_MAP)) {
    console.log(`Processing: ${baseTopic} → ${mathTopic}`);
    
    // Find base topic
    const { data: baseTopicData } = await supabase
      .from('topics')
      .select('id, name')
      .eq('name', baseTopic)
      .maybeSingle();
    
    if (!baseTopicData) {
      console.log(`  ⚠️  Base topic "${baseTopic}" not found, skipping`);
      continue;
    }
    
    // Find Math - * topic
    const { data: mathTopicData } = await supabase
      .from('topics')
      .select('id, name')
      .eq('name', mathTopic)
      .maybeSingle();
    
    if (!mathTopicData) {
      console.log(`  ⚠️  Math topic "${mathTopic}" not found, skipping`);
      continue;
    }
    
    console.log(`  Found: "${baseTopicData.name}" (${baseTopicData.id})`);
    console.log(`  Found: "${mathTopicData.name}" (${mathTopicData.id})`);
    
    // Get all quizzes for base topic
    const { data: baseQuizzes } = await supabase
      .from('quizzes')
      .select('id, day_number')
      .eq('topic_id', baseTopicData.id)
      .order('day_number', { ascending: true });
    
    if (!baseQuizzes || baseQuizzes.length === 0) {
      console.log(`  ⚠️  No quizzes found for base topic, skipping`);
      continue;
    }
    
    console.log(`  Found ${baseQuizzes.length} quizzes for base topic`);
    
    // For each quiz, create matching quiz for Math topic
    for (const baseQuiz of baseQuizzes) {
      // Check if quiz already exists for Math topic
      const { data: existingQuiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('topic_id', mathTopicData.id)
        .eq('day_number', baseQuiz.day_number)
        .maybeSingle();
      
      if (existingQuiz) {
        console.log(`    ✓ Quiz for Day ${baseQuiz.day_number} already exists`);
        continue;
      }
      
      // Create quiz for Math topic
      const { data: newQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          topic_id: mathTopicData.id,
          day_number: baseQuiz.day_number
        })
        .select()
        .single();
      
      if (quizError) {
        console.error(`    ❌ Error creating quiz: ${quizError.message}`);
        continue;
      }
      
      console.log(`    ✓ Created quiz for Day ${baseQuiz.day_number}`);
      createdCount++;
      
      // Copy all questions from base quiz to new quiz
      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', baseQuiz.id)
        .order('order_number', { ascending: true });
      
      if (questions && questions.length > 0) {
        const newQuestions = questions.map(q => ({
          quiz_id: newQuiz.id,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          order_number: q.order_number
        }));
        
        const { error: qError } = await supabase
          .from('questions')
          .insert(newQuestions);
        
        if (qError) {
          console.error(`    ❌ Error copying questions: ${qError.message}`);
        } else {
          console.log(`    ✓ Copied ${newQuestions.length} questions`);
          questionsCopied += newQuestions.length;
        }
      }
    }
    
    console.log('');
  }
  
  console.log('='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`✓ Created ${createdCount} quizzes`);
  console.log(`✓ Copied ${questionsCopied} questions`);
  console.log('='.repeat(50) + '\n');
}

createQuizzesForMathTopics().catch(console.error);

