import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, conversationParticipants, messages, users } from "@/lib/db/schema";
import { replyMessageSchema, conversationActionSchema } from "@/lib/validations/messages";
import { eq, and, desc, isNull, asc } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

function parseAttachments(json: string): Attachment[] {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed as Attachment[];
  } catch {
    return [];
  }
}

// Get conversation with messages
export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;

    // Verify user is participant
    const participation = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, session.user.id),
        isNull(conversationParticipants.leftAt)
      ),
    });

    if (!participation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get conversation details
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get messages with sender info
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);

    const messagesQuery = db
      .select({
        message: messages,
        sender: {
          id: users.id,
          name: users.name,
          image: users.image,
          email: users.email,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(and(eq(messages.conversationId, conversationId), isNull(messages.deletedAt)))
      .orderBy(desc(messages.createdAt))
      .limit(limit + 1);

    const messageResults = await messagesQuery;

    // Check if there are more messages
    const hasMore = messageResults.length > limit;
    const messagesToReturn = hasMore ? messageResults.slice(0, limit) : messageResults;

    // Get all participants
    const participants = await db
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
        email: users.email,
        joinedAt: conversationParticipants.joinedAt,
        leftAt: conversationParticipants.leftAt,
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(conversationParticipants.userId, users.id))
      .where(eq(conversationParticipants.conversationId, conversationId))
      .orderBy(asc(conversationParticipants.joinedAt));

    // Mark as read
    await db
      .update(conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, session.user.id)
        )
      );

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        type: conversation.type,
        subject: conversation.subject,
        createdAt: conversation.createdAt,
        participants: participants.map((p) => ({
          id: p.id,
          name: p.name,
          image: p.image,
          email: p.email,
          isActive: !p.leftAt,
        })),
      },
      messages: messagesToReturn.reverse().map((m) => ({
        id: m.message.id,
        content: m.message.content,
        createdAt: m.message.createdAt,
        isEdited: m.message.isEdited,
        editedAt: m.message.editedAt,
        parentMessageId: m.message.parentMessageId,
        attachments: m.message.attachments ? parseAttachments(m.message.attachments) : [],
        sender: m.sender,
        isOwn: m.message.senderId === session.user.id,
      })),
      hasMore,
      nextCursor: hasMore ? (messagesToReturn.at(-1)?.message.id ?? null) : null,
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
  }
}

// Reply to conversation
export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;

    // Verify user is participant
    const participation = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, session.user.id),
        isNull(conversationParticipants.leftAt)
      ),
    });

    if (!participation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = replyMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { content, parentMessageId, attachments } = parsed.data;

    // If replying to a message, verify it exists in this conversation
    if (parentMessageId) {
      const parentMessage = await db.query.messages.findFirst({
        where: and(
          eq(messages.id, parentMessageId),
          eq(messages.conversationId, conversationId),
          isNull(messages.deletedAt)
        ),
      });

      if (!parentMessage) {
        return NextResponse.json({ error: "Parent message not found" }, { status: 404 });
      }
    }

    // Create message
    const insertedMessages = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: session.user.id,
        content,
        parentMessageId,
        attachments: attachments ? JSON.stringify(attachments) : null,
      })
      .returning();

    const newMessage = insertedMessages[0];
    if (!newMessage) {
      return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
    }

    // Update conversation's lastMessageAt
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    // Update sender's lastReadAt
    await db
      .update(conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, session.user.id)
        )
      );

    return NextResponse.json(
      {
        message: {
          id: newMessage.id,
          content: newMessage.content,
          createdAt: newMessage.createdAt,
          parentMessageId: newMessage.parentMessageId,
          attachments: attachments ?? [],
          isOwn: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

// Update conversation settings (archive, mute, etc.)
export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;

    // Verify user is participant
    const participation = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, session.user.id),
        isNull(conversationParticipants.leftAt)
      ),
    });

    if (!participation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = conversationActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { action } = parsed.data;
    const updateData: Partial<typeof conversationParticipants.$inferInsert> = {};

    switch (action) {
      case "archive":
        updateData.isArchived = true;
        break;
      case "unarchive":
        updateData.isArchived = false;
        break;
      case "mute":
        updateData.isMuted = true;
        break;
      case "unmute":
        updateData.isMuted = false;
        break;
      case "markRead":
        updateData.lastReadAt = new Date();
        break;
    }

    await db
      .update(conversationParticipants)
      .set(updateData)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }
}

// Leave conversation (soft delete)
export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;

    // Verify user is participant
    const participation = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, session.user.id),
        isNull(conversationParticipants.leftAt)
      ),
    });

    if (!participation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Soft delete by setting leftAt
    await db
      .update(conversationParticipants)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving conversation:", error);
    return NextResponse.json({ error: "Failed to leave conversation" }, { status: 500 });
  }
}
