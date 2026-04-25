import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, producerProfiles, headshots, talentSkills, skills } from "@/lib/db/schema";
import { talentSearchSchema } from "@/lib/validations/physical-attributes";
import {
  calculateMatchPercentage,
  filterBySearchCriteria,
  sortByMatchPercentage,
} from "@/lib/validations/talent-search";
import { eq, and, ilike, gte, lte, or, sql, inArray } from "drizzle-orm";

interface TalentSearchResult {
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    stageName: string | null;
    location: string | null;
    bio: string | null;
    heightInches: number | null;
    ageRangeLow: number | null;
    ageRangeHigh: number | null;
    hairColor: string | null;
    eyeColor: string | null;
    vocalRange: string | null;
    unionMemberships: string[];
  };
  primaryHeadshot: string | null;
  skills: { name: string; category: string }[];
  matchPercentage: number;
}

// eslint-disable-next-line complexity
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a producer
    if (session.user.role !== "producer") {
      return NextResponse.json(
        { error: "Access denied. Producer account required." },
        { status: 403 }
      );
    }

    // Get producer profile for organization context
    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!producerProfile) {
      return NextResponse.json(
        { error: "Producer profile not found. Please complete setup." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const parsed = talentSearchSchema.safeParse({
      heightMin: searchParams.get("heightMin") ? Number(searchParams.get("heightMin")) : undefined,
      heightMax: searchParams.get("heightMax") ? Number(searchParams.get("heightMax")) : undefined,
      ageMin: searchParams.get("ageMin") ? Number(searchParams.get("ageMin")) : undefined,
      ageMax: searchParams.get("ageMax") ? Number(searchParams.get("ageMax")) : undefined,
      hairColors: searchParams.get("hairColors")?.split(",").filter(Boolean),
      eyeColors: searchParams.get("eyeColors")?.split(",").filter(Boolean),
      ethnicities: searchParams.get("ethnicities")?.split(",").filter(Boolean),
      vocalRanges: searchParams.get("vocalRanges")?.split(",").filter(Boolean),
      genders: searchParams.get("genders")?.split(",").filter(Boolean),
      skills: searchParams.get("skills")?.split(",").filter(Boolean),
      location: searchParams.get("location") ?? undefined,
      willingToCutHair: searchParams.get("willingToCutHair") === "true",
      mustBe18Plus: searchParams.get("mustBe18Plus") === "true",
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 20,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { location, skills: skillFilters, page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    // Build where conditions - only show searchable talent
    const conditions = [
      eq(talentProfiles.hideFromSearch, false),
      eq(talentProfiles.isPublic, true),
    ];

    // Location filter
    if (location) {
      conditions.push(ilike(talentProfiles.location, `%${location}%`));
    }

    // Height range filter
    if (parsed.data.heightMin != null) {
      conditions.push(gte(talentProfiles.heightInches, parsed.data.heightMin));
    }
    if (parsed.data.heightMax != null) {
      conditions.push(lte(talentProfiles.heightInches, parsed.data.heightMax));
    }

    // Age range overlap filter
    if (parsed.data.ageMin != null || parsed.data.ageMax != null) {
      const ageMin = parsed.data.ageMin ?? 0;
      const ageMax = parsed.data.ageMax ?? 100;
      const ageCondition = and(
        lte(talentProfiles.ageRangeLow, ageMax),
        gte(talentProfiles.ageRangeHigh, ageMin)
      );
      if (ageCondition) conditions.push(ageCondition);
    }

    // Hair color filter
    if (parsed.data.hairColors && parsed.data.hairColors.length > 0) {
      conditions.push(inArray(talentProfiles.hairColor, parsed.data.hairColors));
    }

    // Eye color filter
    if (parsed.data.eyeColors && parsed.data.eyeColors.length > 0) {
      conditions.push(inArray(talentProfiles.eyeColor, parsed.data.eyeColors));
    }

    // Ethnicity filter
    if (parsed.data.ethnicities && parsed.data.ethnicities.length > 0) {
      conditions.push(inArray(talentProfiles.ethnicity, parsed.data.ethnicities));
    }

    // Vocal range filter
    if (parsed.data.vocalRanges && parsed.data.vocalRanges.length > 0) {
      conditions.push(inArray(talentProfiles.vocalRange, parsed.data.vocalRanges));
    }

    // Gender filter
    if (parsed.data.genders && parsed.data.genders.length > 0) {
      conditions.push(inArray(talentProfiles.gender, parsed.data.genders));
    }

    // 18+ filter
    if (parsed.data.mustBe18Plus) {
      conditions.push(eq(talentProfiles.isOver18, true));
    }

    // Willing to cut hair filter
    if (parsed.data.willingToCutHair) {
      const hairCondition = or(
        eq(talentProfiles.willingnessToRemoveHair, "yes"),
        eq(talentProfiles.willingnessToRemoveHair, "negotiable")
      );
      if (hairCondition) conditions.push(hairCondition);
    }

    const whereConditions = and(...conditions);

    // Get talent profile IDs that have the required skills
    let talentIdsWithSkills: string[] | null = null;
    if (skillFilters && skillFilters.length > 0) {
      const skillResults = await db
        .select({ talentProfileId: talentSkills.talentProfileId })
        .from(talentSkills)
        .innerJoin(skills, eq(talentSkills.skillId, skills.id))
        .where(inArray(skills.name, skillFilters))
        .groupBy(talentSkills.talentProfileId);

      talentIdsWithSkills = skillResults.map((r) => r.talentProfileId);

      if (talentIdsWithSkills.length === 0) {
        return NextResponse.json({
          results: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
    }

    // Build final where clause with skill filter
    const finalConditions =
      talentIdsWithSkills != null
        ? and(whereConditions, inArray(talentProfiles.id, talentIdsWithSkills))
        : whereConditions;

    // Query talent profiles
    const profiles = await db
      .select()
      .from(talentProfiles)
      .where(finalConditions)
      .limit(limit * 2) // Get extra for scoring filter
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(talentProfiles)
      .where(finalConditions);

    const total = countResult[0]?.count ?? 0;

    // Filter by strict criteria and calculate match percentages
    const filteredProfiles = profiles.filter((profile) =>
      filterBySearchCriteria(profile, parsed.data)
    );

    // Get headshots for all profiles
    const profileIds = filteredProfiles.map((p) => p.id);
    const primaryHeadshots =
      profileIds.length > 0
        ? await db
            .select({
              talentProfileId: headshots.talentProfileId,
              thumbnailUrl: headshots.thumbnailUrl,
              url: headshots.url,
            })
            .from(headshots)
            .where(
              and(inArray(headshots.talentProfileId, profileIds), eq(headshots.isPrimary, true))
            )
        : [];

    const headshotMap = new Map(
      primaryHeadshots.map((h) => [h.talentProfileId, h.thumbnailUrl ?? h.url])
    );

    // Get skills for all profiles
    const profileSkills =
      profileIds.length > 0
        ? await db
            .select({
              talentProfileId: talentSkills.talentProfileId,
              skillName: skills.name,
              skillCategory: skills.category,
            })
            .from(talentSkills)
            .innerJoin(skills, eq(talentSkills.skillId, skills.id))
            .where(inArray(talentSkills.talentProfileId, profileIds))
        : [];

    const skillsMap = new Map<string, { name: string; category: string }[]>();
    profileSkills.forEach((s) => {
      const existing = skillsMap.get(s.talentProfileId) ?? [];
      existing.push({ name: s.skillName, category: s.skillCategory });
      skillsMap.set(s.talentProfileId, existing);
    });

    // Build results with match percentages
    const resultsWithScores = filteredProfiles.map((profile) => ({
      profile,
      matchPercentage: calculateMatchPercentage(profile, parsed.data),
    }));

    // Sort by match percentage
    const sortedResults = sortByMatchPercentage(resultsWithScores);

    // Build final response
    const results: TalentSearchResult[] = sortedResults.slice(0, limit).map((r) => ({
      profile: {
        id: r.profile.id,
        firstName: r.profile.firstName,
        lastName: r.profile.lastName,
        stageName: r.profile.stageName,
        location: r.profile.location,
        bio: r.profile.bio,
        heightInches: r.profile.heightInches,
        ageRangeLow: r.profile.ageRangeLow,
        ageRangeHigh: r.profile.ageRangeHigh,
        hairColor: r.profile.hairColor,
        eyeColor: r.profile.eyeColor,
        vocalRange: r.profile.vocalRange,
        unionMemberships: r.profile.unionMemberships ?? [],
      },
      primaryHeadshot: headshotMap.get(r.profile.id) ?? null,
      skills: (skillsMap.get(r.profile.id) ?? []).slice(0, 5),
      matchPercentage: r.matchPercentage,
    }));

    return NextResponse.json({
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error searching talent:", error);
    return NextResponse.json({ error: "Failed to search talent" }, { status: 500 });
  }
}
