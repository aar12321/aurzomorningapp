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

async function setAllToDay1() {
  console.log('\n🔧 Setting ALL user topics to Day 1...\n');
  
  // Get all user_topics
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select('id, user_id, topic_id, current_day, completed_days, unlock_day, topics(name)');
  
  if (!userTopics || userTopics.length === 0) {
    console.log('No user_topics found');
    return;
  }
  
  console.log(`Found ${userTopics.length} user_topics\n`);
  
  let updatedCount = 0;
  
  for (const userTopic of userTopics) {
    const topicName = Array.isArray(userTopic.topics) ? userTopic.topics[0]?.name : userTopic.topics?.name || 'Unknown';
    const currentDay = userTopic.current_day || 1;
    const completedDays = userTopic.completed_days || 0;
    
    // Only update if they haven't started (completed_days is 0 or null) OR if current_day is not 1
    if (completedDays === 0 || currentDay !== 1) {
      console.log(`📚 ${topicName}:`);
      console.log(`   Current: Day ${currentDay}, Completed: ${completedDays}`);
      
      // Check if Day 1 quiz exists, if not we'll need to create it
      const { data: day1Quiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('topic_id', userTopic.topic_id)
        .eq('day_number', 1)
        .maybeSingle();
      
      if (!day1Quiz) {
        console.log(`   ⚠️  Day 1 quiz doesn't exist - will create it`);
        
        // Create Day 1 quiz
        const { data: newQuiz, error: createError } = await supabase
          .from('quizzes')
          .insert({
            topic_id: userTopic.topic_id,
            day_number: 1
          })
          .select()
          .single();
        
        if (createError || !newQuiz) {
          console.log(`   ❌ Error creating quiz: ${createError?.message || 'Unknown error'}`);
          continue;
        }
        
        console.log(`   ✓ Created Day 1 quiz`);
        
        // Now we need to find questions from CSV for this topic
        // Get the first available quiz's questions and use those for Day 1
        const { data: firstQuiz } = await supabase
          .from('quizzes')
          .select('id')
          .eq('topic_id', userTopic.topic_id)
          .order('day_number', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (firstQuiz) {
          // Copy first 3 questions from the first available quiz
          const { data: sourceQuestions } = await supabase
            .from('questions')
            .select('*')
            .eq('quiz_id', firstQuiz.id)
            .order('order_number', { ascending: true })
            .limit(3);
          
          if (sourceQuestions && sourceQuestions.length > 0) {
            const questionsToInsert = sourceQuestions.map((q, idx) => ({
              quiz_id: newQuiz.id,
              question_text: q.question_text,
              option_a: q.option_a,
              option_b: q.option_b,
              option_c: q.option_c,
              option_d: q.option_d,
              correct_answer: q.correct_answer,
              explanation: q.explanation,
              order_number: idx + 1
            }));
            
            const { error: insertError } = await supabase
              .from('questions')
              .insert(questionsToInsert);
            
            if (insertError) {
              console.log(`   ⚠️  Error inserting questions: ${insertError.message}`);
            } else {
              console.log(`   ✓ Copied ${questionsToInsert.length} questions to Day 1`);
            }
          }
        }
      } else {
        // Check if Day 1 quiz has questions
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', day1Quiz.id);
        
        if (!count || count === 0) {
          console.log(`   ⚠️  Day 1 quiz exists but has no questions - copying from first available quiz`);
          
          // Copy questions from first available quiz
          const { data: firstQuiz } = await supabase
            .from('quizzes')
            .select('id')
            .eq('topic_id', userTopic.topic_id)
            .neq('id', day1Quiz.id)
            .order('day_number', { ascending: true })
            .limit(1)
            .maybeSingle();
          
          if (firstQuiz) {
            const { data: sourceQuestions } = await supabase
              .from('questions')
              .select('*')
              .eq('quiz_id', firstQuiz.id)
              .order('order_number', { ascending: true })
              .limit(3);
            
            if (sourceQuestions && sourceQuestions.length > 0) {
              const questionsToInsert = sourceQuestions.map((q, idx) => ({
                quiz_id: day1Quiz.id,
                question_text: q.question_text,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                order_number: idx + 1
              }));
              
              const { error: insertError } = await supabase
                .from('questions')
                .insert(questionsToInsert);
              
              if (insertError) {
                console.log(`   ⚠️  Error: ${insertError.message}`);
              } else {
                console.log(`   ✓ Added ${questionsToInsert.length} questions to Day 1`);
              }
            }
          }
        } else {
          console.log(`   ✓ Day 1 quiz exists with ${count} questions`);
        }
      }
      
      // Update user_topic to Day 1
      const { error } = await supabase
        .from('user_topics')
        .update({
          current_day: 1,
          unlock_day: 1
        })
        .eq('id', userTopic.id);
      
      if (error) {
        console.error(`   ❌ Error updating: ${error.message}`);
      } else {
        console.log(`   ✓ Set to Day 1\n`);
        updatedCount++;
      }
    } else {
      console.log(`✓ ${topicName}: Already at Day 1 (completed: ${completedDays})\n`);
    }
  }
  
  console.log('='.repeat(50));
  console.log(`✅ Updated ${updatedCount} user_topics to Day 1`);
  console.log('All topics now start at Day 1!\n');
}

setAllToDay1().catch(console.error);

