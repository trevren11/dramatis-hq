# API Reference

API endpoints and usage for Dramatis-HQ.

## Overview

Dramatis-HQ uses two API patterns:

1. **tRPC** - Type-safe RPC for most operations
2. **REST** - For webhooks and special cases

All endpoints require authentication unless noted.

## Authentication

Session-based authentication via NextAuth:

```typescript
// Client-side: session automatically included
const response = await fetch("/api/endpoint");

// Server-side: check session
import { auth } from "@/lib/auth";
const session = await auth();
if (!session) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

## tRPC Endpoints

Located in `lib/services/trpc.ts`:

### Talent

| Procedure                  | Type   | Description                |
| -------------------------- | ------ | -------------------------- |
| `talent.getProfile`        | query  | Get current user's profile |
| `talent.updateProfile`     | mutate | Update profile fields      |
| `talent.addWorkHistory`    | mutate | Add work history entry     |
| `talent.deleteWorkHistory` | mutate | Remove work history entry  |
| `talent.addSkill`          | mutate | Add skill to profile       |
| `talent.removeSkill`       | mutate | Remove skill               |
| `talent.getAvailability`   | query  | Get calendar availability  |
| `talent.setAvailability`   | mutate | Set date availability      |

### Producer

| Procedure                | Type   | Description          |
| ------------------------ | ------ | -------------------- |
| `producer.getProfile`    | query  | Get producer profile |
| `producer.updateProfile` | mutate | Update company info  |
| `producer.getShows`      | query  | List all shows       |
| `producer.createShow`    | mutate | Create new show      |
| `producer.updateShow`    | mutate | Update show details  |
| `producer.deleteShow`    | mutate | Delete show          |
| `producer.addRole`       | mutate | Add role to show     |
| `producer.updateRole`    | mutate | Update role          |
| `producer.deleteRole`    | mutate | Delete role          |

### Auditions

| Procedure                    | Type   | Description                   |
| ---------------------------- | ------ | ----------------------------- |
| `audition.list`              | query  | List auditions (with filters) |
| `audition.get`               | query  | Get audition details          |
| `audition.create`            | mutate | Create audition               |
| `audition.update`            | mutate | Update audition               |
| `audition.delete`            | mutate | Delete audition               |
| `audition.getApplications`   | query  | Get applications for audition |
| `audition.apply`             | mutate | Submit application            |
| `audition.updateApplication` | mutate | Update application status     |
| `audition.addNote`           | mutate | Add note to application       |

### Casting

| Procedure              | Type   | Description             |
| ---------------------- | ------ | ----------------------- |
| `casting.getBoard`     | query  | Get casting board state |
| `casting.assignRole`   | mutate | Assign talent to role   |
| `casting.unassignRole` | mutate | Remove assignment       |
| `casting.moveCard`     | mutate | Reorder on board        |

### Messages

| Procedure                   | Type   | Description            |
| --------------------------- | ------ | ---------------------- |
| `messages.getConversations` | query  | List conversations     |
| `messages.getMessages`      | query  | Get messages in thread |
| `messages.send`             | mutate | Send message           |
| `messages.markRead`         | mutate | Mark as read           |

### Notifications

| Procedure                         | Type   | Description               |
| --------------------------------- | ------ | ------------------------- |
| `notifications.list`              | query  | List notifications        |
| `notifications.markRead`          | mutate | Mark as read              |
| `notifications.markAllRead`       | mutate | Mark all as read          |
| `notifications.getPreferences`    | query  | Get notification settings |
| `notifications.updatePreferences` | mutate | Update settings           |

## REST Endpoints

### File Uploads

```
POST /api/upload/presigned
```

Get presigned URL for direct upload to S3:

```typescript
// Request
{
  "filename": "headshot.jpg",
  "contentType": "image/jpeg",
  "bucket": "headshots"
}

// Response
{
  "uploadUrl": "https://s3.../presigned-url",
  "key": "abc123/headshot.jpg",
  "publicUrl": "https://s3.../public-url"
}
```

### Resume Generation

```
POST /api/resume/generate
```

Generate PDF resume:

```typescript
// Request
{
  "configurationId": "uuid",  // or provide inline config
  "format": "pdf"
}

// Response: PDF binary with Content-Type: application/pdf
```

### Webhooks

```
POST /api/webhooks/stripe
```

Stripe payment events. Requires valid signature.

### Public Endpoints (No Auth)

```
GET /api/talent/[slug]        # Public talent profile
GET /api/company/[slug]       # Public company profile
GET /api/auditions            # Public audition listings
GET /api/auditions/[id]       # Public audition details
```

## Error Responses

Standard error format:

```typescript
{
  "success": false,
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

Common error codes:

| Code               | HTTP | Description              |
| ------------------ | ---- | ------------------------ |
| `UNAUTHORIZED`     | 401  | Not logged in            |
| `FORBIDDEN`        | 403  | Insufficient permissions |
| `NOT_FOUND`        | 404  | Resource not found       |
| `VALIDATION_ERROR` | 400  | Invalid input            |
| `RATE_LIMITED`     | 429  | Too many requests        |
| `INTERNAL_ERROR`   | 500  | Server error             |

## Rate Limiting

Public endpoints: 100 requests/minute per IP
Authenticated: 1000 requests/minute per user

## Pagination

List endpoints use cursor-based pagination:

```typescript
// Request
{
  "limit": 20,
  "cursor": "last-item-id"  // omit for first page
}

// Response
{
  "items": [...],
  "nextCursor": "next-item-id",  // null if no more
  "hasMore": true
}
```

## Real-Time Updates

Subscribe to Pusher channels for real-time:

```typescript
import Pusher from "pusher-js";

const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
});

// Presence channel for online users
const presence = pusher.subscribe(`presence-show-${showId}`);

// Private channel for user-specific events
const private = pusher.subscribe(`private-user-${userId}`);

// Events
private.bind("notification:new", (data) => {
  // Handle new notification
});
```

## Testing APIs

Use the tRPC playground in development:

```bash
pnpm dev
# Visit http://localhost:6767/api/trpc/panel
```

Or use curl for REST:

```bash
# Get presigned upload URL
curl -X POST http://localhost:6767/api/upload/presigned \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"filename": "test.jpg", "contentType": "image/jpeg", "bucket": "headshots"}'
```
