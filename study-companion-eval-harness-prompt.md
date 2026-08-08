# Study Companion — Retrieval Evaluation Harness Build Prompt
### (Optimized for Gemini 3.6 Flash, thinking_level: HIGH)

---

## Instructions to the model

You are operating with `thinking_level: HIGH`. Use that budget to fully plan the file structure and logic *before* writing any code — do not write incrementally and revise. This prompt is fully specified; you should not need to ask clarifying questions. Where a genuine ambiguity exists, make the most reasonable assumption, state it in a one-line comment at the top of the relevant file, and proceed.

**Scope lock:** only create/modify files under `/eval/` and add one script entry to `package.json`. Do not touch any existing route, component, or schema file. Do not refactor unrelated code, even if you notice something you'd improve — flag it in a comment instead, don't fix it.

**Critical constraint — read before doing anything else:** you cannot know the true correct answer for the user's actual lecture notes. Do NOT invent plausible-looking question/answer pairs and present them as ground truth. Your job is to build the *tooling* (schema, loader, metric calculator, runner, report) and produce a *template* golden set with clearly marked `"TODO_HUMAN_REVIEW"` placeholders. The human will fill in real questions and verify real expected chunk IDs afterward. Shipping fabricated ground truth would make this eval silently meaningless — treat this constraint as equal in priority to any functional requirement below.

---

## 1. Context

Existing stack: Next.js + TypeScript, Prisma + Postgres/pgvector. Existing schema includes `Document` and `Chunk` models (`Chunk` has `id`, `documentId`, `content`, `embedding`, `chunkIndex`). Retrieval logic already exists somewhere in `lib/` (likely `lib/llm.ts` or a dedicated `lib/retrieval.ts`) — locate the actual embedding + similarity-search function and reuse it. Do not duplicate or reimplement embedding logic.

## 2. Objective

Build a standalone, repeatable eval script that measures whether retrieval returns the correct source chunks for a set of known questions — output as a clear pass/fail report with metrics, runnable via `npm run eval`.

## 3. Deliverables (exact files)

1. **`eval/golden-set.schema.json`** — JSON schema defining a test case:
   ```json
   {
     "id": "string",
     "question": "string",
     "documentId": "string",
     "expectedChunkIds": ["string"],
     "notes": "string (optional, human commentary)"
   }
   ```

2. **`eval/golden-set.template.json`** — an array of 20 entries, each with `question`, `documentId`, and `expectedChunkIds` set to `"TODO_HUMAN_REVIEW"` (a string, not a real array) and `notes` explaining what kind of question belongs there (e.g., "factual lookup question," "definition question," "cross-section question spanning two chunks"). Vary the *types* of question across the 20 so the template guides good coverage — do not vary the (nonexistent) answers.

3. **`eval/metrics.ts`** — pure functions, unit-testable, no I/O:
   - `hitAtK(expectedChunkIds: string[], retrievedChunkIds: string[]): boolean` — true if any expected ID appears anywhere in the retrieved list.
   - `reciprocalRank(expectedChunkIds: string[], retrievedChunkIds: string[]): number` — `1 / (rank of first matching chunk, 1-indexed)`, or `0` if no match found.
   - Include JSDoc comments explaining each formula in one line.

4. **`eval/run-eval.ts`** — the runner:
   - Loads a golden set file (path passed as CLI arg, default `eval/golden-set.json` — note this is the *filled-in* file, not the template; if it doesn't exist, print a clear message telling the user to copy the template and fill it in, then exit 1).
   - Skips (and counts separately) any case still containing `"TODO_HUMAN_REVIEW"`, so an incomplete golden set doesn't silently pass.
   - For each real case: calls the existing retrieval function with `question`, gets back ranked `Chunk` results, computes `hitAtK` (k=5) and `reciprocalRank`.
   - Does **not** call the LLM chat/generation endpoint — retrieval only, to keep this fast and free of API cost.
   - Prints a per-case table to console (question truncated to 60 chars, hit/miss, rank) and a summary: total cases, skipped-TODO count, Hit@5 rate, mean reciprocal rank (MRR).
   - Exits with code `1` if Hit@5 rate is below `0.8` on the completed (non-skipped) cases, else exits `0` — so this is CI-ready later even though it's not wired into CI now.

5. **`package.json`** — add `"eval": "tsx eval/run-eval.ts"` (or the project's existing TS runner) to `scripts`.

## 4. Explicitly Out of Scope

- Do not wire this into GitHub Actions/CI in this pass.
- Do not modify the retrieval function itself, even if you spot a possible improvement — note it in a comment.
- Do not generate real golden-set answers. This is restated because it is the single most important constraint in this prompt.

## 5. Acceptance Criteria

- [ ] `npm run eval` with no golden set present fails clearly with instructions, not a stack trace
- [ ] Running against `golden-set.template.json` (all TODOs) reports 20 skipped, 0 evaluated, and does not error
- [ ] Running against a manually-completed `golden-set.json` produces a correct-looking Hit@5 and MRR based on the formulas above
- [ ] No existing file outside `/eval/` and the one `package.json` script line was modified
- [ ] `metrics.ts` functions have no side effects and could be unit tested in isolation
