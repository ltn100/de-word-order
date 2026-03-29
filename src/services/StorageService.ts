import type { UserProgress } from '../types';

const STORAGE_KEY = 'german_word_order_progress';

const defaultProgress: UserProgress = {
  completedSentenceIds: [],
  totalAttempts: 0,
  correctAttempts: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastPlayedDate: '',
};

// Get user progress from localStorage
export function getProgress(): UserProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as UserProgress;
    }
  } catch (error) {
    console.error('Error reading progress from localStorage:', error);
  }
  return { ...defaultProgress };
}

// Save user progress to localStorage
export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving progress to localStorage:', error);
  }
}

// Update progress after a submission
export function updateProgress(
  sentenceId: string,
  isCorrect: boolean
): UserProgress {
  const progress = getProgress();
  const today = new Date().toISOString().split('T')[0];

  // Update attempts
  progress.totalAttempts += 1;
  if (isCorrect) {
    progress.correctAttempts += 1;
  }

  // Update streak
  if (isCorrect) {
    // Check if this is a new day
    if (progress.lastPlayedDate !== today) {
      // If last played was yesterday, continue streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (progress.lastPlayedDate === yesterdayStr) {
        progress.currentStreak += 1;
      } else if (progress.lastPlayedDate !== today) {
        // More than a day gap, reset streak
        progress.currentStreak = 1;
      }
    }

    // Update best streak
    if (progress.currentStreak > progress.bestStreak) {
      progress.bestStreak = progress.currentStreak;
    }

    // Mark sentence as completed (if not already)
    if (!progress.completedSentenceIds.includes(sentenceId)) {
      progress.completedSentenceIds.push(sentenceId);
    }
  } else {
    // Wrong answer breaks the streak
    progress.currentStreak = 0;
  }

  progress.lastPlayedDate = today;
  saveProgress(progress);
  return progress;
}

// Reset all progress
export function resetProgress(): void {
  saveProgress({ ...defaultProgress });
}

// Get accuracy percentage
export function getAccuracy(progress: UserProgress): number {
  if (progress.totalAttempts === 0) return 0;
  return Math.round((progress.correctAttempts / progress.totalAttempts) * 100);
}
