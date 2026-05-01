/**
 * Authentication fixtures and helpers for e2e tests
 */

import { expect, type Page } from "@playwright/test";

// Test user credentials (from seed system)
export const TEST_USERS = {
  talent: {
    email: "talent@test.com",
    password: "test123",
    name: "Test Talent",
    role: "talent" as const,
  },
  producer: {
    email: "producer@test.com",
    password: "test123",
    name: "Test Producer",
    role: "producer" as const,
  },
  admin: {
    email: "admin@test.com",
    password: "test123",
    name: "Test Admin",
    role: "admin" as const,
  },
} as const;

export type UserType = keyof typeof TEST_USERS;

/**
 * Login helper function
 * Includes retry logic for CI stability
 */
export async function login(
  page: Page,
  userType: UserType,
  options?: { rememberMe?: boolean }
): Promise<void> {
  const user = TEST_USERS[userType];
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      // Ensure form is ready
      const emailField = page.getByLabel("Email");
      await expect(emailField).toBeVisible({ timeout: 5000 });

      // Clear and fill credentials
      await emailField.clear();
      await emailField.fill(user.email);

      const passwordField = page.getByLabel("Password");
      await passwordField.clear();
      await passwordField.fill(user.password);

      // Check remember me if requested
      if (options?.rememberMe) {
        const rememberMe = page.getByLabel(/remember/i);
        if (await rememberMe.isVisible()) {
          await rememberMe.check();
        }
      }

      // Submit form - button text is "Sign In"
      const signInButton = page.getByRole("button", { name: "Sign In" });
      await expect(signInButton).toBeEnabled({ timeout: 3000 });
      await signInButton.click();

      // Wait for navigation away from login page
      await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

      // Success - login completed
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retry
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Logout helper function
 */
export async function logout(page: Page): Promise<void> {
  // Try to find and click logout button/link
  // First check for a user menu
  const userMenu = page.getByRole("button", { name: /account|profile|menu/i });
  if (await userMenu.isVisible()) {
    await userMenu.click();
  }

  // Click logout
  const logoutButton = page
    .getByRole("menuitem", { name: /log out|sign out/i })
    .or(page.getByRole("button", { name: /log out|sign out/i }))
    .or(page.getByRole("link", { name: /log out|sign out/i }));

  await logoutButton.click();

  // Should redirect to login or home
  await expect(page).toHaveURL(/\/(login)?$/);
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check for common logged-in indicators
  const logoutButton = page
    .getByRole("button", { name: /log out|sign out/i })
    .or(page.getByRole("menuitem", { name: /log out|sign out/i }));

  return await logoutButton.isVisible().catch(() => false);
}

/**
 * Get current user info from page
 */
export async function getCurrentUser(
  page: Page
): Promise<{ name?: string; email?: string } | null> {
  try {
    // Try to find user info displayed on page
    const userMenu = page.getByRole("button", { name: /account|profile|menu/i });
    if (await userMenu.isVisible()) {
      const text = await userMenu.textContent();
      return { name: text ?? undefined };
    }
    return null;
  } catch {
    return null;
  }
}

export { expect } from "@playwright/test";
