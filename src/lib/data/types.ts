import type { Rating } from "@/lib/scheduling";

export interface PracticeOption { id: string; text: string; isCorrect: boolean }
export interface PracticeQuestion {
  id: string;
  prompt: string;
  answer: string;
  explanation: string | null;
  type: "FLASHCARD" | "MULTIPLE_CHOICE";
  options: PracticeOption[];
}
export interface PracticeData {
  deck: { id: string; title: string };
  questions: PracticeQuestion[];
  ratings: Record<string, Rating>;
}
export interface DeckSummary {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  isOfficial: boolean;
  total: number;
  rated: number;
}
export interface DashboardStats {
  reviewedToday: number;
  totalReviews: number;
  accuracyPercent: number | null;
  hard: number;
  medium: number;
  easy: number;
}
export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  onboardingCompleted: boolean;
}
