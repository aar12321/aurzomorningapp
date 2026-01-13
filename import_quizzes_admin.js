#!/usr/bin/env node
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations (bypasses RLS)
const SUPABASE_URL = 'https://lnvebvrayuveygycpolc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REMOVED_SERVICE_ROLE_KEY'; // Replace with your service role key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function importQuizzes(csvFile) {
  // Read CSV
  const csvContent = fs.readFileSync(csvFile, 'utf-8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  console.log(`Importing quizzes from ${csvFile}...`);
  console.log(`Total lines: ${lines.length - 1}`);
  
  let currentQuizId = null;
  let currentTopicId = null;
  let currentDay = null;
  let questions = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',');
    const row = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || '';
    });
    
    const quizIdStr = row['QuizID'];
    const topicName = row['Topic'];
    const day = parseInt(row['Day']);
    
    // If this is a new quiz, save previous and start new
    if (currentQuizId !== quizIdStr) {
      // Save previous quiz's questions
      if (currentQuizId && questions.length > 0) {
        try {
          const { error } = await supabase
            .from('questions')
            .insert(questions);
          
          if (error) {
            console.error(`ERROR saving questions for ${currentQuizId}: ${error.message}`);
            errorCount++;
          } else {
            console.log(`✓ Saved ${questions.length} questions for ${currentQuizId}`);
            successCount++;
          }
          questions = [];
        } catch (e) {
          console.error(`ERROR: ${e.message}`);
          errorCount++;
        }
      }
      
      currentQuizId = quizIdStr;
      
      // Get topic ID
      const { data: topics, error: topicError } = await supabase
        .from('topics')
        .select('id')
        .eq('name', topicName)
        .single();
      
      if (topicError || !topics) {
        console.error(`ERROR: Topic '${topicName}' not found! Skipping quiz ${quizIdStr}`);
        errorCount++;
        continue;
      }
      
      currentTopicId = topics.id;
      currentDay = day;
      
      // Get or create quiz
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('id')
        .eq('topic_id', currentTopicId)
        .eq('day_number', currentDay)
        .single();
      
      if (!quizData) {
        // Create new quiz
        const { data: newQuiz, error: insertError } = await supabase
          .from('quizzes')
          .insert({ topic_id: currentTopicId, day_number: currentDay })
          .select()
          .single();
        
        if (insertError) {
          console.error(`ERROR creating quiz ${quizIdStr}: ${insertError.message}`);
          errorCount++;
          continue;
        }
        
        currentQuizId = newQuiz.id;
        console.log(`✓ Created quiz ${quizIdStr} (Day ${day}) for ${topicName}`);
      } else {
        currentQuizId = quizData.id;
      }
    }
    
    // Collect question data
    questions.push({
      quiz_id: currentQuizId,
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
      console.error(`ERROR saving last questions: ${error.message}`);
      errorCount++;
    } else {
      successCount++;
    }
  }
  
  console.log('\n=== IMPORT COMPLETE ===');
  console.log(`✓ Successfully imported: ${successCount} quizzes`);
  console.log(`✗ Errors: ${errorCount}`);
}

const csvFile = process.argv[2] || 'quizzes.csv.csv';
importQuizzes(csvFile).catch(console.error);

