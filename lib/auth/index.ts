import NextAuth from "next-auth";
import { authConfig } from "./config";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export { authConfig } from "./config";
export { hashPassword, verifyPassword, validatePasswordStrength } from "./password";
export { generateSecureToken, getPasswordResetExpiry } from "./tokens";
export type { UserRole } from "./types";
