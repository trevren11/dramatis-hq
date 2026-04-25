<!-- IMPLEMENTATION_PLAN_START -->

# Implementation Plan: DRM-034 Accessibility WCAG 2.1 AA Compliance

## Overview

Implement comprehensive WCAG 2.1 AA accessibility compliance across the Dramatis-HQ platform. This includes adding the jsx-a11y ESLint plugin for compile-time checks, integrating axe-core for automated testing, fixing existing accessibility issues in UI components, and ensuring keyboard navigation, screen reader support, and proper color contrast throughout the application.

## Repositories

- **dramatis-hq**: Full accessibility implementation
  - **Branch**: `trenshaw/dramatis-hq-34`

## Detailed Plan

### Phase 1: Tooling Setup

**Complexity**: simple
**Files**: package.json, eslint.config.mjs, vitest.config.ts, playwright.config.ts

**Tasks**:

1. Add eslint-plugin-jsx-a11y to devDependencies
2. Add @axe-core/playwright for E2E accessibility tests
3. Configure jsx-a11y rules in eslint.config.mjs
4. Create accessibility test utilities

### Phase 2: Core UI Components Accessibility

**Complexity**: medium
**Files**:

- components/ui/button.tsx
- components/ui/input.tsx
- components/ui/select.tsx
- components/ui/checkbox.tsx
- components/ui/modal.tsx
- components/ui/dialog.tsx
- components/ui/dropdown-menu.tsx
- components/ui/tabs.tsx
- components/ui/toast.tsx

**Tasks**:

1. Add aria-label to icon-only buttons
2. Ensure all form inputs have associated labels
3. Add focus-visible styles for keyboard navigation
4. Implement focus trap in modals and dialogs
5. Add aria-live regions for toast notifications
6. Ensure proper role attributes on interactive elements
7. Add aria-describedby for form hints and errors

### Phase 3: Layout and Navigation Accessibility

**Complexity**: medium
**Files**:

- app/layout.tsx
- components/layout/header.tsx (if exists)
- components/layout/sidebar.tsx (if exists)
- components/layout/navigation.tsx (if exists)

**Tasks**:

1. Add skip navigation link at top of page
2. Implement proper landmark regions (main, nav, aside, footer)
3. Ensure logical heading hierarchy (h1-h6)
4. Add keyboard navigation for all menu items
5. Ensure escape key closes dropdowns/modals

### Phase 4: Form Accessibility

**Complexity**: medium
**Files**:

- components/auth/\*.tsx
- components/profile/\*.tsx
- components/shows/\*.tsx
- components/auditions/\*.tsx

**Tasks**:

1. Add visible labels (not just placeholders)
2. Implement error messages announced to screen readers
3. Add required field indicators with aria-required
4. Add autocomplete attributes where appropriate
5. Group related fields with fieldset/legend
6. Add input purpose attributes (inputmode, type)

### Phase 5: Visual Design Accessibility

**Complexity**: medium
**Files**:

- app/globals.css
- tailwind.config.ts (if exists)
- components/ui/\*.tsx

**Tasks**:

1. Audit and fix color contrast (4.5:1 for text, 3:1 for UI)
2. Ensure focus indicators are visible (not just outline: none)
3. Add prefers-reduced-motion media query support
4. Ensure text is resizable to 200% without breaking layout
5. Remove reliance on color alone for information

### Phase 6: Dynamic Content Accessibility

**Complexity**: medium
**Files**:

- components/notifications/\*.tsx
- components/messages/\*.tsx
- components/ui/toast.tsx
- components/ui/use-toast.ts

**Tasks**:

1. Add aria-live="polite" for dynamic content updates
2. Implement role="status" for toast notifications
3. Manage focus when content changes dynamically
4. Announce loading states to screen readers

### Phase 7: Automated Testing

**Complexity**: medium
**Files**:

- lib/**tests**/a11y/\*.test.ts (new)
- e2e/tests/accessibility.spec.ts (new)
- vitest.setup.ts

**Tasks**:

1. Create axe-core integration for unit tests
2. Write Playwright accessibility tests for key pages
3. Add accessibility checks to CI pipeline
4. Create test utilities for common a11y assertions

## Implementation Order

1. **Phase 1: Tooling Setup** - Foundation for catching issues during development
2. **Phase 2: Core UI Components** - Fix base components that are used everywhere
3. **Phase 3: Layout and Navigation** - Ensure overall page structure is accessible
4. **Phase 4: Form Accessibility** - Critical for user input flows
5. **Phase 5: Visual Design** - Color contrast and visual indicators
6. **Phase 6: Dynamic Content** - Screen reader announcements
7. **Phase 7: Automated Testing** - Prevent regressions

## Testing Requirements

### Unit Tests

- Create `lib/__tests__/a11y/` directory with component accessibility tests
- Test ARIA attributes are present on components
- Test keyboard interactions work correctly
- Test focus management in modals

### Integration Tests

- Test form submission flows with screen reader simulation
- Test navigation flows with keyboard only

### E2E Tests (Playwright + axe-core)

```typescript
// e2e/tests/accessibility.spec.ts
import AxeBuilder from "@axe-core/playwright";

test("homepage is accessible", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("login page is accessible", async ({ page }) => {
  await page.goto("/login");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

### Manual Testing

- Test with VoiceOver (macOS) on key user flows
- Test keyboard-only navigation through entire app
- Test at 200% and 400% zoom levels
- Verify color contrast with browser devtools

## Risks and Considerations

- **Third-party components**: Radix UI components are generally accessible but may need wrapper customization
- **Dynamic content**: Calendar and drag-drop components need special attention for screen readers
- **Color themes**: DaisyUI themes may not all meet contrast requirements - may need custom overrides
- **Performance**: Adding aria-live regions carelessly can cause excessive screen reader announcements
- **Existing code**: Large codebase may have many violations - prioritize high-traffic pages first

## Definition of Done Checklist

- [ ] eslint-plugin-jsx-a11y configured and passing
- [ ] All UI components have proper ARIA attributes
- [ ] Skip navigation link present
- [ ] Proper heading hierarchy on all pages
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] prefers-reduced-motion respected
- [ ] Automated axe-core tests passing
- [ ] Manual screen reader testing completed

<!-- IMPLEMENTATION_PLAN_END -->
