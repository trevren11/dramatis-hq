import "server-only";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client, getBucket, uploadFile, deleteFile } from "./index";

/**
 * Upload encrypted document content to S3
 */
export async function uploadDocument(
  key: string,
  content: Buffer,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ key: string; url: string }> {
  const result = await uploadFile({
    buffer: content,
    key,
    type: "document",
    contentType,
    metadata,
  });
  return { key: result.key, url: result.url };
}

/**
 * Download content from S3 documents bucket
 */
export async function downloadDocument(key: string): Promise<Buffer> {
  const client = getS3Client();
  const bucket = getBucket("document");

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  if (!response.Body) {
    throw new Error("Empty response body from S3");
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Delete document from S3
 */
export async function deleteDocument(key: string): Promise<void> {
  await deleteFile(key, "document");
}

/**
 * Generate S3 key for document storage
 */
export function generateDocumentKey(userId: string, documentId: string, filename: string): string {
  const ext = filename.split(".").pop() ?? "";
  return `${userId}/${documentId}.${ext}`;
}
