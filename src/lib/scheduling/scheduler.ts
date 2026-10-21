import { DEFAULT_CONFIG, type SchedulerConfig } from "./config";
import type { QueueItem, Rating, Rng, Stars } from "./types";

export function isValidStars(value: unknown): value is Stars {
  return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 5;
}

/** Throws on malformed ratings so bad input never reaches persistence. */
export function assertValidRating(rating: Rating): void {
  if (rating.category === "MEDIUM" && !isValidStars(rating.stars)) {
    throw new RangeError("Medium rating requires an integer star value from 1 to 5");
  }
}

/** Priority for building a session queue. Higher = sooner. */
export function priorityScore(
  rating: Rating | null,
  config: SchedulerConfig = DEFAULT_CONFIG,
): number {
  if (rating === null) return config.unratedPriority;
  assertValidRating(rating);
  switch (rating.category) {
    case "HARD":
      return config.hardPriority;
    case "EASY":
      return config.easyPriority;
    case "MEDIUM": {
      const fraction = (rating.stars - 1) / 4;
      return (
        config.mediumMinPriority +
        fraction * (config.mediumMaxPriority - config.mediumMinPriority)
      );
    }
  }
}

/**
 * Orders items by priority (desc). Items with equal priority are shuffled
 * with the supplied RNG so sessions do not repeat a fixed order.
 */
export function buildSessionQueue(
  items: QueueItem[],
  config: SchedulerConfig = DEFAULT_CONFIG,
  rng: Rng = Math.random,
): string[] {
  return items
    .map((item) => ({
      id: item.questionId,
      priority: priorityScore(item.rating, config),
      tiebreak: rng(),
    }))
    .sort((a, b) => b.priority - a.priority || a.tiebreak - b.tiebreak)
    .map((entry) => entry.id);
}

/** How many other cards should appear before this card returns, or null for "not this session". */
export function reinsertionGap(
  rating: Rating,
  config: SchedulerConfig = DEFAULT_CONFIG,
  rng: Rng = Math.random,
): number | null {
  assertValidRating(rating);
  switch (rating.category) {
    case "HARD": {
      const { min, max } = config.hardGap;
      return min + Math.floor(rng() * (max - min + 1));
    }
    case "EASY":
      return config.easyGap;
    case "MEDIUM": {
      const fraction = (rating.stars - 1) / 4;
      return Math.round(
        config.mediumGapOneStar +
          fraction * (config.mediumGapFiveStars - config.mediumGapOneStar),
      );
    }
  }
}

/** Human-readable reason shown to the user ("transparent scheduling"). */
export function explainScheduling(
  rating: Rating,
  config: SchedulerConfig = DEFAULT_CONFIG,
): string {
  switch (rating.category) {
    case "HARD":
      return `Marked Hard: it returns after about ${config.hardGap.min}-${config.hardGap.max} other questions.`;
    case "EASY":
      return config.easyGap === null
        ? "Marked Easy: it will not repeat in this session and ranks last in future sessions."
        : `Marked Easy: it returns after ${config.easyGap} other questions.`;
    case "MEDIUM":
      return `Marked Medium (${rating.stars}/5): ${
        rating.stars >= 4 ? "closer to Hard, so it returns sooner" : rating.stars <= 2 ? "closer to Easy, so it returns later" : "it returns at a moderate interval"
      }.`;
  }
}

const HARDER: Record<Rating["category"], Rating> = {
  HARD: { category: "HARD" },
  MEDIUM: { category: "MEDIUM", stars: 5 },
  EASY: { category: "MEDIUM", stars: 3 },
};

/**
 * After an incorrect checked answer, suggest (never apply) a harder rating.
 * Returns null when the current rating is already Hard or 5-star Medium.
 */
export function suggestRatingAfterIncorrect(current: Rating | null): Rating | null {
  if (current === null) return { category: "HARD" };
  if (current.category === "HARD") return null;
  if (current.category === "MEDIUM") {
    return current.stars === 5 ? { category: "HARD" } : HARDER.MEDIUM;
  }
  return HARDER.EASY;
}
