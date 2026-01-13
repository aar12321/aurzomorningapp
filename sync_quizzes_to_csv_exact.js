// This script ensures ALL quizzes in the database match EXACTLY what's in quizzes.csv
// It will:
// 1. Parse quizzes.csv to get all topic/day combinations
// 2. Delete quizzes in database that don't exist in CSV
// 3. Create quizzes that exist in CSV but not in database
// 4. Ensure day numbers match exactly

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations (same as import_all_quizzes_from_csv.js)
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

async function syncQuizzesToCSV() {
  console.log('\n🔄 Syncing ALL quizzes to match quizzes.csv EXACTLY...\n');
  
  // Step 1: Read CSV and build map of what SHOULD exist
  console.log('📖 Reading quizzes.csv...');
  const csv = fs.readFileSync('quizzes.csv', 'utf-8');
  const lines = csv.split('\n');
  
  // Map: topicName -> Set of day numbers
  const csvTopicDays = new Map();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = parseCSVLine(line);
    if (parts.length < 11) continue;
    
    const topicName = parts[0];
    const day = parseInt(parts[1]);
    
    if (!topicName || isNaN(day)) continue;
    
    if (!csvTopicDays.has(topicName)) {
      csvTopicDays.set(topicName, new Set());
    }
    csvTopicDays.get(topicName).add(day);
  }
  
  console.log(`Found ${csvTopicDays.size} topics in CSV\n`);
  
  // Show summary
  console.log('📊 Topics and days in CSV:');
  for (const [topic, days] of csvTopicDays.entries()) {
    const sortedDays = Array.from(days).sort((a, b) => a - b);
    console.log(`  ${topic}: ${sortedDays.length} days (${sortedDays[0]} to ${sortedDays[sortedDays.length - 1]})`);
  }
  console.log('');
  
  // Step 2: Get all topics from database
  console.log('📋 Fetching topics from database...');
  const { data: allTopics, error: topicsError } = await supabase
    .from('topics')
    .select('id, name');
  
  if (topicsError) {
    console.error('❌ Error fetching topics:', topicsError);
    return;
  }
  
  const topicMap = new Map();
  allTopics.forEach(t => {
    topicMap.set(t.name, t.id);
  });
  
  console.log(`Found ${allTopics.length} topics in database\n`);
  
  // Step 3: For each topic, sync quizzes
  let totalDeleted = 0;
  let totalCreated = 0;
  let totalUpdated = 0;
  
  for (const [topicName, csvDays] of csvTopicDays.entries()) {
    const topicId = topicMap.get(topicName);
    
    if (!topicId) {
      console.log(`⚠️  Topic "${topicName}" not found in database - skipping`);
      continue;
    }
    
    console.log(`\n📚 Processing: ${topicName}`);
    
    // Get all quizzes for this topic in database
    const { data: dbQuizzes, error: dbError } = await supabase
      .from('quizzes')
      .select('id, day_number')
      .eq('topic_id', topicId);
    
    if (dbError) {
      console.error(`  ❌ Error fetching quizzes: ${dbError.message}`);
      continue;
    }
    
    const dbDays = new Set(dbQuizzes.map(q => q.day_number));
    const csvDaysArray = Array.from(csvDays);
    
    // Find days to delete (in DB but not in CSV)
    const daysToDelete = Array.from(dbDays).filter(d => !csvDays.has(d));
    
    // Find days to create (in CSV but not in DB)
    const daysToCreate = csvDaysArray.filter(d => !dbDays.has(d));
    
    console.log(`  📊 CSV has ${csvDaysArray.length} days (${Math.min(...csvDaysArray)} to ${Math.max(...csvDaysArray)})`);
    console.log(`  📊 DB has ${dbDays.size} days`);
    
    // Delete quizzes that shouldn't exist
    if (daysToDelete.length > 0) {
      console.log(`  🗑️  Deleting ${daysToDelete.length} days: ${daysToDelete.join(', ')}`);
      
      for (const day of daysToDelete) {
        const quizToDelete = dbQuizzes.find(q => q.day_number === day);
        if (quizToDelete) {
          // Delete questions first (cascade should handle this, but be explicit)
          const { error: qError } = await supabase
            .from('questions')
            .delete()
            .eq('quiz_id', quizToDelete.id);
          
          // Delete quiz
          const { error: deleteError } = await supabase
            .from('quizzes')
            .delete()
            .eq('id', quizToDelete.id);
          
          if (deleteError) {
            console.error(`    ❌ Error deleting day ${day}: ${deleteError.message}`);
          } else {
            totalDeleted++;
          }
        }
      }
    }
    
    // Create quizzes that should exist
    if (daysToCreate.length > 0) {
      console.log(`  ➕ Creating ${daysToCreate.length} days: ${daysToCreate.join(', ')}`);
      
      for (const day of daysToCreate) {
        const { error: createError } = await supabase
          .from('quizzes')
          .insert({
            topic_id: topicId,
            day_number: day
          });
        
        if (createError) {
          console.error(`    ❌ Error creating day ${day}: ${createError.message}`);
        } else {
          totalCreated++;
        }
      }
    }
    
    if (daysToDelete.length === 0 && daysToCreate.length === 0) {
      console.log(`  ✅ Already in sync`);
    }
    
    // Update user_topics if they're beyond max day
    const maxDay = Math.max(...csvDaysArray);
    const { data: userTopics, error: utError } = await supabase
      .from('user_topics')
      .select('id, current_day, unlock_day, completed_days')
      .eq('topic_id', topicId)
      .or(`current_day.gt.${maxDay},unlock_day.gt.${maxDay},completed_days.gt.${maxDay}`);
    
    if (utError) {
      console.error(`  ⚠️  Error checking user_topics: ${utError.message}`);
    } else if (userTopics && userTopics.length > 0) {
      console.log(`  🔧 Updating ${userTopics.length} user_topics that are beyond day ${maxDay}`);
      
      for (const ut of userTopics) {
        const { error: updateError } = await supabase
          .from('user_topics')
          .update({
            current_day: Math.min(ut.current_day, maxDay),
            unlock_day: Math.min(ut.unlock_day, maxDay),
            completed_days: Math.min(ut.completed_days, maxDay)
          })
          .eq('id', ut.id);
        
        if (updateError) {
          console.error(`    ❌ Error updating user_topic: ${updateError.message}`);
        } else {
          totalUpdated++;
        }
      }
    }
  }
  
  console.log('\n✅ SYNC COMPLETE!');
  console.log(`  🗑️  Deleted: ${totalDeleted} quizzes`);
  console.log(`  ➕ Created: ${totalCreated} quizzes`);
  console.log(`  🔧 Updated: ${totalUpdated} user_topics`);
  console.log('\n📊 Final summary:');
  
  // Show final state
  for (const [topicName, csvDays] of csvTopicDays.entries()) {
    const topicId = topicMap.get(topicName);
    if (!topicId) continue;
    
    const { data: finalQuizzes } = await supabase
      .from('quizzes')
      .select('day_number')
      .eq('topic_id', topicId);
    
    if (finalQuizzes) {
      const dbDays = finalQuizzes.map(q => q.day_number).sort((a, b) => a - b);
      const csvDaysArray = Array.from(csvDays).sort((a, b) => a - b);
      const match = dbDays.length === csvDaysArray.length && 
                    dbDays.every((d, i) => d === csvDaysArray[i]);
      
      console.log(`  ${topicName}: ${match ? '✅' : '❌'} DB has ${dbDays.length} days, CSV has ${csvDaysArray.length} days`);
      if (!match) {
        console.log(`    DB: [${dbDays.join(', ')}]`);
        console.log(`    CSV: [${csvDaysArray.join(', ')}]`);
      }
    }
  }
}

syncQuizzesToCSV().catch(console.error);

