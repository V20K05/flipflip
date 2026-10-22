"use client";
import { useActionState, useState } from "react";
import { saveDeck } from "@/app/actions/decks";

type CardDraft = { id: number; questionId?: string; type: "FLASHCARD" | "MULTIPLE_CHOICE"; prompt: string; answer: string; explanation: string; options: string[]; correctIndex: number | null };
type InitialDeck = { id?: string; title?: string; description?: string; color?: string; cards?: Array<{ id: string; type: CardDraft["type"]; prompt: string; answer: string; explanation: string; options: string[]; correctIndex: number }> };
const newCard = (id: number): CardDraft => ({ id, type: "FLASHCARD", prompt: "", answer: "", explanation: "", options: ["", "", "", ""], correctIndex: null });

export function DeckBuilder({ initial = {} }: { initial?: InitialDeck }) {
  const [state, formAction, pending] = useActionState(saveDeck, {});
  const [cards, setCards] = useState<CardDraft[]>(initial.cards?.length ? initial.cards.map((card, i) => ({ ...card, questionId: card.id, id: i + 1 })) : [newCard(1)]);
  const [draggedCardId, setDraggedCardId] = useState<number | null>(null);

  function updateCard(index: number, update: Partial<CardDraft>) {
    setCards((current) => current.map((card, i) => i === index ? { ...card, ...update } : card));
  }

  function updateOption(cardIndex: number, optionIndex: number, value: string) {
    setCards((current) => current.map((card, i) => i === cardIndex
      ? { ...card, options: card.options.map((option, j) => j === optionIndex ? value : option) }
      : card));
  }

  return (
    <form action={formAction} className="deck-builder">
      {initial.id && <input type="hidden" name="deckId" value={initial.id} />}
      <section className="card builder-details">
        <label>Deck name<input name="title" required maxLength={120} defaultValue={initial.title} placeholder="e.g. Biology revision" /></label>
        <label>Description <span className="muted small">(optional)</span><textarea name="description" maxLength={500} rows={3} defaultValue={initial.description} placeholder="What will you practise in this deck?" /></label>
        <label>Folder color
          <select name="color" defaultValue={initial.color ?? "blue"}>
            <option value="blue">Blue</option><option value="red">Red</option><option value="orange">Orange</option><option value="yellow">Yellow</option><option value="green">Green</option><option value="purple">Purple</option><option value="pink">Pink</option>
          </select>
        </label>
      </section>

      <input type="hidden" name="cardCount" value={cards.length} />
      {cards.map((card, cardIndex) => (
        <section
          className={`card builder-card${draggedCardId === card.id ? " is-dragging" : ""}`}
          key={card.id}
          draggable
          onDragStart={(event) => { setDraggedCardId(card.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(card.id)); }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const sourceId = Number(event.dataTransfer.getData("text/plain")) || draggedCardId;
            setCards((all) => { const from = all.findIndex((item) => item.id === sourceId); const to = all.findIndex((item) => item.id === card.id); if (from < 0 || to < 0 || from === to) return all; const next = [...all]; const [moving] = next.splice(from, 1); next.splice(to, 0, moving!); return next; });
            setDraggedCardId(null);
          }}
          onDragEnd={() => setDraggedCardId(null)}
        >
          <div className="row between">
            <h2>Card {cardIndex + 1}</h2>
            <div className="row card-order-tools">
              <button type="button" className="link-btn" disabled={cardIndex === 0} onClick={() => setCards((all) => { const next = [...all]; [next[cardIndex - 1], next[cardIndex]] = [next[cardIndex]!, next[cardIndex - 1]!]; return next; })} aria-label={`Move card ${cardIndex + 1} up`}>↑</button>
              <button type="button" className="link-btn" disabled={cardIndex === cards.length - 1} onClick={() => setCards((all) => { const next = [...all]; [next[cardIndex], next[cardIndex + 1]] = [next[cardIndex + 1]!, next[cardIndex]!]; return next; })} aria-label={`Move card ${cardIndex + 1} down`}>↓</button>
              {cards.length > 1 && <button type="button" className="link-btn remove-card" onClick={() => setCards((all) => all.filter((_, i) => i !== cardIndex))}>Remove</button>}
            </div>
          </div>
          <input type="hidden" name={`cardId_${cardIndex}`} value={card.questionId ?? ""} />
          <input type="hidden" name={`type_${cardIndex}`} value={card.type} />
          <label>Question<input name={`prompt_${cardIndex}`} required maxLength={1000} defaultValue={card.prompt} placeholder="Write the question or prompt" /></label>
          <label>Card type
            <select value={card.type} onChange={(event) => updateCard(cardIndex, { type: event.target.value as CardDraft["type"] })}>
              <option value="FLASHCARD">Answer card</option>
              <option value="MULTIPLE_CHOICE">Multiple choice</option>
            </select>
          </label>

          {card.type === "FLASHCARD" ? (
            <label>Answer<textarea name={`answer_${cardIndex}`} required maxLength={2000} rows={3} defaultValue={card.answer} placeholder="Write the answer" /></label>
          ) : (
            <fieldset className="choice-builder">
              <legend>Choices <span className="muted small">Select the correct answer</span></legend>
              <input type="hidden" name={`optionCount_${cardIndex}`} value={card.options.length} />
              {card.options.map((option, optionIndex) => (
                <div className="choice-row" key={optionIndex}>
                  <input
                    type="radio"
                    name={`correct_${cardIndex}`}
                    value={optionIndex}
                    required={optionIndex === 0}
                    checked={card.correctIndex === optionIndex}
                    onChange={() => updateCard(cardIndex, { correctIndex: optionIndex })}
                    aria-label={`Mark choice ${optionIndex + 1} as correct`}
                  />
                  <input
                    name={`option_${cardIndex}_${optionIndex}`}
                    value={option}
                    onChange={(event) => updateOption(cardIndex, optionIndex, event.target.value)}
                    required
                    maxLength={500}
                    placeholder={`Choice ${optionIndex + 1}`}
                  />
                  {card.options.length > 2 && <button type="button" className="link-btn" onClick={() => updateCard(cardIndex, {
                    options: card.options.filter((_, i) => i !== optionIndex),
                    correctIndex: card.correctIndex === optionIndex ? null : card.correctIndex !== null && card.correctIndex > optionIndex ? card.correctIndex - 1 : card.correctIndex,
                  })} aria-label={`Remove choice ${optionIndex + 1}`}>×</button>}
                </div>
              ))}
              {card.options.length < 6 && <button type="button" className="link-btn add-choice" onClick={() => updateCard(cardIndex, { options: [...card.options, ""] })}>+ Add choice</button>}
            </fieldset>
          )}
          <label>Explanation <span className="muted small">(optional)</span><textarea name={`explanation_${cardIndex}`} maxLength={2000} rows={2} defaultValue={card.explanation} placeholder="Add a helpful note for revision" /></label>
        </section>
      ))}

      {cards.length < 50 && <button type="button" className="btn add-card" onClick={() => setCards((all) => [...all, newCard(Math.max(0, ...all.map((card) => card.id)) + 1)])}>+ Add card</button>}
      {state.error && <p className="error" role="alert">{state.error}</p>}
      <div className="row builder-submit">
        <button className="btn primary" disabled={pending}>{pending ? "Saving…" : initial.id ? "Save changes" : "Create deck"}</button>
        <span className="muted small">Your deck starts private. You can revise these cards any time.</span>
      </div>
    </form>
  );
}
