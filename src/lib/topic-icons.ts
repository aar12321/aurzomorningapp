// Helper function to get icon based on topic name and category
export const getTopicIcon = (name: string, category?: string): string => {
  const lowerName = name.toLowerCase();
  const lowerCategory = category?.toLowerCase() || '';
  
  // Math topics
  if (lowerName.includes('math') || lowerName.includes('algebra') || lowerName.includes('geometry') || 
      lowerName.includes('calculus') || lowerName.includes('pre-calculus') || lowerCategory === 'math') {
    return '📊';
  }
  
  // Science topics
  if (lowerName.includes('science') || lowerName.includes('chemistry') || lowerName.includes('biology') || 
      lowerName.includes('physics') || lowerName.includes('physiology') || lowerCategory === 'science') {
    return '🔬';
  }
  
  // English/Language
  if (lowerName.includes('english') || lowerCategory === 'language') {
    return '📚';
  }
  
  // Business & Career
  if (lowerName.includes('business') || lowerName.includes('career') || lowerName.includes('entrepreneurship') || 
      lowerName.includes('small business') || lowerCategory === 'professional') {
    return '💼';
  }
  
  // Financial
  if (lowerName.includes('financial') || lowerName.includes('retirement') || lowerName.includes('credit') || 
      lowerName.includes('debt') || lowerCategory === 'life skills') {
    return '💰';
  }
  
  // Health & Wellness
  if (lowerName.includes('health') || lowerName.includes('wellness') || lowerName.includes('fitness') || 
      lowerName.includes('nutrition') || lowerName.includes('mental health') || lowerCategory === 'health') {
    return '💚';
  }
  
  // World/Geography/Cultural
  if (lowerName.includes('world') || lowerName.includes('geography') || lowerName.includes('cultural') || 
      lowerName.includes('global') || lowerCategory === 'geography' || lowerCategory === 'current affairs') {
    return '🌍';
  }
  
  // Technology/AI
  if (lowerName.includes('ai') || lowerName.includes('tech') || lowerName.includes('technology') || 
      lowerName.includes('computer') || lowerName.includes('cybersecurity') || lowerName.includes('power bi') || 
      lowerName.includes('excel') || lowerName.includes('email') || lowerCategory === 'technology' || lowerCategory === 'productivity') {
    return '🤖';
  }
  
  // History
  if (lowerName.includes('history') || lowerCategory === 'history') {
    return '🏛️';
  }
  
  // Logic & Problem Solving
  if (lowerName.includes('logic') || lowerName.includes('problem solving') || lowerCategory === 'critical thinking') {
    return '🧩';
  }
  
  // Test Prep
  if (lowerName.includes('sat') || lowerName.includes('act') || lowerCategory === 'test prep') {
    return '🎯';
  }
  
  // Fun & Pop Culture
  if (lowerName.includes('fun') || lowerName.includes('pop culture') || lowerCategory === 'trivia') {
    return '🎬';
  }
  
  // General Knowledge
  if (lowerName.includes('general knowledge') || (lowerCategory === 'trivia' && !lowerName.includes('fun'))) {
    return '🧠';
  }
  
  // Leadership & Career Skills
  if (lowerName.includes('leadership') || lowerName.includes('teamwork') || 
      lowerName.includes('resume') || lowerName.includes('linkedin') || lowerName.includes('interview') || 
      lowerName.includes('workplace') || lowerName.includes('communication')) {
    return '📝';
  }
  
  // Economics
  if (lowerName.includes('economics') || lowerCategory === 'social science') {
    return '📈';
  }
  
  // Default
  return '📖';
};

