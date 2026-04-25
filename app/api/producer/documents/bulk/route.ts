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

    // Verify user is a producer
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (user?.userType !== "producer") {
      return NextResponse.json(
        { error: "Only producers can upload documents for talent" },
        { status: 403 }
      );
    }

    // Get producer's organization
    const organizationId = await getUserOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: "Producer profile not found" },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    // Parse the JSON metadata
    const metadataStr = formData.get("metadata") as string | null;
    if (!metadataStr) {
      return NextResponse.json(
        { error: "Missing metadata" },
        { status: 400 }
      );
    }

    let metadata: unknown;
    try {
      metadata = JSON.parse(metadataStr);
    } catch {
      return NextResponse.json(
        { error: "Invalid metadata JSON" },
        { status: 400 }
      );
    }

    const parsed = bulkProducerDocumentUploadSchema.safeParse(metadata);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check if this is a tax document - requires owner/admin role
    const isTaxDocument = TAX_DOCUMENT_TYPES.includes(
      parsed.data.documentType as (typeof TAX_DOCUMENT_TYPES)[number]
    );
    if (isTaxDocument) {
      const canUpload = await canUploadTaxDocuments(session.user.id, organizationId);
      if (!canUpload) {
        return NextResponse.json(
          { error: "Only organization owners and admins can upload tax documents" },
          { status: 403 }
        );
      }
    }

    // Process each upload
    const results: UploadResult[] = [];
    const ipAddress = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    for (let i = 0; i < parsed.data.uploads.length; i++) {
      const uploadItem = parsed.data.uploads[i];
      if (!uploadItem) continue;

      const file = formData.get(`file_${i}`) as File | null;

      if (!file) {
        results.push({
          talentUserId: uploadItem.talentUserId,
          success: false,
          error: "No file provided",
        });
        continue;
      }

      if (!validateFileType(file.type)) {
        results.push({
          talentUserId: uploadItem.talentUserId,
          success: false,
          error: `Invalid file type. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(", ")}`,
        });
        continue;
      }

      if (!validateFileSize(file.size)) {
        results.push({
          talentUserId: uploadItem.talentUserId,
          success: false,
          error: getFileSizeError(),
        });
        continue;
      }

      // Verify the talent user exists and is a talent
      const talentUser = await db.query.users.findFirst({
        where: eq(users.id, uploadItem.talentUserId),
      });

      if (talentUser?.userType !== "talent") {
        results.push({
          talentUserId: uploadItem.talentUserId,
          success: false,
          error: "Invalid talent user",
        });
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        const result = await uploadProducerDocument({
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            buffer: fileBuffer,
          },
          input: {
            name: uploadItem.name ?? file.name,
            documentType: parsed.data.documentType,
            talentUserId: uploadItem.talentUserId,
            showId: parsed.data.showId,
            year: parsed.data.year,
            deadline: parsed.data.deadline,
            notes: parsed.data.notes,
            sendNotification: parsed.data.sendNotification,
          },
          uploaderId: session.user.id,
          organizationId,
          ipAddress,
          userAgent,
        });

        results.push({
          talentUserId: uploadItem.talentUserId,
          success: true,
          documentId: result.documentId,
          producerDocumentId: result.producerDocumentId,
        });
      } catch (error) {
        results.push({
          talentUserId: uploadItem.talentUserId,
          success: false,
          error: error instanceof Error ? error.message : "Upload failed",
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json(
      {
        results,
        summary: {
          total: results.length,
          successful,
          failed,
        },
      },
      { status: failed === results.length ? 400 : 201 }
    );
  } catch (error) {
    console.error("Error bulk uploading documents:", error);
    return NextResponse.json({ error: "Failed to upload documents" }, { status: 500 });
  }
}
