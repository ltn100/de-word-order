import { useState } from 'react';
import type { MouseEvent } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { WordState, ContextMenuOption } from '../types';
import { getWordColor } from '../utils/colorUtils';
import { ContextMenu } from './ContextMenu';
import { getConjugationOptions, getArticleMatrix, getAdjectiveMatrix } from '../utils/conjugationUtils';
import { canJoinAdjacent } from '../utils/contractionUtils';
import './SentenceBuilder.css';

interface SortableWordProps {
  word: WordState;
  onUpdateForm: (wordId: string, newForm: string) => void;
  onSeparateVerb: (wordId: string) => void;
  onRejoinVerb: (wordId: string) => void;
  onSplitContraction?: (wordId: string) => void;
  onWordClick?: (wordId: string) => void;
  disabled?: boolean;
  showGapBefore?: boolean;
}

function SortableWord({
  word,
  onUpdateForm,
  onSeparateVerb,
  onRejoinVerb,
  onSplitContraction,
  onWordClick,
  disabled = false,
  showGapBefore = false,
}: SortableWordProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: word.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: getWordColor(word.type, word.gender),
  };

  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  const handleMenuClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  const handleWordClick = () => {
    if (disabled || isDragging || !onWordClick) return;
    onWordClick(word.id);
  };

  const getContextMenuOptions = (): ContextMenuOption[] => {
    const options: ContextMenuOption[] = [];

    // Verb conjugation options
    if (word.type === 'verb' && word.conjugations && !word.parentId) {
      const conjugations = getConjugationOptions(word.conjugations);
      conjugations.forEach((conj) => {
        options.push({
          label: conj.label,
          value: conj.value,
          action: () => onUpdateForm(word.id, conj.value),
        });
      });

      if (word.isSeparable && !word.isSeparated) {
        options.push({
          label: '--- Separate verb ---',
          value: 'separate',
          action: () => onSeparateVerb(word.id),
        });
      }
    }

    // Separated verb part
    if (word.parentId) {
      if (word.id.endsWith('-stem') && word.conjugations) {
        const conjugations = getConjugationOptions(word.conjugations);
        conjugations.forEach((conj) => {
          options.push({
            label: conj.label,
            value: conj.value,
            action: () => onUpdateForm(word.id, conj.value),
          });
        });
      }
      options.push({
        label: '--- Rejoin verb ---',
        value: 'rejoin',
        action: () => onRejoinVerb(word.id),
      });
    }

    // Article and adjective options are handled by the matrix, not regular options

    // Noun plural option
    if (word.type === 'noun' && word.pluralForm) {
      const isPlural = word.currentForm === word.pluralForm;
      options.push({
        label: isPlural ? `Singular: ${word.baseForm}` : `Plural: ${word.pluralForm}`,
        value: isPlural ? word.baseForm : word.pluralForm,
        action: () => onUpdateForm(word.id, isPlural ? word.baseForm : word.pluralForm!),
      });
    }

    // Contraction split option
    if (word.isContraction && word.contractionParts && onSplitContraction) {
      options.push({
        label: `Split: ${word.contractionParts.prepForm} + ${word.contractionParts.articleForm}`,
        value: 'split',
        action: () => onSplitContraction(word.id),
      });
    }

    return options;
  };

  const menuOptions = getContextMenuOptions();
  const isArticle = word.type === 'article' && word.forms;
  const isAdjective = word.type === 'adjective' && word.declensions;
  const hasMatrix = isArticle || isAdjective;
  const hasMenu = menuOptions.length > 0 || hasMatrix;

  return (
    <>
      <div
        ref={setNodeRef}
        className={`sortable-word ${isDragging ? 'dragging' : ''} ${hasMenu ? 'has-menu' : ''} ${showGapBefore ? 'gap-before' : ''} ${disabled ? 'disabled' : ''}`}
        style={style}
        data-word-id={word.id}
        onContextMenu={handleContextMenu}
        onClick={handleWordClick}
        {...attributes}
        {...(disabled ? {} : listeners)}
      >
        <span className="word-text">{word.currentForm}</span>
        {hasMenu && (
          <button
            className="menu-indicator"
            onClick={handleMenuClick}
            onPointerDown={(e) => e.stopPropagation()}
            type="button"
            aria-label="Open word options"
          >
            &#8942;
          </button>
        )}
      </div>

      {contextMenu && hasMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={menuOptions}
          onClose={() => setContextMenu(null)}
          articleMatrix={hasMatrix ? {
            matrix: isArticle
              ? getArticleMatrix(word.forms!)
              : getAdjectiveMatrix(word.declensions!, word.baseForm).matrix,
            onSelect: (value) => onUpdateForm(word.id, value),
            baseForm: isAdjective ? word.baseForm : undefined,
          } : undefined}
          readOnly={disabled}
        />
      )}
    </>
  );
}

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
