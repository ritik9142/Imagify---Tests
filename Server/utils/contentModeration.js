// Remage/Server/utils/contentModeration.js
import { BANNED_CATEGORIES } from '../constants/content-moderation.constants.js';

// Combine all banned words into a single array
const allBannedWords = [
  ...BANNED_CATEGORIES.SEXUAL_CONTENT,
  ...BANNED_CATEGORIES.VIOLENCE_GORE,
  ...BANNED_CATEGORIES.SENSITIVE_TERMS
].map(word => word.toLowerCase());

/**
 * Checks if the prompt contains any banned words or phrases as whole words.
 * @param {string} prompt - The input prompt to validate.
 * @returns {{ hasBannedWords: boolean, bannedWordsFound: string[] }} - Result and specific banned words.
 */
export const checkForBannedWords = (prompt) => {
  // Ensure prompt is a string; non-strings are invalid
  if (typeof prompt !== 'string') {
    return { hasBannedWords: true, bannedWordsFound: ['non-string input'] };
  }

  const lowerPrompt = prompt.toLowerCase();
  // Create a regex for whole-word matches (word boundaries)
  const bannedWordsRegex = new RegExp(`\\b(${allBannedWords.join('|')})\\b`, 'g');
  const matches = [...new Set(lowerPrompt.match(bannedWordsRegex) || [])]; // Unique matches

  return {
    hasBannedWords: matches.length > 0,
    bannedWordsFound: matches
  };
};
