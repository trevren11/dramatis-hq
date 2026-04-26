import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resumeConfigurations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { resumeTemplateSchema } from "@/lib/resume/types";

const createConfigSchema = z.object({
  name: z.string().min(1).max(100),
  template: resumeTemplateSchema.default("theatrical"),
  selectedWorkHistory: z.array(z.string()).default([]),
  selectedEducation: z.array(z.string()).default([]),
  selectedSkills: z.array(z.string()).default([]),
  includeHeadshot: z.boolean().default(true),
  includeContact: z.boolean().default(true),
  includeHeight: z.boolean().default(true),
  includeHair: z.boolean().default(true),
  includeEyes: z.boolean().default(true),
});

// GET - List all resume configurations for the current user
export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configs = await db.query.resumeConfigurations.findMany({
      where: eq(resumeConfigurations.userId, session.user.id),
      orderBy: (configs, { desc }) => [desc(configs.updatedAt)],
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error("Error fetching resume configurations:", error);
    return NextResponse.json({ error: "Failed to fetch configurations" }, { status: 500 });
  }
}

// POST - Create a new resume configuration
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parseResult = createConfigSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    const [newConfig] = await db
      .insert(resumeConfigurations)
      .values({
        userId: session.user.id,
        name: data.name,
        template: data.template,
        selectedWorkHistory: data.selectedWorkHistory,
        selectedEducation: data.selectedEducation,
        selectedSkills: data.selectedSkills,
        includeHeadshot: data.includeHeadshot,
        includeContact: data.includeContact,
        includeHeight: data.includeHeight,
        includeHair: data.includeHair,
        includeEyes: data.includeEyes,
      })
      .returning();

    return NextResponse.json(newConfig, { status: 201 });
  } catch (error) {
    console.error("Error creating resume configuration:", error);
    return NextResponse.json({ error: "Failed to create configuration" }, { status: 500 });
  }
}
