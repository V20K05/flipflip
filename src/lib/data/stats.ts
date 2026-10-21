import type { Firestore } from "firebase-admin/firestore";
import type { DashboardStats } from "./types";
export async function getDashboardStats(db: Firestore, userId: string): Promise<DashboardStats> {
  const [events, progress] = await Promise.all([db.collection("reviewEvents").where("userId", "==", userId).get(), db.collection("questionProgress").where("userId", "==", userId).get()]);
  const today = new Date();
  const istToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(today);
  const rated = events.docs.filter((e) => e.get("eventType") === "RATED");
  const reviewedToday = rated.filter((e) => e.get("reviewedAt")?.toDate && new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(e.get("reviewedAt").toDate()) === istToday).length;
  const answered = rated.filter((e) => e.get("answerCorrect") !== null && e.get("answerCorrect") !== undefined);
  const levels = { hard: 0, medium: 0, easy: 0 };
  for (const p of progress.docs) { const category = p.get("difficultyCategory"); if (category === "HARD") levels.hard++; if (category === "MEDIUM") levels.medium++; if (category === "EASY") levels.easy++; }
  return { reviewedToday, totalReviews: rated.length, accuracyPercent: answered.length ? Math.round(answered.filter((e) => e.get("answerCorrect") === true).length / answered.length * 100) : null, ...levels };
}
