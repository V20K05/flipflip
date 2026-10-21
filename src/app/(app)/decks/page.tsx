import { requireUser } from "@/lib/current-user";
import { getDb } from "@/lib/db";
import { listDecks } from "@/lib/data/decks";
import { DeckCard } from "@/components/DeckCard";

export default async function DecksPage() {
  const user = await requireUser();
  const decks = await listDecks(getDb(), user.id);
  return (
    <>
      <h1>Decks</h1>
      <div className="grid">{decks.map((d) => <DeckCard key={d.id} deck={d} />)}</div>
      {decks.length === 0 && <p className="muted">No decks yet. Run <code>npm run seed</code> to add the demo decks.</p>}
    </>
  );
}
