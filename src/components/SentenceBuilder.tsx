import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { WordState } from '../types';
import { SortableWord } from './DraggableWord';
import { canJoinAdjacent } from '../utils/contractionUtils';
import './SentenceBuilder.css';

interface SentenceBuilderProps {
  words: WordState[];
  onUpdateForm: (wordId: string, newForm: string) => void;
  onSeparateVerb: (wordId: string) => void;
  onRejoinVerb: (wordId: string) => void;
  onSplitContraction?: (wordId: string) => void;
  onJoinWords?: (prepId: string, articleId: string) => void;
  onWordClick?: (wordId: string) => void;
  disabled?: boolean;
  insertionIndex?: number | null;
}

export function SentenceBuilder({
  words,
  onUpdateForm,
  onSeparateVerb,
  onRejoinVerb,
  onSplitContraction,
  onJoinWords,
  onWordClick,
  disabled = false,
  insertionIndex = null,
}: SentenceBuilderProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'sentence-builder',
  });

  const showEndGap = insertionIndex !== null && insertionIndex === words.length && words.length > 0;

  // Check if word at index can be joined with the next word
  const canJoinAtIndex = (index: number): boolean => {
    if (disabled || !onJoinWords || index >= words.length - 1) return false;
    return canJoinAdjacent(words[index], words[index + 1]);
  };

  return (
    <div
      ref={setNodeRef}
      className={`sentence-builder ${isOver ? 'drag-over' : ''} ${words.length === 0 ? 'empty' : ''}`}
    >
      <h3 className="builder-title">Your Sentence</h3>
      <div className="builder-area">
        {words.length === 0 ? (
          <div className="builder-placeholder">
            Click or drag words to build your sentence
          </div>
        ) : (
          <SortableContext
            items={words.map((w) => w.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="builder-words">
              {words.map((word, index) => (
                <div key={word.id} className="word-with-join">
                  <SortableWord
                    word={word}
                    onUpdateForm={onUpdateForm}
                    onSeparateVerb={onSeparateVerb}
                    onRejoinVerb={onRejoinVerb}
                    onSplitContraction={onSplitContraction}
                    onWordClick={onWordClick}
                    disabled={disabled}
                    showGapBefore={insertionIndex === index}
                  />
                  {canJoinAtIndex(index) && (
                    <button
                      className="join-button"
                      onClick={() => onJoinWords!(words[index].id, words[index + 1].id)}
                      type="button"
                      aria-label={`Join ${words[index].currentForm} and ${words[index + 1].currentForm}`}
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
              {showEndGap && <div className="end-gap" />}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}
