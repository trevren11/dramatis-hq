<!-- IMPLEMENTATION_PLAN_START -->

# Implementation Plan: Mobile Optimization - Responsive Design and Touch UX

## Overview

Implement comprehensive mobile optimization for Dramatis-HQ including responsive layouts for all screen sizes (320px+), touch-friendly interactions, PWA capabilities, and mobile-specific performance optimizations. The app already has basic responsive patterns in place; this plan extends them to full mobile-first coverage.

## Repositories

- **dramatis-hq**: All changes in the main repository
  - **Branch**: `trenshaw/dramatis-hq-35`

## Detailed Plan

### Phase 1: PWA Foundation

**Complexity**: medium
**Branch**: `trenshaw/dramatis-hq-35`
**Files**: public/manifest.json (new), public/icons/ (new), app/layout.tsx, public/sw.js

**Task**:
Create PWA manifest and enhance service worker for installability:

1. Create `public/manifest.json`:

```json
{
  "name": "Dramatis-HQ",
  "short_name": "Dramatis",
  "description": "Casting and production management platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#faf9fb",
  "theme_color": "#7c3aed",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "/icons/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

2. Generate PWA icons (192x192, 512x512, maskable) in `public/icons/`

3. Update `app/layout.tsx` metadata to include manifest link and theme-color meta

4. Enhance `public/sw.js` with offline caching strategy for static assets

### Phase 2: Mobile Navigation Components

**Complexity**: medium
**Files**: components/ui/bottom-nav.tsx (new), components/layout/mobile-nav.tsx (new), components/layout/dashboard-layout.tsx, app/(dashboard)/layout.tsx

**Task**:
Create mobile-specific navigation patterns:

1. Create `components/ui/bottom-nav.tsx` - bottom tab navigation for mobile:
   - Fixed bottom position, 56px height
   - 5 main tabs: Home, Auditions, Calendar, Messages, Profile
   - Active state indicator
   - Safe area inset padding for notched devices
   - Hide when keyboard is open (use visualViewport API)

2. Create `components/layout/mobile-nav.tsx` - hamburger menu improvements:
   - Full-screen slide-out on mobile
   - Swipe-to-close gesture
   - Close on route change

3. Update `app/(dashboard)/layout.tsx`:
   - Show bottom nav on mobile (<768px), sidebar on desktop
   - Adjust main content padding for bottom nav

### Phase 3: Touch Interactions & Gestures

**Complexity**: complex
**Files**: components/ui/swipeable.tsx (new), components/ui/pull-to-refresh.tsx (new), components/messages/MessageRow.tsx, components/notifications/NotificationItem.tsx, lib/hooks/use-swipe.ts (new), lib/hooks/use-pull-refresh.ts (new)

**Task**:
Implement touch gesture support:

1. Create `lib/hooks/use-swipe.ts`:
   - Detect horizontal swipe gestures
   - Configure threshold, velocity detection
   - Support for swipe-to-reveal actions

2. Create `components/ui/swipeable.tsx`:
   - Wrapper component for swipeable list items
   - Left/right action slots
   - Snap-back animation
   - Accessibility: ensure keyboard alternatives exist

3. Create `lib/hooks/use-pull-refresh.ts`:
   - Pull-to-refresh gesture detection
   - Integration with React Query refetch
   - Visual indicator animation

4. Create `components/ui/pull-to-refresh.tsx`:
   - Spinner indicator at top
   - Elastic pull animation
   - Loading state during refresh

5. Update `components/messages/MessageRow.tsx`:
   - Add swipe-to-archive action
   - Long-press context menu (delete, mark read/unread)

### Phase 4: Touch Target & Form Optimization

**Complexity**: medium
**Files**: app/globals.css, components/ui/button.tsx, components/ui/input.tsx, components/ui/select.tsx, components/calendar/CalendarEventForm.tsx, components/auditions/AuditionApplicationForm.tsx

**Task**:
Ensure all interactive elements meet 44px minimum tap target:

1. Update `app/globals.css`:
   - Add mobile-first base styles
   - Ensure minimum touch target size (44x44px) for interactive elements
   - Add `touch-action: manipulation` to prevent zoom delays

2. Update form components for mobile:
   - `components/ui/input.tsx`: Add `inputmode` variants (numeric, email, tel, url)
   - `components/ui/select.tsx`: Larger touch targets, better mobile dropdown
   - Add appropriate `autocomplete` attributes

3. Update `components/calendar/CalendarEventForm.tsx`:
   - Use native date/time pickers on mobile
   - Sticky submit button at bottom
   - Progress indicator for multi-step forms

4. Update form layouts:
   - Full-width inputs on mobile
   - Larger vertical spacing
   - Floating labels option

### Phase 5: Responsive Layout Refinements

**Complexity**: medium
**Files**: app/globals.css, components/casting/CastingBoard.tsx, components/calendar/TalentCalendar.tsx, components/talent-search/TalentSearchFilters.tsx, components/video/video-player.tsx

**Task**:
Ensure all pages work from 320px width with no horizontal scroll:

1. Update `app/globals.css`:
   - Fluid typography using clamp()
   - Add `--container-padding` CSS variable for consistent mobile padding
   - Prevent horizontal overflow

2. Update `components/casting/CastingBoard.tsx`:
   - Stack roles vertically on mobile
   - Horizontal scroll for talent cards within each role
   - Touch-friendly drag handles

3. Update `components/calendar/TalentCalendar.tsx`:
   - Day view default on mobile
   - Swipe between days
   - Touch-friendly event interactions

4. Update `components/talent-search/TalentSearchFilters.tsx`:
   - Collapsible filter panel on mobile
   - Bottom sheet filter UI option

5. Update `components/video/video-player.tsx`:
   - Mobile-optimized controls (larger buttons)
   - Fullscreen support
   - Gesture controls (double-tap to seek)

### Phase 6: Performance Optimizations

**Complexity**: medium
**Files**: components/ui/skeleton.tsx, components/ui/image.tsx (new), lib/hooks/use-reduced-motion.ts (new), components/ui/offline-indicator.tsx (new)

**Task**:
Optimize performance for mobile networks:

1. Create `components/ui/image.tsx`:
   - Wrapper around next/image with responsive srcset
   - Lazy loading with blur placeholder
   - WebP/AVIF format support via Next.js

2. Add skeleton loading states:
   - Audit existing components
   - Add Skeleton variants to `components/ui/skeleton.tsx`
   - Use in data-fetching components

3. Create `lib/hooks/use-reduced-motion.ts`:
   - Detect `prefers-reduced-motion`
   - Disable animations when enabled

4. Create `components/ui/offline-indicator.tsx`:
   - Banner when offline detected
   - Use navigator.onLine + online/offline events

### Phase 7: Testing & Verification

**Complexity**: simple
**Files**: e2e/tests/mobile.spec.ts (new), playwright.config.ts

**Task**:
Add mobile-specific tests:

1. Update `playwright.config.ts`:
   - Add mobile viewport projects (iPhone SE, iPhone 14, iPad)

2. Create `e2e/tests/mobile.spec.ts`:
   - Test responsive breakpoints
   - Test touch interactions (where feasible in Playwright)
   - Test PWA manifest validity
   - Test offline behavior
   - Test no horizontal scroll at 320px

## Implementation Order

1. **Phase 1: PWA Foundation** - Creates installability foundation, service worker caching
2. **Phase 2: Mobile Navigation** - Critical UX improvement, enables proper mobile navigation patterns
3. **Phase 4: Touch Target & Forms** - Quick wins for mobile usability
4. **Phase 5: Responsive Layouts** - Ensures all content accessible on mobile
5. **Phase 3: Touch Gestures** - Advanced interactions (can be partially deferred)
6. **Phase 6: Performance** - Polish and optimization
7. **Phase 7: Testing** - Verify all changes work correctly

## Testing Requirements

### Unit Tests

- **lib/hooks/**: Test gesture detection hooks with mocked touch events
- **components/ui/**: Test swipeable component state transitions

### Integration Tests

- Test bottom nav route transitions
- Test pull-to-refresh with React Query
- Test offline indicator state changes

### E2E Tests (Playwright)

- Mobile viewport rendering at 320px, 375px, 768px
- PWA installability check
- Form submission on mobile
- Navigation flow on mobile

### Manual Testing

- Test on real iOS device (Safari)
- Test on real Android device (Chrome)
- Test tablet layouts (iPad)
- Test PWA install and offline functionality
- Test touch gestures feel natural
- Test 3G network performance (Chrome DevTools throttling)

## Risks and Considerations

- **Touch gesture conflicts**: dnd-kit already uses touch sensors; ensure swipe gestures don't interfere with drag-and-drop. May need to disable swipe in areas with drag-drop.
- **iOS Safari quirks**: Test carefully for 100vh issues, safe area insets, and PWA behavior
- **FullCalendar mobile**: The FullCalendar library may need custom mobile styling; check their docs for mobile-specific options
- **Service worker caching**: Be careful not to cache API responses inappropriately; focus on static assets
- **Reduced motion**: Ensure all animated features respect user preference

<!-- IMPLEMENTATION_PLAN_END -->
