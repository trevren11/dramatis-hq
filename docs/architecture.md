# Architecture

Technical architecture and project structure for Dramatis-HQ.

## Directory Structure

```
dramatis-hq/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/                # Login page
│   │   ├── signup/               # Registration (talent/producer)
│   │   └── reset-password/       # Password reset flow
│   ├── (dashboard)/              # Authenticated dashboard
│   │   ├── talent/               # Talent user pages
│   │   └── producer/             # Producer user pages
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── trpc/                 # tRPC router
│   │   ├── webhooks/             # External webhooks (Stripe, etc.)
│   │   └── [feature]/            # REST endpoints by feature
│   ├── auditions/                # Public audition browsing
│   ├── talent/[slug]/            # Public talent profiles
│   ├── company/[slug]/           # Public company profiles
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── ui/                       # Base UI components (Button, Input, etc.)
│   ├── layout/                   # Layout components (Header, Sidebar, etc.)
│   ├── auth/                     # Authentication components
│   ├── talent/                   # Talent-specific components
│   ├── producer/                 # Producer-specific components
│   ├── auditions/                # Audition components
│   ├── casting/                  # Casting board components
│   ├── calendar/                 # Calendar components
│   ├── messages/                 # Messaging components
│   ├── notifications/            # Notification components
│   ├── settings/                 # Settings components
│   └── [feature]/                # Other feature components
│
├── lib/                          # Core business logic
│   ├── db/                       # Database layer
│   │   ├── schema/               # Drizzle schema definitions
│   │   ├── migrations/           # Database migrations
│   │   ├── seed/                 # Seed data generators
│   │   └── index.ts              # Database client
│   ├── auth/                     # Authentication utilities
│   ├── permissions/              # RBAC permission system
│   ├── validations/              # Zod schemas
│   ├── storage/                  # S3/file storage utilities
│   ├── email/                    # Email templates and sending
│   ├── resume/                   # PDF resume generation
│   ├── encryption/               # Document encryption
│   ├── push/                     # Push notifications
│   ├── realtime/                 # Pusher real-time utilities
│   ├── monitoring/               # Sentry and logging
│   ├── hooks/                    # React hooks
│   ├── services/                 # External service clients
│   └── utils.ts                  # General utilities
│
├── e2e/                          # End-to-end tests
│   ├── tests/                    # Playwright test files
│   └── fixtures/                 # Test fixtures
│
├── public/                       # Static assets
│   ├── images/                   # Static images
│   └── icons/                    # App icons
│
├── scripts/                      # Utility scripts
│   └── deploy-limbo.sh           # Deployment script
│
├── docs/                         # Documentation
│   ├── README.md                 # Documentation index
│   ├── getting-started.md        # Setup guide
│   ├── features.md               # Feature documentation
│   ├── architecture.md           # This file
│   ├── seeding.md                # Database seeding guide
│   ├── api.md                    # API reference
│   └── IMPLEMENTATION_PLAN*.md   # Feature implementation specs
│
└── Configuration Files
    ├── .env.example              # Environment template
    ├── docker-compose.yml        # Local services
    ├── drizzle.config.ts         # Drizzle ORM config
    ├── next.config.ts            # Next.js config
    ├── tailwind.config.ts        # Tailwind config
    ├── tsconfig.json             # TypeScript config
    ├── vitest.config.ts          # Test config
    ├── playwright.config.ts      # E2E test config
    └── eslint.config.mjs         # Linting config
```

## Key Files Reference

### Database

| File                   | Purpose                        |
| ---------------------- | ------------------------------ |
| `lib/db/index.ts`      | Database client initialization |
| `lib/db/schema/*.ts`   | Table definitions              |
| `lib/db/migrations/`   | SQL migration files            |
| `lib/db/seed/index.ts` | Seed orchestrator              |
| `drizzle.config.ts`    | Drizzle configuration          |

### Authentication

| File                          | Purpose                             |
| ----------------------------- | ----------------------------------- |
| `lib/auth/index.ts`           | NextAuth configuration              |
| `lib/auth/providers.ts`       | Auth providers (credentials, OAuth) |
| `middleware.ts`               | Route protection                    |
| `app/api/auth/[...nextauth]/` | Auth API routes                     |

### API Layer

| File                           | Purpose                    |
| ------------------------------ | -------------------------- |
| `app/api/trpc/[trpc]/route.ts` | tRPC endpoint              |
| `lib/services/trpc.ts`         | tRPC router and procedures |
| `app/api/[feature]/route.ts`   | REST endpoints             |

### Components

| Directory               | Purpose                     |
| ----------------------- | --------------------------- |
| `components/ui/`        | Reusable UI primitives      |
| `components/layout/`    | Page layout components      |
| `components/[feature]/` | Feature-specific components |

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js    │────▶│  PostgreSQL │
│   (React)   │     │  API/tRPC   │     │  (Drizzle)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ├──────────▶ S3/MinIO (files)
       │                   │
       │                   ├──────────▶ Stripe (payments)
       │                   │
       │                   ├──────────▶ Resend (email)
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│   Pusher    │◀───▶│   Redis     │
│  (realtime) │     │  (cache)    │
└─────────────┘     └─────────────┘
```

## Database Schema

Key entities and relationships:

```
users
  ├── talent_profiles (1:1)
  │     ├── headshots (1:N)
  │     ├── work_history (1:N)
  │     ├── education (1:N)
  │     ├── talent_skills (N:M via skills)
  │     └── availability (1:N)
  │
  └── producer_profiles (1:1)
        └── shows (1:N)
              ├── roles (1:N)
              │     └── audition_roles (N:M)
              ├── auditions (1:N)
              │     ├── audition_applications (1:N)
              │     └── audition_forms (1:N)
              ├── show_schedules (1:N)
              ├── materials (scripts, minus_tracks) (1:N)
              └── production_notes (1:N)
```

## Authentication Flow

1. User submits credentials or OAuth
2. NextAuth validates and creates session
3. Session stored in database
4. JWT or session cookie returned
5. Middleware checks session on protected routes
6. `lib/permissions/` validates role-based access

## Permission System

Located in `lib/permissions/`:

```typescript
// Example permission check
const canEditShow = await checkPermission({
  userId: session.user.id,
  resource: "show",
  resourceId: showId,
  action: "edit",
});
```

Permissions are checked at:

- API route handlers
- tRPC procedures
- Server components

## File Storage

Located in `lib/storage/`:

- **Headshots** → `headshots` bucket
- **Videos** → `videos` bucket
- **Documents** → `documents` bucket (encrypted)
- **Temp uploads** → `temp` bucket

Flow:

1. Client requests presigned upload URL
2. Client uploads directly to S3/MinIO
3. Server records file metadata
4. Files served via presigned download URLs

## Real-Time System

Located in `lib/realtime/`:

Uses Pusher for:

- Presence channels (who's online)
- Private channels (user-specific updates)
- Public channels (broadcast updates)

Events:

- `casting:update` - Casting board changes
- `message:new` - New messages
- `notification:new` - New notifications

## Email System

Located in `lib/email/`:

- Templates using React Email
- Sent via Resend API
- Types: verification, password reset, notifications

## Monitoring

Located in `lib/monitoring/`:

- **Sentry** - Error tracking and performance
- **Pino** - Structured logging
- **Web Vitals** - Performance metrics

## Testing Strategy

```
__tests__/              # Vitest unit/integration tests
├── unit/               # Isolated unit tests
├── integration/        # Tests with real DB
└── components/         # React component tests

e2e/                    # Playwright E2E tests
├── tests/              # Test files
└── fixtures/           # Test data
```

Coverage targets:

- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%
