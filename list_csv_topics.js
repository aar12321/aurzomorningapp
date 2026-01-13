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
const topics = new Set();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const parts = parseCSVLine(line);
  if (parts.length > 0 && parts[0]) {
    topics.add(parts[0]);
  }
}

console.log('\n📋 All topics in CSV:\n');
const sortedTopics = Array.from(topics).sort();
sortedTopics.forEach((topic, idx) => {
  console.log(`${idx + 1}. ${topic}`);
});

console.log(`\n📊 Total: ${sortedTopics.length} topics\n`);

