export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { media, type MediaMetadata } from "@/lib/db/schema";
import { uploadFile, generateKey } from "@/lib/storage";
import { validateFile, validateFileContent } from "@/lib/storage/validation";

const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 25MB limit" }, { status: 400 });
    }

    // Validate MIME type
    const fileValidation = validateFile(file.size, file.type, "document");
    if (!fileValidation.valid) {
      return NextResponse.json({ error: fileValidation.error }, { status: 400 });
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file content matches declared type
    const contentValidation = validateFileContent(buffer, file.type, "document");
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.error }, { status: 400 });
    }

    // Get file extension from MIME type
    const extMap: Record<string, string> = {
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    };
    const ext = extMap[file.type] ?? "pdf";

    // Generate storage key
    const timestamp = String(Date.now());
    const key = generateKey(userId, `${timestamp}.${ext}`, "document");

    // Upload document
    const uploadResult = await uploadFile({
      buffer,
      key,
      type: "document",
      contentType: file.type,
    });

    // Save to database
    const metadata: MediaMetadata = {
      originalFilename: file.name,
      processingStatus: "completed",
    };

    const result = await db
      .insert(media)
      .values({
        userId,
        type: "document",
        url: uploadResult.url,
        key: uploadResult.key,
        bucket: uploadResult.bucket,
        filename: file.name,
        contentType: file.type,
        size: String(buffer.length),
        metadata,
      })
      .returning({ id: media.id, url: media.url, key: media.key });

    const newMedia = result[0];
    if (!newMedia) {
      return NextResponse.json({ error: "Failed to save media record" }, { status: 500 });
    }

    return NextResponse.json(
      {
        id: newMedia.id,
        url: newMedia.url,
        key: newMedia.key,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
