import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, isNull, desc, and } from "drizzle-orm";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      })
      .from(documents)
      .where(and(eq(documents.ownerId, session.user.id), isNull(documents.deletedAt)))
      .orderBy(desc(documents.createdAt));

    return NextResponse.json({ documents: userDocuments });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}
