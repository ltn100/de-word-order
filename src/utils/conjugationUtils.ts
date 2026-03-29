import type { Conjugations, CaseForms, Declensions } from '../types';

// Get conjugation options for a verb (just the conjugated forms)
export function getConjugationOptions(conjugations: Conjugations): Array<{ label: string; value: string }> {
  // Get unique forms only (some forms are the same, e.g., wir/sie)
  const uniqueForms = [...new Set(Object.values(conjugations))];

  return uniqueForms.map((form) => ({
    label: form,
    value: form,
  }));
}

// Map article forms to their gender(s) for color hints
// Forms used by multiple genders are marked as null (no color)
const ARTICLE_GENDER_MAP: Record<string, 'm' | 'f' | 'n' | null> = {
  // Definite articles
  'der': 'm',   // m-nom (also f-dat/gen, but primarily masculine)
  'die': 'f',   // f-nom, f-acc
  'das': 'n',   // n-nom, n-acc
  'den': 'm',   // m-acc
  'dem': null,  // m-dat AND n-dat - ambiguous
  'des': null,  // m-gen AND n-gen - ambiguous
  // Indefinite articles
  'ein': null,  // m-nom AND n-nom/acc - ambiguous
  'eine': 'f',  // f-nom, f-acc
  'einen': 'm', // m-acc
  'einem': null, // m-dat AND n-dat - ambiguous
  'einer': 'f', // f-dat, f-gen
  'eines': null, // m-gen AND n-gen - ambiguous
  // Negative articles (kein)
  'kein': null,  // m-nom AND n-nom/acc - ambiguous
  'keine': 'f',
  'keinen': 'm',
  'keinem': null, // m-dat AND n-dat - ambiguous
  'keiner': 'f',
  'keines': null, // m-gen AND n-gen - ambiguous
};

// Get CSS variable for gender color
export function getGenderColor(gender: 'm' | 'f' | 'n'): string {
  const colors: Record<string, string> = {
    'm': 'var(--word-noun-m)',
    'f': 'var(--word-noun-f)',
    'n': 'var(--word-noun-n)',
  };
  return colors[gender];
}

// Article forms organized by type and gender (nom, acc, dat)
const DEFINITE_ARTICLE_MATRIX: Record<'m' | 'f' | 'n', [string, string, string]> = {
  'm': ['der', 'den', 'dem'],
  'f': ['die', 'die', 'der'],
  'n': ['das', 'das', 'dem'],
};

const INDEFINITE_ARTICLE_MATRIX: Record<'m' | 'f' | 'n', [string, string, string]> = {
  'm': ['ein', 'einen', 'einem'],
  'f': ['eine', 'eine', 'einer'],
  'n': ['ein', 'ein', 'einem'],
};

const KEIN_ARTICLE_MATRIX: Record<'m' | 'f' | 'n', [string, string, string]> = {
  'm': ['kein', 'keinen', 'keinem'],
  'f': ['keine', 'keine', 'keiner'],
  'n': ['kein', 'kein', 'keinem'],
};

// Possessive pronouns follow the same pattern as indefinite articles
const MEIN_MATRIX: Record<'m' | 'f' | 'n', [string, string, string]> = {
  'm': ['mein', 'meinen', 'meinem'],
  'f': ['meine', 'meine', 'meiner'],
  'n': ['mein', 'mein', 'meinem'],
};

const DEIN_MATRIX: Record<'m' | 'f' | 'n', [string, string, string]> = {
  'm': ['dein', 'deinen', 'deinem'],
  'f': ['deine', 'deine', 'deiner'],
  'n': ['dein', 'dein', 'deinem'],
};

const SEIN_MATRIX: Record<'m' | 'f' | 'n', [string, string, string]> = {
  'm': ['sein', 'seinen', 'seinem'],
  'f': ['seine', 'seine', 'seiner'],
  'n': ['sein', 'sein', 'seinem'],
};

const IHR_POSS_MATRIX: Record<'m' | 'f' | 'n', [string, string, string]> = {
  'm': ['ihr', 'ihren', 'ihrem'],
  'f': ['ihre', 'ihre', 'ihrer'],
  'n': ['ihr', 'ihr', 'ihrem'],
};

// Determine article type from forms array
function getArticleType(forms: string[]): 'definite' | 'indefinite' | 'kein' | 'mein' | 'dein' | 'sein' | 'ihr-poss' {
  if (forms.includes('der') || forms.includes('die') || forms.includes('das')) {
    return 'definite';
  }
  if (forms.includes('kein') || forms.includes('keine') || forms.includes('keinen')) {
    return 'kein';
  }
  if (forms.includes('mein') || forms.includes('meine') || forms.includes('meinen')) {
    return 'mein';
  }
  if (forms.includes('dein') || forms.includes('deine') || forms.includes('deinen')) {
    return 'dein';
  }
  if (forms.includes('sein') || forms.includes('seine') || forms.includes('seinen')) {
    return 'sein';
  }
  if (forms.includes('ihr') || forms.includes('ihre') || forms.includes('ihren')) {
    return 'ihr-poss';
  }
  return 'indefinite';
}

// Get article matrix for gender-based selection
export function getArticleMatrix(forms: string[]): Record<'m' | 'f' | 'n', [string, string, string]> {
  const type = getArticleType(forms);
  switch (type) {
    case 'definite':
      return DEFINITE_ARTICLE_MATRIX;
    case 'kein':
      return KEIN_ARTICLE_MATRIX;
    case 'mein':
      return MEIN_MATRIX;
    case 'dein':
      return DEIN_MATRIX;
    case 'sein':
      return SEIN_MATRIX;
    case 'ihr-poss':
      return IHR_POSS_MATRIX;
    default:
      return INDEFINITE_ARTICLE_MATRIX;
  }
}

// Get all article form options (all genders and cases) with color hints - kept for backwards compatibility
export function getArticleFormOptions(forms: string[]): Array<{ label: string; value: string; color?: string }> {
  // Return unique forms only, with form as both label and value
  const uniqueForms = [...new Set(forms)];
  return uniqueForms.map((form) => {
    const gender = ARTICLE_GENDER_MAP[form.toLowerCase()];
    return {
      label: form,
      value: form,
      // Only color forms that are unambiguous (single gender)
      color: gender !== null && gender !== undefined ? getGenderColor(gender) : undefined,
    };
  });
}

// Get adjective declension matrix for gender-based selection (like articles)
// Includes base form for predicate adjectives (after sein/werden)
export function getAdjectiveMatrix(declensions: Declensions, baseForm?: string): { matrix: Record<'m' | 'f' | 'n', [string, string, string]>; baseForm?: string } {
  // Returns matrix in format: { m: [nom, acc, dat], f: [nom, acc, dat], n: [nom, acc, dat] }
  const genders: Array<'m' | 'f' | 'n'> = ['m', 'f', 'n'];
  const cases = ['nominative', 'accusative', 'dative'];

  const matrix: Record<'m' | 'f' | 'n', [string, string, string]> = {
    m: ['', '', ''],
    f: ['', '', ''],
    n: ['', '', ''],
  };

  for (const gender of genders) {
    for (let i = 0; i < cases.length; i++) {
      const key = `${gender}-${cases[i]}`;
      matrix[gender][i] = declensions[key] || '';
    }
  }

  return { matrix, baseForm };
}

// Get declension options for an adjective - kept for backwards compatibility
export function getDeclensionOptions(declensions: Declensions): Array<{ label: string; value: string }> {
  // Declension keys are formatted as "gender-case" e.g., "m-nominative"
  const genderLabels: Record<string, string> = {
    m: 'masc.',
    f: 'fem.',
    n: 'neut.',
  };

  const caseLabels: Record<string, string> = {
    nominative: 'Nom.',
    accusative: 'Akk.',
    dative: 'Dat.',
    genitive: 'Gen.',
  };

  return Object.entries(declensions).map(([key, form]) => {
    const [gender, grammaticalCase] = key.split('-');
    const label = `${genderLabels[gender] || gender} ${caseLabels[grammaticalCase] || grammaticalCase}: ${form}`;
    return { label, value: form };
  });
}

// Common German verb conjugations (present tense)
export const commonConjugations: Record<string, Conjugations> = {
  sein: {
    ich: 'bin',
    du: 'bist',
    er: 'ist',
    wir: 'sind',
    ihr: 'seid',
    sie: 'sind',
  },
  haben: {
    ich: 'habe',
    du: 'hast',
    er: 'hat',
    wir: 'haben',
    ihr: 'habt',
    sie: 'haben',
  },
  gehen: {
    ich: 'gehe',
    du: 'gehst',
    er: 'geht',
    wir: 'gehen',
    ihr: 'geht',
    sie: 'gehen',
  },
  kommen: {
    ich: 'komme',
    du: 'kommst',
    er: 'kommt',
    wir: 'kommen',
    ihr: 'kommt',
    sie: 'kommen',
  },
  machen: {
    ich: 'mache',
    du: 'machst',
    er: 'macht',
    wir: 'machen',
    ihr: 'macht',
    sie: 'machen',
  },
  trinken: {
    ich: 'trinke',
    du: 'trinkst',
    er: 'trinkt',
    wir: 'trinken',
    ihr: 'trinkt',
    sie: 'trinken',
  },
  essen: {
    ich: 'esse',
    du: 'isst',
    er: 'isst',
    wir: 'essen',
    ihr: 'esst',
    sie: 'essen',
  },
  lesen: {
    ich: 'lese',
    du: 'liest',
    er: 'liest',
    wir: 'lesen',
    ihr: 'lest',
    sie: 'lesen',
  },
  spielen: {
    ich: 'spiele',
    du: 'spielst',
    er: 'spielt',
    wir: 'spielen',
    ihr: 'spielt',
    sie: 'spielen',
  },
  geben: {
    ich: 'gebe',
    du: 'gibst',
    er: 'gibt',
    wir: 'geben',
    ihr: 'gebt',
    sie: 'geben',
  },
  singen: {
    ich: 'singe',
    du: 'singst',
    er: 'singt',
    wir: 'singen',
    ihr: 'singt',
    sie: 'singen',
  },
  stehen: {
    ich: 'stehe',
    du: 'stehst',
    er: 'steht',
    wir: 'stehen',
    ihr: 'steht',
    sie: 'stehen',
  },
};

// Definite article cases
export const definiteArticles: Record<string, CaseForms> = {
  m: {
    nominative: 'der',
    accusative: 'den',
    dative: 'dem',
    genitive: 'des',
  },
  f: {
    nominative: 'die',
    accusative: 'die',
    dative: 'der',
    genitive: 'der',
  },
  n: {
    nominative: 'das',
    accusative: 'das',
    dative: 'dem',
    genitive: 'des',
  },
};

// Indefinite article cases
export const indefiniteArticles: Record<string, CaseForms> = {
  m: {
    nominative: 'ein',
    accusative: 'einen',
    dative: 'einem',
    genitive: 'eines',
  },
  f: {
    nominative: 'eine',
    accusative: 'eine',
    dative: 'einer',
    genitive: 'einer',
  },
  n: {
    nominative: 'ein',
    accusative: 'ein',
    dative: 'einem',
    genitive: 'eines',
  },
};
