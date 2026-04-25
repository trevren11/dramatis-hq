import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ALLOWED_DOCUMENT_TYPES } from "@/lib/db/schema/documents";
import { TAX_DOCUMENT_TYPES } from "@/lib/db/schema/producer-documents";
import {
  producerDocumentUploadSchema,
  producerDocumentListSchema,
  validateFileType,
  validateFileSize,
  getFileSizeError,
} from "@/lib/validations/producer-documents";
import {
  uploadProducerDocument,
  listProducerDocuments,
  canUploadTaxDocuments,
  getUserOrganizationId,
} from "@/lib/services/producer-documents";
import { eq } from "drizzle-orm";

function validateFile(file: File | null): NextResponse | null {
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!validateFileType(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(", ")}` },
      { status: 400 }
    );
  }
  if (!validateFileSize(file.size))
    return NextResponse.json({ error: getFileSizeError() }, { status: 400 });
  return null;
}

interface FormDataFields {
  name: string;
  documentType: FormDataEntryValue | null;
  description: FormDataEntryValue | null;
  talentUserId: FormDataEntryValue | null;
  showId: FormDataEntryValue | undefined;
  year: number | undefined;
  deadline: Date | undefined;
  notes: FormDataEntryValue | null;
  sendNotification: boolean;
}

function parseFormDataFields(formData: FormData, fileName: string): FormDataFields {
  const yearStr = formData.get("year") as string | null;
  const year = yearStr ? parseInt(yearStr, 10) : undefined;
  const deadlineStr = formData.get("deadline") as string | null;
  const sendNotificationStr = formData.get("sendNotification") as string | null;

  return {
    name: (formData.get("name") as string | null) ?? fileName,
    documentType: formData.get("documentType"),
    description: formData.get("description"),
    talentUserId: formData.get("talentUserId"),
    showId: formData.get("showId") ?? undefined,
    year: Number.isNaN(year) ? undefined : year,
    deadline: deadlineStr ? new Date(deadlineStr) : undefined,
    notes: formData.get("notes"),
    sendNotification: sendNotificationStr !== "false",
  };
}

async function validateTaxDocAccess(
  documentType: string,
  userId: string,
  orgId: string
): Promise<NextResponse | null> {
  const isTax = TAX_DOCUMENT_TYPES.includes(documentType as (typeof TAX_DOCUMENT_TYPES)[number]);
  if (isTax && !(await canUploadTaxDocuments(userId, orgId))) {
    return NextResponse.json(
      { error: "Only organization owners and admins can upload tax documents" },
      { status: 403 }
    );
  }
  return null;
}

/**
 * POST /api/producer/documents
 * Upload a document for a talent
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
    if (user?.userType !== "producer") {
      return NextResponse.json(
        { error: "Only producers can upload documents for talent" },
        { status: 403 }
      );
    }

    const organizationId = await getUserOrganizationId(session.user.id);
    if (!organizationId)
      return NextResponse.json({ error: "Producer profile not found" }, { status: 400 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileError = validateFile(file);
    if (fileError || !file)
      return fileError ?? NextResponse.json({ error: "No file" }, { status: 400 });

    const parsed = producerDocumentUploadSchema.safeParse(parseFormDataFields(formData, file.name));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const taxError = await validateTaxDocAccess(
      parsed.data.documentType,
      session.user.id,
      organizationId
    );
    if (taxError) return taxError;

    const talentUser = await db.query.users.findFirst({
      where: eq(users.id, parsed.data.talentUserId),
    });
    if (talentUser?.userType !== "talent")
      return NextResponse.json({ error: "Invalid talent user" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const result = await uploadProducerDocument({
      file: { name: file.name, type: file.type, size: file.size, buffer: Buffer.from(arrayBuffer) },
      input: parsed.data,
      uploaderId: session.user.id,
      organizationId,
      ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json(
      {
        document: {
          id: result.producerDocumentId,
          documentId: result.documentId,
          name: parsed.data.name,
          documentType: parsed.data.documentType,
          talentUserId: parsed.data.talentUserId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading document for talent:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}

/**
 * GET /api/producer/documents
 * List producer documents with optional filters
 */
export async function GET(request: Request): Promise<NextResponse> {
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
        { error: "Only producers can access this endpoint" },
        { status: 403 }
      );
    }

    // Get producer's organization
    const organizationId = await getUserOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = producerDocumentListSchema.safeParse({
      showId: searchParams.get("showId") ?? undefined,
      talentProfileId: searchParams.get("talentProfileId") ?? undefined,
      documentType: searchParams.get("documentType") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      year: searchParams.get("year") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await listProducerDocuments(organizationId, parsed.data);

    return NextResponse.json({
      documents: result.documents,
      total: result.total,
      page: parsed.data.page,
      limit: parsed.data.limit,
      totalPages: Math.ceil(result.total / parsed.data.limit),
    });
  } catch (error) {
    console.error("Error listing producer documents:", error);
    return NextResponse.json({ error: "Failed to list documents" }, { status: 500 });
  }
}
