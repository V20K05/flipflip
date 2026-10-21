import type { DocumentData, Firestore } from "firebase-admin/firestore";
import type { Rating } from "@/lib/scheduling";
import type { DeckSummary, PracticeData, PracticeQuestion } from "./types";

async function summary(db: Firestore, userId: string, id: string, data: DocumentData): Promise<DeckSummary | null> {
  if (data.deletedAt || !((data.visibility === "PUBLIC" && data.publicationStatus === "APPROVED") || data.ownerId === userId)) return null;
  const [questions, subject] = await Promise.all([
    db.collection("questions").where("deckId", "==", id).get(),
    data.subjectId ? db.collection("subjects").doc(data.subjectId).get() : Promise.resolve(null),
  ]);
  const ratedIds = new Set<string>();
  if (questions.size) {
    const progress = await db.collection("questionProgress").where("userId", "==", userId).get();
    for (const p of progress.docs) if (p.get("difficultyCategory") && questions.docs.some((q) => q.id === p.get("questionId"))) ratedIds.add(p.get("questionId"));
  }
  return { id, title: data.title, description: data.description ?? null, subject: subject?.get("name") ?? null, isOfficial: !!data.isOfficial, total: questions.size, rated: ratedIds.size };
}

export async function listDecks(db: Firestore, userId: string): Promise<DeckSummary[]> {
  const snap = await db.collection("decks").get();
  const rows = (await Promise.all(snap.docs.map((d) => summary(db, userId, d.id, d.data())))).filter((d): d is DeckSummary => !!d);
  return rows.sort((a, b) => Number(b.isOfficial) - Number(a.isOfficial));
}
export async function getDeckSummary(db: Firestore, userId: string, deckId: string) {
  const doc = await db.collection("decks").doc(deckId).get();
  return doc.exists ? summary(db, userId, deckId, doc.data()!) : null;
}
export async function canAccessQuestion(db: Firestore, userId: string, deckId: string, questionId: string) {
  const [deck, question] = await Promise.all([db.collection("decks").doc(deckId).get(), db.collection("questions").doc(questionId).get()]);
  if (!deck.exists || !question.exists || question.get("deckId") !== deckId) return false;
  const d = deck.data()!;
  return !d.deletedAt && ((d.visibility === "PUBLIC" && d.publicationStatus === "APPROVED") || d.ownerId === userId);
}
export function toRating(category: string | null, stars: number | null): Rating | null {
  if (category === "HARD") return { category: "HARD" };
  if (category === "EASY") return { category: "EASY" };
  if (category === "MEDIUM" && stars && stars >= 1 && stars <= 5) return { category: "MEDIUM", stars: stars as 1 | 2 | 3 | 4 | 5 };
  return null;
}
export async function getPracticeData(db: Firestore, userId: string, deckId: string): Promise<PracticeData | null> {
  const deck = await getDeckSummary(db, userId, deckId);
  if (!deck) return null;
  const qSnap = await db.collection("questions").where("deckId", "==", deckId).get();
  const questions: PracticeQuestion[] = await Promise.all(qSnap.docs.map(async (q) => {
    const d = q.data();
    const opts = await db.collection("questionOptions").where("questionId", "==", q.id).get();
    return { id: q.id, prompt: d.prompt, answer: d.answer, explanation: d.explanation ?? null, type: d.questionType, options: opts.docs.sort((a,b) => (a.get("optionOrder") ?? 0) - (b.get("optionOrder") ?? 0)).map((o) => ({ id: o.id, text: o.get("optionText"), isCorrect: !!o.get("isCorrect") })) };
  }));
  questions.sort((a,b) => (qSnap.docs.find((d)=>d.id===a.id)?.get("position") ?? 0) - (qSnap.docs.find((d)=>d.id===b.id)?.get("position") ?? 0));
  const ratings: Record<string, Rating> = {};
  const progress = await db.collection("questionProgress").where("userId", "==", userId).get();
  for (const p of progress.docs) { const r = toRating(p.get("difficultyCategory"), p.get("mediumStarRating")); if (r) ratings[p.get("questionId")] = r; }
  return { deck: { id: deck.id, title: deck.title }, questions, ratings };
}
