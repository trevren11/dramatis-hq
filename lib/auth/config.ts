import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { users, accounts } from "@/lib/db/schema";
import { verifyPassword } from "./password";
import type { UserRole } from "./types";

import "./types";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
  }),
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days default
  },
  pages: {
    signIn: "/login",
    newUser: "/signup",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email.toLowerCase()),
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.userType,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // user is only present on initial sign-in (runtime check required despite types)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }

      // For OAuth sign-ins, fetch the user's role from the database
      if (account?.provider === "google" && token.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, token.email),
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.userType;
        }
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      return session;
    },
    async signIn({ user, account }) {
      // For OAuth, ensure the user exists with a role
      if (account?.provider === "google" && user.email) {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });

        // If user doesn't exist, they need to sign up first to select their role
        if (!existingUser) {
          // Allow sign-in - the adapter will create the user
          // They'll be redirected to complete profile setup
          return true;
        }
      }

      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // New OAuth users default to talent role
      if (user.id) {
        await db.update(users).set({ userType: "talent" }).where(eq(users.id, user.id));
      }
    },
  },
};
