#!/usr/bin/env node
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lnvebvrayuveygycpolc.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',');
    const row = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || '';
    });

    const quizId = row['QuizID'];
    const topicName = row['Topic'];
    const day = parseInt(row['Day']);

    // If this is a new quiz, save previous and start new
    if (currentQuizId !== quizId) {
      // Save previous quiz's questions
      if (currentQuizId && questions.length > 0) {
        await saveQuestions(currentQuizId, questions);
        questions = [];
      }

      currentQuizId = quizId;

      // Get topic ID
      const { data: topics, error: topicError } = await supabase
        .from('topics')
        .select('id')
        .eq('name', topicName)
        .single();

      if (topicError || !topics) {
        console.error(`ERROR: Topic '${topicName}' not found!`);
        continue;
      }

      currentTopicId = topics.id;
      currentDay = day;

      // Get or create quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('topic_id', currentTopicId)
        .eq('day_number', currentDay)
        .single();

      if (quizError) {
        // Create new quiz
        const { data: newQuiz, error: insertError } = await supabase
          .from('quizzes')
          .insert({ topic_id: currentTopicId, day_number: currentDay })
          .select()
          .single();

        if (insertError) {
          console.error(`ERROR creating quiz: ${insertError.message}`);
          continue;
        }

        currentQuizId = newQuiz.id;
        console.log(`Created quiz: ${quizId} (Day ${day}) for ${topicName}`);
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
    await saveQuestions(currentQuizId, questions);
  }

  console.log('Import complete!');
}

async function saveQuestions(quizId, questions) {
  console.log(`Saving ${questions.length} questions for quiz ${quizId}...`);

  const { data, error } = await supabase
    .from('questions')
    .insert(questions);

  if (error) {
    console.error(`ERROR saving questions: ${error.message}`);
  } else {
    console.log(`Saved ${questions.length} questions`);
  }
}

// Run it
const csvFile = process.argv[2] || 'quizzes.csv';
importQuizzes(csvFile).catch(console.error);

