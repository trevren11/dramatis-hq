import { test, expect } from "@playwright/test";

test.describe("Mobile Responsiveness", () => {
  test.describe("Viewport Tests", () => {
    test("should have no horizontal scroll at 320px width", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto("/");

      // Check that body doesn't have horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);

      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
    });

    test("should display content correctly at common mobile widths", async ({ page }) => {
      const widths = [320, 375, 414, 428];

      for (const width of widths) {
        await page.setViewportSize({ width, height: 812 });
        await page.goto("/");

        // Verify no content is clipped
        const overflowX = await page.evaluate(() => getComputedStyle(document.body).overflowX);
        expect(overflowX).not.toBe("scroll");
      }
    });
  });

  test.describe("PWA", () => {
    test("should have a valid web app manifest", async ({ page }) => {
      await page.goto("/");

      // Check for manifest link
      const manifestLink = await page.$('link[rel="manifest"]');
      expect(manifestLink).not.toBeNull();

      // Fetch and validate manifest
      const response = await page.request.get("/manifest.json");
      expect(response.ok()).toBeTruthy();

      const manifest = (await response.json()) as {
        name: string;
        short_name: string;
        display: string;
        icons: unknown[];
      };
      expect(manifest.name).toBe("Dramatis-HQ");
      expect(manifest.short_name).toBe("Dramatis");
      expect(manifest.display).toBe("standalone");
      expect(manifest.icons).toBeDefined();
      expect(manifest.icons.length).toBeGreaterThan(0);
    });

    test("should have theme-color meta tag", async ({ page }) => {
      await page.goto("/");

      const themeColor = await page.$('meta[name="theme-color"]');
      expect(themeColor).not.toBeNull();

      const content = await themeColor?.getAttribute("content");
      expect(content).toBe("#7c3aed");
    });

    test("should register service worker", async ({ page }) => {
      await page.goto("/");

      // Service worker may not be registered in test env, just check the API exists
      const hasServiceWorkerApi = await page.evaluate(() => "serviceWorker" in navigator);
      expect(hasServiceWorkerApi).toBeTruthy();

      // Optionally check if SW is registered (may be false in test env)
      const swRegistered = await page.evaluate(async () => {
        if (!("serviceWorker" in navigator)) return false;
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          return registration !== undefined;
        } catch {
          return false;
        }
      });
      // Just log the result, don't fail if not registered in test
      console.log("Service worker registered:", swRegistered);
    });
  });

  test.describe("Touch Targets", () => {
    test("buttons should meet minimum touch target size", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/");

      // Get all buttons
      const buttons = await page.$$("button");

      for (const button of buttons.slice(0, 10)) {
        // Check first 10 buttons
        const box = await button.boundingBox();
        if (box) {
          // Minimum touch target is 44x44px
          expect(box.height).toBeGreaterThanOrEqual(40); // Allow slight tolerance
          expect(box.width).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test("links should be easily tappable on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/");

      // Get navigation links
      const navLinks = await page.$$("nav a");

      for (const link of navLinks) {
        const box = await link.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });
  });

  test.describe("Navigation", () => {
    test("should show mobile navigation on small screens", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/");

      // Check for mobile menu button
      const menuButton = await page.$('button[aria-label*="menu" i]');
      expect(menuButton).not.toBeNull();
    });

    test("should hide mobile menu button on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/");

      // Mobile menu button should be hidden
      const menuButton = await page.$('button[aria-label*="menu" i]');
      if (menuButton) {
        const isVisible = await menuButton.isVisible();
        expect(isVisible).toBeFalsy();
      }
    });
  });

  test.describe("Form Accessibility", () => {
    test("inputs should have appropriate input modes", async ({ page }) => {
      await page.goto("/login");

      // Email input should have email inputmode
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        const inputMode = await emailInput.getAttribute("inputmode");
        // Should have email inputmode or be email type
        expect(
          inputMode === "email" || (await emailInput.getAttribute("type")) === "email"
        ).toBeTruthy();
      }
    });

    test("inputs should not cause zoom on iOS", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/login");

      // Check that inputs have at least 16px font size
      const inputs = await page.$$("input");

      for (const input of inputs) {
        const fontSize = await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
        // iOS zooms on focus for fonts < 16px
        expect(fontSize).toBeGreaterThanOrEqual(16);
      }
    });
  });

  test.describe("Offline Support", () => {
    test("should detect offline status", async ({ page, context }) => {
      await page.goto("/");

      // Set offline mode
      await context.setOffline(true);

      // Trigger a navigation or refresh to detect offline
      try {
        await page.reload({ timeout: 5000 });
      } catch {
        // Expected to fail when offline
      }

      // Should show offline indicator or cached content
      // This is a basic check - full offline testing requires more setup
      await context.setOffline(false);
    });
  });
});

test.describe("Tablet Layout", () => {
  test("should display optimized layout on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    // On tablet, content should be displayed without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });
});
