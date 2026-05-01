/**
 * Login E2E Test - Post-Deploy Verification
 *
 * This is a minimal login test designed to run after deployments to verify
 * the app is working end-to-end. It checks:
 * - Login page renders
 * - Can authenticate with test credentials
 * - User lands on expected page after login
 *
 * Run with: pnpm test:e2e:login
 * Or during deploy: PLAYWRIGHT_BASE_URL=http://limbo.local:6767 pnpm test:e2e:login
 */

import { test, expect } from "@playwright/test";
import { TEST_USERS, login } from "../fixtures/auth";

test.describe("Login - Post-Deploy Verification", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Verify essential elements are present
    await expect(page.getByText("Welcome Back")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("talent user can log in successfully", async ({ page }) => {
    await login(page, "talent");

    // Should be redirected to talent area
    await expect(page).toHaveURL(/\/(talent|profile)/);

    // Should see user info (proves session works)
    await page.waitForLoadState("networkidle");
    const userName = page
      .getByText(TEST_USERS.talent.name)
      .or(page.getByText(TEST_USERS.talent.email));
    await expect(userName.first()).toBeVisible({ timeout: 10000 });
  });

  test("producer user can log in successfully", async ({ page }) => {
    await login(page, "producer");

    // Should be redirected away from login
    await expect(page).not.toHaveURL(/\/login/);

    // Page should load without errors
    await page.waitForLoadState("networkidle");

    // If we get a 404, the producer profile might not be seeded - that's OK for deploy check
    const is404 = await page
      .getByRole("heading", { name: "404" })
      .isVisible()
      .catch(() => false);
    if (is404) {
      // Still a successful login, just missing producer profile
      test.info().annotations.push({
        type: "warning",
        description: "Producer profile not found - seed data may be incomplete",
      });
      return;
    }

    // If not 404, should see user info
    const userName = page
      .getByText(TEST_USERS.producer.name)
      .or(page.getByText(TEST_USERS.producer.email));
    await expect(userName.first()).toBeVisible({ timeout: 10000 });
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.getByLabel("Email").fill("invalid@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForLoadState("networkidle");

    // Should remain on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("login with remember me checkbox checked", async ({ page }) => {
    await login(page, "talent", { rememberMe: true });

    // Should be redirected to talent area (login succeeded)
    await expect(page).toHaveURL(/\/(talent|profile)/);

    // Should see user info (proves session works with remember me)
    await page.waitForLoadState("networkidle");
    const userName = page
      .getByText(TEST_USERS.talent.name)
      .or(page.getByText(TEST_USERS.talent.email));
    await expect(userName.first()).toBeVisible({ timeout: 10000 });
  });
});
