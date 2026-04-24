export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { media, type MediaMetadata } from "@/lib/db/schema";
import { uploadFile, generateKey } from "@/lib/storage";
import { processHeadshot, generateThumbnail } from "@/lib/storage/image-processing";
import { validateFile, validateFileContent } from "@/lib/storage/validation";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

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
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    // Validate MIME type
    const fileValidation = validateFile(file.size, file.type, "headshot");
    if (!fileValidation.valid) {
      return NextResponse.json({ error: fileValidation.error }, { status: 400 });
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file content matches declared type
    const contentValidation = validateFileContent(buffer, file.type, "headshot");
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.error }, { status: 400 });
    }

    // Process image - convert to WebP and resize
    const processed = await processHeadshot(buffer);

    // Generate thumbnail
    const thumbnail = await generateThumbnail(buffer);

    // Generate storage keys
    const timestamp = String(Date.now());
    const key = generateKey(userId, `${timestamp}.webp`, "headshot");
    const thumbnailKey = generateKey(userId, `${timestamp}-thumb.webp`, "headshot");

    // Upload processed image and thumbnail
    const uploadResult = await uploadFile({
      buffer: processed.buffer,
      key,
      type: "headshot",
      contentType: processed.contentType,
    });

    await uploadFile({
      buffer: thumbnail.buffer,
      key: thumbnailKey,
      type: "headshot",
      contentType: thumbnail.contentType,
    });

    // Save to database
    const metadata: MediaMetadata = {
      width: processed.width,
      height: processed.height,
      thumbnailKey,
      originalFilename: file.name,
      processingStatus: "completed",
    };

    const result = await db
      .insert(media)
      .values({
        userId,
        type: "headshot",
        url: uploadResult.url,
        key: uploadResult.key,
        bucket: uploadResult.bucket,
        filename: file.name,
        contentType: processed.contentType,
        size: String(processed.buffer.length),
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
        width: processed.width,
        height: processed.height,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
