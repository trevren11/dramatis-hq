import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  noteTemplates,
  DEFAULT_DEPARTMENT_TEMPLATES,
} from "@/lib/db/schema";
import { templateCreateSchema } from "@/lib/validations/production-notes";
import { eq, and, desc } from "drizzle-orm";
import type { DepartmentType } from "@/lib/db/schema/production-notes";

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

    const templates = await db.query.noteTemplates.findMany({
      where: eq(noteTemplates.showId, showId),
      orderBy: [desc(noteTemplates.isDefault), desc(noteTemplates.createdAt)],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
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
    const parsed = templateCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (parsed.data.isDefault && parsed.data.departmentType) {
      await db
        .update(noteTemplates)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(noteTemplates.showId, showId),
            eq(noteTemplates.departmentType, parsed.data.departmentType)
          )
        );
    }

    const [template] = await db
      .insert(noteTemplates)
      .values({
        showId,
        name: parsed.data.name,
        description: parsed.data.description,
        content: parsed.data.content,
        departmentType: parsed.data.departmentType,
        isDefault: parsed.data.isDefault,
        createdBy: session.user.id,
      })
      .returning();

    if (!template) {
      return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

export async function PUT(_request: Request, { params }: RouteParams): Promise<NextResponse> {
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

    const existingTemplates = await db.query.noteTemplates.findMany({
      where: eq(noteTemplates.showId, showId),
    });

    if (existingTemplates.length > 0) {
      return NextResponse.json({
        message: "Default templates already exist",
        templates: existingTemplates,
      });
    }

    const defaultTemplates = await Promise.all(
      Object.entries(DEFAULT_DEPARTMENT_TEMPLATES).map(async ([type, template]) => {
        const [created] = await db
          .insert(noteTemplates)
          .values({
            showId,
            name: template.name,
            content: template.content,
            departmentType: type as DepartmentType,
            isDefault: true,
            createdBy: session.user.id,
          })
          .returning();
        if (!created) {
          throw new Error(`Failed to create template for ${type}`);
        }
        return created;
      })
    );

    return NextResponse.json({ templates: defaultTemplates }, { status: 201 });
  } catch (error) {
    console.error("Error initializing templates:", error);
    return NextResponse.json({ error: "Failed to initialize templates" }, { status: 500 });
  }
}
