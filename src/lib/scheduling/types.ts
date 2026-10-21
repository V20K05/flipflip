export type Stars = 1 | 2 | 3 | 4 | 5;

/** A user's manual difficulty classification for one question. */
export type Rating =
  | { category: "HARD" }
  | { category: "MEDIUM"; stars: Stars }
  | { category: "EASY" };

export interface HistoryEntry {
  questionId: string;
  previous: Rating | null;
  next: Rating;
  /** Queue as it was before this rating, so undo restores it exactly. */
  queueBefore: string[];
}

export interface SessionState {
  /** queue[0] is the current card. */
  queue: string[];
  ratings: Record<string, Rating>;
  /** Most recent actions, oldest first, capped at config.undoWindow. */
  history: HistoryEntry[];
  reviewedCount: number;
}

export interface QueueItem {
  questionId: string;
  rating: Rating | null; // null = never rated
}

export type Rng = () => number;
