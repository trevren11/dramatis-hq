import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  roles,
  castingAssignments,
  talentProfiles,
  users,
  castNotifications,
} from "@/lib/db/schema";
import { castListExportSchema } from "@/lib/validations/notifications";
import { eq, and, asc, inArray } from "drizzle-orm";
import { format } from "date-fns";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface CastMember {
  roleName: string;
  roleType: string | null;
  talentName: string;
  stageName: string | null;
  status: string;
  email?: string;
  phone?: string;
  notificationStatus?: string;
  responseType?: string;
}

type GroupedCast = Record<string, CastMember[]>;

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
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

    const showRoles = await db.query.roles.findMany({
      where: eq(roles.showId, showId),
      orderBy: [asc(roles.sortOrder)],
    });

    const assignments = await db
      .select({
        assignment: castingAssignments,
        talent: {
          id: talentProfiles.id,
          userId: talentProfiles.userId,
          firstName: talentProfiles.firstName,
          lastName: talentProfiles.lastName,
          stageName: talentProfiles.stageName,
          phone: talentProfiles.phone,
        },
        role: {
          id: roles.id,
          name: roles.name,
          type: roles.type,
          sortOrder: roles.sortOrder,
        },
      })
      .from(castingAssignments)
      .innerJoin(talentProfiles, eq(castingAssignments.talentProfileId, talentProfiles.id))
      .innerJoin(roles, eq(castingAssignments.roleId, roles.id))
      .where(eq(castingAssignments.showId, showId))
      .orderBy(asc(roles.sortOrder), asc(castingAssignments.slotIndex));

    const talentUserIds = assignments.map((a) => a.talent.userId);
    const talentUsers =
      talentUserIds.length > 0
        ? await db.query.users.findMany({
            where: inArray(users.id, talentUserIds),
          })
        : [];
    const userEmailMap = new Map(talentUsers.map((u) => [u.id, u.email]));

    const notifications = await db.query.castNotifications.findMany({
      where: eq(castNotifications.showId, showId),
    });
    const notificationMap = new Map(notifications.map((n) => [n.assignmentId, n]));

    const castList = assignments.map(({ assignment, talent, role }) => {
      const notification = notificationMap.get(assignment.id);
      return {
        roleId: role.id,
        roleName: role.name,
        roleType: role.type,
        sortOrder: role.sortOrder,
        talentId: talent.id,
        talentName: `${talent.firstName} ${talent.lastName}`,
        stageName: talent.stageName,
        status: assignment.status,
        email: userEmailMap.get(talent.userId),
        phone: talent.phone,
        notificationStatus: notification?.status,
        responseType: notification?.responseType,
        slotIndex: assignment.slotIndex,
      };
    });

    const summary = {
      total: castList.length,
      confirmed: castList.filter((c) => c.status === "confirmed").length,
      tentative: castList.filter((c) => c.status === "tentative").length,
      declined: castList.filter((c) => c.status === "declined").length,
      draft: castList.filter((c) => c.status === "draft").length,
      pending: castList.filter((c) => c.responseType === "pending").length,
    };

    return NextResponse.json({
      show: {
        id: show.id,
        title: show.title,
        venue: show.venue,
        rehearsalStart: show.rehearsalStart,
        performanceStart: show.performanceStart,
        performanceEnd: show.performanceEnd,
      },
      roles: showRoles,
      castList,
      summary,
    });
  } catch (error) {
    console.error("Error fetching cast list:", error);
    return NextResponse.json({ error: "Failed to fetch cast list" }, { status: 500 });
  }
}

// eslint-disable-next-line complexity
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
    const parsed = castListExportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const assignments = await db
      .select({
        assignment: castingAssignments,
        talent: {
          id: talentProfiles.id,
          userId: talentProfiles.userId,
          firstName: talentProfiles.firstName,
          lastName: talentProfiles.lastName,
          stageName: talentProfiles.stageName,
          phone: talentProfiles.phone,
        },
        role: {
          id: roles.id,
          name: roles.name,
          type: roles.type,
          sortOrder: roles.sortOrder,
        },
      })
      .from(castingAssignments)
      .innerJoin(talentProfiles, eq(castingAssignments.talentProfileId, talentProfiles.id))
      .innerJoin(roles, eq(castingAssignments.roleId, roles.id))
      .where(
        parsed.data.filterStatus
          ? and(
              eq(castingAssignments.showId, showId),
              inArray(castingAssignments.status, parsed.data.filterStatus)
            )
          : eq(castingAssignments.showId, showId)
      )
      .orderBy(asc(roles.sortOrder), asc(castingAssignments.slotIndex));

    const talentUserIds = assignments.map((a) => a.talent.userId);
    const talentUsers =
      talentUserIds.length > 0
        ? await db.query.users.findMany({
            where: inArray(users.id, talentUserIds),
          })
        : [];
    const userEmailMap = new Map(talentUsers.map((u) => [u.id, u.email]));

    const castMembers: CastMember[] = assignments.map(({ assignment, talent, role }) => ({
      roleName: role.name,
      roleType: role.type,
      talentName: `${talent.firstName} ${talent.lastName}`,
      stageName: talent.stageName,
      status: assignment.status,
      ...(parsed.data.includeContact && {
        email: userEmailMap.get(talent.userId),
        phone: talent.phone ?? undefined,
      }),
    }));

    if (parsed.data.format === "csv") {
      const headers = [
        "Role",
        "Actor",
        ...(parsed.data.includeStatus ? ["Status"] : []),
        ...(parsed.data.includeContact ? ["Email", "Phone"] : []),
      ];

      const rows = castMembers.map((member) => [
        member.roleName,
        member.stageName ?? member.talentName,
        ...(parsed.data.includeStatus ? [member.status] : []),
        ...(parsed.data.includeContact ? [member.email ?? "", member.phone ?? ""] : []),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${show.title.replace(/[^a-z0-9]/gi, "_")}_cast_list.csv"`,
        },
      });
    }

    let groupedCast: GroupedCast = {};
    if (parsed.data.groupByRole) {
      groupedCast = castMembers.reduce<GroupedCast>((acc, member) => {
        const type = member.roleType ?? "other";
        acc[type] ??= [];
        acc[type].push(member);
        return acc;
      }, {});
    }

    const pdfData = {
      title: `Cast List - ${show.title}`,
      show: {
        title: show.title,
        venue: show.venue,
        dates:
          show.performanceStart && show.performanceEnd
            ? `${format(show.performanceStart, "MMMM d")} - ${format(show.performanceEnd, "MMMM d, yyyy")}`
            : null,
      },
      organization: producerProfile.companyName,
      generatedAt: format(new Date(), "MMMM d, yyyy 'at' h:mm a"),
      groupedCast: parsed.data.groupByRole ? groupedCast : null,
      castList: parsed.data.groupByRole ? null : castMembers,
      options: {
        includeContact: parsed.data.includeContact,
        includeStatus: parsed.data.includeStatus,
      },
    };

    return NextResponse.json({ pdfData });
  } catch (error) {
    console.error("Error exporting cast list:", error);
    return NextResponse.json({ error: "Failed to export cast list" }, { status: 500 });
  }
}
