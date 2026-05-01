import type { DefaultSession } from "next-auth";

export type UserRole = "talent" | "producer" | "admin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    rememberMe?: boolean;
  }
}

export interface ExtendedJWT {
  id?: string;
  role?: UserRole;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
  sub?: string;
  rememberMe?: boolean;
}
