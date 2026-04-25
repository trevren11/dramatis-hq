import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  materialPermissions,
  scripts,
  minusTracks,
  roles,
  users,
} from "@/lib/db/schema";
import {
  materialPermissionCreateSchema,
  materialPermissionBulkCreateSchema,
  shareWithCastSchema,
  shareWithRolesSchema,
  shareWithUsersSchema,
} from "@/lib/validations/materials";
import { eq, and, inArray } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId } = await params;
    const url = new URL(request.url);
    const materialType = url.searchParams.get("materialType") as "script" | "track" | null;
    const materialId = url.searchParams.get("materialId");

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

    const conditions = [eq(materialPermissions.showId, showId)];

    if (materialType) {
      conditions.push(eq(materialPermissions.materialType, materialType));
    }

    if (materialId) {
      conditions.push(eq(materialPermissions.materialId, materialId));
    }

    const permissions = await db.query.materialPermissions.findMany({
      where: and(...conditions),
    });

    const userIds = permissions
      .filter((p): p is typeof p & { grantedToUserId: string } => !!p.grantedToUserId)
      .map((p) => p.grantedToUserId);
    const roleIds = permissions
      .filter((p): p is typeof p & { grantedToRoleId: string } => !!p.grantedToRoleId)
      .map((p) => p.grantedToRoleId);

    const usersData =
      userIds.length > 0
        ? await db.query.users.findMany({
            where: inArray(users.id, userIds),
            columns: { id: true, name: true, email: true },
          })
        : [];

    const rolesData =
      roleIds.length > 0
        ? await db.query.roles.findMany({
            where: inArray(roles.id, roleIds),
            columns: { id: true, name: true },
          })
        : [];

    const userMap = Object.fromEntries(usersData.map((u) => [u.id, u]));
    const roleMap = Object.fromEntries(rolesData.map((r) => [r.id, r]));

    const enrichedPermissions = permissions.map((p) => ({
      ...p,
      grantedToUser: p.grantedToUserId ? userMap[p.grantedToUserId] : null,
      grantedToRole: p.grantedToRoleId ? roleMap[p.grantedToRoleId] : null,
    }));

    return NextResponse.json({ permissions: enrichedPermissions });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId } = await params;

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

    const body = (await request.json()) as Record<string, unknown>;

    if ("permissions" in body) {
      return await handleBulkCreate(body, showId, session.user.id);
    } else if ("roleIds" in body) {
      return await handleShareWithRoles(body, showId, session.user.id);
    } else if ("userIds" in body) {
      return await handleShareWithUsers(body, showId, session.user.id);
    } else if (body.grantType === "all_cast") {
      return await handleShareWithCast(body, showId, session.user.id);
    }

    const parsed = materialPermissionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const materialExists = await verifyMaterialExists(
      parsed.data.materialType,
      parsed.data.materialId,
      showId
    );

    if (!materialExists) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const [permission] = await db
      .insert(materialPermissions)
      .values({
        materialType: parsed.data.materialType,
        materialId: parsed.data.materialId,
        grantType: parsed.data.grantType,
        grantedToUserId: parsed.data.grantedToUserId,
        grantedToRoleId: parsed.data.grantedToRoleId,
        showId,
        canDownload: parsed.data.canDownload,
        canView: parsed.data.canView,
        expiresAt: parsed.data.expiresAt,
        grantedBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ permission }, { status: 201 });
  } catch (error) {
    console.error("Error creating permission:", error);
    return NextResponse.json({ error: "Failed to create permission" }, { status: 500 });
  }
}

async function handleBulkCreate(
  body: Record<string, unknown>,
  showId: string,
  userId: string
): Promise<NextResponse> {
  const parsed = materialPermissionBulkCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const materialExists = await verifyMaterialExists(
    parsed.data.materialType,
    parsed.data.materialId,
    showId
  );

  if (!materialExists) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  const permissions = await Promise.all(
    parsed.data.permissions.map(async (p) => {
      const [permission] = await db
        .insert(materialPermissions)
        .values({
          materialType: parsed.data.materialType,
          materialId: parsed.data.materialId,
          grantType: p.grantType,
          grantedToUserId: p.grantedToUserId,
          grantedToRoleId: p.grantedToRoleId,
          showId,
          canDownload: p.canDownload,
          canView: p.canView,
          expiresAt: p.expiresAt,
          grantedBy: userId,
        })
        .returning();
      return permission;
    })
  );

  return NextResponse.json({ permissions }, { status: 201 });
}

async function handleShareWithCast(
  body: Record<string, unknown>,
  showId: string,
  userId: string
): Promise<NextResponse> {
  const parsed = shareWithCastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const materialExists = await verifyMaterialExists(
    parsed.data.materialType,
    parsed.data.materialId,
    showId
  );

  if (!materialExists) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  const existing = await db.query.materialPermissions.findFirst({
    where: and(
      eq(materialPermissions.materialType, parsed.data.materialType),
      eq(materialPermissions.materialId, parsed.data.materialId),
      eq(materialPermissions.grantType, "all_cast")
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(materialPermissions)
      .set({
        canDownload: parsed.data.canDownload,
        expiresAt: parsed.data.expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(materialPermissions.id, existing.id))
      .returning();
    return NextResponse.json({ permission: updated });
  }

  const [permission] = await db
    .insert(materialPermissions)
    .values({
      materialType: parsed.data.materialType,
      materialId: parsed.data.materialId,
      grantType: "all_cast",
      showId,
      canDownload: parsed.data.canDownload,
      canView: true,
      expiresAt: parsed.data.expiresAt,
      grantedBy: userId,
    })
    .returning();

  return NextResponse.json({ permission }, { status: 201 });
}

async function handleShareWithRoles(
  body: Record<string, unknown>,
  showId: string,
  userId: string
): Promise<NextResponse> {
  const parsed = shareWithRolesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const materialExists = await verifyMaterialExists(
    parsed.data.materialType,
    parsed.data.materialId,
    showId
  );

  if (!materialExists) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  const permissions = await Promise.all(
    parsed.data.roleIds.map(async (roleId) => {
      const existing = await db.query.materialPermissions.findFirst({
        where: and(
          eq(materialPermissions.materialType, parsed.data.materialType),
          eq(materialPermissions.materialId, parsed.data.materialId),
          eq(materialPermissions.grantType, "role"),
          eq(materialPermissions.grantedToRoleId, roleId)
        ),
      });

      if (existing) {
        const [updated] = await db
          .update(materialPermissions)
          .set({
            canDownload: parsed.data.canDownload,
            expiresAt: parsed.data.expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(materialPermissions.id, existing.id))
          .returning();
        return updated;
      }

      const [permission] = await db
        .insert(materialPermissions)
        .values({
          materialType: parsed.data.materialType,
          materialId: parsed.data.materialId,
          grantType: "role",
          grantedToRoleId: roleId,
          showId,
          canDownload: parsed.data.canDownload,
          canView: true,
          expiresAt: parsed.data.expiresAt,
          grantedBy: userId,
        })
        .returning();
      return permission;
    })
  );

  return NextResponse.json({ permissions }, { status: 201 });
}

async function handleShareWithUsers(
  body: Record<string, unknown>,
  showId: string,
  userId: string
): Promise<NextResponse> {
  const parsed = shareWithUsersSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const materialExists = await verifyMaterialExists(
    parsed.data.materialType,
    parsed.data.materialId,
    showId
  );

  if (!materialExists) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  const permissions = await Promise.all(
    parsed.data.userIds.map(async (targetUserId) => {
      const existing = await db.query.materialPermissions.findFirst({
        where: and(
          eq(materialPermissions.materialType, parsed.data.materialType),
          eq(materialPermissions.materialId, parsed.data.materialId),
          eq(materialPermissions.grantType, "user"),
          eq(materialPermissions.grantedToUserId, targetUserId)
        ),
      });

      if (existing) {
        const [updated] = await db
          .update(materialPermissions)
          .set({
            canDownload: parsed.data.canDownload,
            expiresAt: parsed.data.expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(materialPermissions.id, existing.id))
          .returning();
        return updated;
      }

      const [permission] = await db
        .insert(materialPermissions)
        .values({
          materialType: parsed.data.materialType,
          materialId: parsed.data.materialId,
          grantType: "user",
          grantedToUserId: targetUserId,
          showId,
          canDownload: parsed.data.canDownload,
          canView: true,
          expiresAt: parsed.data.expiresAt,
          grantedBy: userId,
        })
        .returning();
      return permission;
    })
  );

  return NextResponse.json({ permissions }, { status: 201 });
}

async function verifyMaterialExists(
  type: "script" | "track",
  materialId: string,
  showId: string
): Promise<boolean> {
  if (type === "script") {
    const script = await db.query.scripts.findFirst({
      where: and(eq(scripts.id, materialId), eq(scripts.showId, showId)),
    });
    return !!script;
  } else {
    const track = await db.query.minusTracks.findFirst({
      where: and(eq(minusTracks.id, materialId), eq(minusTracks.showId, showId)),
    });
    return !!track;
  }
}
