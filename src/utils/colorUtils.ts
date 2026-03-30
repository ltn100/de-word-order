import type { WordType, Gender, ColorConfig } from '../types';

// Simplified color palette - focus on nouns, verbs, and adjectives
// These are used for the legend display (showing light mode colors)
export const colorConfig: ColorConfig = {
  noun: {
    m: '#87CEEB',  // Light Blue - masculine
    f: '#FFB6C1',  // Pink - feminine
    n: '#98FB98',  // Mint - neuter
  },
  verb: '#B19CD9',       // Purple
  article: '#FFFFFF',    // No color (white)
  adjective: '#FFEB99',  // Yellow
  adverb: '#FFFFFF',     // No color (white)
  pronoun: '#FFFFFF',    // No color (white)
  preposition: '#FFFFFF', // No color (white)
  conjunction: '#FFFFFF', // No color (white)
};

// Get color for a word based on its type and gender (uses CSS variables for theme support)
export function getWordColor(type: WordType, gender?: Gender): string {
  if (type === 'noun' && gender) {
    const genderVars: Record<Gender, string> = {
      m: 'var(--word-noun-m)',
      f: 'var(--word-noun-f)',
      n: 'var(--word-noun-n)',
    };
    return genderVars[gender];
  }

  const typeVars: Record<WordType, string> = {
    noun: 'var(--word-default)',
    verb: 'var(--word-verb)',
    article: 'var(--word-default)',
    adjective: 'var(--word-adjective)',
    adverb: 'var(--word-default)',
    pronoun: 'var(--word-default)',
    preposition: 'var(--word-default)',
    conjunction: 'var(--word-default)',
  };

  return typeVars[type] || 'var(--word-default)';
}

// Get readable label for word type (for legend)
export function getWordTypeLabel(type: WordType, gender?: Gender): string {
  if (type === 'noun' && gender) {
    const genderLabels: Record<Gender, string> = {
      m: 'Masculine Noun',
      f: 'Feminine Noun',
      n: 'Neuter Noun',
    };
    return genderLabels[gender];
  }

  const labels: Record<WordType, string> = {
    noun: 'Noun',
    verb: 'Verb',
    article: 'Article',
    adjective: 'Adjective',
    adverb: 'Adverb',
    pronoun: 'Pronoun',
    preposition: 'Preposition',
    conjunction: 'Conjunction',
  };

  return labels[type];
}

// Get color entries for the legend (only colored types, uses CSS variables)
export function getLegendEntries(): Array<{ label: string; color: string }> {
  return [
    { label: 'Masculine Noun', color: 'var(--word-noun-m)' },
    { label: 'Feminine Noun', color: 'var(--word-noun-f)' },
    { label: 'Neuter Noun', color: 'var(--word-noun-n)' },
    { label: 'Verb', color: 'var(--word-verb)' },
    { label: 'Adjective', color: 'var(--word-adjective)' },
  ];
}
