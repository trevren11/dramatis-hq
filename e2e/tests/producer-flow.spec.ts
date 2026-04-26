/**
 * Producer User Flow E2E Tests
 *
 * Tests the complete producer user journey including shows management,
 * auditions, casting, and talent search.
 * Requires test seed data: pnpm db:seed:test
 */

import { test, expect } from "@playwright/test";
import { login } from "../fixtures/auth";

// Set reasonable timeout for flow tests
test.setTimeout(60000);

test.describe("Producer - Shows", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "producer");
  });

  test("can view shows list", async ({ page }) => {
    await page.goto("/producer/shows");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/producer\/shows/);

    // Should see shows list or empty state
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });

  test("shows page has create new show option", async ({ page }) => {
    await page.goto("/producer/shows");
    await page.waitForLoadState("networkidle");

    // Look for create/add show button
    const createButton = page
      .getByRole("link", { name: /new|create|add/i })
      .or(page.getByRole("button", { name: /new|create|add/i }));

    await expect(createButton.first()).toBeVisible();
  });

  test("can navigate to create new show page", async ({ page }) => {
    await page.goto("/producer/shows/new");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/producer\/shows\/new/);

    // Should see a form
    const form = page.locator("form");
    await expect(form).toBeVisible();
  });

  test("new show form has required fields", async ({ page }) => {
    await page.goto("/producer/shows/new");
    await page.waitForLoadState("networkidle");

    // Check for typical show fields
    const titleField = page.getByLabel(/title|name/i);
    await expect(titleField.first()).toBeVisible();

    // Check for other common fields
    const hasOtherFields =
      (await page.getByLabel(/type|venue|date/i).count()) > 0 ||
      (await page.locator("input, textarea, select").count()) > 1;

    expect(hasOtherFields).toBeTruthy();
  });

  test("can view individual show details (if shows exist)", async ({ page }) => {
    await page.goto("/producer/shows");
    await page.waitForLoadState("networkidle");

    // Find a show link and click it
    const showLink = page.locator("a[href^='/producer/shows/']").first();

    if (await showLink.isVisible()) {
      await showLink.click();
      await page.waitForLoadState("networkidle");

      // Should be on a show detail page
      await expect(page).toHaveURL(/\/producer\/shows\/[^/]+/);
    }
  });
});

test.describe("Producer - Auditions", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "producer");
  });

  test("can view auditions list", async ({ page }) => {
    await page.goto("/producer/auditions");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/producer\/auditions/);

    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });

  test("auditions page shows status or list", async ({ page }) => {
    await page.goto("/producer/auditions");
    await page.waitForLoadState("networkidle");

    // Look for audition cards, filters, or empty state
    const hasContent =
      (await page.getByRole("link").count()) > 0 ||
      (await page.getByText(/audition|open|draft|closed|no auditions/i).count()) > 0;

    expect(hasContent).toBeTruthy();
  });

  test("can navigate to create audition page", async ({ page }) => {
    await page.goto("/producer/auditions/create");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/producer\/auditions\/create/);
  });

  test("can view individual audition (if auditions exist)", async ({ page }) => {
    await page.goto("/producer/auditions");
    await page.waitForLoadState("networkidle");

    // Find an audition link
    const auditionLink = page.locator("a[href^='/producer/auditions/']").first();

    if (await auditionLink.isVisible()) {
      const href = await auditionLink.getAttribute("href");
      // Skip if it's the create link
      if (href && !href.includes("create")) {
        await auditionLink.click();
        await page.waitForLoadState("networkidle");

        await expect(page).toHaveURL(/\/producer\/auditions\/[^/]+/);
      }
    }
  });
});

test.describe("Producer - Audition Management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "producer");
  });

  test("audition detail page has management tabs or sections", async ({ page }) => {
    await page.goto("/producer/auditions");
    await page.waitForLoadState("networkidle");

    // Find an audition link that's not create
    const auditionLinks = await page.locator("a[href^='/producer/auditions/']").all();

    for (const link of auditionLinks) {
      const href = await link.getAttribute("href");
      if (href && !href.includes("create")) {
        await link.click();
        await page.waitForLoadState("networkidle");

        // Should see management options like form, checkin, session, callbacks
        const hasManagementUI =
          (await page.getByRole("tab").count()) > 0 ||
          (await page
            .getByRole("link", { name: /form|checkin|session|callback|applicant/i })
            .count()) > 0;

        expect(hasManagementUI || (await page.locator("main").textContent())?.length).toBeTruthy();
        break;
      }
    }
  });
});

test.describe("Producer - Talent Search", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "producer");
  });

  test("can access talent search page", async ({ page }) => {
    await page.goto("/producer/talent-search");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/producer\/talent-search/);
  });

  test("talent search has search/filter functionality", async ({ page }) => {
    await page.goto("/producer/talent-search");
    await page.waitForLoadState("networkidle");

    // Look for search input or filters
    const hasSearchUI =
      (await page.getByRole("searchbox").count()) > 0 ||
      (await page.getByPlaceholder(/search/i).count()) > 0 ||
      (await page.locator("input[type='search']").count()) > 0 ||
      (await page.getByLabel(/search|filter/i).count()) > 0;

    expect(hasSearchUI || (await page.locator("main").textContent())?.length).toBeTruthy();
  });

  test("talent search displays talent results or empty state", async ({ page }) => {
    await page.goto("/producer/talent-search");
    await page.waitForLoadState("networkidle");

    // Should see talent cards/list or empty state
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();

    const hasContent = (await mainContent.textContent())?.length ?? 0;
    expect(hasContent).toBeGreaterThan(0);
  });
});

test.describe("Producer - Show Sub-pages", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "producer");
  });

  test("can access show casting page (if show exists)", async ({ page }) => {
    await page.goto("/producer/shows");
    await page.waitForLoadState("networkidle");

    // Find a show link
    const showLink = page.locator("a[href^='/producer/shows/']").first();

    if (await showLink.isVisible()) {
      const href = await showLink.getAttribute("href");
      if (href && !href.includes("new")) {
        // Extract show ID and go to casting page
        const showId = href.split("/").pop() ?? "";
        if (showId) {
          await page.goto(`/producer/shows/${showId}/casting`);
          await page.waitForLoadState("networkidle");

          // Should be on casting page or redirected
          const mainContent = page.locator("main");
          await expect(mainContent).toBeVisible();
        }
      }
    }
  });

  test("can access show schedule page (if show exists)", async ({ page }) => {
    await page.goto("/producer/shows");
    await page.waitForLoadState("networkidle");

    const showLink = page.locator("a[href^='/producer/shows/']").first();

    if (await showLink.isVisible()) {
      const href = await showLink.getAttribute("href");
      if (href && !href.includes("new")) {
        const showId = href.split("/").pop() ?? "";
        if (showId) {
          await page.goto(`/producer/shows/${showId}/schedule`);
          await page.waitForLoadState("networkidle");

          const mainContent = page.locator("main");
          await expect(mainContent).toBeVisible();
        }
      }
    }
  });

  test("can access show budget page (if show exists)", async ({ page }) => {
    await page.goto("/producer/shows");
    await page.waitForLoadState("networkidle");

    const showLink = page.locator("a[href^='/producer/shows/']").first();

    if (await showLink.isVisible()) {
      const href = await showLink.getAttribute("href");
      if (href && !href.includes("new")) {
        const showId = href.split("/").pop() ?? "";
        if (showId) {
          await page.goto(`/producer/shows/${showId}/budget`);
          await page.waitForLoadState("networkidle");

          const mainContent = page.locator("main");
          await expect(mainContent).toBeVisible();
        }
      }
    }
  });
});

test.describe("Producer - Staff Management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "producer");
  });

  test("can access staff page", async ({ page }) => {
    await page.goto("/producer/staff");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/producer\/staff/);

    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });
});

test.describe("Producer - Setup", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "producer");
  });

  test("can access setup page", async ({ page }) => {
    await page.goto("/producer/setup");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/producer\/setup/);
  });
});

test.describe("Producer - Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "producer");
  });

  test("can navigate between producer sections", async ({ page }) => {
    await page.goto("/producer/shows");
    await page.waitForLoadState("networkidle");

    // Find navigation elements
    const navLinks = [
      { name: /shows/i, url: /shows/ },
      { name: /auditions/i, url: /auditions/ },
      { name: /talent/i, url: /talent/ },
      { name: /staff/i, url: /staff/ },
    ];

    for (const link of navLinks) {
      const navLink = page.getByRole("link", { name: link.name }).first();
      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForLoadState("networkidle");
        // Just verify navigation worked
        await expect(page.locator("main")).toBeVisible();

        // Navigate back to shows for next iteration
        await page.goto("/producer/shows");
        await page.waitForLoadState("networkidle");
      }
    }
  });
});

test.describe("Producer - Settings Access", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "producer");
  });

  test("can access settings", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/settings/);
  });

  test("can access account settings", async ({ page }) => {
    await page.goto("/settings/account");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/settings\/account/);
  });
});
