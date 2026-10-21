/**
 * Attribution rule for imported decks (product-owner rule):
 * remove visible "Created by" attribution when MORE THAN 50% of the
 * ORIGINAL questions have been modified.
 *
 * Counting (documented in docs/attribution.md):
 *  - An original question counts as modified if it was deleted from the copy,
 *    or its prompt, answer, explanation or options differ after normalising
 *    whitespace and letter case.
 *  - Questions the importer adds do NOT count toward the numerator and do not
 *    enlarge the denominator (adding content alone cannot hide the source).
 *  - Changing the deck title or cover image never counts.
 *  - Reordering never counts.
 */
export interface QuestionContent {
  prompt: string;
  answer: string;
  explanation?: string | null;
  options?: string[];
}

export interface SourceQuestion extends QuestionContent {
  id: string;
}

export interface CopiedQuestion extends QuestionContent {
  /** Stable ID of the source question this copy was made from; null if added by the importer. */
  sourceQuestionId: string | null;
}

export interface ModificationResult {
  originalCount: number;
  modifiedCount: number;
  ratio: number;
  removeAttribution: boolean;
}

const normalise = (text: string | null | undefined): string =>
  (text ?? "").trim().replace(/\s+/g, " ").toLowerCase();

function fingerprint(q: QuestionContent): string {
  return JSON.stringify([
    normalise(q.prompt),
    normalise(q.answer),
    normalise(q.explanation),
    (q.options ?? []).map(normalise),
  ]);
}

export const ATTRIBUTION_REMOVAL_THRESHOLD = 0.5;

export function computeModification(
  originals: SourceQuestion[],
  copies: CopiedQuestion[],
): ModificationResult {
  const copyBySource = new Map<string, CopiedQuestion>();
  for (const copy of copies) {
    if (copy.sourceQuestionId) copyBySource.set(copy.sourceQuestionId, copy);
  }

  let modifiedCount = 0;
  for (const original of originals) {
    const copy = copyBySource.get(original.id);
    if (!copy || fingerprint(copy) !== fingerprint(original)) modifiedCount += 1;
  }

  const originalCount = originals.length;
  const ratio = originalCount === 0 ? 0 : modifiedCount / originalCount;
  return {
    originalCount,
    modifiedCount,
    ratio,
    removeAttribution: ratio > ATTRIBUTION_REMOVAL_THRESHOLD,
  };
}
