import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "flipflip: smarter flashcards for exam prep",
  description: "Practice TANCET, TNPSC, UPSC, SSC and RRB questions with a scheduler that learns what you find hard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
