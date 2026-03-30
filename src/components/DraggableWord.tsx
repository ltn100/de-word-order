import { useState } from 'react';
import type { MouseEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { WordState, ContextMenuOption } from '../types';
import { getWordColor } from '../utils/colorUtils';
import { getConjugationOptions } from '../utils/conjugationUtils';
import { ContextMenu } from './ContextMenu';
import './DraggableWord.css';

interface DraggableWordProps {
  word: WordState;
  onUpdateForm: (wordId: string, newForm: string) => void;
  onSeparateVerb?: (wordId: string) => void;
  onRejoinVerb?: (wordId: string) => void;
  onSplitContraction?: (wordId: string) => void;
  onWordClick?: (wordId: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function DraggableWord({
  word,
  onUpdateForm,
  onSeparateVerb,
  onRejoinVerb,
  onSplitContraction,
  onWordClick,
  disabled = false,
  style,
}: DraggableWordProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: word.id,
    disabled,
    data: { word },
  });

  const backgroundColor = getWordColor(word.type, word.gender);

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
    // Don't trigger if disabled, dragging, or clicking on menu button
    if (disabled || isDragging || !onWordClick) return;
    // The click event only fires if the pointer didn't move enough to start a drag
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

      // Separable verb option
      if (word.isSeparable && !word.isSeparated && onSeparateVerb) {
        options.push({
          label: '--- Separate verb ---',
          value: 'separate',
          action: () => onSeparateVerb(word.id),
        });
      }
    }

    // Separated verb part - show rejoin option and conjugations for stem
    if (word.parentId && onRejoinVerb) {
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
  // Adjectives no longer have dropdowns
  const hasMenu = menuOptions.length > 0 || isArticle;

  return (
    <>
      <div
        ref={setNodeRef}
        className={`draggable-word ${isDragging ? 'dragging' : ''} ${hasMenu ? 'has-menu' : ''} ${disabled ? 'disabled' : ''}`}
        style={{
          ...style,
          backgroundColor,
          opacity: isDragging ? 0.3 : 1,
        }}
        onContextMenu={handleContextMenu}
        onClick={handleWordClick}
        {...(disabled ? {} : listeners)}
        {...attributes}
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
          simpleList={isArticle ? {
            forms: [...new Set(word.forms!)],
            onSelect: (value) => onUpdateForm(word.id, value),
          } : undefined}
          readOnly={disabled}
        />
      )}
    </>
  );
}
