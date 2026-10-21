"use client";
import { useActionState } from "react";
import { completeOnboarding } from "@/app/actions/auth";

const EXAMS = ["TANCET", "TNPSC", "UPSC", "SSC", "RRB"];

export function OnboardingForm({ name }: { name: string }) {
  const [state, formAction, pending] = useActionState(completeOnboarding, {});
  return (
    <main className="auth">
      <form action={formAction} className="card auth-card wide">
        <h1>Welcome, {name}</h1>
        <p className="muted">Two quick questions so we can set you up.</p>
        <fieldset>
          <legend>Which exams are you preparing for?</legend>
          <div className="chips">
            {EXAMS.map((e) => (
              <label key={e} className="chip"><input type="checkbox" name="exams" value={e} /> {e}</label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Daily goal</legend>
          <div className="row">
            <select name="goalValue" defaultValue="20" aria-label="Goal amount">
              <option value="10">10</option><option value="20">20</option><option value="50">50</option>
            </select>
            <input type="hidden" name="goalType" value="questions" />
            <span>questions per day</span>
          </div>
        </fieldset>
        {state.error && <p className="error" role="alert">{state.error}</p>}
        <button className="btn primary" disabled={pending}>{pending ? "Saving…" : "Continue"}</button>
      </form>
    </main>
  );
}
