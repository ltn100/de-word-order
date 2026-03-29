import type { Sentence, Level } from '../types';
import sentencesA1_1 from '../data/sentences_A1_1.json';
import sentencesA1_2 from '../data/sentences_A1_2.json';
import sentencesA1_3 from '../data/sentences_A1_3.json';
import sentencesA2_1 from '../data/sentences_A2_1.json';
import sentencesA2_2 from '../data/sentences_A2_2.json';
import sentencesA2_3 from '../data/sentences_A2_3.json';
import { parseSentence } from '../utils/sentenceParser';

// Combine all sentence data
const sentencesData = [
  ...sentencesA1_1,
  ...sentencesA1_2,
  ...sentencesA1_3,
  ...sentencesA2_1,
  ...sentencesA2_2,
  ...sentencesA2_3,
];

// Simple sentence format - just the essentials
interface SimpleSentence {
  id: string;
  english: string;
  german: string;
  level: Level;
  topic?: string;
  hints?: {
    contractions?: string[];  // Contractions to split (e.g., ["im", "am"])
    separable?: string[];     // Separable verbs used (e.g., ["aufstehen"])
  };
}

// Expand a simple sentence into full Sentence format
function expandSentence(simple: SimpleSentence): Sentence {
  return {
    id: simple.id,
    english: simple.english,
    germanCorrect: simple.german,
    level: simple.level,
    topic: simple.topic,
    words: parseSentence(simple),
  };
}

// Interface for the sentence service (allows future API swap)
export interface ISentenceService {
  getSentences(level?: Level): Promise<Sentence[]>;
  getSentenceById(id: string): Promise<Sentence | null>;
  getRandomSentence(level?: Level, excludeIds?: string[]): Promise<Sentence | null>;
}

// JSON-based implementation
class JsonSentenceService implements ISentenceService {
  private sentences: Sentence[];

  constructor() {
    const simpleSentences = sentencesData as SimpleSentence[];
    this.sentences = simpleSentences.map(expandSentence);
  }

  async getSentences(level?: Level): Promise<Sentence[]> {
    if (level) {
      return this.sentences.filter((s) => s.level === level);
    }
    return this.sentences;
  }

  async getSentenceById(id: string): Promise<Sentence | null> {
    return this.sentences.find((s) => s.id === id) || null;
  }

  async getRandomSentence(
    level?: Level,
    excludeIds: string[] = []
  ): Promise<Sentence | null> {
    let available = this.sentences;

    if (level) {
      available = available.filter((s) => s.level === level);
    }

    available = available.filter((s) => !excludeIds.includes(s.id));

    if (available.length === 0) {
      // If all sentences completed, allow repeats
      available = level
        ? this.sentences.filter((s) => s.level === level)
        : this.sentences;
    }

    if (available.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }
}

// Export singleton instance
export const sentenceService: ISentenceService = new JsonSentenceService();
