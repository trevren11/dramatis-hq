<!-- IMPLEMENTATION_PLAN_START -->

# Implementation Plan: DRM-017 Audition Announcements

## Overview

Build a complete audition announcement system enabling producers to create, publish, and manage auditions. Talent can discover, filter, and apply to auditions with their profile materials. This feature requires new database tables, API routes, and both public and authenticated UI components.

## Repository

- **dramatis-hq**: Full-stack Next.js application
  - **Branch**: `trenshaw/dramatis-hq-17`

## Detailed Plan

### Phase 1: Database Schema

**Complexity**: medium
**Files**: lib/db/schema/auditions.ts, lib/db/schema/index.ts

**Task**:
Create three new tables following existing patterns from shows.ts and roles.ts:

1. **auditions table**
   - id, showId, organizationId (foreign keys)
   - title, description, slug (unique)
   - location, isVirtual (boolean)
   - auditionDates (jsonb array of date/time objects)
   - submissionDeadline (timestamp)
   - requirements (jsonb - union status, age range, gender, etc.)
   - materials (jsonb - what applicants must submit)
   - visibility enum: 'public' | 'private' | 'unlisted'
   - publishAt (timestamp, nullable for immediate)
   - status enum: 'draft' | 'open' | 'closed' | 'cancelled'
   - createdAt, updatedAt

2. **audition_roles junction table**
   - auditionId, roleId (composite primary key)
   - Links auditions to specific roles being cast

3. **audition_applications table**
   - id, auditionId, talentProfileId
   - status enum: 'submitted' | 'reviewed' | 'callback' | 'rejected' | 'cast'
   - materials (jsonb - uploaded files/links)
   - notes (text - producer notes)
   - submittedAt, reviewedAt (timestamps)

Add indexes on: auditionId, talentProfileId, status, slug, publishAt, submissionDeadline

---

### Phase 2: Validation Schemas

**Complexity**: simple
**Files**: lib/validations/auditions.ts

**Task**:
Create Zod schemas following patterns from shows.ts:

- auditionCreateSchema (for creating new auditions)
- auditionUpdateSchema (for editing)
- auditionSearchSchema (for filtering/browse)
- applicationSubmitSchema (for talent applications)

Validate: required fields, date ordering (deadline before audition dates), slug format, materials structure.

---

### Phase 3: API Routes - Producer Side

**Complexity**: medium
**Files**:

- app/api/auditions/route.ts (GET list, POST create)
- app/api/auditions/[id]/route.ts (GET, PUT, DELETE)
- app/api/auditions/[id]/applications/route.ts (GET applications)
- app/api/auditions/[id]/applications/[applicationId]/route.ts (PUT update status)

**Task**:
Following patterns from app/api/shows/route.ts:

1. **GET /api/auditions** - List producer's auditions with filters (status, showId)
2. **POST /api/auditions** - Create new audition (requires producer profile)
3. **GET /api/auditions/[id]** - Get audition details (producer view with applications)
4. **PUT /api/auditions/[id]** - Update audition
5. **DELETE /api/auditions/[id]** - Cancel/delete audition
6. **GET /api/auditions/[id]/applications** - List applications with pagination
7. **PUT /api/auditions/[id]/applications/[applicationId]** - Update application status

All routes verify producer owns the audition's organization.

---

### Phase 4: API Routes - Public/Talent Side

**Complexity**: medium
**Files**:

- app/api/auditions/browse/route.ts (public browse)
- app/api/auditions/[slug]/public/route.ts (public audition page)
- app/api/auditions/[id]/apply/route.ts (submit application)
- app/api/talent/applications/route.ts (talent's applications)

**Task**:

1. **GET /api/auditions/browse** - Public listing with filters:
   - location (with "near me" geocoding)
   - dateRange
   - unionStatus
   - roleType
   - search (title, company name)
   - Pagination, only shows published & open auditions

2. **GET /api/auditions/[slug]/public** - Public audition detail page
   - Returns audition + show + organization info
   - No auth required, but checks visibility

3. **POST /api/auditions/[id]/apply** - Submit application
   - Requires talent profile
   - Validates materials against audition requirements
   - Checks deadline not passed
   - Prevents duplicate applications

4. **GET /api/talent/applications** - Talent's submitted applications
   - Status tracking across all applications

---

### Phase 5: Producer UI Components

**Complexity**: complex
**Files**:

- components/auditions/AuditionList.tsx
- components/auditions/AuditionCard.tsx
- components/auditions/CreateAuditionWizard.tsx
- components/auditions/AuditionSettings.tsx
- components/auditions/ApplicationList.tsx
- components/auditions/ApplicationCard.tsx
- components/auditions/ApplicationReviewDialog.tsx
- components/auditions/wizard-steps/ (4-5 step components)
- components/auditions/index.ts

**Task**:
Following patterns from components/shows/:

1. **AuditionList** - List view with filters, status badges, action menu
2. **AuditionCard** - Summary card showing key details, applicant count
3. **CreateAuditionWizard** - Multi-step form:
   - Step 1: Select show, title, description
   - Step 2: Dates, times, location
   - Step 3: Select roles, requirements
   - Step 4: Materials needed, instructions
   - Step 5: Visibility, publish date, deadline
4. **AuditionSettings** - Edit existing audition
5. **ApplicationList** - Table/list of applications with sorting
6. **ApplicationCard** - Application summary with talent info
7. **ApplicationReviewDialog** - Review materials, update status, add notes

---

### Phase 6: Public Audition Pages

**Complexity**: medium
**Files**:

- app/auditions/page.tsx (browse page)
- app/auditions/[slug]/page.tsx (detail page)
- components/auditions/AuditionBrowse.tsx
- components/auditions/AuditionFilters.tsx
- components/auditions/AuditionPublicCard.tsx
- components/auditions/AuditionDetail.tsx

**Task**:

1. **Browse Page** (/auditions)
   - Filter sidebar: location, date, union, role type
   - Search bar
   - Grid/list toggle
   - Pagination
   - Save/bookmark functionality

2. **Detail Page** (/auditions/[slug])
   - Audition info, dates, location
   - Roles being cast with descriptions
   - Requirements and materials needed
   - Company sidebar with logo, about
   - Apply button (or login prompt)
   - Share buttons

---

### Phase 7: Talent Application Flow

**Complexity**: medium
**Files**:

- components/auditions/ApplyDialog.tsx
- components/auditions/ApplicationForm.tsx
- components/auditions/ApplicationStatus.tsx
- app/(dashboard)/talent/applications/page.tsx

**Task**:

1. **ApplyDialog** - Modal opened from audition detail:
   - Shows current profile completeness
   - Validates required materials are available
   - Upload additional materials if needed
   - Fill custom questions
   - Review before submit

2. **ApplicationForm** - Main form component:
   - Auto-fills from talent profile (headshot, resume)
   - Dynamic fields based on audition requirements
   - File upload for requested materials
   - Confirm submission

3. **ApplicationStatus** - Status display component:
   - Badge for current status
   - Timeline of status changes
   - Any producer notes shared

4. **Talent Applications Page** - Dashboard view:
   - List all applications
   - Filter by status
   - Quick view of audition details
   - Status tracking

---

### Phase 8: Dashboard Integration

**Complexity**: simple
**Files**:

- app/(dashboard)/producer/auditions/page.tsx
- app/(dashboard)/producer/auditions/[id]/page.tsx
- app/(dashboard)/producer/auditions/create/page.tsx
- components/layout/ProducerNav.tsx (add auditions link)

**Task**:

1. Add "Auditions" section to producer dashboard navigation
2. Create page routes for audition management:
   - /producer/auditions - List all auditions
   - /producer/auditions/create - Create wizard
   - /producer/auditions/[id] - Manage specific audition & applications

---

## Implementation Order

1. **Database Schema** - Foundation for all other work
2. **Validation Schemas** - Needed by API routes
3. **API Routes (Producer)** - Core CRUD operations
4. **API Routes (Public/Talent)** - Browse and apply functionality
5. **Producer UI Components** - Create and manage auditions
6. **Public Pages** - Browse and detail pages
7. **Talent Application Flow** - Apply and track
8. **Dashboard Integration** - Wire everything together

## Testing Requirements

### Unit Tests

- **lib/**tests**/auditions/**: Test validation schemas, slug generation
- **lib/**tests**/auditions/deadline.test.ts**: Deadline enforcement logic

### Integration Tests

- API route tests for all endpoints
- Auth/permission tests (producer owns audition, talent can apply)
- Deadline enforcement (can't apply after deadline)
- Visibility rules (private vs public)

### E2E Tests (Playwright)

- Producer creates audition flow
- Talent browses and applies flow
- Producer reviews applications flow
- Application status updates

### Manual Testing

- Create audition with all fields
- Verify public page displays correctly
- Test all filter combinations on browse
- Submit application with various materials
- Review application and change status

## Risks and Considerations

- **Slug uniqueness**: Generate slugs from title, handle conflicts with suffix
- **Geocoding for "near me"**: May need external API (Google Places) for location filtering
- **File uploads**: Reuse existing upload infrastructure from documents/headshots
- **Deadline timezone**: Store in UTC, display in user's timezone
- **Partial profiles**: Talent may not have all required materials - show completion prompts
- **Concurrent applications**: Handle race conditions in application submission
- **SEO**: Public audition pages should have proper meta tags for discoverability

<!-- IMPLEMENTATION_PLAN_END -->
