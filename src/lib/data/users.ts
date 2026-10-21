import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import type { UserProfile } from "./types";

export async function findUserByEmail(db: Firestore, email: string) {
  const rows = await db.collection("users").where("email", "==", email).limit(1).get();
  const doc = rows.docs.find((d) => !d.get("deletedAt"));
  return doc ? { id: doc.id, passwordHash: doc.get("passwordHash") ?? null, status: doc.get("status") ?? "ACTIVE", role: doc.get("role") ?? "STUDENT" } : null;
}

export async function createUser(db: Firestore, input: { displayName: string; email: string; passwordHash: string }): Promise<string> {
  const id = randomUUID();
  const batch = db.batch();
  batch.create(db.collection("users").doc(id), { ...input, authProvider: "credentials", role: "STUDENT", status: "ACTIVE", createdAt: new Date(), updatedAt: new Date() });
  batch.create(db.collection("userPreferences").doc(id), { userId: id, targetExams: [], onboardingCompleted: false });
  await batch.commit();
  return id;
}

export async function getUserProfile(db: Firestore, id: string): Promise<UserProfile | null> {
  const [user, prefs] = await Promise.all([db.collection("users").doc(id).get(), db.collection("userPreferences").doc(id).get()]);
  if (!user.exists || user.get("deletedAt")) return null;
  return { id, displayName: user.get("displayName"), email: user.get("email"), role: user.get("role") ?? "STUDENT", status: user.get("status") ?? "ACTIVE", onboardingCompleted: prefs.get("onboardingCompleted") ?? false };
}

export async function saveOnboarding(db: Firestore, userId: string, input: { targetExams: string[]; dailyGoalType: string; dailyGoalValue: number }) {
  await db.collection("userPreferences").doc(userId).set({ userId, ...input, onboardingCompleted: true }, { merge: true });
}
