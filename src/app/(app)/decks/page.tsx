import { requireUser } from "@/lib/current-user";
import { getDb } from "@/lib/db";
import { listDecks } from "@/lib/data/decks";
import { DeckCard } from "@/components/DeckCard";
import Link from "next/link";

export default async function DecksPage() {
  const user = await requireUser();
  const decks = await listDecks(getDb(), user.id);
  return (
    <>
      <div className="row between page-heading">
        <div><h1>Decks</h1><p className="muted">Your private decks and decks you can study.</p></div>
        <Link className="btn primary" href="/decks/new">+ Create deck</Link>
      </div>
      <div className="grid">{decks.map((d) => <DeckCard key={d.id} deck={d} />)}</div>
      {decks.length === 0 && <div className="card"><p className="muted">No decks yet. Create a deck and add your first cards.</p><Link className="btn primary" href="/decks/new">Create your first deck</Link></div>}
    </>
  );
}
