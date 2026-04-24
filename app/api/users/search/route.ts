import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { or, ilike, isNull, ne, and } from "drizzle-orm";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);

    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const searchPattern = `%${query}%`;

    const results = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        userType: users.userType,
      })
      .from(users)
      .where(
        and(
          isNull(users.deletedAt),
          ne(users.id, session.user.id),
          or(ilike(users.name, searchPattern), ilike(users.email, searchPattern))
        )
      )
      .limit(limit);

    return NextResponse.json({ users: results });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}
