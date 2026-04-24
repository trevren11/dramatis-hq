import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, skills, talentSkills } from "@/lib/db/schema";
import { skillSchema, addSkillByIdSchema } from "@/lib/validations/profile";
import { eq, ilike } from "drizzle-orm";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (search) {
      const matchingSkills = await db.query.skills.findMany({
        where: ilike(skills.name, `%${search}%`),
        limit: 20,
      });
      return NextResponse.json({ skills: matchingSkills });
    }

    if (!profile) {
      return NextResponse.json({ talentSkills: [], skills: [] });
    }

    const userSkills = await db.query.talentSkills.findMany({
      where: eq(talentSkills.talentProfileId, profile.id),
    });

    const skillIds = userSkills.map((ts) => ts.skillId);
    const userSkillDetails =
      skillIds.length > 0
        ? await db.query.skills.findMany({
            where: (s, { inArray }) => inArray(s.id, skillIds),
          })
        : [];

    return NextResponse.json({
      talentSkills: userSkills,
      skills: userSkillDetails,
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body: unknown = await request.json();

    const addByIdParsed = addSkillByIdSchema.safeParse(body);
    if (addByIdParsed.success) {
      const { skillId, proficiencyLevel } = addByIdParsed.data;

      const existingSkill = await db.query.skills.findFirst({
        where: eq(skills.id, skillId),
      });

      if (!existingSkill) {
        return NextResponse.json({ error: "Skill not found" }, { status: 404 });
      }

      const existingTalentSkill = await db.query.talentSkills.findFirst({
        where: (ts, { and, eq: eqFn }) =>
          and(eqFn(ts.talentProfileId, profile.id), eqFn(ts.skillId, skillId)),
      });

      if (existingTalentSkill) {
        return NextResponse.json({ error: "Skill already added" }, { status: 409 });
      }

      await db.insert(talentSkills).values({
        talentProfileId: profile.id,
        skillId,
        proficiencyLevel,
      });

      return NextResponse.json({ skill: existingSkill }, { status: 201 });
    }

    const parsed = skillSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    let skill = await db.query.skills.findFirst({
      where: ilike(skills.name, parsed.data.name),
    });

    if (!skill) {
      const [created] = await db.insert(skills).values(parsed.data).returning();
      if (!created) {
        return NextResponse.json({ error: "Failed to create skill" }, { status: 500 });
      }
      skill = created;
    }

    const existingTalentSkill = await db.query.talentSkills.findFirst({
      where: (ts, { and, eq: eqFn }) =>
        and(eqFn(ts.talentProfileId, profile.id), eqFn(ts.skillId, skill.id)),
    });

    if (existingTalentSkill) {
      return NextResponse.json({ error: "Skill already added" }, { status: 409 });
    }

    await db.insert(talentSkills).values({
      talentProfileId: profile.id,
      skillId: skill.id,
    });

    return NextResponse.json({ skill }, { status: 201 });
  } catch (error) {
    console.error("Error adding skill:", error);
    return NextResponse.json({ error: "Failed to add skill" }, { status: 500 });
  }
}
