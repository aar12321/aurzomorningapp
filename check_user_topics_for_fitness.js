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

async function checkFitnessTopics() {
  console.log('\n🔍 Checking for Fitness & Habits topics...\n');
  
  // First, find the Fitness & Habits topic ID
  const { data: fitnessTopic } = await supabase
    .from('topics')
    .select('id, name')
    .ilike('name', '%Fitness%')
    .maybeSingle();
  
  if (fitnessTopic) {
    console.log(`Found Fitness topic: ${fitnessTopic.name} (ID: ${fitnessTopic.id})\n`);
    
    // Check all user_topics for this topic
    const { data: userTopics } = await supabase
      .from('user_topics')
      .select(`
        id,
        user_id,
        topic_id,
        current_day,
        completed_days,
        unlock_day,
        created_at,
        users(full_name, email),
        topics(name)
      `)
      .eq('topic_id', fitnessTopic.id)
      .order('created_at', { ascending: false });
    
    if (userTopics && userTopics.length > 0) {
      console.log(`Found ${userTopics.length} user_topics with Fitness & Habits:\n`);
      userTopics.forEach(ut => {
        const userName = Array.isArray(ut.users) ? ut.users[0]?.full_name : ut.users?.full_name || 'Unknown';
        const userEmail = Array.isArray(ut.users) ? ut.users[0]?.email : ut.users?.email || 'Unknown';
        const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
        console.log(`  User: ${userName} (${userEmail})`);
        console.log(`  Topic: ${topicName}`);
        console.log(`  Progress: Day ${ut.current_day}, ${ut.completed_days} completed`);
        console.log(`  Created: ${ut.created_at}`);
        console.log(`  ID: ${ut.id}\n`);
      });
    } else {
      console.log('No user_topics found with Fitness & Habits\n');
    }
  } else {
    console.log('Could not find Fitness & Habits topic in topics table\n');
  }
  
  // Also check for Rohan specifically
  console.log('\n🔍 Checking Rohan\'s topics...\n');
  const { data: rohan } = await supabase
    .from('users')
    .select('id, full_name, email')
    .ilike('full_name', '%Rohan%')
    .maybeSingle();
  
  if (rohan) {
    console.log(`Found user: ${rohan.full_name} (${rohan.email}, ID: ${rohan.id})\n`);
    
    const { data: rohanTopics } = await supabase
      .from('user_topics')
      .select(`
        id,
        topic_id,
        current_day,
        completed_days,
        unlock_day,
        created_at,
        topics(name)
      `)
      .eq('user_id', rohan.id)
      .order('created_at', { ascending: false });
    
    if (rohanTopics) {
      console.log(`Rohan has ${rohanTopics.length} topics:\n`);
      rohanTopics.forEach(ut => {
        const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
        console.log(`  ${topicName} (ID: ${ut.topic_id})`);
        console.log(`    Progress: Day ${ut.current_day}, ${ut.completed_days} completed`);
        console.log(`    Created: ${ut.created_at}`);
        const isFitness = fitnessTopic && ut.topic_id === fitnessTopic.id;
        if (isFitness) {
          console.log(`    ⚠️  THIS IS FITNESS & HABITS!`);
        }
        console.log('');
      });
    }
  }
}

checkFitnessTopics().catch(console.error);

