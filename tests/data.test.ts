import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db";
import { createUser, findUserByEmail, getUserProfile, saveOnboarding } from "@/lib/data/users";
import { canAccessQuestion, getPracticeData, listDecks } from "@/lib/data/decks";
import { recordRating, recordUndo } from "@/lib/data/progress";
import { getDashboardStats } from "@/lib/data/stats";
import { seedDemoData } from "@/lib/seed/seed";
import { DEMO_DECKS } from "@/lib/seed/demo-content";

let pg: PGlite;
let db: Db;
let userId: string;
let otherId: string;
let deckId: string;
let questions: { id: string; type: string }[];

beforeAll(async () => {
  pg = new PGlite();
  await pg.exec(readFileSync("tests/schema.sql", "utf8"));
  db = {
    async query<T>(text: string, params: unknown[] = []) {
      return (await pg.query(text, params)).rows as T[];
    },
    async transaction(statements) {
      await pg.transaction(async (tx) => {
        for (const s of statements) await tx.query(s.text, s.params ?? []);
      });
    },
  };
  userId = await createUser(db, { displayName: "Vijay", email: "vijay@example.com", passwordHash: "x" });
  otherId = await createUser(db, { displayName: "Other", email: "other@example.com", passwordHash: "x" });
});

describe("users", () => {
  it("creates and finds users, and tracks onboarding", async () => {
    expect((await findUserByEmail(db, "vijay@example.com"))?.id).toBe(userId);
    expect(await findUserByEmail(db, "nobody@example.com")).toBeNull();
    expect((await getUserProfile(db, userId))?.onboardingCompleted).toBe(false);
    await saveOnboarding(db, userId, { targetExams: ["TNPSC", "UPSC"], dailyGoalType: "questions", dailyGoalValue: 20 });
    expect((await getUserProfile(db, userId))?.onboardingCompleted).toBe(true);
  });
  it("rejects duplicate emails at the database level", async () => {
    await expect(createUser(db, { displayName: "Dup", email: "vijay@example.com", passwordHash: "x" })).rejects.toThrow();
  });
});

describe("seed and decks", () => {
  it("seeds demo decks idempotently", async () => {
    expect((await seedDemoData(db)).createdDecks).toBe(DEMO_DECKS.length);
    expect((await seedDemoData(db)).createdDecks).toBe(0);
    const decks = await listDecks(db, userId);
    expect(decks).toHaveLength(DEMO_DECKS.length);
    expect(decks.every((d) => d.total > 0 && d.rated === 0)).toBe(true);
    deckId = decks[0]!.id;
  });
  it("returns practice data with options and correct flags", async () => {
    const data = await getPracticeData(db, userId, deckId);
    expect(data).not.toBeNull();
    questions = data!.questions.map((q) => ({ id: q.id, type: q.type }));
    const mc = data!.questions.find((q) => q.type === "MULTIPLE_CHOICE")!;
    expect(mc.options).toHaveLength(4);
    expect(mc.options.filter((o) => o.isCorrect)).toHaveLength(1);
    expect(data!.questions.some((q) => q.type === "FLASHCARD" && q.options.length === 0)).toBe(true);
  });
  it("hides private decks from other users", async () => {
    const id = "private-deck";
    await db.query(`INSERT INTO "Deck" ("id","ownerId","title","updatedAt") VALUES ($1,$2,'Secret',now())`, [id, otherId]);
    expect((await listDecks(db, userId)).some((d) => d.title === "Secret")).toBe(false);
    expect((await listDecks(db, otherId)).some((d) => d.title === "Secret")).toBe(true);
    expect(await getPracticeData(db, userId, id)).toBeNull();
  });
  it("checks question access", async () => {
    expect(await canAccessQuestion(db, userId, deckId, questions[0]!.id)).toBe(true);
    expect(await canAccessQuestion(db, userId, "private-deck", questions[0]!.id)).toBe(false);
  });
});

describe("progress", () => {
  it("records ratings, updates on re-rate, and reflects in decks and stats", async () => {
    const q = questions[0]!.id;
    const base = { userId, deckId, questionId: q, selectedOptionId: null, responseTimeMs: 1500 };
    await recordRating(db, { ...base, rating: { category: "HARD" }, previous: null, answerCorrect: false });
    await recordRating(db, { ...base, rating: { category: "MEDIUM", stars: 4 }, previous: { category: "HARD" }, answerCorrect: true });

    const data = await getPracticeData(db, userId, deckId);
    expect(data!.ratings[q]).toEqual({ category: "MEDIUM", stars: 4 });
    expect((await listDecks(db, userId)).find((d) => d.id === deckId)!.rated).toBe(1);

    const stats = await getDashboardStats(db, userId);
    expect(stats).toMatchObject({ totalReviews: 2, reviewedToday: 2, accuracyPercent: 50, medium: 1, hard: 0, easy: 0 });
  });
  it("rejects invalid stars at the database level", async () => {
    await expect(
      db.query(
        `INSERT INTO "QuestionProgress" ("id","userId","questionId","difficultyCategory","mediumStarRating","updatedAt")
         VALUES ('bad',$1,$2,'MEDIUM',9,now())`,
        [userId, questions[1]!.id],
      ),
    ).rejects.toThrow();
  });
  it("undo restores previous rating and counters, and logs an UNDONE event", async () => {
    const q = questions[0]!.id;
    await recordUndo(db, {
      userId, deckId, questionId: q,
      previous: { category: "HARD" }, undone: { category: "MEDIUM", stars: 4 }, answerCorrect: true,
    });
    const data = await getPracticeData(db, userId, deckId);
    expect(data!.ratings[q]).toEqual({ category: "HARD" });
    const [row] = await db.query<{ seen: number; correct: number }>(
      `SELECT "timesSeen" AS seen, "timesCorrect" AS correct FROM "QuestionProgress" WHERE "userId"=$1 AND "questionId"=$2`, [userId, q]);
    expect(row).toEqual({ seen: 1, correct: 0 });
    const [ev] = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM "ReviewEvent" WHERE "eventType"='UNDONE'`);
    expect(ev!.n).toBe(1);
  });
  it("undo of a first-ever rating clears it (stays valid under the CHECK constraint)", async () => {
    const q = questions[2]!.id;
    const base = { userId, deckId, questionId: q, selectedOptionId: null, responseTimeMs: 900 };
    await recordRating(db, { ...base, rating: { category: "EASY" }, previous: null, answerCorrect: true });
    await recordUndo(db, { userId, deckId, questionId: q, previous: null, undone: { category: "EASY" }, answerCorrect: true });
    expect((await getPracticeData(db, userId, deckId))!.ratings[q]).toBeUndefined();
  });
});
