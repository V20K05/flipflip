import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { DEMO_DECKS } from "./demo-content";
const SYSTEM_EMAIL = "official@flipflip.local";

/** Idempotently creates the official account and demo decks in Firestore. */
export async function seedDemoData(db: Firestore): Promise<{ createdDecks: number }> {
  const users = await db.collection("users").where("email", "==", SYSTEM_EMAIL).limit(1).get();
  let owner = users.docs[0]?.id;
  if (!owner) {
    owner = randomUUID();
    const b = db.batch();
    b.set(db.collection("users").doc(owner), { displayName: "flipflip Official", email: SYSTEM_EMAIL, authProvider: "system", role: "ADMIN", status: "ACTIVE", createdAt: new Date() });
    b.set(db.collection("userPreferences").doc(owner), { userId: owner, targetExams: [], onboardingCompleted: true });
    await b.commit();
  }
  let createdDecks = 0;
  for (const deck of DEMO_DECKS) {
    const ownedDecks = await db.collection("decks").where("ownerId", "==", owner).get();
    if (ownedDecks.docs.some((d) => d.get("title") === deck.title)) continue;
    const slug = deck.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const subjectQuery = await db.collection("subjects").where("slug", "==", slug).limit(1).get();
    const subjectId = subjectQuery.docs[0]?.id ?? randomUUID();
    const batch = db.batch();
    if (subjectQuery.empty) batch.set(db.collection("subjects").doc(subjectId), { name: deck.subject, slug });
    const deckId = randomUUID();
    batch.set(db.collection("decks").doc(deckId), { ownerId: owner, title: deck.title, description: deck.description, subjectId, visibility: "PUBLIC", publicationStatus: "APPROVED", isOfficial: true, createdAt: new Date(), updatedAt: new Date() });
    deck.questions.forEach((q, position) => {
      const questionId = randomUUID(); const isMc = !!q.options;
      if (isMc && !q.options!.includes(q.answer)) throw new Error(`Seed error: answer not among options for "${q.prompt}"`);
      batch.set(db.collection("questions").doc(questionId), { deckId, prompt: q.prompt, answer: q.answer, explanation: q.explanation ?? null, questionType: isMc ? "MULTIPLE_CHOICE" : "FLASHCARD", position });
      q.options?.forEach((optionText, optionOrder) => batch.set(db.collection("questionOptions").doc(randomUUID()), { questionId, optionText, optionOrder, isCorrect: optionText === q.answer }));
    });
    await batch.commit(); createdDecks++;
  }
  return { createdDecks };
}
