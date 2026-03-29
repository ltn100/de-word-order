import type { UserProgress } from '../types';
import { getAccuracy } from '../services/StorageService';
import './ProgressTracker.css';

interface ProgressTrackerProps {
  progress: UserProgress;
  totalSentences: number;
}

export function ProgressTracker({ progress, totalSentences }: ProgressTrackerProps) {
  const accuracy = getAccuracy(progress);

  return (
    <div className="progress-tracker">
      <div className="progress-stat">
        <span className="stat-value">{progress.completedSentenceIds.length}/{totalSentences}</span>
        <span className="stat-label">Completed</span>
      </div>
      <div className="progress-stat">
        <span className="stat-value">{accuracy}%</span>
        <span className="stat-label">Accuracy</span>
      </div>
      <div className="progress-stat">
        <span className="stat-value">{progress.currentStreak}</span>
        <span className="stat-label">Streak</span>
      </div>
      <div className="progress-stat">
        <span className="stat-value">{progress.bestStreak}</span>
        <span className="stat-label">Best</span>
      </div>
    </div>
  );
}
