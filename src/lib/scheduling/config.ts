export interface SchedulerConfig {
  /** Session-build priorities (0..1, higher = sooner). */
  unratedPriority: number;
  hardPriority: number;
  easyPriority: number;
  /** Medium maps linearly: 1 star -> min (near Easy), 5 stars -> max (near Hard). */
  mediumMinPriority: number;
  mediumMaxPriority: number;
  /** In-session reinsertion: number of other cards shown before the card returns. */
  hardGap: { min: number; max: number };
  mediumGapOneStar: number;
  mediumGapFiveStars: number;
  /** null = Easy cards are not repeated in the same session. */
  easyGap: number | null;
  /** Number of recent actions that can be undone. */
  undoWindow: number;
}

export const DEFAULT_CONFIG: SchedulerConfig = {
  unratedPriority: 0.95,
  hardPriority: 1,
  easyPriority: 0.1,
  mediumMinPriority: 0.3,
  mediumMaxPriority: 0.8,
  hardGap: { min: 3, max: 5 },
  mediumGapOneStar: 15,
  mediumGapFiveStars: 6,
  easyGap: null,
  undoWindow: 10,
};
