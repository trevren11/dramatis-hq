import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents, documentAccessLogs } from "@/lib/db/schema";
import { uploadToS3, generateDocumentKey } from "@/lib/storage";
import { encryptDocument } from "@/lib/encryption";
import {
  documentUploadSchema,
  validateFileType,
  validateFileSize,
  getFileSizeError,
} from "@/lib/validations/documents";
import { ALLOWED_DOCUMENT_TYPES } from "@/lib/db/schema/documents";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const documentType = formData.get("documentType") as string | null;
    const description = formData.get("description") as string | null;
    const taxYearStr = formData.get("taxYear") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!validateFileType(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (!validateFileSize(file.size)) {
      return NextResponse.json({ error: getFileSizeError() }, { status: 400 });
    }

    // Parse and validate metadata
    const taxYear = taxYearStr ? parseInt(taxYearStr, 10) : undefined;
    const parsed = documentUploadSchema.safeParse({
      name: name ?? file.name,
      documentType,
      description,
      taxYear: Number.isNaN(taxYear) ? undefined : taxYear,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Encrypt the file content
    const { encryptedData, iv, authTag, salt } = encryptDocument(fileBuffer);

    // Generate document ID and S3 key
    const documentId = crypto.randomUUID();
    const s3Key = generateDocumentKey(session.user.id, documentId, file.name);

    // Upload encrypted content to S3
    await uploadToS3(s3Key, encryptedData, "application/octet-stream", {
      originalMimeType: file.type,
      documentId,
    });

    // Store document metadata in database
    const [newDocument] = await db
      .insert(documents)
      .values({
        id: documentId,
        ownerId: session.user.id,
        uploadedById: session.user.id,
        documentType: parsed.data.documentType,
        name: parsed.data.name,
        originalFilename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        s3Key,
        encryptionSalt: salt,
        encryptionIv: iv,
        encryptionAuthTag: authTag,
        isProducerUploaded: false,
        description: parsed.data.description,
        taxYear: parsed.data.taxYear,
      })
      .returning();

    if (!newDocument) {
      throw new Error("Failed to create document record");
    }

    // Log the upload
    await db.insert(documentAccessLogs).values({
      documentId: newDocument.id,
      userId: session.user.id,
      action: "upload",
      ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json(
      {
        document: {
          id: newDocument.id,
          name: newDocument.name,
          documentType: newDocument.documentType,
          mimeType: newDocument.mimeType,
          fileSize: newDocument.fileSize,
          createdAt: newDocument.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
