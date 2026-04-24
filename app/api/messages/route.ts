import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, conversationParticipants, messages, users } from "@/lib/db/schema";
import { inboxQuerySchema, bulkConversationActionSchema } from "@/lib/validations/messages";
import { eq, and, desc, isNull, sql, inArray, type SQL } from "drizzle-orm";

type InboxFilter = "all" | "unread" | "archived";

function buildWhereConditions(userId: string, filter: InboxFilter): SQL | undefined {
  const baseConditions = and(
    eq(conversationParticipants.userId, userId),
    isNull(conversationParticipants.leftAt)
  );

  if (filter === "archived") {
    return and(baseConditions, eq(conversationParticipants.isArchived, true));
  }
  // "all" and "unread" both show non-archived conversations
  return and(baseConditions, eq(conversationParticipants.isArchived, false));
}

async function fetchUnreadCounts(
  userId: string,
  conversationIds: string[]
): Promise<Map<string, number>> {
  const unreadCounts = await db
    .select({
      conversationId: messages.conversationId,
      count: sql<number>`count(*)::int`,
    })
    .from(messages)
    .innerJoin(
      conversationParticipants,
      and(
        eq(conversationParticipants.conversationId, messages.conversationId),
        eq(conversationParticipants.userId, userId)
      )
    )
    .where(
      and(
        inArray(messages.conversationId, conversationIds),
        isNull(messages.deletedAt),
        sql`${messages.createdAt} > COALESCE(${conversationParticipants.lastReadAt}, '1970-01-01')`
      )
    )
    .groupBy(messages.conversationId);

  const map = new Map<string, number>();
  for (const count of unreadCounts) {
    map.set(count.conversationId, count.count);
  }
  return map;
}

interface ParticipantResult {
  conversationId: string;
  userId: string;
  userName: string | null;
  userImage: string | null;
  userEmail: string;
}

async function fetchParticipants(conversationIds: string[]): Promise<ParticipantResult[]> {
  return db
    .select({
      conversationId: conversationParticipants.conversationId,
      userId: users.id,
      userName: users.name,
      userImage: users.image,
      userEmail: users.email,
    })
    .from(conversationParticipants)
    .innerJoin(users, eq(conversationParticipants.userId, users.id))
    .where(
      and(
        inArray(conversationParticipants.conversationId, conversationIds),
        isNull(conversationParticipants.leftAt)
      )
    );
}

async function fetchTotalUnread(userId: string): Promise<number> {
  const result = await db
    .select({
      count: sql<number>`count(DISTINCT ${messages.id})::int`,
    })
    .from(messages)
    .innerJoin(
      conversationParticipants,
      and(
        eq(conversationParticipants.conversationId, messages.conversationId),
        eq(conversationParticipants.userId, userId),
        isNull(conversationParticipants.leftAt),
        eq(conversationParticipants.isArchived, false)
      )
    )
    .where(
      and(
        isNull(messages.deletedAt),
        sql`${messages.createdAt} > COALESCE(${conversationParticipants.lastReadAt}, '1970-01-01')`
      )
    );

  return result[0]?.count ?? 0;
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = inboxQuerySchema.safeParse({
      filter: searchParams.get("filter") ?? "all",
      limit: searchParams.get("limit") ?? 20,
      offset: searchParams.get("offset") ?? 0,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { filter, limit, offset } = parsed.data;
    const whereConditions = buildWhereConditions(session.user.id, filter);

    const userConversations = await db
      .select({
        conversation: conversations,
        participant: conversationParticipants,
        lastMessage: messages,
      })
      .from(conversationParticipants)
      .innerJoin(conversations, eq(conversationParticipants.conversationId, conversations.id))
      .leftJoin(
        messages,
        and(eq(messages.conversationId, conversations.id), isNull(messages.deletedAt))
      )
      .where(whereConditions)
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);

    // Deduplicate conversations
    const conversationMap = new Map<
      string,
      {
        conversation: typeof conversations.$inferSelect;
        participant: typeof conversationParticipants.$inferSelect;
        lastMessage: typeof messages.$inferSelect | null;
      }
    >();

    for (const row of userConversations) {
      if (!conversationMap.has(row.conversation.id)) {
        conversationMap.set(row.conversation.id, {
          conversation: row.conversation,
          participant: row.participant,
          lastMessage: row.lastMessage,
        });
      }
    }

    const conversationIds = Array.from(conversationMap.keys());

    if (conversationIds.length === 0) {
      return NextResponse.json({ conversations: [], totalUnread: 0 });
    }

    const [unreadMap, allParticipants, totalUnread] = await Promise.all([
      fetchUnreadCounts(session.user.id, conversationIds),
      fetchParticipants(conversationIds),
      fetchTotalUnread(session.user.id),
    ]);

    const result = Array.from(conversationMap.values()).map((item) => {
      const otherParticipants = allParticipants
        .filter((p) => p.conversationId === item.conversation.id && p.userId !== session.user.id)
        .map((p) => ({ id: p.userId, name: p.userName, image: p.userImage, email: p.userEmail }));

      return {
        id: item.conversation.id,
        type: item.conversation.type,
        subject: item.conversation.subject,
        lastMessageAt: item.conversation.lastMessageAt,
        lastMessage: item.lastMessage
          ? {
              id: item.lastMessage.id,
              content: item.lastMessage.content,
              createdAt: item.lastMessage.createdAt,
              senderId: item.lastMessage.senderId,
            }
          : null,
        unreadCount: unreadMap.get(item.conversation.id) ?? 0,
        isArchived: item.participant.isArchived,
        isMuted: item.participant.isMuted,
        participants: otherParticipants,
      };
    });

    return NextResponse.json({ conversations: result, totalUnread });
  } catch (error) {
    console.error("Error fetching inbox:", error);
    return NextResponse.json({ error: "Failed to fetch inbox" }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = bulkConversationActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { conversationIds, action } = parsed.data;

    const userParticipations = await db
      .select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.userId, session.user.id),
          inArray(conversationParticipants.conversationId, conversationIds),
          isNull(conversationParticipants.leftAt)
        )
      );

    const validConversationIds = userParticipations.map((p) => p.conversationId);

    if (validConversationIds.length === 0) {
      return NextResponse.json({ error: "No valid conversations found" }, { status: 404 });
    }

    const updateWhere = and(
      eq(conversationParticipants.userId, session.user.id),
      inArray(conversationParticipants.conversationId, validConversationIds)
    );

    const getUpdateData = (): Partial<typeof conversationParticipants.$inferInsert> => {
      switch (action) {
        case "archive":
          return { isArchived: true };
        case "unarchive":
          return { isArchived: false };
        case "markRead":
          return { lastReadAt: new Date() };
        case "delete":
          return { leftAt: new Date() };
      }
    };

    await db.update(conversationParticipants).set(getUpdateData()).where(updateWhere);

    return NextResponse.json({ success: true, updatedCount: validConversationIds.length });
  } catch (error) {
    console.error("Error performing bulk action:", error);
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
