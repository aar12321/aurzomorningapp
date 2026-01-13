#!/usr/bin/env node
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lnvebvrayuveygycpolc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REMOVED_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read CSV to verify what questions should exist
function parseCSV(csvFile) {
  const csvContent = fs.readFileSync(csvFile, 'utf-8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
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
  
  const quizData = {}; // {topic: {day: [questions]}}
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || '';
    });
    
    const topic = row['Topic'];
    const day = parseInt(row['Day']);
    const questionNum = parseInt(row['QuestionNumber']);
    
    if (!topic || isNaN(day) || isNaN(questionNum)) continue;
    
    if (!quizData[topic]) quizData[topic] = {};
    if (!quizData[topic][day]) quizData[topic][day] = [];
    
    quizData[topic][day].push({
      question_text: row['QuestionText'],
      option_a: row['OptionA'],
      option_b: row['OptionB'],
      option_c: row['OptionC'],
      option_d: row['OptionD'],
      correct_answer: row['CorrectOption'],
      explanation: row['Explanation'],
      order_number: questionNum
    });
  }
  
  return quizData;
}

async function fixEnglishAndVerifyAll() {
  console.log('\n🔧 Fixing English quiz and verifying all questions from CSV...\n');
  
  // Parse CSV to get expected questions
  console.log('Reading quizzes.csv...');
  const csvData = parseCSV('quizzes.csv');
  console.log(`Found ${Object.keys(csvData).length} topics in CSV\n`);
  
  // Fix English quiz specifically
  console.log('=== Fixing English Quiz ===\n');
  
  const { data: englishTopic } = await supabase
    .from('topics')
    .select('id, name')
    .eq('name', 'English')
    .maybeSingle();
  
  if (!englishTopic) {
    console.error('English topic not found!');
    return;
  }
  
  // Check CSV data for English
  if (!csvData['English']) {
    console.error('English not found in CSV!');
    return;
  }
  
  const englishCSV = csvData['English'];
  console.log(`Found ${Object.keys(englishCSV).length} days for English in CSV`);
  
  // Get all English quizzes
  const { data: englishQuizzes } = await supabase
    .from('quizzes')
    .select('id, day_number')
    .eq('topic_id', englishTopic.id)
    .order('day_number', { ascending: true });
  
  if (!englishQuizzes) {
    console.error('No English quizzes found!');
    return;
  }
  
  console.log(`Found ${englishQuizzes.length} English quizzes in database\n`);
  
  for (const quiz of englishQuizzes) {
    const day = quiz.day_number;
    const csvQuestions = englishCSV[day];
    
    if (!csvQuestions) {
      console.log(`⚠️  Day ${day}: No CSV data found, skipping`);
      continue;
    }
    
    if (csvQuestions.length !== 3) {
      console.log(`⚠️  Day ${day}: CSV has ${csvQuestions.length} questions (expected 3), keeping first 3`);
    }
    
    // Get current questions
    const { data: currentQuestions } = await supabase
      .from('questions')
      .select('id')
      .eq('quiz_id', quiz.id)
      .order('order_number', { ascending: true });
    
    const currentCount = currentQuestions?.length || 0;
    
    if (currentCount === 3) {
      // Verify they match CSV
      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_number', { ascending: true });
      
      // Check if first 3 match CSV
      let matches = true;
      const csvFirst3 = csvQuestions.slice(0, 3);
      for (let i = 0; i < Math.min(3, questions.length); i++) {
        if (questions[i].question_text !== csvFirst3[i].question_text) {
          matches = false;
          break;
        }
      }
      
      if (matches) {
        console.log(`✓ Day ${day}: Already correct (3 questions from CSV)`);
        continue;
      } else {
        console.log(`⚠️  Day ${day}: Has 3 questions but they don't match CSV, fixing...`);
      }
    }
    
    // Delete all existing questions
    if (currentQuestions && currentQuestions.length > 0) {
      const idsToDelete = currentQuestions.map(q => q.id);
      await supabase
        .from('questions')
        .delete()
        .in('id', idsToDelete);
    }
    
    // Insert ONLY the first 3 questions from CSV
    const questionsToInsert = csvQuestions.slice(0, 3).map(q => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      order_number: q.order_number
    }));
    
    const { error } = await supabase
      .from('questions')
      .insert(questionsToInsert);
    
    if (error) {
      console.error(`❌ Day ${day}: Error: ${error.message}`);
    } else {
      console.log(`✓ Day ${day}: Fixed - now has exactly 3 questions from CSV`);
    }
  }
  
  console.log('\n=== Verifying All Quizzes Use CSV Data ===\n');
  
  // Get all quizzes
  const { data: allQuizzes } = await supabase
    .from('quizzes')
    .select('id, topic_id, day_number, topics(name)');
  
  if (!allQuizzes) {
    console.log('No quizzes found');
    return;
  }
  
  let verifiedCount = 0;
  let fixedCount = 0;
  let errorCount = 0;
  
  for (const quiz of allQuizzes) {
    const topicName = Array.isArray(quiz.topics) ? quiz.topics[0]?.name : quiz.topics?.name || 'Unknown';
    const day = quiz.day_number;
    
    // Check if topic exists in CSV
    if (!csvData[topicName]) {
      // Try to find topic with similar name
      const similarTopic = Object.keys(csvData).find(t => 
        t.includes(topicName) || topicName.includes(t)
      );
      
      if (!similarTopic) {
        continue; // Skip topics not in CSV
      }
    }
    
    const csvTopic = csvData[topicName] || csvData[Object.keys(csvData).find(t => t.includes(topicName))];
    if (!csvTopic || !csvTopic[day]) {
      continue;
    }
    
    const expectedQuestions = csvTopic[day].slice(0, 3); // First 3 from CSV
    
    // Get current questions
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('order_number', { ascending: true });
    
    if (!questions || questions.length === 0) {
      continue;
    }
    
    if (questions.length !== 3) {
      // Fix it
      const idsToDelete = questions.map(q => q.id);
      await supabase
        .from('questions')
        .delete()
        .in('id', idsToDelete);
      
      const questionsToInsert = expectedQuestions.map(q => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        order_number: q.order_number
      }));
      
      await supabase
        .from('questions')
        .insert(questionsToInsert);
      
      fixedCount++;
    } else {
      // Verify they match CSV
      let matches = true;
      for (let i = 0; i < 3; i++) {
        if (questions[i].question_text !== expectedQuestions[i].question_text) {
          matches = false;
          break;
        }
      }
      
      if (matches) {
        verifiedCount++;
      } else {
        // Fix it
        const idsToDelete = questions.map(q => q.id);
        await supabase
          .from('questions')
          .delete()
          .in('id', idsToDelete);
        
        const questionsToInsert = expectedQuestions.map(q => ({
          quiz_id: quiz.id,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          order_number: q.order_number
        }));
        
        await supabase
          .from('questions')
          .insert(questionsToInsert);
        
        fixedCount++;
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(50));
  console.log(`✓ Verified correct: ${verifiedCount} quizzes`);
  console.log(`✓ Fixed to match CSV: ${fixedCount} quizzes`);
  console.log(`❌ Errors: ${errorCount} quizzes`);
  console.log('='.repeat(50) + '\n');
  
  // Final check on English
  console.log('Final English quiz check:');
  const { data: finalEnglishQuizzes } = await supabase
    .from('quizzes')
    .select('id, day_number')
    .eq('topic_id', englishTopic.id)
    .order('day_number', { ascending: true });
  
  if (finalEnglishQuizzes) {
    for (const quiz of finalEnglishQuizzes.slice(0, 5)) {
      const { data: questions } = await supabase
        .from('questions')
        .select('id')
        .eq('quiz_id', quiz.id);
      console.log(`English Day ${quiz.day_number}: ${questions?.length || 0} questions`);
    }
  }
}

fixEnglishAndVerifyAll().catch(console.error);


