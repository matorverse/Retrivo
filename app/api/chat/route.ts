import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { generateEmbedding, generateCitedResponse } from "@/lib/llm";
import { searchSimilarChunks } from "@/lib/rag";

const chatQuerySchema = z.object({
  query: z.string().min(1, "Query cannot be empty").max(2000, "Query too long"),
  documentId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = chatQuerySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid query", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { query, documentId } = validated.data;
    const targetDocId = documentId && documentId.trim() !== "" ? documentId : undefined;

    // 1. Embed query
    const queryEmbeddingRes = await generateEmbedding(query);

    // 2. Vector search over current user's chunks only
    const topChunks = await searchSimilarChunks(
      session.user.id,
      queryEmbeddingRes.embedding,
      5,
      targetDocId
    );

    // 3. Generate cited answer with system prompt enforcing source citations
    const citedResponse = await generateCitedResponse(
      query,
      topChunks.map((c) => ({
        id: c.id,
        filename: c.filename,
        chunkIndex: c.chunkIndex,
        content: c.content,
      }))
    );

    return NextResponse.json({
      answer: citedResponse.answer,
      citations: citedResponse.citations,
      chunksRetrieved: topChunks.length,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "An error occurred while generating response" },
      { status: 500 }
    );
  }
}
