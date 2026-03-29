/**
 * Calculate the insertion index based on pointer X position relative to word boundaries.
 * Returns the index where a new word should be inserted.
 */
export function calculateInsertionIndex(
  pointerX: number,
  wordElements: HTMLElement[]
): number {
  if (wordElements.length === 0) return 0;

  for (let i = 0; i < wordElements.length; i++) {
    const rect = wordElements[i].getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;

    if (pointerX < midpoint) {
      return i; // Insert before this word
    }
  }

  return wordElements.length; // Insert at end
}
