<!-- IMPLEMENTATION_PLAN_START -->

# Implementation Plan: DRM-018 Audition Form Builder

## Overview

Build a drag-and-drop form builder for producers to create custom audition forms with various field types, plus QR code check-in functionality for audition day. Includes pre-built question library, auto-fill from talent profiles, and real-time check-in queue management.

## Repository

- **dramatis-hq**: Full-stack Next.js application
  - **Branch**: `trenshaw/dramatis-hq-18`

## Detailed Plan

### Phase 1: Database Schema

**Complexity**: simple
**Files**: lib/db/schema/auditions.ts (extend), lib/db/schema/index.ts

**Task**:
Add two new tables to the existing auditions schema:

1. **audition_forms table**
   - id (uuid, primary key)
   - auditionId (uuid, foreign key to auditions)
   - fields (jsonb - array of FormField objects)
   - createdAt, updatedAt

2. **audition_form_responses table**
   - id (uuid, primary key)
   - auditionId (uuid, foreign key to auditions)
   - talentProfileId (uuid, foreign key to talent_profiles)
   - responses (jsonb - key-value pairs matching form fields)
   - checkedInAt (timestamp)
   - queueNumber (integer)
   - status enum: 'checked_in' | 'in_room' | 'completed'
   - createdAt

Add TypeScript interfaces for FormField schema:

```typescript
interface FormField {
  id: string;
  type: "text" | "textarea" | "select" | "multiselect" | "boolean" | "date" | "file";
  label: string;
  required: boolean;
  options?: string[]; // for select/multiselect
  profileMapping?: string; // auto-fill from profile field
  placeholder?: string;
}
```

---

### Phase 2: Validation Schemas

**Complexity**: simple
**Files**: lib/validations/form-builder.ts

**Task**:
Create Zod schemas:

- formFieldSchema (validate individual field structure)
- formBuilderSchema (validate full form with fields array)
- formResponseSchema (validate talent form submissions)
- checkInUpdateSchema (validate queue status updates)

---

### Phase 3: Pre-built Questions Library

**Complexity**: simple
**Files**: lib/form-builder/prebuilt-questions.ts

**Task**:
Create a library of common audition questions:

```typescript
export const PREBUILT_QUESTIONS: FormField[] = [
  { id: "age_18", type: "boolean", label: "Are you 18 or older?", required: true },
  {
    id: "work_auth",
    type: "boolean",
    label: "Are you legally authorized to work in the US?",
    required: true,
  },
  {
    id: "transportation",
    type: "boolean",
    label: "Do you have reliable transportation?",
    required: true,
  },
  {
    id: "conflicts",
    type: "textarea",
    label: "Any conflicts during production dates?",
    required: false,
  },
  {
    id: "referral",
    type: "select",
    label: "How did you hear about this audition?",
    required: false,
    options: ["Social Media", "Website", "Friend", "Agent", "Other"],
  },
];
```

Include profile field mappings for auto-fill:

```typescript
export const PROFILE_MAPPINGS = {
  name: "talentProfile.name",
  email: "user.email",
  unionStatus: "talentProfile.unionStatus",
  skills: "talentProfile.skills",
  // etc.
};
```

---

### Phase 4: API Routes - Form Builder

**Complexity**: medium
**Files**:

- app/api/auditions/[id]/form/route.ts (GET, PUT)
- app/api/auditions/[id]/form/preview/route.ts (GET)

**Task**:

1. **GET /api/auditions/[id]/form** - Get form for audition (producer only)
2. **PUT /api/auditions/[id]/form** - Save form fields (producer only)
3. **GET /api/auditions/[id]/form/preview** - Preview form (for producer testing)

Verify producer owns audition before allowing edits.

---

### Phase 5: API Routes - Check-in System

**Complexity**: medium
**Files**:

- app/api/auditions/[id]/checkin/route.ts (POST - submit form/check in)
- app/api/auditions/[id]/checkin/queue/route.ts (GET - real-time queue)
- app/api/auditions/[id]/checkin/[responseId]/route.ts (PUT - update status)
- app/api/auditions/[id]/qr/route.ts (GET - generate QR code)

**Task**:

1. **POST /api/auditions/[id]/checkin** - Submit form and check in
   - Validate form responses against form schema
   - Auto-fill from profile where mapped
   - Assign queue number (max + 1)
   - Create form_response record

2. **GET /api/auditions/[id]/checkin/queue** - Get check-in queue
   - Return all checked-in talent with status
   - Support real-time polling or SSE

3. **PUT /api/auditions/[id]/checkin/[responseId]** - Update check-in status
   - Change status: checked_in → in_room → completed
   - Allow reordering queue

4. **GET /api/auditions/[id]/qr** - Generate QR code
   - Return QR code data URL or SVG
   - QR links to /auditions/[slug]/checkin

---

### Phase 6: Form Builder UI Components

**Complexity**: complex
**Files**:

- components/form-builder/FormBuilder.tsx (main drag-drop canvas)
- components/form-builder/FieldPalette.tsx (available field types)
- components/form-builder/FieldEditor.tsx (configure selected field)
- components/form-builder/FieldPreview.tsx (render field in form)
- components/form-builder/PrebuiltQuestions.tsx (insert from library)
- components/form-builder/FormPreview.tsx (full form preview)
- components/form-builder/index.ts

**Task**:
Install @dnd-kit for drag-and-drop:

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

1. **FormBuilder** - Main component with:
   - DndContext for drag-drop
   - Left sidebar: FieldPalette with draggable field types
   - Center: SortableContext with current form fields
   - Right sidebar: FieldEditor for selected field

2. **FieldPalette** - Draggable cards for each field type:
   - Text, Textarea, Select, Multi-select, Yes/No, Date, File Upload
   - Drag to canvas to add

3. **FieldEditor** - Edit selected field:
   - Label, placeholder, required toggle
   - Options for select/multiselect
   - Profile mapping dropdown

4. **PrebuiltQuestions** - Modal to insert pre-built questions

5. **FormPreview** - Full preview of form as talent would see it

---

### Phase 7: Check-in UI Components

**Complexity**: medium
**Files**:

- components/checkin/QRCodeDisplay.tsx
- components/checkin/CheckinForm.tsx
- components/checkin/CheckinQueue.tsx
- components/checkin/CheckinCard.tsx
- components/checkin/QueueNumber.tsx
- components/checkin/index.ts

**Task**:

1. **QRCodeDisplay** - Show QR code for audition
   - Uses qrcode.react (already installed)
   - Download/print options

2. **CheckinForm** - Dynamic form for talent
   - Render fields based on form schema
   - Auto-fill from profile
   - Submit handler

3. **CheckinQueue** - Real-time queue for producer
   - List of checked-in talent
   - Drag to reorder
   - Status badges
   - Mark as in_room/completed

4. **QueueNumber** - Display queue number to talent after check-in

---

### Phase 8: Public Check-in Pages

**Complexity**: medium
**Files**:

- app/auditions/[slug]/checkin/page.tsx
- app/auditions/[slug]/checkin/success/page.tsx

**Task**:

1. **Check-in Page** (/auditions/[slug]/checkin)
   - If logged in: Pre-fill form, show profile data
   - If not logged in: Prompt to create account or continue as guest
   - Submit form = checked in
   - Redirect to success page

2. **Success Page** (/auditions/[slug]/checkin/success)
   - Show queue number prominently
   - "You are #X in line"
   - Estimated wait time (optional)

---

### Phase 9: Producer Dashboard Integration

**Complexity**: simple
**Files**:

- app/(dashboard)/producer/auditions/[id]/form/page.tsx
- app/(dashboard)/producer/auditions/[id]/checkin/page.tsx

**Task**:

1. **Form Builder Page** (/producer/auditions/[id]/form)
   - Full form builder interface
   - Save/preview buttons
   - Link to copy check-in URL

2. **Check-in Management Page** (/producer/auditions/[id]/checkin)
   - QR code display
   - Real-time check-in queue
   - Controls for managing queue

---

## Implementation Order

1. **Database Schema** - Foundation for forms and check-ins
2. **Validation Schemas** - Required for API routes
3. **Pre-built Questions** - Utility for form builder
4. **API Routes (Form Builder)** - CRUD for forms
5. **API Routes (Check-in)** - Check-in flow and queue
6. **Form Builder UI** - Producer creates forms
7. **Check-in UI** - Talent check-in flow
8. **Public Pages** - QR-accessible check-in
9. **Dashboard Integration** - Wire into producer dashboard

## Testing Requirements

### Unit Tests

- **lib/**tests**/form-builder/**: Validation schemas, field parsing
- **lib/**tests**/form-builder/prebuilt.test.ts**: Pre-built questions structure

### Integration Tests

- Form save/load roundtrip
- Check-in flow with queue number assignment
- Profile auto-fill mapping

### E2E Tests (Playwright)

- Producer builds form with drag-drop
- Talent scans QR and completes check-in
- Producer manages check-in queue

### Manual Testing

- Create form with all field types
- Test drag-and-drop reordering
- QR code scans correctly on mobile
- Real-time queue updates

## Risks and Considerations

- **Drag-drop complexity**: @dnd-kit has learning curve; start simple
- **Real-time queue**: Consider polling vs SSE/WebSocket for updates
- **Mobile QR scanning**: Ensure check-in page is mobile-optimized
- **Queue number race conditions**: Use database sequence or atomic increment
- **File uploads in form**: Reuse existing upload infrastructure
- **Guest check-in**: Decide if guests can check in without accounts
- **Form versioning**: Consider what happens if form changes after submissions

<!-- IMPLEMENTATION_PLAN_END -->
