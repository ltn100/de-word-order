import { useState, useCallback } from 'react';
import type { UserProgress } from '../types';
import { getProgress, updateProgress, resetProgress, getAccuracy } from '../services/StorageService';

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>(() => getProgress());

  // Refresh progress from storage
  const refresh = useCallback(() => {
    setProgress(getProgress());
  }, []);

  // Record a submission
  const recordSubmission = useCallback((sentenceId: string, isCorrect: boolean) => {
    const updated = updateProgress(sentenceId, isCorrect);
    setProgress(updated);
    return updated;
  }, []);

  // Reset all progress
  const reset = useCallback(() => {
    resetProgress();
    setProgress(getProgress());
  }, []);

  // Calculate accuracy
  const accuracy = getAccuracy(progress);

  // Check if a sentence has been completed
  const isSentenceCompleted = useCallback(
    (sentenceId: string) => progress.completedSentenceIds.includes(sentenceId),
    [progress.completedSentenceIds]
  );

  return {
    progress,
    accuracy,
    recordSubmission,
    reset,
    refresh,
    isSentenceCompleted,
  };
}
