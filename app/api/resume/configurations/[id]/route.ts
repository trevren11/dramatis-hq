import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resumeConfigurations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { resumeTemplateSchema } from "@/lib/resume/types";

const updateConfigSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  template: resumeTemplateSchema.optional(),
  selectedWorkHistory: z.array(z.string()).optional(),
  selectedEducation: z.array(z.string()).optional(),
  selectedSkills: z.array(z.string()).optional(),
  includeHeadshot: z.boolean().optional(),
  includeContact: z.boolean().optional(),
  includeHeight: z.boolean().optional(),
  includeHair: z.boolean().optional(),
  includeEyes: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get a single resume configuration
export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const config = await db.query.resumeConfigurations.findFirst({
      where: and(eq(resumeConfigurations.id, id), eq(resumeConfigurations.userId, session.user.id)),
    });

    if (!config) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching resume configuration:", error);
    return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 });
  }
}

// PUT - Update a resume configuration
export async function PUT(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify ownership
    const existing = await db.query.resumeConfigurations.findFirst({
      where: and(eq(resumeConfigurations.id, id), eq(resumeConfigurations.userId, session.user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parseResult = updateConfigSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    const [updated] = await db
      .update(resumeConfigurations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(resumeConfigurations.id, id), eq(resumeConfigurations.userId, session.user.id)))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating resume configuration:", error);
    return NextResponse.json({ error: "Failed to update configuration" }, { status: 500 });
  }
}

// DELETE - Delete a resume configuration
export async function DELETE(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify ownership
    const existing = await db.query.resumeConfigurations.findFirst({
      where: and(eq(resumeConfigurations.id, id), eq(resumeConfigurations.userId, session.user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    await db
      .delete(resumeConfigurations)
      .where(
        and(eq(resumeConfigurations.id, id), eq(resumeConfigurations.userId, session.user.id))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting resume configuration:", error);
    return NextResponse.json({ error: "Failed to delete configuration" }, { status: 500 });
  }
}
