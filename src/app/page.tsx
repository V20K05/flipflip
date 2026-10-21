import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";

export default async function Home() {
  if (await getSessionUserId()) redirect("/dashboard");
  return (
    <main className="landing">
      <p className="brand big">flip<span>flip</span></p>
      <h1>Practise what you find hard, more often.</h1>
      <p className="lead">
        Flashcards and multiple-choice questions for TANCET, TNPSC, UPSC, SSC and RRB. You rate every question
        Hard, Medium or Easy, and flipflip brings the tough ones back sooner.
      </p>
      <div className="row center-row">
        <Link className="btn primary" href="/signup">Get started</Link>
        <Link className="btn" href="/login">Log in</Link>
      </div>
    </main>
  );
}
