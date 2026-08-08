# Study Companion — Next Phase Build Prompt

Use this as a prompt for an AI coding assistant, or as your own build spec. It assumes the skeleton (auth, upload, DB schema) and the calm theme are already in place. This pass covers the core RAG feature, testing, the quiz stretch feature, and hardening — with PWA requirements folded into hardening, not treated as a separate track.

---

## 1. Role & Context

You are extending **Study Companion**, an existing Next.js + TypeScript + Prisma + Postgres(pgvector) app. Auth, file upload, and the base data model already work. The calm sage/peach/beige theme is defined as CSS variables/Tailwind tokens — reuse those tokens for every new component; do not introduce new colors.

## 2. Objective for This Pass

Turn uploaded documents into a working, cited Q&A experience: extract text, chunk it, embed it, retrieve relevant chunks at query time, and answer with citations back to the source document. Then validate it against real use, add the quiz stretch feature, and harden the app for real users — including making it installable on a phone.

## 3. Ingestion Pipeline

- On upload, extract text server-side (e.g. `pdf-parse` for PDFs). Update `Document.status` through `pending → processing → ready` (or `failed` with a stored error reason).
- Chunk by semantic unit where possible (headings/paragraphs), falling back to ~500 tokens with ~50-token overlap. Store each chunk in the `Chunk` table with its `chunkIndex` preserved so citations can reference "chunk 3 of Lecture 12," not just a filename.
- Generate embeddings server-side only, batched per document, and store in the `embedding` pgvector column. Never expose the embedding/LLM API key to the client.
- Handle failure gracefully: a corrupt PDF or extraction failure should mark the document `failed` with a user-readable message, not crash the pipeline for other documents.

## 4. Retrieval + Chat

- Given a user query, embed it, run similarity search (cosine distance) over the current user's chunks only — never search across other users' documents.
- Retrieve top-k (start with k=5) chunks, pass them to the LLM with a system prompt that **requires** citing which document/chunk supports each claim, and instructs the model to say it doesn't know rather than answer from outside the provided context.
- Render citations in the chat UI as clickable references back to the source document (and ideally the specific chunk/section) — this is the feature that most differentiates the project, so don't let it degrade into an uncited chatbot.
- Rate-limit the chat endpoint per user (LLM calls cost money and are the easiest thing to abuse) and validate query length/content before sending to the API.
- Chat UI should use the calm theme tokens already defined — soft sage for the user's own messages, neutral surface for AI responses, muted citation chips rather than bright link-blue.

## 5. Real-Use Testing

- Use it yourself on actual coursework for at least a week before adding more features.
- Track specifically: cases where retrieval pulls the wrong chunk, cases where chunking split a concept across two chunks awkwardly, and any hallucinated (uncited) claims. Fix chunking/retrieval before moving on — this is the part that's easy to under-invest in and it's the part interviewers will probe hardest.

## 6. Quiz/Flashcard Generation (stretch)

- Generate practice questions from a document's chunks, weighted toward topics the user has asked about most (use chat history as a signal if time allows, otherwise just sample across the document).
- Keep the same citation discipline: each question should be traceable back to the source chunk it was generated from.
- Reuse existing UI patterns (card list, calm status badges) rather than inventing a new visual language for this feature.

## 7. Hardening for Real Users

- Add error monitoring (Sentry or similar) and confirm no secrets or stack traces leak into client-facing error messages.
- Confirm every `/api` route still checks the session and scopes queries to `userId` — re-audit this now that more routes exist, not just at skeleton stage.
- Write/update the README with real setup steps, and confirm CI (lint + typecheck) is passing.
- Get 3–5 real classmates using it on their own notes; their confusion is more useful than further solo polishing.

### PWA requirement (part of this hardening pass)

Once the core features above are stable, make the app installable on a phone home screen:
- Add `manifest.json` (app name, `theme_color`/`background_color` pulled from the existing calm palette tokens, `display: "standalone"`, icon set including a maskable icon).
- Add a service worker (e.g. via `next-pwa`) with a caching strategy for static assets and the document list; treat chat/query responses as network-first since they must be current.
- Add `apple-touch-icon` and iOS PWA meta tags — iOS's install/offline behavior differs from Android's and needs separate testing.
- Sanity-check every screen at phone width specifically (not just responsive-in-theory) — touch targets at least 44px, no horizontal scroll, chat input usable above the mobile keyboard.
- Add a simple offline state (cached document list, a visible "you're offline" indicator) rather than a silent failure.

Do not treat PWA as a separate rewrite — it's additive configuration on top of the existing app, done once the feature set and data-fetching patterns are stable enough that the caching rules won't need repeated rework.

## 8. Explicitly Out of Scope for This Pass

- Native app store builds (Capacitor/React Native) — future phase, not this one
- Payments, sharing/collaboration features, multi-device sync beyond the database itself

## 9. Acceptance Criteria

- [ ] A user can upload a document and, once `ready`, ask a question and get an answer with a working citation back to the source
- [ ] Retrieval is scoped correctly per-user; no cross-user data ever appears
- [ ] Chat and upload endpoints are rate-limited and reject invalid input
- [ ] At least one full week of real self-use completed, with retrieval/chunking issues found and fixed
- [ ] The app installs to a phone home screen via "Add to Home Screen," works offline for previously loaded documents, and every screen is usable at phone width
- [ ] README, CI, and error monitoring are in place
