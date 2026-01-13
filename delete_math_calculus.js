// Delete Math – Calculus topic from the database
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lnvebvrayuveygycpolc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REMOVED_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteMathCalculus() {
  console.log('\n🗑️  Deleting Math – Calculus topic...\n');
  
  // Find the topic
  const { data: topic, error: findError } = await supabase
    .from('topics')
    .select('id, name')
    .eq('name', 'Math – Calculus')
    .maybeSingle();
  
  if (findError) {
    console.error('Error finding topic:', findError);
    return;
  }
  
  if (!topic) {
    console.log('❌ Math – Calculus topic not found in database.');
    return;
  }
  
  console.log(`✓ Found: ${topic.name} (${topic.id})`);
  
  // Check for user_topics
  const { data: userTopics } = await supabase
    .from('user_topics')
    .select('id, user_id')
    .eq('topic_id', topic.id);
  
  if (userTopics && userTopics.length > 0) {
    console.log(`⚠️  Found ${userTopics.length} user_topics that reference this topic`);
    userTopics.forEach(ut => {
      console.log(`   - User ${ut.user_id}`);
    });
    console.log('⚠️  These will be deleted automatically (cascade).');
  }
  
  // Check for quizzes
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, day_number')
    .eq('topic_id', topic.id);
  
  if (quizzes && quizzes.length > 0) {
    console.log(`⚠️  Found ${quizzes.length} quizzes that will be deleted:`);
    console.log(`   - Days: ${quizzes.map(q => q.day_number).join(', ')}`);
    console.log('⚠️  These will be deleted automatically (cascade).');
  }
  
  // Delete the topic
  console.log('\n🗑️  Deleting topic...');
  const { error: deleteError } = await supabase
    .from('topics')
    .delete()
    .eq('id', topic.id);
  
  if (deleteError) {
    console.error(`❌ Error deleting topic:`, deleteError.message);
    return;
  }
  
  console.log(`✅ Successfully deleted: ${topic.name}`);
  
  // Verify deletion
  const { data: stillExists } = await supabase
    .from('topics')
    .select('id')
    .eq('name', 'Math – Calculus')
    .maybeSingle();
  
  if (stillExists) {
    console.log('⚠️  Topic still exists after deletion attempt');
  } else {
    console.log('✅ Confirmed: Topic has been deleted from database');
  }
  
  console.log('\n✅ DELETION COMPLETE!');
}

deleteMathCalculus().catch(console.error);

