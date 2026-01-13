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

async function syncAllQuizzes() {
  console.log('\n🔄 Syncing ALL quizzes from quizzes.csv to database...\n');
  
  // Step 1: Analyze CSV
  console.log('📖 Reading and analyzing quizzes.csv...');
  const csv = fs.readFileSync('quizzes.csv', 'utf-8');
  const lines = csv.split('\n');
  
  // Group by topic, day, quizId
  const quizMap = new Map(); // key: `${topicName}|${day}|${quizId}`, value: array of questions
  const topicsInCSV = new Set();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = parseCSVLine(line);
    if (parts.length < 11) continue;
    
    const topicName = parts[0];
    const day = parseInt(parts[1]);
    const quizId = parts[2];
    const questionNumber = parseInt(parts[3]);
    
    if (!topicName || !quizId || isNaN(day) || isNaN(questionNumber)) {
      continue;
    }
    
    topicsInCSV.add(topicName);
    
    const key = `${topicName}|${day}|${quizId}`;
    
    if (!quizMap.has(key)) {
      quizMap.set(key, []);
    }
    
    quizMap.get(key).push({
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
  
  console.log(`✓ Found ${quizMap.size} unique quizzes in CSV`);
  console.log(`✓ Found ${topicsInCSV.size} unique topics in CSV:\n`);
  Array.from(topicsInCSV).sort().forEach(topic => {
    const quizCount = Array.from(quizMap.keys()).filter(k => k.startsWith(topic + '|')).length;
    console.log(`  - ${topic} (${quizCount} quizzes)`);
  });
  console.log('');
  
  // Step 2: Get all topics from database
  console.log('📋 Fetching all topics from database...');
  const { data: allTopics, error: topicsError } = await supabase
    .from('topics')
    .select('id, name');
  
  if (topicsError) {
    console.error('❌ Error fetching topics:', topicsError);
    return;
  }
  
  const topicMap = new Map();
  allTopics.forEach(t => {
    topicMap.set(t.name, t.id);
  });
  
  console.log(`✓ Found ${allTopics.length} topics in database\n`);
  
  // Step 3: Check for missing topics
  console.log('🔍 Checking for topics in CSV that are not in database...\n');
  const missingTopics = [];
  for (const csvTopic of topicsInCSV) {
    if (!topicMap.has(csvTopic)) {
      missingTopics.push(csvTopic);
    }
  }
  
  if (missingTopics.length > 0) {
    console.log(`⚠️  Found ${missingTopics.length} topics in CSV that are not in database:`);
    missingTopics.forEach(t => console.log(`  - ${t}`));
    console.log('\n⚠️  These topics will be skipped during import.\n');
  } else {
    console.log('✓ All topics in CSV exist in database!\n');
  }
  
  // Step 4: Delete ALL existing questions
  console.log('🗑️  Deleting all existing questions from database...');
  const { error: deleteError } = await supabase
    .from('questions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (deleteError) {
    console.error('❌ Error deleting questions:', deleteError.message);
    return;
  }
  console.log('✓ All questions deleted\n');
  
  // Step 5: Process each quiz from CSV
  console.log('🔄 Processing quizzes from CSV...\n');
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  for (const [key, questions] of quizMap.entries()) {
    const [topicName, day, quizId] = key.split('|');
    
    // Sort by questionNumber and take only first 3
    questions.sort((a, b) => a.questionNumber - b.questionNumber);
    const questionsToImport = questions.slice(0, 3);
    
    if (questionsToImport.length === 0) {
      skippedCount++;
      continue;
    }
    
    // Find topic in database
    const topicId = topicMap.get(topicName);
    
    if (!topicId) {
      console.log(`  ⏭️  Skipping "${topicName}" Day ${day} - topic not found in database`);
      skippedCount++;
      continue;
    }
    
    // Get or create quiz
    let quizRecord;
    const { data: existingQuiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('topic_id', topicId)
      .eq('day_number', parseInt(day))
      .maybeSingle();
    
    if (existingQuiz) {
      quizRecord = existingQuiz;
    } else {
      const { data: newQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          topic_id: topicId,
          day_number: parseInt(day)
        })
        .select()
        .single();
      
      if (quizError || !newQuiz) {
        console.error(`  ❌ Error creating quiz for ${topicName} Day ${day}: ${quizError?.message || 'Unknown error'}`);
        errorCount++;
        continue;
      }
      quizRecord = newQuiz;
    }
    
    // Insert questions from CSV
    const questionsToInsert = questionsToImport.map((q, index) => ({
      quiz_id: quizRecord.id,
      question_text: q.questionText,
      option_a: q.optionA,
      option_b: q.optionB,
      option_c: q.optionC,
      option_d: q.optionD,
      correct_answer: q.correctOption,
      explanation: q.explanation || 'No explanation provided.',
      order_number: q.questionNumber
    }));
    
    const { error: insertError } = await supabase
      .from('questions')
      .insert(questionsToInsert);
    
    if (insertError) {
      console.error(`  ❌ Error inserting questions for ${topicName} Day ${day}: ${insertError.message}`);
      errorCount++;
      continue;
    }
    
    successCount++;
    if (successCount % 50 === 0) {
      console.log(`  ✓ Processed ${successCount} quizzes...`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SYNC SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully imported: ${successCount} quizzes`);
  console.log(`❌ Errors: ${errorCount} quizzes`);
  console.log(`⏭️  Skipped: ${skippedCount} quizzes`);
  console.log(`📝 Total quizzes in CSV: ${quizMap.size}`);
  console.log('='.repeat(60) + '\n');
  
  // Step 6: Verification
  console.log('🔍 Verifying database state...\n');
  
  const { count: totalQuizzes } = await supabase
    .from('quizzes')
    .select('*', { count: 'exact', head: true });
  
  const { count: totalQuestions } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 Total quizzes in database: ${totalQuizzes}`);
  console.log(`📊 Total questions in database: ${totalQuestions}`);
  
  // Check for quizzes with incorrect question count
  const { data: allQuizzes } = await supabase
    .from('quizzes')
    .select('id, topic_id, day_number, topics(name)');
  
  if (allQuizzes) {
    const quizzesWithWrongCount = [];
    
    for (const quiz of allQuizzes) {
      const { count: questionCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quiz.id);
      
      const topicName = Array.isArray(quiz.topics) ? quiz.topics[0]?.name : quiz.topics?.name || 'Unknown';
      
      if (questionCount !== 3) {
        quizzesWithWrongCount.push({
          topic: topicName,
          day: quiz.day_number,
          count: questionCount
        });
      }
    }
    
    if (quizzesWithWrongCount.length > 0) {
      console.log(`\n⚠️  Found ${quizzesWithWrongCount.length} quizzes with incorrect question count:`);
      quizzesWithWrongCount.forEach(q => {
        console.log(`  - ${q.topic} Day ${q.day}: ${q.count} questions (expected 3)`);
      });
    } else {
      console.log('\n✅ All quizzes have exactly 3 questions!');
    }
  }
  
  console.log('\n✅ Sync complete! Database now matches quizzes.csv\n');
}

syncAllQuizzes().catch(console.error);

