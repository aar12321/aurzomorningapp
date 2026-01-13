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

const MATH_TOPIC_MAP = {
  'Math – Algebra': 'Algebra',
  'Math – Geometry': 'Geometry',
  'Math – Calculus': 'Pre-Calculus'  // Note: Dashboard shows "Math – Calculus" but CSV has "Pre-Calculus"
};

async function removeMathPrefix() {
  console.log('\n🔧 Removing "Math – " prefix from topics...\n');
  
  // Step 1: Get all topics to see what we're working with
  const { data: allTopics } = await supabase
    .from('topics')
    .select('id, name, category');
  
  console.log('📋 Found the following Math topics:');
  allTopics?.filter(t => t.name.includes('Math – ') || t.name.includes('Algebra') || t.name.includes('Geometry') || t.name.includes('Calculus'))
    .forEach(t => {
      console.log(`  - ${t.name} (${t.category}) - ID: ${t.id}`);
    });
  
  // Step 2: For each "Math – *" topic, update user_topics to point to base topic
  console.log('\n📝 Step 1: Updating user_topics to point to base topics...\n');
  
  for (const [mathTopicName, baseTopicName] of Object.entries(MATH_TOPIC_MAP)) {
    console.log(`\n🔀 Processing: ${mathTopicName} → ${baseTopicName}`);
    
    // Get both topics
    const { data: mathTopic } = await supabase
      .from('topics')
      .select('id, name')
      .eq('name', mathTopicName)
      .maybeSingle();
    
    const { data: baseTopic } = await supabase
      .from('topics')
      .select('id, name')
      .eq('name', baseTopicName)
      .maybeSingle();
    
    if (!mathTopic) {
      console.log(`  ⚠️  Math topic '${mathTopicName}' not found, skipping`);
      continue;
    }
    
    if (!baseTopic) {
      console.log(`  ⚠️  Base topic '${baseTopicName}' not found, skipping`);
      continue;
    }
    
    console.log(`  Math topic ID: ${mathTopic.id}`);
    console.log(`  Base topic ID: ${baseTopic.id}`);
    
    // Update user_topics that reference the Math topic to use base topic instead
    const { data: userTopics, error: userTopicsErr } = await supabase
      .from('user_topics')
      .select('id, user_id, topic_id')
      .eq('topic_id', mathTopic.id);
    
    if (userTopicsErr) {
      console.error(`  ❌ Error fetching user_topics: ${userTopicsErr.message}`);
      continue;
    }
    
    if (!userTopics || userTopics.length === 0) {
      console.log(`  ✓ No user_topics found for ${mathTopicName}, skipping update`);
    } else {
      console.log(`  Found ${userTopics.length} user_topics to update`);
      
      // Update each user_topic
      for (const userTopic of userTopics) {
        // Check if user already has base topic
        const { data: existingBase } = await supabase
          .from('user_topics')
          .select('id')
          .eq('user_id', userTopic.user_id)
          .eq('topic_id', baseTopic.id)
          .maybeSingle();
        
        if (existingBase) {
          // User already has base topic, delete the Math one
          const { error: deleteErr } = await supabase
            .from('user_topics')
            .delete()
            .eq('id', userTopic.id);
          
          if (deleteErr) {
            console.error(`    ❌ Error deleting user_topic ${userTopic.id}: ${deleteErr.message}`);
          } else {
            console.log(`    ✓ Removed duplicate user_topic (user already has ${baseTopicName})`);
          }
        } else {
          // Update to point to base topic
          const { error: updateErr } = await supabase
            .from('user_topics')
            .update({ topic_id: baseTopic.id })
            .eq('id', userTopic.id);
          
          if (updateErr) {
            console.error(`    ❌ Error updating user_topic ${userTopic.id}: ${updateErr.message}`);
          } else {
            console.log(`    ✓ Updated user_topic ${userTopic.id} to point to ${baseTopicName}`);
          }
        }
      }
    }
  }
  
  // Step 3: Optionally delete the "Math – *" topics (or just leave them unused)
  console.log('\n📝 Step 2: Note - Math – * topics left in database but no longer used\n');
  console.log('💡 You can manually delete them later if needed via Supabase dashboard\n');
  
  console.log('='.repeat(50));
  console.log('✅ Update complete!');
  console.log('='.repeat(50) + '\n');
  
  // Verify: Check user_topics now
  console.log('🔍 Verifying user_topics now point to base topics...\n');
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select('id, topic_id, topics(name)')
    .limit(10);
  
  if (userTopics) {
    userTopics.forEach(ut => {
      const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
      console.log(`  User topic: ${topicName}`);
    });
  }
}

removeMathPrefix().catch(console.error);

