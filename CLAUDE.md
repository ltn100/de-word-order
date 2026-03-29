# German Learning App

A React + TypeScript drag-and-drop sentence builder for learning German grammar.

## Quick Start

```bash
npm install
npm run dev    # Development server at localhost:5173
npm run build  # Production build
```

## Architecture

### Core Concept
Users translate English sentences to German by dragging word tiles into the correct order. Words can be conjugated/declined via dropdown menus (right-click or hamburger icon).

### Key Files

| File | Purpose |
|------|---------|
| `src/components/GameBoard.tsx` | Main game orchestration, drag-and-drop context, level selector |
| `src/hooks/useGameState.ts` | Game state management (word placement, form changes, answer validation) |
| `src/services/SentenceService.ts` | Loads and serves sentences from JSON files |
| `src/utils/sentenceParser.ts` | Parses simple sentence format into full Word objects with vocabulary lookup |
| `src/utils/conjugationUtils.ts` | Article/possessive/adjective matrices for dropdown menus |
| `src/data/vocabulary.json` | Master vocabulary with conjugations, declensions, genders |
| `src/data/sentences_*.json` | Sentence data split by CEFR level (A1.1 through A2.3) |

### Data Flow
1. `SentenceService` loads sentences from JSON files
2. `sentenceParser` expands simple sentences using `vocabulary.json` lookups
3. `useGameState` manages runtime state (word pool, placed words, form changes)
4. `GameBoard` renders drag-and-drop UI via @dnd-kit

## Sentence Format

Sentences use a simple JSON format that gets expanded at runtime:

```json
{
  "id": "a12-01",
  "english": "I can swim.",
  "german": "Ich kann schwimmen.",
  "level": "A1.2",
  "hints": {
    "separable": ["aufstehen"],      // Separable verbs to split
    "contractions": ["im", "am"]     // Preposition+article contractions
  }
}
```

The parser automatically:
- Looks up words in vocabulary.json for conjugations/declensions
- Creates Word objects with correct forms and positions
- Handles separable verbs (aufstehen -> stehe...auf)
- Handles contractions (im -> in + dem)

## CEFR Levels

| Level | Grammar Focus |
|-------|---------------|
| A1.1 | Basic SVO, sein/haben, simple present |
| A1.2 | Modal verbs, separable verbs, negation, basic adjectives |
| A1.3 | Possessives, time expressions, expanded vocabulary |
| A2.1 | Verb-second rule, accusative/dative cases, past tense (war/hatte) |
| A2.2 | Complex adjective declensions, longer sentences |
| A2.3 | Subordinate clauses (weil, dass, wenn, obwohl, bevor, nachdem) |

## Word Types & Colors

Words are color-coded by type:
- **Nouns**: Blue (m), Red (f), Green (n) - gender-based colors
- **Verbs**: Orange
- **Articles**: Purple (with gender-colored dropdown options)
- **Adjectives**: Teal (with gender-colored dropdown matrix)
- **Possessives**: Treated like articles with dropdown
- **Other**: Gray tones

## Key Features

### Separable Verbs
Verbs like "aufstehen" can be split via context menu. In main clauses, the prefix goes to the end: "Ich stehe um sieben auf."

### Contractions
Preposition + article combinations (in + dem = im) can be joined by dragging one onto the other, or split via context menu.

### Dropdown Menus
- Articles show a 3x3 grid (gender x case)
- Adjectives show the same grid format with declension forms
- Possessives (mein, dein, sein, ihr) work like articles
- Verbs show conjugation options by person

### Answer Validation
Compares placed words against correct sentence, checking both form and position. Feedback shows which words are correct/incorrect.

## Adding New Sentences

1. Add to appropriate `src/data/sentences_*.json` file
2. Ensure all words exist in `vocabulary.json` (or will be created as basic words)
3. Add `hints.separable` for separable verbs, `hints.contractions` for contractions

## Adding New Vocabulary

Edit `src/data/vocabulary.json`:

```json
// Verb with conjugations
"spielen": {
  "type": "verb",
  "conjugations": { "ich": "spiele", "du": "spielst", "er": "spielt", ... }
}

// Separable verb
"aufstehen": {
  "type": "verb",
  "isSeparable": true,
  "prefix": "auf",
  "stem": "stehen",
  "conjugations": { ... }
}

// Noun with gender
"Haus": { "type": "noun", "gender": "n", "pluralForm": "Häuser" }

// Adjective with declensions
"klein": {
  "type": "adjective",
  "declensions": {
    "m-nominative": "kleine", "m-accusative": "kleinen", ...
  }
}
```

## Tech Stack

- React 18 + TypeScript
- Vite build system
- @dnd-kit for drag-and-drop
- CSS modules (no framework)
- localStorage for progress persistence
