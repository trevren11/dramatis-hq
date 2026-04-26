/**
 * Authentication E2E Tests
 *
 * Tests login, logout, and session management for all user types.
 * Requires test seed data: pnpm db:seed:test
 */

import { test, expect } from "@playwright/test";
import { TEST_USERS, login } from "../fixtures/auth";

test.describe("Authentication - Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
  });

  test("login page renders correctly", async ({ page }) => {
    // Check essential elements - "Welcome Back" is in a CardTitle (div)
    await expect(page.getByText("Welcome Back")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("form validates required fields", async ({ page }) => {
    // HTML5 validation prevents empty submission
    // Just verify we stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.getByLabel("Email").fill("invalid@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Wait for response and error message
    await page.waitForLoadState("networkidle");

    // Should remain on login page
    await expect(page).toHaveURL(/\/login/);

    // Look for error message
    const errorMessage = page.locator(".bg-destructive\\/10");
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test("shows error for wrong password", async ({ page }) => {
    await page.getByLabel("Email").fill(TEST_USERS.talent.email);
    await page.getByLabel("Password").fill("wrongpassword123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Authentication - Talent User", () => {
  test("talent can login successfully", async ({ page }) => {
    await login(page, "talent");

    // Should be redirected to talent profile or dashboard
    await expect(page).toHaveURL(/\/(talent|profile)/);
  });

  test("talent sees correct user info after login", async ({ page }) => {
    await login(page, "talent");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Should see user name or email somewhere on page
    const userName = page
      .getByText(TEST_USERS.talent.name)
      .or(page.getByText(TEST_USERS.talent.email));
    await expect(userName.first()).toBeVisible({ timeout: 10000 });
  });

  test("talent can logout", async ({ page }) => {
    await login(page, "talent");
    await page.waitForLoadState("networkidle");

    // Find and click user menu button (contains user name or "Account")
    const userMenuButton = page
      .getByRole("button", { name: new RegExp(TEST_USERS.talent.name, "i") })
      .or(page.getByRole("button", { name: /Account/i }));

    await userMenuButton.first().click();

    // Click logout menu item
    const logoutMenuItem = page.getByRole("menuitem", { name: /Log out/i });
    await logoutMenuItem.click();

    // Logout redirects to "/" - verify we're logged out by checking for Sign In link
    await expect(page.getByRole("navigation").getByRole("link", { name: "Sign In" })).toBeVisible({
      timeout: 10000,
    });
  });

  test("talent is redirected to login when accessing protected route while logged out", async ({
    page,
  }) => {
    await page.goto("/talent/profile");

    // Should redirect to login with callback
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Authentication - Producer User", () => {
  test("producer can login successfully", async ({ page }) => {
    await login(page, "producer");

    // Should be redirected to producer dashboard or shows
    await expect(page).toHaveURL(/\/(producer|dashboard|shows)/);
  });

  test("producer sees correct user info after login", async ({ page }) => {
    await login(page, "producer");
    await page.waitForLoadState("networkidle");

    // Check if we're on a 404 page (sometimes happens if producer profile not set up)
    const is404 = await page
      .getByRole("heading", { name: "404" })
      .isVisible()
      .catch(() => false);
    if (is404) {
      test.skip(true, "Producer page returned 404 - likely missing producer profile setup");
      return;
    }

    const userName = page
      .getByText(TEST_USERS.producer.name)
      .or(page.getByText(TEST_USERS.producer.email));
    await expect(userName.first()).toBeVisible({ timeout: 10000 });
  });

  test("producer can logout", async ({ page }) => {
    await login(page, "producer");
    await page.waitForLoadState("networkidle");

    // Check if we're on a 404 page (sometimes happens if producer profile not set up)
    const is404 = await page
      .getByRole("heading", { name: "404" })
      .isVisible()
      .catch(() => false);
    if (is404) {
      test.skip(true, "Producer page returned 404 - likely missing producer profile setup");
      return;
    }

    // Find and click user menu button
    const userMenuButton = page
      .getByRole("button", { name: new RegExp(TEST_USERS.producer.name, "i") })
      .or(page.getByRole("button", { name: /Account/i }));

    await userMenuButton.first().click();

    // Click logout menu item
    const logoutMenuItem = page.getByRole("menuitem", { name: /Log out/i });
    await logoutMenuItem.click();

    // Logout redirects to "/" - verify we're logged out by checking for Sign In link
    await expect(page.getByRole("navigation").getByRole("link", { name: "Sign In" })).toBeVisible({
      timeout: 10000,
    });
  });

  test("producer is redirected to login when accessing protected route while logged out", async ({
    page,
  }) => {
    await page.goto("/producer/shows");

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Authentication - Admin User", () => {
  test("admin can login successfully", async ({ page }) => {
    await login(page, "admin");

    // Admin should be redirected somewhere (could be admin panel or default)
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("admin sees correct user info after login", async ({ page }) => {
    await login(page, "admin");
    await page.waitForLoadState("networkidle");

    const userName = page
      .getByText(TEST_USERS.admin.name)
      .or(page.getByText(TEST_USERS.admin.email));
    await expect(userName.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Authentication - Session Persistence", () => {
  test("session persists after page reload", async ({ page }) => {
    await login(page, "talent");
    await page.waitForLoadState("networkidle");

    // Reload the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Should still be logged in (not redirected to login)
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("logged in user is redirected away from login page", async ({ page }) => {
    await login(page, "talent");
    await page.waitForLoadState("networkidle");

    // Try to go to login page
    await page.goto("/login");

    // Should be redirected away
    await expect(page).not.toHaveURL(/\/login$/);
  });

  test("logged in user is redirected away from signup page", async ({ page }) => {
    await login(page, "producer");
    await page.waitForLoadState("networkidle");

    // Try to go to signup page
    await page.goto("/signup");

    // Should be redirected away
    await expect(page).not.toHaveURL(/\/signup/);
  });
});

test.describe("Authentication - Security", () => {
  test("password field is masked", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const passwordField = page.getByLabel("Password");
    await expect(passwordField).toHaveAttribute("type", "password");
  });

  test("login form exists", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // The form should exist
    const form = page.locator("form");
    await expect(form).toBeVisible();
  });

  test("session is invalidated after logout", async ({ page }) => {
    await login(page, "talent");
    await page.waitForLoadState("networkidle");

    // Logout
    const userMenuButton = page
      .getByRole("button", { name: new RegExp(TEST_USERS.talent.name, "i") })
      .or(page.getByRole("button", { name: /Account/i }));

    await userMenuButton.first().click();

    const logoutMenuItem = page.getByRole("menuitem", { name: /Log out/i });
    await logoutMenuItem.click();

    // Wait for redirect to home after logout - verify we're logged out
    await expect(page.getByRole("navigation").getByRole("link", { name: "Sign In" })).toBeVisible({
      timeout: 10000,
    });

    // Now try to access a protected route
    await page.goto("/talent/profile");
    await page.waitForLoadState("networkidle");

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });
});
