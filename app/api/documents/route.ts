import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents, producerDocuments, producerProfiles, shows } from "@/lib/db/schema";
import { eq, isNull, desc, and } from "drizzle-orm";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all documents owned by the user
    const userDocuments = await db
      .select({
        id: documents.id,
        name: documents.name,
        documentType: documents.documentType,
        originalFilename: documents.originalFilename,
        mimeType: documents.mimeType,
        fileSize: documents.fileSize,
        isProducerUploaded: documents.isProducerUploaded,
        description: documents.description,
        taxYear: documents.taxYear,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        // Producer document info (left joined)
        producerDoc: {
          id: producerDocuments.id,
          status: producerDocuments.status,
          year: producerDocuments.year,
          viewedAt: producerDocuments.viewedAt,
          downloadedAt: producerDocuments.downloadedAt,
        },
        organization: {
          id: producerProfiles.id,
          name: producerProfiles.organizationName,
          companyName: producerProfiles.companyName,
        },
        show: {
          id: shows.id,
          title: shows.title,
        },
      })
      .from(documents)
      .leftJoin(producerDocuments, eq(producerDocuments.documentId, documents.id))
      .leftJoin(producerProfiles, eq(producerProfiles.id, producerDocuments.organizationId))
      .leftJoin(shows, eq(shows.id, producerDocuments.showId))
      .where(and(eq(documents.ownerId, session.user.id), isNull(documents.deletedAt)))
      .orderBy(desc(documents.createdAt));

    // Transform results to include producer info for producer-uploaded docs
    const transformedDocs = userDocuments.map((doc) => ({
      id: doc.id,
      name: doc.name,
      documentType: doc.documentType,
      originalFilename: doc.originalFilename,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      isProducerUploaded: doc.isProducerUploaded,
      description: doc.description,
      taxYear: doc.taxYear ?? doc.producerDoc?.year,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      // Only include producer info for producer-uploaded docs
      ...(doc.isProducerUploaded && doc.organization?.id
        ? {
            uploadedBy: {
              organizationId: doc.organization.id,
              organizationName: doc.organization.name ?? doc.organization.companyName,
            },
            show: doc.show?.id
              ? {
                  id: doc.show.id,
                  title: doc.show.title,
                }
              : null,
            viewStatus: {
              viewedAt: doc.producerDoc?.viewedAt,
              downloadedAt: doc.producerDoc?.downloadedAt,
            },
          }
        : {}),
    }));

    return NextResponse.json({ documents: transformedDocs });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}
