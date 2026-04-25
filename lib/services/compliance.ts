import { eq, and, isNull, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  producerDocuments,
  complianceDeadlines,
  users,
  talentProfiles,
  shows,
  castingAssignments,
  type DocumentType,
} from "@/lib/db/schema";
import type { ComplianceDeadlineInput } from "@/lib/validations/producer-documents";

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

interface ComplianceFilters {
  showId?: string;
  documentType?: DocumentType;
  year?: number;
  status?: "missing" | "pending" | "overdue" | "complete";
}

interface TalentInfo {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

/**
 * Determine compliance status for a document
 */
function determineStatus(
  existingDoc: typeof producerDocuments.$inferSelect | undefined,
  deadline: typeof complianceDeadlines.$inferSelect | undefined
): ComplianceStatus["status"] {
  if (!existingDoc) {
    return "missing";
  }
  if (existingDoc.downloadedAt) {
    return "downloaded";
  }
  if (existingDoc.viewedAt) {
    return "viewed";
  }
  if (existingDoc.notificationSentAt) {
    return "delivered";
  }

  const baseStatus = "pending";

  // Check if overdue
  if (
    deadline?.deadline &&
    new Date() > deadline.deadline &&
    (baseStatus === "pending")
  ) {
    return "overdue";
  }

  return baseStatus;
}

/**
 * Check if status matches filter
 */
function matchesStatusFilter(
  status: ComplianceStatus["status"],
  filterStatus: ComplianceFilters["status"]
): boolean {
  if (!filterStatus) return true;

  const isComplete = status === "viewed" || status === "downloaded";

  switch (filterStatus) {
    case "complete":
      return isComplete;
    case "missing":
      return status === "missing";
    case "pending":
      return status === "pending" || status === "delivered";
    case "overdue":
      return status === "overdue";
    default:
      return true;
  }
}

/**
 * Build compliance record for a talent and document type
 */
function buildComplianceRecord(
  talent: TalentInfo,
  docType: DocumentType,
  existingDoc: typeof producerDocuments.$inferSelect | undefined,
  deadline: typeof complianceDeadlines.$inferSelect | undefined,
  filterYear: number | undefined
): ComplianceStatus {
  let status = determineStatus(existingDoc, deadline);

  // Check if overdue after determining base status
  if (
    deadline?.deadline &&
    new Date() > deadline.deadline &&
    (status === "missing" || status === "pending" || status === "delivered")
  ) {
    status = "overdue";
  }

  const firstName = talent.firstName ?? "";
  const lastName = talent.lastName ?? "";

  return {
    talentProfileId: talent.id,
    talentName: `${firstName} ${lastName}`.trim(),
    talentEmail: talent.email ?? "",
    documentType: docType,
    year: existingDoc?.year ?? filterYear ?? null,
    status,
    deadline: deadline?.deadline ?? existingDoc?.deadline ?? null,
    documentId: existingDoc?.documentId,
    uploadedAt: existingDoc?.createdAt,
    viewedAt: existingDoc?.viewedAt ?? undefined,
  };
}

/**
 * Get compliance status for an organization/show
 */
export async function getComplianceStatus(
  organizationId: string,
  filters: ComplianceFilters
): Promise<ComplianceStatus[]> {
  // Get all cast members for this org/show
  const castQuery = db
    .select({
      talentProfileId: castingAssignments.talentProfileId,
      showId: castingAssignments.showId,
    })
    .from(castingAssignments)
    .innerJoin(shows, eq(shows.id, castingAssignments.showId))
    .where(
      and(
        eq(shows.organizationId, organizationId),
        eq(castingAssignments.status, "confirmed"),
        filters.showId ? eq(castingAssignments.showId, filters.showId) : undefined
      )
    );

  const castMembers = await castQuery;

  if (castMembers.length === 0) {
    return [];
  }

  const talentIds = [...new Set(castMembers.map((c) => c.talentProfileId))];

  // Fetch all required data in parallel
  const [talents, existingDocs, deadlines] = await Promise.all([
    db
      .select({
        id: talentProfiles.id,
        userId: talentProfiles.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(talentProfiles)
      .innerJoin(users, eq(users.id, talentProfiles.userId))
      .where(inArray(talentProfiles.id, talentIds)),

    db
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
      ),

    db
      .select()
      .from(complianceDeadlines)
      .where(
        and(
          eq(complianceDeadlines.organizationId, organizationId),
          filters.showId ? eq(complianceDeadlines.showId, filters.showId) : undefined,
          filters.documentType ? eq(complianceDeadlines.documentType, filters.documentType) : undefined,
          filters.year ? eq(complianceDeadlines.year, filters.year) : undefined
        )
      ),
  ]);

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

      const record = buildComplianceRecord(talent, docType, existingDoc, deadline, filters.year);

      if (matchesStatusFilter(record.status, filters.status)) {
        results.push(record);
      }
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

export type { ComplianceStatus, ComplianceFilters };
