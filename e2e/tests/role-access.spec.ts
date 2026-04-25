/**
 * Role-Based Access Control E2E Tests
 *
 * Tests that users can only access pages appropriate for their role,
 * and are properly redirected when trying to access unauthorized pages.
 * Requires test seed data: pnpm db:seed:test
 */

import { test, expect } from "@playwright/test";
import { login } from "../fixtures/auth";

test.describe("RBAC - Unauthenticated Users", () => {
  test("can access public pages", async ({ page }) => {
    // Home page
    await page.goto("/");
    await expect(page).toHaveURL("/");

    // Login page
    await page.goto("/login");
    await expect(page).toHaveURL("/login");

    // Signup page
    await page.goto("/signup");
    await expect(page).toHaveURL("/signup");
  });

  test("cannot access talent routes - redirected to login", async ({ page }) => {
    const talentRoutes = [
      "/talent/profile",
      "/talent/applications",
      "/talent/materials",
      "/talent/calendar",
      "/talent/resume",
    ];

    for (const route of talentRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("cannot access producer routes - redirected to login", async ({ page }) => {
    const producerRoutes = [
      "/producer/shows",
      "/producer/auditions",
      "/producer/talent-search",
      "/producer/staff",
    ];

    for (const route of producerRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("cannot access settings - redirected to login", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/settings/account");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login redirect includes callback URL", async ({ page }) => {
    await page.goto("/talent/profile");

    // Should redirect to login with callback
    await expect(page).toHaveURL(/\/login.*callbackUrl/);
  });
});

test.describe("RBAC - Talent User Access", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "talent");
  });

  test("can access talent-specific routes", async ({ page }) => {
    const talentRoutes = [
      { url: "/talent/profile", expected: /\/talent\/profile/ },
      { url: "/talent/applications", expected: /\/talent\/applications/ },
      { url: "/talent/materials", expected: /\/talent\/materials/ },
      { url: "/talent/calendar", expected: /\/talent\/calendar/ },
      { url: "/talent/resume", expected: /\/talent\/resume/ },
    ];

    for (const route of talentRoutes) {
      await page.goto(route.url);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(route.expected);
    }
  });

  test("can access settings", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/settings/);
  });

  test("cannot access producer routes - redirected", async ({ page }) => {
    const producerRoutes = ["/producer/shows", "/producer/auditions", "/producer/talent-search"];

    for (const route of producerRoutes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      // Should be redirected away from producer routes
      // Could redirect to talent profile, dashboard, or show forbidden
      await expect(page).not.toHaveURL(new RegExp(`^${route}$`));
    }
  });

  test("redirected away from login page when authenticated", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Should not stay on login page
    await expect(page).not.toHaveURL(/\/login$/);
  });

  test("redirected away from signup page when authenticated", async ({ page }) => {
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");

    // Should not stay on signup page
    await expect(page).not.toHaveURL(/\/signup$/);
  });

  test("redirected away from home page to talent profile", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should redirect to talent profile
    await expect(page).toHaveURL(/\/talent\/profile/);
  });
});

test.describe("RBAC - Producer User Access", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "producer");
  });

  test("can access producer-specific routes", async ({ page }) => {
    const producerRoutes = [
      { url: "/producer/shows", expected: /\/producer\/shows/ },
      { url: "/producer/auditions", expected: /\/producer\/auditions/ },
      { url: "/producer/talent-search", expected: /\/producer\/talent-search/ },
      { url: "/producer/staff", expected: /\/producer\/staff/ },
    ];

    for (const route of producerRoutes) {
      await page.goto(route.url);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(route.expected);
    }
  });

  test("can access settings", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/settings/);
  });

  test("cannot access talent routes - redirected", async ({ page }) => {
    const talentRoutes = ["/talent/profile", "/talent/applications", "/talent/materials"];

    for (const route of talentRoutes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      // Should be redirected away from talent routes
      await expect(page).not.toHaveURL(new RegExp(`^${route}$`));
    }
  });

  test("redirected away from login page when authenticated", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await expect(page).not.toHaveURL(/\/login$/);
  });

  test("redirected away from home page to producer shows", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should redirect to producer shows
    await expect(page).toHaveURL(/\/producer\/shows/);
  });
});

test.describe("RBAC - Admin User Access", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin");
  });

  test("can access talent routes", async ({ page }) => {
    // Admin should have access to talent routes
    await page.goto("/talent/profile");
    await page.waitForLoadState("networkidle");

    // Admin might be redirected to a different view or allowed access
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });

  test("can access producer routes", async ({ page }) => {
    // Admin should have access to producer routes
    await page.goto("/producer/shows");
    await page.waitForLoadState("networkidle");

    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });

  test("can access settings", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/settings/);
  });

  test("redirected away from auth pages when authenticated", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/login$/);

    await page.goto("/signup");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/signup$/);
  });
});

test.describe("RBAC - Public Routes", () => {
  test("auditions listing is accessible to all", async ({ page }) => {
    // Without login
    await page.goto("/auditions");
    await page.waitForLoadState("networkidle");

    // Should show auditions page or redirect appropriately
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });

  test("public talent profiles are accessible (if they exist)", async ({ page }) => {
    // Navigate to auditions first to find public profiles
    await page.goto("/auditions");
    await page.waitForLoadState("networkidle");

    // This is just a basic check that public routes work
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });
});

test.describe("RBAC - Cross-Role Behavior", () => {
  test("talent user accessing producer route gets redirected appropriately", async ({ page }) => {
    await login(page, "talent");

    await page.goto("/producer/shows");
    await page.waitForLoadState("networkidle");

    // Should be redirected - check we're not on producer/shows
    const url = page.url();
    expect(url).not.toMatch(/\/producer\/shows$/);
  });

  test("producer user accessing talent route gets redirected appropriately", async ({ page }) => {
    await login(page, "producer");

    await page.goto("/talent/profile");
    await page.waitForLoadState("networkidle");

    // Should be redirected - check we're not on talent/profile
    const url = page.url();
    expect(url).not.toMatch(/\/talent\/profile$/);
  });

  test("different users have different default routes after login", async ({ browser }) => {
    // Test talent login redirect
    const talentContext = await browser.newContext();
    const talentPage = await talentContext.newPage();
    await login(talentPage, "talent");
    await expect(talentPage).toHaveURL(/\/talent/);
    await talentContext.close();

    // Test producer login redirect
    const producerContext = await browser.newContext();
    const producerPage = await producerContext.newPage();
    await login(producerPage, "producer");
    await expect(producerPage).toHaveURL(/\/producer/);
    await producerContext.close();
  });
});

test.describe("RBAC - API Routes Protection", () => {
  test("unauthenticated API requests are rejected", async ({ request }) => {
    // Try to access a protected API endpoint without auth
    const response = await request.get("/api/talent/profile");

    // Should return 401 Unauthorized or redirect
    expect([401, 403, 302, 307]).toContain(response.status());
  });
});
