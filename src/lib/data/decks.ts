import type { DocumentData, Firestore, QuerySnapshot } from "firebase-admin/firestore";
import type { Rating } from "@/lib/scheduling";
import type { DeckSummary, PracticeData, PracticeQuestion } from "./types";

const chunks = <T,>(items: T[], size: number) => Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));
type ProgressQuery = Promise<QuerySnapshot<DocumentData>>;

function canSeeDeck(data: DocumentData, userId: string) {
  return !data.deletedAt && ((data.visibility === "PUBLIC" && data.publicationStatus === "APPROVED") || data.ownerId === userId);
}

async function getProgressForQuestions(db: Firestore, userId: string, questionIds: string[]) {
  const refs = questionIds.map((questionId) => db.collection("questionProgress").doc(`${userId}_${questionId}`));
  const snapshots = await Promise.all(chunks(refs, 100).map((batch) => db.getAll(...batch)));
  return snapshots.flat();
}

export async function listDecks(db: Firestore, userId: string, progressQuery?: ProgressQuery): Promise<DeckSummary[]> {
  const [ownedDecks, publicDecks, progressSnap] = await Promise.all([
    db.collection("decks").where("ownerId", "==", userId).get(),
    db.collection("decks").where("visibility", "==", "PUBLIC").get(),
    progressQuery ?? db.collection("questionProgress").where("userId", "==", userId).get(),
  ]);
  const visibleById = new Map([...ownedDecks.docs, ...publicDecks.docs].map((deck) => [deck.id, deck]));
  const visible = [...visibleById.values()].filter((deck) => canSeeDeck(deck.data(), userId));
  if (!visible.length) return [];

  const deckIds = visible.map((deck) => deck.id);
  const deckIdSet = new Set(deckIds);
  const subjectIds = [...new Set(visible.map((deck) => deck.get("subjectId")).filter((id): id is string => typeof id === "string" && id.length > 0))];
  const [questionBatches, subjectBatches] = await Promise.all([
    Promise.all(chunks(deckIds, 30).map((ids) => db.collection("questions").where("deckId", "in", ids).get())),
    Promise.all(chunks(subjectIds, 100).map((ids) => db.getAll(...ids.map((id) => db.collection("subjects").doc(id))))),
  ]);

  const questionCountByDeck = new Map<string, number>();
  const deckByQuestion = new Map<string, string>();
  for (const question of questionBatches.flatMap((batch) => batch.docs)) {
    const deckId = question.get("deckId");
    if (typeof deckId !== "string" || !deckIdSet.has(deckId)) continue;
    questionCountByDeck.set(deckId, (questionCountByDeck.get(deckId) ?? 0) + 1);
    deckByQuestion.set(question.id, deckId);
  }

  const subjectNameById = new Map(subjectBatches.flatMap((batch) => batch).filter((subject) => subject.exists).map((subject) => [subject.id, subject.get("name") as string]));
  const ratedCountByDeck = new Map<string, number>();
  for (const progress of progressSnap.docs) {
    if (!progress.get("difficultyCategory")) continue;
    const deckId = progress.get("deckId") ?? deckByQuestion.get(progress.get("questionId"));
    if (typeof deckId === "string" && deckIdSet.has(deckId)) ratedCountByDeck.set(deckId, (ratedCountByDeck.get(deckId) ?? 0) + 1);
  }

  return visible.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      description: data.description ?? null,
      subject: typeof data.subjectId === "string" ? subjectNameById.get(data.subjectId) ?? null : null,
      isOfficial: !!data.isOfficial,
      color: typeof data.color === "string" ? data.color : "blue",
      total: questionCountByDeck.get(doc.id) ?? 0,
      rated: ratedCountByDeck.get(doc.id) ?? 0,
    };
  }).sort((a, b) => Number(b.isOfficial) - Number(a.isOfficial));
}
export async function getDeckSummary(db: Firestore, userId: string, deckId: string) {
  const doc = await db.collection("decks").doc(deckId).get();
  if (!doc.exists || !canSeeDeck(doc.data()!, userId)) return null;
  const data = doc.data()!;
  const [questions, subject] = await Promise.all([
    db.collection("questions").where("deckId", "==", deckId).get(),
    typeof data.subjectId === "string" ? db.collection("subjects").doc(data.subjectId).get() : Promise.resolve(null),
  ]);
  const progress = await getProgressForQuestions(db, userId, questions.docs.map((question) => question.id));
  return {
    id: doc.id,
    title: data.title,
    description: data.description ?? null,
    subject: subject?.get("name") ?? null,
    isOfficial: !!data.isOfficial,
    color: typeof data.color === "string" ? data.color : "blue",
    total: questions.size,
    rated: progress.filter((p) => p.get("difficultyCategory")).length,
  } satisfies DeckSummary;
}
export async function getDeckEditorData(db: Firestore, userId: string, deckId: string) {
  const deck = await db.collection("decks").doc(deckId).get();
  if (!deck.exists || deck.get("ownerId") !== userId || deck.get("isOfficial")) return null;
  const questions = await db.collection("questions").where("deckId", "==", deckId).get();
  const mcqIds = questions.docs.filter((q) => q.get("questionType") === "MULTIPLE_CHOICE").map((q) => q.id);
  const optionBatches = await Promise.all(chunks(mcqIds, 30).map((ids) => db.collection("questionOptions").where("questionId", "in", ids).get()));
  const options = new Map<string, Array<{ text: string; isCorrect: boolean; order: number }>>();
  for (const option of optionBatches.flatMap((batch) => batch.docs)) {
    const questionId = option.get("questionId");
    const list = options.get(questionId) ?? [];
    list.push({ text: option.get("optionText"), isCorrect: !!option.get("isCorrect"), order: option.get("optionOrder") ?? 0 });
    options.set(questionId, list);
  }
  return {
    title: deck.get("title") as string,
    description: (deck.get("description") ?? "") as string,
    color: typeof deck.get("color") === "string" ? deck.get("color") as string : "blue",
    cards: questions.docs.sort((a, b) => (a.get("position") ?? 0) - (b.get("position") ?? 0)).map((q) => {
      const qOptions = (options.get(q.id) ?? []).sort((a, b) => a.order - b.order);
      return { id: q.id, prompt: q.get("prompt") as string, answer: q.get("answer") as string, explanation: (q.get("explanation") ?? "") as string, type: q.get("questionType") as "FLASHCARD" | "MULTIPLE_CHOICE", options: qOptions.map((o) => o.text), correctIndex: qOptions.findIndex((o) => o.isCorrect) };
    }),
  };
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
  const deckDoc = await db.collection("decks").doc(deckId).get();
  if (!deckDoc.exists || !canSeeDeck(deckDoc.data()!, userId)) return null;
  const qSnap = await db.collection("questions").where("deckId", "==", deckId).get();
  const questionIds = qSnap.docs.map((question) => question.id);
  const multipleChoiceIds = qSnap.docs.filter((question) => question.get("questionType") === "MULTIPLE_CHOICE").map((question) => question.id);
  const [optionBatches, progress] = await Promise.all([
    Promise.all(chunks(multipleChoiceIds, 30).map((ids) => db.collection("questionOptions").where("questionId", "in", ids).get())),
    getProgressForQuestions(db, userId, questionIds),
  ]);
  const optionsByQuestion = new Map<string, Array<{ id: string; text: string; isCorrect: boolean; optionOrder: number }>>();
  for (const option of optionBatches.flatMap((batch) => batch.docs)) {
    const questionId = option.get("questionId");
    const options = optionsByQuestion.get(questionId) ?? [];
    options.push({ id: option.id, text: option.get("optionText"), isCorrect: !!option.get("isCorrect"), optionOrder: option.get("optionOrder") ?? 0 });
    optionsByQuestion.set(questionId, options);
  }
  const questions: PracticeQuestion[] = qSnap.docs
    .sort((a, b) => (a.get("position") ?? 0) - (b.get("position") ?? 0))
    .map((q) => {
      const d = q.data();
      return {
        id: q.id,
        prompt: d.prompt,
        answer: d.answer,
        explanation: d.explanation ?? null,
        type: d.questionType,
        options: (optionsByQuestion.get(q.id) ?? []).sort((a, b) => a.optionOrder - b.optionOrder).map(({ id, text, isCorrect }) => ({ id, text, isCorrect })),
      };
    });
  const ratings: Record<string, Rating> = {};
  for (const p of progress) { const r = toRating(p.get("difficultyCategory"), p.get("mediumStarRating")); if (r) ratings[p.get("questionId")] = r; }
  return { deck: { id: deckDoc.id, title: deckDoc.get("title") }, questions, ratings };
}
