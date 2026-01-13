#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lnvebvrayuveygycpolc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REMOVED_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkFinancialLiteracy() {
  console.log('\n🔍 Checking Financial Literacy quizzes...\n');
  
  // Find all Financial Literacy topics
  const { data: topics } = await supabase
    .from('topics')
    .select('id, name, category')
    .or('name.ilike.%Financial Literacy%,name.ilike.%financial%');
  
  console.log('📋 Financial Literacy topics found:');
  topics?.forEach(t => {
    console.log(`  - ${t.name} (${t.category}) - ID: ${t.id}`);
  });
  
  // Check for Financial Literacy in CSV
  const fs = await import('fs');
  const csv = fs.readFileSync('quizzes.csv', 'utf-8');
  const lines = csv.split('\n');
  
  console.log('\n📊 Checking CSV for Financial Literacy...');
  const financialLines = lines.filter(line => {
    const parts = line.split(',');
    return parts[0] && parts[0].toLowerCase().includes('financial');
  });
  
  console.log(`Found ${financialLines.length} lines with "Financial" in CSV`);
  if (financialLines.length > 0) {
    console.log('\nFirst few Financial topics from CSV:');
    const seenTopics = new Set();
    financialLines.slice(0, 10).forEach(line => {
      const parts = line.split(',');
      if (parts[0] && !seenTopics.has(parts[0])) {
        console.log(`  - ${parts[0]} (Day ${parts[1]})`);
        seenTopics.add(parts[0]);
      }
    });
  }
  
  // Get the main Financial Literacy topic
  const { data: financialTopic } = await supabase
    .from('topics')
    .select('id, name')
    .eq('name', 'Financial Literacy')
    .maybeSingle();
  
  if (!financialTopic) {
    console.log('\n❌ No "Financial Literacy" topic found!');
    return;
  }
  
  console.log(`\n📚 Using topic: ${financialTopic.name} (ID: ${financialTopic.id})`);
  
  // Check all quizzes for this topic
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, day_number')
    .eq('topic_id', financialTopic.id)
    .order('day_number', { ascending: true });
  
  console.log(`\n📝 Found ${quizzes?.length || 0} quizzes for Financial Literacy`);
  
  if (quizzes) {
    for (const quiz of quizzes) {
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quiz.id);
      
      const status = count === 3 ? '✓' : count === 0 ? '❌' : '⚠️';
      console.log(`  ${status} Day ${quiz.day_number}: ${count || 0} questions`);
    }
  }
  
  // Specifically check Day 2
  console.log('\n🎯 Checking Day 2 specifically...');
  const { data: day2Quiz } = await supabase
    .from('quizzes')
    .select('id, day_number')
    .eq('topic_id', financialTopic.id)
    .eq('day_number', 2)
    .maybeSingle();
  
  if (day2Quiz) {
    console.log(`✓ Day 2 quiz exists (ID: ${day2Quiz.id})`);
    
    const { data: questions } = await supabase
      .from('questions')
      .select('id, question_text, order_number')
      .eq('quiz_id', day2Quiz.id)
      .order('order_number', { ascending: true });
    
    console.log(`  Questions: ${questions?.length || 0}`);
    if (questions && questions.length > 0) {
      questions.forEach((q, idx) => {
        console.log(`    ${idx + 1}. ${q.question_text.substring(0, 60)}...`);
      });
    } else {
      console.log('  ❌ No questions found for Day 2!');
    }
  } else {
    console.log('❌ Day 2 quiz does not exist!');
  }
}

checkFinancialLiteracy().catch(console.error);

