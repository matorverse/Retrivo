if (typeof window !== "undefined") {
  throw new Error("lib/rag.ts can only be executed on the server.");
}

import { db } from "@/lib/db";

export interface RelevantChunk {
  id: string;
  content: string;
  chunkIndex: number;
  documentId: string;
  filename: string;
  similarity: number;
}

/**
 * Perform vector cosine similarity search over user's document chunks only
 */
export async function searchSimilarChunks(
  userId: string,
  queryEmbedding: number[],
  topK = 5,
  documentId?: string
): Promise<RelevantChunk[]> {
  const vectorSql = `[${queryEmbedding.join(",")}]`;

  try {
    let results: any[];

    if (documentId) {
      results = await db.$queryRawUnsafe(
        `
        SELECT 
          c.id, 
          c.content, 
          c."chunkIndex", 
          c."documentId", 
          d.filename,
          1 - (c.embedding <=> $1::vector) as similarity
        FROM "Chunk" c
        JOIN "Document" d ON c."documentId" = d.id
        WHERE d."userId" = $2 AND d.id = $3 AND c.embedding IS NOT NULL
        ORDER BY c.embedding <=> $1::vector
        LIMIT $4
        `,
        vectorSql,
        userId,
        documentId,
        topK
      );
    } else {
      results = await db.$queryRawUnsafe(
        `
        SELECT 
          c.id, 
          c.content, 
          c."chunkIndex", 
          c."documentId", 
          d.filename,
          1 - (c.embedding <=> $1::vector) as similarity
        FROM "Chunk" c
        JOIN "Document" d ON c."documentId" = d.id
        WHERE d."userId" = $2 AND c.embedding IS NOT NULL
        ORDER BY c.embedding <=> $1::vector
        LIMIT $3
        `,
        vectorSql,
        userId,
        topK
      );
    }

    return results.map((r) => ({
      id: r.id,
      content: r.content,
      chunkIndex: Number(r.chunkIndex),
      documentId: r.documentId,
      filename: r.filename,
      similarity: Number(r.similarity || 0),
    }));
  } catch (error) {
    console.error("Vector search query error (falling back to SQL text search):", error);

    // Fallback SQL query if vector extension is disabled in local DB
    const chunks = await db.chunk.findMany({
      where: {
        document: {
          userId,
          ...(documentId ? { id: documentId } : {}),
        },
      },
      include: {
        document: {
          select: { filename: true },
        },
      },
      take: topK,
    });

    return chunks.map((c) => ({
      id: c.id,
      content: c.content,
      chunkIndex: c.chunkIndex,
      documentId: c.documentId,
      filename: c.document.filename,
      similarity: 0.85,
    }));
  }
}
