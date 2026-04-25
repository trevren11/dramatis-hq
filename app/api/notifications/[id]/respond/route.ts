import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  castNotifications,
  castingAssignments,
  talentProfiles,
  notificationEvents,
} from "@/lib/db/schema";
import { notificationResponseSchema } from "@/lib/validations/notifications";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: notificationId } = await params;

    const notification = await db.query.castNotifications.findFirst({
      where: eq(castNotifications.id, notificationId),
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const userAgent = request.headers.get("user-agent") ?? undefined;
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? undefined;

    if (notification.status !== "opened" && notification.status !== "clicked") {
      await db
        .update(castNotifications)
        .set({
          status: "opened",
          openedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(castNotifications.id, notificationId));
    }

    await db.insert(notificationEvents).values({
      notificationId,
      eventType: "opened",
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      notification: {
        id: notification.id,
        subject: notification.subject,
        renderedBody: notification.renderedBody ?? notification.body,
        responseType: notification.responseType,
        responseDeadline: notification.responseDeadline,
        respondedAt: notification.respondedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching notification:", error);
    return NextResponse.json({ error: "Failed to fetch notification" }, { status: 500 });
  }
}

// eslint-disable-next-line complexity
export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    const { id: notificationId } = await params;

    const notification = await db.query.castNotifications.findFirst({
      where: eq(castNotifications.id, notificationId),
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    if (session?.user.id) {
      const talentProfile = await db.query.talentProfiles.findFirst({
        where: eq(talentProfiles.userId, session.user.id),
      });

      if (talentProfile?.id !== notification.talentProfileId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (notification.responseType !== "pending") {
      return NextResponse.json(
        { error: "Already responded", currentResponse: notification.responseType },
        { status: 400 }
      );
    }

    if (notification.responseDeadline && new Date() > notification.responseDeadline) {
      return NextResponse.json({ error: "Response deadline has passed" }, { status: 400 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = notificationResponseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") ?? undefined;
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? undefined;

    const [updated] = await db
      .update(castNotifications)
      .set({
        responseType: parsed.data.responseType,
        responseNote: parsed.data.responseNote,
        respondedAt: new Date(),
        status: "responded",
        clickedAt: notification.clickedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(castNotifications.id, notificationId))
      .returning();

    await db.insert(notificationEvents).values({
      notificationId,
      eventType: `response_${parsed.data.responseType}`,
      eventData: { note: parsed.data.responseNote },
      ipAddress,
      userAgent,
    });

    const newAssignmentStatus = parsed.data.responseType === "accepted" ? "confirmed" : "declined";

    await db
      .update(castingAssignments)
      .set({
        status: newAssignmentStatus,
        updatedAt: new Date(),
      })
      .where(eq(castingAssignments.id, notification.assignmentId));

    return NextResponse.json({
      notification: updated,
      message:
        parsed.data.responseType === "accepted"
          ? "Congratulations! You have accepted the role."
          : "Your response has been recorded. Thank you for letting us know.",
    });
  } catch (error) {
    console.error("Error responding to notification:", error);
    return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
  }
}
