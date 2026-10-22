import Link from "next/link";
import { notFound } from "next/navigation";
import { DeckBuilder } from "@/components/DeckBuilder";
import { requireUser } from "@/lib/current-user";
import { getDb } from "@/lib/db";
import { getDeckEditorData } from "@/lib/data/decks";

export default async function EditDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const deck = await getDeckEditorData(getDb(), user.id, id);
  if (!deck) notFound();
  return <>
    <p><Link href={`/decks/${id}`}>← Back to deck</Link></p>
    <h1>Edit deck</h1>
    <p className="muted">Update your cards, change their order, or pick a folder color.</p>
    <DeckBuilder initial={{ id, ...deck }} />
  </>;
}
