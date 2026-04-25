import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ALLOWED_DOCUMENT_TYPES } from "@/lib/db/schema/documents";
import { TAX_DOCUMENT_TYPES } from "@/lib/db/schema/producer-documents";
import {
  bulkProducerDocumentUploadSchema,
  validateFileType,
  validateFileSize,
  getFileSizeError,
} from "@/lib/validations/producer-documents";
import {
  uploadProducerDocument,
  canUploadTaxDocuments,
  getUserOrganizationId,
} from "@/lib/services/producer-documents";
import { eq } from "drizzle-orm";

interface UploadResult {
  talentUserId: string;
  success: boolean;
  documentId?: string;
  producerDocumentId?: string;
  error?: string;
}

interface BulkUploadContext {
  formData: FormData;
  parsedData: ReturnType<typeof bulkProducerDocumentUploadSchema.parse>;
  uploaderId: string;
  organizationId: string;
  ipAddress: string | null;
  userAgent: string | null;
}

function validateFileForUpload(file: File | null, talentUserId: string): UploadResult | null {
  if (!file) {
    return { talentUserId, success: false, error: "No file provided" };
  }
  if (!validateFileType(file.type)) {
    return {
      talentUserId,
      success: false,
      error: `Invalid file type. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(", ")}`,
    };
  }
  if (!validateFileSize(file.size)) {
    return { talentUserId, success: false, error: getFileSizeError() };
  }
  return null;
}

async function processUpload(
  ctx: BulkUploadContext,
  uploadItem: { talentUserId: string; name?: string },
  file: File
): Promise<UploadResult> {
  const talentUser = await db.query.users.findFirst({
    where: eq(users.id, uploadItem.talentUserId),
  });

  if (talentUser?.userType !== "talent") {
    return { talentUserId: uploadItem.talentUserId, success: false, error: "Invalid talent user" };
  }

  const arrayBuffer = await file.arrayBuffer();
  const result = await uploadProducerDocument({
    file: { name: file.name, type: file.type, size: file.size, buffer: Buffer.from(arrayBuffer) },
    input: {
      name: uploadItem.name ?? file.name,
      documentType: ctx.parsedData.documentType,
      talentUserId: uploadItem.talentUserId,
      showId: ctx.parsedData.showId,
      year: ctx.parsedData.year,
      deadline: ctx.parsedData.deadline,
      notes: ctx.parsedData.notes,
      sendNotification: ctx.parsedData.sendNotification,
    },
    uploaderId: ctx.uploaderId,
    organizationId: ctx.organizationId,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  return {
    talentUserId: uploadItem.talentUserId,
    success: true,
    documentId: result.documentId,
    producerDocumentId: result.producerDocumentId,
  };
}

async function processBulkUploads(ctx: BulkUploadContext): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < ctx.parsedData.uploads.length; i++) {
    const uploadItem = ctx.parsedData.uploads[i];
    if (!uploadItem) continue;

    const file = ctx.formData.get(`file_${String(i)}`) as File | null;
    const validationError = validateFileForUpload(file, uploadItem.talentUserId);
    if (validationError || !file) {
      results.push(
        validationError ?? {
          talentUserId: uploadItem.talentUserId,
          success: false,
          error: "No file",
        }
      );
      continue;
    }

    try {
      results.push(await processUpload(ctx, uploadItem, file));
    } catch (error) {
      results.push({
        talentUserId: uploadItem.talentUserId,
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  }

  return results;
}

/**
 * POST /api/producer/documents/bulk
 * Upload documents for multiple talents at once
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
    if (user?.userType !== "producer") {
      return NextResponse.json(
        { error: "Only producers can upload documents for talent" },
        { status: 403 }
      );
    }

    const organizationId = await getUserOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 400 });
    }

    const formData = await request.formData();
    const metadataStr = formData.get("metadata") as string | null;
    if (!metadataStr) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    let metadata: unknown;
    try {
      metadata = JSON.parse(metadataStr);
    } catch {
      return NextResponse.json({ error: "Invalid metadata JSON" }, { status: 400 });
    }

    const parsed = bulkProducerDocumentUploadSchema.safeParse(metadata);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const isTaxDocument = TAX_DOCUMENT_TYPES.includes(
      parsed.data.documentType as (typeof TAX_DOCUMENT_TYPES)[number]
    );
    if (isTaxDocument && !(await canUploadTaxDocuments(session.user.id, organizationId))) {
      return NextResponse.json(
        { error: "Only organization owners and admins can upload tax documents" },
        { status: 403 }
      );
    }

    const results = await processBulkUploads({
      formData,
      parsedData: parsed.data,
      uploaderId: session.user.id,
      organizationId,
      ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent"),
    });

    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;

    return NextResponse.json(
      { results, summary: { total: results.length, successful, failed } },
      { status: failed === results.length ? 400 : 201 }
    );
  } catch (error) {
    console.error("Error bulk uploading documents:", error);
    return NextResponse.json({ error: "Failed to upload documents" }, { status: 500 });
  }
}
