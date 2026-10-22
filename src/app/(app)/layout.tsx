import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { requireUser } from "@/lib/current-user";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">flip<span>flip</span></Link>
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/decks">Decks</Link>
          <Link href="/decks/new">Create deck</Link>
        </nav>
        <div className="sidebar-foot">
          <p className="muted small">{user.displayName}</p>
          <form action={logout}><button className="link-btn">Log out</button></form>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
