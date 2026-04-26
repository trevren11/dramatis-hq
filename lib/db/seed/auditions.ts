/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/restrict-template-expressions, max-params, complexity */
/**
 * Seed: Auditions
 * Creates auditions with applications from talent
 */

import {
  auditions,
  auditionRoles,
  auditionApplications,
  auditionForms,
  AUDITION_STATUS_VALUES,
  AUDITION_VISIBILITY_VALUES,
  APPLICATION_STATUS_VALUES,
  type AuditionDate,
  type AuditionRequirements,
  type AuditionMaterials,
  type FormField,
} from "../schema/auditions";
import type { SeededShow, SeededRole } from "./producer";
import type { SeededTalentProfile } from "./talent";
import {
  db,
  generateSlug,
  randomPick,
  randomPickN,
  randomInt,
  randomBool,
  randomDate,
  daysFromNow,
  monthsFromNow,
  CITIES,
} from "./base";

export interface SeededAudition {
  id: string;
  showId: string;
  slug: string;
  title: string;
}

export interface AuditionSeedOptions {
  /** Percentage of shows that should have auditions (0-1) */
  auditionProbability?: number;
  /** Number of applications per audition (min) */
  minApplications?: number;
  /** Number of applications per audition (max) */
  maxApplications?: number;
  /** Include custom forms */
  includeForms?: boolean;
}

const DEFAULT_OPTIONS: AuditionSeedOptions = {
  auditionProbability: 0.7,
  minApplications: 3,
  maxApplications: 15,
  includeForms: true,
};

/**
 * Seed auditions for shows
 */
export async function seedAuditions(
  shows: SeededShow[],
  roles: SeededRole[],
  talentProfiles: SeededTalentProfile[],
  organizationIdMap: Map<string, string>, // showId -> organizationId
  options: AuditionSeedOptions = {}
): Promise<SeededAudition[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const seededAuditions: SeededAudition[] = [];

  console.log(`Creating auditions for shows...`);

  for (const show of shows) {
    // Randomly decide if this show has an audition
    if (!randomBool(opts.auditionProbability)) continue;

    const organizationId = organizationIdMap.get(show.id);
    if (!organizationId) continue;

    const slug = generateSlug(`${show.title}-audition-${randomInt(1000, 9999)}`);
    const status = randomPick(AUDITION_STATUS_VALUES);
    const visibility = status === "draft" ? "private" : randomPick(AUDITION_VISIBILITY_VALUES);

    // Generate audition dates (from 1 month ago to 18 months in the future)
    const auditionDates: AuditionDate[] = [];
    const numDates = randomInt(1, 4);
    for (let i = 0; i < numDates; i++) {
      const date = randomDate(monthsFromNow(-1), monthsFromNow(18));
      auditionDates.push({
        date: date.toISOString().split("T")[0]!,
        startTime: `${randomInt(9, 14)}:00`,
        endTime: `${randomInt(15, 20)}:00`,
        notes: randomBool(0.3) ? "Please arrive 15 minutes early" : undefined,
      });
    }

    // Generate requirements
    const requirements: AuditionRequirements = {
      unionStatus: randomPick(["union", "non_union", "both"]),
      ageRangeMin: randomInt(18, 25),
      ageRangeMax: randomInt(40, 65),
      gender: randomBool(0.5)
        ? randomPickN(["male", "female", "non_binary"], randomInt(1, 3))
        : undefined,
    };

    // Generate materials requirements
    const materials: AuditionMaterials = {
      requireHeadshot: true,
      requireResume: true,
      requireVideo: randomBool(0.4),
      requireAudio: randomBool(0.2),
      videoInstructions: randomBool(0.3)
        ? "Please submit a 60-second monologue of your choice."
        : undefined,
      additionalInstructions: randomBool(0.3)
        ? "Please prepare 16 bars of a song in the style of the show."
        : undefined,
    };

    // Submission deadline (from 1 month ago to 12 months in the future)
    const submissionDeadline = randomBool(0.7)
      ? randomDate(monthsFromNow(-1), monthsFromNow(12))
      : null;

    const result = await db
      .insert(auditions)
      .values({
        showId: show.id,
        organizationId,
        title: `${show.title} - Open Auditions`,
        description: `We are seeking talented performers for our upcoming production of ${show.title}. All roles are available.`,
        slug,
        location: randomBool(0.8) ? randomPick(CITIES) : null,
        isVirtual: randomBool(0.2),
        auditionDates,
        submissionDeadline,
        requirements,
        materials,
        visibility,
        status,
      })
      .returning({ id: auditions.id });

    const audition = result[0];
    if (!audition) continue;

    seededAuditions.push({
      id: audition.id,
      showId: show.id,
      slug,
      title: `${show.title} - Open Auditions`,
    });

    // Link roles to this audition
    const showRoles = roles.filter((r) => r.showId === show.id);
    const rolesForAudition = randomPickN(showRoles, randomInt(1, showRoles.length));

    for (const role of rolesForAudition) {
      await db
        .insert(auditionRoles)
        .values({
          auditionId: audition.id,
          roleId: role.id,
        })
        .onConflictDoNothing();
    }

    // Create custom form if enabled
    if (opts.includeForms && randomBool(0.5)) {
      const formFields: FormField[] = [
        {
          id: crypto.randomUUID(),
          type: "text",
          label: "Stage Name (if different)",
          required: false,
          profileMapping: "stageName",
        },
        {
          id: crypto.randomUUID(),
          type: "select",
          label: "How did you hear about this audition?",
          required: true,
          options: ["Website", "Social Media", "Friend/Colleague", "Agent", "Other"],
        },
        {
          id: crypto.randomUUID(),
          type: "boolean",
          label: "Are you available for all rehearsal dates?",
          required: true,
        },
        {
          id: crypto.randomUUID(),
          type: "textarea",
          label: "Any conflicts or notes?",
          required: false,
          placeholder: "List any scheduling conflicts...",
        },
      ];

      await db.insert(auditionForms).values({
        auditionId: audition.id,
        fields: formFields,
      });
    }

    // Create applications from talent (only for open auditions)
    if (status === "open" && talentProfiles.length > 0) {
      const appCount = randomInt(opts.minApplications!, opts.maxApplications!);
      const applicants = randomPickN(talentProfiles, appCount);

      for (const talent of applicants) {
        const appStatus = randomPick(APPLICATION_STATUS_VALUES);

        // Applications submitted within the last 6 months
        const submittedAt = randomDate(monthsFromNow(-6), daysFromNow(0));
        // If reviewed, it happened after submission
        const reviewedAt =
          appStatus !== "submitted" ? randomDate(submittedAt, daysFromNow(0)) : null;

        await db
          .insert(auditionApplications)
          .values({
            auditionId: audition.id,
            talentProfileId: talent.id,
            status: appStatus,
            materials: {
              headshotId: randomBool(0.9) ? crypto.randomUUID() : undefined,
              resumeId: randomBool(0.9) ? crypto.randomUUID() : undefined,
            },
            notes:
              appStatus !== "submitted"
                ? randomPick([
                    "Strong singer, consider for lead",
                    "Good movement skills",
                    "Callback for ensemble",
                    "Not right for this production",
                    "Schedule conflict",
                    null,
                  ])
                : null,
            submittedAt,
            reviewedAt,
          })
          .onConflictDoNothing();
      }
    }
  }

  console.log(`Created ${seededAuditions.length} auditions with applications`);
  return seededAuditions;
}

/**
 * Seed browsable auditions that will appear on /auditions page
 * Creates auditions with:
 * - status: "open" and visibility: "public"
 * - Some with dates in the next week (upcoming)
 * - Some with dates that have passed (closed submissions)
 */
export async function seedBrowsableAuditions(
  shows: SeededShow[],
  roles: SeededRole[],
  talentProfiles: SeededTalentProfile[],
  organizationIdMap: Map<string, string>
): Promise<SeededAudition[]> {
  const seededAuditions: SeededAudition[] = [];

  if (shows.length === 0) {
    console.log("No shows available for browsable auditions");
    return seededAuditions;
  }

  console.log("Creating browsable auditions for /auditions page...");

  // Audition configurations: mix of upcoming and past
  const auditionConfigs = [
    // Upcoming auditions (next 7 days) - will show on browse page
    { daysUntilDeadline: 2, title: "Spring Musical Auditions", isPast: false },
    { daysUntilDeadline: 4, title: "Summer Stock Open Call", isPast: false },
    { daysUntilDeadline: 6, title: "Community Theater Casting", isPast: false },
    { daysUntilDeadline: 7, title: "New Works Festival Auditions", isPast: false },
    { daysUntilDeadline: 10, title: "Fall Season Auditions", isPast: false },
    { daysUntilDeadline: 14, title: "Holiday Production Casting", isPast: false },
    // Past auditions (deadline passed) - won't show on browse but exist in DB
    { daysUntilDeadline: -3, title: "Winter Showcase (Closed)", isPast: true },
    { daysUntilDeadline: -7, title: "Regional Theater Casting (Closed)", isPast: true },
    { daysUntilDeadline: -14, title: "Student Production (Closed)", isPast: true },
  ];

  for (let i = 0; i < auditionConfigs.length && i < shows.length; i++) {
    const show = shows[i]!;
    const config = auditionConfigs[i]!;
    const organizationId = organizationIdMap.get(show.id);
    if (!organizationId) continue;

    const slug = generateSlug(`${config.title}-${randomInt(1000, 9999)}`);
    const submissionDeadline = daysFromNow(config.daysUntilDeadline);

    // Generate audition dates (1-2 days after submission deadline for upcoming, in the past for closed)
    const auditionDates: AuditionDate[] = [];
    const numDates = randomInt(1, 3);
    for (let j = 0; j < numDates; j++) {
      const dateOffset = config.isPast
        ? config.daysUntilDeadline - 1 - j
        : config.daysUntilDeadline + 2 + j;
      const date = daysFromNow(dateOffset);
      auditionDates.push({
        date: date.toISOString().split("T")[0]!,
        startTime: `${9 + j * 2}:00`,
        endTime: `${13 + j * 2}:00`,
        notes: j === 0 ? "Primary audition date" : undefined,
      });
    }

    const requirements: AuditionRequirements = {
      unionStatus: randomPick(["union", "non_union", "both"]),
      ageRangeMin: randomInt(18, 25),
      ageRangeMax: randomInt(35, 55),
    };

    const materials: AuditionMaterials = {
      requireHeadshot: true,
      requireResume: true,
      requireVideo: randomBool(0.3),
      additionalInstructions: randomBool(0.5)
        ? "Please prepare a contemporary monologue (1-2 minutes) and 16 bars of a song."
        : undefined,
    };

    const result = await db
      .insert(auditions)
      .values({
        showId: show.id,
        organizationId,
        title: config.title,
        description: `Join us for ${config.title}! We are casting for our upcoming production of ${show.title}. All experience levels welcome.`,
        slug,
        location: randomPick(CITIES),
        isVirtual: randomBool(0.2),
        auditionDates,
        submissionDeadline,
        requirements,
        materials,
        visibility: "public",
        status: "open",
      })
      .returning({ id: auditions.id });

    const audition = result[0];
    if (!audition) continue;

    seededAuditions.push({
      id: audition.id,
      showId: show.id,
      slug,
      title: config.title,
    });

    // Link roles to this audition
    const showRoles = roles.filter((r) => r.showId === show.id);
    const rolesForAudition = randomPickN(showRoles, randomInt(1, Math.max(1, showRoles.length)));

    for (const role of rolesForAudition) {
      await db
        .insert(auditionRoles)
        .values({
          auditionId: audition.id,
          roleId: role.id,
        })
        .onConflictDoNothing();
    }

    // Create applications from talent (more for upcoming, fewer for past)
    if (talentProfiles.length > 0) {
      const appCount = config.isPast ? randomInt(5, 15) : randomInt(2, 8);
      const applicants = randomPickN(talentProfiles, Math.min(appCount, talentProfiles.length));

      for (const talent of applicants) {
        // For past auditions, only use non-submitted statuses; for current, use all statuses
        const pastStatuses = APPLICATION_STATUS_VALUES.filter((s) => s !== "submitted");
        const appStatus = config.isPast
          ? randomPick(pastStatuses)
          : randomPick(APPLICATION_STATUS_VALUES);

        const submittedAt = config.isPast
          ? randomDate(
              daysFromNow(config.daysUntilDeadline - 10),
              daysFromNow(config.daysUntilDeadline)
            )
          : randomDate(daysFromNow(-5), daysFromNow(0));

        await db
          .insert(auditionApplications)
          .values({
            auditionId: audition.id,
            talentProfileId: talent.id,
            status: appStatus,
            materials: {
              headshotId: randomBool(0.9) ? crypto.randomUUID() : undefined,
              resumeId: randomBool(0.9) ? crypto.randomUUID() : undefined,
            },
            notes:
              appStatus !== "submitted"
                ? randomPick([
                    "Strong performer, great range",
                    "Good chemistry with leads",
                    "Consider for ensemble",
                    "Callback scheduled",
                    null,
                  ])
                : null,
            submittedAt,
            reviewedAt: appStatus !== "submitted" ? daysFromNow(0) : null,
          })
          .onConflictDoNothing();
      }
    }
  }

  console.log(
    `Created ${seededAuditions.length} browsable auditions (${auditionConfigs.filter((c) => !c.isPast).length} upcoming, ${auditionConfigs.filter((c) => c.isPast).length} past)`
  );
  return seededAuditions;
}
