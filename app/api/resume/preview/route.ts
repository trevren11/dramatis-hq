import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateResumePdf, createSampleProfile } from "@/lib/resume";
import { talentProfileSchema } from "@/lib/resume/types";

const previewRequestSchema = z.object({
  profile: talentProfileSchema.optional(),
  includeHeadshot: z.boolean().optional(),
  includeContact: z.boolean().optional(),
  selectedWorkHistory: z.array(z.string()).optional(),
  selectedEducation: z.array(z.string()).optional(),
  selectedSkills: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parseResult = previewRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      profile: profileData,
      includeHeadshot,
      includeContact,
      selectedWorkHistory,
      selectedEducation,
      selectedSkills,
    } = parseResult.data;

    const profile = profileData ?? createSampleProfile();

    const { buffer, contentType } = await generateResumePdf({
      profile,
      config: {
        includeHeadshot: includeHeadshot ?? true,
        includeContact: includeContact ?? true,
      },
      selectedWorkHistoryIds: selectedWorkHistory,
      selectedEducationIds: selectedEducation,
      selectedSkills,
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Resume preview error:", error);
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const profile = createSampleProfile();

    const { buffer, contentType } = await generateResumePdf({
      profile,
      config: {
        includeHeadshot: true,
        includeContact: true,
      },
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Resume preview error:", error);
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}
