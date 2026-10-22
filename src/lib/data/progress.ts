import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { assertValidRating, type Rating } from "@/lib/scheduling";

export interface RatingInput { userId: string; deckId: string; questionId: string; rating: Rating; previous: Rating | null; answerCorrect: boolean | null; selectedOptionId: string | null; responseTimeMs: number | null }
const parts = (r: Rating | null) => ({ category: r?.category ?? null, stars: r?.category === "MEDIUM" ? r.stars : null });
const istDate = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
export async function recordRating(db: Firestore, i: RatingInput) {
  assertValidRating(i.rating);
  const key = `${i.userId}_${i.questionId}`;
  const ref = db.collection("questionProgress").doc(key);
  const eventRef = db.collection("reviewEvents").doc(randomUUID());
  const now = new Date();
  const today = istDate(now);
  const ms = i.responseTimeMs === null ? null : Math.max(0, Math.round(i.responseTimeMs));
  await db.runTransaction(async (tx) => {
    const old = await tx.get(ref); const d = old.data() ?? {};
    const previousDay = d.lastAnsweredDay ?? (d.lastAnsweredAt?.toDate ? istDate(d.lastAnsweredAt.toDate()) : null);
    const previousTodayCount = previousDay === today ? Number(d.timesSeenToday ?? 1) : 0;
    tx.set(ref, { userId: i.userId, deckId: i.deckId, questionId: i.questionId, difficultyCategory: i.rating.category, mediumStarRating: parts(i.rating).stars,
      timesSeen: (d.timesSeen ?? 0) + 1, timesCorrect: (d.timesCorrect ?? 0) + Number(i.answerCorrect === true), timesIncorrect: (d.timesIncorrect ?? 0) + Number(i.answerCorrect === false),
      timesSeenToday: previousTodayCount + 1, lastAnsweredDay: today,
      lastAnsweredAt: now, lastResponseTimeMs: ms, updatedAt: now });
    tx.create(eventRef, { userId: i.userId, questionId: i.questionId, deckId: i.deckId, selectedOptionId: i.selectedOptionId, answerCorrect: i.answerCorrect, responseTimeMs: ms,
      ratingBefore: i.previous, ratingAfter: i.rating, eventType: "RATED", reviewedAt: now });
  });
}
export interface UndoInput { userId: string; deckId: string; questionId: string; previous: Rating | null; undone: Rating; answerCorrect: boolean | null }
export async function recordUndo(db: Firestore, i: UndoInput) {
  const ref = db.collection("questionProgress").doc(`${i.userId}_${i.questionId}`);
  const eventRef = db.collection("reviewEvents").doc(randomUUID());
  const now = new Date();
  const today = istDate(now);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref); const d = snap.data();
    const timesSeenToday = d?.lastAnsweredDay === today ? Math.max(0, Number(d.timesSeenToday ?? 1) - 1) : Number(d?.timesSeenToday ?? 0);
    if (d) tx.set(ref, { ...d, difficultyCategory: parts(i.previous).category, mediumStarRating: parts(i.previous).stars,
      timesSeen: Math.max(0, (d.timesSeen ?? 0) - 1), timesCorrect: Math.max(0, (d.timesCorrect ?? 0) - Number(i.answerCorrect === true)),
      timesIncorrect: Math.max(0, (d.timesIncorrect ?? 0) - Number(i.answerCorrect === false)), timesSeenToday, updatedAt: now });
    tx.create(eventRef, { userId: i.userId, questionId: i.questionId, deckId: i.deckId, ratingBefore: i.undone, ratingAfter: i.previous, eventType: "UNDONE", reviewedAt: now });
  });
}
