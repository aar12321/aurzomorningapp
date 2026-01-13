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

// Topic name mapping: user's topic -> CSV topic name
const TOPIC_MAP = {
  'Geometry': 'Geometry',
  'Calculus': 'Pre-Calculus',
  'Financial Literacy': 'Retirement Planning',  // or Credit & Debt Management
  'Business': 'Business & Career (Ongoing)',
  'General Knowledge': 'General Knowledge (Ongoing)'
};

async function importFromCSV() {
  console.log('Reading CSV...');
  const csv = fs.readFileSync('quizzes.csv', 'utf-8');
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  
  console.log('Importing Day 1 quizzes for user topics...');
  
  for (const [userTopic, csvTopic] of Object.entries(TOPIC_MAP)) {
    console.log(`\n=== Processing ${userTopic} (from CSV: ${csvTopic}) ===`);
    
    // Get topic ID from database - use first match
    const { data: topicsList, error: topicErr } = await supabase
      .from('topics')
      .select('id')
      .eq('name', userTopic);
    
    if (topicErr || !topicsList || topicsList.length === 0) {
      console.error(`ERROR: Topic '${userTopic}' not found in database!`);
      continue;
    }
    
    const topicData = { id: topicsList[0].id };
    
    const topicId = topicData.id;
    console.log(`Found topic ID: ${topicId}`);
    
    // Check if quiz already exists
    const { data: existingQuiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('topic_id', topicId)
      .eq('day_number', 1)
      .single();
    
    let quizId;
    if (existingQuiz) {
      quizId = existingQuiz.id;
      console.log(`Quiz already exists: ${quizId}`);
    } else {
      // Create quiz
      const { data: newQuiz, error: quizErr } = await supabase
        .from('quizzes')
        .insert({ topic_id: topicId, day_number: 1 })
        .select()
        .single();
      
      if (quizErr) {
        console.error(`ERROR creating quiz: ${quizErr.message}`);
        continue;
      }
      
      quizId = newQuiz.id;
      console.log(`Created quiz: ${quizId}`);
    }
    
    // Count questions for this quiz
    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId);
    
    if (count > 0) {
      console.log(`Quiz already has ${count} questions, skipping import`);
      continue;
    }
    
    // Find Day 1 questions from CSV
    const day1Questions = lines.filter(line => {
      const parts = line.split(',');
      return parts[0] === csvTopic && parts[1] === '1' && parts[3] && parts[3] !== 'QuestionNumber';
    });
    
    console.log(`Found ${day1Questions.length} questions in CSV for ${csvTopic} Day 1`);
    
    // Simple CSV parsing that handles quoted fields
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
    
    const questions = [];
    for (const line of day1Questions) {
      const parts = parseCSVLine(line);
      
      questions.push({
        quiz_id: quizId,
        question_text: parts[4],
        option_a: parts[5],
        option_b: parts[6],
        option_c: parts[7],
        option_d: parts[8],
        correct_answer: parts[9],
        explanation: parts[10] || 'No explanation provided.',
        order_number: parseInt(parts[3])
      });
    }
    
    if (questions.length > 0) {
      const { error: insertErr } = await supabase
        .from('questions')
        .insert(questions);
      
      if (insertErr) {
        console.error(`ERROR inserting questions: ${insertErr.message}`);
      } else {
        console.log(`✓ Imported ${questions.length} questions for ${userTopic} Day 1`);
      }
    }
  }
  
  console.log('\n=== IMPORT COMPLETE ===');
}

importFromCSV().catch(console.error);

