// Delete unwanted topics from the database
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lnvebvrayuveygycpolc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REMOVED_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TOPICS_TO_DELETE = [
  'Science – General',
  'World Events & Trends',
  'World Events',
  'Financial Literacy',
  'Calculus',
  'Business',
  'General Science',
  'AI & Tech',
  'SAT/ACT Practice',
  'General Knowledge'
];

async function deleteUnwantedTopics() {
  console.log('\n🗑️  Deleting unwanted topics...\n');
  console.log(`Topics to delete: ${TOPICS_TO_DELETE.length}\n`);
  
  // Step 1: Find all topics to delete
  const topicsToDelete = [];
  const notFound = [];
  
  for (const topicName of TOPICS_TO_DELETE) {
    const { data: topic, error } = await supabase
      .from('topics')
      .select('id, name')
      .eq('name', topicName)
      .maybeSingle();
    
    if (error) {
      console.error(`Error finding "${topicName}":`, error);
      notFound.push(topicName);
    } else if (topic) {
      topicsToDelete.push(topic);
      console.log(`✓ Found: ${topic.name} (${topic.id})`);
    } else {
      console.log(`⚠️  Not found: ${topicName}`);
      notFound.push(topicName);
    }
  }
  
  console.log(`\nFound ${topicsToDelete.length} topics to delete`);
  if (notFound.length > 0) {
    console.log(`Not found: ${notFound.join(', ')}`);
  }
  
  if (topicsToDelete.length === 0) {
    console.log('\n❌ No topics found to delete. Exiting.');
    return;
  }
  
  // Step 2: Check for user_topics that reference these topics
  const topicIds = topicsToDelete.map(t => t.id);
  const { data: userTopics, error: utError } = await supabase
    .from('user_topics')
    .select('id, user_id, topic_id, topics(name)')
    .in('topic_id', topicIds);
  
  if (utError) {
    console.error('Error checking user_topics:', utError);
  } else if (userTopics && userTopics.length > 0) {
    console.log(`\n⚠️  Found ${userTopics.length} user_topics that reference these topics:`);
    userTopics.forEach(ut => {
      const topicName = Array.isArray(ut.topics) ? ut.topics[0]?.name : ut.topics?.name || 'Unknown';
      console.log(`   - User ${ut.user_id}: ${topicName}`);
    });
    console.log('\n⚠️  These will be deleted automatically when topics are deleted (cascade).');
  }
  
  // Step 3: Check for quizzes
  const { data: quizzes, error: qError } = await supabase
    .from('quizzes')
    .select('id, topic_id, day_number, topics(name)')
    .in('topic_id', topicIds);
  
  if (qError) {
    console.error('Error checking quizzes:', qError);
  } else if (quizzes && quizzes.length > 0) {
    console.log(`\n⚠️  Found ${quizzes.length} quizzes that will be deleted:`);
    const byTopic = {};
    quizzes.forEach(q => {
      const topicName = Array.isArray(q.topics) ? q.topics[0]?.name : q.topics?.name || 'Unknown';
      if (!byTopic[topicName]) {
        byTopic[topicName] = 0;
      }
      byTopic[topicName]++;
    });
    Object.entries(byTopic).forEach(([name, count]) => {
      console.log(`   - ${name}: ${count} quizzes`);
    });
    console.log('\n⚠️  These will be deleted automatically when topics are deleted (cascade).');
  }
  
  // Step 4: Confirm deletion
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  WARNING: This will permanently delete:');
  console.log(`   - ${topicsToDelete.length} topics`);
  console.log(`   - ${quizzes?.length || 0} quizzes`);
  console.log(`   - ${userTopics?.length || 0} user_topics`);
  console.log('='.repeat(80));
  console.log('\nProceeding with deletion...\n');
  
  // Step 5: Delete topics (cascade will handle related data)
  let deletedCount = 0;
  let errorCount = 0;
  
  for (const topic of topicsToDelete) {
    const { error: deleteError } = await supabase
      .from('topics')
      .delete()
      .eq('id', topic.id);
    
    if (deleteError) {
      console.error(`❌ Error deleting "${topic.name}":`, deleteError.message);
      errorCount++;
    } else {
      console.log(`✅ Deleted: ${topic.name}`);
      deletedCount++;
    }
  }
  
  // Step 6: Verify deletion
  console.log('\n🔍 Verifying deletion...\n');
  for (const topicName of TOPICS_TO_DELETE) {
    const { data: stillExists } = await supabase
      .from('topics')
      .select('id')
      .eq('name', topicName)
      .maybeSingle();
    
    if (stillExists) {
      console.log(`⚠️  Still exists: ${topicName}`);
    } else {
      console.log(`✅ Confirmed deleted: ${topicName}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ DELETION COMPLETE!');
  console.log(`   ✅ Deleted: ${deletedCount} topics`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('='.repeat(80));
}

deleteUnwantedTopics().catch(console.error);

