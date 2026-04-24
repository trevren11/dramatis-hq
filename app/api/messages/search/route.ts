import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, conversationParticipants, messages, users } from "@/lib/db/schema";
import { searchMessagesSchema } from "@/lib/validations/messages";
import { eq, and, desc, isNull, sql, ilike, gte, lte, inArray, type SQL } from "drizzle-orm";

interface SearchParams {
  query: string;
  conversationId?: string;
  senderId?: string;
  startDate?: Date;
  endDate?: Date;
}

function buildSearchConditions(conversationIds: string[], params: SearchParams): SQL | undefined {
  const conditions: (SQL | undefined)[] = [
    inArray(messages.conversationId, conversationIds),
    isNull(messages.deletedAt),
    ilike(messages.content, `%${params.query}%`),
  ];

  if (params.conversationId) {
    conditions.push(eq(messages.conversationId, params.conversationId));
  }
  if (params.senderId) {
    conditions.push(eq(messages.senderId, params.senderId));
  }
  if (params.startDate) {
    conditions.push(gte(messages.createdAt, params.startDate));
  }
  if (params.endDate) {
    conditions.push(lte(messages.createdAt, params.endDate));
  }

  return and(...conditions);
}

async function fetchParticipantsForConversations(
  convIds: string[],
  currentUserId: string
): Promise<Map<string, { id: string; name: string | null }[]>> {
  const participantsMap = new Map<string, { id: string; name: string | null }[]>();
  if (convIds.length === 0) return participantsMap;

  const allParticipants = await db
    .select({
      conversationId: conversationParticipants.conversationId,
      userId: users.id,
      userName: users.name,
    })
    .from(conversationParticipants)
    .innerJoin(users, eq(conversationParticipants.userId, users.id))
    .where(
      and(
        inArray(conversationParticipants.conversationId, convIds),
        isNull(conversationParticipants.leftAt)
      )
    );

  for (const p of allParticipants) {
    if (p.userId === currentUserId) continue;
    const existing = participantsMap.get(p.conversationId) ?? [];
    existing.push({ id: p.userId, name: p.userName });
    participantsMap.set(p.conversationId, existing);
  }

  return participantsMap;
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = searchMessagesSchema.safeParse({
      query: searchParams.get("query") ?? "",
      conversationId: searchParams.get("conversationId"),
      senderId: searchParams.get("senderId"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      limit: searchParams.get("limit") ?? 20,
      offset: searchParams.get("offset") ?? 0,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { query, conversationId, senderId, startDate, endDate, limit, offset } = parsed.data;

    // Get user's conversation IDs first
    const userConversationIds = await db
      .select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.userId, session.user.id),
          isNull(conversationParticipants.leftAt)
        )
      );

    const conversationIds = userConversationIds.map((c) => c.conversationId);

    if (conversationIds.length === 0) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const whereClause = buildSearchConditions(conversationIds, {
      query,
      conversationId,
      senderId,
      startDate,
      endDate,
    });

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;

    // Get matching messages with context
    const searchResults = await db
      .select({
        message: messages,
        sender: {
          id: users.id,
          name: users.name,
          image: users.image,
        },
        conversation: {
          id: conversations.id,
          subject: conversations.subject,
          type: conversations.type,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(whereClause)
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    // Get other participants for each conversation
    const uniqueConvIds = [...new Set(searchResults.map((r) => r.conversation.id))];
    const participantsMap = await fetchParticipantsForConversations(uniqueConvIds, session.user.id);

    const results = searchResults.map((r) => ({
      message: {
        id: r.message.id,
        content: r.message.content,
        createdAt: r.message.createdAt,
        highlightedContent: highlightQuery(r.message.content, query),
      },
      sender: r.sender,
      conversation: {
        id: r.conversation.id,
        subject: r.conversation.subject,
        type: r.conversation.type,
        participants: participantsMap.get(r.conversation.id) ?? [],
      },
    }));

    return NextResponse.json({
      results,
      total,
      hasMore: offset + results.length < total,
    });
  } catch (error) {
    console.error("Error searching messages:", error);
    return NextResponse.json({ error: "Failed to search messages" }, { status: 500 });
  }
}

function highlightQuery(content: string, query: string): string {
  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  return content.replace(regex, "<mark>$1</mark>");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
