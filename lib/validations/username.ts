import { z } from "zod";

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = [
  "admin",
  "administrator",
  "api",
  "app",
  "auth",
  "calendar",
  "contact",
  "dashboard",
  "documents",
  "help",
  "login",
  "logout",
  "messages",
  "new",
  "null",
  "producer",
  "profile",
  "qr",
  "register",
  "resume",
  "search",
  "settings",
  "signup",
  "support",
  "system",
  "talent",
  "undefined",
  "upload",
  "user",
  "users",
  "www",
];

// Username must be URL-safe: lowercase letters, numbers, hyphens, underscores
const USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]*[a-z0-9]$|^[a-z0-9]$/;

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(
    USERNAME_REGEX,
    "Username can only contain lowercase letters, numbers, hyphens, and underscores. Must start and end with a letter or number."
  )
  .refine(
    (username) => !RESERVED_USERNAMES.includes(username.toLowerCase()),
    "This username is reserved"
  );

export const usernameCheckSchema = z.object({
  username: usernameSchema,
});

export const usernameSetSchema = z.object({
  username: usernameSchema,
});

export type UsernameCheck = z.infer<typeof usernameCheckSchema>;
export type UsernameSet = z.infer<typeof usernameSetSchema>;

export function normalizeUsername(username: string): string {
  return username.toLowerCase().trim();
}

export function isValidUsername(username: string): boolean {
  return usernameSchema.safeParse(username).success;
}

export { RESERVED_USERNAMES };
