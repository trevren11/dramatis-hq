import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shows, producerProfiles, productionActivity, users } from "@/lib/db/schema";
import { activityQuerySchema } from "@/lib/validations/production-notes";
import { eq, desc, and, type SQL } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse> {
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

    const url = new URL(request.url);
    const queryParams = {
      departmentId: url.searchParams.get("departmentId"),
      limit: url.searchParams.get("limit"),
      offset: url.searchParams.get("offset"),
    };

    const parsed = activityQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const conditions: SQL[] = [eq(productionActivity.showId, showId)];
    if (parsed.data.departmentId) {
      conditions.push(eq(productionActivity.departmentId, parsed.data.departmentId));
    }

    const activities = await db
      .select({
        id: productionActivity.id,
        showId: productionActivity.showId,
        departmentId: productionActivity.departmentId,
        activityType: productionActivity.activityType,
        entityId: productionActivity.entityId,
        entityType: productionActivity.entityType,
        description: productionActivity.description,
        metadata: productionActivity.metadata,
        userId: productionActivity.userId,
        createdAt: productionActivity.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(productionActivity)
      .leftJoin(users, eq(productionActivity.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(productionActivity.createdAt))
      .limit(parsed.data.limit)
      .offset(parsed.data.offset);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
