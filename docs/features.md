# Features Guide

Complete documentation of Dramatis-HQ features for talent and producers.

## Talent Features

### Profile Management

**Location:** `app/(dashboard)/talent/profile/`

Create and maintain your professional acting profile:

- **Basic Info** - Name, contact, physical attributes, union status
- **Headshots** - Multiple photos with automatic thumbnail generation
- **Work History** - Theater, film, TV credits organized by category
- **Education** - Training programs, degrees, certifications
- **Skills** - Searchable skill tags (dialects, instruments, combat, etc.)
- **Video Samples** - Demo reels and audition clips

### Resume Generator

**Location:** `app/(dashboard)/talent/resume/`

Create industry-standard theatrical PDF resumes:

- Select which credits to include
- Drag-and-drop section ordering
- Multiple saved configurations
- Instant PDF download
- Standard theatrical format (8.5" x 11")

### Calendar & Availability

**Location:** `app/(dashboard)/talent/calendar/`

Manage your schedule and availability:

- Mark available/unavailable dates
- View show commitments
- Sync with external calendars (iCal export)
- Conflict detection for auditions

### Document Storage

**Location:** `app/(dashboard)/talent/documents/`

Secure storage for sensitive documents:

- W2 forms
- Call sheets
- Contracts
- Encrypted at rest (SOC 2 compliant)
- Access logging

### Profile Sharing

**Location:** `app/(dashboard)/talent/share/`

Share your profile at auditions:

- QR code generation
- Short URLs
- Public profile page
- Privacy controls

### Audition Discovery

**Location:** `app/auditions/`

Browse and apply to open auditions:

- Search by show type, location, dates
- Filter by role type
- Save favorites
- Track application status
- Submit custom materials

## Producer Features

### Company Profile

**Location:** `app/(dashboard)/producer/company/`

Showcase your production company:

- Company bio and history
- Past production gallery
- Team members
- Contact information

### Show Management

**Location:** `app/(dashboard)/producer/shows/`

Create and manage theatrical productions:

- Show details (dates, venue, synopsis)
- Role definitions with requirements
- Production timeline
- Department organization

### Audition Management

**Location:** `app/(dashboard)/producer/auditions/`

Full audition workflow:

1. **Create Audition** - Set dates, requirements, roles
2. **Custom Forms** - Build application questionnaires
3. **Review Applications** - Sort, filter, rate submissions
4. **Schedule Callbacks** - Calendar integration
5. **Notes & Ratings** - Collaborative evaluation

### Casting Board

**Location:** `app/(dashboard)/producer/casting/`

Visual casting interface:

- Drag-and-drop talent to roles
- Multiple casting scenarios
- Side-by-side comparison
- Export cast list

### Production Notes

**Location:** `app/(dashboard)/producer/notes/`

Collaborative notes by department:

- Director
- Stage Management
- Technical
- Costume/Hair/Makeup
- Version history

### Rehearsal Scheduling

**Location:** `app/(dashboard)/producer/schedule/`

Coordinate rehearsal calendar:

- Room assignments
- Conflict detection
- Automatic notifications
- Who's called when

### Budget & Expenses

**Location:** `app/(dashboard)/producer/budget/`

Financial tracking:

- Budget categories
- Expense submissions
- Receipt uploads
- Reimbursement workflow
- Reports export

### Staff Management

**Location:** `app/(dashboard)/producer/staff/`

Role-based permissions:

| Role          | Permissions                   |
| ------------- | ----------------------------- |
| Owner         | Full access, billing, delete  |
| Admin         | All except billing            |
| Stage Manager | Schedule, notes, casting view |
| Director      | Casting, auditions, notes     |
| Assistant     | View only, submit notes       |

### Materials Library

**Location:** `app/(dashboard)/producer/materials/`

Distribute show materials:

- Scripts with version control
- Minus tracks / accompaniment
- Reference materials
- Access controls per role

## Shared Features

### Messaging

**Location:** `app/(dashboard)/messages/`

In-app communication:

- Direct messages
- Group conversations
- Message templates
- Read receipts

### Notifications

**Location:** `app/(dashboard)/notifications/`

Stay informed:

- In-app notifications
- Email notifications
- Push notifications (optional)
- Preference controls

### Settings

**Location:** `app/(dashboard)/settings/`

Account configuration:

- Profile settings
- Notification preferences
- Privacy controls
- Account security
- Subscription management (producers)

## Real-Time Features

The app uses Pusher for real-time updates:

- **Presence** - See who's online
- **Casting Updates** - Live board changes
- **Messages** - Instant delivery
- **Notifications** - Push without refresh

## Mobile Support

The app is fully responsive and works on:

- Desktop (optimized)
- Tablet (full features)
- Mobile (adapted UI)

No native app required - works in any modern browser.
