import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  documents,
  documentAccessLogs,
  producerDocuments,
  users,
  talentProfiles,
  shows,
  producerProfiles,
  type DocumentType,
  type ProducerDocumentStatus,
} from "@/lib/db/schema";
import { uploadDocument, generateDocumentKey } from "@/lib/storage/document-storage";
import { encryptDocument } from "@/lib/encryption";
import { emailService } from "@/lib/email/service";
import { getOrganizationMembership } from "@/lib/permissions/helpers";
import type { ProducerDocumentUploadInput } from "@/lib/validations/producer-documents";
import { TaxDocumentUploadedEmail } from "@/lib/email/templates/production/tax-document-uploaded";

// Re-export compliance functions for backward compatibility
export { getComplianceStatus, setComplianceDeadline } from "./compliance";

interface UploadProducerDocumentParams {
  file: { name: string; type: string; size: number; buffer: Buffer };
  input: ProducerDocumentUploadInput;
  uploaderId: string;
  organizationId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface ProducerDocumentWithDetails {
  id: string;
  documentId: string;
  documentType: DocumentType;
  name: string;
  mimeType: string;
  fileSize: number;
  status: ProducerDocumentStatus;
  year: number | null;
  deadline: Date | null;
  notes: string | null;
  viewedAt: Date | null;
  downloadedAt: Date | null;
  createdAt: Date;
  talent: { id: string; userId: string; firstName: string; lastName: string; email: string };
  show?: { id: string; title: string } | null;
}

interface DeleteDocumentParams {
  producerDocumentId: string;
  organizationId: string;
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Check if user can upload tax documents for an organization
 */
export async function canUploadTaxDocuments(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const membership = await getOrganizationMembership(userId, organizationId);
  if (!membership) return false;
  return membership.role === "owner" || membership.role === "admin";
}

/**
 * Get organization ID for a user
 */
export async function getUserOrganizationId(userId: string): Promise<string | null> {
  const profile = await db.query.producerProfiles.findFirst({
    where: eq(producerProfiles.userId, userId),
    columns: { id: true },
  });
  return profile?.id ?? null;
}

/**
 * Upload a document for a talent from a producer
 */
export async function uploadProducerDocument(
  params: UploadProducerDocumentParams
): Promise<{ documentId: string; producerDocumentId: string }> {
  const { file, input, uploaderId, organizationId, ipAddress, userAgent } = params;

  const talentProfile = await db.query.talentProfiles.findFirst({
    where: eq(talentProfiles.userId, input.talentUserId),
    columns: { id: true },
  });

  if (!talentProfile) {
    throw new Error("Talent profile not found");
  }

  const { encryptedData, iv, authTag, salt } = encryptDocument(file.buffer);
  const documentId = crypto.randomUUID();
  const s3Key = generateDocumentKey(input.talentUserId, documentId, file.name);

  await uploadDocument(s3Key, encryptedData, "application/octet-stream", {
    originalMimeType: file.type,
    documentId,
    uploadedBy: uploaderId,
  });

  const [newDocument] = await db
    .insert(documents)
    .values({
      id: documentId,
      ownerId: input.talentUserId,
      uploadedById: uploaderId,
      documentType: input.documentType,
      name: input.name,
      originalFilename: file.name,
      mimeType: file.type,
      fileSize: file.size,
      s3Key,
      encryptionSalt: salt,
      encryptionIv: iv,
      encryptionAuthTag: authTag,
      isProducerUploaded: true,
      description: input.description,
      taxYear: input.year,
    })
    .returning();

  if (!newDocument) throw new Error("Failed to create document record");

  const [producerDoc] = await db
    .insert(producerDocuments)
    .values({
      documentId: newDocument.id,
      organizationId,
      showId: input.showId,
      talentProfileId: talentProfile.id,
      documentType: input.documentType,
      year: input.year,
      status: "pending",
      uploadedBy: uploaderId,
      deadline: input.deadline,
      notes: input.notes,
    })
    .returning();

  if (!producerDoc) throw new Error("Failed to create producer document record");

  await db.insert(documentAccessLogs).values({
    documentId: newDocument.id,
    userId: uploaderId,
    action: "upload",
    ipAddress,
    userAgent,
    metadata: JSON.stringify({
      talentUserId: input.talentUserId,
      talentProfileId: talentProfile.id,
      organizationId,
      showId: input.showId,
      producerDocumentId: producerDoc.id,
    }),
  });

  if (input.sendNotification) {
    await sendDocumentNotification({
      producerDocumentId: producerDoc.id,
      documentId: newDocument.id,
      talentUserId: input.talentUserId,
      documentType: input.documentType,
      documentName: input.name,
      organizationId,
      showId: input.showId,
      year: input.year,
    });
  }

  return { documentId: newDocument.id, producerDocumentId: producerDoc.id };
}

async function sendDocumentNotification(params: {
  producerDocumentId: string;
  documentId: string;
  talentUserId: string;
  documentType: DocumentType;
  documentName: string;
  organizationId: string;
  showId?: string;
  year?: number;
}): Promise<void> {
  const talent = await db.query.users.findFirst({
    where: eq(users.id, params.talentUserId),
    columns: { id: true, email: true, firstName: true, lastName: true },
  });

  if (!talent?.email) return;

  const org = await db.query.producerProfiles.findFirst({
    where: eq(producerProfiles.id, params.organizationId),
    columns: { organizationName: true, companyName: true },
  });

  let showTitle: string | undefined;
  if (params.showId) {
    const show = await db.query.shows.findFirst({
      where: eq(shows.id, params.showId),
      columns: { title: true },
    });
    showTitle = show?.title;
  }

  const orgName = org?.organizationName ?? org?.companyName ?? "A producer";
  const recipientName = [talent.firstName, talent.lastName].filter(Boolean).join(" ") || "there";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://dramatishq.com";
  const documentUrl = `${appUrl}/documents/${params.documentId}`;

  const result = await emailService.send({
    to: talent.email,
    userId: talent.id,
    type: "document_shared",
    subject: `New document from ${orgName}: ${params.documentName}`,
    react: TaxDocumentUploadedEmail({
      recipientName,
      organizationName: orgName,
      showTitle,
      documentName: params.documentName,
      documentType: params.documentType as "W2" | "1099" | "I9" | "Contract" | "CallSheet" | "Other",
      year: params.year,
      documentUrl,
    }),
    metadata: {
      documentId: params.documentId,
      producerDocumentId: params.producerDocumentId,
      documentType: params.documentType,
    },
  });

  if (result.success) {
    await db
      .update(producerDocuments)
      .set({ status: "delivered", notificationSentAt: new Date(), emailId: result.id, updatedAt: new Date() })
      .where(eq(producerDocuments.id, params.producerDocumentId));
  }
}

/**
 * List producer documents for an organization
 */
export async function listProducerDocuments(
  organizationId: string,
  filters: {
    showId?: string;
    talentProfileId?: string;
    documentType?: DocumentType;
    status?: ProducerDocumentStatus;
    year?: number;
    page?: number;
    limit?: number;
  }
): Promise<{ documents: ProducerDocumentWithDetails[]; total: number }> {
  const { page = 1, limit = 20, ...whereFilters } = filters;
  const offset = (page - 1) * limit;

  const conditions = [
    eq(producerDocuments.organizationId, organizationId),
    isNull(producerDocuments.deletedAt),
    whereFilters.showId ? eq(producerDocuments.showId, whereFilters.showId) : undefined,
    whereFilters.talentProfileId ? eq(producerDocuments.talentProfileId, whereFilters.talentProfileId) : undefined,
    whereFilters.documentType ? eq(producerDocuments.documentType, whereFilters.documentType) : undefined,
    whereFilters.status ? eq(producerDocuments.status, whereFilters.status) : undefined,
    whereFilters.year ? eq(producerDocuments.year, whereFilters.year) : undefined,
  ].filter(Boolean);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(producerDocuments)
    .where(and(...conditions));

  const results = await db
    .select({
      producerDoc: producerDocuments,
      doc: documents,
      talentProfile: talentProfiles,
      talentUser: users,
      show: shows,
    })
    .from(producerDocuments)
    .innerJoin(documents, eq(documents.id, producerDocuments.documentId))
    .innerJoin(talentProfiles, eq(talentProfiles.id, producerDocuments.talentProfileId))
    .innerJoin(users, eq(users.id, talentProfiles.userId))
    .leftJoin(shows, eq(shows.id, producerDocuments.showId))
    .where(and(...conditions))
    .orderBy(desc(producerDocuments.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    documents: results.map((r) => ({
      id: r.producerDoc.id,
      documentId: r.producerDoc.documentId,
      documentType: r.producerDoc.documentType,
      name: r.doc.name,
      mimeType: r.doc.mimeType,
      fileSize: r.doc.fileSize,
      status: r.producerDoc.status,
      year: r.producerDoc.year,
      deadline: r.producerDoc.deadline,
      notes: r.producerDoc.notes,
      viewedAt: r.producerDoc.viewedAt,
      downloadedAt: r.producerDoc.downloadedAt,
      createdAt: r.producerDoc.createdAt,
      talent: {
        id: r.talentProfile.id,
        userId: r.talentUser.id,
        firstName: r.talentUser.firstName ?? "",
        lastName: r.talentUser.lastName ?? "",
        email: r.talentUser.email ?? "",
      },
      show: r.show ? { id: r.show.id, title: r.show.title } : null,
    })),
    total: countResult?.count ?? 0,
  };
}

/**
 * Update a producer document
 */
export async function updateProducerDocument(
  producerDocumentId: string,
  organizationId: string,
  updates: { notes?: string | null; deadline?: Date | null }
): Promise<void> {
  await db
    .update(producerDocuments)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(producerDocuments.id, producerDocumentId), eq(producerDocuments.organizationId, organizationId)));
}

/**
 * Delete (soft) a producer document
 */
export async function deleteProducerDocument(params: DeleteDocumentParams): Promise<void> {
  const { producerDocumentId, organizationId, userId, ipAddress, userAgent } = params;

  const doc = await db.query.producerDocuments.findFirst({
    where: and(eq(producerDocuments.id, producerDocumentId), eq(producerDocuments.organizationId, organizationId)),
  });

  if (!doc) throw new Error("Document not found");

  await db
    .update(producerDocuments)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(producerDocuments.id, producerDocumentId));

  await db
    .update(documents)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(documents.id, doc.documentId));

  await db.insert(documentAccessLogs).values({
    documentId: doc.documentId,
    userId,
    action: "delete",
    ipAddress,
    userAgent,
    metadata: JSON.stringify({ producerDocumentId, reason: "producer_deleted" }),
  });
}

/**
 * Record that talent viewed a document
 */
export async function recordDocumentView(
  documentId: string,
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<void> {
  const producerDoc = await db.query.producerDocuments.findFirst({
    where: eq(producerDocuments.documentId, documentId),
  });

  if (producerDoc && !producerDoc.viewedAt) {
    await db
      .update(producerDocuments)
      .set({ status: "viewed", viewedAt: new Date(), viewedByUserId: userId, updatedAt: new Date() })
      .where(eq(producerDocuments.id, producerDoc.id));
  }

  await db.insert(documentAccessLogs).values({ documentId, userId, action: "view", ipAddress, userAgent });
}

/**
 * Record that talent downloaded a document
 */
export async function recordDocumentDownload(
  documentId: string,
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<void> {
  const producerDoc = await db.query.producerDocuments.findFirst({
    where: eq(producerDocuments.documentId, documentId),
  });

  if (producerDoc) {
    await db
      .update(producerDocuments)
      .set({ status: "downloaded", downloadedAt: new Date(), updatedAt: new Date() })
      .where(eq(producerDocuments.id, producerDoc.id));
  }

  await db.insert(documentAccessLogs).values({ documentId, userId, action: "download", ipAddress, userAgent });
}

/**
 * Get documents for a talent
 */
export async function getTalentProducerDocuments(talentUserId: string): Promise<ProducerDocumentWithDetails[]> {
  const talentProfile = await db.query.talentProfiles.findFirst({
    where: eq(talentProfiles.userId, talentUserId),
    columns: { id: true },
  });

  if (!talentProfile) return [];

  const results = await db
    .select({ producerDoc: producerDocuments, doc: documents, org: producerProfiles, show: shows })
    .from(producerDocuments)
    .innerJoin(documents, eq(documents.id, producerDocuments.documentId))
    .innerJoin(producerProfiles, eq(producerProfiles.id, producerDocuments.organizationId))
    .leftJoin(shows, eq(shows.id, producerDocuments.showId))
    .where(and(eq(producerDocuments.talentProfileId, talentProfile.id), isNull(producerDocuments.deletedAt)))
    .orderBy(desc(producerDocuments.createdAt));

  return results.map((r) => ({
    id: r.producerDoc.id,
    documentId: r.producerDoc.documentId,
    documentType: r.producerDoc.documentType,
    name: r.doc.name,
    mimeType: r.doc.mimeType,
    fileSize: r.doc.fileSize,
    status: r.producerDoc.status,
    year: r.producerDoc.year,
    deadline: r.producerDoc.deadline,
    notes: r.producerDoc.notes,
    viewedAt: r.producerDoc.viewedAt,
    downloadedAt: r.producerDoc.downloadedAt,
    createdAt: r.producerDoc.createdAt,
    talent: { id: talentProfile.id, userId: talentUserId, firstName: "", lastName: "", email: "" },
    show: r.show ? { id: r.show.id, title: r.show.title } : null,
  }));
}
