import Link from "next/link";
import type { DeckSummary } from "@/lib/data/types";

export function DeckCard({ deck }: { deck: DeckSummary }) {
  const pct = deck.total > 0 ? Math.round((deck.rated / deck.total) * 100) : 0;
  return (
    <Link href={`/decks/${deck.id}`} className="card deck-card">
      <div className="row between">
        <span className="tag">{deck.subject ?? "General"}</span>
        {deck.isOfficial && <span className="tag official">Official</span>}
      </div>
      <h3>{deck.title}</h3>
      {deck.description && <p className="muted small">{deck.description}</p>}
      <div className="progress" aria-hidden><div style={{ width: `${pct}%` }} /></div>
      <p className="small muted">{deck.rated} of {deck.total} questions rated</p>
    </Link>
  );
}
