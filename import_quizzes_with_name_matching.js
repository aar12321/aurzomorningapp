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

// Comprehensive topic name mapping: CSV topic name -> possible database topic names
// This handles all variations including "Math - *" prefixes
const TOPIC_NAME_MAPPING = {
  'Pre-Calculus': ['Calculus', 'Math - Calculus', 'Pre-Calculus'],
  'Algebra': ['Algebra', 'Math - Algebra'],
  'Geometry': ['Geometry', 'Math - Geometry'],
  'English': ['English'],
  'Logic & Problem Solving': ['Logic & Problem Solving'],
  // Add more mappings as needed
};

async function findTopicByName(csvTopicName) {
  // Get all topics from database
  const { data: allTopics, error } = await supabase
    .from('topics')
    .select('id, name');
  
  if (error) {
    console.error('Error fetching topics:', error);
    return null;
  }
  
  // Try exact match first
  let match = allTopics?.find(t => t.name === csvTopicName);
  if (match) return match;
  
  // Try mapped names
  const possibleNames = TOPIC_NAME_MAPPING[csvTopicName] || [csvTopicName];
  for (const name of possibleNames) {
    match = allTopics?.find(t => t.name === name);
    if (match) return match;
  }
  
  // Try case-insensitive partial match
  const lowerCsv = csvTopicName.toLowerCase();
  match = allTopics?.find(t => {
    const lowerDb = t.name.toLowerCase();
    return lowerDb.includes(lowerCsv) || lowerCsv.includes(lowerDb.split(' - ').pop() || '');
  });
  
  if (match) return match;
  
  // Try removing "Math - " prefix and matching
  if (csvTopicName.includes(' - ')) {
    const withoutPrefix = csvTopicName.split(' - ').pop();
    match = allTopics?.find(t => t.name === withoutPrefix || t.name.includes(withoutPrefix));
    if (match) return match;
  }
  
  return null;
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
  let skippedTopics = new Map();
  let topicMapping = new Map(); // Track CSV topic -> DB topic mapping
  
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
    const csvTopicName = row['Topic'];
    const day = parseInt(row['Day']);
    
    if (!quizIdStr || !csvTopicName || isNaN(day)) {
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
      
      // Find topic - use cache if available
      let topic;
      if (topicMapping.has(csvTopicName)) {
        topic = topicMapping.get(csvTopicName);
      } else {
        topic = await findTopicByName(csvTopicName);
        if (topic) {
          topicMapping.set(csvTopicName, topic);
        }
      }
      
      if (!topic) {
        const count = skippedTopics.get(csvTopicName) || 0;
        skippedTopics.set(csvTopicName, count + 1);
        console.error(`⚠️  Topic '${csvTopicName}' not found in database! Skipping quiz ${quizIdStr}`);
        continue;
      }
      
      currentTopicId = topic.id;
      currentDay = day;
      
      if (!topicMapping.has(csvTopicName)) {
        console.log(`📝 Mapping: CSV "${csvTopicName}" → DB "${topic.name}"`);
      }
      
      // Get or create quiz for this topic/day
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
        console.log(`  ✓ Created quiz ${quizIdStr} (Day ${day}) for "${topic.name}"`);
      } else {
        currentQuizDbId = quizData.id;
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
  console.log(`✓ Successfully processed: ${successCount} quizzes`);
  console.log(`❌ Errors: ${errorCount}`);
  
  if (topicMapping.size > 0) {
    console.log(`\n📋 Topic Mappings Used:`);
    for (const [csvName, topic] of topicMapping) {
      console.log(`   "${csvName}" → "${topic.name}"`);
    }
  }
  
  if (skippedTopics.size > 0) {
    console.log(`\n⚠️  Skipped Topics (${skippedTopics.size}):`);
    for (const [topic, count] of skippedTopics) {
      console.log(`   "${topic}" (${count} quizzes skipped)`);
    }
    console.log(`   Tip: Make sure these topics exist in your database!`);
  }
  console.log('='.repeat(50) + '\n');
}

const csvFile = process.argv[2] || 'quizzes.csv';
importQuizzes(csvFile).catch(console.error);


