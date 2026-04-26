/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/restrict-template-expressions */
/**
 * Seed: Users
 * Creates base user accounts of different types
 */

import { users } from "../schema";
import { db, hashPassword, FIRST_NAMES, LAST_NAMES, randomPick } from "./base";

export interface SeededUser {
  id: string;
  email: string;
  name: string;
  userType: "talent" | "producer" | "admin";
}

export interface UserSeedOptions {
  talentCount?: number;
  producerCount?: number;
  adminCount?: number;
  /** Default password for all seeded users */
  password?: string;
}

const DEFAULT_OPTIONS: UserSeedOptions = {
  talentCount: 10,
  producerCount: 3,
  adminCount: 1,
  password: "password123",
};

/**
 * Seed users and return their IDs for use in other seeds
 */
export async function seedUsers(options: UserSeedOptions = {}): Promise<SeededUser[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const passwordHash = await hashPassword(opts.password!);
  const seededUsers: SeededUser[] = [];

  console.log(
    `Creating ${opts.talentCount} talent, ${opts.producerCount} producers, ${opts.adminCount} admins...`
  );

  // Track used emails to avoid duplicates
  const usedEmails = new Set<string>();

  const generateEmail = (firstName: string, lastName: string, type: string): string => {
    let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${type}.example.com`;
    let counter = 1;
    while (usedEmails.has(email)) {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${counter}@${type}.example.com`;
      counter++;
    }
    usedEmails.add(email);
    return email;
  };

  // Create talent users
  for (let i = 0; i < (opts.talentCount ?? 0); i++) {
    const firstName = randomPick(FIRST_NAMES);
    const lastName = randomPick(LAST_NAMES);
    const email = generateEmail(firstName, lastName, "talent");
    const name = `${firstName} ${lastName}`;

    const result = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        userType: "talent",
        name,
        emailVerified: new Date(),
      })
      .returning({ id: users.id });

    const user = result[0];
    if (user) {
      seededUsers.push({ id: user.id, email, name, userType: "talent" });
    }
  }

  // Create producer users
  for (let i = 0; i < (opts.producerCount ?? 0); i++) {
    const firstName = randomPick(FIRST_NAMES);
    const lastName = randomPick(LAST_NAMES);
    const email = generateEmail(firstName, lastName, "producer");
    const name = `${firstName} ${lastName}`;

    const result = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        userType: "producer",
        name,
        emailVerified: new Date(),
      })
      .returning({ id: users.id });

    const user = result[0];
    if (user) {
      seededUsers.push({ id: user.id, email, name, userType: "producer" });
    }
  }

  // Create admin users
  for (let i = 0; i < (opts.adminCount ?? 0); i++) {
    const email = i === 0 ? "admin@example.com" : `admin${i + 1}@example.com`;
    usedEmails.add(email);
    const name = i === 0 ? "System Admin" : `Admin ${i + 1}`;

    const result = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        userType: "admin",
        name,
        emailVerified: new Date(),
      })
      .returning({ id: users.id });

    const user = result[0];
    if (user) {
      seededUsers.push({ id: user.id, email, name, userType: "admin" });
    }
  }

  console.log(`Created ${seededUsers.length} users`);
  return seededUsers;
}

/**
 * Create specific test users with known credentials
 */
export async function seedTestUsers(): Promise<SeededUser[]> {
  const passwordHash = await hashPassword("test123");
  const testUsers: SeededUser[] = [];

  const testAccounts = [
    { email: "talent@test.com", name: "Test Talent", userType: "talent" as const },
    { email: "producer@test.com", name: "Test Producer", userType: "producer" as const },
    { email: "admin@test.com", name: "Test Admin", userType: "admin" as const },
  ];

  for (const account of testAccounts) {
    const result = await db
      .insert(users)
      .values({
        email: account.email,
        passwordHash,
        userType: account.userType,
        name: account.name,
        emailVerified: new Date(),
      })
      .returning({ id: users.id });

    const user = result[0];
    if (user) {
      testUsers.push({ id: user.id, ...account });
    }
  }

  console.log(`Created ${testUsers.length} test users (password: test123)`);
  return testUsers;
}
