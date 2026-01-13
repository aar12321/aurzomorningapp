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

async function createDay1ForMissing() {
  console.log('\n🔧 Creating Day 1 quizzes for missing topics...\n');
  
  // Missing topics: World Events, Health & Wellness, Power BI Basics, World Events & Trends, Mental Health Awareness
  const missingTopics = [
    'World Events',
    'Health & Wellness',
    'Power BI Basics',
    'World Events & Trends',
    'Mental Health Awareness'
  ];
  
  // Read CSV
  const csv = fs.readFileSync('quizzes.csv', 'utf-8');
  const lines = csv.split('\n');
  
  // Map: topicName -> first quiz (any day)
  const topicFirstQuiz = new Map();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = parseCSVLine(line);
    if (parts.length < 11) continue;
    
    const topicName = parts[0];
    const day = parseInt(parts[1]);
    const quizId = parts[2];
    const questionNumber = parseInt(parts[3]);
    
    if (!topicName) continue;
    
    const key = `${topicName}|${quizId}`;
    
    if (!topicFirstQuiz.has(topicName)) {
      topicFirstQuiz.set(topicName, {
        day,
        quizId,
        questions: []
      });
    }
    
    const quizData = topicFirstQuiz.get(topicName);
    if (quizData.quizId === quizId) {
      quizData.questions.push({
        questionNumber,
        questionText: parts[4],
        optionA: parts[5],
        optionB: parts[6],
        optionC: parts[7],
        optionD: parts[8],
        correctOption: parts[9],
        explanation: parts[10]
      });
    }
  }
  
  // Get all user topics
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select(`
      id,
      topic_id,
      topics(name)
    `);
  
  if (!userTopics) return;
  
  // Get all topics
  const { data: allTopics } = await supabase
    .from('topics')
    .select('id, name');
  
  const topicMap = new Map();
  allTopics?.forEach(t => {
    topicMap.set(t.name, t.id);
  });
  
  let createdCount = 0;
  
  for (const ut of userTopics) {
    const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
    
    // Skip if not in missing list
    if (!missingTopics.includes(topicName)) continue;
    
    // Check if Day 1 quiz exists
    const { data: existingQuiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('topic_id', ut.topic_id)
      .eq('day_number', 1)
      .maybeSingle();
    
    if (existingQuiz) {
      const { count: questionCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', existingQuiz.id);
      
      if (questionCount >= 3) {
        console.log(`  ✓ "${topicName}" already has Day 1 quiz with ${questionCount} questions`);
        continue;
      }
    }
    
    // Find first quiz for this topic in CSV
    let csvQuizData = null;
    
    // Try exact match
    if (topicFirstQuiz.has(topicName)) {
      csvQuizData = topicFirstQuiz.get(topicName);
    } else {
      // Try case-insensitive match
      for (const [csvTopicName, quizData] of topicFirstQuiz.entries()) {
        if (csvTopicName.toLowerCase() === topicName.toLowerCase()) {
          csvQuizData = quizData;
          break;
        }
      }
      
      // Try partial match
      if (!csvQuizData) {
        for (const [csvTopicName, quizData] of topicFirstQuiz.entries()) {
          if (csvTopicName.includes(topicName) || topicName.includes(csvTopicName)) {
            csvQuizData = quizData;
            break;
          }
        }
      }
    }
    
    if (!csvQuizData || csvQuizData.questions.length < 3) {
      console.log(`  ⚠️  "${topicName}": No questions found in CSV`);
      continue;
    }
    
    // Sort and take first 3 questions
    const sortedQuestions = csvQuizData.questions
      .sort((a, b) => a.questionNumber - b.questionNumber)
      .slice(0, 3);
    
    // Get or create quiz
    let quizId;
    if (existingQuiz) {
      quizId = existingQuiz.id;
      console.log(`  ✓ Quiz exists for "${topicName}", updating questions...`);
    } else {
      const { data: newQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          topic_id: ut.topic_id,
          day_number: 1
        })
        .select()
        .single();
      
      if (quizError) {
        console.error(`  ❌ Error creating quiz: ${quizError.message}`);
        continue;
      }
      
      quizId = newQuiz.id;
      console.log(`  ✅ Created Day 1 quiz for "${topicName}" (using first quiz from Day ${csvQuizData.day})`);
      createdCount++;
    }
    
    // Delete and insert questions
    await supabase
      .from('questions')
      .delete()
      .eq('quiz_id', quizId);
    
    const questionsToInsert = sortedQuestions.map((q, idx) => ({
      quiz_id: quizId,
      question_text: q.questionText,
      option_a: q.optionA,
      option_b: q.optionB,
      option_c: q.optionC,
      option_d: q.optionD,
      correct_answer: q.correctOption,
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
  
  console.log(`\n✅ Created ${createdCount} Day 1 quizzes\n`);
  
  // Final check
  console.log('🔍 Final verification...');
  for (const ut of userTopics) {
    const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
    
    const { data: day1Quiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('topic_id', ut.topic_id)
      .eq('day_number', 1)
      .maybeSingle();
    
    if (!day1Quiz) {
      console.log(`  ⚠️  Still missing: ${topicName}`);
    } else {
      const { count: questionCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', day1Quiz.id);
      
      if (questionCount < 3) {
        console.log(`  ⚠️  ${topicName} has ${questionCount} questions (need 3)`);
      }
    }
  }
  
  console.log('\n✅ Done!\n');
}

createDay1ForMissing().catch(console.error);

