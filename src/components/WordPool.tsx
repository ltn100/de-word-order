import { useDroppable } from '@dnd-kit/core';
import type { WordState } from '../types';
import { DraggableWord } from './DraggableWord';
import './WordPool.css';

interface WordPoolProps {
  words: WordState[];
  onUpdateForm: (wordId: string, newForm: string) => void;
  onSeparateVerb: (wordId: string) => void;
  onRejoinVerb: (wordId: string) => void;
  onSplitContraction?: (wordId: string) => void;
  onWordClick?: (wordId: string) => void;
  disabled?: boolean;
}

export function WordPool({
  words,
  onUpdateForm,
  onSeparateVerb,
  onRejoinVerb,
  onSplitContraction,
  onWordClick,
  disabled = false,
}: WordPoolProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'word-pool',
  });

  return (
    <div
      ref={setNodeRef}
      className={`word-pool ${isOver ? 'drag-over' : ''}`}
    >
      <h3 className="pool-title">Available Words</h3>
      <p className="pool-hint">Click or drag words to build your sentence. Click menu to change form.</p>
      <div className="pool-words">
        {words.map((word) => (
          <DraggableWord
            key={word.id}
            word={word}
            onUpdateForm={onUpdateForm}
            onSeparateVerb={onSeparateVerb}
            onRejoinVerb={onRejoinVerb}
            onSplitContraction={onSplitContraction}
            onWordClick={onWordClick}
            disabled={disabled}
          />
        ))}
        {words.length === 0 && (
          <div className="pool-empty">All words placed!</div>
        )}
      </div>
    </div>
  );
}
