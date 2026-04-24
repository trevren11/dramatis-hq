# Dramatis-HQ Implementation Plan

## Comprehensive Implementation Plan for Theatrical Production Management Platform

**Repository:** https://github.com/trevren11/dramatis-hq  
**Project Start Date:** 2026-04-23  
**Document Version:** 1.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Database Architecture](#4-database-architecture)
5. [Backend API Design](#5-backend-api-design)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Security Considerations](#7-security-considerations)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Coding Standards](#9-coding-standards)
10. [Infrastructure](#10-infrastructure)
11. [Implementation Phases](#11-implementation-phases)

---

## 1. Executive Summary

### 1.1 Vision

Dramatis-HQ is a comprehensive theatrical production management platform that bridges the gap between talent and producers in the performing arts industry. The platform streamlines the entire production lifecycle—from talent discovery and auditions through casting, rehearsals, and production management.

### 1.2 Platform Goals

1. **Democratize Access to Opportunities** - Give performers a professional platform to showcase their work and connect with producers regardless of geographic location or industry connections
2. **Streamline the Audition Process** - Replace paper-based auditions with digital profiles, QR check-in, and real-time casting decisions
3. **Centralize Production Management** - Provide producers with a single platform for all production needs: scheduling, notes, documents, budgets, and communication
4. **Protect Sensitive Information** - Ensure SOC 2 compliant storage for tax documents (W2, I-9) and personal information
5. **Enable Collaboration** - Support multi-user workflows where directors, stage managers, and designers can work together with appropriate access controls
6. **Generate Professional Materials** - Auto-generate resumes, cast lists, call sheets, and other industry-standard documents

### 1.3 User Types

The platform serves two primary account types with multiple permission levels within each:

| Account Type | Pricing           | Description                                                                         |
| ------------ | ----------------- | ----------------------------------------------------------------------------------- |
| **Talent**   | Free              | Performers, actors, musicians, dancers who create profiles and audition for roles   |
| **Producer** | Paid Subscription | Production companies, theaters, and organizations that manage shows and hire talent |

---

### 1.4 Talent Capabilities (Free Tier)

#### Profile & Identity

| Feature                        | Description                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| **Profile Pictures/Headshots** | Upload multiple professional headshots with cropping and optimization                   |
| **Video Samples**              | Upload and showcase work samples: singing, acting, instrument performances, dance reels |
| **Social Media Links**         | Connect Instagram, TikTok, Facebook, X (Twitter) profiles                               |
| **Contact Information**        | Email and phone number (visibility controlled by user)                                  |
| **Public Profile URL**         | Shareable link to public-facing profile                                                 |
| **QR Code Generation**         | Generate QR codes linking to profile for audition check-in                              |

#### Professional History

| Feature                      | Description                                                               |
| ---------------------------- | ------------------------------------------------------------------------- |
| **Society/Union Membership** | Track memberships: AEA, SAG-AFTRA, IATSE, AFM, etc.                       |
| **Work History**             | Comprehensive project history with categorization                         |
| **Project Details**          | Show/project name, role/position, location, dates, union/non-union status |
| **Project Categories**       | Categorize as Theater, Film, Television, Commercial, Voice-over, etc.     |
| **Education/Training**       | Program name, degree, university/conservatory, years attended             |
| **Special Skills**           | Searchable skill tags (similar to LinkedIn skills)                        |

#### Physical Attributes (Searchable by Producers, Not Public)

| Attribute               | Notes                                        |
| ----------------------- | -------------------------------------------- |
| Hair Color              | Current and natural                          |
| Eye Color               | —                                            |
| Height                  | —                                            |
| Willingness to Cut Hair | Yes/No/Negotiable                            |
| Ethnicity               | Self-identified, optional                    |
| Age Range               | Playable age range                           |
| Vocal Range             | For singers (e.g., Soprano, Tenor, Baritone) |
| 18+ Confirmation        | Legal verification for mature content        |

#### Resume Generation

| Feature                  | Description                                                                  |
| ------------------------ | ---------------------------------------------------------------------------- |
| **Auto-Generate Resume** | Pull profile picture, work history, education, and skills into formatted PDF |
| **Selective Inclusion**  | Checkbox interface to include/exclude specific experiences before generation |
| **Print-Ready Format**   | Industry-standard resume format suitable for printing                        |
| **Multiple Versions**    | Save different resume configurations for different audition types            |

#### Document Storage (Private, SOC 2 Compliant)

| Document Type          | Description                                  |
| ---------------------- | -------------------------------------------- |
| **Tax Documents**      | W2, 1099 forms (encrypted, user-only access) |
| **Call Sheets**        | Received call sheets from productions        |
| **Contracts**          | Employment agreements and deal memos         |
| **Personal Documents** | ID copies, work permits, etc.                |

#### Calendar & Availability

| Feature                   | Description                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------- |
| **Availability Calendar** | Mark available/unavailable dates for auditions and bookings                        |
| **Schedule Sync**         | Automatic blackout dates when booked on a show (without revealing project details) |
| **Conflict Detection**    | Warn when applying for overlapping commitments                                     |

#### Communication

| Feature                 | Description                                                                  |
| ----------------------- | ---------------------------------------------------------------------------- |
| **Message Center**      | Send and receive messages to/from producers and other talent                 |
| **Email Notifications** | Configurable notifications for messages, audition updates, casting decisions |
| **Push Notifications**  | Mobile alerts for time-sensitive communications                              |

#### Profile Sharing

| Method                | Description                                                 |
| --------------------- | ----------------------------------------------------------- |
| **Direct Link**       | Shareable URL to public profile                             |
| **QR Code**           | Scannable code for audition check-in                        |
| **Search Visibility** | Opt-in to be discoverable by producers searching for talent |

---

### 1.5 Producer Capabilities (Paid Subscription)

#### Company Profile

| Feature             | Description                                        |
| ------------------- | -------------------------------------------------- |
| **Company Logo**    | Brand identity display                             |
| **About Us**        | Company description, mission, history              |
| **Location**        | Primary venue/office location                      |
| **Website**         | Link to company website                            |
| **Union Status**    | AEA signatory, non-union, or mixed                 |
| **Photo Gallery**   | Showcase current and past productions              |
| **Upcoming Season** | Announce upcoming shows and audition opportunities |

#### Audition Management

##### Audition Announcements

| Feature                 | Description                                                             |
| ----------------------- | ----------------------------------------------------------------------- |
| **Public Listings**     | Post auditions visible to all talent                                    |
| **Requirements**        | Specify union status, age range, roles available                        |
| **Materials Request**   | Specify required audition materials (headshot, resume, song, monologue) |
| **Submission Deadline** | Set application cutoff dates                                            |

##### Audition Form Builder

| Feature                    | Description                                                      |
| -------------------------- | ---------------------------------------------------------------- |
| **Custom Questions**       | Build forms asking talent-specific questions beyond profile data |
| **Required Fields**        | Mark questions as required or optional                           |
| **Auto-Fill from Profile** | Pre-populate answers from talent's existing profile data         |
| **QR Code Check-In**       | Generate unique QR for audition; talent scans to pull their info |

##### Audition Day Interface

| Feature              | Description                                                          |
| -------------------- | -------------------------------------------------------------------- |
| **Talent Queue**     | View profiles in audition order                                      |
| **Profile View**     | See headshot on first click                                          |
| **Resume View**      | Flip to resume on second click                                       |
| **Quick Actions**    | Sort talent into: Callback, No Thanks, Callback with Role (typeable) |
| **Notes**            | Add private notes per talent                                         |
| **Future Cast List** | Running view of callback/cast decisions                              |

##### Callback Management

| Feature                 | Description                                                     |
| ----------------------- | --------------------------------------------------------------- |
| **Pull from Auditions** | Import callback list from initial auditions                     |
| **Same Interface**      | Headshot → Resume flip with decision buttons                    |
| **Role Assignment**     | Assign specific roles being considered                          |
| **Save States**         | Save to Casting or save to Callback List with updated decisions |

##### Casting Board (Lucidchart-style Interface)

| Feature                  | Description                                                   |
| ------------------------ | ------------------------------------------------------------- |
| **Role Columns**         | Left side displays squares for each role to be filled         |
| **Talent Pool**          | Right side shows all auditioned talent for drag-and-drop      |
| **Drag & Drop**          | Drag talent photos onto role squares; name appears under role |
| **Eject Button**         | Remove talent from role and set aside for reconsideration     |
| **Lock Button**          | Lock a role to prevent accidental changes                     |
| **Tier/Hide**            | Hide leads or ensemble to focus on specific role groups       |
| **Deck Area**            | Bottom area to shuffle and organize talent being considered   |
| **Save Draft**           | Save current casting state to return later                    |
| **Submit Casting**       | Finalize casting with confirmation prompt                     |
| **Cast Notification**    | Email talent their role using merge fields (name, role, show) |
| **Email Composer**       | Customize cast notification emails with merge fields          |
| **Cast List Generation** | Auto-generate cast list with names, roles, contact info       |

#### Production Management

##### Show/Project Creation

| Feature              | Description                                    |
| -------------------- | ---------------------------------------------- |
| **Project Setup**    | Create new production with title, dates, venue |
| **Role Definition**  | Define all roles/positions needed              |
| **Staff Assignment** | Add staff members with specific permissions    |
| **Department Tabs**  | Organize by production department              |

##### Document Management

| Feature                | Description                                                               |
| ---------------------- | ------------------------------------------------------------------------- |
| **W2/I-9 Upload**      | Upload employee tax documents; syncs to talent's secure storage           |
| **Call Sheet Storage** | Store and distribute call sheets                                          |
| **Cast Lists**         | Maintain cast contact and role information                                |
| **Script Storage**     | Master script with version control                                        |
| **Minus Tracks**       | Audio tracks shareable with permission controls (copyright consideration) |

##### Production Notes (Department Tabs)

| Department             | Content                                             |
| ---------------------- | --------------------------------------------------- |
| **Lighting**           | Light plots, cue sheets, equipment lists            |
| **Director's Vision**  | Concept documents, vision statements, research      |
| **Makeup/Hair**        | Design documents, character breakdowns              |
| **Costuming**          | Costume plots, measurements, fitting schedules      |
| **Scenic**             | Set designs, ground plans, construction drawings    |
| **Dramaturg**          | Research packets, program notes, historical context |
| **Assistant Director** | Blocking notes, rehearsal reports                   |
| **Props**              | Props lists, sourcing documents, tracking           |
| **Choreographer**      | Dance notation, video references, spacing charts    |

##### Calendar & Scheduling

| Feature                 | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| **Rehearsal Calendar**  | Create and manage rehearsal schedule                 |
| **Cast Tagging**        | Tag which cast members are called for each rehearsal |
| **Time/Date Edits**     | Modify schedule with change tracking                 |
| **Push Notifications**  | Alert talent of schedule changes                     |
| **Email Notifications** | Send schedule updates via email                      |
| **Conflict View**       | See talent availability conflicts                    |

##### Budget & Receipts

| Feature                    | Description                             |
| -------------------------- | --------------------------------------- |
| **Budget Tracking**        | Track production budget by department   |
| **Receipt Upload**         | Upload receipts for expenses            |
| **Reimbursement Requests** | Staff can submit reimbursement requests |
| **Approval Workflow**      | Producers approve/deny reimbursements   |

#### Communication

| Feature                | Description                                     |
| ---------------------- | ----------------------------------------------- |
| **Message Center**     | Send messages to talent, staff, other producers |
| **Bulk Messaging**     | Send to entire cast or filtered groups          |
| **Email Integration**  | Messages can be delivered via email             |
| **Announcement Board** | Post updates visible to all show participants   |

---

### 1.6 Permission Levels & Access Control

The platform implements granular role-based access control (RBAC) to ensure users only see what they need.

#### Producer Organization Roles

| Role                   | Description                | Access Level                                              |
| ---------------------- | -------------------------- | --------------------------------------------------------- |
| **Owner**              | Organization owner/admin   | Full access to all features, billing, user management     |
| **Admin**              | Organization administrator | Full access except billing and ownership transfer         |
| **Producer**           | Production lead            | Create/manage shows, full casting access, budget approval |
| **Associate Producer** | Assistant producer         | View all, limited edit on assigned shows                  |

#### Per-Show Roles

| Role                        | Access                                                                                     | Restrictions                                      |
| --------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| **Director**                | Casting board, audition review, production notes (all), schedule, cast communication       | No budget, no tax documents                       |
| **Music Director**          | Casting board (view), audition review, minus tracks, schedule                              | Limited casting (can recommend, not finalize)     |
| **Choreographer**           | Casting board (view), audition review, choreography notes, schedule                        | No other department notes                         |
| **Stage Manager**           | Full schedule control, call sheets, cast lists, production notes (all), cast communication | No casting, no budget approval                    |
| **Assistant Stage Manager** | Schedule (view/edit), call sheets, cast lists, rehearsal reports                           | No casting, no budget                             |
| **Production Manager**      | Budget, receipts, vendor management, schedule                                              | No casting, no artistic notes                     |
| **Technical Director**      | Scenic notes, lighting notes, schedule                                                     | No casting, no budget approval                    |
| **Lighting Designer**       | Lighting notes (full), other notes (view only)                                             | No casting, no budget                             |
| **Sound Designer**          | Sound notes (full), minus tracks, other notes (view only)                                  | No casting, no budget                             |
| **Costume Designer**        | Costume notes (full), cast measurements, other notes (view only)                           | No casting, no budget                             |
| **Scenic Designer**         | Scenic notes (full), other notes (view only)                                               | No casting, no budget                             |
| **Props Master**            | Props notes (full), budget (props line items only)                                         | No casting                                        |
| **Hair/Makeup Designer**    | Hair/Makeup notes (full), other notes (view only)                                          | No casting, no budget                             |
| **Dramaturg**               | Dramaturg notes (full), director's vision (view), cast communication (limited)             | No casting, no budget                             |
| **Assistant Director**      | AD notes (full), blocking notes, schedule (view), cast list (view)                         | No budget, recommend only on casting              |
| **Crew Member**             | Schedule (own calls only), department notes (assigned department only)                     | View only, no edit rights                         |
| **Cast Member (Talent)**    | Own schedule, own call sheets, scripts (if shared), minus tracks (if shared)               | No access to other cast info, no production notes |

#### Permission Matrix by Feature

| Feature                     | Owner | Admin | Director | SM  | Designer | Crew | Cast |
| --------------------------- | ----- | ----- | -------- | --- | -------- | ---- | ---- |
| Billing & Subscription      | ✅    | ❌    | ❌       | ❌  | ❌       | ❌   | ❌   |
| User Management             | ✅    | ✅    | ❌       | ❌  | ❌       | ❌   | ❌   |
| Create Shows                | ✅    | ✅    | ❌       | ❌  | ❌       | ❌   | ❌   |
| Audition Management         | ✅    | ✅    | ✅       | ❌  | ❌       | ❌   | ❌   |
| Casting Board (Edit)        | ✅    | ✅    | ✅       | ❌  | ❌       | ❌   | ❌   |
| Casting Board (View)        | ✅    | ✅    | ✅       | ✅  | 👁️       | ❌   | ❌   |
| Finalize Casting            | ✅    | ✅    | ✅       | ❌  | ❌       | ❌   | ❌   |
| Schedule (Edit)             | ✅    | ✅    | ✅       | ✅  | ❌       | ❌   | ❌   |
| Schedule (View)             | ✅    | ✅    | ✅       | ✅  | ✅       | 👁️   | 👁️   |
| Call Sheets                 | ✅    | ✅    | ✅       | ✅  | ✅       | 👁️   | 👁️   |
| Cast List (Full)            | ✅    | ✅    | ✅       | ✅  | ❌       | ❌   | ❌   |
| Cast List (Names Only)      | ✅    | ✅    | ✅       | ✅  | ✅       | ✅   | ✅   |
| Production Notes (All)      | ✅    | ✅    | ✅       | ✅  | ❌       | ❌   | ❌   |
| Production Notes (Own Dept) | ✅    | ✅    | ✅       | ✅  | ✅       | 👁️   | ❌   |
| Scripts                     | ✅    | ✅    | ✅       | ✅  | 👁️       | ❌   | 👁️\* |
| Minus Tracks                | ✅    | ✅    | ✅       | ✅  | 👁️       | ❌   | 👁️\* |
| Budget (Full)               | ✅    | ✅    | ❌       | ❌  | ❌       | ❌   | ❌   |
| Budget (Own Dept)           | ✅    | ✅    | ❌       | ❌  | ✅       | ❌   | ❌   |
| Receipts/Reimbursement      | ✅    | ✅    | ❌       | ❌  | ✅       | ❌   | ❌   |
| W2/I-9 Documents            | ✅    | ✅    | ❌       | ❌  | ❌       | ❌   | ❌   |
| Message Cast                | ✅    | ✅    | ✅       | ✅  | ❌       | ❌   | ❌   |
| Announcements               | ✅    | ✅    | ✅       | ✅  | ❌       | ❌   | ❌   |

**Legend:** ✅ = Full Access | 👁️ = View Only | 👁️\* = If Shared | ❌ = No Access

#### Multi-Decision Maker Support

For productions with multiple directors or decision-makers during casting:

| Feature                   | Description                                                         |
| ------------------------- | ------------------------------------------------------------------- |
| **Collaborative Casting** | Multiple users can view and edit the casting board simultaneously   |
| **Real-time Sync**        | Changes sync across all connected users instantly                   |
| **Decision Attribution**  | Track who made each casting decision                                |
| **Voting/Consensus**      | Optional voting mode where multiple decision-makers must agree      |
| **Comments**              | Add comments to specific casting choices for discussion             |
| **Lock Override**         | Only users with equal or higher permission can unlock a locked role |

---

### 1.7 Security & Compliance Considerations

| Requirement                   | Implementation                                              |
| ----------------------------- | ----------------------------------------------------------- |
| **SOC 2 Type II**             | Required for storing W2, I-9, and other sensitive documents |
| **Encryption at Rest**        | AES-256 encryption for all stored documents                 |
| **Encryption in Transit**     | TLS 1.3 for all communications                              |
| **Access Logging**            | Audit trail for all document access                         |
| **Data Residency**            | Option for US-only data storage                             |
| **GDPR Compliance**           | For EU talent; data export, deletion rights                 |
| **PCI Compliance**            | Via Stripe for payment processing                           |
| **Two-Factor Authentication** | Required for producer accounts, optional for talent         |
| **Session Management**        | Configurable session timeouts, device management            |

---

### 1.8 Future Considerations

| Feature                      | Description                                                  | Priority |
| ---------------------------- | ------------------------------------------------------------ | -------- |
| **Mobile Apps**              | Native iOS/Android apps for talent and producers             | Phase 2  |
| **Video Auditions**          | Record and submit video auditions directly in platform       | Phase 2  |
| **AI Casting Suggestions**   | Recommend talent based on role requirements and past casting | Phase 3  |
| **Contract Management**      | Digital contract signing with e-signature                    | Phase 2  |
| **Payroll Integration**      | Connect with payroll providers for direct payment            | Phase 3  |
| **Venue Management**         | Manage multiple venues, room booking                         | Phase 2  |
| **Ticket Sales Integration** | Connect with box office systems                              | Phase 3  |
| **Agent Portal**             | Allow talent agents to manage multiple clients               | Phase 2  |

---

## 2. Technology Stack

### 2.1 Frontend

| Technology       | Version | Purpose                                        |
| ---------------- | ------- | ---------------------------------------------- |
| **Next.js**      | 16.x    | Full-stack React framework with App Router     |
| **React**        | 19.x    | UI library                                     |
| **TypeScript**   | 5.x     | Type safety                                    |
| **Tailwind CSS** | 4.x     | Utility-first styling                          |
| **DaisyUI**      | 5.x     | Component library (theatrical/elegant theming) |
| **Lucide React** | Latest  | Icon system                                    |
| **React DnD**    | Latest  | Drag-and-drop for casting board                |
| **FullCalendar** | Latest  | Calendar/scheduling views                      |
| **React PDF**    | Latest  | PDF generation for resumes                     |
| **QRCode.react** | Latest  | QR code generation                             |

### 2.2 Backend

| Technology             | Version | Purpose                                        |
| ---------------------- | ------- | ---------------------------------------------- |
| **Next.js API Routes** | 16.x    | REST API endpoints                             |
| **tRPC**               | 11.x    | Type-safe API layer (optional but recommended) |
| **Drizzle ORM**        | Latest  | Type-safe database queries                     |
| **PostgreSQL**         | 16.x    | Primary database                               |
| **Redis**              | 7.x     | Caching, sessions, real-time pub/sub           |
| **Stripe**             | Latest  | Subscription billing                           |
| **Resend**             | Latest  | Transactional email                            |
| **Twilio**             | Latest  | SMS notifications (optional)                   |

### 2.3 Infrastructure

| Technology                      | Purpose                            |
| ------------------------------- | ---------------------------------- |
| **Vercel**                      | Frontend hosting, edge functions   |
| **Neon** or **Supabase**        | Managed PostgreSQL with branching  |
| **Upstash**                     | Serverless Redis                   |
| **AWS S3** or **Cloudflare R2** | Object storage for media/documents |
| **Cloudflare**                  | CDN, image optimization            |
| **Doppler** or **Infisical**    | Secrets management (SOC 2)         |

### 2.4 Development Tools

| Technology         | Purpose                  |
| ------------------ | ------------------------ |
| **pnpm**           | Package manager          |
| **Vitest**         | Unit/integration testing |
| **Playwright**     | E2E testing              |
| **ESLint 9**       | Linting with flat config |
| **Prettier**       | Code formatting          |
| **Husky**          | Git hooks                |
| **lint-staged**    | Pre-commit checks        |
| **GitHub Actions** | CI/CD                    |

---

## 3. Project Structure

### 3.1 Monorepo Structure

```
dramatis-hq/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy-preview.yml
│   │   └── deploy-production.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group (login, signup, forgot-password)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── signup/talent/page.tsx
│   │   ├── signup/producer/page.tsx
│   │   └── layout.tsx
│   ├── (talent)/                 # Talent dashboard group
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── profile/edit/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── messages/page.tsx
│   │   ├── documents/page.tsx
│   │   ├── auditions/page.tsx
│   │   └── layout.tsx
│   ├── (producer)/               # Producer dashboard group
│   │   ├── dashboard/page.tsx
│   │   ├── company/page.tsx
│   │   ├── shows/page.tsx
│   │   ├── shows/[showId]/
│   │   │   ├── page.tsx
│   │   │   ├── cast/page.tsx
│   │   │   ├── schedule/page.tsx
│   │   │   ├── scripts/page.tsx
│   │   │   ├── notes/page.tsx
│   │   │   └── budget/page.tsx
│   │   ├── auditions/page.tsx
│   │   ├── auditions/[auditionId]/
│   │   │   ├── page.tsx
│   │   │   ├── form-builder/page.tsx
│   │   │   ├── check-in/page.tsx
│   │   │   ├── review/page.tsx
│   │   │   └── casting-board/page.tsx
│   │   ├── messages/page.tsx
│   │   ├── documents/page.tsx
│   │   ├── staff/page.tsx
│   │   └── layout.tsx
│   ├── (public)/                 # Public pages
│   │   ├── talent/[username]/page.tsx
│   │   ├── company/[slug]/page.tsx
│   │   └── auditions/[slug]/page.tsx
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── trpc/[trpc]/route.ts
│   │   ├── webhooks/
│   │   │   ├── stripe/route.ts
│   │   │   └── resend/route.ts
│   │   ├── upload/
│   │   │   ├── image/route.ts
│   │   │   ├── document/route.ts
│   │   │   └── media/route.ts
│   │   └── qr/[code]/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Calendar.tsx
│   │   ├── DataTable.tsx
│   │   ├── DragDropList.tsx
│   │   ├── FileUpload.tsx
│   │   ├── QRCode.tsx
│   │   └── Skeleton.tsx
│   ├── talent/                   # Talent-specific components
│   │   ├── ProfileCard.tsx
│   │   ├── ProfileEditor.tsx
│   │   ├── ResumePreview.tsx
│   │   ├── AvailabilityCalendar.tsx
│   │   ├── SkillsInput.tsx
│   │   ├── WorkHistoryForm.tsx
│   │   └── PhysicalAttributesForm.tsx
│   ├── producer/                 # Producer-specific components
│   │   ├── ShowCard.tsx
│   │   ├── CastingBoard/
│   │   │   ├── CastingBoard.tsx
│   │   │   ├── RoleColumn.tsx
│   │   │   ├── TalentCard.tsx
│   │   │   ├── DeckArea.tsx
│   │   │   └── LockButton.tsx
│   │   ├── AuditionFlow/
│   │   │   ├── CheckInScanner.tsx
│   │   │   ├── ProfileReview.tsx
│   │   │   ├── CallbackSelector.tsx
│   │   │   └── AuditionNotes.tsx
│   │   ├── ProductionNotes/
│   │   │   ├── NotesTabPanel.tsx
│   │   │   ├── DepartmentTab.tsx
│   │   │   └── NoteEditor.tsx
│   │   ├── FormBuilder/
│   │   │   ├── FormBuilder.tsx
│   │   │   ├── QuestionTypes.tsx
│   │   │   └── FormPreview.tsx
│   │   ├── ScheduleEditor.tsx
│   │   ├── CallSheetGenerator.tsx
│   │   └── BudgetTracker.tsx
│   ├── shared/                   # Shared components
│   │   ├── MessageCenter.tsx
│   │   ├── DocumentViewer.tsx
│   │   ├── MediaGallery.tsx
│   │   ├── NotificationBell.tsx
│   │   └── ShareModal.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       ├── Footer.tsx
│       └── MobileNav.tsx
├── lib/
│   ├── db/
│   │   ├── index.ts              # Drizzle client
│   │   ├── schema/
│   │   │   ├── users.ts
│   │   │   ├── talent.ts
│   │   │   ├── producers.ts
│   │   │   ├── shows.ts
│   │   │   ├── auditions.ts
│   │   │   ├── casting.ts
│   │   │   ├── documents.ts
│   │   │   ├── messages.ts
│   │   │   ├── schedules.ts
│   │   │   └── index.ts
│   │   └── migrations/
│   ├── trpc/
│   │   ├── router.ts
│   │   ├── context.ts
│   │   └── procedures/
│   │       ├── talent.ts
│   │       ├── producer.ts
│   │       ├── audition.ts
│   │       ├── casting.ts
│   │       └── messaging.ts
│   ├── auth/
│   │   ├── config.ts
│   │   ├── providers.ts
│   │   └── middleware.ts
│   ├── storage/
│   │   ├── s3.ts
│   │   ├── encryption.ts
│   │   └── presigned-urls.ts
│   ├── email/
│   │   ├── resend.ts
│   │   └── templates/
│   │       ├── callback-notification.tsx
│   │       ├── cast-announcement.tsx
│   │       ├── schedule-reminder.tsx
│   │       └── document-request.tsx
│   ├── pdf/
│   │   ├── resume-generator.ts
│   │   └── call-sheet-generator.ts
│   ├── billing/
│   │   ├── stripe.ts
│   │   ├── plans.ts
│   │   └── webhooks.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── dates.ts
│   │   └── qr.ts
│   └── constants/
│       ├── unions.ts
│       ├── skills.ts
│       ├── departments.ts
│       └── permissions.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useProfile.ts
│   ├── useCastingBoard.ts
│   ├── useCalendar.ts
│   ├── useMessages.ts
│   └── useNotifications.ts
├── contexts/
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── NotificationContext.tsx
├── types/
│   ├── talent.ts
│   ├── producer.ts
│   ├── audition.ts
│   ├── show.ts
│   └── api.ts
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── e2e/
│   ├── auth.spec.ts
│   ├── talent-profile.spec.ts
│   ├── audition-flow.spec.ts
│   ├── casting-board.spec.ts
│   └── global-setup.ts
├── public/
│   ├── images/
│   └── fonts/
├── scripts/
│   ├── seed-database.ts
│   ├── generate-test-data.ts
│   └── migrate.ts
├── .env.example
├── .env.local
├── .gitignore
├── AGENTS.md
├── CHANGELOG.md
├── README.md
├── docker-compose.yml
├── drizzle.config.ts
├── eslint.config.mjs
├── next.config.mjs
├── package.json
├── playwright.config.ts
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## 4. Database Architecture

### 4.1 Entity Relationship Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   users     │────<│ talent_      │     │  producers  │
│             │     │ profiles     │     │             │
└─────────────┘     └──────────────┘     └─────────────┘
       │                   │                    │
       │                   │                    │
       ▼                   ▼                    ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  documents  │     │   skills     │     │   shows     │
└─────────────┘     └──────────────┘     └─────────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          ▼                    ▼                    ▼
                   ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
                   │  auditions   │     │    roles    │     │  schedules  │
                   └──────────────┘     └─────────────┘     └─────────────┘
                          │                    │
                          ▼                    ▼
                   ┌──────────────┐     ┌─────────────┐
                   │ audition_    │     │  cast_      │
                   │ submissions  │     │  members    │
                   └──────────────┘     └─────────────┘
```

### 4.2 Schema Definitions (Drizzle ORM)

```typescript
// lib/db/schema/users.ts
import { pgTable, uuid, varchar, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

export const userTypeEnum = pgEnum("user_type", ["talent", "producer", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  userType: userTypeEnum("user_type").notNull(),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// lib/db/schema/talent.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "non_binary",
  "other",
  "prefer_not_to_say",
]);
export const ethnicityEnum = pgEnum("ethnicity", [
  "african_american",
  "asian",
  "caucasian",
  "hispanic_latino",
  "middle_eastern",
  "native_american",
  "pacific_islander",
  "south_asian",
  "mixed",
  "other",
  "prefer_not_to_say",
]);

export const talentProfiles = pgTable("talent_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),

  // Basic Info
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  stageName: varchar("stage_name", { length: 100 }),
  pronouns: varchar("pronouns", { length: 50 }),
  bio: text("bio"),

  // Contact
  phone: varchar("phone", { length: 20 }),
  website: varchar("website", { length: 255 }),
  socialLinks: jsonb("social_links").$type<{
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
    imdb?: string;
  }>(),

  // Physical Attributes (private, searchable by producers)
  heightInches: integer("height_inches"),
  weightLbs: integer("weight_lbs"),
  eyeColor: varchar("eye_color", { length: 30 }),
  hairColor: varchar("hair_color", { length: 30 }),
  gender: genderEnum("gender"),
  ethnicity: ethnicityEnum("ethnicity"),
  ageRangeLow: integer("age_range_low"),
  ageRangeHigh: integer("age_range_high"),

  // Union Memberships (stored as array)
  unionMemberships: jsonb("union_memberships").$type<string[]>().default([]),

  // Visibility
  isPublic: boolean("is_public").default(true),
  publicProfileSlug: varchar("public_profile_slug", { length: 100 }).unique(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const talentHeadshots = pgTable("talent_headshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  talentId: uuid("talent_id")
    .references(() => talentProfiles.id)
    .notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  isPrimary: boolean("is_primary").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const talentVideoSamples = pgTable("talent_video_samples", {
  id: uuid("id").primaryKey().defaultRandom(),
  talentId: uuid("talent_id")
    .references(() => talentProfiles.id)
    .notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  durationSeconds: integer("duration_seconds"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workHistoryTypeEnum = pgEnum("work_history_type", [
  "theater",
  "film",
  "television",
  "commercial",
  "voice",
  "other",
]);

export const talentWorkHistory = pgTable("talent_work_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  talentId: uuid("talent_id")
    .references(() => talentProfiles.id)
    .notNull(),
  type: workHistoryTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(), // Show/Film name
  role: varchar("role", { length: 200 }).notNull(),
  company: varchar("company", { length: 200 }), // Theater/Production company
  director: varchar("director", { length: 200 }),
  year: integer("year"),
  location: varchar("location", { length: 200 }),
  notes: text("notes"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const talentEducation = pgTable("talent_education", {
  id: uuid("id").primaryKey().defaultRandom(),
  talentId: uuid("talent_id")
    .references(() => talentProfiles.id)
    .notNull(),
  institution: varchar("institution", { length: 200 }).notNull(),
  degree: varchar("degree", { length: 200 }),
  field: varchar("field", { length: 200 }),
  yearCompleted: integer("year_completed"),
  notes: text("notes"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const talentSkills = pgTable("talent_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  talentId: uuid("talent_id")
    .references(() => talentProfiles.id)
    .notNull(),
  skillId: uuid("skill_id")
    .references(() => skills.id)
    .notNull(),
  proficiency: varchar("proficiency", { length: 50 }), // beginner, intermediate, advanced, expert
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  category: varchar("category", { length: 100 }).notNull(), // dance, music, combat, language, accent, etc.
  isActive: boolean("is_active").default(true),
});

export const talentAvailability = pgTable("talent_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  talentId: uuid("talent_id")
    .references(() => talentProfiles.id)
    .notNull(),
  date: timestamp("date").notNull(),
  isAvailable: boolean("is_available").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// lib/db/schema/producers.ts
import { pgTable, uuid, varchar, text, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const producers = pgTable("producers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),

  // Company Info
  companyName: varchar("company_name", { length: 200 }).notNull(),
  companySlug: varchar("company_slug", { length: 100 }).notNull().unique(),
  logoUrl: varchar("logo_url", { length: 500 }),
  about: text("about"),
  location: varchar("location", { length: 200 }),
  website: varchar("website", { length: 255 }),

  // Union Status
  unionAffiliations: jsonb("union_affiliations").$type<string[]>().default([]),

  // Subscription
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("inactive"),
  subscriptionTier: varchar("subscription_tier", { length: 50 }),
  subscriptionEndsAt: timestamp("subscription_ends_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const producerGalleryImages = pgTable("producer_gallery_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  producerId: uuid("producer_id")
    .references(() => producers.id)
    .notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  caption: varchar("caption", { length: 500 }),
  showId: uuid("show_id").references(() => shows.id),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const producerStaff = pgTable("producer_staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  producerId: uuid("producer_id")
    .references(() => producers.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  role: varchar("role", { length: 100 }).notNull(), // admin, casting_director, stage_manager, etc.
  permissions: jsonb("permissions").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// lib/db/schema/shows.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { producers } from "./producers";

export const showStatusEnum = pgEnum("show_status", [
  "planning",
  "auditions",
  "rehearsal",
  "production",
  "closed",
]);

export const shows = pgTable("shows", {
  id: uuid("id").primaryKey().defaultRandom(),
  producerId: uuid("producer_id")
    .references(() => producers.id)
    .notNull(),

  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  playwright: varchar("playwright", { length: 200 }),
  director: varchar("director", { length: 200 }),

  status: showStatusEnum("status").default("planning"),

  // Dates
  rehearsalStartDate: timestamp("rehearsal_start_date"),
  openingDate: timestamp("opening_date"),
  closingDate: timestamp("closing_date"),

  // Venue
  venue: varchar("venue", { length: 200 }),
  venueAddress: text("venue_address"),

  // Media
  posterUrl: varchar("poster_url", { length: 500 }),

  isPublic: boolean("is_public").default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  showId: uuid("show_id")
    .references(() => shows.id)
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  tier: varchar("tier", { length: 50 }).default("ensemble"), // lead, supporting, ensemble
  isVisible: boolean("is_visible").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const castMembers = pgTable("cast_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleId: uuid("role_id")
    .references(() => roles.id)
    .notNull(),
  talentId: uuid("talent_id")
    .references(() => talentProfiles.id)
    .notNull(),
  status: varchar("status", { length: 50 }).default("cast"), // cast, understudy, swing
  castDate: timestamp("cast_date").defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// lib/db/schema/auditions.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { shows } from "./shows";
import { talentProfiles } from "./talent";

export const auditionStatusEnum = pgEnum("audition_status", [
  "draft",
  "open",
  "closed",
  "cancelled",
]);

export const auditions = pgTable("auditions", {
  id: uuid("id").primaryKey().defaultRandom(),
  showId: uuid("show_id")
    .references(() => shows.id)
    .notNull(),

  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),

  status: auditionStatusEnum("status").default("draft"),

  // Dates
  auditionDate: timestamp("audition_date"),
  callbackDate: timestamp("callback_date"),
  submissionDeadline: timestamp("submission_deadline"),

  // Location
  location: varchar("location", { length: 200 }),
  address: text("address"),
  isVirtual: boolean("is_virtual").default(false),
  virtualLink: varchar("virtual_link", { length: 500 }),

  // Form Configuration
  formConfig: jsonb("form_config").$type<{
    questions: Array<{
      id: string;
      type: "text" | "textarea" | "select" | "multiselect" | "file" | "checkbox";
      label: string;
      required: boolean;
      options?: string[];
    }>;
  }>(),

  // Check-in QR Code
  checkInCode: varchar("check_in_code", { length: 50 }).unique(),

  isPublic: boolean("is_public").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditionSubmissionStatusEnum = pgEnum("audition_submission_status", [
  "submitted",
  "checked_in",
  "reviewed",
  "callback",
  "callback_with_role",
  "rejected",
  "cast",
]);

export const auditionSubmissions = pgTable("audition_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  auditionId: uuid("audition_id")
    .references(() => auditions.id)
    .notNull(),
  talentId: uuid("talent_id")
    .references(() => talentProfiles.id)
    .notNull(),

  status: auditionSubmissionStatusEnum("status").default("submitted"),

  // Form Responses
  formResponses: jsonb("form_responses").$type<Record<string, unknown>>(),

  // Casting Board Position
  roleId: uuid("role_id").references(() => roles.id), // For callback_with_role
  boardPosition: jsonb("board_position").$type<{
    column: string; // role_id or 'deck'
    order: number;
  }>(),

  // Review
  notes: text("notes"),
  rating: integer("rating"), // 1-5
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),

  // Timestamps
  submittedAt: timestamp("submitted_at").defaultNow(),
  checkedInAt: timestamp("checked_in_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// lib/db/schema/documents.ts
import { pgTable, uuid, varchar, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { users } from "./users";

export const documentTypeEnum = pgEnum("document_type", [
  "w2",
  "i9",
  "contract",
  "call_sheet",
  "script",
  "minus_track",
  "other",
]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .references(() => users.id)
    .notNull(),
  uploadedBy: uuid("uploaded_by")
    .references(() => users.id)
    .notNull(),

  type: documentTypeEnum("type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Storage (encrypted for sensitive docs)
  storageKey: varchar("storage_key", { length: 500 }).notNull(),
  encryptionKeyId: varchar("encryption_key_id", { length: 100 }), // For SOC 2 compliance
  mimeType: varchar("mime_type", { length: 100 }),
  sizeBytes: integer("size_bytes"),

  // Access Control
  isEncrypted: boolean("is_encrypted").default(false),

  // Linking (for producer-uploaded docs)
  showId: uuid("show_id").references(() => shows.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const documentAccess = pgTable("document_access", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .references(() => documents.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  canView: boolean("can_view").default(true),
  canDownload: boolean("can_download").default(false),
  grantedBy: uuid("granted_by")
    .references(() => users.id)
    .notNull(),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

// lib/db/schema/messages.ts
import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  lastReadAt: timestamp("last_read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id)
    .notNull(),
  senderId: uuid("sender_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// lib/db/schema/schedules.ts
import { pgTable, uuid, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { shows } from "./shows";

export const scheduleEventTypeEnum = pgEnum("schedule_event_type", [
  "rehearsal",
  "performance",
  "tech_rehearsal",
  "dress_rehearsal",
  "fitting",
  "meeting",
  "photo_call",
  "other",
]);

export const scheduleEvents = pgTable("schedule_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  showId: uuid("show_id")
    .references(() => shows.id)
    .notNull(),

  type: scheduleEventTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),

  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),

  location: varchar("location", { length: 200 }),

  // Who's called
  calledRoles: jsonb("called_roles").$type<string[]>().default([]),
  calledDepartments: jsonb("called_departments").$type<string[]>().default([]),

  // Notification settings
  reminderSent: boolean("reminder_sent").default(false),
  reminderMinutes: integer("reminder_minutes").default(60),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// lib/db/schema/production_notes.ts
import { pgTable, uuid, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { shows } from "./shows";
import { users } from "./users";

export const departmentEnum = pgEnum("department", [
  "lighting",
  "makeup_hair",
  "costuming",
  "scenic",
  "dramaturg",
  "ad_notes",
  "props",
  "choreographer",
  "sound",
  "general",
]);

export const productionNotes = pgTable("production_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  showId: uuid("show_id")
    .references(() => shows.id)
    .notNull(),
  department: departmentEnum("department").notNull(),

  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),

  // Linking
  sceneReference: varchar("scene_reference", { length: 100 }),
  pageReference: varchar("page_reference", { length: 50 }),

  // Status
  status: varchar("status", { length: 50 }).default("open"), // open, in_progress, resolved
  priority: varchar("priority", { length: 50 }).default("normal"), // low, normal, high, urgent

  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  assignedTo: uuid("assigned_to").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

// lib/db/schema/budget.ts
import { pgTable, uuid, varchar, text, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { shows } from "./shows";
import { users } from "./users";

export const budgetCategories = pgTable("budget_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  showId: uuid("show_id")
    .references(() => shows.id)
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  budgetAmount: decimal("budget_amount", { precision: 10, scale: 2 }),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .references(() => budgetCategories.id)
    .notNull(),

  description: varchar("description", { length: 500 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),

  vendor: varchar("vendor", { length: 200 }),
  receiptUrl: varchar("receipt_url", { length: 500 }),

  // Reimbursement
  isReimbursement: boolean("is_reimbursement").default(false),
  reimburseTo: uuid("reimburse_to").references(() => users.id),
  reimbursementStatus: varchar("reimbursement_status", { length: 50 }).default("pending"),

  submittedBy: uuid("submitted_by")
    .references(() => users.id)
    .notNull(),
  approvedBy: uuid("approved_by").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### 4.3 Database Indexes (Performance)

```typescript
// Add indexes for common query patterns
export const talentProfilesIndexes = {
  publicSlug: index("talent_profiles_public_slug_idx").on(talentProfiles.publicProfileSlug),
  userId: index("talent_profiles_user_id_idx").on(talentProfiles.userId),
};

export const auditionSubmissionsIndexes = {
  auditionId: index("audition_submissions_audition_id_idx").on(auditionSubmissions.auditionId),
  talentId: index("audition_submissions_talent_id_idx").on(auditionSubmissions.talentId),
  status: index("audition_submissions_status_idx").on(auditionSubmissions.status),
};

export const showsIndexes = {
  producerId: index("shows_producer_id_idx").on(shows.producerId),
  status: index("shows_status_idx").on(shows.status),
};
```

### 4.4 Migrations Approach

Use Drizzle Kit for migrations:

```typescript
// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema/index.ts",
  out: "./lib/db/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

Migration commands in `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## 5. Backend API Design

### 5.1 API Architecture

Use **tRPC** for type-safe API communication with Next.js App Router:

```typescript
// lib/trpc/router.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./context";
import { talentRouter } from "./procedures/talent";
import { producerRouter } from "./procedures/producer";
import { auditionRouter } from "./procedures/audition";
import { castingRouter } from "./procedures/casting";
import { messagingRouter } from "./procedures/messaging";
import { documentRouter } from "./procedures/documents";
import { scheduleRouter } from "./procedures/schedule";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const talentProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.user.type !== "talent") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const producerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.user.type !== "producer") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const appRouter = router({
  talent: talentRouter,
  producer: producerRouter,
  audition: auditionRouter,
  casting: castingRouter,
  messaging: messagingRouter,
  document: documentRouter,
  schedule: scheduleRouter,
});

export type AppRouter = typeof appRouter;
```

### 5.2 Sample Procedure Implementations

```typescript
// lib/trpc/procedures/talent.ts
import { z } from "zod";
import { router, talentProcedure, publicProcedure } from "../router";
import { db } from "@/lib/db";
import { talentProfiles, talentSkills, talentWorkHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const talentRouter = router({
  // Get current user's profile
  getMyProfile: talentProcedure.query(async ({ ctx }) => {
    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, ctx.session.user.id),
      with: {
        headshots: true,
        videoSamples: true,
        workHistory: { orderBy: (wh, { desc }) => [desc(wh.year)] },
        education: true,
        skills: { with: { skill: true } },
      },
    });
    return profile;
  }),

  // Update profile
  updateProfile: talentProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        stageName: z.string().max(100).optional(),
        bio: z.string().max(5000).optional(),
        phone: z.string().max(20).optional(),
        website: z.string().url().optional(),
        socialLinks: z
          .object({
            instagram: z.string().optional(),
            twitter: z.string().optional(),
            linkedin: z.string().optional(),
            youtube: z.string().optional(),
            tiktok: z.string().optional(),
            imdb: z.string().optional(),
          })
          .optional(),
        heightInches: z.number().min(36).max(96).optional(),
        // ... other fields
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await db
        .update(talentProfiles)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(talentProfiles.userId, ctx.session.user.id))
        .returning();
      return updated[0];
    }),

  // Get public profile
  getPublicProfile: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const profile = await db.query.talentProfiles.findFirst({
        where: eq(talentProfiles.publicProfileSlug, input.slug),
        with: {
          headshots: { where: (h, { eq }) => eq(h.isPrimary, true) },
          videoSamples: true,
          workHistory: {
            orderBy: (wh, { desc }) => [desc(wh.year)],
            where: (wh, { eq }) => eq(wh.isPublic, true),
          },
        },
      });

      if (!profile || !profile.isPublic) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Remove private fields (physical attributes)
      const { heightInches, weightLbs, ...publicProfile } = profile;
      return publicProfile;
    }),

  // Add work history entry
  addWorkHistory: talentProcedure
    .input(
      z.object({
        type: z.enum(["theater", "film", "television", "commercial", "voice", "other"]),
        title: z.string().min(1).max(200),
        role: z.string().min(1).max(200),
        company: z.string().max(200).optional(),
        director: z.string().max(200).optional(),
        year: z.number().min(1900).max(2100).optional(),
        location: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await db.query.talentProfiles.findFirst({
        where: eq(talentProfiles.userId, ctx.session.user.id),
      });

      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      return db
        .insert(talentWorkHistory)
        .values({
          talentId: profile.id,
          ...input,
        })
        .returning();
    }),
});

// lib/trpc/procedures/casting.ts
import { z } from "zod";
import { router, producerProcedure } from "../router";
import { db } from "@/lib/db";
import { auditionSubmissions, roles, castMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendCastingEmail } from "@/lib/email/templates/cast-announcement";

export const castingRouter = router({
  // Get casting board state
  getCastingBoard: producerProcedure
    .input(z.object({ auditionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify producer has access to this audition
      const audition = await db.query.auditions.findFirst({
        where: eq(auditions.id, input.auditionId),
        with: {
          show: {
            with: { producer: true },
          },
        },
      });

      if (!audition || audition.show.producer.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Get all roles and submissions
      const showRoles = await db.query.roles.findMany({
        where: eq(roles.showId, audition.showId),
        orderBy: (r, { asc }) => [asc(r.sortOrder)],
      });

      const submissions = await db.query.auditionSubmissions.findMany({
        where: eq(auditionSubmissions.auditionId, input.auditionId),
        with: {
          talent: {
            with: { headshots: { where: (h, { eq }) => eq(h.isPrimary, true) } },
          },
        },
      });

      return { roles: showRoles, submissions };
    }),

  // Update casting board position (drag and drop)
  updateBoardPosition: producerProcedure
    .input(
      z.object({
        submissionId: z.string().uuid(),
        position: z.object({
          column: z.string(), // role_id or 'deck'
          order: z.number(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update position
      return db
        .update(auditionSubmissions)
        .set({
          boardPosition: input.position,
          roleId: input.position.column === "deck" ? null : input.position.column,
          updatedAt: new Date(),
        })
        .where(eq(auditionSubmissions.id, input.submissionId))
        .returning();
    }),

  // Lock a role (finalize casting)
  lockRole: producerProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        locked: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db
        .update(roles)
        .set({ isLocked: input.locked, updatedAt: new Date() })
        .where(eq(roles.id, input.roleId))
        .returning();
    }),

  // Finalize casting and send notifications
  finalizeCasting: producerProcedure
    .input(
      z.object({
        auditionId: z.string().uuid(),
        emailTemplate: z.object({
          subject: z.string(),
          body: z.string(), // Supports merge fields: {{name}}, {{role}}
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get all submissions with role assignments
      const submissions = await db.query.auditionSubmissions.findMany({
        where: and(
          eq(auditionSubmissions.auditionId, input.auditionId),
          eq(auditionSubmissions.status, "callback_with_role")
        ),
        with: {
          talent: { with: { user: true } },
          role: true,
        },
      });

      // Create cast members and send emails
      for (const submission of submissions) {
        // Create cast member
        await db.insert(castMembers).values({
          roleId: submission.roleId!,
          talentId: submission.talentId,
          status: "cast",
        });

        // Update submission status
        await db
          .update(auditionSubmissions)
          .set({ status: "cast" })
          .where(eq(auditionSubmissions.id, submission.id));

        // Send email with merge fields
        const emailBody = input.emailTemplate.body
          .replace("{{name}}", submission.talent.firstName)
          .replace("{{role}}", submission.role!.name);

        await sendCastingEmail({
          to: submission.talent.user.email,
          subject: input.emailTemplate.subject,
          body: emailBody,
        });
      }

      return { castCount: submissions.length };
    }),
});
```

### 5.3 REST API Routes (for webhooks and external integrations)

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { producers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await db
        .update(producers)
        .set({
          subscriptionStatus: subscription.status,
          subscriptionTier: subscription.items.data[0]?.price.lookup_key ?? "basic",
          subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
        })
        .where(eq(producers.stripeCustomerId, subscription.customer as string));
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await db
        .update(producers)
        .set({
          subscriptionStatus: "cancelled",
          subscriptionEndsAt: new Date(),
        })
        .where(eq(producers.stripeCustomerId, subscription.customer as string));
      break;
    }
  }

  return NextResponse.json({ received: true });
}

// app/api/qr/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const audition = await db.query.auditions.findFirst({
    where: eq(auditions.checkInCode, params.code),
    with: {
      show: { columns: { title: true, venue: true } },
    },
  });

  if (!audition) {
    return NextResponse.redirect(new URL("/not-found", req.url));
  }

  // Redirect to audition check-in page
  return NextResponse.redirect(new URL(`/auditions/${audition.id}/check-in`, req.url));
}
```

### 5.4 Authentication with NextAuth.js

```typescript
// lib/auth/config.ts
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          type: user.userType,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userType = user.type;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.type = token.userType as "talent" | "producer";
      return session;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/signup",
  },
});
```

---

## 6. Frontend Architecture

### 6.1 Component Design Principles

1. **Server Components by Default**: Use React Server Components for data fetching
2. **Client Components for Interactivity**: Mark with `'use client'` only when needed
3. **Skeleton Loaders**: Show loading states during data fetching
4. **Form State Sync**: Use React 19 form actions and useActionState
5. **Optimistic Updates**: For real-time features like casting board

### 6.2 Casting Board Component (Key Feature)

```typescript
// components/producer/CastingBoard/CastingBoard.tsx
'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { trpc } from '@/lib/trpc/client';
import { RoleColumn } from './RoleColumn';
import { TalentCard } from './TalentCard';
import { DeckArea } from './DeckArea';
import type { Role, AuditionSubmission } from '@/types';

interface CastingBoardProps {
  auditionId: string;
}

export function CastingBoard({ auditionId }: CastingBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data, refetch } = trpc.casting.getCastingBoard.useQuery({ auditionId });
  const updatePosition = trpc.casting.updateBoardPosition.useMutation({
    onSuccess: () => refetch(),
  });
  const lockRole = trpc.casting.lockRole.useMutation({
    onSuccess: () => refetch(),
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const submissionId = active.id as string;
    const targetColumn = over.data.current?.columnId ?? 'deck';
    const targetOrder = over.data.current?.order ?? 0;

    updatePosition.mutate({
      submissionId,
      position: { column: targetColumn, order: targetOrder },
    });
  }, [updatePosition]);

  if (!data) {
    return <CastingBoardSkeleton />;
  }

  const { roles, submissions } = data;

  // Organize submissions by column
  const submissionsByColumn = new Map<string, AuditionSubmission[]>();
  submissionsByColumn.set('deck', []);

  for (const role of roles) {
    submissionsByColumn.set(role.id, []);
  }

  for (const submission of submissions) {
    const column = submission.boardPosition?.column ?? 'deck';
    submissionsByColumn.get(column)?.push(submission);
  }

  // Sort by order within each column
  for (const [_, subs] of submissionsByColumn) {
    subs.sort((a, b) => (a.boardPosition?.order ?? 0) - (b.boardPosition?.order ?? 0));
  }

  const activeSubmission = submissions.find(s => s.id === activeId);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-2xl font-bold">Casting Board</h2>
        <div className="flex gap-2">
          <button
            className="btn btn-outline"
            onClick={() => {/* Toggle tier visibility */}}
          >
            Show/Hide Ensemble
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {/* Open finalize modal */}}
          >
            Finalize Casting
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-x-auto p-4 gap-4">
          {/* Role columns */}
          {roles
            .filter(role => role.isVisible)
            .map((role) => (
              <RoleColumn
                key={role.id}
                role={role}
                submissions={submissionsByColumn.get(role.id) ?? []}
                onLockToggle={(locked) => lockRole.mutate({ roleId: role.id, locked })}
              />
            ))}

          {/* Deck area (unassigned) */}
          <DeckArea submissions={submissionsByColumn.get('deck') ?? []} />
        </div>

        <DragOverlay>
          {activeSubmission && (
            <TalentCard submission={activeSubmission} isDragging />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
```

### 6.3 State Management

Use a combination of:

1. **tRPC React Query**: Server state management
2. **React Context**: Global UI state (theme, notifications)
3. **URL State**: Filters, pagination, tabs
4. **Local Component State**: Form inputs, modals

```typescript
// contexts/NotificationContext.tsx
'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { ...notification, id }]);

    if (notification.duration !== 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, notification.duration ?? 5000);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
```

---

## 7. Security Considerations

### 7.1 SOC 2 Compliance for Document Storage

```typescript
// lib/storage/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const scryptAsync = promisify(scrypt);

// Document encryption for SOC 2 compliance
export async function encryptDocument(
  buffer: Buffer,
  documentId: string
): Promise<{ encrypted: Buffer; keyId: string }> {
  // Generate unique key for this document
  const keyId = randomBytes(16).toString("hex");
  const salt = randomBytes(16);
  const key = (await scryptAsync(process.env.DOCUMENT_ENCRYPTION_SECRET!, salt, 32)) as Buffer;
  const iv = randomBytes(16);

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    salt,
    iv,
    cipher.update(buffer),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  // Store key reference in KMS (AWS KMS, HashiCorp Vault, etc.)
  await storeKeyReference(keyId, { salt: salt.toString("hex"), documentId });

  return { encrypted, keyId };
}

export async function decryptDocument(encrypted: Buffer, keyId: string): Promise<Buffer> {
  const keyRef = await getKeyReference(keyId);
  const salt = Buffer.from(keyRef.salt, "hex");

  const key = (await scryptAsync(process.env.DOCUMENT_ENCRYPTION_SECRET!, salt, 32)) as Buffer;
  const iv = encrypted.subarray(16, 32);
  const authTag = encrypted.subarray(-16);
  const data = encrypted.subarray(32, -16);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(data), decipher.final()]);
}

// Audit logging for document access
export async function logDocumentAccess(params: {
  documentId: string;
  userId: string;
  action: "view" | "download" | "upload" | "delete";
  ipAddress: string;
  userAgent: string;
}): Promise<void> {
  await db.insert(documentAuditLogs).values({
    ...params,
    timestamp: new Date(),
  });
}
```

### 7.2 Authentication & Authorization

```typescript
// lib/auth/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "./config";

// Protected routes middleware
export async function middleware(req: NextRequest) {
  const session = await auth();
  const pathname = req.nextUrl.pathname;

  // Public routes
  const publicRoutes = ["/", "/login", "/signup", "/talent/", "/company/", "/auditions/"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Require authentication
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Role-based access
  if (pathname.startsWith("/producer") && session.user.type !== "producer") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### 7.3 Security Headers

```typescript
// next.config.mjs
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

### 7.4 Input Validation

Use Zod schemas consistently across frontend and backend:

```typescript
// lib/utils/validation.ts
import { z } from "zod";

export const talentProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Invalid characters"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name too long"),
  email: z.string().email("Invalid email"),
  phone: z
    .string()
    .regex(/^\+?[\d\s-()]+$/, "Invalid phone number")
    .optional(),
  bio: z.string().max(5000).optional(),
  // Prevent XSS in text fields
  website: z
    .string()
    .url()
    .refine((url) => url.startsWith("https://"), "Must use HTTPS")
    .optional(),
});

export const fileUploadSchema = z.object({
  file: z.object({
    name: z.string(),
    size: z.number().max(10 * 1024 * 1024, "File too large (max 10MB)"),
    type: z
      .string()
      .refine(
        (type) => ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(type),
        "Invalid file type"
      ),
  }),
});
```

---

## 8. CI/CD Pipeline

### 8.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "22"
  PNPM_VERSION: "9"

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: TypeScript type check
        run: pnpm tsc --noEmit

      - name: ESLint
        run: pnpm lint

      - name: Prettier check
        run: pnpm exec prettier --check .

  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: dramatis_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run database migrations
        run: pnpm db:migrate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/dramatis_test

      - name: Run tests with coverage
        run: pnpm test:ci
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/dramatis_test

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [lint, test]
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: dramatis_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Run database migrations
        run: pnpm db:migrate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/dramatis_test

      - name: Seed test data
        run: pnpm db:seed
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/dramatis_test

      - name: Build application
        run: pnpm build
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/dramatis_test

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/dramatis_test
          CI: true

      - name: Upload test artifacts
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Audit dependencies
        run: pnpm audit --audit-level=high

      - name: Run CodeQL analysis
        uses: github/codeql-action/analyze@v3
        with:
          languages: javascript-typescript

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: .next/
          retention-days: 1

  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: [build, e2e]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-token: ${{ secrets.GITHUB_TOKEN }}

  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: [build, e2e, security]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### 8.2 ESLint Configuration

```javascript
// eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Extract react plugin from nextVitals
const nextVitalsArr = Array.isArray(nextVitals) ? nextVitals : [nextVitals];
const reactPlugin = nextVitalsArr.find((c) => c.plugins?.react)?.plugins?.react;

// Custom rule: error when a file exceeds ~10,000 tokens (~40,000 chars)
const maxFileSizePlugin = {
  rules: {
    "max-file-size": {
      create(context) {
        return {
          Program(node) {
            const chars = context.getSourceCode().getText().length;
            const approxTokens = Math.round(chars / 4);
            if (chars > 40000) {
              context.report({
                node,
                message: `File too large (~${approxTokens.toLocaleString()} tokens, limit ~10,000). Split this file into smaller modules.`,
              });
            }
          },
        };
      },
    },
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      local: maxFileSizePlugin,
      ...(reactPlugin ? { react: reactPlugin } : {}),
    },
    rules: {
      // File size limit
      "local/max-file-size": "error",

      // Complexity limits
      complexity: ["error", 15], // Stricter than default
      "max-depth": ["error", 4],
      "max-lines-per-function": ["warn", { max: 100, skipBlankLines: true, skipComments: true }],
      "max-params": ["warn", 5],

      // Console logging
      "no-console": "error",

      // TypeScript strictness
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      "@typescript-eslint/strict-boolean-expressions": "off", // Too strict for practical use

      // React best practices
      "react/button-has-type": "warn",
      "react/jsx-no-useless-fragment": "warn",
      "react/jsx-curly-brace-presence": ["warn", { props: "never", children: "never" }],
      "react/self-closing-comp": "warn",

      // Import organization
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "error",

      // Security
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    },
  },
  // Allow console in specific locations
  {
    files: ["__tests__/**", "e2e/**", "scripts/**", "lib/logger/**"],
    rules: {
      "no-console": "off",
    },
  },
  // Relax rules for tests
  {
    files: ["__tests__/**/*.{ts,tsx}", "e2e/**/*.{ts,tsx}"],
    rules: {
      "local/max-file-size": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "max-lines-per-function": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
```

### 8.3 Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "**/e2e/**"],
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: {
      junit: "./junit.xml",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "__tests__/",
        "e2e/",
        ".next/",
        "*.config.{ts,js,mjs}",
        "lib/db/migrations/",
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    // Database setup for integration tests
    globalSetup: "./__tests__/setup/global-setup.ts",
    setupFiles: ["./__tests__/setup/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

### 8.4 Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI
    ? [
        ["html", { open: "never" }],
        ["junit", { outputFile: "e2e-results.xml" }],
      ]
    : "html",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "on",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/storage-state.json",
      },
    },
    ...(process.env.CI
      ? [
          {
            name: "firefox",
            use: {
              ...devices["Desktop Firefox"],
              storageState: "e2e/.auth/storage-state.json",
            },
          },
          {
            name: "webkit",
            use: {
              ...devices["Desktop Safari"],
              storageState: "e2e/.auth/storage-state.json",
            },
          },
          {
            name: "mobile-chrome",
            use: {
              ...devices["Pixel 5"],
              storageState: "e2e/.auth/storage-state.json",
            },
          },
        ]
      : []),
  ],
  webServer: {
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

---

## 9. Coding Standards

### 9.1 Commit Convention

Use Conventional Commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Maintenance

**Examples:**

```
feat(casting-board): add drag-and-drop role assignment
fix(auth): resolve session expiration redirect loop
docs(api): document audition submission endpoints
```

### 9.2 Git Hooks

```bash
# .husky/pre-commit
branch=$(git symbolic-ref --short HEAD 2>/dev/null)
if [ "$branch" = "main" ]; then
  echo "Direct commits to main are not allowed. Please create a feature branch."
  exit 1
fi

# Run lint-staged
pnpm exec lint-staged

# Run full lint check
echo "Running lint..."
pnpm lint

# Type check
echo "Type checking..."
pnpm tsc --noEmit

# Run tests
echo "Running tests..."
pnpm test
```

```bash
# .husky/commit-msg
pnpm exec commitlint --edit $1
```

### 9.3 lint-staged Configuration

```json
// package.json (partial)
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["prettier --write", "eslint --max-warnings 0"],
    "*.{json,md,css,html,yaml,yml}": ["prettier --write"]
  }
}
```

### 9.4 PR Template

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE.md -->

## Summary

<!-- Brief description of changes -->

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Related Issues

<!-- Link to related issues: Closes #123 -->

## Changes Made

-
-
-

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if applicable)
- [ ] Manual testing performed

## Screenshots (if applicable)

<!-- Add screenshots for UI changes -->

## Checklist

- [ ] My code follows the project's code style
- [ ] I have performed a self-review
- [ ] I have added comments where necessary
- [ ] Documentation has been updated
- [ ] No new warnings from linting
- [ ] All tests pass locally
```

---

## 10. Infrastructure

### 10.1 Hosting Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cloudflare CDN                          │
│                    (SSL, DDoS, Image Optimization)              │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Vercel Edge                            │
│                     (Next.js App, API Routes)                   │
└─────────────────────────────────────────────────────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Neon/Supabase │     │    Upstash      │     │   Cloudflare R2 │
│   (PostgreSQL)  │     │    (Redis)      │     │ (Object Storage)│
│                 │     │                 │     │                 │
│ - User data     │     │ - Sessions      │     │ - Headshots     │
│ - Shows         │     │ - Cache         │     │ - Videos        │
│ - Auditions     │     │ - Rate limiting │     │ - Documents     │
│ - Casting       │     │ - Real-time     │     │ - Scripts       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 10.2 Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@host:5432/dramatis"

# Redis
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Authentication
NEXTAUTH_URL="https://dramatis-hq.com"
NEXTAUTH_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Storage (R2/S3)
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_BUCKET_NAME="dramatis-media"
S3_REGION="auto"
S3_ENDPOINT="https://xxx.r2.cloudflarestorage.com"

# Document encryption (SOC 2)
DOCUMENT_ENCRYPTION_SECRET=""

# Email
RESEND_API_KEY=""

# Payments
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Monitoring
SENTRY_DSN=""
```

### 10.3 Docker Compose (Development)

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: dramatis
      POSTGRES_PASSWORD: dramatis_dev
      POSTGRES_DB: dramatis
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

---

## 11. Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

**Goals:** Project setup, authentication, basic UI framework

**Tasks:**

1. Initialize Next.js 16 project with TypeScript
2. Configure ESLint, Prettier, Husky, lint-staged
3. Set up CI/CD pipeline (GitHub Actions)
4. Implement database schema (Drizzle + PostgreSQL)
5. Set up NextAuth.js authentication
6. Create base UI components (DaisyUI theming)
7. Implement layout components (Header, Sidebar, Footer)
8. Create landing page

**Deliverables:**

- Working authentication (Google OAuth + credentials)
- Basic responsive layout
- CI/CD pipeline running on all PRs
- Database migrations running

### Phase 2: Talent Core (Weeks 4-6)

**Goals:** Complete talent profile and discovery features

**Tasks:**

1. Profile creation/editing flow
2. Headshot upload with image optimization
3. Video sample integration
4. Work history management
5. Skills/union membership tagging
6. Availability calendar
7. Public profile pages with QR codes
8. PDF resume generator
9. Profile search (for producers)

**Deliverables:**

- Complete talent profile system
- Media upload working (S3/R2)
- Resume PDF generation
- Public shareable profiles

### Phase 3: Producer Core (Weeks 7-9)

**Goals:** Production company features and show management

**Tasks:**

1. Producer signup with subscription (Stripe)
2. Company profile management
3. Photo gallery
4. Show CRUD operations
5. Role definition per show
6. Staff/permissions system
7. Season announcements

**Deliverables:**

- Stripe subscription integration
- Complete show management
- Role-based access control
- Company public pages

### Phase 4: Auditions (Weeks 10-12)

**Goals:** Full audition workflow

**Tasks:**

1. Audition creation wizard
2. Form builder for questions
3. QR code check-in system
4. Audition submission flow
5. Profile review interface
6. Callback/rejection workflow
7. Audition listing page

**Deliverables:**

- End-to-end audition flow
- QR check-in working
- Form builder functional
- Email notifications

### Phase 5: Casting Board (Weeks 13-15)

**Goals:** Drag-and-drop casting interface

**Tasks:**

1. Casting board UI (react-dnd)
2. Role columns with talent cards
3. Deck area for unassigned
4. Lock/unlock roles
5. Tier visibility (lead/ensemble)
6. Finalize and notify
7. Auto-generate cast lists

**Deliverables:**

- Fully functional casting board
- Real-time collaboration
- Cast list generation
- Merge field emails

### Phase 6: Production Tools (Weeks 16-18)

**Goals:** Schedule, notes, documents, budget

**Tasks:**

1. Rehearsal calendar (FullCalendar)
2. Push notification integration
3. Production notes with departments
4. Document storage (encrypted)
5. W2/I-9 sync to talent profiles
6. Call sheet generator
7. Budget tracking/reimbursements

**Deliverables:**

- Complete scheduling system
- Production notes working
- SOC 2 compliant document storage
- Budget management

### Phase 7: Messaging & Polish (Weeks 19-20)

**Goals:** Communication and final polish

**Tasks:**

1. Message center (conversations)
2. Real-time notifications
3. Mobile responsive polish
4. Performance optimization
5. Accessibility audit
6. Security penetration testing
7. Documentation completion

**Deliverables:**

- Messaging system
- PWA capabilities
- WCAG 2.1 AA compliance
- Performance benchmarks

### Phase 8: Launch (Weeks 21-22)

**Goals:** Production deployment and monitoring

**Tasks:**

1. Production environment setup
2. Monitoring (Sentry, analytics)
3. Load testing
4. Beta user onboarding
5. Feedback collection
6. Bug fixes
7. Launch marketing

**Deliverables:**

- Production deployment
- Monitoring dashboards
- Beta feedback incorporated
- Public launch

---

## Summary

This implementation plan provides a comprehensive roadmap for building dramatis-hq, a theatrical production management platform. Key architectural decisions include:

1. **Next.js 16 with App Router** for modern React patterns
2. **tRPC** for type-safe API communication
3. **Drizzle ORM + PostgreSQL** for database management
4. **Vercel + Cloudflare** for scalable hosting
5. **Stripe** for subscription billing
6. **SOC 2 compliant document encryption** for sensitive files
7. **Comprehensive CI/CD** with strict linting, testing, and security scanning

The phased approach allows for iterative development with clear milestones, starting with foundational features and building toward the complete platform over approximately 22 weeks.

---

### Critical Files for Implementation

The following files are most critical for beginning implementation:

- `/Users/trenshaw/code/taskling/package.json` - Reference for dependency structure, scripts, and tooling configuration
- `/Users/trenshaw/code/taskling/eslint.config.mjs` - ESLint flat config pattern with custom plugins and complexity rules
- `/Users/trenshaw/code/taskling/.github/workflows/ci.yml` - CI workflow structure for GitHub Actions
- `/Users/trenshaw/code/taskling/vitest.config.ts` - Test configuration with coverage thresholds
- `/Users/trenshaw/code/taskling/playwright.config.ts` - E2E test configuration with multi-browser support
