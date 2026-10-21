"use client";
import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";

export function AuthForm({
  action, mode,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  mode: "login" | "signup";
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const isSignup = mode === "signup";
  return (
    <main className="auth">
      <form action={formAction} className="card auth-card">
        <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="muted">{isSignup ? "Start practising smarter for your exam." : "Log in to continue practising."}</p>
        {isSignup && (
          <label>Name<input name="name" required minLength={2} maxLength={60} autoComplete="name" /></label>
        )}
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>
          Password
          <input name="password" type="password" required minLength={isSignup ? 8 : 1} maxLength={72}
            autoComplete={isSignup ? "new-password" : "current-password"} />
        </label>
        {isSignup && <p className="hint">At least 8 characters.</p>}
        {state.error && <p className="error" role="alert">{state.error}</p>}
        <button className="btn primary" disabled={pending}>
          {pending ? "Please wait…" : isSignup ? "Sign up" : "Log in"}
        </button>
        <p className="muted center">
          {isSignup ? <>Already have an account? <Link href="/login">Log in</Link></> : <>New here? <Link href="/signup">Create an account</Link></>}
        </p>
      </form>
    </main>
  );
}
