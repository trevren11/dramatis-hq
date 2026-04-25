# Implementation Plan: [DRM-036] User Settings

## Overview

Build comprehensive settings pages for users to manage account, notifications, privacy, security, and appearance settings.

## Tasks

### Task 1: Settings Layout and Navigation

**Files:** `app/(settings)/settings/layout.tsx`, `components/settings/settings-nav.tsx`

Create the settings layout with sidebar navigation:

- Settings sidebar with sections: Account, Profile, Notifications, Privacy, Security, Appearance
- Mobile-friendly collapsible navigation
- Breadcrumb support
- Active state highlighting

### Task 2: Account Settings Page

**Files:** `app/(settings)/settings/account/page.tsx`, `components/settings/account-form.tsx`

Implement account management:

- Update name form
- Update email with verification flow
- Change password form with current password validation
- Connected accounts display (Google OAuth)
- Delete account with confirmation modal

### Task 3: Profile Settings Page (Role-based)

**Files:** `app/(settings)/settings/profile/page.tsx`, `components/settings/profile-settings.tsx`

Role-based profile settings:

- Talent: visibility toggles, contact info visibility, search opt-in
- Producer: company info, logo upload, team members list
- Username change for all roles

### Task 4: Notification Preferences Page

**Files:** `app/(settings)/settings/notifications/page.tsx`, `components/settings/notification-settings.tsx`

Notification controls:

- Email notification toggles by category (messages, bookings, marketing)
- Push notification toggles (matches email categories)
- Digest frequency selector (immediate, daily, weekly)
- Do not disturb hours picker
- Marketing opt-in/out toggle

### Task 5: Privacy Settings Page

**Files:** `app/(settings)/settings/privacy/page.tsx`, `components/settings/privacy-settings.tsx`

Privacy management:

- Data export request button (GDPR compliance)
- Download all data functionality
- Activity visibility toggles
- Block list management with search
- Third-party connections list

### Task 6: Security Settings Page

**Files:** `app/(settings)/settings/security/page.tsx`, `components/settings/security-settings.tsx`

Security features:

- Two-factor authentication enable/disable
- Active sessions list with revoke capability
- Login history table (last 10 logins)
- Security notification preferences

### Task 7: Appearance Settings Page

**Files:** `app/(settings)/settings/appearance/page.tsx`, `components/settings/appearance-settings.tsx`

User preferences:

- Dark mode toggle (system/light/dark)
- Language preference dropdown
- Timezone selector
- Persist to localStorage and user settings

### Task 8: API Routes for Settings

**Files:** `app/api/settings/[...slug]/route.ts`

Create API endpoints:

- GET/PATCH /api/settings/account
- GET/PATCH /api/settings/notifications
- GET/PATCH /api/settings/privacy
- GET/PATCH /api/settings/security
- POST /api/settings/export-data
- POST /api/settings/delete-account

### Task 9: Database Schema Updates

**Files:** `prisma/schema.prisma`, migration

Add user settings model with notification and privacy JSON fields.

### Task 10: Tests

**Files:** `__tests__/settings/*.test.tsx`, `e2e/tests/settings.spec.ts`

Write tests:

- Unit tests for settings forms
- API route tests
- E2E test for settings flow

## Completion Criteria

- All settings pages accessible from user menu
- Changes persist correctly to database
- Email change sends verification email
- Password change validates current password
- Mobile responsive design
- Tests passing
