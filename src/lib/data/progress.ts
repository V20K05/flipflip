import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { assertValidRating, type Rating } from "@/lib/scheduling";

export interface RatingInput { userId: string; deckId: string; questionId: string; rating: Rating; previous: Rating | null; answerCorrect: boolean | null; selectedOptionId: string | null; responseTimeMs: number | null }
const parts = (r: Rating | null) => ({ category: r?.category ?? null, stars: r?.category === "MEDIUM" ? r.stars : null });
export async function recordRating(db: Firestore, i: RatingInput) {
  assertValidRating(i.rating);
  const key = `${i.userId}_${i.questionId}`;
  const ref = db.collection("questionProgress").doc(key);
  const eventRef = db.collection("reviewEvents").doc(randomUUID());
  const ms = i.responseTimeMs === null ? null : Math.max(0, Math.round(i.responseTimeMs));
  await db.runTransaction(async (tx) => {
    const old = await tx.get(ref); const d = old.data() ?? {};
    tx.set(ref, { userId: i.userId, questionId: i.questionId, difficultyCategory: i.rating.category, mediumStarRating: parts(i.rating).stars,
      timesSeen: (d.timesSeen ?? 0) + 1, timesCorrect: (d.timesCorrect ?? 0) + Number(i.answerCorrect === true), timesIncorrect: (d.timesIncorrect ?? 0) + Number(i.answerCorrect === false),
      lastAnsweredAt: new Date(), lastResponseTimeMs: ms, updatedAt: new Date() });
    tx.create(eventRef, { userId: i.userId, questionId: i.questionId, deckId: i.deckId, selectedOptionId: i.selectedOptionId, answerCorrect: i.answerCorrect, responseTimeMs: ms,
      ratingBefore: i.previous, ratingAfter: i.rating, eventType: "RATED", reviewedAt: new Date() });
  });
}
export interface UndoInput { userId: string; deckId: string; questionId: string; previous: Rating | null; undone: Rating; answerCorrect: boolean | null }
export async function recordUndo(db: Firestore, i: UndoInput) {
  const ref = db.collection("questionProgress").doc(`${i.userId}_${i.questionId}`);
  const eventRef = db.collection("reviewEvents").doc(randomUUID());
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref); const d = snap.data();
    if (d) tx.set(ref, { ...d, difficultyCategory: parts(i.previous).category, mediumStarRating: parts(i.previous).stars,
      timesSeen: Math.max(0, (d.timesSeen ?? 0) - 1), timesCorrect: Math.max(0, (d.timesCorrect ?? 0) - Number(i.answerCorrect === true)),
      timesIncorrect: Math.max(0, (d.timesIncorrect ?? 0) - Number(i.answerCorrect === false)), updatedAt: new Date() });
    tx.create(eventRef, { userId: i.userId, questionId: i.questionId, deckId: i.deckId, ratingBefore: i.undone, ratingAfter: i.previous, eventType: "UNDONE", reviewedAt: new Date() });
  });
}
