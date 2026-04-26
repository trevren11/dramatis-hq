import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSampleProfile, talentProfileSchema, resumeTemplateSchema } from "@/lib/resume";

const previewRequestSchema = z.object({
  profile: talentProfileSchema.optional(),
  includeHeadshot: z.boolean().optional(),
  includeContact: z.boolean().optional(),
  includeHeight: z.boolean().optional(),
  includeHair: z.boolean().optional(),
  includeEyes: z.boolean().optional(),
  template: resumeTemplateSchema.optional(),
  selectedWorkHistory: z.array(z.string()).optional(),
  selectedEducation: z.array(z.string()).optional(),
  selectedSkills: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Dynamic import to prevent @react-pdf/renderer from being bundled into static pages
    const { generateResumePdf } = await import("@/lib/resume/generator");

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
      includeHeight,
      includeHair,
      includeEyes,
      template,
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
        includeHeight: includeHeight ?? true,
        includeHair: includeHair ?? true,
        includeEyes: includeEyes ?? true,
      },
      selectedWorkHistoryIds: selectedWorkHistory,
      selectedEducationIds: selectedEducation,
      selectedSkills,
      template: template ?? "theatrical",
    });

    return new NextResponse(new Uint8Array(buffer), {
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
    // Dynamic import to prevent @react-pdf/renderer from being bundled into static pages
    const { generateResumePdf } = await import("@/lib/resume/generator");

    const profile = createSampleProfile();

    const { buffer, contentType } = await generateResumePdf({
      profile,
      config: {
        includeHeadshot: true,
        includeContact: true,
      },
    });

    return new NextResponse(new Uint8Array(buffer), {
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
