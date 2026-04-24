import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents, documentAccessLogs, users } from "@/lib/db/schema";
import { uploadDocument, generateDocumentKey } from "@/lib/storage/document-storage";
import { encryptDocument } from "@/lib/encryption";
import {
  producerDocumentUploadSchema,
  validateFileType,
  validateFileSize,
  getFileSizeError,
  type ProducerDocumentUploadInput,
} from "@/lib/validations/documents";
import { ALLOWED_DOCUMENT_TYPES } from "@/lib/db/schema/documents";
import { eq } from "drizzle-orm";

function validateFile(file: File | null): NextResponse | null {
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!validateFileType(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(", ")}` },
      { status: 400 }
    );
  }
  if (!validateFileSize(file.size)) {
    return NextResponse.json({ error: getFileSizeError() }, { status: 400 });
  }
  return null;
}

async function createDocumentRecord(
  file: File,
  parsed: { data: ProducerDocumentUploadInput },
  uploaderId: string,
  request: Request
): Promise<NextResponse> {
  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);
  const { encryptedData, iv, authTag, salt } = encryptDocument(fileBuffer);

  const documentId = crypto.randomUUID();
  const s3Key = generateDocumentKey(parsed.data.talentUserId, documentId, file.name);

  await uploadDocument(s3Key, encryptedData, "application/octet-stream", {
    originalMimeType: file.type,
    documentId,
    uploadedBy: uploaderId,
  });

  const [newDocument] = await db
    .insert(documents)
    .values({
      id: documentId,
      ownerId: parsed.data.talentUserId,
      uploadedById: uploaderId,
      documentType: parsed.data.documentType,
      name: parsed.data.name,
      originalFilename: file.name,
      mimeType: file.type,
      fileSize: file.size,
      s3Key,
      encryptionSalt: salt,
      encryptionIv: iv,
      encryptionAuthTag: authTag,
      isProducerUploaded: true,
      description: parsed.data.description,
      taxYear: parsed.data.taxYear,
    })
    .returning();

  if (!newDocument) {
    throw new Error("Failed to create document record");
  }

  await db.insert(documentAccessLogs).values({
    documentId: newDocument.id,
    userId: uploaderId,
    action: "upload",
    ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent"),
    metadata: JSON.stringify({ talentUserId: parsed.data.talentUserId }),
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
        talentUserId: parsed.data.talentUserId,
      },
    },
    { status: 201 }
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (user?.userType !== "producer") {
      return NextResponse.json(
        { error: "Only producers can upload documents for talent" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    const fileError = validateFile(file);
    if (fileError || !file) return fileError ?? NextResponse.json({ error: "No file" }, { status: 400 });

    const taxYearStr = formData.get("taxYear") as string | null;
    const taxYear = taxYearStr ? parseInt(taxYearStr, 10) : undefined;

    const parsed = producerDocumentUploadSchema.safeParse({
      name: (formData.get("name") as string | null) ?? file.name,
      documentType: formData.get("documentType"),
      description: formData.get("description"),
      taxYear: Number.isNaN(taxYear) ? undefined : taxYear,
      talentUserId: formData.get("talentUserId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const talentUser = await db.query.users.findFirst({
      where: eq(users.id, parsed.data.talentUserId),
    });

    if (talentUser?.userType !== "talent") {
      return NextResponse.json({ error: "Invalid talent user" }, { status: 400 });
    }

    return await createDocumentRecord(file, parsed, session.user.id, request);
  } catch (error) {
    console.error("Error uploading document for talent:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
