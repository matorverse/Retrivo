import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const document = await db.document.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        chunks: {
          take: 10,
          orderBy: { chunkIndex: "asc" },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.chunks.length === 0) {
      return NextResponse.json(
        { error: "Document text has not finished processing yet." },
        { status: 400 }
      );
    }

    // Generate practice quiz questions based on document chunks
    const questions = document.chunks.slice(0, 5).map((chunk, idx) => {
      const snippet = chunk.content.slice(0, 100).trim();
      return {
        id: `q_${chunk.id}_${idx}`,
        question: `Based on chunk #${chunk.chunkIndex} of ${document.filename}: What key concept is discussed in this section?`,
        options: [
          `Key concept regarding "${snippet.slice(0, 45)}..."`,
          `Alternative theory unrelated to ${document.filename}`,
          `General background overview of peripheral topics`,
          `Methodology details outside the core scope`,
        ],
        correctIndex: 0,
        explanation: `This question tests comprehension of chunk #${chunk.chunkIndex}: "${snippet}..."`,
        chunkIndex: chunk.chunkIndex,
        filename: document.filename,
      };
    });

    return NextResponse.json({
      documentId: document.id,
      filename: document.filename,
      questions,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate practice quiz" },
      { status: 500 }
    );
  }
}
