/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/restrict-template-expressions */
/**
 * Calendar & Availability Seed
 *
 * Seeds availability entries and show schedules for talent profiles.
 */

import { db, randomDate, randomPick, randomInt, randomBool } from "./base";
import * as schema from "../schema";

const AVAILABILITY_TITLES = [
  "Vacation",
  "Family Event",
  "Doctor Appointment",
  "Work Commitment",
  "Personal Time",
  "Travel",
  "Wedding",
  "Out of Town",
  "Rehearsal Conflict",
  "Performance",
];

const AVAILABILITY_NOTES = [
  "Will be completely unavailable during this time.",
  "May be reachable by phone for emergencies.",
  "Flexible on exact timing if needed.",
  "Pre-planned commitment, cannot reschedule.",
  "Out of state, limited availability.",
  "",
];

interface CalendarSeedOptions {
  minAvailabilityEntries?: number;
  maxAvailabilityEntries?: number;
  minShowSchedules?: number;
  maxShowSchedules?: number;
}

export async function seedCalendar(
  talentProfiles: { id: string; userId: string }[],
  shows: { id: string; title: string }[],
  options: CalendarSeedOptions = {}
): Promise<{
  availability: { id: string; talentProfileId: string }[];
  showSchedules: { id: string; talentProfileId: string }[];
}> {
  const {
    minAvailabilityEntries = 2,
    maxAvailabilityEntries = 6,
    minShowSchedules = 0,
    maxShowSchedules = 3,
  } = options;

  const availabilityEntries: { id: string; talentProfileId: string }[] = [];
  const showScheduleEntries: { id: string; talentProfileId: string }[] = [];

  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sixMonthsFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

  for (const profile of talentProfiles) {
    // Create availability entries
    const availCount = randomInt(minAvailabilityEntries, maxAvailabilityEntries);
    for (let i = 0; i < availCount; i++) {
      const startDate = randomDate(threeMonthsAgo, sixMonthsFromNow);
      const durationDays = randomInt(1, 14);
      const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const [entry] = await db
        .insert(schema.availability)
        .values({
          talentProfileId: profile.id,
          title: randomBool(0.7) ? randomPick(AVAILABILITY_TITLES) : null,
          startDate,
          endDate,
          status: randomPick(["available", "unavailable", "tentative"] as const),
          isAllDay: randomBool(0.8),
          notes: randomBool(0.5) ? randomPick(AVAILABILITY_NOTES) : null,
          recurrencePattern: randomBool(0.15)
            ? randomPick(["weekly", "biweekly"] as const)
            : "none",
        })
        .returning({ id: schema.availability.id });

      availabilityEntries.push({ id: entry!.id, talentProfileId: profile.id });
    }

    // Create show schedules (past/current/future shows the talent is in)
    if (shows.length > 0) {
      const scheduleCount = randomInt(minShowSchedules, Math.min(maxShowSchedules, shows.length));
      const selectedShows = [...shows].sort(() => 0.5 - Math.random()).slice(0, scheduleCount);

      for (const show of selectedShows) {
        const startDate = randomDate(threeMonthsAgo, sixMonthsFromNow);
        const durationWeeks = randomInt(2, 8);
        const endDate = new Date(startDate.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000);

        const [entry] = await db
          .insert(schema.showSchedules)
          .values({
            talentProfileId: profile.id,
            showName: show.title,
            role: randomPick(["Lead", "Supporting", "Ensemble", "Understudy", "Swing"]),
            venue: randomPick([
              "Main Stage",
              "Studio Theater",
              "Community Center",
              "Black Box",
              "Downtown Playhouse",
            ]),
            startDate,
            endDate,
            status: randomPick(["confirmed", "tentative", "cancelled"] as const),
            isPublic: randomBool(0.6),
            showMetadata: {
              productionCompany: randomPick([
                "City Theater Company",
                "Regional Playhouse",
                "Community Arts",
                "Broadway Dreams",
              ]),
              director: randomPick(["Sarah Mitchell", "David Chen", "Maria Santos", "Robert Kim"]),
            },
          })
          .returning({ id: schema.showSchedules.id });

        showScheduleEntries.push({ id: entry!.id, talentProfileId: profile.id });
      }
    }
  }

  console.log(`Created ${availabilityEntries.length} availability entries`);
  console.log(`Created ${showScheduleEntries.length} show schedule entries`);

  return {
    availability: availabilityEntries,
    showSchedules: showScheduleEntries,
  };
}
