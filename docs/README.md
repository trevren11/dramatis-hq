# Dramatis-HQ Documentation

Welcome to the Dramatis-HQ documentation. This guide covers everything you need to know about the theatrical production management platform.

## Quick Links

- [Getting Started](./getting-started.md) - Setup and first run
- [Features Guide](./features.md) - Complete feature documentation
- [Architecture](./architecture.md) - Project structure and technical design
- [Database Seeding](./seeding.md) - Test data generation
- [API Reference](./api.md) - API endpoints and usage

## What is Dramatis-HQ?

Dramatis-HQ is a comprehensive platform for managing theatrical productions, from talent discovery through casting to production management. It connects talent with producers through a unified workflow.

### For Talent (Free Tier)

- **Professional Profile** - Headshots, videos, work history, and skills
- **Auto-Generated Resumes** - Industry-standard theatrical PDF resumes
- **Calendar Management** - Availability and conflict tracking
- **Secure Documents** - W2s, call sheets, contracts with encryption
- **QR Code Sharing** - Quick profile sharing at auditions

### For Producers (Subscription)

- **Company Profiles** - Showcase your production company and past shows
- **Audition Management** - Create listings, review applications, schedule callbacks
- **Casting Board** - Drag-and-drop interface for casting decisions
- **Production Notes** - Collaborative notes organized by department
- **Rehearsal Scheduling** - Calendar with notifications and conflicts
- **Budget Tracking** - Expense management and reimbursements
- **Staff Permissions** - Role-based access for production staff

## Tech Stack

| Layer      | Technology                       |
| ---------- | -------------------------------- |
| Frontend   | Next.js 16, React 19, TypeScript |
| Styling    | Tailwind CSS, DaisyUI            |
| Backend    | Next.js API Routes, tRPC         |
| Database   | PostgreSQL, Drizzle ORM          |
| Storage    | Cloudflare R2 / AWS S3 / MinIO   |
| Auth       | NextAuth.js                      |
| Payments   | Stripe                           |
| Real-time  | Pusher (WebSocket)               |
| Email      | Resend                           |
| Monitoring | Sentry                           |

## Getting Help

- Check the [AGENTS.md](../AGENTS.md) file for AI assistant guidelines
- See [Implementation Plans](./IMPLEMENTATION_PLAN.md) for technical specifications
- Review the [seed README](../lib/db/seed/README.md) for database seeding details
