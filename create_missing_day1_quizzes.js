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

async function createMissingDay1Quizzes() {
  console.log('\n🔧 Creating missing Day 1 quizzes for all user topics...\n');
  
  // Step 1: Get all user topics
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select(`
      id,
      topic_id,
      topics(name)
    `);
  
  if (!userTopics) {
    console.log('No user topics found');
    return;
  }
  
  console.log(`Found ${userTopics.length} user topics\n`);
  
  // Step 2: Read CSV and find Day 1 quizzes
  const csv = fs.readFileSync('quizzes.csv', 'utf-8');
  const lines = csv.split('\n');
  const headers = parseCSVLine(lines[0]);
  
  // Map: topicName -> Day 1 questions
  const day1Quizzes = new Map();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = parseCSVLine(line);
    if (parts.length < 11) continue;
    
    const topicName = parts[0];
    const day = parseInt(parts[1]);
    const questionNumber = parseInt(parts[3]);
    
    if (day !== 1) continue;
    
    const key = topicName;
    if (!day1Quizzes.has(key)) {
      day1Quizzes.set(key, []);
    }
    
    day1Quizzes.get(key).push({
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
  
  console.log(`Found ${day1Quizzes.size} topics with Day 1 quizzes in CSV\n`);
  
  // Step 3: For each user topic, find or create Day 1 quiz
  let createdCount = 0;
  let foundCount = 0;
  let missingCount = 0;
  
  for (const ut of userTopics) {
    const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
    
    // Check if Day 1 quiz exists
    const { data: existingQuiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('topic_id', ut.topic_id)
      .eq('day_number', 1)
      .maybeSingle();
    
    if (existingQuiz) {
      // Check if it has questions
      const { count: questionCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', existingQuiz.id);
      
      if (questionCount >= 3) {
        foundCount++;
        continue;
      }
    }
    
    // Find matching topic in CSV (try exact match, then case-insensitive, then partial)
    let csvQuestions = null;
    let matchedTopicName = null;
    
    // Try exact match
    if (day1Quizzes.has(topicName)) {
      csvQuestions = day1Quizzes.get(topicName);
      matchedTopicName = topicName;
    } else {
      // Try case-insensitive match
      for (const [csvTopicName, questions] of day1Quizzes.entries()) {
        if (csvTopicName.toLowerCase() === topicName.toLowerCase()) {
          csvQuestions = questions;
          matchedTopicName = csvTopicName;
          break;
        }
      }
      
      // Try partial match (e.g., "World Events" matches "World Events & Trends")
      if (!csvQuestions) {
        for (const [csvTopicName, questions] of day1Quizzes.entries()) {
          if (csvTopicName.includes(topicName) || topicName.includes(csvTopicName)) {
            csvQuestions = questions;
            matchedTopicName = csvTopicName;
            break;
          }
        }
      }
    }
    
    if (!csvQuestions || csvQuestions.length < 3) {
      console.log(`  ⚠️  "${topicName}": No Day 1 questions found in CSV`);
      missingCount++;
      continue;
    }
    
    // Sort and take first 3 questions
    const sortedQuestions = csvQuestions
      .sort((a, b) => a.questionNumber - b.questionNumber)
      .slice(0, 3);
    
    // Get or create quiz
    let quizId;
    if (existingQuiz) {
      quizId = existingQuiz.id;
      console.log(`  ✓ Quiz exists for "${topicName}", adding questions...`);
    } else {
      // Create quiz
      const { data: newQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          topic_id: ut.topic_id,
          day_number: 1
        })
        .select()
        .single();
      
      if (quizError) {
        console.error(`  ❌ Error creating quiz for "${topicName}": ${quizError.message}`);
        missingCount++;
        continue;
      }
      
      quizId = newQuiz.id;
      console.log(`  ✅ Created Day 1 quiz for "${topicName}" (matched CSV: "${matchedTopicName}")`);
      createdCount++;
    }
    
    // Delete existing questions and insert new ones
    await supabase
      .from('questions')
      .delete()
      .eq('quiz_id', quizId);
    
    // Insert questions
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
      missingCount++;
    } else {
      console.log(`    ✅ Inserted ${questionsToInsert.length} questions`);
    }
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`  ✅ Created quizzes: ${createdCount}`);
  console.log(`  ✓ Already exists: ${foundCount}`);
  console.log(`  ⚠️  Missing/Could not create: ${missingCount}`);
  
  // Final verification
  console.log('\n🔍 Final verification...');
  const { data: finalCheck } = await supabase
    .from('user_topics')
    .select(`
      id,
      topic_id,
      topics(name)
    `);
  
  if (finalCheck) {
    const stillMissing = [];
    for (const ut of finalCheck) {
      const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
      
      const { data: day1Quiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('topic_id', ut.topic_id)
        .eq('day_number', 1)
        .maybeSingle();
      
      if (!day1Quiz) {
        stillMissing.push(topicName);
      } else {
        const { count: questionCount } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', day1Quiz.id);
        
        if (questionCount < 3) {
          stillMissing.push(`${topicName} (has ${questionCount} questions, need 3)`);
        }
      }
    }
    
    if (stillMissing.length === 0) {
      console.log('  ✅ All user topics now have Day 1 quizzes with 3+ questions!');
    } else {
      console.log(`  ⚠️  Still missing: ${stillMissing.length}`);
      stillMissing.forEach(name => console.log(`    - ${name}`));
    }
  }
  
  console.log('\n✅ Done!\n');
}

createMissingDay1Quizzes().catch(console.error);

