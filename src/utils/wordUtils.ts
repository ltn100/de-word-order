import type { Word, WordState, FeedbackItem } from '../types';

// Convert Word to WordState (add runtime state)
export function wordToWordState(word: Word): WordState {
  return {
    ...word,
    currentForm: word.baseForm,
    isSeparated: false,
  };
}

// Create a shuffled copy of an array
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate random position for floating words
export function generateRandomPosition(
  containerWidth: number,
  containerHeight: number,
  wordWidth: number,
  wordHeight: number
): { x: number; y: number } {
  const x = Math.random() * (containerWidth - wordWidth);
  const y = Math.random() * (containerHeight - wordHeight);
  return { x, y };
}

// Compare user's answer with correct answer
export function compareAnswers(
  placedWords: WordState[],
  correctWords: Word[]
): FeedbackItem[] {
  const feedback: FeedbackItem[] = [];

  // Filter out words with position -1 (meant to be joined into contractions)
  // and sort correct words by position
  const sortedCorrect = [...correctWords]
    .filter((w) => w.position >= 0)
    .sort((a, b) => a.position - b.position);

  const maxLength = Math.max(placedWords.length, sortedCorrect.length);

  for (let i = 0; i < maxLength; i++) {
    const userWord = placedWords[i];
    const correctWord = sortedCorrect[i];

    const userForm = userWord?.currentForm || '';
    const correctForm = correctWord?.correctForm || '';
    const isCorrect = userForm.toLowerCase() === correctForm.toLowerCase();

    feedback.push({
      position: i,
      userWord: userForm,
      correctWord: correctForm,
      isCorrect,
    });
  }

  return feedback;
}

// Check if all answers are correct
export function isAllCorrect(feedback: FeedbackItem[]): boolean {
  return feedback.every((item) => item.isCorrect);
}

// Separate a separable verb into prefix and stem
export function separateVerb(word: WordState): { prefix: WordState; stem: WordState } | null {
  if (!word.isSeparable || !word.prefix || !word.stem) {
    return null;
  }

  const prefix: WordState = {
    ...word,
    id: `${word.id}-prefix`,
    baseForm: word.prefix,
    currentForm: word.prefix,
    type: 'verb', // Prefix is treated as part of verb
    parentId: word.id,
    position: -1, // Will be set based on sentence context
  };

  const stem: WordState = {
    ...word,
    id: `${word.id}-stem`,
    baseForm: word.stem,
    currentForm: word.conjugations?.ich || word.stem, // Default to ich form
    parentId: word.id,
    position: word.position,
  };

  return { prefix, stem };
}

// Rejoin separated verb parts
export function rejoinVerb(prefix: WordState, stem: WordState): WordState {
  // Find the original word data (stored in stem since it has conjugations)
  return {
    ...stem,
    id: stem.parentId || stem.id.replace('-stem', ''),
    baseForm: `${prefix.baseForm}${stem.baseForm}`,
    currentForm: `${prefix.baseForm}${stem.baseForm}`,
    isSeparated: false,
    parentId: undefined,
  };
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
