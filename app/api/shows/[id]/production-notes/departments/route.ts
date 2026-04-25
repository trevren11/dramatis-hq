import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  productionDepartments,
  productionActivity,
  DEPARTMENT_TYPE_OPTIONS,
} from "@/lib/db/schema";
import {
  departmentCreateSchema,
  initializeDepartmentsSchema,
} from "@/lib/validations/production-notes";
import { eq, and, asc } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
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

    const departments = await db.query.productionDepartments.findMany({
      where: eq(productionDepartments.showId, showId),
      orderBy: [asc(productionDepartments.sortOrder), asc(productionDepartments.createdAt)],
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

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
    const parsed = departmentCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existingCount = await db.query.productionDepartments.findMany({
      where: eq(productionDepartments.showId, showId),
    });

    const [department] = await db
      .insert(productionDepartments)
      .values({
        showId,
        name: parsed.data.name,
        type: parsed.data.type,
        description: parsed.data.description,
        color: parsed.data.color,
        icon: parsed.data.icon,
        sortOrder: parsed.data.sortOrder !== 0 ? parsed.data.sortOrder : existingCount.length,
        headUserId: parsed.data.headUserId,
        createdBy: session.user.id,
      })
      .returning();

    if (!department) {
      return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
    }

    await db.insert(productionActivity).values({
      showId,
      departmentId: department.id,
      activityType: "folder_created",
      entityId: department.id,
      entityType: "department",
      description: `Created department "${department.name}"`,
      userId: session.user.id,
    });

    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    console.error("Error creating department:", error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
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
    const parsed = initializeDepartmentsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existingDepartments = await db.query.productionDepartments.findMany({
      where: eq(productionDepartments.showId, showId),
    });

    const existingTypes = new Set(existingDepartments.map((d) => d.type));
    const newTypes = parsed.data.departmentTypes.filter((t) => !existingTypes.has(t));

    if (newTypes.length === 0) {
      return NextResponse.json({
        message: "All departments already exist",
        departments: existingDepartments,
      });
    }

    const newDepartments = await Promise.all(
      newTypes.map(async (type, index) => {
        const config = DEPARTMENT_TYPE_OPTIONS.find((opt) => opt.value === type);
        const [dept] = await db
          .insert(productionDepartments)
          .values({
            showId,
            name: config?.label ?? type,
            type,
            color: config?.color,
            icon: config?.icon,
            sortOrder: existingDepartments.length + index,
            createdBy: session.user.id,
          })
          .returning();
        if (!dept) {
          throw new Error(`Failed to create department ${type}`);
        }
        return dept;
      })
    );

    return NextResponse.json(
      { departments: [...existingDepartments, ...newDepartments] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error initializing departments:", error);
    return NextResponse.json({ error: "Failed to initialize departments" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
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

    const body = (await request.json()) as { departments?: { id: string; sortOrder: number }[] };

    if (!body.departments || body.departments.length === 0) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    await Promise.all(
      body.departments.map(async ({ id, sortOrder }) => {
        await db
          .update(productionDepartments)
          .set({ sortOrder, updatedAt: new Date() })
          .where(and(eq(productionDepartments.id, id), eq(productionDepartments.showId, showId)));
      })
    );

    const departments = await db.query.productionDepartments.findMany({
      where: eq(productionDepartments.showId, showId),
      orderBy: [asc(productionDepartments.sortOrder)],
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error("Error reordering departments:", error);
    return NextResponse.json({ error: "Failed to reorder departments" }, { status: 500 });
  }
}
