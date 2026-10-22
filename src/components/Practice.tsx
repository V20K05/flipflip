"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { recordRating, recordUndo } from "@/app/actions/practice";
import type { PracticeQuestion } from "@/lib/data/types";
import {
  canUndo, createSession, explainScheduling, rateCurrent, suggestRatingAfterIncorrect, undoLast,
  type Rating, type SessionState, type Stars,
} from "@/lib/scheduling";

interface Props {
  deckId: string;
  deckTitle: string;
  questions: PracticeQuestion[];
  ratings: Record<string, Rating>;
  initialQueue: string[];
}
interface UndoMeta { questionId: string; previous: Rating | null; rating: Rating; answerCorrect: boolean | null }
type Tally = { HARD: number; MEDIUM: number; EASY: number };

const STARS: Stars[] = [1, 2, 3, 4, 5];

export function Practice({ deckId, deckTitle, questions, ratings, initialQueue }: Props) {
  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const [state, setState] = useState<SessionState>(() => createSession(initialQueue, ratings));
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [tally, setTally] = useState<Tally>({ HARD: 0, MEDIUM: 0, EASY: 0 });
  const shownAt = useRef(Date.now());
  const undoStack = useRef<UndoMeta[]>([]);

  const current = state.queue[0] ? byId.get(state.queue[0]) : undefined;
  const isMc = current?.type === "MULTIPLE_CHOICE";
  const selectedOption = current?.options.find((o) => o.id === selected);
  const answerCorrect: boolean | null = isMc ? (selectedOption ? selectedOption.isCorrect : false) : null;
  const existing = current ? state.ratings[current.id] ?? null : null;
  const suggestion = revealed && answerCorrect === false ? suggestRatingAfterIncorrect(existing) : null;

  function reveal() {
    if (!current || revealed) return;
    if (isMc && !selected) return;
    setRevealed(true);
  }

  function rate(rating: Rating) {
    if (!current || !revealed) return;
    const meta: UndoMeta = { questionId: current.id, previous: existing, rating, answerCorrect };
    undoStack.current = [...undoStack.current, meta].slice(-10);
    const ms = Date.now() - shownAt.current;
    setState(rateCurrent(state, rating));
    setTally((t) => ({ ...t, [rating.category]: t[rating.category] + 1 }));
    setNote(explainScheduling(rating));
    setRevealed(false);
    setSelected(null);
    shownAt.current = Date.now();
    recordRating({
      deckId, questionId: current.id, rating, previous: existing, answerCorrect,
      selectedOptionId: selected, responseTimeMs: ms,
    })
      .then((r) => { if (!r.ok) setSaveError(true); })
      .catch(() => setSaveError(true));
  }

  function undo() {
    const meta = undoStack.current[undoStack.current.length - 1];
    if (!meta || !canUndo(state)) return;
    undoStack.current = undoStack.current.slice(0, -1);
    setState(undoLast(state));
    setTally((t) => ({ ...t, [meta.rating.category]: Math.max(0, t[meta.rating.category] - 1) }));
    setRevealed(false);
    setSelected(null);
    setNote("Undone. That card is back.");
    shownAt.current = Date.now();
    recordUndo({ deckId, questionId: meta.questionId, previous: meta.previous, undone: meta.rating, answerCorrect: meta.answerCorrect })
      .then((r) => { if (!r.ok) setSaveError(true); })
      .catch(() => setSaveError(true));
  }

  // Keyboard shortcuts (re-registered each render so handlers see fresh state).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "u") return undo();
      if (!current) return;
      if (!revealed) {
        if (isMc && ["1", "2", "3", "4"].includes(key)) {
          const option = current.options[Number(key) - 1];
          if (option) setSelected(option.id);
        } else if (key === " " || key === "enter") {
          e.preventDefault();
          reveal();
        }
        return;
      }
      if (key === "h") rate({ category: "HARD" });
      else if (key === "e") rate({ category: "EASY" });
      else if (["1", "2", "3", "4", "5"].includes(key)) rate({ category: "MEDIUM", stars: Number(key) as Stars });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!current) {
    return (
      <div className="practice">
        <div className="card summary">
          <h1>Session complete</h1>
          <p className="muted">You rated {state.reviewedCount} card{state.reviewedCount === 1 ? "" : "s"} in {deckTitle}.</p>
          <div className="levels">
            <div className="level hard"><strong>{tally.HARD}</strong> Hard</div>
            <div className="level medium"><strong>{tally.MEDIUM}</strong> Medium</div>
            <div className="level easy"><strong>{tally.EASY}</strong> Easy</div>
          </div>
          {saveError && <p className="error">Some ratings may not have been saved. Check your connection.</p>}
          <div className="row">
            <a className="btn primary" href={`/practice/${deckId}`}>Practise again</a>
            <Link className="btn" href="/dashboard">Back to dashboard</Link>
            {canUndo(state) && <button className="btn" onClick={undo}>Undo last (U)</button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="practice practice-session">
      <div className="row between">
        <Link href={`/decks/${deckId}`}>← {deckTitle}</Link>
        <span className="muted small">{state.queue.length} in queue · {state.reviewedCount} rated</span>
      </div>

      {saveError && <p className="error" role="alert">Your last rating could not be saved. Check your connection.</p>}

      <div className="practice-stage">
      <div className={`question-stack${isMc ? " has-options" : ""}`} key={`${current.id}-${state.reviewedCount}`}>
      {revealed && answerCorrect && (
        <div className="answer-celebration" aria-live="polite" aria-label="Correct answer">
          <span className="graffiti-word" aria-hidden="true">NICE!</span>
          {Array.from({ length: 18 }, (_, i) => <span key={i} className="confetti-bit" style={{ "--hue": i * 31, "--x": `${(i - 8) * 16}px`, "--y": `${-55 - (i % 5) * 18}px`, "--rotation": `${i * 42}deg` } as CSSProperties} aria-hidden="true" />)}
        </div>
      )}
      <div className={`card question${revealed ? " revealed" : ""}`}>
        <div className="question-top">
          <p className="tag">{deckTitle}</p>
          <span className="question-menu" aria-hidden="true">•••</span>
        </div>
        <h2>{current.prompt}</h2>

        {isMc && (
          <div className="options">
            {current.options.map((o, i) => {
              const cls = ["option", selected === o.id ? "selected" : "", revealed && o.isCorrect ? "correct" : "", revealed && selected === o.id && !o.isCorrect ? "wrong" : ""].join(" ");
              return (
                <button key={o.id} className={cls} disabled={revealed} onClick={() => setSelected(o.id)}>
                  <kbd>{i + 1}</kbd> {o.text}
                </button>
              );
            })}
          </div>
        )}

        {!revealed ? (
          <button className="btn primary question-action" onClick={reveal} disabled={isMc && !selected}>
            {isMc ? "Submit" : "Answer"}
          </button>
        ) : (
          <div className="answer flip-in">
            {isMc && <p className={answerCorrect ? "verdict ok" : "verdict bad"}>{answerCorrect ? "Correct" : "Not quite"}</p>}
            <p><span className="muted">Answer:</span> <strong>{current.answer}</strong></p>
            {current.explanation && <p className="muted">{current.explanation}</p>}
          </div>
        )}
        <div className="question-tools">
          <button className="question-tool" onClick={undo} disabled={!canUndo(state)} aria-label="Undo last rating" title="Undo last rating">↶</button>
          <span className="question-tool bookmark-mark" aria-hidden="true">♧</span>
        </div>
      </div>
      </div>

      {revealed && (
        <div className="card rating">
          <p className="small muted">How hard was this for you?</p>
          {suggestion && (
            <p className="suggest">
              You missed this one. Consider a harder rating.{" "}
              <button className="link-btn" onClick={() => rate(suggestion)}>
                Use {suggestion.category === "HARD" ? "Hard" : `Medium ${suggestion.category === "MEDIUM" ? suggestion.stars : ""}★`}
              </button>
            </p>
          )}
          <div className="rate-row">
            <button className="rate hard" onClick={() => rate({ category: "HARD" })}>Hard <kbd>H</kbd></button>
            <div className="rate medium">
              <span>Medium {existing?.category === "MEDIUM" ? `(now ${existing.stars}★)` : ""}</span>
              <div className="stars">
                {STARS.map((s) => (
                  <button key={s} onClick={() => rate({ category: "MEDIUM", stars: s })} aria-label={`Medium ${s} stars`}>{s}★</button>
                ))}
              </div>
              <small>1★ almost easy · 5★ almost hard (keys 1 to 5)</small>
            </div>
            <button className="rate easy" onClick={() => rate({ category: "EASY" })}>Easy <kbd>E</kbd></button>
          </div>
        </div>
      )}

      <div className="row between">
        <span className="muted small">{note}</span>
        <button className="link-btn" onClick={undo} disabled={!canUndo(state)}>Undo (U)</button>
      </div>
      </div>
    </div>
  );
}
