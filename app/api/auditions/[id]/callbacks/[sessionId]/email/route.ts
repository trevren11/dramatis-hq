import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  auditions,
  callbackSessions,
  callbackInvitations,
  talentProfiles,
  producerProfiles,
  users,
} from "@/lib/db/schema";
import { sendCallbackEmailsSchema } from "@/lib/validations/callbacks";
import { eq, and, inArray } from "drizzle-orm";

interface EmailResult {
  invitationId: string;
  email: string;
  status: "sent" | "failed";
  error?: string;
}

interface EmailParams {
  subject: string;
  body: string;
  callbackSessionName: string;
}

async function processInvitationEmail(
  invitation: {
    id: string;
    talentProfileId: string;
    scheduledDate: Date | null;
    scheduledTime: string | null;
  },
  emailParams: EmailParams
): Promise<EmailResult> {
  const talent = await db.query.talentProfiles.findFirst({
    where: eq(talentProfiles.id, invitation.talentProfileId),
  });

  if (!talent) {
    return {
      invitationId: invitation.id,
      email: "",
      status: "failed",
      error: "Talent not found",
    };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, talent.userId),
  });

  if (!user?.email) {
    return {
      invitationId: invitation.id,
      email: "",
      status: "failed",
      error: "No email address",
    };
  }

  // In a real implementation, this would send an actual email
  // For now, we'll just mark it as sent
  const dateStr = invitation.scheduledDate?.toISOString() ?? "TBD";
  const timeStr = invitation.scheduledTime ?? "TBD";
  console.log(`Would send email to ${user.email}:
    Subject: ${emailParams.subject}
    Body: ${emailParams.body}
    Callback: ${emailParams.callbackSessionName}
    Date: ${dateStr}
    Time: ${timeStr}
  `);

  await db
    .update(callbackInvitations)
    .set({
      emailSentAt: new Date(),
      emailStatus: "sent",
      updatedAt: new Date(),
    })
    .where(eq(callbackInvitations.id, invitation.id));

  return {
    invitationId: invitation.id,
    email: user.email,
    status: "sent",
  };
}

/**
 * POST /api/auditions/[id]/callbacks/[sessionId]/email
 * Send callback notification emails
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId, sessionId } = await params;

    const audition = await db.query.auditions.findFirst({
      where: eq(auditions.id, auditionId),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== audition.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const callbackSession = await db.query.callbackSessions.findFirst({
      where: and(eq(callbackSessions.id, sessionId), eq(callbackSessions.auditionId, auditionId)),
    });

    if (!callbackSession) {
      return NextResponse.json({ error: "Callback session not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = sendCallbackEmailsSchema.safeParse({
      ...body,
      callbackSessionId: sessionId,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    let invitations;
    if (parsed.data.invitationIds && parsed.data.invitationIds.length > 0) {
      invitations = await db.query.callbackInvitations.findMany({
        where: and(
          eq(callbackInvitations.callbackSessionId, sessionId),
          inArray(callbackInvitations.id, parsed.data.invitationIds)
        ),
      });
    } else {
      invitations = await db.query.callbackInvitations.findMany({
        where: eq(callbackInvitations.callbackSessionId, sessionId),
      });
    }

    const emailParams: EmailParams = {
      subject: parsed.data.subject,
      body: parsed.data.body,
      callbackSessionName: callbackSession.name,
    };

    const emailResults: EmailResult[] = [];

    for (const invitation of invitations) {
      try {
        const result = await processInvitationEmail(invitation, emailParams);
        emailResults.push(result);
      } catch (error) {
        emailResults.push({
          invitationId: invitation.id,
          email: "",
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const sentCount = emailResults.filter((r) => r.status === "sent").length;
    const failedCount = emailResults.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      results: emailResults,
      summary: {
        total: emailResults.length,
        sent: sentCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error("Error sending callback emails:", error);
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 });
  }
}
