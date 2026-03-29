import type { WordState } from '../types';

/**
 * Map of valid German preposition + article contractions.
 * Key format: "preposition+articleForm"
 */
const CONTRACTIONS: Record<string, string> = {
  'in+dem': 'im',
  'in+das': 'ins',
  'an+dem': 'am',
  'an+das': 'ans',
  'zu+dem': 'zum',
  'zu+der': 'zur',
  'von+dem': 'vom',
  'bei+dem': 'beim',
};

/**
 * Check if two words can be joined into a contraction.
 * One must be a preposition and the other an article in the correct form.
 */
export function canJoinWords(word1: WordState, word2: WordState): boolean {
  // Determine which is preposition and which is article
  const [prep, article] = word1.type === 'preposition'
    ? [word1, word2]
    : [word2, word1];

  if (prep.type !== 'preposition' || article.type !== 'article') {
    return false;
  }

  const key = `${prep.currentForm}+${article.currentForm}`;
  return key in CONTRACTIONS;
}

/**
 * Check if two adjacent words (in order) can be joined.
 * The preposition must come first, then the article.
 */
export function canJoinAdjacent(first: WordState, second: WordState): boolean {
  if (first.type !== 'preposition' || second.type !== 'article') {
    return false;
  }

  const key = `${first.currentForm.toLowerCase()}+${second.currentForm.toLowerCase()}`;
  return key in CONTRACTIONS;
}

/**
 * Get the contraction form for a preposition + article combination.
 * Returns null if no valid contraction exists.
 */
export function getContraction(prep: WordState, article: WordState): string | null {
  const key = `${prep.currentForm}+${article.currentForm}`;
  return CONTRACTIONS[key] || null;
}

/**
 * Get the original preposition and article forms from a contraction.
 * Returns null if the string is not a known contraction.
 */
export function getContractionParts(contraction: string): { prep: string; article: string } | null {
  for (const [key, value] of Object.entries(CONTRACTIONS)) {
    if (value === contraction) {
      const [prep, article] = key.split('+');
      return { prep, article };
    }
  }
  return null;
}

/**
 * Check if a string is a valid contraction.
 */
export function isContraction(form: string): boolean {
  return Object.values(CONTRACTIONS).includes(form);
}
