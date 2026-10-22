import Link from "next/link";
import { DeckBuilder } from "@/components/DeckBuilder";

export default function NewDeckPage() {
  return (
    <>
      <p><Link href="/decks">← All decks</Link></p>
      <h1>Create a deck</h1>
      <p className="muted">Name your deck, add cards, and choose how each one is answered.</p>
      <DeckBuilder />
    </>
  );
}
