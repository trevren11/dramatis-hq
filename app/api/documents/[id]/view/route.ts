import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { recordDocumentView } from "@/lib/services/producer-documents";
import { eq, and, isNull } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/documents/[id]/view
 * Record that a user has viewed a document
 */
export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Find document and verify ownership
    const document = await db.query.documents.findFirst({
      where: and(eq(documents.id, id), isNull(documents.deletedAt)),
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Verify user has access (owner or uploader)
    if (document.ownerId !== session.user.id && document.uploadedById !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Record the view
    await recordDocumentView(
      document.id,
      session.user.id,
      request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
      request.headers.get("user-agent")
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording document view:", error);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}
