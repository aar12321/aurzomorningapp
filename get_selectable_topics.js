// Get all topics that users can select on the website (matching the signup page logic)
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

async function getSelectableTopics() {
  console.log('\n📚 Fetching selectable topics (matching signup page logic)...\n');
  
  // Fetch all topics from database (same as Index.tsx)
  const { data: topicsData, error } = await supabase
    .from('topics')
    .select('id, name, category')
    .order('category, name');
  
  if (error) {
    console.error('Error fetching topics:', error);
    return;
  }
  
  if (!topicsData || topicsData.length === 0) {
    console.log('No topics found.');
    return;
  }
  
  console.log(`Found ${topicsData.length} total topics in database\n`);
  
  // Apply the same filtering logic as Index.tsx
  // Step 1: Remove exact duplicates by name (keep first occurrence)
  const uniqueByName = topicsData.filter((topic, index, self) =>
    index === self.findIndex(t => t.name === topic.name)
  );
  
  console.log(`After removing exact duplicates: ${uniqueByName.length} topics`);
  
  // Step 2: Remove prefixed topics if base topic exists
  // e.g., remove "Math – Algebra" if "Algebra" exists
  // e.g., remove "Science – Chemistry" if "Chemistry" exists
  const deduplicatedTopics = uniqueByName.filter(topic => {
    // If this topic has "Math – " prefix, check if base topic exists
    if (topic.name.startsWith('Math – ')) {
      const baseName = topic.name.replace('Math – ', '');
      const baseTopicExists = uniqueByName.some(t => t.name === baseName);
      // Filter out if base topic exists
      return !baseTopicExists;
    }
    // If this topic has "Science – " prefix, check if base topic exists
    if (topic.name.startsWith('Science – ')) {
      const baseName = topic.name.replace('Science – ', '');
      const baseTopicExists = uniqueByName.some(t => t.name === baseName);
      // Filter out if base topic exists
      return !baseTopicExists;
    }
    // Keep all non-prefixed topics
    return true;
  });
  
  console.log(`After removing prefixed duplicates: ${deduplicatedTopics.length} selectable topics\n`);
  
  // Get quiz and question counts for each topic
  const topicsWithCounts = await Promise.all(
    deduplicatedTopics.map(async (topic) => {
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
  
  // Sort by category, then name
  topicsWithCounts.sort((a, b) => {
    if (a.category !== b.category) {
      return (a.category || '').localeCompare(b.category || '');
    }
    return a.name.localeCompare(b.name);
  });
  
  // Create output content
  let output = '# Selectable Topics for Users\n\n';
  output += `This file lists all topics that users can select on the website (signup page and settings).\n\n`;
  output += `**Total Selectable Topics:** ${topicsWithCounts.length}\n\n`;
  output += `**Generated:** ${new Date().toISOString()}\n\n`;
  output += `---\n\n`;
  
  // Group by category
  const byCategory = {};
  topicsWithCounts.forEach(topic => {
    const category = topic.category || 'Uncategorized';
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(topic);
  });
  
  // Write by category
  Object.keys(byCategory).sort().forEach(category => {
    output += `## ${category}\n\n`;
    byCategory[category].forEach((topic, idx) => {
      const status = topic.questionCount >= topic.quizCount * 3 
        ? '✅' 
        : topic.questionCount > 0 
        ? '⚠️' 
        : '❌';
      output += `${idx + 1}. ${status} **${topic.name}**\n`;
      output += `   - ID: \`${topic.id}\`\n`;
      output += `   - Quizzes: ${topic.quizCount}\n`;
      output += `   - Questions: ${topic.questionCount}\n`;
      if (topic.questionCount < topic.quizCount * 3 && topic.quizCount > 0) {
        output += `   - ⚠️  **Warning:** Missing questions (expected ${topic.quizCount * 3}, has ${topic.questionCount})\n`;
      }
      output += `\n`;
    });
    output += `\n`;
  });
  
  // Summary section
  output += `---\n\n`;
  output += `## Summary\n\n`;
  const totalQuizzes = topicsWithCounts.reduce((sum, t) => sum + t.quizCount, 0);
  const totalQuestions = topicsWithCounts.reduce((sum, t) => sum + t.questionCount, 0);
  const topicsWithQuestions = topicsWithCounts.filter(t => t.questionCount > 0).length;
  const topicsWithoutQuestions = topicsWithCounts.filter(t => t.questionCount === 0).length;
  const topicsIncomplete = topicsWithCounts.filter(t => t.questionCount > 0 && t.questionCount < t.quizCount * 3).length;
  
  output += `- **Total Selectable Topics:** ${topicsWithCounts.length}\n`;
  output += `- **Total Quizzes:** ${totalQuizzes}\n`;
  output += `- **Total Questions:** ${totalQuestions}\n`;
  output += `- **✅ Topics with questions:** ${topicsWithQuestions}\n`;
  output += `- **⚠️  Topics with incomplete questions:** ${topicsIncomplete}\n`;
  output += `- **❌ Topics without questions:** ${topicsWithoutQuestions}\n\n`;
  
  if (topicsWithoutQuestions > 0) {
    output += `### ⚠️  Topics Missing Questions\n\n`;
    topicsWithCounts
      .filter(t => t.questionCount === 0 && t.quizCount > 0)
      .forEach(t => {
        output += `- ${t.name} (${t.quizCount} quizzes, 0 questions)\n`;
      });
    output += `\n`;
  }
  
  // Also create a simple text list
  let simpleList = 'SELECTABLE TOPICS - SIMPLE LIST\n';
  simpleList += '='.repeat(80) + '\n\n';
  simpleList += `Total: ${topicsWithCounts.length} topics\n\n`;
  topicsWithCounts.forEach((topic, idx) => {
    simpleList += `${(idx + 1).toString().padStart(3, ' ')}. ${topic.name.padEnd(50)} [${topic.category || 'Uncategorized'}]\n`;
  });
  
  // Write files
  fs.writeFileSync('SELECTABLE_TOPICS.md', output);
  fs.writeFileSync('SELECTABLE_TOPICS.txt', simpleList);
  
  console.log('✅ Files created:');
  console.log('   - SELECTABLE_TOPICS.md (detailed markdown)');
  console.log('   - SELECTABLE_TOPICS.txt (simple text list)');
  console.log(`\n📊 Summary:`);
  console.log(`   Total selectable topics: ${topicsWithCounts.length}`);
  console.log(`   Topics with questions: ${topicsWithQuestions}`);
  console.log(`   Topics without questions: ${topicsWithoutQuestions}`);
  console.log(`   Topics with incomplete questions: ${topicsIncomplete}`);
}

getSelectableTopics().catch(console.error);

