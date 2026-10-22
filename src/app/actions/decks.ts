"use server";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { getDb } from "@/lib/db";

export interface DeckFormState { error?: string }

const MAX_CARDS = 50;
const MAX_OPTIONS = 6;

export async function saveDeck(_: DeckFormState, form: FormData): Promise<DeckFormState> {
  const user = await requireUser();

  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const deckId = String(form.get("deckId") ?? "").trim();
  const color = String(form.get("color") ?? "blue");
  const allowedColors = ["blue", "red", "orange", "yellow", "green", "purple", "pink"];
  if (!allowedColors.includes(color)) return { error: "Choose a folder color from the list." };
  const cardCount = Number(form.get("cardCount"));
  if (title.length < 1 || title.length > 120) return { error: "Give your deck a name of up to 120 characters." };
  if (description.length > 500) return { error: "Keep the description under 500 characters." };
  if (!Number.isInteger(cardCount) || cardCount < 1 || cardCount > MAX_CARDS) return { error: `Add between 1 and ${MAX_CARDS} cards.` };

  const cards: Array<{ id: string; prompt: string; answer: string; explanation: string | null; type: "FLASHCARD" | "MULTIPLE_CHOICE"; options: string[]; correctIndex: number }> = [];
  for (let i = 0; i < cardCount; i++) {
    const prompt = String(form.get(`prompt_${i}`) ?? "").trim();
    const type = String(form.get(`type_${i}`) ?? "FLASHCARD");
    const explanation = String(form.get(`explanation_${i}`) ?? "").trim();
    if (!prompt || prompt.length > 1000) return { error: `Card ${i + 1}: add a prompt of up to 1,000 characters.` };
    if (explanation.length > 2000) return { error: `Card ${i + 1}: keep the explanation under 2,000 characters.` };

    if (type === "MULTIPLE_CHOICE") {
      const optionCount = Number(form.get(`optionCount_${i}`));
      if (!Number.isInteger(optionCount) || optionCount < 2 || optionCount > MAX_OPTIONS) return { error: `Card ${i + 1}: add between 2 and ${MAX_OPTIONS} choices.` };
      const options = Array.from({ length: optionCount }, (_, j) => String(form.get(`option_${i}_${j}`) ?? "").trim());
      if (options.some((option) => !option || option.length > 500)) return { error: `Card ${i + 1}: fill in every choice (up to 500 characters each).` };
      if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) return { error: `Card ${i + 1}: each choice must be different.` };
      const rawCorrectIndex = form.get(`correct_${i}`);
      const correctIndex = typeof rawCorrectIndex === "string" && rawCorrectIndex.trim() ? Number(rawCorrectIndex) : Number.NaN;
      if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) return { error: `Card ${i + 1}: select the correct choice.` };
      cards.push({ id: String(form.get(`cardId_${i}`) ?? ""), prompt, answer: options[correctIndex]!, explanation: explanation || null, type, options, correctIndex });
    } else if (type === "FLASHCARD") {
      const answer = String(form.get(`answer_${i}`) ?? "").trim();
      if (!answer || answer.length > 2000) return { error: `Card ${i + 1}: add an answer of up to 2,000 characters.` };
      cards.push({ id: String(form.get(`cardId_${i}`) ?? ""), prompt, answer, explanation: explanation || null, type, options: [], correctIndex: -1 });
    } else {
      return { error: `Card ${i + 1}: choose an answer card or multiple choice.` };
    }
  }

  const db = getDb();
  const targetId = deckId || randomUUID();
  const deckRef = db.collection("decks").doc(targetId);
  const existingDeck = deckId ? await deckRef.get() : null;
  if (deckId && (!existingDeck?.exists || existingDeck.get("ownerId") !== user.id || existingDeck.get("isOfficial"))) {
    return { error: "You can only edit decks you created." };
  }
  const oldQuestions = deckId ? await db.collection("questions").where("deckId", "==", deckId).get() : null;
  const existingIds = new Set(oldQuestions?.docs.map((question) => question.id) ?? []);
  if (cards.some((card) => card.id && !existingIds.has(card.id))) return { error: "A card no longer belongs to this deck. Refresh and try again." };
  const writer = db.bulkWriter();
  writer.set(deckRef, {
    ...(existingDeck?.data() ?? { ownerId: user.id, visibility: "PRIVATE", publicationStatus: "DRAFT", isOfficial: false, createdAt: new Date() }),
    title,
    description: description || null,
    color,
    updatedAt: new Date(),
  });
  cards.forEach((card, position) => {
    const questionId = card.id || randomUUID();
    writer.set(db.collection("questions").doc(questionId), {
      deckId,
      prompt: card.prompt,
      answer: card.answer,
      explanation: card.explanation,
      questionType: card.type,
      position,
    });
    card.options.forEach((optionText, optionOrder) => {
      writer.set(db.collection("questionOptions").doc(randomUUID()), {
        questionId,
        optionText,
        optionOrder,
        isCorrect: optionOrder === card.correctIndex,
      });
    });
  });
  if (oldQuestions) {
    const retained = new Set(cards.map((card) => card.id).filter(Boolean));
    const removed = oldQuestions.docs.filter((question) => !retained.has(question.id));
    const removedOptionBatches = await Promise.all(removed.map((question) => db.collection("questionOptions").where("questionId", "==", question.id).get()));
    for (const question of removed) writer.delete(question.ref);
    for (const options of removedOptionBatches) for (const option of options.docs) writer.delete(option.ref);
    const editedQuestionIds = cards.filter((card) => card.id).map((card) => card.id);
    const oldOptionBatches = await Promise.all(editedQuestionIds.map((id) => db.collection("questionOptions").where("questionId", "==", id).get()));
    for (const options of oldOptionBatches) for (const option of options.docs) writer.delete(option.ref);
  }
  await writer.close();
  redirect(`/decks/${targetId}`);
}

export async function createDeck(_: DeckFormState, form: FormData) { return saveDeck(_, form); }
