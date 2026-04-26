import { type NextRequest, NextResponse } from "next/server";
import {
  createSampleProfile,
  generateResumeRequestSchema,
  talentProfileSchema,
  resumeTemplateSchema,
} from "@/lib/resume";

const requestBodySchema = generateResumeRequestSchema.extend({
  profile: talentProfileSchema.optional(),
  includeHeight: generateResumeRequestSchema.shape.includeHeadshot,
  includeHair: generateResumeRequestSchema.shape.includeHeadshot,
  includeEyes: generateResumeRequestSchema.shape.includeHeadshot,
  template: resumeTemplateSchema.optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Dynamic import to prevent @react-pdf/renderer from being bundled into static pages
    const { generateResumePdf } = await import("@/lib/resume/generator");

    const body: unknown = await request.json();

    const parseResult = requestBodySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      selectedWorkHistory,
      selectedEducation,
      selectedSkills,
      includeHeadshot,
      includeContact,
      includeHeight,
      includeHair,
      includeEyes,
      template,
      profile: profileData,
    } = parseResult.data;

    const profile = profileData ?? createSampleProfile();

    const { buffer, filename, contentType } = await generateResumePdf({
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
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Resume generation error:", error);
    return NextResponse.json({ error: "Failed to generate resume" }, { status: 500 });
  }
}
