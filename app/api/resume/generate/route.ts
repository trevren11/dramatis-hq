import { type NextRequest, NextResponse } from "next/server";
import { generateResumePdf, createSampleProfile } from "@/lib/resume";
import { generateResumeRequestSchema, talentProfileSchema } from "@/lib/resume/types";

const requestBodySchema = generateResumeRequestSchema.extend({
  profile: talentProfileSchema.optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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
      profile: profileData,
    } = parseResult.data;

    const profile = profileData ?? createSampleProfile();

    const { buffer, filename, contentType } = await generateResumePdf({
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
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Resume generation error:", error);
    return NextResponse.json({ error: "Failed to generate resume" }, { status: 500 });
  }
}
