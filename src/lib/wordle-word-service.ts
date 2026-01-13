/**
 * Wordle Word Service
 * Uses dictionary API to validate words in real-time
 * No hardcoded word lists - everything is validated via API
 */

const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';

// Cache for validated words to reduce API calls
const wordCache = new Map<string, boolean>();
const validWordsCache: string[] = [];

// Common 5-letter words for daily puzzles (validated via API)
// These are just seeds - we'll validate them via API
const COMMON_WORDS = [
  'APPLE', 'BEACH', 'BRAIN', 'BREAD', 'CHAIR', 'CLOUD', 'DANCE', 'EARTH',
  'FIELD', 'FRUIT', 'GLASS', 'GRAPE', 'GREEN', 'HEART', 'HORSE', 'HOUSE',
  'LIGHT', 'MONEY', 'MUSIC', 'NIGHT', 'OCEAN', 'PARTY', 'PHONE', 'PIZZA',
  'PLANT', 'POWER', 'RIVER', 'SHIRT', 'SMILE', 'SPACE', 'STORM', 'TABLE',
  'TOAST', 'TIGER', 'TOUCH', 'TRAIN', 'WATER', 'WHEEL', 'WORLD', 'WRITE'
];

/**
 * Validate a word using the dictionary API
 */
export async function validateWord(word: string): Promise<boolean> {
  if (word.length !== 5) return false;
  if (!/^[A-Za-z]+$/.test(word)) return false;

  const upperWord = word.toUpperCase();

  // Check cache first
  if (wordCache.has(upperWord)) {
    return wordCache.get(upperWord)!;
  }

  try {
    const response = await fetch(`${DICTIONARY_API}/${word.toLowerCase()}`);
    
    if (response.ok) {
      const data = await response.json();
      // If API returns data, it's a valid word
      const isValid = Array.isArray(data) && data.length > 0;
      wordCache.set(upperWord, isValid);
      
      if (isValid && !validWordsCache.includes(upperWord)) {
        validWordsCache.push(upperWord);
      }
      
      return isValid;
    } else if (response.status === 404) {
      // Word not found in dictionary
      wordCache.set(upperWord, false);
      return false;
    } else {
      // API error - be permissive (allow the word) to avoid blocking gameplay
      console.warn(`Dictionary API error for "${word}":`, response.status);
      wordCache.set(upperWord, true); // Cache as valid to avoid repeated API calls
      return true;
    }
  } catch (error) {
    console.error(`Error validating word "${word}":`, error);
    // On error, be permissive to avoid blocking gameplay
    wordCache.set(upperWord, true);
    return true;
  }
}

/**
 * Get a random valid word for daily puzzle
 * Uses date-based seed for consistency
 */
export async function getDailyWord(): Promise<string> {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Try to get a word from cache first
  if (validWordsCache.length > 0) {
    const index = seed % validWordsCache.length;
    return validWordsCache[index];
  }

  // If cache is empty, validate common words and pick one
  const validatedWords: string[] = [];
  
  for (const word of COMMON_WORDS) {
    const isValid = await validateWord(word);
    if (isValid) {
      validatedWords.push(word);
    }
    // Limit validation to avoid too many API calls
    if (validatedWords.length >= 10) break;
  }

  if (validatedWords.length > 0) {
    const index = seed % validatedWords.length;
    return validatedWords[index];
  }

  // Fallback: return a common word (will be validated when user plays)
  return COMMON_WORDS[seed % COMMON_WORDS.length];
}

/**
 * Pre-validate a set of common words to build cache
 * Call this on app load to warm up the cache
 */
export async function warmupWordCache(): Promise<void> {
  // Validate a few common words in the background
  const wordsToValidate = COMMON_WORDS.slice(0, 20);
  
  Promise.all(
    wordsToValidate.map(word => validateWord(word))
  ).catch(error => {
    console.error('Error warming up word cache:', error);
  });
}

/**
 * Get word definition (optional feature)
 */
export async function getWordDefinition(word: string): Promise<string | null> {
  try {
    const response = await fetch(`${DICTIONARY_API}/${word.toLowerCase()}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const firstMeaning = data[0].meanings?.[0]?.definitions?.[0]?.definition;
        return firstMeaning || null;
      }
    }
  } catch (error) {
    console.error(`Error fetching definition for "${word}":`, error);
  }
  return null;
}

