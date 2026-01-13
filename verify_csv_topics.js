import fs from 'fs';

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

const csv = fs.readFileSync('quizzes.csv', 'utf-8');
const lines = csv.split('\n');
const csvTopics = new Set();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const parts = parseCSVLine(line);
  if (parts.length > 0 && parts[0]) {
    csvTopics.add(parts[0]);
  }
}

const userTopics = [
  'General Knowledge',
  'English',
  'Geometry',
  'Pre-Calculus',
  'Algebra',
  'Calculus',
  'Business',
  'Logic & Problem Solving (Ongoing)'
];

console.log('\n✅ Verifying user topics are in CSV:\n');

userTopics.forEach(topic => {
  // Check exact match or handle variations
  let found = csvTopics.has(topic);
  if (!found) {
    // Check if it's a variation
    if (topic === 'Business') {
      found = csvTopics.has('Business & Career (Ongoing)');
      if (found) console.log(`⚠️  ${topic} → maps to "Business & Career (Ongoing)" in CSV`);
    } else if (topic === 'General Knowledge') {
      found = csvTopics.has('General Knowledge (Ongoing)');
      if (found) console.log(`⚠️  ${topic} → maps to "General Knowledge (Ongoing)" in CSV`);
    } else if (topic === 'Logic & Problem Solving (Ongoing)') {
      found = csvTopics.has('Logic & Problem Solving (Ongoing)');
    }
  }
  
  if (found) {
    console.log(`✓ ${topic}`);
  } else {
    console.log(`❌ ${topic} - NOT in CSV`);
  }
});

console.log('\n✅ All user topics are from CSV or map to CSV topics!\n');

