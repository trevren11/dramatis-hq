# Dramatis-HQ

Theatrical production management platform connecting talent with producers.

## Overview

Dramatis-HQ is a comprehensive platform for managing theatrical productions, from talent discovery through casting to production management.

### For Talent (Free)
- Professional profile with headshots, videos, and resume
- Searchable skills and work history
- Calendar availability management
- Secure document storage (W2, call sheets)
- Auto-generated PDF resumes
- Profile sharing via QR codes

### For Producers (Subscription)
- Company profiles with show galleries
- Full audition management workflow
- Drag-and-drop casting board
- Production notes by department
- Rehearsal scheduling with notifications
- Budget and reimbursement tracking
- Staff permissions management

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, DaisyUI
- **Backend:** Next.js API Routes, tRPC, Drizzle ORM
- **Database:** PostgreSQL (Neon/Supabase)
- **Storage:** Cloudflare R2 / AWS S3
- **Auth:** NextAuth.js
- **Payments:** Stripe

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Start development database
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

## Documentation

- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Complete technical specification and roadmap

## Development

```bash
# Run tests
pnpm test

# Run linting
pnpm lint

# Type checking
pnpm typecheck

# Format code
pnpm format
```

## License

Private - All rights reserved.
