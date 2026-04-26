# Database Seed System

Composable seed system for generating test data.

## Quick Start

```bash
# Full seed (clears DB first, adds everything)
pnpm db:seed

# Clear everything
pnpm db:seed:clear

# Test credentials only (fast, predictable)
pnpm db:seed:test
```

## Available Seeds

### Basic Seeds (Additive)

These add data without clearing first. Use for building up data incrementally.

| Command                      | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| `pnpm db:seed:users`         | Add 15 talent, 5 producer, 1 admin users               |
| `pnpm db:seed:talent`        | Add talent profiles (requires users)                   |
| `pnpm db:seed:producer`      | Add producer profiles + shows + roles (requires users) |
| `pnpm db:seed:auditions`     | Add auditions with applications (requires producers)   |
| `pnpm db:seed:calendar`      | Add availability and show schedules (requires talent)  |
| `pnpm db:seed:messages`      | Add conversations and messages (requires users)        |
| `pnpm db:seed:notifications` | Add in-app notifications (requires users)              |
| `pnpm db:seed:materials`     | Add scripts and minus tracks (requires shows)          |

### Scenario Seeds

Complete setups for specific testing purposes.

| Command                         | Description                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| `pnpm db:seed:test`             | Minimal data with known credentials (talent/producer/admin@test.com, password: test123) |
| `pnpm db:seed:minimal`          | Quick dev setup with test users + basic profiles                                        |
| `pnpm db:seed:diverse-talent`   | 50+ talent profiles with varied attributes for search testing                           |
| `pnpm db:seed:active-auditions` | Many open auditions with applications for audition flow testing                         |
| `pnpm db:seed:large-scale`      | Stress test: 100+ talent, 15+ producers, many shows/auditions                           |
| `pnpm db:seed:new-talent`       | New talent onboarding: incomplete profile + open auditions to apply to                  |
| `pnpm db:seed:new-producer`     | New producer onboarding: no shows yet + talent pool to cast from                        |
| `pnpm db:seed:review-queue`     | Many pending applications for testing review workflows                                  |

## Combining Seeds

Run multiple seeds in one command by passing multiple arguments:

```bash
# Clear, then add test users, then add active auditions
tsx lib/db/seed/index.ts clear test active-auditions

# Start fresh with test users and diverse talent
tsx lib/db/seed/index.ts clear test diverse-talent

# Add more users to existing data
tsx lib/db/seed/index.ts users

# Chain: users -> talent -> producer -> auditions
tsx lib/db/seed/index.ts clear users talent producer auditions
```

## Test Credentials

When using `test` or `minimal` seeds:

| Email             | Password | Type     |
| ----------------- | -------- | -------- |
| talent@test.com   | test123  | Talent   |
| producer@test.com | test123  | Producer |
| admin@test.com    | test123  | Admin    |

All other seeded users have password: `password123`

## Architecture

```
lib/db/seed/
├── index.ts         # Seed runner and orchestration
├── base.ts          # Utilities, DB connection, sample data pools
├── users.ts         # User account seeding
├── talent.ts        # Talent profile seeding
├── producer.ts      # Producer profile, show, and role seeding
├── auditions.ts     # Audition and application seeding
├── calendar.ts      # Availability and show schedule seeding
├── messages.ts      # Conversations and messages seeding
├── notifications.ts # In-app notifications seeding
├── materials.ts     # Scripts and minus tracks seeding
└── README.md        # This file
```

### Adding New Seeds

1. Create a seed function in the appropriate file
2. Add it to `SEED_FUNCTIONS` in `index.ts`
3. Add an npm script in `package.json` (optional, for convenience)

### State Sharing

Seeds within a single run share state (users, profiles, etc.) so they can reference each other. The state is reset when `clear` runs or when starting a new process.
