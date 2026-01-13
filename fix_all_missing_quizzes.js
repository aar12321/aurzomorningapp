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

async function fixAllMissingQuizzes() {
  console.log('\n🔧 Ensuring ALL quizzes from CSV are created...\n');
  
  // Read CSV and group by topic/day
  const csv = fs.readFileSync('quizzes.csv', 'utf-8');
  const lines = csv.split('\n');
  const quizMap = new Map(); // key: `${topicName}|${day}|${quizId}`, value: array of questions
  
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
    
    const key = `${topicName}|${day}|${quizId}`;
    
    if (!quizMap.has(key)) {
      quizMap.set(key, []);
    }
    
    quizMap.get(key).push({
      topicName,
      day,
      quizId,
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
  
  console.log(`📊 Found ${quizMap.size} unique quizzes in CSV\n`);
  
  // For each quiz, ensure it exists with 3 questions
  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const [key, questions] of quizMap.entries()) {
    const [topicName, day, quizId] = key.split('|');
    
    // Sort by questionNumber and take only first 3
    questions.sort((a, b) => a.questionNumber - b.questionNumber);
    const questionsToUse = questions.slice(0, 3);
    
    if (questionsToUse.length === 0) continue;
    
    // Find topic in database
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .select('id, name')
      .eq('name', topicName)
      .maybeSingle();
    
    if (topicError || !topicData) {
      console.error(`❌ Topic '${topicName}' not found in database`);
      errorCount++;
      continue;
    }
    
    // Get or create quiz
    let quizRecord;
    const { data: existingQuiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('topic_id', topicData.id)
      .eq('day_number', parseInt(day))
      .maybeSingle();
    
    if (existingQuiz) {
      quizRecord = existingQuiz;
    } else {
      const { data: newQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          topic_id: topicData.id,
          day_number: parseInt(day)
        })
        .select()
        .single();
      
      if (quizError || !newQuiz) {
        console.error(`❌ Error creating quiz for ${topicName} Day ${day}: ${quizError?.message || 'Unknown error'}`);
        errorCount++;
        continue;
      }
      quizRecord = newQuiz;
      createdCount++;
    }
    
    // Check if questions exist
    const { count: existingCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizRecord.id);
    
    if (existingCount && existingCount === 3) {
      // Already has 3 questions, skip
      continue;
    }
    
    // Delete existing questions if any (to ensure clean state)
    if (existingCount && existingCount > 0) {
      await supabase
        .from('questions')
        .delete()
        .eq('quiz_id', quizRecord.id);
    }
    
    // Insert questions
    const questionsToInsert = questionsToUse.map((q) => ({
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
      console.error(`❌ Error inserting questions for ${topicName} Day ${day}: ${insertError.message}`);
      errorCount++;
      continue;
    }
    
    if (existingCount && existingCount > 0) {
      updatedCount++;
      console.log(`✓ ${topicName} Day ${day}: Updated (had ${existingCount}, now has 3)`);
    } else {
      console.log(`✓ ${topicName} Day ${day}: Created with 3 questions`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`✓ Created: ${createdCount} quizzes`);
  console.log(`✓ Updated: ${updatedCount} quizzes`);
  console.log(`❌ Errors: ${errorCount} quizzes`);
  console.log('='.repeat(50) + '\n');
  
  // Specifically check Cultural Awareness & Global Events
  console.log('🔍 Checking Cultural Awareness & Global Events...\n');
  const { data: culturalTopic } = await supabase
    .from('topics')
    .select('id, name')
    .or('name.ilike.%Cultural Awareness%,name.ilike.%Cultural%');
  
  if (culturalTopic && culturalTopic.length > 0) {
    culturalTopic.forEach(topic => {
      console.log(`Found topic: ${topic.name} (ID: ${topic.id})`);
    });
    
    const { data: culturalQuizzes } = await supabase
      .from('quizzes')
      .select('id, day_number')
      .in('topic_id', culturalTopic.map(t => t.id))
      .order('day_number', { ascending: true })
      .limit(5);
    
    console.log(`\nQuizzes for Cultural topics: ${culturalQuizzes?.length || 0}`);
    if (culturalQuizzes) {
      culturalQuizzes.forEach(q => {
        console.log(`  Day ${q.day_number}: ${q.id}`);
      });
    }
  }
}

fixAllMissingQuizzes().catch(console.error);

