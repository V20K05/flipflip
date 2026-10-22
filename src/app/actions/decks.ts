"use server";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { getDb } from "@/lib/db";

export interface DeckFormState { error?: string }

const MAX_CARDS = 50;
const MAX_OPTIONS = 6;

export async function createDeck(_: DeckFormState, form: FormData): Promise<DeckFormState> {
  const user = await requireUser();

  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const cardCount = Number(form.get("cardCount"));
  if (title.length < 1 || title.length > 120) return { error: "Give your deck a name of up to 120 characters." };
  if (description.length > 500) return { error: "Keep the description under 500 characters." };
  if (!Number.isInteger(cardCount) || cardCount < 1 || cardCount > MAX_CARDS) return { error: `Add between 1 and ${MAX_CARDS} cards.` };

  const cards: Array<{ prompt: string; answer: string; explanation: string | null; type: "FLASHCARD" | "MULTIPLE_CHOICE"; options: string[]; correctIndex: number }> = [];
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
      cards.push({ prompt, answer: options[correctIndex]!, explanation: explanation || null, type, options, correctIndex });
    } else if (type === "FLASHCARD") {
      const answer = String(form.get(`answer_${i}`) ?? "").trim();
      if (!answer || answer.length > 2000) return { error: `Card ${i + 1}: add an answer of up to 2,000 characters.` };
      cards.push({ prompt, answer, explanation: explanation || null, type, options: [], correctIndex: -1 });
    } else {
      return { error: `Card ${i + 1}: choose an answer card or multiple choice.` };
    }
  }

  const db = getDb();
  const deckId = randomUUID();
  const batch = db.batch();
  batch.set(db.collection("decks").doc(deckId), {
    ownerId: user.id,
    title,
    description: description || null,
    visibility: "PRIVATE",
    publicationStatus: "DRAFT",
    isOfficial: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  cards.forEach((card, position) => {
    const questionId = randomUUID();
    batch.set(db.collection("questions").doc(questionId), {
      deckId,
      prompt: card.prompt,
      answer: card.answer,
      explanation: card.explanation,
      questionType: card.type,
      position,
    });
    card.options.forEach((optionText, optionOrder) => {
      batch.set(db.collection("questionOptions").doc(randomUUID()), {
        questionId,
        optionText,
        optionOrder,
        isCorrect: optionOrder === card.correctIndex,
      });
    });
  });
  await batch.commit();
  redirect(`/decks/${deckId}`);
}
