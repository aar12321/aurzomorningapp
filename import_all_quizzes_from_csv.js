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

async function importAllQuizzes() {
  console.log('\n🚀 Importing ALL quizzes from quizzes.csv...\n');
  
  // Step 1: Read CSV
  console.log('📖 Reading quizzes.csv...');
  const csv = fs.readFileSync('quizzes.csv', 'utf-8');
  const lines = csv.split('\n');
  const headers = parseCSVLine(lines[0]);
  
  // Step 2: Group by topic, day, and quizId
  // Map: key = `${topicName}|${day}|${quizId}`, value = { topicName, day, quizId, questions: [] }
  const quizMap = new Map();
  
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
      quizMap.set(key, {
        topicName,
        day,
        quizId,
        questions: []
      });
    }
    
    quizMap.get(key).questions.push({
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
  console.log('📋 Fetching all topics from database...');
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
  
  // Step 4: Process each quiz
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  console.log('🔄 Processing quizzes...\n');
  
  for (const [key, quizData] of quizMap.entries()) {
    const { topicName, day, questions } = quizData;
    
    // Find topic ID - try exact match first
    let topicId = topicMap.get(topicName);
    
    // If not found, try case-insensitive match
    if (!topicId) {
      for (const [dbTopicName, dbTopicId] of topicMap.entries()) {
        if (dbTopicName.toLowerCase() === topicName.toLowerCase()) {
          topicId = dbTopicId;
          break;
        }
      }
    }
    
    // Try partial match
    if (!topicId) {
      for (const [dbTopicName, dbTopicId] of topicMap.entries()) {
        if (dbTopicName.includes(topicName) || topicName.includes(dbTopicName)) {
          topicId = dbTopicId;
          break;
        }
      }
    }
    
    if (!topicId) {
      console.log(`  ⏭️  Skipping "${topicName}" Day ${day} - topic not found in database`);
      skippedCount++;
      continue;
    }
    
    // Sort questions by questionNumber and take first 3
    const sortedQuestions = questions
      .sort((a, b) => a.questionNumber - b.questionNumber)
      .slice(0, 3);
    
    if (sortedQuestions.length < 3) {
      console.log(`  ⚠️  "${topicName}" Day ${day} only has ${sortedQuestions.length} questions (need 3)`);
      skippedCount++;
      continue;
    }
    
    // Check if quiz exists
    const { data: existingQuiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('topic_id', topicId)
      .eq('day_number', day)
      .maybeSingle();
    
    let quizRecordId;
    
    if (existingQuiz) {
      quizRecordId = existingQuiz.id;
    } else {
      // Create quiz
      const { data: newQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          topic_id: topicId,
          day_number: day
        })
        .select()
        .single();
      
      if (quizError) {
        console.error(`  ❌ Error creating quiz for "${topicName}" Day ${day}: ${quizError.message}`);
        errorCount++;
        continue;
      }
      
      quizRecordId = newQuiz.id;
      createdCount++;
      
      if (createdCount % 50 === 0) {
        console.log(`  ✅ Created ${createdCount} quizzes so far...`);
      }
    }
    
    // Check existing questions count
    const { count: existingCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizRecordId);
    
    if (existingCount >= 3) {
      // Already has questions, skip
      continue;
    }
    
    // Delete existing questions and insert new ones (ensure exactly 3)
    await supabase
      .from('questions')
      .delete()
      .eq('quiz_id', quizRecordId);
    
    // Insert exactly 3 questions
    const questionsToInsert = sortedQuestions.map((q, idx) => ({
      quiz_id: quizRecordId,
      question_text: q.questionText,
      option_a: q.optionA,
      option_b: q.optionB,
      option_c: q.optionC,
      option_d: q.optionD,
      correct_answer: q.correctOption,
      explanation: q.explanation,
      order_number: idx + 1
    }));
    
    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);
    
    if (questionsError) {
      console.error(`    ❌ Error inserting questions for "${topicName}" Day ${day}: ${questionsError.message}`);
      errorCount++;
    } else {
      updatedCount++;
      if (updatedCount % 50 === 0) {
        console.log(`  ✅ Updated ${updatedCount} quizzes with questions so far...`);
      }
    }
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`  ✅ Created quizzes: ${createdCount}`);
  console.log(`  🔄 Updated quizzes with questions: ${updatedCount}`);
  console.log(`  ⏭️  Skipped: ${skippedCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  
  // Final verification - check Day 1 quizzes for all user topics
  console.log('\n🔍 Verifying Day 1 quizzes for all user topics...');
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select(`
      id,
      topic_id,
      topics(name)
    `);
  
  if (userTopics) {
    const missingDay1 = [];
    
    for (const ut of userTopics) {
      const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
      
      const { data: day1Quiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('topic_id', ut.topic_id)
        .eq('day_number', 1)
        .maybeSingle();
      
      if (!day1Quiz) {
        missingDay1.push(topicName);
      } else {
        const { count: questionCount } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', day1Quiz.id);
        
        if (questionCount < 3) {
          missingDay1.push(`${topicName} (has ${questionCount} questions, need 3)`);
        }
      }
    }
    
    if (missingDay1.length === 0) {
      console.log('  ✅ All user topics have Day 1 quizzes with 3+ questions!');
    } else {
      console.log(`  ⚠️  ${missingDay1.length} topics missing Day 1 quizzes:`);
      missingDay1.forEach(name => console.log(`    - ${name}`));
    }
  }
  
  // Count total quizzes imported
  const { count: totalQuizzes } = await supabase
    .from('quizzes')
    .select('*', { count: 'exact', head: true });
  
  const { count: totalQuestions } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📈 Total quizzes in database: ${totalQuizzes}`);
  console.log(`📈 Total questions in database: ${totalQuestions}`);
  
  console.log('\n✅ Done! All quizzes from CSV have been imported.\n');
  console.log('ℹ️  Note: Users start at Day 1. The unlock_day increments at 8 AM EST daily via cron job.');
  console.log('ℹ️  Users can only access quizzes where unlock_day >= current_day.\n');
}

importAllQuizzes().catch(console.error);

