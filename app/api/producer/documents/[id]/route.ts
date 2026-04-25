import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, producerDocuments, documents, talentProfiles, shows } from "@/lib/db/schema";
import { producerDocumentUpdateSchema } from "@/lib/validations/producer-documents";
import {
  updateProducerDocument,
  deleteProducerDocument,
  getUserOrganizationId,
} from "@/lib/services/producer-documents";
import { eq, and, isNull } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/producer/documents/[id]
 * Get a specific producer document
 */
export async function GET(_request: Request, context: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

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

    // Get the document
    const [result] = await db
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
      .where(
        and(
          eq(producerDocuments.id, id),
          eq(producerDocuments.organizationId, organizationId),
          isNull(producerDocuments.deletedAt)
        )
      )
      .limit(1);

    if (!result) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({
      document: {
        id: result.producerDoc.id,
        documentId: result.producerDoc.documentId,
        documentType: result.producerDoc.documentType,
        name: result.doc.name,
        originalFilename: result.doc.originalFilename,
        mimeType: result.doc.mimeType,
        fileSize: result.doc.fileSize,
        status: result.producerDoc.status,
        year: result.producerDoc.year,
        deadline: result.producerDoc.deadline,
        notes: result.producerDoc.notes,
        notificationSentAt: result.producerDoc.notificationSentAt,
        viewedAt: result.producerDoc.viewedAt,
        downloadedAt: result.producerDoc.downloadedAt,
        createdAt: result.producerDoc.createdAt,
        updatedAt: result.producerDoc.updatedAt,
        talent: {
          id: result.talentProfile.id,
          userId: result.talentUser.id,
          name: result.talentUser.name ?? "",
          email: result.talentUser.email,
        },
        show: result.show
          ? {
              id: result.show.id,
              title: result.show.title,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error getting producer document:", error);
    return NextResponse.json({ error: "Failed to get document" }, { status: 500 });
  }
}

/**
 * PATCH /api/producer/documents/[id]
 * Update a producer document (notes, deadline)
 */
export async function PATCH(request: Request, context: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify user is a producer
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (user?.userType !== "producer") {
      return NextResponse.json({ error: "Only producers can update documents" }, { status: 403 });
    }

    // Get producer's organization
    const organizationId = await getUserOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 400 });
    }

    const body: unknown = await request.json();
    const parsed = producerDocumentUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await updateProducerDocument(id, organizationId, parsed.data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating producer document:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

/**
 * DELETE /api/producer/documents/[id]
 * Delete a producer document
 */
export async function DELETE(request: Request, context: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify user is a producer
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (user?.userType !== "producer") {
      return NextResponse.json({ error: "Only producers can delete documents" }, { status: 403 });
    }

    // Get producer's organization
    const organizationId = await getUserOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 400 });
    }

    await deleteProducerDocument({
      producerDocumentId: id,
      organizationId,
      userId: session.user.id,
      ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting producer document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
