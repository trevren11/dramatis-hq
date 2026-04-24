export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { generateKey, getSignedUploadUrl, type MediaType } from "@/lib/storage";
import { validateMimeType, SIZE_LIMITS } from "@/lib/storage/validation";

const presignedRequestSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  type: z.enum(["headshot", "video", "document"]),
  size: z.number().positive(),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = presignedRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { filename, contentType, type, size } = parsed.data;
    const mediaType: MediaType = type;

    // Validate MIME type for the requested media type
    const mimeValidation = validateMimeType(contentType, mediaType);
    if (!mimeValidation.valid) {
      return NextResponse.json({ error: mimeValidation.error }, { status: 400 });
    }

    // Validate file size
    const sizeLimit = SIZE_LIMITS[mediaType];
    if (size > sizeLimit) {
      const limitMB = String(Math.round(sizeLimit / (1024 * 1024)));
      return NextResponse.json({ error: `File size exceeds ${limitMB}MB limit` }, { status: 400 });
    }

    // Generate storage key
    const key = generateKey(userId, filename, mediaType);

    // Generate presigned upload URL (valid for 1 hour)
    const uploadUrl = await getSignedUploadUrl(key, mediaType, contentType, 3600);

    return NextResponse.json({
      uploadUrl,
      key,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Presigned URL error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
