import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  scripts,
  materialPermissions,
  materialAccessLogs,
  castingAssignments,
  roles,
} from "@/lib/db/schema";
import { scriptUpdateSchema } from "@/lib/validations/materials";
import { eq, and, or, isNull, gt } from "drizzle-orm";
import { deleteFile, getSignedDownloadUrl } from "@/lib/storage";

interface RouteParams {
  params: Promise<{ id: string; scriptId: string }>;
}

// Check if user has access to a script
async function checkScriptAccess(
  scriptId: string,
  userId: string,
  showId: string
): Promise<{ hasAccess: boolean; canDownload: boolean }> {
  // Check for direct user permission
  const userPermission = await db.query.materialPermissions.findFirst({
    where: and(
      eq(materialPermissions.materialType, "script"),
      eq(materialPermissions.materialId, scriptId),
      eq(materialPermissions.grantedToUserId, userId),
      eq(materialPermissions.canView, true),
      or(isNull(materialPermissions.expiresAt), gt(materialPermissions.expiresAt, new Date()))
    ),
  });

  if (userPermission) {
    return { hasAccess: true, canDownload: userPermission.canDownload };
  }

  // Check for role-based permission
  const userRoles = await db
    .select({ roleId: castingAssignments.roleId })
    .from(castingAssignments)
    .innerJoin(roles, eq(castingAssignments.roleId, roles.id))
    .where(
      and(
        eq(castingAssignments.showId, showId),
        eq(castingAssignments.talentProfileId, userId) // This would need to be the talent profile ID
      )
    );

  for (const role of userRoles) {
    const rolePermission = await db.query.materialPermissions.findFirst({
      where: and(
        eq(materialPermissions.materialType, "script"),
        eq(materialPermissions.materialId, scriptId),
        eq(materialPermissions.grantedToRoleId, role.roleId),
        eq(materialPermissions.canView, true),
        or(isNull(materialPermissions.expiresAt), gt(materialPermissions.expiresAt, new Date()))
      ),
    });

    if (rolePermission) {
      return { hasAccess: true, canDownload: rolePermission.canDownload };
    }
  }

  // Check for all_cast permission
  const allCastPermission = await db.query.materialPermissions.findFirst({
    where: and(
      eq(materialPermissions.materialType, "script"),
      eq(materialPermissions.materialId, scriptId),
      eq(materialPermissions.grantType, "all_cast"),
      eq(materialPermissions.canView, true),
      or(isNull(materialPermissions.expiresAt), gt(materialPermissions.expiresAt, new Date()))
    ),
  });

  if (allCastPermission) {
    return { hasAccess: true, canDownload: allCastPermission.canDownload };
  }

  return { hasAccess: false, canDownload: false };
}

export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, scriptId } = await params;
    const url = new URL(request.url);
    const download = url.searchParams.get("download") === "true";

    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const script = await db.query.scripts.findFirst({
      where: and(eq(scripts.id, scriptId), eq(scripts.showId, showId)),
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Check if user is a producer for this show
    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    const isProducer = producerProfile?.id === show.organizationId;

    if (!isProducer) {
      // Check permissions for non-producers
      const access = await checkScriptAccess(scriptId, session.user.id, showId);

      if (!access.hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      if (download && !access.canDownload) {
        return NextResponse.json({ error: "Download not permitted" }, { status: 403 });
      }
    }

    // Log access
    const headers = request.headers;
    await db.insert(materialAccessLogs).values({
      materialType: "script",
      materialId: scriptId,
      userId: session.user.id,
      action: download ? "download" : "view",
      ipAddress: headers.get("x-forwarded-for") ?? headers.get("x-real-ip"),
      userAgent: headers.get("user-agent"),
    });

    // Generate signed URL for streaming/download
    const signedUrl = await getSignedDownloadUrl(
      script.s3Key,
      "document",
      download ? 3600 : 300 // 1 hour for download, 5 min for viewing
    );

    return NextResponse.json({
      script,
      url: signedUrl,
      canDownload:
        isProducer || (await checkScriptAccess(scriptId, session.user.id, showId)).canDownload,
    });
  } catch (error) {
    console.error("Error fetching script:", error);
    return NextResponse.json({ error: "Failed to fetch script" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, scriptId } = await params;

    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== show.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const script = await db.query.scripts.findFirst({
      where: and(eq(scripts.id, scriptId), eq(scripts.showId, showId)),
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = scriptUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // If setting this script as active, deactivate others
    if (parsed.data.isActive) {
      await db
        .update(scripts)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(scripts.showId, showId), eq(scripts.isActive, true)));
    }

    const [updatedScript] = await db
      .update(scripts)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(scripts.id, scriptId))
      .returning();

    return NextResponse.json({ script: updatedScript });
  } catch (error) {
    console.error("Error updating script:", error);
    return NextResponse.json({ error: "Failed to update script" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, scriptId } = await params;

    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== show.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const script = await db.query.scripts.findFirst({
      where: and(eq(scripts.id, scriptId), eq(scripts.showId, showId)),
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Delete permissions for this script
    await db
      .delete(materialPermissions)
      .where(
        and(
          eq(materialPermissions.materialType, "script"),
          eq(materialPermissions.materialId, scriptId)
        )
      );

    // Delete file from S3
    await deleteFile(script.s3Key, "document");

    // Delete script record
    await db.delete(scripts).where(eq(scripts.id, scriptId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting script:", error);
    return NextResponse.json({ error: "Failed to delete script" }, { status: 500 });
  }
}
