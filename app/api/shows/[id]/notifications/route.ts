import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  castNotifications,
  castingAssignments,
  talentProfiles,
  roles,
  users,
} from "@/lib/db/schema";
import {
  castNotificationCreateSchema,
  castNotificationBatchSchema,
} from "@/lib/validations/notifications";
import { eq, and, inArray, desc } from "drizzle-orm";
import { format } from "date-fns";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface MergeFieldData {
  talent_name: string;
  talent_first_name: string;
  role_name: string;
  show_title: string;
  organization_name: string;
  response_deadline: string;
  rehearsal_start: string;
  performance_dates: string;
  venue: string;
  accept_link: string;
  decline_link: string;
}

function renderTemplate(template: string, data: MergeFieldData): string {
  let rendered = template;
  for (const [key, value] of Object.entries(data) as [string, string][]) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return rendered;
}

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

    const notifications = await db
      .select({
        notification: castNotifications,
        talent: {
          id: talentProfiles.id,
          firstName: talentProfiles.firstName,
          lastName: talentProfiles.lastName,
          stageName: talentProfiles.stageName,
        },
        role: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(castNotifications)
      .innerJoin(talentProfiles, eq(castNotifications.talentProfileId, talentProfiles.id))
      .innerJoin(roles, eq(castNotifications.roleId, roles.id))
      .where(eq(castNotifications.showId, showId))
      .orderBy(desc(castNotifications.createdAt));

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
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

    if (Array.isArray(body.assignmentIds)) {
      const parsed = castNotificationBatchSchema.safeParse(body);

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
          },
          role: {
            id: roles.id,
            name: roles.name,
          },
        })
        .from(castingAssignments)
        .innerJoin(talentProfiles, eq(castingAssignments.talentProfileId, talentProfiles.id))
        .innerJoin(roles, eq(castingAssignments.roleId, roles.id))
        .where(
          and(
            eq(castingAssignments.showId, showId),
            inArray(castingAssignments.id, parsed.data.assignmentIds)
          )
        );

      if (assignments.length === 0) {
        return NextResponse.json({ error: "No valid assignments found" }, { status: 404 });
      }

      const results = await Promise.all(
        // eslint-disable-next-line complexity
        assignments.map(async ({ assignment, talent, role }) => {
          const user = await db.query.users.findFirst({
            where: eq(users.id, talent.userId),
          });

          const mergeData: MergeFieldData = {
            talent_name: `${talent.firstName} ${talent.lastName}`,
            talent_first_name: talent.firstName,
            role_name: role.name,
            show_title: show.title,
            organization_name: producerProfile.companyName,
            response_deadline: parsed.data.responseDeadline
              ? format(parsed.data.responseDeadline, "MMMM d, yyyy")
              : "TBD",
            rehearsal_start: show.rehearsalStart
              ? format(show.rehearsalStart, "MMMM d, yyyy")
              : "TBD",
            performance_dates:
              show.performanceStart && show.performanceEnd
                ? `${format(show.performanceStart, "MMMM d")} - ${format(show.performanceEnd, "MMMM d, yyyy")}`
                : "TBD",
            venue: show.venue ?? "TBD",
            accept_link: `{{ACCEPT_LINK_${assignment.id}}}`,
            decline_link: `{{DECLINE_LINK_${assignment.id}}}`,
          };

          const renderedSubject = renderTemplate(parsed.data.subject, mergeData);
          const renderedBody = renderTemplate(parsed.data.body, mergeData);

          const existing = await db.query.castNotifications.findFirst({
            where: eq(castNotifications.assignmentId, assignment.id),
          });

          if (existing) {
            const [updated] = await db
              .update(castNotifications)
              .set({
                subject: parsed.data.subject,
                body: parsed.data.body,
                renderedBody,
                templateId: parsed.data.templateId,
                responseDeadline: parsed.data.responseDeadline,
                status: parsed.data.sendImmediately ? "sent" : "draft",
                sentAt: parsed.data.sendImmediately ? new Date() : null,
                sentBy: session.user.id,
                updatedAt: new Date(),
              })
              .where(eq(castNotifications.id, existing.id))
              .returning();

            if (parsed.data.sendImmediately && user?.email) {
              console.log(`Would send email to ${user.email}:
                Subject: ${renderedSubject}
                Body: ${renderedBody}
              `);
            }

            return { notification: updated, status: "updated" };
          }

          const [notification] = await db
            .insert(castNotifications)
            .values({
              showId,
              assignmentId: assignment.id,
              talentProfileId: talent.id,
              roleId: role.id,
              templateId: parsed.data.templateId,
              subject: parsed.data.subject,
              body: parsed.data.body,
              renderedBody,
              status: parsed.data.sendImmediately ? "sent" : "draft",
              sentAt: parsed.data.sendImmediately ? new Date() : null,
              responseDeadline: parsed.data.responseDeadline,
              sentBy: session.user.id,
            })
            .returning();

          if (parsed.data.sendImmediately && user?.email) {
            console.log(`Would send email to ${user.email}:
              Subject: ${renderedSubject}
              Body: ${renderedBody}
            `);
          }

          if (parsed.data.sendImmediately) {
            await db
              .update(castingAssignments)
              .set({ status: "tentative", updatedAt: new Date() })
              .where(eq(castingAssignments.id, assignment.id));
          }

          return { notification, status: "created" };
        })
      );

      const sentCount = results.filter((r) => r.notification?.status === "sent").length;

      return NextResponse.json({
        results,
        summary: {
          total: results.length,
          sent: sentCount,
          draft: results.length - sentCount,
        },
      });
    }

    const parsed = castNotificationCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const assignment = await db
      .select({
        assignment: castingAssignments,
        talent: {
          id: talentProfiles.id,
          firstName: talentProfiles.firstName,
          lastName: talentProfiles.lastName,
        },
        role: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(castingAssignments)
      .innerJoin(talentProfiles, eq(castingAssignments.talentProfileId, talentProfiles.id))
      .innerJoin(roles, eq(castingAssignments.roleId, roles.id))
      .where(
        and(
          eq(castingAssignments.showId, showId),
          eq(castingAssignments.id, parsed.data.assignmentId)
        )
      )
      .then((rows) => rows[0]);

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const mergeData: MergeFieldData = {
      talent_name: `${assignment.talent.firstName} ${assignment.talent.lastName}`,
      talent_first_name: assignment.talent.firstName,
      role_name: assignment.role.name,
      show_title: show.title,
      organization_name: producerProfile.companyName,
      response_deadline: parsed.data.responseDeadline
        ? format(parsed.data.responseDeadline, "MMMM d, yyyy")
        : "TBD",
      rehearsal_start: show.rehearsalStart ? format(show.rehearsalStart, "MMMM d, yyyy") : "TBD",
      performance_dates:
        show.performanceStart && show.performanceEnd
          ? `${format(show.performanceStart, "MMMM d")} - ${format(show.performanceEnd, "MMMM d, yyyy")}`
          : "TBD",
      venue: show.venue ?? "TBD",
      accept_link: `{{ACCEPT_LINK}}`,
      decline_link: `{{DECLINE_LINK}}`,
    };

    const renderedBody = renderTemplate(parsed.data.body, mergeData);

    const [notification] = await db
      .insert(castNotifications)
      .values({
        showId,
        assignmentId: parsed.data.assignmentId,
        talentProfileId: assignment.talent.id,
        roleId: assignment.role.id,
        templateId: parsed.data.templateId,
        subject: parsed.data.subject,
        body: parsed.data.body,
        renderedBody,
        responseDeadline: parsed.data.responseDeadline,
        sentBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}
