import { DEFAULT_CONFIG, type SchedulerConfig } from "./config";
import { assertValidRating, reinsertionGap } from "./scheduler";
import type { Rating, Rng, SessionState } from "./types";

export function createSession(queue: string[], existing: Record<string, Rating> = {}): SessionState {
  return { queue: [...queue], ratings: { ...existing }, history: [], reviewedCount: 0 };
}

export function currentQuestionId(state: SessionState): string | undefined {
  return state.queue[0];
}

export function isSessionComplete(state: SessionState): boolean {
  return state.queue.length === 0;
}

/**
 * Rates the current card, removes it from the front, and reinserts it
 * according to its rating. Pure: returns a new state.
 * If no other cards remain, the card is not reinserted and the session ends.
 */
export function rateCurrent(
  state: SessionState,
  rating: Rating,
  config: SchedulerConfig = DEFAULT_CONFIG,
  rng: Rng = Math.random,
): SessionState {
  assertValidRating(rating);
  const questionId = state.queue[0];
  if (questionId === undefined) throw new Error("No current question to rate");

  const remaining = state.queue.slice(1);
  const gap = reinsertionGap(rating, config, rng);
  const nextQueue = [...remaining];
  if (gap !== null && remaining.length > 0) {
    nextQueue.splice(Math.min(gap, remaining.length), 0, questionId);
  }

  const entry = {
    questionId,
    previous: state.ratings[questionId] ?? null,
    next: rating,
    queueBefore: [...state.queue],
  };

  return {
    queue: nextQueue,
    ratings: { ...state.ratings, [questionId]: rating },
    history: [...state.history, entry].slice(-config.undoWindow),
    reviewedCount: state.reviewedCount + 1,
  };
}

export function canUndo(state: SessionState): boolean {
  return state.history.length > 0;
}

/** Restores the queue and rating from before the most recent action. */
export function undoLast(state: SessionState): SessionState {
  const last = state.history[state.history.length - 1];
  if (!last) return state;
  const ratings = { ...state.ratings };
  if (last.previous === null) delete ratings[last.questionId];
  else ratings[last.questionId] = last.previous;
  return {
    queue: [...last.queueBefore],
    ratings,
    history: state.history.slice(0, -1),
    reviewedCount: Math.max(0, state.reviewedCount - 1),
  };
}
