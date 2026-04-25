/* eslint-disable @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-floating-promises */
/**
 * Database Seed Runner
 *
 * Composable seed system - run individual seeds or combine them:
 *
 * BASIC USAGE:
 *   pnpm db:seed                    - Run full seed (clear + all data)
 *   pnpm db:seed:clear              - Clear all seeded data
 *
 * INDIVIDUAL SEEDS (additive - doesn't clear first):
 *   pnpm db:seed:users              - Add random users
 *   pnpm db:seed:talent             - Add talent profiles (needs users)
 *   pnpm db:seed:producer           - Add producer profiles + shows (needs users)
 *   pnpm db:seed:auditions          - Add auditions (needs producers)
 *
 * SCENARIO SEEDS (for specific testing scenarios):
 *   pnpm db:seed:test               - Minimal test data with known credentials
 *   pnpm db:seed:minimal            - Quick dev setup with test users
 *   pnpm db:seed:diverse-talent     - Many diverse talent profiles for search testing
 *   pnpm db:seed:active-auditions   - Many open auditions for audition testing
 *   pnpm db:seed:large-scale        - Stress test data (100s of records)
 *
 * COMBINING SEEDS:
 *   tsx lib/db/seed/index.ts clear users talent
 *   tsx lib/db/seed/index.ts test active-auditions
 */

import { sql } from "drizzle-orm";
import { db, runSeed, closeConnection } from "./base";
import { seedUsers, seedTestUsers } from "./users";
import { seedTalentProfiles, seedDiverseTalent } from "./talent";
import { seedProducerProfiles } from "./producer";
import { seedAuditions } from "./auditions";
import { seedCalendar } from "./calendar";
import { seedMessages } from "./messages";
import { seedNotifications } from "./notifications";
import { seedMaterials } from "./materials";

// All available seed types
type SeedType =
  | "full"
  | "clear"
  | "users"
  | "talent"
  | "producer"
  | "auditions"
  | "calendar"
  | "messages"
  | "notifications"
  | "materials"
  | "test"
  | "minimal"
  | "diverse-talent"
  | "active-auditions"
  | "large-scale"
  | "new-talent"
  | "new-producer"
  | "review-queue";

// Shared state for composable seeding within a single run
interface SeedState {
  users: { id: string; email: string; name: string; userType: "talent" | "producer" | "admin" }[];
  talentProfiles: { id: string; userId: string; slug: string }[];
  producers: { id: string; userId: string; slug: string; companyName: string }[];
  shows: { id: string; organizationId: string; title: string }[];
  roles: { id: string; showId: string; name: string }[];
}

const state: SeedState = {
  users: [],
  talentProfiles: [],
  producers: [],
  shows: [],
  roles: [],
};

async function clearDatabase(): Promise<void> {
  console.log("Clearing database...");

  const tablesToClear = [
    // Notifications
    "in_app_notifications",
    "notification_preferences",
    "push_subscriptions",
    // Messages
    "messages",
    "message_templates",
    "conversation_participants",
    "conversations",
    // Materials
    "material_access_logs",
    "material_permissions",
    "minus_tracks",
    "scripts",
    // Calendar
    "show_schedules",
    "availability",
    // Auditions
    "audition_notes",
    "audition_form_responses",
    "audition_forms",
    "audition_applications",
    "audition_roles",
    "auditions",
    // Shows & Roles
    "roles",
    "shows",
    // Talent
    "talent_skills",
    "skills",
    "headshots",
    "video_samples",
    "work_history",
    "education",
    "talent_profiles",
    // Producers
    "producer_profiles",
    // Auth
    "password_reset_tokens",
    "verification_tokens",
    "sessions",
    "accounts",
    "users",
  ];

  for (const table of tablesToClear) {
    try {
      await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
    } catch {
      // Table might not exist, that's ok
    }
  }

  // Reset state
  state.users = [];
  state.talentProfiles = [];
  state.producers = [];
  state.shows = [];
  state.roles = [];

  console.log("Database cleared");
}

// =============================================================================
// INDIVIDUAL SEEDS (additive)
// =============================================================================

async function seedUsersOnly(): Promise<void> {
  const users = await seedUsers({ talentCount: 15, producerCount: 5, adminCount: 1 });
  state.users.push(...users);
}

async function seedTalentOnly(): Promise<void> {
  const talentUsers = state.users.filter((u) => u.userType === "talent");
  if (talentUsers.length === 0) {
    console.log("No talent users found. Run 'users' or 'test' seed first.");
    return;
  }
  const profiles = await seedTalentProfiles(talentUsers);
  state.talentProfiles.push(...profiles);
}

async function seedProducerOnly(): Promise<void> {
  const producerUsers = state.users.filter((u) => u.userType === "producer");
  if (producerUsers.length === 0) {
    console.log("No producer users found. Run 'users' or 'test' seed first.");
    return;
  }
  const { producers, shows, roles } = await seedProducerProfiles(producerUsers, {
    minShows: 2,
    maxShows: 5,
  });
  state.producers.push(...producers);
  state.shows.push(...shows);
  state.roles.push(...roles);
}

async function seedAuditionsOnly(): Promise<void> {
  if (state.shows.length === 0) {
    console.log("No shows found. Run 'producer' seed first.");
    return;
  }
  const organizationIdMap = new Map<string, string>();
  for (const show of state.shows) {
    organizationIdMap.set(show.id, show.organizationId);
  }
  await seedAuditions(state.shows, state.roles, state.talentProfiles, organizationIdMap, {
    auditionProbability: 0.8,
    minApplications: 5,
    maxApplications: 20,
  });
}

async function seedCalendarOnly(): Promise<void> {
  if (state.talentProfiles.length === 0) {
    console.log("No talent profiles found. Run 'talent' seed first.");
    return;
  }
  await seedCalendar(state.talentProfiles, state.shows);
}

async function seedMessagesOnly(): Promise<void> {
  if (state.users.length === 0) {
    console.log("No users found. Run 'users' or 'test' seed first.");
    return;
  }
  await seedMessages(state.users);
}

async function seedNotificationsOnly(): Promise<void> {
  if (state.users.length === 0) {
    console.log("No users found. Run 'users' or 'test' seed first.");
    return;
  }
  await seedNotifications(state.users);
}

async function seedMaterialsOnly(): Promise<void> {
  if (state.shows.length === 0) {
    console.log("No shows found. Run 'producer' seed first.");
    return;
  }
  await seedMaterials(state.shows, state.users);
}

// =============================================================================
// SCENARIO SEEDS (complete setups for specific purposes)
// =============================================================================

async function seedTest(): Promise<void> {
  console.log("\n=== Creating Test Seed ===");
  console.log("Test credentials:");
  console.log("  - talent@test.com / test123");
  console.log("  - producer@test.com / test123");
  console.log("  - admin@test.com / test123");

  const testUsers = await seedTestUsers();
  state.users.push(...testUsers);

  const talentUser = testUsers.find((u) => u.userType === "talent");
  const producerUser = testUsers.find((u) => u.userType === "producer");

  if (talentUser) {
    const profiles = await seedTalentProfiles([talentUser], {
      minWorkHistory: 2,
      maxWorkHistory: 4,
      minSkills: 3,
      maxSkills: 6,
      minHeadshots: 2,
      maxHeadshots: 3,
    });
    state.talentProfiles.push(...profiles);
  }

  if (producerUser) {
    const { producers, shows, roles } = await seedProducerProfiles([producerUser], {
      minShows: 2,
      maxShows: 3,
      minRoles: 4,
      maxRoles: 8,
    });
    state.producers.push(...producers);
    state.shows.push(...shows);
    state.roles.push(...roles);
  }
}

async function seedMinimal(): Promise<void> {
  // Quick dev setup with test users only
  const testUsers = await seedTestUsers();
  state.users.push(...testUsers);

  const talentUsers = testUsers.filter((u) => u.userType === "talent");
  const producerUsers = testUsers.filter((u) => u.userType === "producer");

  const profiles = await seedTalentProfiles(talentUsers, {
    minWorkHistory: 1,
    maxWorkHistory: 3,
    minSkills: 2,
    maxSkills: 5,
    minHeadshots: 1,
    maxHeadshots: 2,
  });
  state.talentProfiles.push(...profiles);

  const { producers, shows, roles } = await seedProducerProfiles(producerUsers, {
    minShows: 1,
    maxShows: 2,
    minRoles: 3,
    maxRoles: 5,
  });
  state.producers.push(...producers);
  state.shows.push(...shows);
  state.roles.push(...roles);
}

async function seedDiverseTalentScenario(): Promise<void> {
  // Create many diverse talent profiles for testing search/filter
  console.log("Creating diverse talent scenario for search testing...");

  // First ensure we have users
  if (state.users.filter((u) => u.userType === "talent").length < 30) {
    const users = await seedUsers({ talentCount: 50, producerCount: 0, adminCount: 0 });
    state.users.push(...users);
  }

  const talentUsers = state.users.filter((u) => u.userType === "talent");
  const profiles = await seedDiverseTalent(talentUsers);
  state.talentProfiles.push(...profiles);
}

async function seedActiveAuditionsScenario(): Promise<void> {
  // Many open auditions with varied states for audition testing
  console.log("Creating active auditions scenario...");

  // Ensure we have producers and talent
  if (state.users.filter((u) => u.userType === "producer").length < 5) {
    const users = await seedUsers({ talentCount: 20, producerCount: 8, adminCount: 0 });
    state.users.push(...users);
  }

  const talentUsers = state.users.filter((u) => u.userType === "talent");
  const producerUsers = state.users.filter((u) => u.userType === "producer");

  // Create talent profiles if needed
  if (state.talentProfiles.length < 10) {
    const profiles = await seedTalentProfiles(talentUsers);
    state.talentProfiles.push(...profiles);
  }

  // Create many shows
  const { producers, shows, roles } = await seedProducerProfiles(producerUsers, {
    minShows: 3,
    maxShows: 6,
    minRoles: 5,
    maxRoles: 12,
  });
  state.producers.push(...producers);
  state.shows.push(...shows);
  state.roles.push(...roles);

  // Create auditions for most shows
  const organizationIdMap = new Map<string, string>();
  for (const show of state.shows) {
    organizationIdMap.set(show.id, show.organizationId);
  }

  await seedAuditions(state.shows, state.roles, state.talentProfiles, organizationIdMap, {
    auditionProbability: 0.95,
    minApplications: 10,
    maxApplications: 30,
    includeForms: true,
  });
}

async function seedLargeScale(): Promise<void> {
  // Stress test data with many records
  console.log("Creating large-scale dataset...");

  const users = await seedUsers({
    talentCount: 100,
    producerCount: 15,
    adminCount: 3,
  });
  state.users.push(...users);

  const testUsers = await seedTestUsers();
  state.users.push(...testUsers);

  const talentUsers = state.users.filter((u) => u.userType === "talent");
  const producerUsers = state.users.filter((u) => u.userType === "producer");

  const profiles = await seedTalentProfiles(talentUsers, {
    minWorkHistory: 3,
    maxWorkHistory: 12,
    minSkills: 5,
    maxSkills: 15,
    minHeadshots: 2,
    maxHeadshots: 5,
    includeEducation: true,
  });
  state.talentProfiles.push(...profiles);

  const { producers, shows, roles } = await seedProducerProfiles(producerUsers, {
    minShows: 4,
    maxShows: 8,
    minRoles: 8,
    maxRoles: 15,
  });
  state.producers.push(...producers);
  state.shows.push(...shows);
  state.roles.push(...roles);

  const organizationIdMap = new Map<string, string>();
  for (const show of state.shows) {
    organizationIdMap.set(show.id, show.organizationId);
  }

  await seedAuditions(state.shows, state.roles, state.talentProfiles, organizationIdMap, {
    auditionProbability: 0.9,
    minApplications: 15,
    maxApplications: 50,
    includeForms: true,
  });
}

async function seedNewTalentScenario(): Promise<void> {
  // Simulates a new talent user going through onboarding
  console.log("Creating new talent onboarding scenario...");

  const testUsers = await seedTestUsers();
  state.users.push(...testUsers);

  // Only create a minimal profile for the test talent - simulating incomplete onboarding
  const talentUser = testUsers.find((u) => u.userType === "talent");
  if (talentUser) {
    const profiles = await seedTalentProfiles([talentUser], {
      minWorkHistory: 0,
      maxWorkHistory: 1,
      minSkills: 0,
      maxSkills: 2,
      minHeadshots: 0,
      maxHeadshots: 1,
      includeEducation: false,
    });
    state.talentProfiles.push(...profiles);
  }

  // Add some producers with open auditions for the talent to apply to
  const users = await seedUsers({ talentCount: 0, producerCount: 3, adminCount: 0 });
  state.users.push(...users);

  const producerUsers = state.users.filter((u) => u.userType === "producer");
  const { producers, shows, roles } = await seedProducerProfiles(producerUsers, {
    minShows: 2,
    maxShows: 4,
  });
  state.producers.push(...producers);
  state.shows.push(...shows);
  state.roles.push(...roles);

  const organizationIdMap = new Map<string, string>();
  for (const show of state.shows) {
    organizationIdMap.set(show.id, show.organizationId);
  }

  // Most auditions should be open for the new talent to apply to
  await seedAuditions(state.shows, state.roles, [], organizationIdMap, {
    auditionProbability: 1.0,
    minApplications: 0,
    maxApplications: 0, // No applications yet
  });
}

async function seedNewProducerScenario(): Promise<void> {
  // Simulates a new producer setting up their first show
  console.log("Creating new producer onboarding scenario...");

  const testUsers = await seedTestUsers();
  state.users.push(...testUsers);

  // Create the producer profile with no shows
  const producerUser = testUsers.find((u) => u.userType === "producer");
  if (producerUser) {
    const { producers } = await seedProducerProfiles([producerUser], {
      minShows: 0,
      maxShows: 0,
    });
    state.producers.push(...producers);
  }

  // Add talent pool for when they create auditions
  const users = await seedUsers({ talentCount: 25, producerCount: 0, adminCount: 0 });
  state.users.push(...users);

  const talentUsers = state.users.filter((u) => u.userType === "talent");
  const profiles = await seedTalentProfiles(talentUsers);
  state.talentProfiles.push(...profiles);
}

async function seedReviewQueueScenario(): Promise<void> {
  // Many applications pending review for testing the review workflow
  console.log("Creating review queue scenario...");

  const testUsers = await seedTestUsers();
  state.users.push(...testUsers);

  // Create lots of talent
  const users = await seedUsers({ talentCount: 40, producerCount: 2, adminCount: 0 });
  state.users.push(...users);

  const talentUsers = state.users.filter((u) => u.userType === "talent");
  const producerUsers = state.users.filter((u) => u.userType === "producer");

  const profiles = await seedTalentProfiles(talentUsers);
  state.talentProfiles.push(...profiles);

  // Create a few shows with many roles
  const { producers, shows, roles } = await seedProducerProfiles(producerUsers, {
    minShows: 2,
    maxShows: 3,
    minRoles: 10,
    maxRoles: 15,
  });
  state.producers.push(...producers);
  state.shows.push(...shows);
  state.roles.push(...roles);

  const organizationIdMap = new Map<string, string>();
  for (const show of state.shows) {
    organizationIdMap.set(show.id, show.organizationId);
  }

  // All auditions open with many applications
  await seedAuditions(state.shows, state.roles, state.talentProfiles, organizationIdMap, {
    auditionProbability: 1.0,
    minApplications: 25,
    maxApplications: 40,
    includeForms: true,
  });
}

async function seedFull(): Promise<void> {
  await clearDatabase();

  const users = await seedUsers({
    talentCount: 25,
    producerCount: 5,
    adminCount: 2,
  });
  state.users.push(...users);

  const testUsers = await seedTestUsers();
  state.users.push(...testUsers);

  const talentUsers = state.users.filter((u) => u.userType === "talent");
  const producerUsers = state.users.filter((u) => u.userType === "producer");

  const profiles = await seedTalentProfiles(talentUsers);
  state.talentProfiles.push(...profiles);

  const { producers, shows, roles } = await seedProducerProfiles(producerUsers, {
    minShows: 2,
    maxShows: 5,
  });
  state.producers.push(...producers);
  state.shows.push(...shows);
  state.roles.push(...roles);

  const organizationIdMap = new Map<string, string>();
  for (const show of state.shows) {
    organizationIdMap.set(show.id, show.organizationId);
  }

  await seedAuditions(state.shows, state.roles, state.talentProfiles, organizationIdMap, {
    auditionProbability: 0.8,
    minApplications: 5,
    maxApplications: 20,
  });

  // Seed calendar entries for talent
  await seedCalendar(state.talentProfiles, state.shows);

  // Seed messages between users
  await seedMessages(state.users);

  // Seed notifications for all users
  await seedNotifications(state.users);

  // Seed materials (scripts and tracks) for shows
  await seedMaterials(state.shows, state.users);
}

// =============================================================================
// MAIN
// =============================================================================

const SEED_FUNCTIONS: Record<SeedType, () => Promise<void>> = {
  full: seedFull,
  clear: clearDatabase,
  users: seedUsersOnly,
  talent: seedTalentOnly,
  producer: seedProducerOnly,
  auditions: seedAuditionsOnly,
  calendar: seedCalendarOnly,
  messages: seedMessagesOnly,
  notifications: seedNotificationsOnly,
  materials: seedMaterialsOnly,
  test: seedTest,
  minimal: seedMinimal,
  "diverse-talent": seedDiverseTalentScenario,
  "active-auditions": seedActiveAuditionsScenario,
  "large-scale": seedLargeScale,
  "new-talent": seedNewTalentScenario,
  "new-producer": seedNewProducerScenario,
  "review-queue": seedReviewQueueScenario,
};

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const seedTypes = args.length > 0 ? args : ["full"];

  console.log(`\n========================================`);
  console.log(`  Database Seeder`);
  console.log(`  Running: ${seedTypes.join(" + ")}`);
  console.log(`========================================\n`);

  try {
    for (const seedType of seedTypes) {
      const seedFn = SEED_FUNCTIONS[seedType as SeedType];
      if (seedFn) {
        await runSeed(seedType.toUpperCase(), seedFn);
      } else {
        console.error(`Unknown seed type: ${seedType}`);
        console.log(`Available: ${Object.keys(SEED_FUNCTIONS).join(", ")}`);
        process.exit(1);
      }
    }

    console.log("\n========================================");
    console.log("  Seeding Complete!");
    console.log(`  Summary:`);
    console.log(`    Users: ${state.users.length}`);
    console.log(`    Talent Profiles: ${state.talentProfiles.length}`);
    console.log(`    Producers: ${state.producers.length}`);
    console.log(`    Shows: ${state.shows.length}`);
    console.log(`    Roles: ${state.roles.length}`);
    console.log("========================================\n");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

main();
