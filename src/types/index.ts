// Word Types
export type WordType =
  | 'noun'
  | 'verb'
  | 'article'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction';

// Grammatical Gender
export type Gender = 'm' | 'f' | 'n';

// Grammatical Person for verb conjugation
export type Person = 'ich' | 'du' | 'er' | 'wir' | 'ihr' | 'sie';

// Grammatical Case
export type Case = 'nominative' | 'accusative' | 'dative' | 'genitive';

// CEFR Levels
export type Level = 'A1.1' | 'A1.2' | 'A1.3' | 'A2.1' | 'A2.2' | 'A2.3';

// Conjugation table for verbs
export type Conjugations = Record<Person, string>;

// Case forms for articles
export type CaseForms = Record<Case, string>;

// Adjective declensions (key format: "gender-case" e.g., "m-nominative")
export type Declensions = Record<string, string>;

// Base Word interface
export interface Word {
  id: string;
  type: WordType;
  baseForm: string;       // Infinitive/nominative/base form shown initially
  correctForm: string;    // What it should be in the correct sentence
  position: number;       // Correct position in sentence (0-indexed)

  // For nouns
  gender?: Gender;
  pluralForm?: string;

  // For verbs
  conjugations?: Conjugations;
  isSeparable?: boolean;
  prefix?: string;        // e.g., "auf" for "aufstehen"
  stem?: string;          // e.g., "stehen" for "aufstehen"

  // For articles
  forms?: string[];       // All possible forms (all genders and cases)

  // For adjectives
  declensions?: Declensions;
}

// Sentence data structure
export interface Sentence {
  id: string;
  english: string;
  germanCorrect: string;  // The correct German sentence
  words: Word[];          // All words needed (jumbled for display)
  level: Level;
  topic?: string;         // Optional categorization (greetings, food, etc.)
}

// Runtime word state (extends Word with UI state)
export interface WordState extends Word {
  currentForm: string;    // Current displayed form (may differ from baseForm after user changes)
  isSeparated?: boolean;  // For separable verbs - whether it's been split
  separatedParts?: {      // If separated, references to the two parts
    prefix: WordState;
    stem: WordState;
  };
  parentId?: string;      // If this is a separated part, reference to original word

  // For preposition+article contractions (e.g., "im" from "in" + "dem")
  isContraction?: boolean;
  contractionParts?: {
    prepId: string;
    articleId: string;
    prepForm: string;
    articleForm: string;
    prepBaseForm: string;
    articleBaseForm: string;
    articleForms?: string[];
  };
}

// Game state
export interface GameState {
  currentSentence: Sentence | null;
  wordPool: WordState[];           // Words available to drag (not yet placed)
  placedWords: WordState[];        // Words placed in sentence builder
  isSubmitted: boolean;
  isCorrect: boolean | null;
  feedback: FeedbackItem[];
}

// Feedback for wrong answers
export interface FeedbackItem {
  position: number;
  userWord: string;
  correctWord: string;
  isCorrect: boolean;
}

// Progress tracking
export interface UserProgress {
  completedSentenceIds: string[];
  totalAttempts: number;
  correctAttempts: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string;
}

// Color mapping for word types
export interface ColorConfig {
  noun: {
    m: string;  // masculine
    f: string;  // feminine
    n: string;  // neuter
  };
  verb: string;
  article: string;
  adjective: string;
  adverb: string;
  pronoun: string;
  preposition: string;
  conjunction: string;
}

// Context menu option
export interface ContextMenuOption {
  label: string;
  value: string;
  action: () => void;
  color?: string;  // Optional background color for the option
}

// Matrix row for article selection (gender-based)
export interface ArticleMatrixRow {
  gender: 'm' | 'f' | 'n';
  color: string;
  forms: Array<{ label: string; value: string; action: () => void }>;
}

// Context menu state
export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  wordId: string | null;
  options: ContextMenuOption[];
}
