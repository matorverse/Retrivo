# AI Study Companion — Skeleton Build Prompt

Use this document as a prompt for an AI coding assistant (Claude Code, Cursor, etc.) or as your own build spec. It defines exactly what to scaffold in this first pass — not the full product.

---

## 1. Role & Context

You are helping scaffold the initial codebase for **Study Companion**, a web app where students upload their lecture notes/PDFs and get AI-powered Q&A with citations back to source material, plus (later) auto-generated quizzes. This is a personal/portfolio project by a CSE student, built incrementally over a semester. This pass builds the **skeleton only**: project structure, auth, database schema, and empty-but-wired feature routes. Do not implement full RAG logic yet — just the scaffolding it will plug into.

## 2. Objective for This Pass

Produce a deployed, working shell where:
- A user can sign up / log in
- A user can upload a file to storage (upload works end-to-end, even if processing is a stub)
- The database schema for the full feature set already exists (even for tables not yet used)
- All routes are auth-protected correctly
- The app is live on a real URL

## 3. Tech Stack (locked — do not substitute without asking)

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router), TypeScript |
| Styling | Tailwind CSS |
| Database | Postgres (Neon or Supabase, must support pgvector) |
| ORM | Prisma |
| Auth | NextAuth.js (email/password or OAuth — your choice) or Clerk |
| File storage | Vercel Blob or S3-compatible bucket |
| Embeddings/LLM | Claude or OpenAI API (server-side only) |
| Validation | Zod |
| Deployment | Vercel |
| CI | GitHub Actions (lint + typecheck on PR) |

## 4. Architecture Overview

- `app/(auth)/` — login/signup pages, public
- `app/(dashboard)/` — protected pages, requires session
- `app/api/` — route handlers; every handler validates input with Zod and checks auth server-side (never trust client-side route protection alone)
- `lib/db.ts` — single Prisma client instance
- `lib/auth.ts` — auth config/session helpers
- `lib/llm.ts` — wrapper around the LLM/embedding API calls (server-only, never imported into client components)

## 5. Data Model (Prisma schema — create all of these now)

```prisma
model User {
  id            String     @id @default(cuid())
  email         String     @unique
  hashedPassword String?
  name          String?
  createdAt     DateTime   @default(now())
  documents     Document[]
}

model Document {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  filename    String
  storageUrl  String
  status      String   @default("pending") // pending | processing | ready | failed
  createdAt   DateTime @default(now())
  chunks      Chunk[]
}

model Chunk {
  id          String   @id @default(cuid())
  documentId  String
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  content     String
  embedding   Unsupported("vector(1536)")? // pgvector column, adjust dims to your embedding model
  chunkIndex  Int
}
```

Enable the `pgvector` extension in your database and add a migration for it — Prisma doesn't manage vector indexes natively, so include a raw SQL migration for the extension and an ivfflat/hnsw index on `embedding`.

## 6. Security & Secrets Requirements (non-negotiable for this pass)

- All secrets live in `.env.local`, which must be in `.gitignore`. Commit a `.env.example` with variable names only, no values.
- Required env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`), `BLOB_READ_WRITE_TOKEN` (or S3 equivalents).
- **Never** call the LLM/embedding API from a client component or expose the API key to the browser — all AI calls go through server route handlers or server actions only.
- Every `/api/*` route handler must verify the session server-side before touching user data — do not rely on middleware alone for data access checks.
- Validate all inputs (including file uploads: type allowlist, max size) with Zod before processing.
- Scope every database query to `userId` from the session — never trust a client-supplied user ID.
- Passwords (if using credentials auth) must be hashed with bcrypt/argon2, never stored plain.
- Add basic rate limiting on upload and query endpoints (even a simple in-memory or Upstash-based limiter is fine for now).
- No secrets or PII in console logs or error messages returned to the client.

## 7. Skeleton Scope — Build These Now

1. Project init with the locked stack above, Tailwind configured, deployed to Vercel with a live URL.
2. Auth: signup, login, logout, protected dashboard route that redirects unauthenticated users.
3. Prisma schema above, migrated, with pgvector extension enabled.
4. File upload UI + API route: accepts a PDF, stores it in blob storage, creates a `Document` row with status `pending`. Text extraction/chunking can be a stub function (`// TODO: implement in week 2`) that just marks status `ready`.
5. A dashboard page listing the current user's uploaded documents and their status.
6. `.env.example`, README with setup instructions, and a GitHub Actions workflow that runs `tsc --noEmit` and lint on PRs.

## 8. Explicitly Out of Scope for This Pass

- Real text extraction, chunking, or embedding generation
- Actual RAG retrieval or chat UI
- Quiz/flashcard generation
- Payment, sharing, or multi-user collaboration features

## 9. Acceptance Criteria / Definition of Done

- [ ] Fresh clone + documented setup steps → app runs locally with no manual guesswork
- [ ] Deployed URL is live and login works on it
- [ ] Unauthenticated users cannot reach `/dashboard` or call any `/api` route that touches user data
- [ ] A logged-in user can upload a file and see it appear in their document list
- [ ] No secret values committed anywhere in git history
- [ ] `npm run build` and `tsc --noEmit` both pass cleanly

## 10. Constraints

- Do not hand-roll authentication or password hashing from scratch — use a maintained library.
- Do not write raw SQL string interpolation — use Prisma or parameterized queries only.
- Keep the skeleton minimal: do not pre-build features listed as out of scope, even partially.
