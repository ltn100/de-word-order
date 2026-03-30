import { useState, useCallback, useEffect } from 'react';
import type { WordState, GameState, Level, Sentence } from '../types';
import { sentenceService } from '../services/SentenceService';
import { wordToWordState, shuffleArray, compareAnswers, isAllCorrect } from '../utils/wordUtils';
import { canJoinWords, getContraction } from '../utils/contractionUtils';

const initialGameState: GameState = {
  currentSentence: null,
  wordPool: [],
  placedWords: [],
  isSubmitted: false,
  isCorrect: null,
  feedback: [],
};

export function useGameState(selectedLevel?: Level) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to set up game state from a sentence
  const setupSentence = useCallback((sentence: Sentence) => {
    // Convert words to word states and shuffle
    // Filter out prefix placeholder words - they're created when user separates a verb
    const wordsToShow = sentence.words.filter(word => {
      // If this word's ID ends with "-prefix", check if there's a separable verb with matching prefix
      if (word.id.endsWith('-prefix')) {
        const separableVerb = sentence.words.find(
          w => w.isSeparable && w.prefix === word.baseForm
        );
        if (separableVerb) {
          return false; // Don't show - will be created when verb is separated
        }
      }
      return true;
    });
    const wordStates = wordsToShow.map(wordToWordState);
    const shuffledWords = shuffleArray(wordStates);

    setGameState({
      currentSentence: sentence,
      wordPool: shuffledWords,
      placedWords: [],
      isSubmitted: false,
      isCorrect: null,
      feedback: [],
    });
  }, []);

  // Load a new random sentence
  const loadNewSentence = useCallback(async (excludeIds: string[] = []) => {
    setLoading(true);
    setError(null);

    try {
      const sentence = await sentenceService.getRandomSentence(selectedLevel, excludeIds);

      if (!sentence) {
        setError('No sentences available');
        setLoading(false);
        return;
      }

      setupSentence(sentence);
    } catch (err) {
      setError('Failed to load sentence');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedLevel, setupSentence]);

  // Load a specific sentence by ID
  const loadSentenceById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const sentence = await sentenceService.getSentenceById(id);

      if (!sentence) {
        setError(`Sentence "${id}" not found`);
        setLoading(false);
        return;
      }

      setupSentence(sentence);
    } catch (err) {
      setError('Failed to load sentence');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [setupSentence]);

  // Move word from pool to placed (at end)
  const placeWord = useCallback((wordId: string) => {
    setGameState((prev) => {
      const wordIndex = prev.wordPool.findIndex((w) => w.id === wordId);
      if (wordIndex === -1) return prev;

      const word = prev.wordPool[wordIndex];
      const newWordPool = [...prev.wordPool];
      newWordPool.splice(wordIndex, 1);

      return {
        ...prev,
        wordPool: newWordPool,
        placedWords: [...prev.placedWords, word],
      };
    });
  }, []);

  // Move word from pool to placed at specific index
  const placeWordAtIndex = useCallback((wordId: string, index: number) => {
    setGameState((prev) => {
      const wordIndex = prev.wordPool.findIndex((w) => w.id === wordId);
      if (wordIndex === -1) return prev;

      const word = prev.wordPool[wordIndex];
      const newWordPool = [...prev.wordPool];
      newWordPool.splice(wordIndex, 1);

      const newPlacedWords = [...prev.placedWords];
      newPlacedWords.splice(index, 0, word);

      return {
        ...prev,
        wordPool: newWordPool,
        placedWords: newPlacedWords,
      };
    });
  }, []);

  // Move word from placed back to pool
  const unplaceWord = useCallback((wordId: string) => {
    setGameState((prev) => {
      const wordIndex = prev.placedWords.findIndex((w) => w.id === wordId);
      if (wordIndex === -1) return prev;

      const word = prev.placedWords[wordIndex];
      const newPlacedWords = [...prev.placedWords];
      newPlacedWords.splice(wordIndex, 1);

      return {
        ...prev,
        wordPool: [...prev.wordPool, word],
        placedWords: newPlacedWords,
      };
    });
  }, []);

  // Reorder placed words
  const reorderPlacedWords = useCallback((fromIndex: number, toIndex: number) => {
    setGameState((prev) => {
      const newPlacedWords = [...prev.placedWords];
      const [moved] = newPlacedWords.splice(fromIndex, 1);
      newPlacedWords.splice(toIndex, 0, moved);

      return {
        ...prev,
        placedWords: newPlacedWords,
      };
    });
  }, []);

  // Reorder pool words
  const reorderPoolWords = useCallback((fromIndex: number, toIndex: number) => {
    setGameState((prev) => {
      const newWordPool = [...prev.wordPool];
      const [moved] = newWordPool.splice(fromIndex, 1);
      newWordPool.splice(toIndex, 0, moved);

      return {
        ...prev,
        wordPool: newWordPool,
      };
    });
  }, []);

  // Update a word's current form (after conjugation/case change)
  const updateWordForm = useCallback((wordId: string, newForm: string) => {
    setGameState((prev) => {
      const updateWord = (words: WordState[]): WordState[] =>
        words.map((w) => (w.id === wordId ? { ...w, currentForm: newForm } : w));

      return {
        ...prev,
        wordPool: updateWord(prev.wordPool),
        placedWords: updateWord(prev.placedWords),
      };
    });
  }, []);

  // Submit answer for checking
  const submitAnswer = useCallback(() => {
    setGameState((prev) => {
      if (!prev.currentSentence || prev.placedWords.length === 0) {
        return prev;
      }

      const feedback = compareAnswers(prev.placedWords, prev.currentSentence.words);
      const correct = isAllCorrect(feedback);

      return {
        ...prev,
        isSubmitted: true,
        isCorrect: correct,
        feedback,
      };
    });
  }, []);

  // Reset current sentence (try again)
  const resetCurrentSentence = useCallback(() => {
    setGameState((prev) => {
      if (!prev.currentSentence) return prev;

      // Reload words from original sentence (handles contractions and separated verbs)
      const wordsToShow = prev.currentSentence.words.filter(word => {
        // Filter out prefix placeholder words
        if (word.id.endsWith('-prefix')) {
          const separableVerb = prev.currentSentence!.words.find(
            w => w.isSeparable && w.prefix === word.baseForm
          );
          if (separableVerb) {
            return false;
          }
        }
        return true;
      });
      const wordStates = wordsToShow.map(wordToWordState);
      const shuffledWords = shuffleArray(wordStates);

      return {
        ...prev,
        wordPool: shuffledWords,
        placedWords: [],
        isSubmitted: false,
        isCorrect: null,
        feedback: [],
      };
    });
  }, []);

  // Handle separable verb separation
  const separateVerb = useCallback((wordId: string) => {
    setGameState((prev) => {
      const findAndUpdate = (words: WordState[]): { words: WordState[]; found: boolean } => {
        const wordIndex = words.findIndex((w) => w.id === wordId);
        if (wordIndex === -1) return { words, found: false };

        const word = words[wordIndex];
        if (!word.isSeparable || !word.prefix || !word.stem || word.isSeparated) {
          return { words, found: false };
        }

        // Create two new word states for prefix and stem
        const prefixWord: WordState = {
          ...word,
          id: `${word.id}-prefix`,
          baseForm: word.prefix,
          correctForm: word.prefix,
          currentForm: word.prefix,
          position: word.prefixPosition ?? -1,
          parentId: word.id,
          isSeparable: false,
        };

        const stemWord: WordState = {
          ...word,
          id: `${word.id}-stem`,
          baseForm: word.stem,
          correctForm: word.correctForm,
          currentForm: word.conjugations?.ich || word.stem,
          position: word.position,
          parentId: word.id,
          isSeparable: false,
          isSeparated: true,
        };

        const newWords = [...words];
        newWords.splice(wordIndex, 1, stemWord, prefixWord);

        return { words: newWords, found: true };
      };

      const poolResult = findAndUpdate(prev.wordPool);
      if (poolResult.found) {
        return { ...prev, wordPool: poolResult.words };
      }

      const placedResult = findAndUpdate(prev.placedWords);
      if (placedResult.found) {
        return { ...prev, placedWords: placedResult.words };
      }

      return prev;
    });
  }, []);

  // Handle separable verb rejoining
  const rejoinVerb = useCallback((wordId: string) => {
    setGameState((prev) => {
      // Find the parent ID
      const parentId = wordId.replace(/-prefix$/, '').replace(/-stem$/, '');
      const prefixId = `${parentId}-prefix`;
      const stemId = `${parentId}-stem`;

      const findParts = (words: WordState[]) => {
        const prefixIndex = words.findIndex((w) => w.id === prefixId);
        const stemIndex = words.findIndex((w) => w.id === stemId);
        return { prefixIndex, stemIndex };
      };

      // Check if both parts are in the pool
      const poolParts = findParts(prev.wordPool);
      if (poolParts.prefixIndex !== -1 && poolParts.stemIndex !== -1) {
        const prefix = prev.wordPool[poolParts.prefixIndex];
        const stem = prev.wordPool[poolParts.stemIndex];

        // Create rejoined word
        const rejoined: WordState = {
          ...stem,
          id: parentId,
          baseForm: `${prefix.baseForm}${stem.baseForm}`,
          currentForm: `${prefix.baseForm}${stem.baseForm}`,
          isSeparable: true,
          isSeparated: false,
          parentId: undefined,
        };

        const newPool = prev.wordPool.filter(
          (w) => w.id !== prefixId && w.id !== stemId
        );
        newPool.push(rejoined);

        return { ...prev, wordPool: newPool };
      }

      // Check if both parts are in placed words
      const placedParts = findParts(prev.placedWords);
      if (placedParts.prefixIndex !== -1 && placedParts.stemIndex !== -1) {
        const prefix = prev.placedWords[placedParts.prefixIndex];
        const stem = prev.placedWords[placedParts.stemIndex];

        const rejoined: WordState = {
          ...stem,
          id: parentId,
          baseForm: `${prefix.baseForm}${stem.baseForm}`,
          currentForm: `${prefix.baseForm}${stem.baseForm}`,
          isSeparable: true,
          isSeparated: false,
          parentId: undefined,
        };

        // Put rejoined word at the stem's position
        const minIndex = Math.min(placedParts.prefixIndex, placedParts.stemIndex);
        const newPlaced = prev.placedWords.filter(
          (w) => w.id !== prefixId && w.id !== stemId
        );
        newPlaced.splice(minIndex, 0, rejoined);

        return { ...prev, placedWords: newPlaced };
      }

      return prev;
    });
  }, []);

  // Join two words into a contraction (e.g., "in" + "dem" = "im")
  const joinWords = useCallback((wordId1: string, wordId2: string) => {
    setGameState((prev) => {
      // Find both words in placed words (joining only works in sentence builder)
      const word1 = prev.placedWords.find((w) => w.id === wordId1);
      const word2 = prev.placedWords.find((w) => w.id === wordId2);

      if (!word1 || !word2 || !canJoinWords(word1, word2)) {
        return prev;
      }

      // Determine which is preposition and which is article
      const [prep, article] = word1.type === 'preposition'
        ? [word1, word2]
        : [word2, word1];

      const contraction = getContraction(prep, article);
      if (!contraction) return prev;

      // Create joined word
      const joinedWord: WordState = {
        id: `${prep.id}-joined`,
        type: 'preposition',
        baseForm: contraction,
        currentForm: contraction,
        correctForm: prep.correctForm, // Keep original correct form for validation
        position: prep.position,
        isContraction: true,
        contractionParts: {
          prepId: prep.id,
          articleId: article.id,
          prepForm: prep.currentForm,
          articleForm: article.currentForm,
          prepBaseForm: prep.baseForm,
          articleBaseForm: article.baseForm,
          articleForms: article.forms,
        },
      };

      // Find positions of both words
      const prepIndex = prev.placedWords.findIndex((w) => w.id === prep.id);
      const articleIndex = prev.placedWords.findIndex((w) => w.id === article.id);

      // Remove both words and insert joined word at the earlier position
      const newPlacedWords = prev.placedWords.filter(
        (w) => w.id !== prep.id && w.id !== article.id
      );
      const insertIndex = Math.min(prepIndex, articleIndex);
      newPlacedWords.splice(insertIndex, 0, joinedWord);

      return {
        ...prev,
        placedWords: newPlacedWords,
      };
    });
  }, []);

  // Split a contraction back into preposition and article
  const splitContraction = useCallback((wordId: string) => {
    setGameState((prev) => {
      // Find the contraction in placed words or pool
      const findAndSplit = (words: WordState[]): { words: WordState[]; found: boolean } => {
        const wordIndex = words.findIndex((w) => w.id === wordId);
        if (wordIndex === -1) return { words, found: false };

        const word = words[wordIndex];
        if (!word.isContraction || !word.contractionParts) {
          return { words, found: false };
        }

        const parts = word.contractionParts;

        // Recreate preposition
        const prepWord: WordState = {
          id: parts.prepId,
          type: 'preposition',
          baseForm: parts.prepBaseForm,
          currentForm: parts.prepForm,
          correctForm: word.correctForm,
          position: word.position,
        };

        // Recreate article
        const articleWord: WordState = {
          id: parts.articleId,
          type: 'article',
          baseForm: parts.articleBaseForm,
          currentForm: parts.articleForm,
          correctForm: parts.articleForm,
          position: word.position + 1,
          forms: parts.articleForms,
        };

        const newWords = [...words];
        newWords.splice(wordIndex, 1, prepWord, articleWord);

        return { words: newWords, found: true };
      };

      const placedResult = findAndSplit(prev.placedWords);
      if (placedResult.found) {
        return { ...prev, placedWords: placedResult.words };
      }

      const poolResult = findAndSplit(prev.wordPool);
      if (poolResult.found) {
        return { ...prev, wordPool: poolResult.words };
      }

      return prev;
    });
  }, []);

  // Load initial sentence on mount
  useEffect(() => {
    loadNewSentence();
  }, [loadNewSentence]);

  return {
    gameState,
    loading,
    error,
    loadNewSentence,
    placeWord,
    placeWordAtIndex,
    unplaceWord,
    reorderPlacedWords,
    reorderPoolWords,
    updateWordForm,
    submitAnswer,
    resetCurrentSentence,
    separateVerb,
    rejoinVerb,
    joinWords,
    splitContraction,
    loadSentenceById,
  };
}
