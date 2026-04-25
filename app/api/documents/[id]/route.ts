import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents, documentAccessLogs } from "@/lib/db/schema";
import { downloadDocument, deleteDocument } from "@/lib/storage/document-storage";
import { decryptDocument } from "@/lib/encryption";
import { recordDocumentDownload } from "@/lib/services/producer-documents";
import { eq, and, isNull } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
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

    // Download encrypted content from S3
    const encryptedData = await downloadDocument(document.s3Key);

    // Decrypt the content
    const decryptedData = decryptDocument(
      encryptedData,
      document.encryptionIv,
      document.encryptionAuthTag,
      document.encryptionSalt
    );

    // Log the download and update producer document status if applicable
    const ipAddress = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    if (document.isProducerUploaded && document.ownerId === session.user.id) {
      // Talent downloading their producer-uploaded document
      await recordDocumentDownload(document.id, session.user.id, ipAddress, userAgent);
    } else {
      await db.insert(documentAccessLogs).values({
        documentId: document.id,
        userId: session.user.id,
        action: "download",
        ipAddress,
        userAgent,
      });
    }

    // Return the decrypted file
    return new NextResponse(new Uint8Array(decryptedData), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.originalFilename)}"`,
        "Content-Length": decryptedData.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading document:", error);
    return NextResponse.json({ error: "Failed to download document" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext): Promise<NextResponse> {
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

    // Only owner can delete, unless it's a producer-uploaded doc
    if (document.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Talent cannot delete producer-uploaded documents
    if (document.isProducerUploaded && document.uploadedById !== session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete documents uploaded by producers" },
        { status: 403 }
      );
    }

    // Log the deletion before soft delete
    await db.insert(documentAccessLogs).values({
      documentId: document.id,
      userId: session.user.id,
      action: "delete",
      ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent"),
    });

    // Soft delete the document
    await db
      .update(documents)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(documents.id, id));

    // Delete from S3 (hard delete the encrypted file)
    await deleteDocument(document.s3Key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
