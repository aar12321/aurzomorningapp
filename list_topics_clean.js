// List all topics in a clean format
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lnvebvrayuveygycpolc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REMOVED_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listTopicsClean() {
  console.log('\n📚 ALL TOPICS IN DATABASE\n');
  console.log('='.repeat(80));
  
  const { data: topics, error } = await supabase
    .from('topics')
    .select('id, name, category')
    .order('name');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`\nTotal: ${topics.length} topics\n`);
  
  // Get quiz and question counts for each topic
  const topicsWithCounts = await Promise.all(
    topics.map(async (topic) => {
      // Count quizzes
      const { count: quizCount } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topic.id);
      
      // Get all quiz IDs for this topic
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id')
        .eq('topic_id', topic.id);
      
      let questionCount = 0;
      if (quizzes && quizzes.length > 0) {
        const quizIds = quizzes.map(q => q.id);
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .in('quiz_id', quizIds);
        questionCount = count || 0;
      }
      
      return {
        ...topic,
        quizCount: quizCount || 0,
        questionCount
      };
    })
  );
  
  // Group by category
  const byCategory = {};
  topicsWithCounts.forEach(topic => {
    const category = topic.category || 'Uncategorized';
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(topic);
  });
  
  // Display
  Object.keys(byCategory).sort().forEach(category => {
    console.log(`\n📁 ${category.toUpperCase()}`);
    console.log('-'.repeat(80));
    byCategory[category].forEach((topic, idx) => {
      const status = topic.questionCount >= topic.quizCount * 3 
        ? '✅' 
        : topic.questionCount > 0 
        ? '⚠️' 
        : '❌';
      console.log(
        `${status} ${(idx + 1).toString().padStart(2, ' ')}. ${topic.name.padEnd(50)} ` +
        `[${topic.quizCount.toString().padStart(2, ' ')} quizzes, ${topic.questionCount.toString().padStart(3, ' ')} questions]`
      );
    });
  });
  
  // Summary
  console.log('\n\n📊 SUMMARY');
  console.log('='.repeat(80));
  const totalQuizzes = topicsWithCounts.reduce((sum, t) => sum + t.quizCount, 0);
  const totalQuestions = topicsWithCounts.reduce((sum, t) => sum + t.questionCount, 0);
  const topicsWithQuestions = topicsWithCounts.filter(t => t.questionCount > 0).length;
  const topicsWithoutQuestions = topicsWithCounts.filter(t => t.questionCount === 0).length;
  const topicsIncomplete = topicsWithCounts.filter(t => t.questionCount > 0 && t.questionCount < t.quizCount * 3).length;
  
  console.log(`Total Topics: ${topics.length}`);
  console.log(`Total Quizzes: ${totalQuizzes}`);
  console.log(`Total Questions: ${totalQuestions}`);
  console.log(`✅ Topics with questions: ${topicsWithQuestions}`);
  console.log(`⚠️  Topics with incomplete questions: ${topicsIncomplete}`);
  console.log(`❌ Topics without questions: ${topicsWithoutQuestions}`);
  
  if (topicsWithoutQuestions > 0) {
    console.log('\n⚠️  Topics missing questions:');
    topicsWithCounts
      .filter(t => t.questionCount === 0 && t.quizCount > 0)
      .forEach(t => console.log(`   - ${t.name} (${t.quizCount} quizzes, 0 questions)`));
  }
}

listTopicsClean().catch(console.error);

