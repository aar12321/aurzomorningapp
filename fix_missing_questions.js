// Fix missing questions for World Events & Trends and ensure all quizzes have questions
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

async function fixMissingQuestions() {
  console.log('\n🔧 Fixing missing questions for all quizzes...\n');
  
  // Step 1: Read CSV
  console.log('📖 Reading quizzes.csv...');
  const csv = fs.readFileSync('quizzes.csv', 'utf-8');
  const lines = csv.split('\n');
  
  // Step 2: Group questions by topic, day, and quizId
  const quizMap = new Map(); // key = `${topicName}|${day}|${quizId}`, value = array of questions
  
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
  
  console.log(`Found ${quizMap.size} unique quizzes in CSV\n`);
  
  // Step 3: Get all topics from database
  console.log('📋 Fetching topics from database...');
  const { data: allTopics, error: topicsError } = await supabase
    .from('topics')
    .select('id, name');
  
  if (topicsError) {
    console.error('Error fetching topics:', topicsError);
    return;
  }
  
  const topicMap = new Map();
  allTopics.forEach(t => {
    topicMap.set(t.name, t.id);
  });
  
  console.log(`Found ${allTopics.length} topics in database\n`);
  
  // Step 4: Get all quizzes and check for missing questions
  console.log('🔍 Checking all quizzes for missing questions...');
  const { data: allQuizzes, error: quizzesError } = await supabase
    .from('quizzes')
    .select('id, topic_id, day_number, topics(name)');
  
  if (quizzesError) {
    console.error('Error fetching quizzes:', quizzesError);
    return;
  }
  
  console.log(`Found ${allQuizzes.length} quizzes in database\n`);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  for (const quiz of allQuizzes) {
    const topicName = Array.isArray(quiz.topics) ? quiz.topics[0]?.name : quiz.topics?.name;
    if (!topicName) continue;
    
    // Check if questions exist
    const { count: questionCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quiz.id);
    
    if (questionCount >= 3) {
      continue; // Already has questions
    }
    
    console.log(`⚠️  ${topicName} Day ${quiz.day_number}: Missing questions (has ${questionCount || 0})`);
    
    // Find questions in CSV for this topic and day
    const csvQuestions = [];
    for (const [key, questions] of quizMap.entries()) {
      const [csvTopicName, csvDay, csvQuizId] = key.split('|');
      if (csvTopicName === topicName && parseInt(csvDay) === quiz.day_number) {
        csvQuestions.push(...questions);
      }
    }
    
    if (csvQuestions.length === 0) {
      console.log(`  ❌ No questions found in CSV for ${topicName} Day ${quiz.day_number}`);
      errorCount++;
      continue;
    }
    
    // Sort by questionNumber and take first 3
    csvQuestions.sort((a, b) => a.questionNumber - b.questionNumber);
    const questionsToInsert = csvQuestions.slice(0, 3).map((q, idx) => ({
      quiz_id: quiz.id,
      question_text: q.questionText,
      option_a: q.optionA,
      option_b: q.optionB,
      option_c: q.optionC,
      option_d: q.optionD,
      correct_answer: q.correctOption,
      explanation: q.explanation,
      order_number: idx + 1
    }));
    
    // Delete existing questions (if any) and insert new ones
    await supabase
      .from('questions')
      .delete()
      .eq('quiz_id', quiz.id);
    
    const { error: insertError } = await supabase
      .from('questions')
      .insert(questionsToInsert);
    
    if (insertError) {
      console.error(`  ❌ Error inserting questions: ${insertError.message}`);
      errorCount++;
    } else {
      console.log(`  ✅ Added ${questionsToInsert.length} questions`);
      fixedCount++;
    }
  }
  
  console.log('\n✅ FIX COMPLETE!');
  console.log(`  ✅ Fixed: ${fixedCount} quizzes`);
  console.log(`  ❌ Errors: ${errorCount}`);
  
  // Final check for World Events & Trends specifically
  console.log('\n🔍 Verifying World Events & Trends...');
  const worldEventsTopics = allTopics.filter(t => 
    t.name.includes('World Events') || 
    t.name.includes('Cultural Awareness') || 
    t.name.includes('Global Events')
  );
  
  for (const topic of worldEventsTopics) {
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id, day_number')
      .eq('topic_id', topic.id)
      .order('day_number');
    
    if (quizzes) {
      for (const quiz of quizzes) {
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', quiz.id);
        
        console.log(`  ${topic.name} Day ${quiz.day_number}: ${count || 0} questions`);
      }
    }
  }
}

fixMissingQuestions().catch(console.error);

