export interface DemoQuestion {
  prompt: string;
  answer: string;
  explanation?: string;
  /** If present, the question is multiple choice and `answer` must equal one of the options. */
  options?: string[];
}
export interface DemoDeck {
  title: string;
  description: string;
  subject: string;
  questions: DemoQuestion[];
}

export const DEMO_DECKS: DemoDeck[] = [
  {
    title: "Indian Polity Basics",
    description: "Core facts about the Constitution of India. A starter deck for UPSC, TNPSC and SSC.",
    subject: "Indian Polity",
    questions: [
      { prompt: "Who chaired the Drafting Committee of the Indian Constitution?", answer: "B. R. Ambedkar", options: ["Jawaharlal Nehru", "B. R. Ambedkar", "Rajendra Prasad", "Sardar Patel"], explanation: "Dr B. R. Ambedkar was Chairman of the Drafting Committee; Rajendra Prasad presided over the Constituent Assembly." },
      { prompt: "Fundamental Rights are contained in which Part of the Constitution?", answer: "Part III", options: ["Part II", "Part III", "Part IV", "Part IVA"] },
      { prompt: "Which Article abolishes untouchability?", answer: "Article 17", options: ["Article 14", "Article 15", "Article 17", "Article 21"] },
      { prompt: "Which Article provides the Right to Constitutional Remedies (writs to the Supreme Court)?", answer: "Article 32", options: ["Article 19", "Article 32", "Article 226", "Article 368"], explanation: "Ambedkar called Article 32 the 'heart and soul' of the Constitution. Article 226 gives similar power to High Courts." },
      { prompt: "What is the minimum age to become a member of the Lok Sabha?", answer: "25 years", options: ["21 years", "25 years", "30 years", "35 years"] },
      { prompt: "What is the maximum strength of the Rajya Sabha?", answer: "250", options: ["238", "245", "250", "552"], explanation: "Up to 238 representatives of States and Union Territories plus 12 nominated members." },
      { prompt: "Which Amendment added the words 'Socialist', 'Secular' and 'Integrity' to the Preamble?", answer: "42nd Amendment (1976)", options: ["24th Amendment", "42nd Amendment (1976)", "44th Amendment", "73rd Amendment"] },
      { prompt: "How many years is the President of India's term of office?", answer: "5 years" },
      { prompt: "Fundamental Duties were added by which Amendment, on the recommendation of which committee?", answer: "42nd Amendment, on the Swaran Singh Committee's recommendation", explanation: "A later amendment (86th, 2002) added the eleventh duty." },
    ],
  },
  {
    title: "General Science Essentials",
    description: "Quick-fire basics from physics, chemistry and biology commonly asked in competitive exams.",
    subject: "General Science",
    questions: [
      { prompt: "What is the chemical symbol for sodium?", answer: "Na", options: ["So", "Na", "Sd", "S"], explanation: "From the Latin 'natrium'." },
      { prompt: "Which organelle is known as the powerhouse of the cell?", answer: "Mitochondria", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"] },
      { prompt: "What is the SI unit of force?", answer: "Newton", options: ["Joule", "Pascal", "Newton", "Watt"] },
      { prompt: "Which gas makes up most of Earth's atmosphere?", answer: "Nitrogen", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Argon"], explanation: "About 78% nitrogen and 21% oxygen." },
      { prompt: "What is the pH of pure water at 25 °C?", answer: "7", options: ["0", "5", "7", "14"] },
      { prompt: "Deficiency of which vitamin causes scurvy?", answer: "Vitamin C", options: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"] },
      { prompt: "Which planet is closest to the Sun?", answer: "Mercury", options: ["Venus", "Mercury", "Mars", "Earth"] },
      { prompt: "What is the hardest naturally occurring substance?", answer: "Diamond" },
      { prompt: "Approximately how fast does light travel in a vacuum?", answer: "About 3 × 10^8 metres per second" },
    ],
  },
  {
    title: "Quantitative Aptitude Warm-up",
    description: "Short arithmetic questions to build speed for TANCET, SSC and RRB.",
    subject: "Quantitative Aptitude",
    questions: [
      { prompt: "What is 15% of 200?", answer: "30", options: ["15", "20", "30", "35"] },
      { prompt: "What is the average of 10, 20, 30 and 40?", answer: "25", options: ["20", "25", "30", "100"] },
      { prompt: "A train covers 120 km in 2 hours. What is its average speed?", answer: "60 km/h", options: ["50 km/h", "60 km/h", "70 km/h", "240 km/h"] },
      { prompt: "Simple interest on ₹1000 at 5% per annum for 2 years?", answer: "₹100", options: ["₹50", "₹100", "₹105", "₹110"], explanation: "SI = P × R × T / 100 = 1000 × 5 × 2 / 100." },
      { prompt: "What is the LCM of 4 and 6?", answer: "12", options: ["10", "12", "18", "24"] },
      { prompt: "What is the square of 13?", answer: "169", options: ["139", "156", "169", "196"] },
      { prompt: "What is 2 raised to the power 10?", answer: "1024" },
      { prompt: "What is the sum of the interior angles of a triangle?", answer: "180 degrees" },
    ],
  },
];
