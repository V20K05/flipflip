import Link from "next/link";
import { requireUser } from "@/lib/current-user";
import { getDb } from "@/lib/db";
import { listDecks } from "@/lib/data/decks";
import { getDashboardStats } from "@/lib/data/stats";
import { DeckCard } from "@/components/DeckCard";

export default async function DashboardPage() {
  const user = await requireUser();
  const db = getDb();
  const [stats, decks] = await Promise.all([getDashboardStats(db, user.id), listDecks(db, user.id)]);
  const first = user.displayName.split(" ")[0];
  const nothingYet = stats.totalReviews === 0;

  return (
    <>
      <h1>Hello, {first}</h1>
      <p className="muted">{nothingYet ? "Pick a deck to start your first session." : "Here is how your practice is going."}</p>

      <section className="stats">
        <div className="card stat"><span>Reviewed today</span><strong>{stats.reviewedToday}</strong></div>
        <div className="card stat"><span>Total reviews</span><strong>{stats.totalReviews}</strong></div>
        <div className="card stat"><span>MCQ accuracy</span><strong>{stats.accuracyPercent === null ? "—" : `${stats.accuracyPercent}%`}</strong></div>
      </section>

      <section className="card">
        <h2>Your difficulty breakdown</h2>
        {stats.hard + stats.medium + stats.easy === 0 ? (
          <p className="muted">Nothing rated yet. Rate questions Hard, Medium or Easy while you practise.</p>
        ) : (
          <div className="levels">
            <div className="level hard"><strong>{stats.hard}</strong> Hard</div>
            <div className="level medium"><strong>{stats.medium}</strong> Medium</div>
            <div className="level easy"><strong>{stats.easy}</strong> Easy</div>
          </div>
        )}
      </section>

      <div className="row between"><h2>Decks</h2><Link href="/decks">See all</Link></div>
      <div className="grid">{decks.slice(0, 3).map((d) => <DeckCard key={d.id} deck={d} />)}</div>
      {decks.length === 0 && <p className="muted">No decks yet. Run <code>npm run seed</code> to add the demo decks.</p>}
    </>
  );
}
