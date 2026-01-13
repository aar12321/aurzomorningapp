#!/usr/bin/env node
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations (bypasses RLS)
const SUPABASE_URL = 'https://lnvebvrayuveygycpolc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REMOVED_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Topic name mapping: CSV topic name -> database topic name
// Also handles partial matches
const TOPIC_MAP = {
  'Pre-Calculus': 'Calculus',  // Will match "Math - Calculus" or just "Calculus"
  'Algebra': 'Algebra',         // Will match "Math - Algebra" or just "Algebra"
  'Geometry': 'Geometry',       // Will match "Math - Geometry" or just "Geometry"
};

async function findTopicByName(csvTopicName) {
  // First try exact match
  let { data: topics } = await supabase
    .from('topics')
    .select('id, name')
    .eq('name', csvTopicName)
    .maybeSingle();
  
  if (topics) return topics;
  
  // Try mapped name
  const mappedName = TOPIC_MAP[csvTopicName];
  if (mappedName) {
    // Try exact match with mapped name
    let { data } = await supabase
      .from('topics')
      .select('id, name')
      .eq('name', mappedName)
      .maybeSingle();
    
    if (data) return data;
    
    // Try partial match (e.g., "Math - Calculus" contains "Calculus")
    let { data: partialMatch } = await supabase
      .from('topics')
      .select('id, name')
      .ilike('name', `%${mappedName}%`)
      .limit(1)
      .maybeSingle();
    
    if (partialMatch) return partialMatch;
  }
  
  // Try partial match with original name
  let { data: partialMatch2 } = await supabase
    .from('topics')
    .select('id, name')
    .ilike('name', `%${csvTopicName}%`)
    .limit(1)
    .maybeSingle();
  
  return partialMatch2 || null;
}

async function importQuizzes(csvFile) {
  // Read CSV
  const csvContent = fs.readFileSync(csvFile, 'utf-8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  console.log(`\n📚 Importing quizzes from ${csvFile}...`);
  console.log(`📊 Total lines: ${lines.length - 1}\n`);
  
  let currentQuizIdStr = null;
  let currentQuizDbId = null;
  let currentTopicId = null;
  let currentDay = null;
  let questions = [];
  let successCount = 0;
  let errorCount = 0;
  let skippedTopics = new Set();
  
  // Parse CSV properly - handle quoted fields
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
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || '';
    });
    
    const quizIdStr = row['QuizID'];
    const topicName = row['Topic'];
    const day = parseInt(row['Day']);
    
    if (!quizIdStr || !topicName || isNaN(day)) {
      continue; // Skip invalid rows
    }
    
    // If this is a new quiz, save previous and start new
    if (currentQuizIdStr !== quizIdStr) {
      // Save previous quiz's questions
      if (currentQuizDbId && questions.length > 0) {
        try {
          const { error } = await supabase
            .from('questions')
            .insert(questions);
          
          if (error) {
            console.error(`❌ ERROR saving questions for ${currentQuizIdStr}: ${error.message}`);
            errorCount++;
          } else {
            console.log(`✓ Saved ${questions.length} questions for ${currentQuizIdStr}`);
            successCount++;
          }
          questions = [];
        } catch (e) {
          console.error(`❌ ERROR: ${e.message}`);
          errorCount++;
        }
      }
      
      currentQuizIdStr = quizIdStr;
      
      // Find topic by name (with fuzzy matching)
      const topic = await findTopicByName(topicName);
      
      if (!topic) {
        console.error(`⚠️  Topic '${topicName}' not found in database! Skipping quiz ${quizIdStr}`);
        skippedTopics.add(topicName);
        continue;
      }
      
      currentTopicId = topic.id;
      currentDay = day;
      
      console.log(`📝 Processing ${topicName} (found as "${topic.name}") - Day ${day}`);
      
      // Get or create quiz
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('id')
        .eq('topic_id', currentTopicId)
        .eq('day_number', currentDay)
        .maybeSingle();
      
      if (!quizData) {
        // Create new quiz
        const { data: newQuiz, error: insertError } = await supabase
          .from('quizzes')
          .insert({ topic_id: currentTopicId, day_number: currentDay })
          .select()
          .single();
        
        if (insertError) {
          console.error(`❌ ERROR creating quiz ${quizIdStr}: ${insertError.message}`);
          errorCount++;
          continue;
        }
        
        currentQuizDbId = newQuiz.id;
        console.log(`  ✓ Created quiz ${quizIdStr} (Day ${day})`);
      } else {
        currentQuizDbId = quizData.id;
        console.log(`  ✓ Quiz ${quizIdStr} already exists`);
      }
    }
    
    // Collect question data
    questions.push({
      quiz_id: currentQuizDbId,
      question_text: row['QuestionText'],
      option_a: row['OptionA'],
      option_b: row['OptionB'],
      option_c: row['OptionC'],
      option_d: row['OptionD'],
      correct_answer: row['CorrectOption'],
      explanation: row['Explanation'],
      order_number: parseInt(row['QuestionNumber'])
    });
  }
  
  // Save last quiz's questions
  if (questions.length > 0) {
    const { error } = await supabase
      .from('questions')
      .insert(questions);
    
    if (error) {
      console.error(`❌ ERROR saving last questions: ${error.message}`);
      errorCount++;
    } else {
      console.log(`✓ Saved ${questions.length} questions for final quiz`);
      successCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(50));
  console.log(`✓ Successfully imported: ${successCount} quizzes`);
  console.log(`❌ Errors: ${errorCount}`);
  if (skippedTopics.size > 0) {
    console.log(`⚠️  Skipped topics (not found in DB): ${Array.from(skippedTopics).join(', ')}`);
    console.log(`   Tip: Make sure these topics exist in your database!`);
  }
  console.log('='.repeat(50) + '\n');
}

const csvFile = process.argv[2] || 'quizzes.csv';
importQuizzes(csvFile).catch(console.error);


