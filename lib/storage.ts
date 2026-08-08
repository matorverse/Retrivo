import { put } from "@vercel/blob";

export interface StorageUploadResult {
  url: string;
  filename: string;
}

/**
 * Handles file storage uploading to Vercel Blob or fallback mock storage URL
 */
export async function uploadFileToStorage(
  file: File | Buffer,
  filename: string
): Promise<StorageUploadResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    try {
      const blob = await put(`documents/${Date.now()}-${filename}`, file, {
        access: "public",
        token: token,
      });
      return {
        url: blob.url,
        filename: filename,
      };
    } catch (error) {
      console.error("Vercel Blob upload error:", error);
      // Fallback to local mock path if Vercel Blob fails
    }
  }

  // Fallback storage URL for local development / testing without cloud credentials
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const mockUrl = `/uploads/${Date.now()}_${sanitizedFilename}`;

  return {
    url: mockUrl,
    filename: filename,
  };
}
