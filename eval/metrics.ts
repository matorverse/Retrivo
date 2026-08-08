/**
 * Pure evaluation metric calculation functions for vector retrieval benchmarking.
 */

/**
 * Calculates Hit@K — returns true if at least one expected chunk ID is present in the retrieved list.
 * Formula: Hit@K = 1 if |Expected ∩ Retrieved[:K]| > 0 else 0
 */
export function hitAtK(expectedChunkIds: string[], retrievedChunkIds: string[]): boolean {
  if (!expectedChunkIds || expectedChunkIds.length === 0 || !retrievedChunkIds) {
    return false;
  }
  const expectedSet = new Set(expectedChunkIds);
  return retrievedChunkIds.some((id) => expectedSet.has(id));
}

/**
 * Calculates Reciprocal Rank (RR) — returns 1 / (1-indexed rank of first relevant chunk) or 0 if unretrieved.
 * Formula: RR = 1 / min({ rank(c) | c ∈ Expected }) if match found else 0
 */
export function reciprocalRank(expectedChunkIds: string[], retrievedChunkIds: string[]): number {
  if (!expectedChunkIds || expectedChunkIds.length === 0 || !retrievedChunkIds) {
    return 0;
  }
  const expectedSet = new Set(expectedChunkIds);
  for (let idx = 0; idx < retrievedChunkIds.length; idx++) {
    if (expectedSet.has(retrievedChunkIds[idx])) {
      return 1 / (idx + 1);
    }
  }
  return 0;
}
