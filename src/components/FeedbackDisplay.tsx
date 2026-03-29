import type { FeedbackItem, WordState, Word } from '../types';
import { getWordColor } from '../utils/colorUtils';
import './FeedbackDisplay.css';

interface FeedbackDisplayProps {
  isCorrect: boolean;
  feedback: FeedbackItem[];
  placedWords: WordState[];
  correctWords: Word[];
}

export function FeedbackDisplay({
  isCorrect,
  feedback,
  placedWords,
  correctWords,
}: FeedbackDisplayProps) {
  // Filter out words with position -1 (meant to be joined into contractions) and sort by position
  const sortedCorrect = [...correctWords]
    .filter((w) => w.position >= 0)
    .sort((a, b) => a.position - b.position);

  return (
    <div className={`feedback-display ${isCorrect ? 'correct' : 'incorrect'}`}>
      <div className="feedback-header">
        {isCorrect ? (
          <>
            <span className="feedback-icon">&#10003;</span>
            <span className="feedback-text">Correct! Well done!</span>
          </>
        ) : (
          <>
            <span className="feedback-icon">&#10007;</span>
            <span className="feedback-text">Not quite right. See the correction below:</span>
          </>
        )}
      </div>

      {!isCorrect && (
        <div className="feedback-comparison">
          <div className="feedback-row">
            <span className="feedback-label">Your answer:</span>
            <div className="feedback-words">
              {placedWords.map((word, index) => {
                const isWordCorrect = feedback[index]?.isCorrect ?? false;
                return (
                  <span
                    key={word.id}
                    className={`feedback-word ${!isWordCorrect ? 'wrong' : ''}`}
                    style={{ backgroundColor: getWordColor(word.type, word.gender) }}
                  >
                    {word.currentForm}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="feedback-row">
            <span className="feedback-label">Correct answer:</span>
            <div className="feedback-words">
              {sortedCorrect.map((word) => (
                <span
                  key={word.id}
                  className="feedback-word correct-word"
                  style={{ backgroundColor: getWordColor(word.type, word.gender) }}
                >
                  {word.correctForm}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
