import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { getDb } from "@/lib/db";
import { getDeckSummary } from "@/lib/data/decks";

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const deck = await getDeckSummary(getDb(), user.id, id);
  if (!deck) notFound();
  return (
    <>
      <p><Link href="/decks">← All decks</Link></p>
      <h1>{deck.title}</h1>
      <p className="muted">{deck.description}</p>
      <div className="card">
        <p><strong>{deck.total}</strong> questions · <strong>{deck.rated}</strong> rated by you</p>
        <p className="muted small">Hard questions come back after a few cards, Medium ones return based on their stars, and Easy ones step aside.</p>
        {deck.total > 0 ? (
          <Link className="btn primary" href={`/practice/${deck.id}`}>{deck.rated > 0 ? "Continue practising" : "Start practising"}</Link>
        ) : (
          <p className="muted">This deck has no questions yet.</p>
        )}
      </div>
    </>
  );
}
