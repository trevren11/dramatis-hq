# Issue #9: Talent Resume Generator - PDF Creation from Profile

## Overview

Implement auto-generated PDF resumes from talent profiles with selective inclusion and industry-standard theatrical formatting.

## Technical Approach

### Dependencies

- `@react-pdf/renderer` - Server-side PDF generation with React components

### Architecture

```
lib/
  resume/
    types.ts           # Resume data types and schemas
    templates/
      theatrical.tsx   # Standard theatrical resume template
    generator.ts       # PDF generation utilities

components/
  resume/
    ResumeBuilder.tsx       # Main resume builder UI
    SectionSelector.tsx     # Checkbox lists for selecting content
    DraggableSection.tsx    # Drag-to-reorder sections
    ResumePreview.tsx       # Live preview component
    SavedConfigurations.tsx # Manage saved resume versions

app/
  (dashboard)/
    talent/
      resume/
        page.tsx      # Resume builder page

  api/
    resume/
      generate/
        route.ts      # PDF generation endpoint
      [id]/
        route.ts      # Serve generated PDF
```

## Data Models

### TalentProfile (extended)

```typescript
interface TalentProfile {
  id: string;
  userId: string;
  name: string;
  headshot?: string;
  contactEmail?: string;
  phone?: string;
  height?: string;
  hairColor?: string;
  eyeColor?: string;
  unionStatus?: string[];
  workHistory: WorkHistoryItem[];
  education: EducationItem[];
  skills: string[];
}
```

### ResumeConfiguration

```typescript
interface ResumeConfiguration {
  id: string;
  userId: string;
  name: string;
  selectedWorkHistory: string[]; // IDs of included work history items
  selectedEducation: string[]; // IDs of included education items
  selectedSkills: string[]; // Selected skills
  sectionOrder: string[]; // Order of sections
  includeHeadshot: boolean;
  includeContact: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Standard Theatrical Resume Format

```
┌─────────────────────────────────────────┐
│ [HEADSHOT]  NAME                        │
│             Contact | Height | Hair | Eyes│
│             Union Status                 │
├─────────────────────────────────────────┤
│ THEATER                                  │
│ Show Name    Role    Theater    Director │
│ ...                                      │
├─────────────────────────────────────────┤
│ FILM/TELEVISION                          │
│ Project      Role    Prod Co   Director  │
│ ...                                      │
├─────────────────────────────────────────┤
│ TRAINING                                 │
│ Program             Instructor/School    │
│ ...                                      │
├─────────────────────────────────────────┤
│ SPECIAL SKILLS                           │
│ Skill list (comma separated)             │
└─────────────────────────────────────────┘
```

## Implementation Tasks

### Phase 1: Core Types & PDF Template

1. Create resume data types and Zod schemas
2. Install @react-pdf/renderer
3. Build theatrical resume PDF template
4. Create PDF generation API endpoint

### Phase 2: Resume Builder UI

1. Build section selector with checkboxes
2. Implement drag-to-reorder functionality
3. Create live preview component
4. Connect UI to PDF generation

### Phase 3: Configuration Management

1. Add database schema for saved configurations
2. Build CRUD operations for configurations
3. Create saved configurations UI
4. Add quick regenerate functionality

### Phase 4: Sharing (Future)

1. Shareable PDF links
2. QR code generation
3. Expiring links
4. Download tracking

## Testing Strategy

- Unit tests for PDF generation utilities
- Component tests for resume builder UI
- Integration tests for API endpoints
- Visual regression tests for PDF output

## Notes

- PDF generation happens server-side for consistency
- Print-ready quality (300 DPI equivalent)
- Proper page breaks for long resumes
- Mobile-responsive builder UI
