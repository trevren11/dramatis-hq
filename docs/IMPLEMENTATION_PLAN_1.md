<!-- IMPLEMENTATION_PLAN_START -->

# Implementation Plan: [DRM-015] Show Management

## Overview

Enable producers to create and manage theatrical productions/shows with role definitions, show dashboards, and production lifecycle management. This builds on the existing producer profile system to add show/production CRUD functionality.

## Repositories

- **dramatis-hq**: All changes in single repository
  - **Branch**: `dramatis-hq-15`

## Detailed Plan

### Task 1: Database Schema for Shows and Roles

**Complexity**: medium
**Files**: lib/db/schema/shows.ts, lib/db/schema/roles.ts, lib/db/schema/index.ts

**Task**:
Create Drizzle ORM schemas for shows and roles:

**shows table:**

- id (uuid, primary key)
- organizationId (uuid, references producer_profiles)
- title (varchar 255, required)
- type (enum: musical, play, opera, dance, concert, other)
- description (text)
- venue (varchar 255)
- rehearsalStart (timestamp)
- performanceStart (timestamp)
- performanceEnd (timestamp)
- unionStatus (reuse unionStatusEnum from producer-profiles)
- status (enum: planning, auditions, rehearsal, running, closed)
- isPublic (boolean, default true)
- createdAt, updatedAt (timestamps)

**roles table:**

- id (uuid, primary key)
- showId (uuid, references shows, cascade delete)
- name (varchar 255, required)
- description (text)
- type (enum: lead, supporting, ensemble, understudy, swing)
- ageRangeMin, ageRangeMax (integer)
- vocalRange (varchar 100)
- notes (text)
- positionCount (integer, default 1)
- sortOrder (integer)
- createdAt, updatedAt (timestamps)

Add indexes on showId, organizationId, status, and isPublic.

### Task 2: Zod Validation Schemas

**Complexity**: simple
**Files**: lib/validations/shows.ts

**Task**:
Create validation schemas following the pattern in lib/validations/company.ts:

- showCreateSchema (all required fields)
- showUpdateSchema (partial, for edits)
- roleCreateSchema
- roleUpdateSchema
- roleBulkCreateSchema (for adding multiple roles)
- roleBulkUpdateSchema (for reordering)

Include proper constraints matching the database schema (max lengths, enum values).

### Task 3: Show API Routes

**Complexity**: medium
**Files**: app/api/shows/route.ts, app/api/shows/[id]/route.ts, app/api/shows/[id]/duplicate/route.ts

**Task**:
Create RESTful API endpoints:

**GET /api/shows** - List shows for current producer

- Filter by status (query param)
- Search by title (query param)
- Pagination support

**POST /api/shows** - Create new show

- Validate with showCreateSchema
- Set organizationId from authenticated user's producer profile

**GET /api/shows/[id]** - Get show details

- Include roles in response

**PUT /api/shows/[id]** - Update show

- Validate ownership

**DELETE /api/shows/[id]** - Delete show (soft delete or hard with confirmation)

**POST /api/shows/[id]/duplicate** - Duplicate show

- Copy show and all roles
- Reset status to "planning"
- Append "(Copy)" to title

### Task 4: Role API Routes

**Complexity**: medium
**Files**: app/api/shows/[id]/roles/route.ts, app/api/shows/[id]/roles/[roleId]/route.ts, app/api/shows/[id]/roles/reorder/route.ts

**Task**:
Create role management endpoints:

**GET /api/shows/[id]/roles** - List roles for a show

**POST /api/shows/[id]/roles** - Add role to show

**PUT /api/shows/[id]/roles/[roleId]** - Update role

**DELETE /api/shows/[id]/roles/[roleId]** - Delete role

**PUT /api/shows/[id]/roles/reorder** - Bulk update sortOrder for drag-and-drop

### Task 5: Show List Page

**Complexity**: medium
**Files**: app/(dashboard)/producer/shows/page.tsx, components/shows/ShowList.tsx, components/shows/ShowCard.tsx

**Task**:
Create the show list view:

- Grid/list of ShowCard components
- Status filter tabs (All, Planning, Auditions, Rehearsal, Running, Closed)
- Search input for title filtering
- "New Production" button
- Empty state when no shows

ShowCard should display:

- Title and type
- Status badge (color-coded)
- Key dates (next upcoming date)
- Quick stats (open roles / total roles)
- Actions dropdown (Edit, Duplicate, Delete)

### Task 6: Show Creation Wizard

**Complexity**: complex
**Files**: app/(dashboard)/producer/shows/new/page.tsx, components/shows/CreateShowWizard.tsx, components/shows/wizard-steps/

**Task**:
Create multi-step wizard following SetupWizard pattern:

**Step 1: Basic Info**

- Title (required)
- Show type dropdown
- Description textarea

**Step 2: Dates & Venue**

- Venue input
- Rehearsal start date picker
- Performance start/end date range picker

**Step 3: Settings**

- Union status (reuse component from company setup)
- Visibility toggle (public/private)

**Step 4: Review**

- Summary of all fields
- Submit button

Wizard steps in: components/shows/wizard-steps/

- basic-info-step.tsx
- dates-venue-step.tsx
- settings-step.tsx
- review-step.tsx

### Task 7: Show Detail/Edit Page

**Complexity**: medium
**Files**: app/(dashboard)/producer/shows/[id]/page.tsx, components/shows/ShowDashboard.tsx, components/shows/ShowSettings.tsx

**Task**:
Create show detail page with tabs:

**Overview Tab (ShowDashboard)**:

- Show header with title, type, status badge
- Key dates section
- Cast progress (X/Y roles filled - placeholder for future casting)
- Quick actions: Edit Show, Add Role, View Auditions (future)

**Roles Tab**:

- Use RoleList component from Task 8

**Settings Tab (ShowSettings)**:

- Edit all show fields (inline or modal)
- Delete show with confirmation dialog
- Duplicate show button

### Task 8: Role Management Components

**Complexity**: complex
**Files**: components/shows/RoleList.tsx, components/shows/RoleCard.tsx, components/shows/RoleForm.tsx, components/shows/RoleFormDialog.tsx

**Task**:
Create role management UI:

**RoleList**:

- Drag-and-drop sortable list (use @dnd-kit/sortable or similar)
- "Add Role" button at bottom
- Empty state

**RoleCard**:

- Role name, type badge
- Character details (age range, vocal range)
- Position count indicator
- Edit/Delete actions

**RoleForm**:

- Name input (required)
- Role type select (Lead, Supporting, Ensemble, Understudy, Swing)
- Description textarea
- Age range inputs (min/max)
- Vocal range input
- Notes textarea
- Position count number input

**RoleFormDialog**:

- Modal wrapper for RoleForm
- Create/Edit modes

### Task 9: Tests

**Complexity**: medium
**Files**: lib/validations/**tests**/shows.test.ts, components/shows/**tests**/

**Task**:
Write tests following existing patterns:

**Validation tests** (lib/validations/**tests**/shows.test.ts):

- showCreateSchema validation
- showUpdateSchema partial updates
- roleCreateSchema validation
- Edge cases (empty strings, invalid dates, etc.)

**Component tests** (if time permits):

- ShowCard renders correctly
- RoleForm validation
- Wizard navigation

## Implementation Order

1. **Database Schema (Task 1)** - Foundation for all other tasks
2. **Validations (Task 2)** - Required by API routes
3. **Show API (Task 3)** - Core CRUD endpoints
4. **Role API (Task 4)** - Depends on show API
5. **Show List Page (Task 5)** - First visible UI
6. **Show Creation Wizard (Task 6)** - Create flow
7. **Show Detail Page (Task 7)** - View/edit existing
8. **Role Management (Task 8)** - Complete the feature
9. **Tests (Task 9)** - Validate implementation

## Testing Requirements

### Unit Tests

- **Validations**: Test all schema validations in lib/validations/**tests**/shows.test.ts
- **Coverage**: Aim for 80%+ on validation schemas

### Integration Tests

- API route tests using existing patterns (if test utils available)

### Manual Testing

1. Create a new show with all fields
2. Edit show details
3. Add multiple roles with drag-and-drop reorder
4. Delete a role
5. Duplicate a show
6. Filter shows by status
7. Search shows by title
8. Delete a show
9. Verify public/private visibility

## Risks and Considerations

- **Drag-and-drop library**: Need to choose and install a DnD library (@dnd-kit recommended for React 18+)
- **Date handling**: Ensure consistent timezone handling for performance dates
- **Cascade deletes**: Deleting a show should delete all roles (handled by DB cascade)
- **Producer profile required**: User must have producer profile before creating shows
- **Future integration**: Leave room for casting/auditions integration (keep role model flexible)

<!-- IMPLEMENTATION_PLAN_END -->
