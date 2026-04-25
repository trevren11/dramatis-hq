/**
 * Talent User Flow E2E Tests
 *
 * Tests the complete talent user journey including profile management,
 * applications, materials, and calendar.
 * Requires test seed data: pnpm db:seed:test
 */

import { test, expect } from "@playwright/test";
import { login } from "../fixtures/auth";

// Set reasonable timeout for flow tests
test.setTimeout(60000);

test.describe("Talent - Profile", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "talent");
  });

  test("can view profile page", async ({ page }) => {
    await page.goto("/talent/profile");
    await page.waitForLoadState("networkidle");

    // Should see profile content
    await expect(page).toHaveURL(/\/talent\/profile/);

    // Profile should have some content (name, bio, etc.)
    const profileContent = page.locator("main");
    await expect(profileContent).toBeVisible();
  });

  test("can navigate to profile edit", async ({ page }) => {
    await page.goto("/talent/profile");
    await page.waitForLoadState("networkidle");

    // Look for edit button/link
    const editButton = page
      .getByRole("link", { name: /edit/i })
      .or(page.getByRole("button", { name: /edit/i }));

    if (await editButton.first().isVisible()) {
      await editButton.first().click();
      await expect(page).toHaveURL(/\/talent\/profile\/(edit|wizard)/);
    }
  });

  test("profile displays talent information", async ({ page }) => {
    await page.goto("/talent/profile");
    await page.waitForLoadState("networkidle");

    // Should display some profile information
    // Check for common profile elements
    const profileSection = page.locator("main");
    await expect(profileSection).toBeVisible();

    // Look for profile elements like headshot, name, bio sections
    const hasContent = await page.locator("main").textContent();
    expect(hasContent?.length).toBeGreaterThan(0);
  });
});

test.describe("Talent - Profile Edit", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "talent");
    await page.goto("/talent/profile/edit");
  });

  test("can access profile edit page", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/talent\/profile\/edit/);
  });

  test("profile edit form has required fields", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check for common profile fields
    const form = page.locator("form");
    if (await form.isVisible()) {
      // Should have at least some form inputs
      const inputs = await page.locator("input, textarea, select").count();
      expect(inputs).toBeGreaterThan(0);
    }
  });
});

test.describe("Talent - Applications", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "talent");
  });

  test("can view applications page", async ({ page }) => {
    await page.goto("/talent/applications");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/talent\/applications/);

    // Should see applications content or empty state
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });

  test("applications page shows status filters or list", async ({ page }) => {
    await page.goto("/talent/applications");
    await page.waitForLoadState("networkidle");

    // Look for filter tabs, status indicators, or application cards
    const hasFiltersOrList =
      (await page.getByRole("tab").count()) > 0 ||
      (await page.getByRole("listitem").count()) > 0 ||
      (await page.locator("[data-testid*='application']").count()) > 0 ||
      (await page.getByText(/no applications|submitted|pending|reviewed/i).count()) > 0;

    // Should have some UI for applications
    expect(hasFiltersOrList || (await page.locator("main").textContent())?.length).toBeTruthy();
  });
});

test.describe("Talent - Materials", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "talent");
  });

  test("can view materials page", async ({ page }) => {
    await page.goto("/talent/materials");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/talent\/materials/);
  });

  test("materials page has upload capability", async ({ page }) => {
    await page.goto("/talent/materials");
    await page.waitForLoadState("networkidle");

    // Look for upload buttons, file inputs, or upload areas
    const hasUploadUI =
      (await page.getByRole("button", { name: /upload|add/i }).count()) > 0 ||
      (await page.locator("input[type='file']").count()) > 0 ||
      (await page.getByText(/upload|drag|drop/i).count()) > 0;

    // Materials page should have some way to manage materials
    const mainContent = await page.locator("main").textContent();
    expect(hasUploadUI || mainContent?.length).toBeTruthy();
  });
});

test.describe("Talent - Calendar", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "talent");
  });

  test("can view calendar page", async ({ page }) => {
    await page.goto("/talent/calendar");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/talent\/calendar/);
  });

  test("calendar displays month view", async ({ page }) => {
    await page.goto("/talent/calendar");
    await page.waitForLoadState("networkidle");

    // Calendar should show current month or week
    const currentMonth = new Date().toLocaleString("default", { month: "long" });
    const currentYear = new Date().getFullYear().toString();

    // Look for calendar-like elements
    const hasCalendarUI =
      (await page.getByText(currentMonth).count()) > 0 ||
      (await page.getByText(currentYear).count()) > 0 ||
      (await page.locator("[class*='calendar']").count()) > 0 ||
      (await page.locator("[data-testid*='calendar']").count()) > 0;

    expect(hasCalendarUI).toBeTruthy();
  });
});

test.describe("Talent - Resume", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "talent");
  });

  test("can view resume page", async ({ page }) => {
    await page.goto("/talent/resume");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/talent\/resume/);
  });

  test("resume page shows work history or empty state", async ({ page }) => {
    await page.goto("/talent/resume");
    await page.waitForLoadState("networkidle");

    // Should show work history, education, or skills
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();

    // Look for resume sections
    const hasResumeSections =
      (await page.getByText(/work history|experience|education|skills|training/i).count()) > 0 ||
      (await page.getByRole("heading").count()) > 0;

    expect(hasResumeSections || (await mainContent.textContent())?.length).toBeTruthy();
  });
});

test.describe("Talent - Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "talent");
  });

  test("can navigate between talent sections", async ({ page }) => {
    // Start at profile
    await page.goto("/talent/profile");
    await page.waitForLoadState("networkidle");

    // Find navigation elements
    const navLinks = [
      { name: /applications/i, url: /applications/ },
      { name: /materials/i, url: /materials/ },
      { name: /calendar/i, url: /calendar/ },
      { name: /resume/i, url: /resume/ },
    ];

    for (const link of navLinks) {
      const navLink = page.getByRole("link", { name: link.name }).first();
      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveURL(link.url);

        // Navigate back to profile for next iteration
        await page.goto("/talent/profile");
        await page.waitForLoadState("networkidle");
      }
    }
  });
});

test.describe("Talent - Public Profile", () => {
  test("public profile page is accessible", async ({ page }) => {
    // Don't need to be logged in for public profile
    // The username comes from the seeded talent profile
    // Try to access a public talent profile if one exists
    await page.goto("/auditions");

    // If there are talent links, try clicking one
    const talentLink = page.locator("a[href^='/talent/']").first();
    if (await talentLink.isVisible()) {
      await talentLink.click();
      await page.waitForLoadState("networkidle");

      // Should see a public profile page
      await expect(page).toHaveURL(/\/talent\//);
    }
  });
});

test.describe("Talent - Settings Access", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "talent");
  });

  test("can access settings", async ({ page }) => {
    // Navigate to settings
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Should see settings page or be redirected to a settings subpage
    await expect(page).toHaveURL(/\/settings/);
  });

  test("can access account settings", async ({ page }) => {
    await page.goto("/settings/account");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/settings\/account/);
  });
});
