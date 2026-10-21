"use server";
import { getDb } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { canAccessQuestion } from "@/lib/data/decks";
import { recordRating as saveRating, recordUndo as saveUndo } from "@/lib/data/progress";
import { assertValidRating, type Rating } from "@/lib/scheduling";

type Result = { ok: true } | { ok: false; error: string };

export async function recordRating(input: {
  deckId: string;
  questionId: string;
  rating: Rating;
  previous: Rating | null;
  answerCorrect: boolean | null;
  selectedOptionId: string | null;
  responseTimeMs: number | null;
}): Promise<Result> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Not signed in" };
  try {
    assertValidRating(input.rating);
    const db = getDb();
    if (!(await canAccessQuestion(db, userId, input.deckId, input.questionId))) {
      return { ok: false, error: "Question not available" };
    }
    await saveRating(db, { ...input, userId });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save" };
  }
}

export async function recordUndo(input: {
  deckId: string;
  questionId: string;
  previous: Rating | null;
  undone: Rating;
  answerCorrect: boolean | null;
}): Promise<Result> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Not signed in" };
  try {
    const db = getDb();
    if (!(await canAccessQuestion(db, userId, input.deckId, input.questionId))) {
      return { ok: false, error: "Question not available" };
    }
    await saveUndo(db, { ...input, userId });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save" };
  }
}
