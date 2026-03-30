import type { FeedbackItem, WordState, Word, Case } from '../types';
import { getWordColor } from '../utils/colorUtils';
import './FeedbackDisplay.css';

interface FeedbackDisplayProps {
  isCorrect: boolean;
  feedback: FeedbackItem[];
  placedWords: WordState[];
  correctWords: Word[];
}

// Case display configuration
const CASE_CONFIG: Record<Case, { color: string; label: string; abbrev: string }> = {
  nominative: { color: '#e67e22', label: 'Nominativ', abbrev: 'NOM' },
  accusative: { color: '#0d6efd', label: 'Akkusativ', abbrev: 'AKK' },
  dative: { color: '#198754', label: 'Dativ', abbrev: 'DAT' },
  genitive: { color: '#6f42c1', label: 'Genitiv', abbrev: 'GEN' },
};

// Represents either a single word or a group of words sharing the same case
type WordOrGroup =
  | { type: 'word'; word: Word }
  | { type: 'case-group'; words: Word[]; grammaticalCase: Case };

function groupWordsForRendering(words: Word[]): WordOrGroup[] {
  const result: WordOrGroup[] = [];
  let i = 0;

  while (i < words.length) {
    const word = words[i];

    if (word.grammaticalCase) {
      // Start a case group - collect consecutive words with the same case
      const groupWords: Word[] = [word];
      const groupCase = word.grammaticalCase;

      while (i + 1 < words.length && words[i + 1].grammaticalCase === groupCase) {
        i++;
        groupWords.push(words[i]);
      }

      result.push({ type: 'case-group', words: groupWords, grammaticalCase: groupCase });
    } else {
      // Single word without case
      result.push({ type: 'word', word });
    }

    i++;
  }

  return result;
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

  const wordGroups = groupWordsForRendering(sortedCorrect);
  const hasCaseInfo = wordGroups.some((g) => g.type === 'case-group');

  // Collect unique cases for the legend
  const usedCases = new Set<Case>();
  wordGroups.forEach((g) => {
    if (g.type === 'case-group') {
      usedCases.add(g.grammaticalCase);
    }
  });

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

      <div className="feedback-comparison">
        <div className="feedback-row">
          <span className="feedback-label">Your answer:</span>
          <div className="feedback-words">
            {placedWords.map((word, index) => {
              const isWordCorrect = feedback[index]?.isCorrect ?? false;
              return (
                <span
                  key={word.id}
                  className={`feedback-word ${isWordCorrect ? 'right' : 'wrong'}`}
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
            <div className="feedback-words correct-answer-words">
              {wordGroups.map((group, groupIndex) => {
                if (group.type === 'word') {
                  return (
                    <span
                      key={group.word.id}
                      className="feedback-word correct-word"
                      style={{ backgroundColor: getWordColor(group.word.type, group.word.gender) }}
                    >
                      {group.word.correctForm}
                    </span>
                  );
                } else {
                  const caseConfig = CASE_CONFIG[group.grammaticalCase];
                  return (
                    <span
                      key={`group-${groupIndex}`}
                      className="case-group-wrapper"
                      style={{ '--case-color': caseConfig.color } as React.CSSProperties}
                    >
                      <span className="case-group-words">
                        {group.words.map((word) => (
                          <span
                            key={word.id}
                            className="feedback-word correct-word"
                            style={{ backgroundColor: getWordColor(word.type, word.gender) }}
                          >
                            {word.correctForm}
                          </span>
                        ))}
                      </span>
                      <span className="case-group-underline" />
                      <span className="case-group-label">{caseConfig.abbrev}</span>
                    </span>
                  );
                }
              })}
            </div>
          </div>

          {hasCaseInfo && (
            <div className="case-legend">
              <span className="case-legend-title">Cases:</span>
              {(['nominative', 'accusative', 'dative'] as Case[]).map((c) => {
                if (!usedCases.has(c)) return null;
                const config = CASE_CONFIG[c];
                return (
                  <span key={c} className="case-legend-item">
                    <span
                      className="case-legend-marker"
                      style={{ backgroundColor: config.color }}
                    />
                    <span style={{ color: config.color }}>{config.label}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );
}
