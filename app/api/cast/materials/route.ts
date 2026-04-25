/* eslint-disable complexity */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  talentProfiles,
  castingAssignments,
  materialPermissions,
  scripts,
  minusTracks,
  shows,
} from "@/lib/db/schema";
import { eq, and, or, isNull, gt, inArray } from "drizzle-orm";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const showId = url.searchParams.get("showId");

    // Get the user's talent profile
    const talentProfile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!talentProfile) {
      return NextResponse.json({ error: "Talent profile not found" }, { status: 404 });
    }

    // Get all casting assignments for this user
    const assignments = await db.query.castingAssignments.findMany({
      where: eq(castingAssignments.talentProfileId, talentProfile.id),
    });

    if (assignments.length === 0) {
      return NextResponse.json({ scripts: [], tracks: [] });
    }

    const roleIds = assignments.map((a) => a.roleId);
    const showIds = showId ? [showId] : [...new Set(assignments.map((a) => a.showId))];

    // Get all permissions for this user
    const now = new Date();

    // 1. Direct user permissions
    const userPermissions = await db.query.materialPermissions.findMany({
      where: and(
        eq(materialPermissions.grantedToUserId, session.user.id),
        eq(materialPermissions.canView, true),
        or(isNull(materialPermissions.expiresAt), gt(materialPermissions.expiresAt, now)),
        showId ? eq(materialPermissions.showId, showId) : undefined
      ),
    });

    // 2. Role-based permissions
    const rolePermissions =
      roleIds.length > 0
        ? await db.query.materialPermissions.findMany({
            where: and(
              inArray(materialPermissions.grantedToRoleId, roleIds),
              eq(materialPermissions.canView, true),
              or(isNull(materialPermissions.expiresAt), gt(materialPermissions.expiresAt, now)),
              showId ? eq(materialPermissions.showId, showId) : undefined
            ),
          })
        : [];

    // 3. All-cast permissions
    const allCastPermissions = await db.query.materialPermissions.findMany({
      where: and(
        eq(materialPermissions.grantType, "all_cast"),
        inArray(materialPermissions.showId, showIds),
        eq(materialPermissions.canView, true),
        or(isNull(materialPermissions.expiresAt), gt(materialPermissions.expiresAt, now))
      ),
    });

    // Combine all permissions
    const allPermissions = [...userPermissions, ...rolePermissions, ...allCastPermissions];

    // Get unique material IDs
    const scriptIds = new Set<string>();
    const trackIds = new Set<string>();
    const permissionMap = new Map<string, boolean>(); // materialId -> canDownload

    for (const perm of allPermissions) {
      const key = `${perm.materialType}-${perm.materialId}`;
      if (perm.materialType === "script") {
        scriptIds.add(perm.materialId);
      } else {
        trackIds.add(perm.materialId);
      }
      // If any permission allows download, allow it
      if (perm.canDownload) {
        permissionMap.set(key, true);
      } else if (!permissionMap.has(key)) {
        permissionMap.set(key, false);
      }
    }

    // Fetch scripts
    const accessibleScripts =
      scriptIds.size > 0
        ? await db.query.scripts.findMany({
            where: and(inArray(scripts.id, Array.from(scriptIds)), eq(scripts.isActive, true)),
          })
        : [];

    // Fetch tracks
    const accessibleTracks =
      trackIds.size > 0
        ? await db.query.minusTracks.findMany({
            where: inArray(minusTracks.id, Array.from(trackIds)),
          })
        : [];

    // Fetch show info for context
    const showInfo = await db.query.shows.findMany({
      where: inArray(shows.id, showIds),
      columns: {
        id: true,
        title: true,
      },
    });

    const showMap = new Map(showInfo.map((s) => [s.id, s.title]));

    // Add canDownload info to materials
    const scriptsWithPermissions = accessibleScripts.map((s) => ({
      ...s,
      canDownload: permissionMap.get(`script-${s.id}`) ?? false,
      showTitle: showMap.get(s.showId),
    }));

    const tracksWithPermissions = accessibleTracks.map((t) => ({
      ...t,
      canDownload: permissionMap.get(`track-${t.id}`) ?? false,
      showTitle: showMap.get(t.showId),
    }));

    return NextResponse.json({
      scripts: scriptsWithPermissions,
      tracks: tracksWithPermissions,
    });
  } catch (error) {
    console.error("Error fetching cast materials:", error);
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
  }
}
