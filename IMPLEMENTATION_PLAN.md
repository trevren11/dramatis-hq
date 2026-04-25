# Implementation Plan: [DRM-037] Real-Time Collaboration

## Overview
Implement WebSocket infrastructure for real-time collaboration features including live casting board updates, instant messaging, and presence indicators.

## Architecture Decision
Using **Pusher** (or Ably) for MVP - managed service reduces complexity. Can migrate to self-hosted Socket.io later if needed.

## Tasks

### Task 1: Pusher Setup and Configuration
**Files:** `lib/pusher.ts`, `lib/pusher-server.ts`, `.env.local`

- Install Pusher client and server packages
- Create Pusher client singleton
- Create server-side Pusher instance
- Configure environment variables (PUSHER_APP_ID, KEY, SECRET, CLUSTER)
- Add connection error handling

### Task 2: Authentication Endpoint
**Files:** `app/api/pusher/auth/route.ts`

- Create Pusher authentication endpoint
- Validate user session before authorizing
- Support private and presence channels
- Return proper auth signatures
- Handle unauthorized access

### Task 3: React Hooks for Real-Time
**Files:** `lib/hooks/use-realtime.ts`, `lib/hooks/use-presence.ts`

Create reusable hooks:
- `useRealtime(channel, event)` - Subscribe to channel events
- `usePresence(channel)` - Track who's in a channel
- Auto-reconnect logic with exponential backoff
- Connection state management
- Cleanup on unmount

### Task 4: Casting Board Live Updates
**Files:** `components/casting/CastingBoard.tsx`, `app/api/castings/[id]/route.ts`

- Subscribe to `casting:show-{id}` channel
- Broadcast on talent add/remove/move
- Apply optimistic updates
- Handle server reconciliation
- Show "X users viewing" indicator

### Task 5: Real-Time Messaging
**Files:** `components/messages/ChatWindow.tsx`, `app/api/messages/route.ts`

- Subscribe to `chat:conv-{id}` for new messages
- Broadcast message on send
- Show "typing" indicators
- Instant delivery without polling
- Handle message ordering

### Task 6: Schedule Change Broadcasts
**Files:** `components/schedule/ScheduleView.tsx`, `app/api/schedules/route.ts`

- Subscribe to `schedule:show-{id}` channel
- Broadcast on schedule CRUD operations
- Update UI without refresh
- Show change notifications
- Conflict detection for same-time edits

### Task 7: Presence System
**Files:** `lib/presence.ts`, `components/ui/presence-avatars.tsx`

- Track users per page/resource
- Display avatar stack of viewers
- Show "User is typing" in chat
- Online/offline indicators
- Last seen timestamps

### Task 8: Offline Queue and Retry
**Files:** `lib/offline-queue.ts`

- Queue actions when offline
- Sync on reconnection
- Exponential backoff for retries
- User feedback for pending actions
- Graceful degradation to polling

### Task 9: Conflict Resolution
**Files:** `lib/conflict-resolver.ts`

- Detect concurrent edits
- Implement last-write-wins for simple fields
- User notification of conflicts
- Manual merge UI for complex conflicts
- Audit trail for conflict resolutions

### Task 10: Tests
**Files:** `__tests__/realtime/*.test.ts`, `e2e/tests/realtime.spec.ts`

- Unit tests for hooks
- Mock Pusher for testing
- E2E test for message delivery
- Connection stability tests

## Completion Criteria
- [x] WebSocket connections stable
- [x] Casting board syncs live between users
- [x] Messages deliver instantly
- [x] Presence indicators work
- [x] Reconnection handles gracefully
- [x] Tests passing

## Implementation Complete

All tasks implemented on 2026-04-25. Key files added:
- `lib/pusher.ts`, `lib/pusher-server.ts` - Pusher client/server setup
- `app/api/pusher/auth/route.ts` - Authentication endpoint
- `lib/hooks/use-realtime.ts`, `use-presence.ts` - React hooks
- `lib/realtime/` - Broadcasting functions for all features
- `lib/offline-queue.ts` - Offline support with retry
- `lib/conflict-resolver.ts` - Conflict detection and resolution
- `components/ui/presence-avatars.tsx` - Presence UI component
- `lib/__tests__/realtime/` - Unit tests
