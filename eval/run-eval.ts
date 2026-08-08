import fs from "fs";
import path from "path";

// Automatically load .env.local / .env environment variables for standalone execution
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const filePath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [key, ...valParts] = trimmed.split("=");
          const val = valParts.join("=").replace(/^["']|["']$/g, "").trim();
          if (key && !process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    }
  }
}
loadEnv();

import { generateEmbedding } from "../lib/llm";
import { searchSimilarChunks } from "../lib/rag";
import { hitAtK, reciprocalRank } from "./metrics";

interface TestCase {
  id: string;
  question: string;
  documentId: string;
  expectedChunkIds: string[] | string;
  notes?: string;
}

interface CaseResult {
  id: string;
  question: string;
  hit: boolean;
  mrr: number;
  rank: string;
}

async function runEval() {
  const args = process.argv.slice(2);
  const targetPath = args[0] || "eval/golden-set.json";
  const resolvedPath = path.resolve(process.cwd(), targetPath);

  console.log("=================================================");
  console.log(" 📚 Study Companion — Retrieval Evaluation Harness");
  console.log("=================================================\n");

  // 1. Validate Golden Set file existence
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ ERROR: Golden set file not found at "${targetPath}".`);
    console.error("\nTo run the evaluation harness:");
    console.error("  1. Copy the template:  cp eval/golden-set.template.json eval/golden-set.json");
    console.error("  2. Replace 'TODO_HUMAN_REVIEW' placeholders with real questions, document IDs, and expected chunk IDs.");
    console.error("  3. Run:                npm run eval\n");
    process.exit(1);
  }

  // 2. Parse Golden Set JSON
  let rawData: string;
  let testCases: TestCase[];

  try {
    rawData = fs.readFileSync(resolvedPath, "utf-8");
    testCases = JSON.parse(rawData);
  } catch (parseErr) {
    console.error(`❌ ERROR: Failed to parse JSON file at "${targetPath}":`, parseErr);
    process.exit(1);
  }

  if (!Array.isArray(testCases)) {
    console.error(`❌ ERROR: Expected JSON array of test cases in "${targetPath}".`);
    process.exit(1);
  }

  console.log(`📁 Loaded golden set: "${targetPath}" (${testCases.length} total entries)\n`);

  let skippedCount = 0;
  let evaluatedCount = 0;
  const results: CaseResult[] = [];

  // 3. Process test cases
  for (const testCase of testCases) {
    const isTodoQuestion = typeof testCase.question === "string" && testCase.question.includes("TODO_HUMAN_REVIEW");
    const isTodoDoc = typeof testCase.documentId === "string" && testCase.documentId.includes("TODO_HUMAN_REVIEW");
    const isTodoChunks =
      typeof testCase.expectedChunkIds === "string"
        ? testCase.expectedChunkIds.includes("TODO_HUMAN_REVIEW")
        : !Array.isArray(testCase.expectedChunkIds);

    if (isTodoQuestion || isTodoDoc || isTodoChunks) {
      skippedCount++;
      continue;
    }

    evaluatedCount++;
    const expectedIds = Array.isArray(testCase.expectedChunkIds) ? testCase.expectedChunkIds : [];

    // Perform vector similarity retrieval (k=5) using default system user scope
    try {
      const queryEmbeddingRes = await generateEmbedding(testCase.question);
      const retrievedChunks = await searchSimilarChunks(
        "eval_user",
        queryEmbeddingRes.embedding,
        5,
        testCase.documentId !== "*" ? testCase.documentId : undefined
      );

      const retrievedIds = retrievedChunks.map((c) => c.id);
      const hit = hitAtK(expectedIds, retrievedIds);
      const rr = reciprocalRank(expectedIds, retrievedIds);

      // Find 1-indexed rank matching expected ID
      let rankDisplay = "Miss";
      if (hit) {
        const matchingIdx = retrievedIds.findIndex((id) => expectedIds.includes(id));
        rankDisplay = `#${matchingIdx + 1}`;
      }

      results.push({
        id: testCase.id,
        question: testCase.question,
        hit,
        mrr: rr,
        rank: rankDisplay,
      });
    } catch (err) {
      console.error(`⚠️ Error evaluating case "${testCase.id}":`, err);
      results.push({
        id: testCase.id,
        question: testCase.question,
        hit: false,
        mrr: 0,
        rank: "Error",
      });
    }
  }

  // 4. Output Results Table
  console.log("----------------------------------------------------------------------------------");
  console.log("ID         | Question (truncated 45 chars)             | Hit@5 | Rank  | Recip. Rank");
  console.log("----------------------------------------------------------------------------------");

  if (results.length === 0) {
    console.log("  (No fully-configured test cases were evaluated. All items contain TODOs.)");
  } else {
    for (const res of results) {
      const qSnippet = res.question.length > 45 ? res.question.slice(0, 42) + "..." : res.question.padEnd(45);
      const hitSymbol = res.hit ? "✅ Pass" : "❌ Fail";
      const rrDisplay = res.mrr.toFixed(2);
      console.log(`${res.id.padEnd(10)} | ${qSnippet} | ${hitSymbol.padEnd(5)} | ${res.rank.padEnd(5)} | ${rrDisplay}`);
    }
  }

  console.log("----------------------------------------------------------------------------------\n");

  // 5. Calculate Metrics Summary
  const hitCount = results.filter((r) => r.hit).length;
  const hitRate = evaluatedCount > 0 ? hitCount / evaluatedCount : 0;
  const meanReciprocalRank = evaluatedCount > 0 ? results.reduce((acc, r) => acc + r.mrr, 0) / evaluatedCount : 0;

  console.log("=================================================");
  console.log(" 📊 EVALUATION SUMMARY REPORT");
  console.log("=================================================");
  console.log(`  Total Cases in File : ${testCases.length}`);
  console.log(`  Evaluated Cases     : ${evaluatedCount}`);
  console.log(`  Skipped (TODOs)     : ${skippedCount}`);
  console.log(`  Hit@5 Rate          : ${(hitRate * 100).toFixed(1)}% (${hitCount}/${evaluatedCount})`);
  console.log(`  Mean Reciprocal Rank: ${meanReciprocalRank.toFixed(3)}`);
  console.log("=================================================\n");

  if (evaluatedCount === 0) {
    console.log("ℹ️  Note: All cases were skipped due to 'TODO_HUMAN_REVIEW' placeholders.");
    console.log("Fill in real questions and expected chunk IDs in golden-set.json to calculate accuracy.\n");
    process.exit(0);
  }

  // 6. Exit code threshold enforcement (CI Ready)
  const THRESHOLD = 0.8;
  if (hitRate < THRESHOLD) {
    console.error(`❌ EVAL FAILURE: Hit@5 rate (${(hitRate * 100).toFixed(1)}%) is below the required 80.0% threshold.`);
    process.exit(1);
  } else {
    console.log(`✅ EVAL PASSED: Hit@5 rate (${(hitRate * 100).toFixed(1)}%) meets the required 80.0% threshold.`);
    process.exit(0);
  }
}

runEval().catch((err) => {
  console.error("Unhandled evaluation runner error:", err);
  process.exit(1);
});
