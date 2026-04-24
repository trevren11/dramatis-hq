import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, conversationParticipants, messages, users } from "@/lib/db/schema";
import { composeMessageSchema } from "@/lib/validations/messages";
import { eq, and, inArray, isNull } from "drizzle-orm";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = composeMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { recipientIds, subject, content, conversationType, attachments } = parsed.data;

    // Validate recipients exist
    const recipients = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(and(inArray(users.id, recipientIds), isNull(users.deletedAt)));

    if (recipients.length !== recipientIds.length) {
      return NextResponse.json({ error: "One or more recipients not found" }, { status: 400 });
    }

    // Check if direct message already exists between these two users
    const firstRecipient = recipientIds[0];
    if (conversationType === "direct" && recipientIds.length === 1 && firstRecipient) {
      const existingConversation = await findExistingDirectConversation(
        session.user.id,
        firstRecipient
      );

      if (existingConversation) {
        // Add message to existing conversation
        const insertedMessages = await db
          .insert(messages)
          .values({
            conversationId: existingConversation.id,
            senderId: session.user.id,
            content,
            attachments: attachments ? JSON.stringify(attachments) : null,
          })
          .returning();

        const newMessage = insertedMessages[0];
        if (!newMessage) {
          return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
        }

        // Update conversation lastMessageAt
        await db
          .update(conversations)
          .set({ lastMessageAt: new Date(), updatedAt: new Date() })
          .where(eq(conversations.id, existingConversation.id));

        // Update sender's lastReadAt
        await db
          .update(conversationParticipants)
          .set({ lastReadAt: new Date() })
          .where(
            and(
              eq(conversationParticipants.conversationId, existingConversation.id),
              eq(conversationParticipants.userId, session.user.id)
            )
          );

        // Unarchive for sender if archived
        await db
          .update(conversationParticipants)
          .set({ isArchived: false })
          .where(
            and(
              eq(conversationParticipants.conversationId, existingConversation.id),
              eq(conversationParticipants.userId, session.user.id)
            )
          );

        return NextResponse.json(
          {
            conversationId: existingConversation.id,
            message: {
              id: newMessage.id,
              content: newMessage.content,
              createdAt: newMessage.createdAt,
              isOwn: true,
            },
            isExisting: true,
          },
          { status: 201 }
        );
      }
    }

    // Create new conversation
    const insertedConversations = await db
      .insert(conversations)
      .values({
        type: conversationType,
        subject,
        createdById: session.user.id,
        lastMessageAt: new Date(),
      })
      .returning();

    const newConversation = insertedConversations[0];
    if (!newConversation) {
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }

    // Add all participants including sender
    const allParticipantIds = [session.user.id, ...recipientIds];
    await db.insert(conversationParticipants).values(
      allParticipantIds.map((userId) => ({
        conversationId: newConversation.id,
        userId,
        lastReadAt: userId === session.user.id ? new Date() : null,
      }))
    );

    // Create initial message
    const insertedMessages = await db
      .insert(messages)
      .values({
        conversationId: newConversation.id,
        senderId: session.user.id,
        content,
        attachments: attachments ? JSON.stringify(attachments) : null,
      })
      .returning();

    const newMessage = insertedMessages[0];
    if (!newMessage) {
      return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
    }

    // Get recipient info for response
    const recipientInfo = recipients.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
    }));

    return NextResponse.json(
      {
        conversationId: newConversation.id,
        conversation: {
          id: newConversation.id,
          type: newConversation.type,
          subject: newConversation.subject,
          createdAt: newConversation.createdAt,
          participants: recipientInfo,
        },
        message: {
          id: newMessage.id,
          content: newMessage.content,
          createdAt: newMessage.createdAt,
          isOwn: true,
        },
        isExisting: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error composing message:", error);
    return NextResponse.json({ error: "Failed to compose message" }, { status: 500 });
  }
}

async function findExistingDirectConversation(
  userId1: string,
  userId2: string
): Promise<{ id: string } | null> {
  // Find direct conversations where both users are participants
  const result = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .innerJoin(
      conversations,
      and(
        eq(conversationParticipants.conversationId, conversations.id),
        eq(conversations.type, "direct")
      )
    )
    .where(
      and(eq(conversationParticipants.userId, userId1), isNull(conversationParticipants.leftAt))
    );

  for (const row of result) {
    // Check if the other user is also a participant
    const otherParticipant = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, row.conversationId),
        eq(conversationParticipants.userId, userId2),
        isNull(conversationParticipants.leftAt)
      ),
    });

    if (otherParticipant) {
      // Verify it's only a 2-person conversation
      const participantCount = await db
        .select({ conversationId: conversationParticipants.conversationId })
        .from(conversationParticipants)
        .where(
          and(
            eq(conversationParticipants.conversationId, row.conversationId),
            isNull(conversationParticipants.leftAt)
          )
        );

      if (participantCount.length === 2) {
        return { id: row.conversationId };
      }
    }
  }

  return null;
}
