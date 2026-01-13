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

async function ensureAllQuizzesReady() {
  console.log('\n🚀 Ensuring ALL Day 1 quizzes are ready from CSV...\n');
  
  // Step 1: Read CSV and group by topic and day
  console.log('📖 Reading quizzes.csv...');
  const csv = fs.readFileSync('quizzes.csv', 'utf-8');
  const lines = csv.split('\n');
  const headers = parseCSVLine(lines[0]);
  
  // Map to store quiz data: key = `${topicName}|${day}`, value = { questions: [], topicName, day }
  const quizMap = new Map();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = parseCSVLine(line);
    if (parts.length < 11) continue;
    
    const topicName = parts[0];
    const day = parseInt(parts[1]);
    const quizId = parts[2];
    const questionNumber = parseInt(parts[3]);
    const questionText = parts[4];
    const optionA = parts[5];
    const optionB = parts[6];
    const optionC = parts[7];
    const optionD = parts[8];
    const correctOption = parts[9];
    const explanation = parts[10];
    
    if (!topicName || !quizId || !questionText || isNaN(day) || isNaN(questionNumber)) {
      continue;
    }
    
    const key = `${topicName}|${day}`;
    
    if (!quizMap.has(key)) {
      quizMap.set(key, {
        topicName,
        day,
        quizId,
        questions: []
      });
    }
    
    quizMap.get(key).questions.push({
      questionNumber,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      explanation
    });
  }
  
  console.log(`Found ${quizMap.size} unique topic+day combinations in CSV\n`);
  
  // Step 2: Get all topics from database
  console.log('📋 Fetching all topics from database...');
  const { data: allTopics, error: topicsError } = await supabase
    .from('topics')
    .select('id, name');
  
  if (topicsError) {
    console.error('Error fetching topics:', topicsError);
    return;
  }
  
  const topicMap = new Map();
  allTopics.forEach(t => {
    topicMap.set(t.name, t.id);
  });
  
  console.log(`Found ${allTopics.length} topics in database\n`);
  
  // Step 3: Process each quiz from CSV
  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  // Focus on Day 1 first
  const day1Quizzes = Array.from(quizMap.entries()).filter(([key, value]) => value.day === 1);
  console.log(`\n🎯 Processing ${day1Quizzes.length} Day 1 quizzes...\n`);
  
  for (const [key, quizData] of day1Quizzes) {
    const { topicName, day, questions } = quizData;
    
    // Find topic ID - try exact match first
    let topicId = topicMap.get(topicName);
    
    // If not found, try case-insensitive match
    if (!topicId) {
      for (const [dbTopicName, dbTopicId] of topicMap.entries()) {
        if (dbTopicName.toLowerCase() === topicName.toLowerCase()) {
          topicId = dbTopicId;
          console.log(`  ⚠️  Case mismatch: CSV "${topicName}" → DB "${dbTopicName}"`);
          break;
        }
      }
    }
    
    if (!topicId) {
      console.log(`  ⏭️  Skipping "${topicName}" - topic not found in database`);
      skippedCount++;
      continue;
    }
    
    // Sort questions by questionNumber and take first 3
    const sortedQuestions = quizData.questions
      .sort((a, b) => a.questionNumber - b.questionNumber)
      .slice(0, 3);
    
    if (sortedQuestions.length < 3) {
      console.log(`  ⚠️  "${topicName}" Day ${day} only has ${sortedQuestions.length} questions (need 3)`);
    }
    
    // Check if quiz exists
    const { data: existingQuiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('topic_id', topicId)
      .eq('day_number', day)
      .maybeSingle();
    
    let quizRecordId;
    
    if (existingQuiz) {
      quizRecordId = existingQuiz.id;
      console.log(`  ✓ Quiz exists for "${topicName}" Day ${day} (${quizRecordId})`);
    } else {
      // Create quiz
      const { data: newQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          topic_id: topicId,
          day_number: day
        })
        .select()
        .single();
      
      if (quizError) {
        console.error(`  ❌ Error creating quiz for "${topicName}" Day ${day}: ${quizError.message}`);
        errorCount++;
        continue;
      }
      
      quizRecordId = newQuiz.id;
      createdCount++;
      console.log(`  ✅ Created quiz for "${topicName}" Day ${day} (${quizRecordId})`);
    }
    
    // Check existing questions count
    const { count: existingCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizRecordId);
    
    if (existingCount >= 3) {
      console.log(`    ✓ Already has ${existingCount} questions`);
      continue;
    }
    
    // Delete existing questions and insert new ones
    await supabase
      .from('questions')
      .delete()
      .eq('quiz_id', quizRecordId);
    
    // Insert questions
    const questionsToInsert = sortedQuestions.map((q, idx) => ({
      quiz_id: quizRecordId,
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
      errorCount++;
    } else {
      updatedCount++;
      console.log(`    ✅ Inserted ${questionsToInsert.length} questions`);
    }
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`  ✅ Created quizzes: ${createdCount}`);
  console.log(`  🔄 Updated quizzes: ${updatedCount}`);
  console.log(`  ⏭️  Skipped: ${skippedCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  
  // Check all user topics have Day 1 quizzes
  console.log('\n🔍 Verifying all user topics have Day 1 quizzes...');
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select(`
      id,
      user_id,
      topic_id,
      topics(name)
    `);
  
  if (userTopics) {
    const missingQuizzes = [];
    
    for (const ut of userTopics) {
      const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
      
      const { data: day1Quiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('topic_id', ut.topic_id)
        .eq('day_number', 1)
        .maybeSingle();
      
      if (!day1Quiz) {
        missingQuizzes.push(topicName);
        console.log(`  ⚠️  Missing Day 1 quiz for: ${topicName}`);
      }
    }
    
    if (missingQuizzes.length === 0) {
      console.log('  ✅ All user topics have Day 1 quizzes!');
    } else {
      console.log(`  ⚠️  ${missingQuizzes.length} topics missing Day 1 quizzes`);
    }
  }
  
  console.log('\n✅ Done!\n');
}

ensureAllQuizzesReady().catch(console.error);

