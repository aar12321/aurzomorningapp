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

// Financial topics in CSV that should map to "Financial Literacy"
const FINANCIAL_TOPICS = [
  'Retirement Planning',
  'Credit & Debt Management'
];

async function createFinancialLiteracyQuizzes() {
  console.log('\n💰 Creating Financial Literacy quizzes from CSV topics...\n');
  
  // Get Financial Literacy topic
  const { data: financialLiteracyTopic } = await supabase
    .from('topics')
    .select('id, name')
    .eq('name', 'Financial Literacy')
    .maybeSingle();
  
  if (!financialLiteracyTopic) {
    console.error('❌ Financial Literacy topic not found in database!');
    return;
  }
  
  console.log(`✓ Found Financial Literacy topic (ID: ${financialLiteracyTopic.id})\n`);
  
  // Read CSV
  const csv = fs.readFileSync('quizzes.csv', 'utf-8');
  const lines = csv.split('\n');
  
  // Group questions by day, combining all financial topics
  const dayMap = new Map(); // key: day number, value: array of questions
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = parseCSVLine(line);
    if (parts.length < 11) continue;
    
    const topicName = parts[0];
    const day = parseInt(parts[1]);
    const questionNumber = parseInt(parts[3]);
    
    if (!FINANCIAL_TOPICS.includes(topicName) || isNaN(day) || isNaN(questionNumber)) {
      continue;
    }
    
    if (!dayMap.has(day)) {
      dayMap.set(day, []);
    }
    
    dayMap.get(day).push({
      day,
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
  
  console.log(`📊 Found questions for ${dayMap.size} days from financial topics\n`);
  
  // For each day, take first 3 questions and create quiz
  let createdCount = 0;
  let questionsAddedCount = 0;
  
  for (const [day, questions] of dayMap.entries()) {
    // Sort by questionNumber and take first 3
    questions.sort((a, b) => a.questionNumber - b.questionNumber);
    const questionsToUse = questions.slice(0, 3);
    
    if (questionsToUse.length === 0) {
      continue;
    }
    
    // Get or create quiz
    let quizRecord;
    const { data: existingQuiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('topic_id', financialLiteracyTopic.id)
      .eq('day_number', day)
      .maybeSingle();
    
    if (existingQuiz) {
      quizRecord = existingQuiz;
    } else {
      const { data: newQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          topic_id: financialLiteracyTopic.id,
          day_number: day
        })
        .select()
        .single();
      
      if (quizError || !newQuiz) {
        console.error(`❌ Error creating quiz for Day ${day}: ${quizError?.message || 'Unknown error'}`);
        continue;
      }
      quizRecord = newQuiz;
      createdCount++;
    }
    
    // Check if questions already exist
    const { count: existingCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizRecord.id);
    
    if (existingCount && existingCount > 0) {
      console.log(`Day ${day}: Already has ${existingCount} questions, skipping`);
      continue;
    }
    
    // Insert questions
    const questionsToInsert = questionsToUse.map((q, index) => ({
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
      console.error(`❌ Error inserting questions for Day ${day}: ${insertError.message}`);
      continue;
    }
    
    console.log(`✓ Day ${day}: Added ${questionsToInsert.length} questions`);
    questionsAddedCount += questionsToInsert.length;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`✓ Created: ${createdCount} quizzes`);
  console.log(`✓ Added: ${questionsAddedCount} questions`);
  console.log('='.repeat(50) + '\n');
  
  // Verify Day 2 specifically
  console.log('🔍 Verifying Financial Literacy Day 2...\n');
  const { data: day2Quiz } = await supabase
    .from('quizzes')
    .select('id, day_number')
    .eq('topic_id', financialLiteracyTopic.id)
    .eq('day_number', 2)
    .maybeSingle();
  
  if (day2Quiz) {
    const { data: questions } = await supabase
      .from('questions')
      .select('id, question_text, order_number')
      .eq('quiz_id', day2Quiz.id)
      .order('order_number', { ascending: true });
    
    console.log(`Day 2: ${questions?.length || 0} questions`);
    if (questions && questions.length > 0) {
      questions.forEach((q, idx) => {
        console.log(`  ${idx + 1}. ${q.question_text.substring(0, 60)}...`);
      });
    }
  } else {
    console.log('❌ Day 2 quiz not found');
  }
}

createFinancialLiteracyQuizzes().catch(console.error);

