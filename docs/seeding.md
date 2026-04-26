# Database Seeding Guide

Comprehensive guide to the Dramatis-HQ seed system for generating test data.

## Quick Reference

```bash
# Most common commands
pnpm db:seed:test          # Best for development - known credentials
pnpm db:seed               # Full dataset
pnpm db:seed:clear         # Wipe all data
```

## Test Credentials

After running `test` or `minimal` seeds:

| Email               | Password  | Role     | Description           |
| ------------------- | --------- | -------- | --------------------- |
| `talent@test.com`   | `test123` | Talent   | Full talent profile   |
| `producer@test.com` | `test123` | Producer | Company with shows    |
| `admin@test.com`    | `test123` | Admin    | Administrative access |

All other randomly generated users have password: `password123`

## Available Seeds

### Full Seed

```bash
pnpm db:seed
```

Complete dataset with everything:

- 25 talent users + 5 producers + 2 admins
- Test users (above)
- Full profiles with work history, skills, headshots
- Multiple shows with roles
- Auditions with applications
- Calendar entries
- Messages and notifications
- Materials (scripts, minus tracks)

### Test Seed

```bash
pnpm db:seed:test
```

Minimal predictable data for development:

- 3 test users (talent, producer, admin)
- Talent profile with 2-4 work history items
- Producer with 2-3 shows
- Open auditions to browse
- Calendar entries
- Messages and notifications

### Minimal Seed

```bash
pnpm db:seed:minimal
```

Fastest setup - just test users with basic profiles:

- Test credentials only
- Basic talent profile
- 1-2 shows per producer
- Open auditions

## Scenario Seeds

For testing specific features:

### Diverse Talent

```bash
pnpm db:seed:diverse-talent
```

50+ talent profiles with varied:

- Demographics
- Skill combinations
- Experience levels
- Union statuses

**Use for:** Testing search and filter functionality

### Active Auditions

```bash
pnpm db:seed:active-auditions
```

Many open auditions:

- 8 producers with 3-6 shows each
- 95% of shows have active auditions
- 10-30 applications per audition
- Custom audition forms

**Use for:** Testing audition workflows

### Large Scale

```bash
pnpm db:seed:large-scale
```

Stress test data:

- 100+ talent profiles
- 15+ producers
- Many shows and auditions
- High application counts

**Use for:** Performance testing, pagination

### New Talent Onboarding

```bash
pnpm db:seed:new-talent
```

Simulates first-time talent user:

- Incomplete talent profile
- Open auditions to apply to
- No existing applications

**Use for:** Testing onboarding flow

### New Producer Onboarding

```bash
pnpm db:seed:new-producer
```

Simulates first-time producer:

- Empty producer profile
- No shows yet
- Talent pool available

**Use for:** Testing show creation flow

### Review Queue

```bash
pnpm db:seed:review-queue
```

Many pending applications:

- 40 talent profiles
- 2-3 shows with 10-15 roles each
- 25-40 applications per audition

**Use for:** Testing application review workflow

## Individual Seeds

Add specific data types incrementally:

```bash
pnpm db:seed:users         # Add random users (no profiles)
pnpm db:seed:talent        # Add talent profiles (requires users)
pnpm db:seed:producer      # Add producer profiles + shows (requires users)
pnpm db:seed:auditions     # Add auditions (requires producers)
pnpm db:seed:calendar      # Add availability entries (requires talent)
pnpm db:seed:messages      # Add conversations (requires users)
pnpm db:seed:notifications # Add notifications (requires users)
pnpm db:seed:materials     # Add scripts/tracks (requires shows)
```

**Note:** Individual seeds are additive - they don't clear existing data.

## Combining Seeds

Chain multiple seeds in one command:

```bash
# Clear and start fresh with test data
tsx lib/db/seed/index.ts clear test

# Test users + lots of talent for search testing
tsx lib/db/seed/index.ts clear test diverse-talent

# Build up incrementally
tsx lib/db/seed/index.ts clear users talent producer auditions

# Add active auditions to existing test data
tsx lib/db/seed/index.ts test active-auditions
```

## Clearing Data

```bash
pnpm db:seed:clear
```

Truncates all tables in the correct order (respecting foreign keys). This is faster than dropping and recreating the database.

## Seed Architecture

```
lib/db/seed/
├── index.ts         # Main runner and orchestration
├── base.ts          # DB connection, utilities, sample data pools
├── users.ts         # User account generation
├── talent.ts        # Talent profile generation
├── producer.ts      # Producer, show, role generation
├── auditions.ts     # Audition and application generation
├── calendar.ts      # Availability and schedules
├── messages.ts      # Conversations and messages
├── notifications.ts # In-app notifications
├── materials.ts     # Scripts and minus tracks
└── README.md        # Quick reference
```

### State Sharing

Seeds within a single run share state:

```typescript
// State shared between seeds in one run
interface SeedState {
  users: User[];
  talentProfiles: TalentProfile[];
  producers: Producer[];
  shows: Show[];
  roles: Role[];
}
```

This allows seeds to reference each other (e.g., `auditions` needs `shows` from `producer`).

### Sample Data Pools

Located in `base.ts`:

- First/last name combinations
- Show titles and synopses
- Role names and descriptions
- Skill categories
- Work history templates

## Adding New Seeds

1. Create function in appropriate file:

```typescript
// In talent.ts
export async function seedSpecialTalent(users: User[]): Promise<TalentProfile[]> {
  // ... generation logic
}
```

2. Add to `SEED_FUNCTIONS` in `index.ts`:

```typescript
const SEED_FUNCTIONS: Record<SeedType, () => Promise<void>> = {
  // ...existing seeds
  "special-talent": seedSpecialTalentScenario,
};
```

3. Optionally add npm script in `package.json`:

```json
{
  "scripts": {
    "db:seed:special-talent": "tsx lib/db/seed/index.ts special-talent"
  }
}
```

## Common Patterns

### Reset and Seed for Fresh Development

```bash
docker-compose down -v
docker-compose up -d
pnpm db:migrate
pnpm db:seed:test
```

### Seed for E2E Tests

```bash
pnpm db:seed:test
pnpm test:e2e
```

### Add More Data to Existing DB

```bash
# Won't clear - just adds more
pnpm db:seed:users
pnpm db:seed:talent
```

### Test Specific Feature with Focused Data

```bash
pnpm db:seed:clear
tsx lib/db/seed/index.ts test review-queue
# Now test the review workflow with lots of applications
```

## Troubleshooting

### "No users found" error

Individual seeds depend on previous seeds. Run in order:

```bash
tsx lib/db/seed/index.ts clear users talent producer
```

### Duplicate key errors

Clear first before re-seeding:

```bash
pnpm db:seed:clear
pnpm db:seed:test
```

### Connection errors

Ensure database is running:

```bash
docker-compose up -d postgres
# Wait a few seconds
pnpm db:seed:test
```
