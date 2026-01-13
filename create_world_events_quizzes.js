#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://lnvebvrayuveygycpolc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REMOVED_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

async function createWorldEventsQuizzes() {
  console.log('\n🔧 Creating Day 1 quizzes for World Events topics...\n');
  
  // Topics to create: World Events, World Events & Trends
  const missingTopics = ['World Events', 'World Events & Trends'];
  
  // Source topic to copy from: Geography & World Knowledge (Ongoing) or Cultural Awareness & Global Events
  const sourceTopicNames = ['Geography & World Knowledge (Ongoing)', 'Cultural Awareness & Global Events'];
  
  // Get topic IDs
  const { data: allTopics } = await supabase
    .from('topics')
    .select('id, name');
  
  const topicMap = new Map();
  allTopics?.forEach(t => {
    topicMap.set(t.name, t.id);
  });
  
  // Find source topic
  let sourceTopicId = null;
  let sourceTopicName = null;
  
  for (const sourceName of sourceTopicNames) {
    if (topicMap.has(sourceName)) {
      sourceTopicId = topicMap.get(sourceName);
      sourceTopicName = sourceName;
      break;
    }
  }
  
  if (!sourceTopicId) {
    console.log('❌ Could not find source topic for copying questions');
    return;
  }
  
  console.log(`Using "${sourceTopicName}" as source for questions\n`);
  
  // Get Day 1 quiz from source topic
  const { data: sourceQuiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('topic_id', sourceTopicId)
    .eq('day_number', 1)
    .maybeSingle();
  
  if (!sourceQuiz) {
    console.log('❌ Source topic does not have a Day 1 quiz');
    return;
  }
  
  // Get questions from source quiz
  const { data: sourceQuestions } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', sourceQuiz.id)
    .order('order_number', { ascending: true })
    .limit(3);
  
  if (!sourceQuestions || sourceQuestions.length < 3) {
    console.log('❌ Source quiz does not have 3 questions');
    return;
  }
  
  console.log(`Found ${sourceQuestions.length} questions from source\n`);
  
  // Create Day 1 quizzes for missing topics
  for (const topicName of missingTopics) {
    const topicId = topicMap.get(topicName);
    
    if (!topicId) {
      console.log(`  ⚠️  Topic "${topicName}" not found in database`);
      continue;
    }
    
    // Check if Day 1 quiz exists
    const { data: existingQuiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('topic_id', topicId)
      .eq('day_number', 1)
      .maybeSingle();
    
    let quizId;
    
    if (existingQuiz) {
      quizId = existingQuiz.id;
      console.log(`  ✓ Quiz exists for "${topicName}", updating questions...`);
    } else {
      // Create quiz
      const { data: newQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          topic_id: topicId,
          day_number: 1
        })
        .select()
        .single();
      
      if (quizError) {
        console.error(`  ❌ Error creating quiz: ${quizError.message}`);
        continue;
      }
      
      quizId = newQuiz.id;
      console.log(`  ✅ Created Day 1 quiz for "${topicName}"`);
    }
    
    // Delete existing questions
    await supabase
      .from('questions')
      .delete()
      .eq('quiz_id', quizId);
    
    // Insert questions (copy from source)
    const questionsToInsert = sourceQuestions.map((q, idx) => ({
      quiz_id: quizId,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      order_number: idx + 1
    }));
    
    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);
    
    if (questionsError) {
      console.error(`    ❌ Error inserting questions: ${questionsError.message}`);
    } else {
      console.log(`    ✅ Inserted ${questionsToInsert.length} questions`);
    }
  }
  
  // Final verification
  console.log('\n🔍 Final verification...');
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select(`
      id,
      topic_id,
      topics(name)
    `);
  
  if (userTopics) {
    const missingDay1 = [];
    
    for (const ut of userTopics) {
      const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
      
      const { data: day1Quiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('topic_id', ut.topic_id)
        .eq('day_number', 1)
        .maybeSingle();
      
      if (!day1Quiz) {
        missingDay1.push(topicName);
      } else {
        const { count: questionCount } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', day1Quiz.id);
        
        if (questionCount < 3) {
          missingDay1.push(`${topicName} (has ${questionCount} questions, need 3)`);
        }
      }
    }
    
    if (missingDay1.length === 0) {
      console.log('  ✅ All user topics have Day 1 quizzes with 3+ questions!');
    } else {
      console.log(`  ⚠️  ${missingDay1.length} topics still missing Day 1 quizzes:`);
      missingDay1.forEach(name => console.log(`    - ${name}`));
    }
  }
  
  console.log('\n✅ Done!\n');
}

createWorldEventsQuizzes().catch(console.error);

