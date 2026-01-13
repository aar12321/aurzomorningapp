// List all topics in the database
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lnvebvrayuveygycpolc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REMOVED_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listAllTopics() {
  console.log('\n📚 All Topics in Database:\n');
  
  const { data: topics, error } = await supabase
    .from('topics')
    .select('id, name, category')
    .order('name');
  
  if (error) {
    console.error('Error fetching topics:', error);
    return;
  }
  
  if (!topics || topics.length === 0) {
    console.log('No topics found.');
    return;
  }
  
  console.log(`Total topics: ${topics.length}\n`);
  
  // Group by category
  const byCategory = {};
  topics.forEach(topic => {
    const category = topic.category || 'Uncategorized';
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(topic);
  });
  
  // Display by category
  Object.keys(byCategory).sort().forEach(category => {
    console.log(`\n📁 ${category}:`);
    byCategory[category].forEach(topic => {
      // Count quizzes for this topic
      supabase
        .from('quizzes')
        .select('day_number', { count: 'exact', head: true })
        .eq('topic_id', topic.id)
        .then(({ count }) => {
          const quizCount = count || 0;
          // Count questions
          supabase
            .from('quizzes')
            .select('id')
            .eq('topic_id', topic.id)
            .then(({ data: quizzes }) => {
              if (quizzes && quizzes.length > 0) {
                const quizIds = quizzes.map(q => q.id);
                supabase
                  .from('questions')
                  .select('*', { count: 'exact', head: true })
                  .in('quiz_id', quizIds)
                  .then(({ count: questionCount }) => {
                    console.log(`  • ${topic.name} (${quizCount} quizzes, ${questionCount || 0} questions)`);
                  });
              } else {
                console.log(`  • ${topic.name} (${quizCount} quizzes, 0 questions)`);
              }
            });
        });
    });
  });
  
  // Also show a simple list
  console.log('\n\n📋 Simple List (all topics):');
  topics.forEach((topic, index) => {
    console.log(`${index + 1}. ${topic.name}${topic.category ? ` (${topic.category})` : ''}`);
  });
}

listAllTopics().catch(console.error);

