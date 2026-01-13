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

async function reimportFromCSV() {
  console.log('\n🔄 Re-importing ALL quizzes from quizzes.csv ONLY...\n');
  
  // Step 1: Delete ALL existing questions
  console.log('🗑️  Deleting all existing questions...');
  const { error: deleteError } = await supabase
    .from('questions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (deleteError) {
    console.error('Error deleting questions:', deleteError.message);
    return;
  }
  console.log('✓ All questions deleted\n');
  
  // Step 2: Read CSV
  console.log('📖 Reading quizzes.csv...');
  const csv = fs.readFileSync('quizzes.csv', 'utf-8');
  const lines = csv.split('\n');
  const headers = parseCSVLine(lines[0]);
  
  // Step 3: Group questions by QuizID
  const quizMap = new Map(); // key: `${topicName}|${day}|${quizId}`, value: array of question objects
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = parseCSVLine(line);
    if (parts.length < 11) continue; // Skip invalid lines
    
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
      continue; // Skip invalid rows
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
  
  console.log(`Found ${quizMap.size} unique quizzes in CSV\n`);
  
  // Step 4: For each quiz, keep only first 3 questions (by QuestionNumber) and import
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  for (const [key, questions] of quizMap.entries()) {
    const [topicName, day, quizId] = key.split('|');
    
    // Sort by questionNumber and take only first 3
    questions.sort((a, b) => a.questionNumber - b.questionNumber);
    const questionsToImport = questions.slice(0, 3);
    
    if (questionsToImport.length === 0) {
      continue;
    }
    
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
    }
    
    // Insert questions from CSV only
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
      console.error(`❌ Error inserting questions for ${topicName} Day ${day}: ${insertError.message}`);
      errorCount++;
      continue;
    }
    
    console.log(`✓ ${topicName} Day ${day}: Imported ${questionsToInsert.length} questions from CSV`);
    successCount++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`✓ Successfully imported: ${successCount} quizzes`);
  console.log(`❌ Errors: ${errorCount} quizzes`);
  console.log(`⏭️  Skipped: ${skippedCount} quizzes`);
  console.log('='.repeat(50) + '\n');
  
  // Verify English specifically
  console.log('\n🔍 Verifying English quiz...\n');
  const { data: englishTopic } = await supabase
    .from('topics')
    .select('id, name')
    .eq('name', 'English')
    .maybeSingle();
  
  if (englishTopic) {
    const { data: englishQuizzes } = await supabase
      .from('quizzes')
      .select('id, day_number')
      .eq('topic_id', englishTopic.id)
      .order('day_number', { ascending: true })
      .limit(5);
    
    if (englishQuizzes) {
      for (const quiz of englishQuizzes) {
        const { data: questions } = await supabase
          .from('questions')
          .select('id, question_text, order_number')
          .eq('quiz_id', quiz.id)
          .order('order_number', { ascending: true });
        
        const count = questions?.length || 0;
        console.log(`English Day ${quiz.day_number}: ${count} questions`);
        if (questions && questions.length > 0) {
          questions.forEach((q, idx) => {
            console.log(`  ${idx + 1}. ${q.question_text.substring(0, 60)}...`);
          });
        }
      }
    }
  }
}

reimportFromCSV().catch(console.error);

