import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Helper to run axe accessibility checks
async function checkA11y(page: Page, options?: { disableRules?: string[] }): Promise<void> {
  const builder = new AxeBuilder({ page });

  if (options?.disableRules) {
    builder.disableRules(options.disableRules);
  }

  const results = await builder.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

  // Format violations for better error messages
  const violations = results.violations.map((v) => ({
    id: v.id,
    description: v.description,
    impact: v.impact,
    nodes: v.nodes.map((n) => ({
      html: n.html.slice(0, 200),
      failureSummary: n.failureSummary,
    })),
  }));

  expect(violations, "Accessibility violations found").toEqual([]);
}

test.describe("Accessibility - Public Pages", () => {
  test("home page is accessible", async ({ page }) => {
    await page.goto("/");
    await checkA11y(page);
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");
    await checkA11y(page);
  });

  test("signup page is accessible", async ({ page }) => {
    await page.goto("/signup");
    await checkA11y(page);
  });
});

test.describe("Accessibility - Keyboard Navigation", () => {
  test("can navigate login form with keyboard only", async ({ page }) => {
    await page.goto("/login");

    // Tab to first interactive element
    await page.keyboard.press("Tab");

    // Should be able to tab through form fields
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(["INPUT", "BUTTON", "A"]).toContain(focusedElement);
  });

  test("escape closes modal dialogs", async ({ page }) => {
    // This test will be expanded when modals are tested
    await page.goto("/");
    // Placeholder for modal escape key test
  });
});

test.describe("Accessibility - Focus Management", () => {
  test("focus is visible on interactive elements", async ({ page }) => {
    await page.goto("/login");

    // Tab to first input
    await page.keyboard.press("Tab");

    // Check that focus is visible (element has focus-visible styles)
    const hasFocusStyles = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      const styles = window.getComputedStyle(el);
      // Check for common focus indicators
      return (
        styles.outlineStyle !== "none" ||
        styles.boxShadow !== "none" ||
        el.classList.contains("focus-visible")
      );
    });

    expect(hasFocusStyles).toBe(true);
  });
});
