import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragMoveEvent } from '@dnd-kit/core';
import { useGameState } from '../hooks/useGameState';
import { useProgress } from '../hooks/useProgress';
import { EnglishPrompt } from './EnglishPrompt';
import { WordPool } from './WordPool';
import { SentenceBuilder } from './SentenceBuilder';
import { FeedbackDisplay } from './FeedbackDisplay';
import { ProgressTracker } from './ProgressTracker';
import type { WordState, Level } from '../types';
import { getWordColor } from '../utils/colorUtils';
import { calculateInsertionIndex } from '../utils/insertionUtils';
import './GameBoard.css';

interface GameBoardProps {
  totalSentences: number;
}

const LEVELS: Level[] = ['A1.1', 'A1.2', 'A1.3'];
const LEVEL_STORAGE_KEY = 'german-app-selected-level';

export function GameBoard({ totalSentences }: GameBoardProps) {
  const [selectedLevel, setSelectedLevel] = useState<Level | undefined>(() => {
    const saved = localStorage.getItem(LEVEL_STORAGE_KEY);
    return saved && LEVELS.includes(saved as Level) ? (saved as Level) : undefined;
  });

  const {
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
  } = useGameState(selectedLevel);

  const { progress, recordSubmission } = useProgress();
  const [activeWord, setActiveWord] = useState<WordState | null>(null);
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const isDraggingFromPool = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const word =
      gameState.wordPool.find((w) => w.id === active.id) ||
      gameState.placedWords.find((w) => w.id === active.id);
    setActiveWord(word || null);

    // Track if dragging from pool
    isDraggingFromPool.current = gameState.wordPool.some((w) => w.id === active.id);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { active } = event;

    // Get the current pointer position
    const draggedRect = active.rect.current.translated;
    if (!draggedRect) {
      setInsertionIndex(null);
      return;
    }

    const pointerX = draggedRect.left + draggedRect.width / 2;
    const pointerY = draggedRect.top + draggedRect.height / 2;

    // Check if we're over the sentence builder area
    const builderElement = document.querySelector('.sentence-builder');
    if (!builderElement) {
      setInsertionIndex(null);
      return;
    }

    const builderRect = builderElement.getBoundingClientRect();
    if (pointerY < builderRect.top || pointerY > builderRect.bottom) {
      setInsertionIndex(null);
      return;
    }

    // Dragging from pool - show insertion index
    if (isDraggingFromPool.current) {
      const wordElements = Array.from(
        document.querySelectorAll('.builder-words .word-with-join')
      ) as HTMLElement[];

      const index = calculateInsertionIndex(pointerX, wordElements);
      setInsertionIndex(index);
    } else {
      setInsertionIndex(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const currentInsertionIndex = insertionIndex; // Capture before reset

    setActiveWord(null);
    setInsertionIndex(null);
    isDraggingFromPool.current = false;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragging from pool
    const isFromPool = gameState.wordPool.some((w) => w.id === activeId);
    const isToWordPool = overId === 'word-pool';

    // If dragging from pool with a valid insertion index, use it
    if (isFromPool && currentInsertionIndex !== null) {
      placeWordAtIndex(activeId, currentInsertionIndex);
      return;
    }

    // Fallback: if dropping on sentence builder without a specific index, append to end
    const isToSentenceBuilder = overId === 'sentence-builder';
    if (isFromPool && isToSentenceBuilder) {
      placeWord(activeId);
      return;
    }

    // Check if dragging from sentence builder back to pool
    const isFromSentenceBuilder = gameState.placedWords.some((w) => w.id === activeId);
    if (isFromSentenceBuilder && isToWordPool) {
      unplaceWord(activeId);
      return;
    }

    // Handle reordering within sentence builder
    if (isFromSentenceBuilder) {
      const oldIndex = gameState.placedWords.findIndex((w) => w.id === activeId);
      const newIndex = gameState.placedWords.findIndex((w) => w.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        reorderPlacedWords(oldIndex, newIndex);
      }
    }

    // Handle reordering within word pool
    if (isFromPool && !isToSentenceBuilder) {
      const oldIndex = gameState.wordPool.findIndex((w) => w.id === activeId);
      const newIndex = gameState.wordPool.findIndex((w) => w.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        reorderPoolWords(oldIndex, newIndex);
      }
    }
  };

  const handleSubmit = () => {
    submitAnswer();
  };

  // Record progress when answer is submitted
  useEffect(() => {
    if (gameState.isSubmitted && gameState.currentSentence && gameState.isCorrect !== null) {
      recordSubmission(gameState.currentSentence.id, gameState.isCorrect);
    }
  }, [gameState.isSubmitted, gameState.isCorrect, gameState.currentSentence, recordSubmission]);

  // Reload sentence when level changes
  useEffect(() => {
    loadNewSentence(progress.completedSentenceIds);
  }, [selectedLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const newLevel = value === '' ? undefined : value as Level;
    setSelectedLevel(newLevel);
    if (newLevel) {
      localStorage.setItem(LEVEL_STORAGE_KEY, newLevel);
    } else {
      localStorage.removeItem(LEVEL_STORAGE_KEY);
    }
  };

  const handleNextSentence = () => {
    loadNewSentence(progress.completedSentenceIds);
  };

  const handleTryAgain = () => {
    resetCurrentSentence();
  };

  const handleSentenceIdClick = () => {
    const id = prompt('Enter sentence ID:', gameState.currentSentence?.id || '');
    if (id && id.trim()) {
      loadSentenceById(id.trim());
    }
  };

  if (loading) {
    return <div className="game-loading">Loading...</div>;
  }

  if (error) {
    return <div className="game-error">{error}</div>;
  }

  if (!gameState.currentSentence) {
    return <div className="game-loading">No sentence available</div>;
  }

  const isDisabled = gameState.isSubmitted;

  return (
    <div className="game-board">
      <div className="game-header">
        <ProgressTracker progress={progress} totalSentences={totalSentences} />
        <div className="level-selector">
          <label htmlFor="level-select">Level:</label>
          <select
            id="level-select"
            value={selectedLevel || ''}
            onChange={handleLevelChange}
          >
            <option value="">All Levels</option>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      </div>

      <EnglishPrompt sentence={gameState.currentSentence.english} level={gameState.currentSentence.level} />

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <SentenceBuilder
          words={gameState.placedWords}
          onUpdateForm={updateWordForm}
          onSeparateVerb={separateVerb}
          onRejoinVerb={rejoinVerb}
          onSplitContraction={splitContraction}
          onJoinWords={joinWords}
          onWordClick={unplaceWord}
          disabled={isDisabled}
          insertionIndex={insertionIndex}
        />

        <WordPool
          words={gameState.wordPool}
          onUpdateForm={updateWordForm}
          onSeparateVerb={separateVerb}
          onRejoinVerb={rejoinVerb}
          onSplitContraction={splitContraction}
          onWordClick={placeWord}
          disabled={isDisabled}
        />

        <DragOverlay>
          {activeWord ? (
            <div
              className="drag-overlay-word"
              style={{ backgroundColor: getWordColor(activeWord.type, activeWord.gender) }}
            >
              {activeWord.currentForm}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="game-actions">
        {!gameState.isSubmitted ? (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={gameState.placedWords.length === 0}
          >
            Check Answer
          </button>
        ) : (
          <div className="post-submit-actions">
            {!gameState.isCorrect && (
              <button className="btn btn-secondary" onClick={handleTryAgain}>
                Try Again
              </button>
            )}
            <button className="btn btn-primary" onClick={handleNextSentence}>
              Next Sentence
            </button>
          </div>
        )}
      </div>

      {gameState.isSubmitted && gameState.isCorrect !== null && (
        <FeedbackDisplay
          isCorrect={gameState.isCorrect}
          feedback={gameState.feedback}
          placedWords={gameState.placedWords}
          correctWords={gameState.currentSentence.words}
        />
      )}

      <footer className="game-footer">
        <span
          className="sentence-id"
          onClick={handleSentenceIdClick}
          title="Click to load a specific sentence"
        >
          {gameState.currentSentence.id}
        </span>
      </footer>
    </div>
  );
}
