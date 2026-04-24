# Issue #8: Talent Profile - Physical Attributes and Search Visibility

## Overview

Add physical attributes to talent profiles that are searchable by producers but not publicly visible. This feature enables producers to filter talent based on physical characteristics while respecting talent privacy.

## Requirements Summary

1. **Physical Attributes Form**: Hair color, eye color, height, willingness to cut hair, ethnicity, age range, vocal range, 18+ confirmation
2. **Privacy Controls**: All optional, visible to producers only, toggle to hide from search
3. **Producer Search Integration**: Filter UI, combine with skills/location filters, show match percentage
4. **Database Schema**: Add columns to talent_profiles, create reference tables, add search indexes

---

## 1. Database Schema

### 1.1 New Columns for `talent_profiles` Table

The existing schema in `IMPLEMENTATION_PLAN.md` already defines some physical attributes. We need to add:

```typescript
// lib/db/schema/talent-profiles.ts

// New enums
export const vocalRangeEnum = pgEnum("vocal_range", [
  "soprano",
  "mezzo_soprano",
  "alto",
  "countertenor",
  "tenor",
  "baritone",
  "bass",
  "not_applicable",
]);

export const willingnessEnum = pgEnum("willingness", ["yes", "no", "negotiable"]);

// Add to talentProfiles table:
// - vocalRange: vocalRangeEnum("vocal_range")
// - willingnessToRemoveHair: willingnessEnum("willingness_to_remove_hair")
// - isOver18: boolean("is_over_18")
// - hideFromSearch: boolean("hide_from_search").default(false)
// - naturalHairColor: varchar("natural_hair_color", { length: 30 })
```

### 1.2 Reference Tables

Hair and eye color options stored as enums for consistency:

```typescript
export const hairColorEnum = pgEnum("hair_color", [
  "black",
  "brown",
  "blonde",
  "red",
  "auburn",
  "gray",
  "white",
  "bald",
  "other",
]);

export const eyeColorEnum = pgEnum("eye_color", [
  "brown",
  "blue",
  "green",
  "hazel",
  "gray",
  "amber",
  "other",
]);
```

### 1.3 Search Indexes

```typescript
// Composite index for producer search queries
index("talent_profiles_search_idx").on(
  talentProfiles.hideFromSearch,
  talentProfiles.isPublic,
  talentProfiles.heightInches,
  talentProfiles.ageRangeLow,
  talentProfiles.ageRangeHigh,
),
index("talent_profiles_hair_color_idx").on(talentProfiles.hairColor),
index("talent_profiles_eye_color_idx").on(talentProfiles.eyeColor),
index("talent_profiles_ethnicity_idx").on(talentProfiles.ethnicity),
index("talent_profiles_vocal_range_idx").on(talentProfiles.vocalRange),
```

---

## 2. API Design

### 2.1 tRPC Procedures

#### Update Physical Attributes

```typescript
// lib/trpc/routers/talent.ts
updatePhysicalAttributes: protectedProcedure
  .input(physicalAttributesSchema)
  .mutation(async ({ ctx, input }) => {
    // Only talent users can update their own profile
    // Returns updated profile
  });
```

#### Get Physical Attributes (for profile owner)

```typescript
getPhysicalAttributes: protectedProcedure.query(async ({ ctx }) => {
  // Returns all physical attributes for the logged-in talent
});
```

#### Producer Search

```typescript
searchTalent: producerProcedure.input(talentSearchSchema).query(async ({ ctx, input }) => {
  // Filters: height range, age range, hair color, eye color,
  //          ethnicity, vocal range, willingness to cut hair, is 18+
  // Excludes: profiles with hideFromSearch = true
  // Returns: matching profiles with match percentage
});
```

### 2.2 Zod Validation Schemas

```typescript
// lib/validations/physical-attributes.ts
export const physicalAttributesSchema = z.object({
  heightInches: z.number().min(36).max(96).optional(),
  hairColor: z.enum(HAIR_COLORS).optional(),
  naturalHairColor: z.enum(HAIR_COLORS).optional(),
  eyeColor: z.enum(EYE_COLORS).optional(),
  ethnicity: z.enum(ETHNICITIES).optional(),
  ageRangeLow: z.number().min(0).max(100).optional(),
  ageRangeHigh: z.number().min(0).max(100).optional(),
  vocalRange: z.enum(VOCAL_RANGES).optional(),
  willingnessToRemoveHair: z.enum(WILLINGNESS_OPTIONS).optional(),
  isOver18: z.boolean().optional(),
  hideFromSearch: z.boolean().optional(),
});

export const talentSearchSchema = z.object({
  heightMin: z.number().optional(),
  heightMax: z.number().optional(),
  ageMin: z.number().optional(),
  ageMax: z.number().optional(),
  hairColors: z.array(z.enum(HAIR_COLORS)).optional(),
  eyeColors: z.array(z.enum(EYE_COLORS)).optional(),
  ethnicities: z.array(z.enum(ETHNICITIES)).optional(),
  vocalRanges: z.array(z.enum(VOCAL_RANGES)).optional(),
  willingToCutHair: z.boolean().optional(),
  mustBe18Plus: z.boolean().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});
```

---

## 3. UI Components

### 3.1 Physical Attributes Form

Location: `components/talent/physical-attributes-form.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│  Physical Attributes                                        │
│  ℹ️ This information is only visible to producers          │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Height          │  │ Age Range       │                  │
│  │ [5] ft [8] in   │  │ [25] - [35]     │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Hair Color      │  │ Natural Hair    │                  │
│  │ [▼ Brown     ]  │  │ [▼ Brown     ]  │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Eye Color       │  │ Ethnicity       │                  │
│  │ [▼ Blue      ]  │  │ [▼ Caucasian ]  │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │ Vocal Range     │  │ Willing to cut/color hair?      │  │
│  │ [▼ Tenor     ]  │  │ ○ Yes  ○ No  ○ Negotiable      │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑️ I confirm I am 18 years of age or older          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ── Search Visibility ──────────────────────────────────   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☐ Hide my profile from producer searches            │   │
│  │   Your profile will not appear in search results    │   │
│  │   but producers can still view it via direct link   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                              [Cancel]  [Save Changes]       │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Producer Search UI

Location: `components/producer/talent-search.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│  Search Talent                                              │
│                                                             │
│  ┌─ Filters ──────────────────────────────────────────────┐│
│  │                                                         ││
│  │  Height: [4'0"] - [7'0"]  ═══════●═══════             ││
│  │  Age:    [18]   - [65]    ═══●═════════════           ││
│  │                                                         ││
│  │  Hair Color      Eye Color       Ethnicity             ││
│  │  ☑ Black         ☑ Brown         ☑ All                 ││
│  │  ☑ Brown         ☑ Blue          ○ Specific...         ││
│  │  ☐ Blonde        ☐ Green                               ││
│  │  ☐ Red           ☐ Hazel                               ││
│  │                                                         ││
│  │  Vocal Range              Other Requirements            ││
│  │  ☐ Soprano  ☐ Tenor       ☑ Must be 18+                ││
│  │  ☐ Alto     ☐ Baritone    ☐ Willing to cut hair        ││
│  │  ☐ Mezzo    ☐ Bass                                     ││
│  │                                                         ││
│  │  Skills: [____________] Location: [____________]        ││
│  │                                                         ││
│  │                      [Clear All]  [Search]              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Found 47 matching profiles                                 │
│                                                             │
│  ┌──────────┬───────────────────────────────────┬────────┐ │
│  │ [Photo]  │ Jane Smith                        │  95%   │ │
│  │          │ 5'6" • Brown hair • Blue eyes     │ match  │ │
│  │          │ Mezzo-soprano • AEA               │        │ │
│  └──────────┴───────────────────────────────────┴────────┘ │
│  ┌──────────┬───────────────────────────────────┬────────┐ │
│  │ [Photo]  │ John Doe                          │  87%   │ │
│  │          │ 6'1" • Black hair • Brown eyes    │ match  │ │
│  │          │ Baritone • Non-union              │        │ │
│  └──────────┴───────────────────────────────────┴────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Match Percentage Calculation

```typescript
function calculateMatchPercentage(profile: TalentProfile, filters: SearchFilters): number {
  let matchedCriteria = 0;
  let totalCriteria = 0;

  // Height match
  if (filters.heightMin || filters.heightMax) {
    totalCriteria++;
    if (
      profile.heightInches >= (filters.heightMin ?? 0) &&
      profile.heightInches <= (filters.heightMax ?? Infinity)
    ) {
      matchedCriteria++;
    }
  }

  // Age range overlap
  if (filters.ageMin || filters.ageMax) {
    totalCriteria++;
    const hasOverlap =
      profile.ageRangeLow <= (filters.ageMax ?? Infinity) &&
      profile.ageRangeHigh >= (filters.ageMin ?? 0);
    if (hasOverlap) matchedCriteria++;
  }

  // Hair color match
  if (filters.hairColors?.length) {
    totalCriteria++;
    if (filters.hairColors.includes(profile.hairColor)) matchedCriteria++;
  }

  // ... similar for other criteria

  return totalCriteria > 0 ? Math.round((matchedCriteria / totalCriteria) * 100) : 100;
}
```

---

## 4. Privacy & Security

### 4.1 Access Control Rules

| Data                  | Talent Owner | Producer                  | Public |
| --------------------- | ------------ | ------------------------- | ------ |
| Physical attributes   | Read/Write   | Read (if !hideFromSearch) | Hidden |
| hideFromSearch toggle | Read/Write   | Hidden                    | Hidden |
| isOver18 status       | Read/Write   | Read                      | Hidden |

### 4.2 Implementation

```typescript
// Middleware to check producer access
const canViewPhysicalAttributes = (viewer: User, profile: TalentProfile): boolean => {
  // Owner can always view
  if (viewer.id === profile.userId) return true;

  // Producers can view if not hidden from search
  if (viewer.userType === "producer" && !profile.hideFromSearch) return true;

  return false;
};
```

### 4.3 Test Cases for Privacy Boundaries

1. **Talent can view/edit own physical attributes**
2. **Producer can view physical attributes of searchable profiles**
3. **Producer cannot view physical attributes when hideFromSearch=true**
4. **Public visitors cannot see physical attributes**
5. **Search results exclude profiles with hideFromSearch=true**
6. **Direct profile link still works for hidden profiles (no physical attrs shown)**

---

## 5. Implementation Order

### Phase 1: Database & Schema

1. Add new enums to schema
2. Add new columns to talent_profiles
3. Create migration
4. Add search indexes

### Phase 2: API Layer

1. Create validation schemas
2. Implement updatePhysicalAttributes procedure
3. Implement getPhysicalAttributes procedure
4. Implement searchTalent procedure with filters

### Phase 3: UI Components

1. Create PhysicalAttributesForm component
2. Add form to talent profile settings page
3. Create TalentSearch component for producers
4. Add search page to producer dashboard

### Phase 4: Testing

1. Unit tests for validation schemas
2. Unit tests for match percentage calculation
3. Integration tests for privacy boundaries
4. E2E tests for complete flow

---

## 6. Files to Create/Modify

### New Files

- `lib/db/schema/talent-profiles.ts` - Talent profile schema with physical attributes
- `lib/validations/physical-attributes.ts` - Zod schemas
- `lib/trpc/routers/talent.ts` - tRPC procedures
- `components/talent/physical-attributes-form.tsx` - Form component
- `components/producer/talent-search.tsx` - Search UI
- `app/(dashboard)/talent/profile/physical-attributes/page.tsx` - Form page
- `app/(dashboard)/producer/search/page.tsx` - Search page
- `lib/__tests__/physical-attributes.test.ts` - Unit tests
- `lib/__tests__/talent-search.test.ts` - Search tests
- `lib/__tests__/privacy-boundaries.test.ts` - Privacy tests

### Modified Files

- `lib/db/schema/index.ts` - Export new schema
- `lib/trpc/routers/index.ts` - Add talent router

---

## 7. Success Criteria

- [ ] All physical attributes can be saved and retrieved
- [ ] Privacy toggle hides profile from search results
- [ ] Producers can filter talent by all physical attributes
- [ ] Match percentage displays correctly
- [ ] 100% of privacy boundary tests pass
- [ ] No physical attributes visible on public profile views
