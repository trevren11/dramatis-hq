/**
 * Accessibility Testing Utilities
 *
 * Helpers for testing WCAG 2.1 AA compliance in React components.
 */
import { expect } from "vitest";
import { screen } from "@testing-library/react";

/**
 * Checks that an element has a proper accessible name.
 * Accessible names come from: aria-label, aria-labelledby, alt, title, or text content.
 */
export function expectAccessibleName(element: HTMLElement, expectedName?: string): void {
  const name =
    element.getAttribute("aria-label") ?? element.getAttribute("alt") ?? element.textContent.trim();

  if (expectedName) {
    expect(name).toBe(expectedName);
  } else {
    expect(name).toBeTruthy();
  }
}

/**
 * Checks that all images have alt text.
 */
export function expectImagesHaveAlt(container: HTMLElement | Document = document): void {
  const images = container.querySelectorAll("img");
  images.forEach((img) => {
    expect(img).toHaveAttribute("alt");
  });
}

/**
 * Checks that all form inputs have associated labels.
 */
export function expectFormInputsHaveLabels(container: HTMLElement | Document = document): void {
  const inputs = container.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    const id = input.getAttribute("id");
    const ariaLabel = input.getAttribute("aria-label");
    const ariaLabelledBy = input.getAttribute("aria-labelledby");
    const hasLabel =
      ariaLabel ?? ariaLabelledBy ?? (id && container.querySelector(`label[for="${id}"]`));
    expect(hasLabel).toBeTruthy();
  });
}

/**
 * Checks that clickable elements are keyboard accessible.
 * Non-button clickable elements should have role and tabIndex.
 */
export function expectKeyboardAccessible(element: HTMLElement): void {
  const tagName = element.tagName.toLowerCase();
  const isNativelyFocusable = ["a", "button", "input", "select", "textarea"].includes(tagName);

  if (!isNativelyFocusable) {
    const role = element.getAttribute("role");
    const tabIndex = element.getAttribute("tabindex");
    expect(role ?? tabIndex).toBeTruthy();
  }
}

/**
 * Checks that elements with onClick have keyboard handlers.
 */
export function expectClickHasKeyboard(element: HTMLElement): void {
  const hasKeyboardHandler =
    element.onkeydown !== null ||
    element.onkeyup !== null ||
    element.getAttribute("role") === "button" ||
    element.tagName.toLowerCase() === "button";

  expect(hasKeyboardHandler).toBe(true);
}

/**
 * Checks that headings follow proper hierarchy (no skipping levels).
 */
export function expectHeadingHierarchy(container: HTMLElement | Document = document): void {
  const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
  let lastLevel = 0;

  headings.forEach((heading: Element) => {
    const level = parseInt(heading.tagName.charAt(1));
    // Can only skip down one level at a time
    expect(level).toBeLessThanOrEqual(lastLevel + 1);
    lastLevel = level;
  });
}

/**
 * Checks that ARIA live regions are properly configured.
 */
export function expectAriaLive(
  element: HTMLElement,
  politeness: "polite" | "assertive" = "polite"
): void {
  const ariaLive = element.getAttribute("aria-live");
  const role = element.getAttribute("role");

  // aria-live or role="status" / role="alert" are acceptable
  const hasLiveRegion =
    ariaLive === politeness ||
    (politeness === "polite" && role === "status") ||
    (politeness === "assertive" && role === "alert");

  expect(hasLiveRegion).toBe(true);
}

/**
 * Checks that a modal/dialog has proper focus management.
 */
export function expectDialogAccessible(dialog: HTMLElement): void {
  // Should have dialog role
  expect(dialog).toHaveAttribute("role", "dialog");
  // Should have accessible name
  const ariaLabel = dialog.getAttribute("aria-label");
  const ariaLabelledBy = dialog.getAttribute("aria-labelledby");
  expect(ariaLabel ?? ariaLabelledBy).toBeTruthy();
  // Should be modal
  expect(dialog.getAttribute("aria-modal")).toBe("true");
}

/**
 * Checks that error messages are associated with form fields.
 */
export function expectErrorAccessible(input: HTMLElement, errorId: string): void {
  const describedBy = input.getAttribute("aria-describedby");
  expect(describedBy).toContain(errorId);
  expect(input.getAttribute("aria-invalid")).toBe("true");
}

/**
 * Common accessibility assertions for buttons.
 */
export function expectButtonAccessible(button: HTMLElement): void {
  // Should be focusable
  expect(button.tabIndex).toBeGreaterThanOrEqual(0);

  // Icon-only buttons need accessible name
  const hasVisibleText = button.textContent.trim().length > 0;
  const hasIcon = button.querySelector("svg") !== null;

  if (hasIcon && !hasVisibleText) {
    const ariaLabel = button.getAttribute("aria-label");
    const ariaLabelledBy = button.getAttribute("aria-labelledby");
    expect(ariaLabel ?? ariaLabelledBy).toBeTruthy();
  }
}

/**
 * Checks that skip navigation link exists and is properly configured.
 */
export function expectSkipLink(): void {
  const skipLink = screen.queryByRole("link", { name: /skip to/i });
  expect(skipLink).toBeInTheDocument();
  expect(skipLink).toHaveAttribute("href", expect.stringMatching(/^#/));
}
