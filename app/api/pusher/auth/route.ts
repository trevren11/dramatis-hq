import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPusherServer } from "@/lib/pusher-server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.text();
    const params = new URLSearchParams(body);
    const socketId = params.get("socket_id");
    const channel = params.get("channel_name");

    if (!socketId || !channel) {
      return NextResponse.json(
        { error: "Missing socket_id or channel_name" },
        { status: 400 }
      );
    }

    const pusher = getPusherServer();

    // Handle presence channels
    if (channel.startsWith("presence-")) {
      const presenceData = {
        user_id: session.user.id,
        user_info: {
          name: session.user.name ?? "Unknown",
          email: session.user.email ?? "",
          image: session.user.image ?? null,
        },
      };

      const authResponse = pusher.authorizeChannel(socketId, channel, presenceData);
      return NextResponse.json(authResponse);
    }

    // Handle private channels
    if (channel.startsWith("private-")) {
      // Validate channel access based on channel type
      const hasAccess = await validateChannelAccess(session.user.id, channel);
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Access denied to this channel" },
          { status: 403 }
        );
      }

      const authResponse = pusher.authorizeChannel(socketId, channel);
      return NextResponse.json(authResponse);
    }

    // Public channels don't need authorization
    return NextResponse.json({ error: "Invalid channel type" }, { status: 400 });
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

// Validate user access to private channels
async function validateChannelAccess(
  userId: string,
  channel: string
): Promise<boolean> {
  // Extract channel type and ID
  // Formats: private-casting-show-{id}, private-schedule-show-{id}, 
  //          private-chat-conv-{id}, private-notifications-{userId}

  // Notification channel - user can only access their own
  if (channel.startsWith("private-notifications-")) {
    const channelUserId = channel.replace("private-notifications-", "");
    return channelUserId === userId;
  }

  // For other channels, we'd typically check database for access
  // For now, allow authenticated users access to show/chat channels
  // TODO: Add proper authorization checks for show membership and conversation participation
  if (
    channel.startsWith("private-casting-show-") ||
    channel.startsWith("private-schedule-show-") ||
    channel.startsWith("private-chat-conv-")
  ) {
    return true;
  }

  return false;
}
