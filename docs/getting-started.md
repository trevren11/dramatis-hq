# Getting Started

This guide walks you through setting up Dramatis-HQ for local development.

## Prerequisites

- **Node.js 22+** (check with `node -v`)
- **pnpm 9+** (install with `npm install -g pnpm`)
- **Docker** and **Docker Compose** (for local services)

## Quick Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local

# 3. Start local services (Postgres, Redis, MinIO)
docker-compose up -d

# 4. Run database migrations
pnpm db:migrate

# 5. Seed test data (optional but recommended)
pnpm db:seed:test

# 6. Start development server
pnpm dev
```

The application runs at **http://localhost:6767**

## Test Credentials

After running `pnpm db:seed:test`, use these accounts:

| Email               | Password  | Role     |
| ------------------- | --------- | -------- |
| `talent@test.com`   | `test123` | Talent   |
| `producer@test.com` | `test123` | Producer |
| `admin@test.com`    | `test123` | Admin    |

## Environment Configuration

Copy `.env.example` to `.env.local` and configure:

### Required Variables

```bash
# Database - Local Docker PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dramatis

# Authentication - Generate a secret
NEXTAUTH_SECRET=your-secret-here  # Generate: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:6767

# Storage - Local MinIO (created by docker-compose)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_HEADSHOTS=headshots
S3_BUCKET_VIDEOS=videos
S3_BUCKET_DOCUMENTS=documents
```

### Optional Variables

```bash
# Stripe (for payment features)
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Email (for notifications)
RESEND_API_KEY=re_xxx

# Pusher (for real-time features)
PUSHER_APP_ID=xxx
NEXT_PUBLIC_PUSHER_KEY=xxx
PUSHER_SECRET=xxx

# Sentry (for error tracking)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

## Docker Services

The `docker-compose.yml` provides:

| Service  | Port | Purpose               |
| -------- | ---- | --------------------- |
| Postgres | 5432 | Primary database      |
| Redis    | 6379 | Caching/sessions      |
| MinIO    | 9000 | S3-compatible storage |
| MinIO UI | 9001 | Storage admin console |

### Useful Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f postgres

# Reset database (destructive!)
docker-compose down -v && docker-compose up -d
```

## Database Management

```bash
# Run migrations
pnpm db:migrate

# Push schema changes (dev only)
pnpm db:push

# Generate migration from schema changes
pnpm db:generate

# Open Drizzle Studio (database viewer)
pnpm db:studio
```

## Seeding Data

See the [Seeding Guide](./seeding.md) for complete documentation.

```bash
# Full seed (clears + all data)
pnpm db:seed

# Test seed (known credentials, minimal data)
pnpm db:seed:test

# Clear all data
pnpm db:seed:clear
```

## Running Tests

```bash
# Unit tests
pnpm test

# Watch mode (for TDD)
pnpm test:watch

# Coverage report
pnpm test:coverage

# E2E tests (requires running app)
pnpm test:e2e

# E2E with UI
pnpm test:e2e:ui
```

## Code Quality

```bash
# Linting
pnpm lint

# Type checking
pnpm typecheck

# Format code
pnpm format

# All checks before commit
pnpm lint && pnpm typecheck && pnpm test
```

## Building for Production

```bash
# Production build
pnpm build

# Start production server
pnpm start
```

## Deployment

### Limbo Server

```bash
# Deploy to limbo (internal server)
./scripts/deploy-limbo.sh
```

**Important:** Always use the deploy script. Never manually rsync or run docker commands on limbo.

## Troubleshooting

### "Cannot find module" errors

```bash
pnpm install
```

### Database connection failed

```bash
docker-compose up -d postgres
# Wait a few seconds, then retry
```

### Port 6767 already in use

```bash
lsof -i :6767
kill -9 <PID>
```

### MinIO buckets not created

```bash
docker-compose down
docker-compose up -d
# Buckets are auto-created by minio-setup service
```

### Reset everything

```bash
docker-compose down -v
rm -rf node_modules .next
pnpm install
docker-compose up -d
pnpm db:migrate
pnpm db:seed:test
pnpm dev
```
