/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/restrict-template-expressions */
/**
 * Base utilities for seeding the database
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../schema";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL ?? "postgres://build:build@localhost:5433/build";

// Create a client without server-only restrictions for seeding
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

/**
 * Hash a password for storing
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Generate a random slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generate a random date within a range
 */
export function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Pick a random item from an array
 */
export function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/**
 * Pick N random items from an array
 */
export function randomPickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random boolean with optional probability
 */
export function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

/**
 * Create placeholder image URL (using picsum.photos)
 */
export function placeholderImage(width: number, height: number, seed?: string): string {
  const seedParam = seed ? `?random=${seed}` : `?random=${Math.random()}`;
  return `https://picsum.photos/${width}/${height}${seedParam}`;
}

/**
 * Run a seed and handle errors
 */
export async function runSeed(name: string, seedFn: () => Promise<void>): Promise<boolean> {
  console.log(`\n--- Running seed: ${name} ---`);
  try {
    await seedFn();
    console.log(`--- Completed: ${name} ---\n`);
    return true;
  } catch (error) {
    console.error(`--- Failed: ${name} ---`);
    console.error(error);
    return false;
  }
}

/**
 * Close database connection
 */
export async function closeConnection(): Promise<void> {
  await client.end();
}

// Sample data pools for realistic seeding
export const FIRST_NAMES = [
  "Emma",
  "Liam",
  "Olivia",
  "Noah",
  "Ava",
  "Elijah",
  "Sophia",
  "Lucas",
  "Isabella",
  "Mason",
  "Mia",
  "James",
  "Charlotte",
  "Benjamin",
  "Amelia",
  "Jacob",
  "Harper",
  "Michael",
  "Evelyn",
  "Daniel",
  "Abigail",
  "Henry",
  "Emily",
  "Alexander",
  "Elizabeth",
  "Sebastian",
  "Sofia",
  "William",
  "Avery",
  "Jack",
  "Ella",
  "Owen",
  "Scarlett",
  "Theodore",
  "Grace",
  "Aiden",
  "Chloe",
  "Samuel",
  "Victoria",
  "Joseph",
];

export const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
];

export const CITIES = [
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "Austin, TX",
  "San Francisco, CA",
  "Seattle, WA",
  "Denver, CO",
  "Boston, MA",
  "Nashville, TN",
  "Portland, OR",
  "Atlanta, GA",
  "Miami, FL",
  "Minneapolis, MN",
  "Detroit, MI",
];

export const THEATER_COMPANIES = [
  "Steppenwolf Theatre",
  "Roundabout Theatre",
  "The Public Theater",
  "Berkeley Rep",
  "Goodman Theatre",
  "Second City",
  "Arena Stage",
  "Lincoln Center Theater",
  "La Jolla Playhouse",
  "Seattle Rep",
  "Oregon Shakespeare Festival",
  "Trinity Rep",
  "Guthrie Theater",
  "Center Theatre Group",
  "Paper Mill Playhouse",
];

export const SHOW_TITLES = [
  "Hamlet",
  "A Midsummer Night's Dream",
  "The Phantom of the Opera",
  "Les Miserables",
  "Chicago",
  "West Side Story",
  "The Sound of Music",
  "Rent",
  "Wicked",
  "Hamilton",
  "Dear Evan Hansen",
  "The Lion King",
  "Cats",
  "Oklahoma!",
  "Annie",
  "Grease",
  "Mamma Mia!",
  "The Book of Mormon",
  "Into the Woods",
  "Sweeney Todd",
];

export const VENUES = [
  "Main Stage",
  "Studio Theater",
  "Black Box",
  "Amphitheater",
  "Community Center",
  "Downtown Playhouse",
  "Arts Center",
  "Civic Theater",
  "Opera House",
  "Historic Theater",
];

export const DIRECTOR_NAMES = [
  "Sarah Mitchell",
  "David Chen",
  "Maria Santos",
  "Robert Kim",
  "Jennifer Walsh",
  "Michael Thompson",
  "Lisa Anderson",
  "James Peterson",
  "Karen White",
  "Christopher Lee",
];

export const BIOS = [
  "A versatile performer with a passion for storytelling and character work. Trained at prestigious conservatories and has appeared in numerous regional productions.",
  "Dedicated to bringing authentic emotional depth to every role. Background in both classical theater and contemporary work, with a focus on creating meaningful connections with audiences.",
  "Combines technical excellence with raw emotional honesty. Has performed in venues ranging from intimate black box theaters to large regional stages.",
  "Brings a unique perspective and energy to every project. Trained extensively in movement, voice, and various acting techniques.",
  "Known for collaborative spirit and commitment to ensemble work. Experience spans theater, film, and television with a foundation in live performance.",
];

// Date utilities for relative seed data
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Get a date relative to now (positive = future, negative = past)
 */
export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * MS_PER_DAY);
}

/**
 * Get a date relative to now in months
 */
export function monthsFromNow(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
}

/**
 * Get a date relative to now in years
 */
export function yearsFromNow(years: number): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() + years);
  return date;
}

/**
 * Get current year
 */
export function currentYear(): number {
  return new Date().getFullYear();
}
