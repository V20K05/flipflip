import type { DocumentData, Firestore, QuerySnapshot } from "firebase-admin/firestore";
import type { DashboardStats } from "./types";

type ProgressQuery = Promise<QuerySnapshot<DocumentData>>;
const istDate = (value: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(value);

export async function getDashboardStats(db: Firestore, userId: string, progressQuery?: ProgressQuery): Promise<DashboardStats> {
  // Progress is one document per user/card, while reviewEvents grows with every attempt.
  // These persisted counters provide the same totals without scanning the full event log.
  const progress = await (progressQuery ?? db.collection("questionProgress").where("userId", "==", userId).get());
  const today = istDate(new Date());
  const levels = { hard: 0, medium: 0, easy: 0 };
  let totalReviews = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let reviewedToday = 0;
  for (const p of progress.docs) {
    const seen = Number(p.get("timesSeen") ?? 0);
    const correct = Number(p.get("timesCorrect") ?? 0);
    const incorrect = Number(p.get("timesIncorrect") ?? 0);
    totalReviews += seen;
    totalCorrect += correct;
    totalIncorrect += incorrect;
    const category = p.get("difficultyCategory");
    if (category === "HARD") levels.hard++;
    if (category === "MEDIUM") levels.medium++;
    if (category === "EASY") levels.easy++;

    const lastAnswered = p.get("lastAnsweredAt");
    const lastAnsweredDate = p.get("lastAnsweredDay") ?? (lastAnswered?.toDate ? istDate(lastAnswered.toDate()) : null);
    if (lastAnsweredDate === today) reviewedToday += Number(p.get("timesSeenToday") ?? 1);
  }
  const answered = totalCorrect + totalIncorrect;
  return { reviewedToday, totalReviews, accuracyPercent: answered ? Math.round(totalCorrect / answered * 100) : null, ...levels };
}
