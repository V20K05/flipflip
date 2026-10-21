# flipflip

Adaptive flashcard learning SaaS for competitive-exam students (TANCET, TNPSC, UPSC, SSC, RRB).
Full product spec: `PROJECT_PROMPT.md`.

## Status (honest)

| Area | State |
|---|---|
| Scheduler (queue, reinsertion, undo-10, incorrect-answer suggestion) | Done, 16 unit tests |
| Attribution rule (>50% of original questions modified) | Done, 7 unit tests |
| Database (Firebase Cloud Firestore) | Configured through Firebase Admin; create a Firebase project and add service credentials |
| Data layer + seed | Firestore collections are created on demand; `npm run seed` adds demo decks |
| Email/password signup, login, logout, onboarding | Built; user profiles and preferences are stored in Firestore |
| Dashboard, deck list, deck page | Built (real data only) |
| Practice screen (MCQ + flip cards, Hard/Medium/Easy, stars, undo, keyboard shortcuts, summary) | Built |
| Google login, dark mode, deck editor, import, community, messaging, admin | Not started |

## Run it

```bash
npm install
cp .env.example .env      # then fill in Firebase service credentials and AUTH_SECRET
npm run seed              # adds demo decks (safe to re-run)
npm run dev               # http://localhost:3000
npm test                  # 33 tests
```

Generate `AUTH_SECRET` with `openssl rand -base64 32`.

## Architecture (planned)

- Frontend + API: Next.js (App Router) + TypeScript + Tailwind, deployed on Vercel (or the college-mandated cloud).
- Database: Firebase Cloud Firestore via the server-only Firebase Admin SDK.
- Object storage: S3-compatible bucket (Cloudflare R2 / Supabase Storage) for covers and assets.
- Auth: email/password (bcrypt) with signed JWT session cookies; Google login planned. Roles are checked server-side.
- Scheduler and attribution live in `src/lib` as pure, framework-free modules.

## Scheduling policy (configurable in `src/lib/scheduling/config.ts`)

- Session priority: Hard 1.0 > unrated 0.95 > Medium 5★ 0.8 ... Medium 1★ 0.3 > Easy 0.1.
- In-session return gap: Hard 3-5 cards; Medium 5★ = 6 ... 1★ = 15 (linear); Easy not repeated this session.
- If the last remaining card is rated Hard, the session ends rather than repeating it immediately.
- Undo restores the exact queue and prior rating for the last 10 actions. Changing a rating = undo, then re-rate.
- Wrong answers only produce a *suggested* harder rating; the user's rating is never overwritten.
- This is a transparent heuristic, **not** a validated spaced-repetition algorithm.

## Attribution rule

An original question counts as modified if it was deleted from the copy or its prompt/answer/explanation/options changed
(whitespace/case ignored). Added questions, reordering, title and cover changes do not count. Attribution is hidden only
when modified/original is strictly greater than 0.5; internal provenance (`DeckImport.sourceOwnerId`) is kept.

## Milestones

1. Foundation: scheduler, attribution, schema (done, except schema validation)
2. Next.js scaffold, migrations, seed, auth (email + Google), onboarding
3. Deck/question editor, CSV/JSON import with preview, cover upload
4. Practice loop: MC and flip modes, Hard/Medium/Easy controls, animation, shortcuts, undo, bookmarks, session summary
5. Dashboard and analytics (real data only)
6. Community: publish flow, ranking function, search/filters, follow, reviews, reports
7. Messaging and notifications
8. Admin dashboard, audit log, tests, deployment docs

## What the developer must supply

`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, and `AUTH_SECRET` (see `.env.example`).
Create a Firebase project, enable Cloud Firestore in Native mode, and create a service account in Firebase Console →
Project settings → Service accounts. Put its project ID, client email, and private key in `.env`; the key can be pasted
with literal newlines or escaped `\\n`. On Google Cloud, Application Default Credentials can be used instead.

The app uses the Firebase Admin SDK on the server, so service credentials must never be exposed as `NEXT_PUBLIC_*`.
Firestore security rules do not apply to Admin SDK access; keep the service account private and rely on the app's
server-side session and ownership checks. Documents live in `users`, `userPreferences`, `decks`, `subjects`, `questions`,
`questionOptions`, `questionProgress`, and `reviewEvents` collections.
