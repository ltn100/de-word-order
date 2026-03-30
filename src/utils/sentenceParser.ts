import type { Word, Case } from '../types';
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

// Determine grammatical case from article/possessive form
// Returns case and gender when determinable
function determineCaseFromForm(form: string): { case: Case; gender?: 'm' | 'f' | 'n' } | null {
  const f = form.toLowerCase();

  // Definite articles
  if (f === 'der') return { case: 'nominative', gender: 'm' }; // Could also be dative/genitive fem
  if (f === 'die') return { case: 'nominative', gender: 'f' }; // Could also be accusative fem or plural
  if (f === 'das') return { case: 'nominative', gender: 'n' }; // Could also be accusative neut
  if (f === 'den') return { case: 'accusative', gender: 'm' };
  if (f === 'dem') return { case: 'dative' }; // masc or neut
  if (f === 'des') return { case: 'genitive' }; // masc or neut

  // Indefinite articles
  if (f === 'ein') return { case: 'nominative' }; // masc nom or neut nom/acc
  if (f === 'eine') return { case: 'nominative', gender: 'f' }; // fem nom or acc
  if (f === 'einen') return { case: 'accusative', gender: 'm' };
  if (f === 'einem') return { case: 'dative' }; // masc or neut
  if (f === 'einer') return { case: 'dative', gender: 'f' }; // Could also be genitive
  if (f === 'eines') return { case: 'genitive' }; // masc or neut

  // Kein forms
  if (f === 'kein') return { case: 'nominative' }; // masc nom or neut nom/acc
  if (f === 'keine') return { case: 'nominative', gender: 'f' }; // fem nom/acc or plural
  if (f === 'keinen') return { case: 'accusative', gender: 'm' };
  if (f === 'keinem') return { case: 'dative' }; // masc or neut
  if (f === 'keiner') return { case: 'dative', gender: 'f' }; // Could also be genitive
  if (f === 'keines') return { case: 'genitive' }; // masc or neut

  // Possessive base forms (nominative masculine/neuter)
  const possessiveBases = ['mein', 'dein', 'sein', 'ihr', 'unser', 'euer'];
  if (possessiveBases.includes(f)) return { case: 'nominative' };

  // Possessive with -e ending (nominative/accusative feminine, or nominative plural)
  if (possessiveBases.some(p => f === p + 'e')) return { case: 'nominative', gender: 'f' };

  // Possessive endings (mein, dein, sein, ihr, unser, euer, Ihr)
  // These follow the same pattern as ein/kein
  if (f.endsWith('en') && !f.endsWith('nen')) return { case: 'accusative', gender: 'm' }; // meinen, deinen, etc
  if (f.endsWith('em')) return { case: 'dative' }; // meinem, deinem, etc
  if (f.endsWith('er') && f !== 'der') return { case: 'dative', gender: 'f' }; // meiner, deiner, etc
  if (f.endsWith('es') && f !== 'des' && f !== 'das') return { case: 'genitive' }; // meines, deines, etc

  // Unambiguous dative pronouns (object forms only)
  if (f === 'mir' || f === 'dir' || f === 'ihm' || f === 'ihnen') {
    return { case: 'dative' };
  }

  // Unambiguous accusative pronouns (object forms only)
  if (f === 'mich' || f === 'dich' || f === 'ihn') {
    return { case: 'accusative' };
  }

  // Note: "sie", "es", "ihr", "uns", "euch" are ambiguous (can be nominative or accusative/dative)
  // These get their case from sentence position instead

  return null;
}

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
  const stemToSeparable = new Map<string, string>(); // e.g., "fahren" -> "abfahren"
  const prefixToSeparable = new Map<string, string>(); // e.g., "auf" -> "aufräumen"
  for (const verbBase of separableVerbs) {
    const verbData = vocab.verbs[verbBase];
    if (verbData?.prefix && verbData?.stem) {
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

    // Handle separable verb prefixes - create word but it will be filtered from word pool
    // The word pool filters out words ending with "-prefix" (see useGameState)
    // This word is needed for the correct answer feedback display
    const separableBase = prefixToSeparable.get(tokenLower);
    if (separableBase) {
      prefixPositions.set(separableBase, position);
      // Create prefix word with "-prefix" suffix so it's filtered from initial word pool
      // but still appears in the correct answer feedback
      words.push({
        id: `${sentence.id}-${separableBase}-prefix`,
        type: 'verb',
        baseForm: tokenLower,
        correctForm: token,
        position: position++,
      });
      continue;
    }

    // Check if this is a contraction that should be split
    if (contractionSet.has(tokenLower) && CONTRACTIONS[tokenLower]) {
      const [prep, artForm] = CONTRACTIONS[tokenLower];
      const artType = ARTICLE_TYPE_MAP[artForm];
      const caseInfo = determineCaseFromForm(artForm);

      // Add preposition (with contraction as correctForm)
      // Store the governed case on the preposition so it propagates to following nouns
      words.push({
        id: `${sentence.id}-w${words.length + 1}`,
        type: 'preposition',
        baseForm: prep,
        correctForm: token,
        position: position++,
        grammaticalCase: caseInfo?.case,
      });

      // Add article with position -1 (hidden, joins with prep)
      words.push({
        id: `${sentence.id}-w${words.length + 1}`,
        type: 'article',
        baseForm: vocab.articles[artType].baseForm,
        correctForm: artForm,
        position: -1,
        forms: vocab.articles[artType].forms,
        grammaticalCase: caseInfo?.case,
      });

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

  // Propagate case from prepositions/articles to following nouns and adjectives
  // Sort by position first to process in order (exclude hidden words with position -1)
  const sortedWords = [...words]
    .filter((w) => w.position >= 0)
    .sort((a, b) => a.position - b.position);
  let currentCase: Case | undefined;
  let caseFromPreposition = false; // Track if case comes from a governing preposition

  for (const word of sortedWords) {
    if (word.type === 'preposition' && word.grammaticalCase) {
      // Preposition with governed case (mit, von, zu, etc.) - this takes precedence
      currentCase = word.grammaticalCase;
      caseFromPreposition = true;
    } else if (word.type === 'preposition' && !word.grammaticalCase) {
      // Two-way preposition without fixed case - will get case from following article
      currentCase = undefined;
      caseFromPreposition = false;
    } else if (word.type === 'article') {
      if (caseFromPreposition && currentCase) {
        // Preposition governs this article - override its form-based case
        word.grammaticalCase = currentCase;
      } else if (word.grammaticalCase) {
        // No governing preposition - use article's own case
        currentCase = word.grammaticalCase;
      }
    } else if (currentCase && (word.type === 'noun' || word.type === 'adjective')) {
      word.grammaticalCase = currentCase;
      // Reset case after noun (end of noun phrase)
      if (word.type === 'noun') {
        currentCase = undefined;
        caseFromPreposition = false;
      }
    } else if (word.type === 'verb' || word.type === 'conjunction') {
      // Reset case at verbs, conjunctions (start of new phrase)
      currentCase = undefined;
      caseFromPreposition = false;
    }
  }

  // Handle subject pronouns (ich, du, er, sie, es, wir, ihr, Sie) as nominative
  const subjectPronouns = ['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr'];
  for (const word of words) {
    if (word.type === 'pronoun' && subjectPronouns.includes(word.baseForm.toLowerCase()) && !word.grammaticalCase) {
      word.grammaticalCase = 'nominative';
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
    const caseInfo = determineCaseFromForm(token);
    return {
      id,
      type: 'article',
      baseForm: vocab.articles[artType].baseForm,
      correctForm: token,
      position: 0,
      forms: vocab.articles[artType].forms,
      grammaticalCase: caseInfo?.case,
    };
  }

  // Check pronouns
  if (vocab.pronouns[tokenLower]) {
    const caseInfo = determineCaseFromForm(token);
    return {
      id,
      type: 'pronoun',
      baseForm: tokenLower,
      correctForm: token,
      position: 0,
      grammaticalCase: caseInfo?.case,
    };
  }

  // Check possessives (mein, dein, sein, ihr - treated like articles with dropdown)
  const possBase = possessiveFormToBase.get(tokenLower);
  if (possBase) {
    const possData = vocab.possessives[possBase];
    const caseInfo = determineCaseFromForm(token);
    return {
      id,
      type: 'article',  // Use article type so UI shows the dropdown
      baseForm: possData.baseForm,
      correctForm: token,
      position: 0,
      forms: possData.forms,
      grammaticalCase: caseInfo?.case,
    };
  }

  // In German, nouns are capitalized. Check for capitalized nouns BEFORE verbs
  // to avoid confusing "Essen" (food) with "essen" (to eat)
  const isCapitalized = token[0] === token[0].toUpperCase() && token[0] !== token[0].toLowerCase();
  if (isCapitalized) {
    // Check if this capitalized word is a noun
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
  // Show the correct declined form directly (no dropdown selection needed)
  const adjBase = adjFormToBase.get(tokenLower);
  if (adjBase) {
    return {
      id,
      type: 'adjective',
      baseForm: token,
      correctForm: token,
      position: 0,
    };
  }

  // Check prepositions
  if (vocab.prepositions[tokenLower]) {
    // Common dative prepositions
    const dativePreps = ['mit', 'nach', 'bei', 'seit', 'von', 'zu', 'aus', 'gegenüber'];
    // Common accusative prepositions
    const accusativePreps = ['für', 'gegen', 'durch', 'ohne', 'um', 'bis'];

    let prepCase: Case | undefined;
    if (dativePreps.includes(tokenLower)) {
      prepCase = 'dative';
    } else if (accusativePreps.includes(tokenLower)) {
      prepCase = 'accusative';
    }

    return {
      id,
      type: 'preposition',
      baseForm: tokenLower,
      correctForm: token,
      position: 0,
      grammaticalCase: prepCase,
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
