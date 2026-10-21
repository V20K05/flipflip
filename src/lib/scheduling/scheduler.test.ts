import { describe, expect, it } from "vitest";
import {
  buildSessionQueue, canUndo, createSession, explainScheduling, isSessionComplete,
  priorityScore, rateCurrent, reinsertionGap, suggestRatingAfterIncorrect, undoLast,
  DEFAULT_CONFIG, type Rating,
} from "./index";

const hard: Rating = { category: "HARD" };
const easy: Rating = { category: "EASY" };
const med = (stars: 1 | 2 | 3 | 4 | 5): Rating => ({ category: "MEDIUM", stars });
const ids = (n: number) => Array.from({ length: n }, (_, i) => `q${i + 1}`);
const fixedRng = () => 0;

describe("priorityScore", () => {
  it("orders Hard > Medium(5) > ... > Medium(1) > Easy", () => {
    const scores = [hard, med(5), med(4), med(3), med(2), med(1), easy].map((r) => priorityScore(r));
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(new Set(scores).size).toBe(scores.length);
  });
  it("puts unrated questions just below Hard so new content is seen", () => {
    expect(priorityScore(null)).toBeLessThan(priorityScore(hard));
    expect(priorityScore(null)).toBeGreaterThan(priorityScore(med(5)));
  });
  it("rejects invalid stars", () => {
    expect(() => priorityScore({ category: "MEDIUM", stars: 6 as never })).toThrow(RangeError);
    expect(() => priorityScore({ category: "MEDIUM", stars: 2.5 as never })).toThrow(RangeError);
  });
});

describe("buildSessionQueue", () => {
  it("places Hard first and Easy last", () => {
    const queue = buildSessionQueue(
      [
        { questionId: "e", rating: easy },
        { questionId: "m", rating: med(3) },
        { questionId: "h", rating: hard },
      ],
      DEFAULT_CONFIG,
      fixedRng,
    );
    expect(queue).toEqual(["h", "m", "e"]);
  });
});

describe("reinsertionGap", () => {
  it("Hard returns sooner than any Medium, Medium sooner as stars rise, Easy never by default", () => {
    const hardGap = reinsertionGap(hard, DEFAULT_CONFIG, () => 0.999)!;
    expect(hardGap).toBeLessThanOrEqual(DEFAULT_CONFIG.hardGap.max);
    const gaps = [5, 4, 3, 2, 1].map((s) => reinsertionGap(med(s as 1 | 2 | 3 | 4 | 5))!);
    expect([...gaps].sort((a, b) => a - b)).toEqual(gaps);
    expect(hardGap).toBeLessThan(gaps[0]!);
    expect(reinsertionGap(easy)).toBeNull();
  });
});

describe("session flow", () => {
  it("reinserts a Hard card after a few other cards, never immediately", () => {
    let s = createSession(ids(10));
    s = rateCurrent(s, hard, DEFAULT_CONFIG, fixedRng);
    expect(s.queue[0]).toBe("q2");
    expect(s.queue.indexOf("q1")).toBe(DEFAULT_CONFIG.hardGap.min);
  });
  it("does not repeat an Easy card in the same session", () => {
    const s = rateCurrent(createSession(ids(5)), easy);
    expect(s.queue).not.toContain("q1");
  });
  it("ends the session instead of repeating when the last card is rated Hard", () => {
    const s = rateCurrent(createSession(["only"]), hard);
    expect(isSessionComplete(s)).toBe(true);
  });
  it("places the card at the end when fewer cards remain than the gap", () => {
    const s = rateCurrent(createSession(ids(3)), hard, DEFAULT_CONFIG, fixedRng);
    expect(s.queue).toEqual(["q2", "q3", "q1"]);
  });
  it("same logic regardless of input method (pure function of rating)", () => {
    const a = rateCurrent(createSession(ids(8)), med(4), DEFAULT_CONFIG, fixedRng);
    const b = rateCurrent(createSession(ids(8)), med(4), DEFAULT_CONFIG, fixedRng);
    expect(a).toEqual(b);
  });
});

describe("undo", () => {
  it("restores queue, rating and counters", () => {
    const start = createSession(ids(6), { q1: easy });
    const rated = rateCurrent(start, hard, DEFAULT_CONFIG, fixedRng);
    expect(rated.ratings["q1"]).toEqual(hard);
    const undone = undoLast(rated);
    expect(undone).toEqual(start);
  });
  it("removes the rating when the question was previously unrated", () => {
    const undone = undoLast(rateCurrent(createSession(ids(3)), easy));
    expect(undone.ratings["q1"]).toBeUndefined();
  });
  it("keeps only the last 10 actions", () => {
    let s = createSession(ids(30));
    for (let i = 0; i < 15; i++) s = rateCurrent(s, easy);
    expect(s.history).toHaveLength(10);
    for (let i = 0; i < 10; i++) s = undoLast(s);
    expect(canUndo(s)).toBe(false);
  });
  it("lets a user change a rating by undoing then rating again", () => {
    let s = rateCurrent(createSession(ids(10)), easy, DEFAULT_CONFIG, fixedRng);
    s = rateCurrent(undoLast(s), hard, DEFAULT_CONFIG, fixedRng);
    expect(s.ratings["q1"]).toEqual(hard);
    expect(s.queue).toContain("q1");
  });
});

describe("suggestions and explanations", () => {
  it("suggests, but never forces, a harder rating after a wrong answer", () => {
    expect(suggestRatingAfterIncorrect(easy)).toEqual(med(3));
    expect(suggestRatingAfterIncorrect(med(2))).toEqual(med(5));
    expect(suggestRatingAfterIncorrect(med(5))).toEqual(hard);
    expect(suggestRatingAfterIncorrect(hard)).toBeNull();
  });
  it("explains why a card returns", () => {
    expect(explainScheduling(hard)).toMatch(/Hard/);
    expect(explainScheduling(med(5))).toMatch(/sooner/);
  });
});
