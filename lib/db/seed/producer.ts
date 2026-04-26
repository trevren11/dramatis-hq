/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-nullish-coalescing, complexity */
/**
 * Seed: Producer Profiles
 * Creates producer profiles with shows and roles
 */

import { producerProfiles, UNION_STATUS_VALUES } from "../schema/producer-profiles";
import { shows, SHOW_TYPE_VALUES, SHOW_STATUS_VALUES } from "../schema/shows";
import { roles, ROLE_TYPE_VALUES } from "../schema/roles";
import type { SeededUser } from "./users";
import {
  db,
  generateSlug,
  randomPick,
  randomInt,
  randomBool,
  randomDate,
  monthsFromNow,
  CITIES,
  THEATER_COMPANIES,
  SHOW_TITLES,
  VENUES,
} from "./base";

export interface SeededProducerProfile {
  id: string;
  userId: string;
  slug: string;
  companyName: string;
}

export interface SeededShow {
  id: string;
  organizationId: string;
  title: string;
}

export interface SeededRole {
  id: string;
  showId: string;
  name: string;
}

export interface ProducerSeedOptions {
  /** Number of shows per producer (min) */
  minShows?: number;
  /** Number of shows per producer (max) */
  maxShows?: number;
  /** Number of roles per show (min) */
  minRoles?: number;
  /** Number of roles per show (max) */
  maxRoles?: number;
}

const DEFAULT_OPTIONS: ProducerSeedOptions = {
  minShows: 1,
  maxShows: 4,
  minRoles: 3,
  maxRoles: 10,
};

// Character/role names for different show types
const ROLE_NAMES = {
  musical: [
    "Elphaba",
    "Glinda",
    "Fiyero",
    "Madame Morrible",
    "The Wizard",
    "Jean Valjean",
    "Javert",
    "Fantine",
    "Cosette",
    "Eponine",
    "Maria",
    "Tony",
    "Anita",
    "Bernardo",
    "Riff",
    "Billy Flynn",
    "Roxie Hart",
    "Velma Kelly",
    "Mama Morton",
    "Amos Hart",
  ],
  play: [
    "Hamlet",
    "Ophelia",
    "Claudius",
    "Gertrude",
    "Polonius",
    "Horatio",
    "Laertes",
    "Stanley Kowalski",
    "Blanche DuBois",
    "Stella",
    "Willy Loman",
    "Linda Loman",
    "Biff",
    "Happy",
    "Tom Wingfield",
    "Amanda Wingfield",
    "Laura Wingfield",
    "Jim O'Connor",
  ],
  opera: [
    "Carmen",
    "Don Jose",
    "Escamillo",
    "Micaela",
    "Tosca",
    "Mario",
    "Scarpia",
    "Mimi",
    "Rodolfo",
    "Musetta",
    "Figaro",
    "Susanna",
    "Count Almaviva",
    "Countess",
    "Violetta",
    "Alfredo",
  ],
  default: [
    "Lead 1",
    "Lead 2",
    "Supporting 1",
    "Supporting 2",
    "Ensemble Member",
    "Narrator",
    "Dancer",
    "Singer",
    "Featured Role",
    "Chorus",
  ],
};

/**
 * Seed producer profiles for given users
 */
export async function seedProducerProfiles(
  producerUsers: SeededUser[],
  options: ProducerSeedOptions = {}
): Promise<{
  producers: SeededProducerProfile[];
  shows: SeededShow[];
  roles: SeededRole[];
}> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const seededProducers: SeededProducerProfile[] = [];
  const seededShows: SeededShow[] = [];
  const seededRoles: SeededRole[] = [];

  console.log(`Creating producer profiles for ${producerUsers.length} users...`);

  for (const user of producerUsers) {
    // Generate company name
    const companyName = randomBool(0.5)
      ? randomPick(THEATER_COMPANIES)
      : `${user.name.split(" ")[1] || "Community"} Theater Company`;

    const slug = generateSlug(`${companyName}-${randomInt(100, 999)}`);

    // Create producer profile
    const profileResult = await db
      .insert(producerProfiles)
      .values({
        userId: user.id,
        companyName,
        slug,
        logoUrl: `https://picsum.photos/200?random=${user.id}`,
        description: `${companyName} is a dedicated theater company bringing quality productions to audiences. We are committed to artistic excellence and community engagement.`,
        location: randomPick(CITIES),
        website: `https://${slug}.example.com`,
        unionStatus: randomPick(UNION_STATUS_VALUES),
        isPublic: true,
        socialLinks: {
          instagram: `https://instagram.com/${slug}`,
          facebook: `https://facebook.com/${slug}`,
        },
      })
      .returning({ id: producerProfiles.id });

    const profile = profileResult[0];
    if (!profile) continue;

    seededProducers.push({
      id: profile.id,
      userId: user.id,
      slug,
      companyName,
    });

    // Create shows for this producer
    const showCount = randomInt(opts.minShows!, opts.maxShows!);
    for (let i = 0; i < showCount; i++) {
      const showType = randomPick(SHOW_TYPE_VALUES);
      const title = randomPick(SHOW_TITLES);
      const status = randomPick(SHOW_STATUS_VALUES);

      // Rehearsals from 12 months ago to 18 months in the future
      const rehearsalStart = randomDate(monthsFromNow(-12), monthsFromNow(18));
      const performanceStart = new Date(rehearsalStart);
      performanceStart.setMonth(performanceStart.getMonth() + 1);
      const performanceEnd = new Date(performanceStart);
      performanceEnd.setMonth(performanceEnd.getMonth() + randomInt(1, 3));

      const showResult = await db
        .insert(shows)
        .values({
          organizationId: profile.id,
          title,
          type: showType,
          description: `A stunning production of ${title} featuring a talented cast and creative team.`,
          venue: randomPick(VENUES),
          rehearsalStart,
          performanceStart,
          performanceEnd,
          unionStatus: randomPick(UNION_STATUS_VALUES),
          status,
          isPublic: status !== "planning",
        })
        .returning({ id: shows.id });

      const show = showResult[0];
      if (!show) continue;

      seededShows.push({ id: show.id, organizationId: profile.id, title });

      // Create roles for this show
      const roleCount = randomInt(opts.minRoles!, opts.maxRoles!);
      const roleNames = ROLE_NAMES[showType as keyof typeof ROLE_NAMES] || ROLE_NAMES.default;
      const usedNames = new Set<string>();

      for (let j = 0; j < roleCount; j++) {
        let roleName: string;
        if (j < roleNames.length && !usedNames.has(roleNames[j]!)) {
          roleName = roleNames[j]!;
        } else {
          roleName = `Ensemble ${j + 1}`;
        }
        usedNames.add(roleName);

        const roleType = j === 0 ? "lead" : j < 3 ? "supporting" : randomPick(ROLE_TYPE_VALUES);

        const roleResult = await db
          .insert(roles)
          .values({
            showId: show.id,
            name: roleName,
            description: `The character of ${roleName} in ${title}`,
            type: roleType,
            ageRangeMin: randomInt(18, 30),
            ageRangeMax: randomInt(35, 60),
            vocalRange:
              showType === "musical" || showType === "opera"
                ? randomPick(["Soprano", "Alto", "Tenor", "Baritone", "Bass"])
                : null,
            positionCount: roleType === "ensemble" ? randomInt(2, 8) : 1,
            sortOrder: j,
          })
          .returning({ id: roles.id });

        const role = roleResult[0];
        if (!role) continue;

        seededRoles.push({ id: role.id, showId: show.id, name: roleName });
      }
    }
  }

  console.log(
    `Created ${seededProducers.length} producers, ${seededShows.length} shows, ${seededRoles.length} roles`
  );

  return { producers: seededProducers, shows: seededShows, roles: seededRoles };
}
