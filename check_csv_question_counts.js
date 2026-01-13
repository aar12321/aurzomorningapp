import fs from 'fs';

const csv = fs.readFileSync('quizzes.csv', 'utf-8');
const lines = csv.split('\n');

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

// Group by QuizID
const quizMap = new Map();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const parts = parseCSVLine(line);
  if (parts.length < 11) continue;
  
  const topicName = parts[0];
  const day = parts[1];
  const quizId = parts[2];
  
  const key = `${topicName}|${day}|${quizId}`;
  
  if (!quizMap.has(key)) {
    quizMap.set(key, 0);
  }
  quizMap.set(key, quizMap.get(key) + 1);
}

// Count how many quizzes have more than 3 questions
let totalQuestions = 0;
let quizzesWithMoreThan3 = 0;
const quizzesWithMoreThan3List = [];

for (const [key, count] of quizMap.entries()) {
  totalQuestions += count;
  if (count > 3) {
    quizzesWithMoreThan3++;
    quizzesWithMoreThan3List.push({ key, count });
  }
}

console.log(`Total questions in CSV: ${totalQuestions}`);
console.log(`Total unique quizzes: ${quizMap.size}`);
console.log(`Quizzes with more than 3 questions: ${quizzesWithMoreThan3}`);
console.log(`\nQuizzes with more than 3 questions (first 10):`);
quizzesWithMoreThan3List.slice(0, 10).forEach(({ key, count }) => {
  console.log(`  ${key}: ${count} questions`);
});

