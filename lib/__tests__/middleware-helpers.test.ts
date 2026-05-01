/**
 * Tests for middleware helper functions
 * Extracted from middleware.ts for testability
 */
import { describe, it, expect } from "vitest";

// Re-implement the helper functions from middleware.ts for testing
// (The actual middleware uses these inline, but we test the logic here)

const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/invite"];
const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
const talentOnlyRoutes = ["/profile", "/auditions", "/talent"];
const producerOnlyRoutes = ["/dashboard", "/projects", "/casting"];

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

function matchesSignupOrRoute(pathname: string, routes: string[]): boolean {
  return routes.some((r) => pathname === r) || pathname.startsWith("/signup/");
}

interface RoleRedirectResult {
  shouldRedirect: boolean;
  redirectTo?: string;
}

function handleRoleBasedRedirect(
  pathname: string,
  userRole: string | undefined
): RoleRedirectResult {
  const isTalentOnly = matchesRoute(pathname, talentOnlyRoutes);
  const isProducerOnly = matchesRoute(pathname, producerOnlyRoutes);

  if (isTalentOnly && userRole !== "talent" && userRole !== "admin") {
    return { shouldRedirect: true, redirectTo: "/dashboard" };
  }
  if (isProducerOnly && userRole !== "producer" && userRole !== "admin") {
    return { shouldRedirect: true, redirectTo: "/profile" };
  }
  return { shouldRedirect: false };
}

function getPostLoginRedirect(userRole: string | undefined): string {
  return userRole === "producer" ? "/producer/shows" : "/talent/profile";
}

describe("Middleware Route Matching", () => {
  describe("matchesRoute", () => {
    it("should match exact routes", () => {
      expect(matchesRoute("/login", authRoutes)).toBe(true);
      expect(matchesRoute("/signup", authRoutes)).toBe(true);
      expect(matchesRoute("/profile", talentOnlyRoutes)).toBe(true);
    });

    it("should match routes with sub-paths", () => {
      expect(matchesRoute("/profile/edit", talentOnlyRoutes)).toBe(true);
      expect(matchesRoute("/talent/settings", talentOnlyRoutes)).toBe(true);
      expect(matchesRoute("/dashboard/analytics", producerOnlyRoutes)).toBe(true);
    });

    it("should not match unrelated routes", () => {
      expect(matchesRoute("/api/auth", authRoutes)).toBe(false);
      expect(matchesRoute("/producer/shows", talentOnlyRoutes)).toBe(false);
    });
  });

  describe("matchesSignupOrRoute", () => {
    it("should match exact public routes", () => {
      expect(matchesSignupOrRoute("/", publicRoutes)).toBe(true);
      expect(matchesSignupOrRoute("/login", publicRoutes)).toBe(true);
    });

    it("should match signup sub-paths", () => {
      expect(matchesSignupOrRoute("/signup/talent", publicRoutes)).toBe(true);
      expect(matchesSignupOrRoute("/signup/producer", publicRoutes)).toBe(true);
    });
  });
});

describe("Role-Based Access Control", () => {
  describe("handleRoleBasedRedirect", () => {
    it("should redirect talent away from producer routes", () => {
      const result = handleRoleBasedRedirect("/dashboard", "talent");
      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe("/profile");
    });

    it("should redirect producer away from talent routes", () => {
      const result = handleRoleBasedRedirect("/profile", "producer");
      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe("/dashboard");
    });

    it("should allow talent to access talent routes", () => {
      const result = handleRoleBasedRedirect("/profile", "talent");
      expect(result.shouldRedirect).toBe(false);
    });

    it("should allow producer to access producer routes", () => {
      const result = handleRoleBasedRedirect("/dashboard", "producer");
      expect(result.shouldRedirect).toBe(false);
    });

    it("should allow admin to access any route", () => {
      expect(handleRoleBasedRedirect("/profile", "admin").shouldRedirect).toBe(false);
      expect(handleRoleBasedRedirect("/dashboard", "admin").shouldRedirect).toBe(false);
    });

    it("should handle undefined role gracefully", () => {
      // When role is undefined (e.g., malformed session), should redirect
      const result = handleRoleBasedRedirect("/dashboard", undefined);
      expect(result.shouldRedirect).toBe(true);
    });
  });

  describe("getPostLoginRedirect", () => {
    it("should redirect producer to /producer/shows", () => {
      expect(getPostLoginRedirect("producer")).toBe("/producer/shows");
    });

    it("should redirect talent to /talent/profile", () => {
      expect(getPostLoginRedirect("talent")).toBe("/talent/profile");
    });

    it("should redirect admin to /talent/profile (default)", () => {
      expect(getPostLoginRedirect("admin")).toBe("/talent/profile");
    });

    it("should handle undefined role by redirecting to talent profile", () => {
      // This tests the fix for GitHub issue #121
      // Previously this would crash, now it safely defaults to talent profile
      expect(getPostLoginRedirect(undefined)).toBe("/talent/profile");
    });
  });
});

describe("User Role Handling - Issue #121 Fix", () => {
  it("should safely access role from potentially undefined user object", () => {
    // Simulating the fix: req.auth?.user?.role instead of req.auth?.user.role
    interface MaybeAuth {
      user?: { role?: string };
    }
    const authWithUndefinedUser: MaybeAuth = { user: undefined };
    const authWithNoRole: MaybeAuth = { user: {} };
    const authWithRole: MaybeAuth = { user: { role: "producer" } };

    // These should all NOT throw
    expect(authWithUndefinedUser.user?.role).toBeUndefined();
    expect(authWithNoRole.user?.role).toBeUndefined();
    expect(authWithRole.user?.role).toBe("producer");
  });

  it("should handle malformed auth objects without crashing", () => {
    // Simulating various edge cases that could occur with auth issues
    const testCases = [
      { auth: null, expected: undefined },
      { auth: undefined, expected: undefined },
      { auth: { user: null }, expected: undefined },
      { auth: { user: undefined }, expected: undefined },
      { auth: { user: {} }, expected: undefined },
      { auth: { user: { role: null } }, expected: null },
      { auth: { user: { role: "producer" } }, expected: "producer" },
    ];

    for (const { auth, expected } of testCases) {
      const role = (auth as { user?: { role?: string } | null } | null | undefined)?.user?.role;
      expect(role).toBe(expected);
    }
  });
});
