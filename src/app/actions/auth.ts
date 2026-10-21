"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { createUser, findUserByEmail, getUserProfile, saveOnboarding } from "@/lib/data/users";
import { getSessionUserId } from "@/lib/session";

export interface FormState { error?: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_COST = 12;
// Used so a login for an unknown email takes about as long as a real one.
let dummyHash: string | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync("flipflip-dummy-password", BCRYPT_COST));

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const displayName = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (displayName.length < 2 || displayName.length > 60) return { error: "Please enter your name (2 to 60 characters)." };
  if (!EMAIL.test(email) || email.length > 254) return { error: "Please enter a valid email address." };
  if (password.length < 8 || password.length > 72) return { error: "Password must be 8 to 72 characters." };

  const db = getDb();
  if (await findUserByEmail(db, email)) return { error: "An account with this email already exists. Try logging in." };

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  let userId: string;
  try {
    userId = await createUser(db, { displayName, email, passwordHash });
  } catch {
    return { error: "Could not create your account. Please try again." };
  }
  await createSession(userId);
  redirect("/onboarding");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const db = getDb();
  const user = await findUserByEmail(db, email);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? getDummyHash());
  if (!user || !user.passwordHash || !ok) return { error: "Incorrect email or password." };
  if (user.status !== "ACTIVE") return { error: "This account is not active." };

  await createSession(user.id);
  const profile = await getUserProfile(db, user.id);
  redirect(profile?.onboardingCompleted ? "/dashboard" : "/onboarding");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

const EXAMS = ["TANCET", "TNPSC", "UPSC", "SSC", "RRB"];
const GOALS: Record<string, number[]> = { questions: [10, 20, 50], minutes: [15, 30, 60] };

export async function completeOnboarding(_: FormState, form: FormData): Promise<FormState> {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const exams = form.getAll("exams").map(String).filter((e) => EXAMS.includes(e));
  const goalType = String(form.get("goalType") ?? "questions");
  const goalValue = Number(form.get("goalValue"));
  if (exams.length === 0) return { error: "Pick at least one exam you are preparing for." };
  if (!GOALS[goalType]?.includes(goalValue)) return { error: "Please choose a daily goal." };
  await saveOnboarding(getDb(), userId, { targetExams: exams, dailyGoalType: goalType, dailyGoalValue: goalValue });
  redirect("/dashboard");
}
