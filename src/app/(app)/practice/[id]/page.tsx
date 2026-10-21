import { notFound } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { getDb } from "@/lib/db";
import { getPracticeData } from "@/lib/data/decks";
import { buildSessionQueue } from "@/lib/scheduling";
import { Practice } from "@/components/Practice";

export default async function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const data = await getPracticeData(getDb(), user.id, id);
  if (!data || data.questions.length === 0) notFound();

  // Built on the server so the order is random per visit but identical during hydration.
  const queue = buildSessionQueue(data.questions.map((q) => ({ questionId: q.id, rating: data.ratings[q.id] ?? null })));
  return <Practice deckId={data.deck.id} deckTitle={data.deck.title} questions={data.questions} ratings={data.ratings} initialQueue={queue} />;
}
