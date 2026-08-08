import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { documentUploadSchema } from "@/lib/validations";
import { uploadFileToStorage } from "@/lib/storage";
import { extractTextFromPdf, chunkDocumentText, generateEmbedding } from "@/lib/llm";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await db.document.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        filename: true,
        storageUrl: true,
        status: true,
        createdAt: true,
        _count: {
          select: { chunks: true },
        },
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Fetch documents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const validationResult = documentUploadSchema.safeParse({
      filename: file.name,
      size: file.size,
      contentType: file.type,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid file upload",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Convert file to buffer for text parsing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Upload to storage
    const storageResult = await uploadFileToStorage(file, file.name);

    // 2. Create database Document row with status 'pending'
    const document = await db.document.create({
      data: {
        userId: session.user.id,
        filename: storageResult.filename,
        storageUrl: storageResult.url,
        status: "pending",
      },
    });

    // 3. Process PDF text extraction, chunking, and embedding generation asynchronously
    (async () => {
      try {
        await db.document.update({
          where: { id: document.id },
          data: { status: "processing" },
        });

        // Extract raw text from PDF
        const extractedText = await extractTextFromPdf(buffer);

        if (!extractedText.trim()) {
          throw new Error("No readable text found in PDF document.");
        }

        // Chunk text by semantic blocks (~500 tokens / 50 token overlap)
        const textChunks = chunkDocumentText(extractedText);

        if (textChunks.length === 0) {
          throw new Error("Failed to generate text chunks from document.");
        }

        // Generate vector embeddings and save chunks in parallelized batches (concurrency of 5)
        const BATCH_SIZE = 5;
        for (let i = 0; i < textChunks.length; i += BATCH_SIZE) {
          const batch = textChunks.slice(i, i + BATCH_SIZE);
          await Promise.all(
            batch.map(async (chunk) => {
              const embeddingRes = await generateEmbedding(chunk.content);
              const vectorSql = `[${embeddingRes.embedding.join(",")}]`;
              const chunkId = `chunk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

              await db.$executeRawUnsafe(
                `INSERT INTO "Chunk" ("id", "documentId", "content", "embedding", "chunkIndex") VALUES ($1, $2, $3, $4::vector, $5)`,
                chunkId,
                document.id,
                chunk.content,
                vectorSql,
                chunk.chunkIndex
              );
            })
          );
        }

        // Mark document status 'ready'
        await db.document.update({
          where: { id: document.id },
          data: { status: "ready" },
        });
      } catch (procError) {
        console.error(`Document processing failed for ${document.id}:`, procError);
        try {
          await db.document.update({
            where: { id: document.id },
            data: { status: "failed" },
          });
        } catch (updateErr) {
          console.error(`Failed to set document status 'failed' for ${document.id}:`, updateErr);
        }
      }
    })();

    return NextResponse.json(
      {
        message: "Document uploaded and processing started",
        document,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "An error occurred while uploading document" },
      { status: 500 }
    );
  }
}
