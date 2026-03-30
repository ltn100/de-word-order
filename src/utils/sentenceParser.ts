import type { Word } from '../types';
import vocabularyData from '../data/vocabulary.json';

// Contractions map: contraction -> [preposition, article form]
const CONTRACTIONS: Record<string, [string, string]> = {
  'im': ['in', 'dem'],
  'ins': ['in', 'das'],
  'am': ['an', 'dem'],
  'ans': ['an', 'das'],
  'zum': ['zu', 'dem'],
  'zur': ['zu', 'der'],
  'vom': ['von', 'dem'],
  'beim': ['bei', 'dem'],
};

// Article form to type mapping
const ARTICLE_TYPE_MAP: Record<string, 'definite' | 'indefinite' | 'kein'> = {
  'der': 'definite', 'die': 'definite', 'das': 'definite',
  'den': 'definite', 'dem': 'definite', 'des': 'definite',
  'ein': 'indefinite', 'eine': 'indefinite', 'einen': 'indefinite',
  'einem': 'indefinite', 'einer': 'indefinite', 'eines': 'indefinite',
  'kein': 'kein', 'keine': 'kein', 'keinen': 'kein',
  'keinem': 'kein', 'keiner': 'kein', 'keines': 'kein',
};

interface VocabPossessive {
  type: 'possessive';
  baseForm: string;
  forms: string[];
}

interface Vocabulary {
  verbs: Record<string, VocabVerb>;
  nouns: Record<string, VocabNoun>;
  adjectives: Record<string, VocabAdj>;
  articles: Record<string, VocabArticle>;
  pronouns: Record<string, VocabSimple>;
  possessives: Record<string, VocabPossessive>;
  prepositions: Record<string, VocabSimple>;
  adverbs: Record<string, VocabSimple>;
  conjunctions: Record<string, VocabSimple>;
}

interface VocabVerb {
  type: 'verb';
  conjugations?: Record<string, string>;
  isSeparable?: boolean;
  prefix?: string;
  stem?: string;
}

interface VocabNoun {
  type: 'noun';
  gender: 'm' | 'f' | 'n';
  pluralForm?: string;
}

interface VocabAdj {
  type: 'adjective';
  declensions: Record<string, string>;
}

interface VocabArticle {
  type: 'article';
  baseForm: string;
  forms: string[];
}

interface VocabSimple {
  type: string;
}

const vocab = vocabularyData as Vocabulary;

// Build reverse lookup maps for conjugated/declined forms
const verbFormToBase = new Map<string, string>();
const adjFormToBase = new Map<string, string>();
const nounFormToBase = new Map<string, string>();
const possessiveFormToBase = new Map<string, string>();

// Build verb conjugation reverse lookup
// Process non-separable verbs first, then separable verbs
// This ensures "komme" maps to "kommen" not "zurückkommen"
const sortedVerbs = Object.entries(vocab.verbs).sort(([, a], [, b]) => {
  // Non-separable verbs first (false < true when sorted)
  return (a.isSeparable ? 1 : 0) - (b.isSeparable ? 1 : 0);
});

for (const [base, data] of sortedVerbs) {
  if (data.conjugations) {
    for (const form of Object.values(data.conjugations)) {
      // Only set if not already mapped (preserves non-separable verb priority)
      if (!verbFormToBase.has(form.toLowerCase())) {
        verbFormToBase.set(form.toLowerCase(), base);
      }
      // For separable verbs, also add prefix+form for subordinate clauses
      // e.g., "wegzieht" should map to "wegziehen"
      if (data.isSeparable && data.prefix) {
        verbFormToBase.set((data.prefix + form).toLowerCase(), base);
      }
    }
  }
  // Also map the base form itself
  verbFormToBase.set(base.toLowerCase(), base);
}

// Build adjective declension reverse lookup
for (const [base, data] of Object.entries(vocab.adjectives)) {
  for (const form of Object.values(data.declensions)) {
    adjFormToBase.set(form.toLowerCase(), base);
  }
  adjFormToBase.set(base.toLowerCase(), base);
}

// Build noun form reverse lookup (including plurals and dative plurals)
for (const [base, data] of Object.entries(vocab.nouns)) {
  nounFormToBase.set(base.toLowerCase(), base);
  if (data.pluralForm) {
    nounFormToBase.set(data.pluralForm.toLowerCase(), base);
    // Also add dative plural form (plural + n if doesn't end in n/s)
    const plural = data.pluralForm.toLowerCase();
    if (!plural.endsWith('n') && !plural.endsWith('s')) {
      nounFormToBase.set(plural + 'n', base);
    }
  }
}

// Build possessive form reverse lookup
for (const [base, data] of Object.entries(vocab.possessives)) {
  for (const form of data.forms) {
    possessiveFormToBase.set(form.toLowerCase(), base);
  }
}

interface ParseHints {
  contractions?: string[];  // Words that are contractions to be split
  separable?: string[];     // Separable verbs used (base form)
}

interface CompactSentence {
  id: string;
  english: string;
  german: string;
  level: string;
  topic?: string;
  hints?: ParseHints;
}

export function parseSentence(sentence: CompactSentence): Word[] {
  const words: Word[] = [];
  const germanClean = sentence.german.replace(/[.,!?]/g, '');
  const tokens = germanClean.split(/\s+/);
  const hints = sentence.hints || {};
  const contractionSet = new Set(hints.contractions?.map(c => c.toLowerCase()) || []);
  const separableVerbs = hints.separable || [];

  // Build maps for separable verb handling
  const separablePrefixes = new Set<string>();
  const stemToSeparable = new Map<string, string>(); // e.g., "fahren" -> "abfahren"
  const prefixToSeparable = new Map<string, string>(); // e.g., "auf" -> "aufräumen"
  for (const verbBase of separableVerbs) {
    const verbData = vocab.verbs[verbBase];
    if (verbData?.prefix && verbData?.stem) {
      separablePrefixes.add(verbData.prefix.toLowerCase());
      stemToSeparable.set(verbData.stem.toLowerCase(), verbBase);
      prefixToSeparable.set(verbData.prefix.toLowerCase(), verbBase);
    }
  }

  // Track prefix positions (prefix -> position in sentence)
  const prefixPositions = new Map<string, number>();

  let position = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const tokenLower = token.toLowerCase();
    const isFirstWord = i === 0;

    // Check if this is a contraction that should be split
    if (contractionSet.has(tokenLower) && CONTRACTIONS[tokenLower]) {
      const [prep, artForm] = CONTRACTIONS[tokenLower];
      const artType = ARTICLE_TYPE_MAP[artForm];

      // Add preposition (with contraction as correctForm)
      words.push({
        id: `${sentence.id}-w${words.length + 1}`,
        type: 'preposition',
        baseForm: prep,
        correctForm: token,
        position: position++,
      });

      // Add article with position -1 (hidden, joins with prep)
      words.push({
        id: `${sentence.id}-w${words.length + 1}`,
        type: 'article',
        baseForm: artForm,
        correctForm: artForm,
        position: -1,
        forms: vocab.articles[artType].forms,
      });

      continue;
    }

    // Track separable verb prefix positions but don't create separate words
    if (separablePrefixes.has(tokenLower)) {
      const separableBase = prefixToSeparable.get(tokenLower);
      if (separableBase) {
        prefixPositions.set(separableBase, position++);
      }
      continue;
    }

    // Try to identify the word type
    const word = identifyWord(token, tokenLower, isFirstWord, sentence.id, words.length, stemToSeparable);
    if (word) {
      word.position = position++;
      words.push(word);
    }
  }

  // Set prefix positions on separable verbs
  for (const word of words) {
    if (word.isSeparable && word.baseForm) {
      const prefixPos = prefixPositions.get(word.baseForm);
      if (prefixPos !== undefined) {
        word.prefixPosition = prefixPos;
      }
    }
  }

  return words;
}

function identifyWord(
  token: string,
  tokenLower: string,
  _isFirstWord: boolean,
  sentenceId: string,
  wordIndex: number,
  stemToSeparable: Map<string, string>
): Word | null {
  const id = `${sentenceId}-w${wordIndex + 1}`;

  // Check articles first (before other lookups)
  const artType = ARTICLE_TYPE_MAP[tokenLower];
  if (artType) {
    return {
      id,
      type: 'article',
      baseForm: vocab.articles[artType].baseForm,
      correctForm: token,
      position: 0,
      forms: vocab.articles[artType].forms,
    };
  }

  // Check pronouns
  if (vocab.pronouns[tokenLower]) {
    return {
      id,
      type: 'pronoun',
      baseForm: tokenLower,
      correctForm: token,
      position: 0,
    };
  }

  // Check possessives (mein, dein, sein, ihr - treated like articles with dropdown)
  const possBase = possessiveFormToBase.get(tokenLower);
  if (possBase) {
    const possData = vocab.possessives[possBase];
    return {
      id,
      type: 'article',  // Use article type so UI shows the dropdown
      baseForm: possData.baseForm,
      correctForm: token,
      position: 0,
      forms: possData.forms,
    };
  }

  // Check verbs (including conjugated forms)
  let verbBase = verbFormToBase.get(tokenLower);
  if (verbBase) {
    // Check if this stem maps to a separable verb (e.g., "fahren" -> "abfahren")
    const separableBase = stemToSeparable.get(verbBase.toLowerCase());
    if (separableBase) {
      verbBase = separableBase;
    }

    const verbData = vocab.verbs[verbBase];
    const isSeparableVerb = verbData?.isSeparable || false;

    // For past tense verbs (keyed as "haben-past"), use the actual form for display
    const isPastTense = verbBase.endsWith('-past');
    const displayBase = isPastTense ? token : verbBase;

    return {
      id,
      type: 'verb',
      baseForm: displayBase,
      correctForm: token,
      position: 0,
      conjugations: verbData.conjugations as any,
      isSeparable: isSeparableVerb ? verbData.isSeparable : undefined,
      prefix: isSeparableVerb ? verbData.prefix : undefined,
      stem: isSeparableVerb ? verbData.stem : undefined,
    };
  }

  // Check nouns (including plurals)
  const nounBase = nounFormToBase.get(tokenLower);
  if (nounBase) {
    const nounData = vocab.nouns[nounBase];
    return {
      id,
      type: 'noun',
      baseForm: nounBase,
      correctForm: token,
      position: 0,
      gender: nounData.gender,
      pluralForm: nounData.pluralForm,
    };
  }

  // Check adjectives (including declined forms)
  const adjBase = adjFormToBase.get(tokenLower);
  if (adjBase) {
    const adjData = vocab.adjectives[adjBase];
    return {
      id,
      type: 'adjective',
      baseForm: adjBase,
      correctForm: token,
      position: 0,
      declensions: adjData.declensions,
    };
  }

  // Check prepositions
  if (vocab.prepositions[tokenLower]) {
    return {
      id,
      type: 'preposition',
      baseForm: tokenLower,
      correctForm: token,
      position: 0,
    };
  }

  // Check adverbs
  if (vocab.adverbs[tokenLower]) {
    return {
      id,
      type: 'adverb',
      baseForm: tokenLower,
      correctForm: token,
      position: 0,
    };
  }

  // Check conjunctions
  if (vocab.conjunctions[tokenLower]) {
    return {
      id,
      type: 'conjunction',
      baseForm: tokenLower,
      correctForm: token,
      position: 0,
    };
  }

  // Fallback: unknown word - treat as noun
  console.warn(`Unknown word: ${token}`);
  return {
    id,
    type: 'noun',
    baseForm: token,
    correctForm: token,
    position: 0,
  };
}
