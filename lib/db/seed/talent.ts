/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/restrict-template-expressions, @typescript-eslint/prefer-nullish-coalescing */
/**
 * Seed: Talent Profiles
 * Creates detailed talent profiles with work history, skills, headshots
 */

import {
  talentProfiles,
  HAIR_COLORS,
  EYE_COLORS,
  ETHNICITIES,
  VOCAL_RANGES,
  GENDERS,
} from "../schema/talent-profiles";
import { workHistory, WORK_CATEGORIES } from "../schema/work-history";
import { skills, talentSkills, COMMON_SKILLS } from "../schema/skills";
import { headshots } from "../schema/headshots";
import { education } from "../schema/education";
import type { SeededUser } from "./users";
import {
  db,
  generateSlug,
  randomPick,
  randomPickN,
  randomInt,
  randomBool,
  placeholderImage,
  randomDate,
  CITIES,
  THEATER_COMPANIES,
  SHOW_TITLES,
  DIRECTOR_NAMES,
  BIOS,
} from "./base";

export interface SeededTalentProfile {
  id: string;
  userId: string;
  slug: string;
}

export interface TalentSeedOptions {
  /** Number of work history entries per talent (min) */
  minWorkHistory?: number;
  /** Number of work history entries per talent (max) */
  maxWorkHistory?: number;
  /** Number of skills per talent (min) */
  minSkills?: number;
  /** Number of skills per talent (max) */
  maxSkills?: number;
  /** Number of headshots per talent (min) */
  minHeadshots?: number;
  /** Number of headshots per talent (max) */
  maxHeadshots?: number;
  /** Include education records */
  includeEducation?: boolean;
}

const DEFAULT_OPTIONS: TalentSeedOptions = {
  minWorkHistory: 2,
  maxWorkHistory: 8,
  minSkills: 3,
  maxSkills: 10,
  minHeadshots: 1,
  maxHeadshots: 4,
  includeEducation: true,
};

/**
 * Ensure skills exist in the database
 */
async function ensureSkills(): Promise<Map<string, string>> {
  const skillMap = new Map<string, string>();

  for (const skill of COMMON_SKILLS) {
    const [existing] = await db
      .insert(skills)
      .values({ name: skill.name, category: skill.category })
      .onConflictDoNothing()
      .returning({ id: skills.id });

    if (existing) {
      skillMap.set(skill.name, existing.id);
    }
  }

  // Fetch all skills to populate the map
  const allSkills = await db.select().from(skills);
  for (const skill of allSkills) {
    skillMap.set(skill.name, skill.id);
  }

  return skillMap;
}

/**
 * Seed talent profiles for given users
 */
export async function seedTalentProfiles(
  talentUsers: SeededUser[],
  options: TalentSeedOptions = {}
): Promise<SeededTalentProfile[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const seededProfiles: SeededTalentProfile[] = [];
  const skillMap = await ensureSkills();

  console.log(`Creating talent profiles for ${talentUsers.length} users...`);

  for (const user of talentUsers) {
    const nameParts = user.name.split(" ");
    const firstName = nameParts[0] || "Unknown";
    const lastName = nameParts.slice(1).join(" ") || "Unknown";
    const slug = generateSlug(`${firstName}-${lastName}-${randomInt(1000, 9999)}`);

    // Create talent profile
    const profileResult = await db
      .insert(talentProfiles)
      .values({
        userId: user.id,
        firstName,
        lastName,
        stageName: randomBool(0.2)
          ? `${firstName} ${randomPick(["Star", "Phoenix", "Storm", "Rose"])}`
          : null,
        pronouns: randomPick(["he/him", "she/her", "they/them", null]),
        bio: randomPick(BIOS),
        phone: `555-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
        website: randomBool(0.3)
          ? `https://${firstName.toLowerCase()}${lastName.toLowerCase()}.com`
          : null,
        location: randomPick(CITIES),
        heightInches: randomInt(60, 78),
        hairColor: randomPick(HAIR_COLORS),
        naturalHairColor: randomPick(HAIR_COLORS),
        eyeColor: randomPick(EYE_COLORS),
        gender: randomPick(GENDERS),
        ethnicity: randomPick(ETHNICITIES),
        ageRangeLow: randomInt(18, 35),
        ageRangeHigh: randomInt(35, 65),
        vocalRange: randomPick(VOCAL_RANGES),
        isOver18: true,
        unionMemberships: randomBool(0.4)
          ? randomPickN(["AEA", "SAG-AFTRA", "AGMA"], randomInt(1, 2))
          : [],
        isPublic: true,
        hideFromSearch: false,
        publicProfileSlug: slug,
      })
      .returning({ id: talentProfiles.id });

    const profile = profileResult[0];
    if (!profile) continue;

    seededProfiles.push({ id: profile.id, userId: user.id, slug });

    // Add work history
    const workCount = randomInt(opts.minWorkHistory!, opts.maxWorkHistory!);
    for (let i = 0; i < workCount; i++) {
      const startDate = randomDate(new Date("2015-01-01"), new Date("2024-06-01"));
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + randomInt(1, 6));

      await db.insert(workHistory).values({
        talentProfileId: profile.id,
        showName: randomPick(SHOW_TITLES),
        role: randomPick(["Lead", "Supporting", "Ensemble", "Understudy"]),
        category: randomPick(WORK_CATEGORIES),
        location: randomPick(CITIES),
        director: randomPick(DIRECTOR_NAMES),
        productionCompany: randomPick(THEATER_COMPANIES),
        startDate,
        endDate,
        isUnion: randomBool(0.3),
        sortOrder: i,
      });
    }

    // Add skills
    const skillCount = randomInt(opts.minSkills!, opts.maxSkills!);
    const selectedSkills = randomPickN(COMMON_SKILLS, skillCount);
    for (const skill of selectedSkills) {
      const skillId = skillMap.get(skill.name);
      if (skillId) {
        await db
          .insert(talentSkills)
          .values({
            talentProfileId: profile.id,
            skillId,
            proficiencyLevel: randomPick(["Beginner", "Intermediate", "Advanced", "Expert"]),
          })
          .onConflictDoNothing();
      }
    }

    // Add headshots
    const headshotCount = randomInt(opts.minHeadshots!, opts.maxHeadshots!);
    for (let i = 0; i < headshotCount; i++) {
      await db.insert(headshots).values({
        talentProfileId: profile.id,
        url: placeholderImage(800, 1000, `${profile.id}-${i}`),
        thumbnailUrl: placeholderImage(200, 250, `${profile.id}-${i}-thumb`),
        originalFilename: `headshot_${i + 1}.jpg`,
        mimeType: "image/jpeg",
        fileSize: randomInt(100000, 500000),
        width: 800,
        height: 1000,
        isPrimary: i === 0,
        sortOrder: i,
      });
    }

    // Add education
    if (opts.includeEducation && randomBool(0.7)) {
      const schools = [
        "Juilliard School",
        "Yale School of Drama",
        "NYU Tisch",
        "Carnegie Mellon",
        "AMDA",
        "Boston Conservatory",
        "CalArts",
        "University of Michigan",
        "DePaul University",
        "Emerson College",
      ];

      const degrees = ["BFA", "MFA", "BA", "Certificate"];
      const majors = ["Acting", "Musical Theatre", "Drama", "Theatre Arts", "Performance"];

      const gradYear = randomInt(2010, 2024);

      const startYear = gradYear - randomInt(2, 4);
      await db.insert(education).values({
        talentProfileId: profile.id,
        institution: randomPick(schools),
        program: randomPick(majors),
        degree: randomPick(degrees),
        startYear,
        endYear: gradYear,
        sortOrder: 0,
      });
    }
  }

  console.log(`Created ${seededProfiles.length} talent profiles with details`);
  return seededProfiles;
}

/**
 * Create talent profiles with specific characteristics (for testing searches)
 */
export async function seedDiverseTalent(talentUsers: SeededUser[]): Promise<SeededTalentProfile[]> {
  // This creates a more controlled set of talent for testing search/filter functionality
  console.log("Creating diverse talent profiles for search testing...");

  // Use the regular seed but ensure we have variety
  return seedTalentProfiles(talentUsers, {
    minWorkHistory: 3,
    maxWorkHistory: 10,
    minSkills: 5,
    maxSkills: 15,
    includeEducation: true,
  });
}
