import { eq, and, isNull, desc, sql, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  documents,
  documentAccessLogs,
  producerDocuments,
  complianceDeadlines,
  users,
  talentProfiles,
  shows,
  producerProfiles,
  castingAssignments,
  type DocumentType,
  type ProducerDocumentStatus,
} from "@/lib/db/schema";
import { uploadDocument, generateDocumentKey } from "@/lib/storage/document-storage";
import { encryptDocument } from "@/lib/encryption";
import { emailService } from "@/lib/email/service";
import { getOrganizationMembership } from "@/lib/permissions/helpers";
import type { ProducerDocumentUploadInput, ComplianceDeadlineInput } from "@/lib/validations/producer-documents";
import { TaxDocumentUploadedEmail } from "@/lib/email/templates/production/tax-document-uploaded";

interface UploadProducerDocumentParams {
  file: {
    name: string;
    type: string;
    size: number;
    buffer: Buffer;
  };
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
  talent: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  show?: {
    id: string;
    title: string;
  } | null;
}

interface ComplianceStatus {
  talentProfileId: string;
  talentName: string;
  talentEmail: string;
  documentType: DocumentType;
  year: number | null;
  status: "missing" | "pending" | "delivered" | "viewed" | "downloaded" | "overdue";
  deadline: Date | null;
  documentId?: string;
  uploadedAt?: Date;
  viewedAt?: Date;
}

/**
 * Check if user can upload tax documents for an organization
 * Only owner and admin can upload tax documents (W2, I-9, 1099)
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
 * Get organization ID for a user (their producer profile)
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

  // Get talent profile
  const talentProfile = await db.query.talentProfiles.findFirst({
    where: eq(talentProfiles.userId, input.talentUserId),
    columns: { id: true },
  });

  if (!talentProfile) {
    throw new Error("Talent profile not found");
  }

  // Encrypt the document
  const { encryptedData, iv, authTag, salt } = encryptDocument(file.buffer);

  // Generate document ID and S3 key
  const documentId = crypto.randomUUID();
  const s3Key = generateDocumentKey(input.talentUserId, documentId, file.name);

  // Upload encrypted document to S3
  await uploadDocument(s3Key, encryptedData, "application/octet-stream", {
    originalMimeType: file.type,
    documentId,
    uploadedBy: uploaderId,
  });

  // Create document record
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

  if (!newDocument) {
    throw new Error("Failed to create document record");
  }

  // Create producer document record for tracking
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

  if (!producerDoc) {
    throw new Error("Failed to create producer document record");
  }

  // Create audit log entry
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

  // Send notification to talent if requested
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

  return {
    documentId: newDocument.id,
    producerDocumentId: producerDoc.id,
  };
}

/**
 * Send notification to talent about a new document
 */
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
  // Get talent info
  const talent = await db.query.users.findFirst({
    where: eq(users.id, params.talentUserId),
    columns: { id: true, email: true, firstName: true, lastName: true },
  });

  if (!talent?.email) return;

  // Get organization info
  const org = await db.query.producerProfiles.findFirst({
    where: eq(producerProfiles.id, params.organizationId),
    columns: { organizationName: true, companyName: true },
  });

  // Get show info if applicable
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
  const documentUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://dramatishq.com"}/documents/${params.documentId}`;

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

  // Update producer document with notification status
  if (result.success) {
    await db
      .update(producerDocuments)
      .set({
        status: "delivered",
        notificationSentAt: new Date(),
        emailId: result.id,
        updatedAt: new Date(),
      })
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

  // Build where conditions
  const conditions = [
    eq(producerDocuments.organizationId, organizationId),
    isNull(producerDocuments.deletedAt),
  ];

  if (whereFilters.showId) {
    conditions.push(eq(producerDocuments.showId, whereFilters.showId));
  }
  if (whereFilters.talentProfileId) {
    conditions.push(eq(producerDocuments.talentProfileId, whereFilters.talentProfileId));
  }
  if (whereFilters.documentType) {
    conditions.push(eq(producerDocuments.documentType, whereFilters.documentType));
  }
  if (whereFilters.status) {
    conditions.push(eq(producerDocuments.status, whereFilters.status));
  }
  if (whereFilters.year) {
    conditions.push(eq(producerDocuments.year, whereFilters.year));
  }

  // Count total
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(producerDocuments)
    .where(and(...conditions));

  // Get documents with details
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

  const docs: ProducerDocumentWithDetails[] = results.map((r) => ({
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
    show: r.show
      ? {
          id: r.show.id,
          title: r.show.title,
        }
      : null,
  }));

  return { documents: docs, total: count };
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
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(producerDocuments.id, producerDocumentId),
        eq(producerDocuments.organizationId, organizationId)
      )
    );
}

/**
 * Delete (soft) a producer document
 */
export async function deleteProducerDocument(
  producerDocumentId: string,
  organizationId: string,
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<void> {
  const doc = await db.query.producerDocuments.findFirst({
    where: and(
      eq(producerDocuments.id, producerDocumentId),
      eq(producerDocuments.organizationId, organizationId)
    ),
  });

  if (!doc) {
    throw new Error("Document not found");
  }

  // Soft delete producer document
  await db
    .update(producerDocuments)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(producerDocuments.id, producerDocumentId));

  // Soft delete the actual document
  await db
    .update(documents)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(documents.id, doc.documentId));

  // Log the deletion
  await db.insert(documentAccessLogs).values({
    documentId: doc.documentId,
    userId,
    action: "delete",
    ipAddress,
    userAgent,
    metadata: JSON.stringify({
      producerDocumentId,
      reason: "producer_deleted",
    }),
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
  // Find producer document
  const producerDoc = await db.query.producerDocuments.findFirst({
    where: eq(producerDocuments.documentId, documentId),
  });

  if (producerDoc && !producerDoc.viewedAt) {
    await db
      .update(producerDocuments)
      .set({
        status: "viewed",
        viewedAt: new Date(),
        viewedByUserId: userId,
        updatedAt: new Date(),
      })
      .where(eq(producerDocuments.id, producerDoc.id));
  }

  // Log the view
  await db.insert(documentAccessLogs).values({
    documentId,
    userId,
    action: "view",
    ipAddress,
    userAgent,
  });
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
  // Find producer document
  const producerDoc = await db.query.producerDocuments.findFirst({
    where: eq(producerDocuments.documentId, documentId),
  });

  if (producerDoc) {
    await db
      .update(producerDocuments)
      .set({
        status: "downloaded",
        downloadedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(producerDocuments.id, producerDoc.id));
  }

  // Log the download
  await db.insert(documentAccessLogs).values({
    documentId,
    userId,
    action: "download",
    ipAddress,
    userAgent,
  });
}

/**
 * Get compliance status for an organization/show
 */
export async function getComplianceStatus(
  organizationId: string,
  filters: {
    showId?: string;
    documentType?: DocumentType;
    year?: number;
    status?: "missing" | "pending" | "overdue" | "complete";
  }
): Promise<ComplianceStatus[]> {
  // Get all cast members for this org/show
  let castQuery = db
    .select({
      talentProfileId: castingAssignments.talentProfileId,
      showId: castingAssignments.showId,
    })
    .from(castingAssignments)
    .innerJoin(shows, eq(shows.id, castingAssignments.showId))
    .where(
      and(
        eq(shows.organizationId, organizationId),
        eq(castingAssignments.status, "confirmed")
      )
    );

  if (filters.showId) {
    castQuery = castQuery.where(eq(castingAssignments.showId, filters.showId)) as typeof castQuery;
  }

  const castMembers = await castQuery;

  if (castMembers.length === 0) {
    return [];
  }

  const talentIds = [...new Set(castMembers.map((c) => c.talentProfileId))];

  // Get talent info
  const talents = await db
    .select({
      id: talentProfiles.id,
      userId: talentProfiles.userId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(talentProfiles)
    .innerJoin(users, eq(users.id, talentProfiles.userId))
    .where(inArray(talentProfiles.id, talentIds));

  // Get existing producer documents
  const existingDocs = await db
    .select()
    .from(producerDocuments)
    .where(
      and(
        eq(producerDocuments.organizationId, organizationId),
        inArray(producerDocuments.talentProfileId, talentIds),
        isNull(producerDocuments.deletedAt),
        filters.documentType ? eq(producerDocuments.documentType, filters.documentType) : undefined,
        filters.year ? eq(producerDocuments.year, filters.year) : undefined
      )
    );

  // Get deadlines
  const deadlines = await db
    .select()
    .from(complianceDeadlines)
    .where(
      and(
        eq(complianceDeadlines.organizationId, organizationId),
        filters.showId ? eq(complianceDeadlines.showId, filters.showId) : undefined,
        filters.documentType ? eq(complianceDeadlines.documentType, filters.documentType) : undefined,
        filters.year ? eq(complianceDeadlines.year, filters.year) : undefined
      )
    );

  // Build compliance status for each talent
  const results: ComplianceStatus[] = [];
  const documentTypes = filters.documentType
    ? [filters.documentType]
    : (["W2", "1099", "I9"] as DocumentType[]);

  for (const talent of talents) {
    for (const docType of documentTypes) {
      const existingDoc = existingDocs.find(
        (d) => d.talentProfileId === talent.id && d.documentType === docType
      );

      const deadline = deadlines.find((d) => d.documentType === docType);

      let status: ComplianceStatus["status"];
      if (!existingDoc) {
        status = "missing";
      } else if (existingDoc.downloadedAt) {
        status = "downloaded";
      } else if (existingDoc.viewedAt) {
        status = "viewed";
      } else if (existingDoc.notificationSentAt) {
        status = "delivered";
      } else {
        status = "pending";
      }

      // Check if overdue
      if (
        deadline?.deadline &&
        new Date() > deadline.deadline &&
        (status === "missing" || status === "pending" || status === "delivered")
      ) {
        status = "overdue";
      }

      // Apply filter
      if (filters.status) {
        const isComplete = status === "viewed" || status === "downloaded";
        if (filters.status === "complete" && !isComplete) continue;
        if (filters.status === "missing" && status !== "missing") continue;
        if (filters.status === "pending" && status !== "pending" && status !== "delivered") continue;
        if (filters.status === "overdue" && status !== "overdue") continue;
      }

      results.push({
        talentProfileId: talent.id,
        talentName: `${talent.firstName ?? ""} ${talent.lastName ?? ""}`.trim(),
        talentEmail: talent.email ?? "",
        documentType: docType,
        year: existingDoc?.year ?? filters.year ?? null,
        status,
        deadline: deadline?.deadline ?? existingDoc?.deadline ?? null,
        documentId: existingDoc?.documentId,
        uploadedAt: existingDoc?.createdAt,
        viewedAt: existingDoc?.viewedAt ?? undefined,
      });
    }
  }

  return results;
}

/**
 * Create or update a compliance deadline
 */
export async function setComplianceDeadline(
  organizationId: string,
  input: ComplianceDeadlineInput,
  createdBy: string
): Promise<string> {
  const existing = await db.query.complianceDeadlines.findFirst({
    where: and(
      eq(complianceDeadlines.organizationId, organizationId),
      input.showId ? eq(complianceDeadlines.showId, input.showId) : isNull(complianceDeadlines.showId),
      eq(complianceDeadlines.documentType, input.documentType),
      input.year ? eq(complianceDeadlines.year, input.year) : isNull(complianceDeadlines.year)
    ),
  });

  if (existing) {
    await db
      .update(complianceDeadlines)
      .set({
        deadline: input.deadline,
        reminderDays: input.reminderDays,
        description: input.description,
        updatedAt: new Date(),
      })
      .where(eq(complianceDeadlines.id, existing.id));
    return existing.id;
  }

  const [newDeadline] = await db
    .insert(complianceDeadlines)
    .values({
      organizationId,
      showId: input.showId,
      documentType: input.documentType,
      year: input.year,
      deadline: input.deadline,
      reminderDays: input.reminderDays,
      description: input.description,
      createdBy,
    })
    .returning();

  return newDeadline?.id ?? "";
}

/**
 * Get documents for a talent (their view of producer-uploaded docs)
 */
export async function getTalentProducerDocuments(
  talentUserId: string
): Promise<ProducerDocumentWithDetails[]> {
  const talentProfile = await db.query.talentProfiles.findFirst({
    where: eq(talentProfiles.userId, talentUserId),
    columns: { id: true },
  });

  if (!talentProfile) {
    return [];
  }

  const results = await db
    .select({
      producerDoc: producerDocuments,
      doc: documents,
      org: producerProfiles,
      show: shows,
    })
    .from(producerDocuments)
    .innerJoin(documents, eq(documents.id, producerDocuments.documentId))
    .innerJoin(producerProfiles, eq(producerProfiles.id, producerDocuments.organizationId))
    .leftJoin(shows, eq(shows.id, producerDocuments.showId))
    .where(
      and(
        eq(producerDocuments.talentProfileId, talentProfile.id),
        isNull(producerDocuments.deletedAt)
      )
    )
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
    talent: {
      id: talentProfile.id,
      userId: talentUserId,
      firstName: "",
      lastName: "",
      email: "",
    },
    show: r.show
      ? {
          id: r.show.id,
          title: r.show.title,
        }
      : null,
  }));
}
