import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shows, producerProfiles, emailTemplates, DEFAULT_TEMPLATES } from "@/lib/db/schema";
import { emailTemplateCreateSchema } from "@/lib/validations/notifications";
import { eq, and, desc } from "drizzle-orm";

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

    const templates = await db.query.emailTemplates.findMany({
      where: eq(emailTemplates.organizationId, producerProfile.id),
      orderBy: [desc(emailTemplates.isDefault), desc(emailTemplates.createdAt)],
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
    const parsed = emailTemplateCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (parsed.data.isDefault) {
      await db
        .update(emailTemplates)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(emailTemplates.organizationId, producerProfile.id),
            eq(emailTemplates.type, parsed.data.type)
          )
        );
    }

    const [template] = await db
      .insert(emailTemplates)
      .values({
        organizationId: producerProfile.id,
        name: parsed.data.name,
        type: parsed.data.type,
        subject: parsed.data.subject,
        body: parsed.data.body,
        isDefault: parsed.data.isDefault,
        isActive: parsed.data.isActive,
        mergeFields: parsed.data.mergeFields,
        createdBy: session.user.id,
      })
      .returning();

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

    const existingTemplates = await db.query.emailTemplates.findMany({
      where: eq(emailTemplates.organizationId, producerProfile.id),
    });

    if (existingTemplates.length > 0) {
      return NextResponse.json({
        message: "Default templates already exist",
        templates: existingTemplates,
      });
    }

    const defaultTemplates = await Promise.all(
      Object.entries(DEFAULT_TEMPLATES).map(async ([type, template]) => {
        const [created] = await db
          .insert(emailTemplates)
          .values({
            organizationId: producerProfile.id,
            name: template.name,
            type: type as "cast_notification" | "callback_notification" | "rejection",
            subject: template.subject,
            body: template.body,
            isDefault: true,
            isActive: true,
            createdBy: session.user.id,
          })
          .returning();
        return created;
      })
    );

    return NextResponse.json({ templates: defaultTemplates }, { status: 201 });
  } catch (error) {
    console.error("Error initializing templates:", error);
    return NextResponse.json({ error: "Failed to initialize templates" }, { status: 500 });
  }
}
