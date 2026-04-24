# Dramatis-HQ

Theatrical production management platform connecting talent with producers. Full-stack Next.js application with PostgreSQL, real-time collaboration, and SOC 2 compliant document storage.

**See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for complete technical specification, database schema, and roadmap.**

## Setup

```bash
pnpm install                    # Install dependencies
cp .env.example .env.local      # Configure environment
docker-compose up -d            # Start local Postgres + Redis + MinIO
pnpm db:migrate                 # Run database migrations
pnpm dev                        # Server on http://localhost:6767
```

Run `pnpm install` when: first time in repo, after pulling dependency changes, or "Cannot find module" errors.

## Development Workflow

### Test-Driven Development (TDD)

**All feature development MUST follow TDD. No exceptions.**

#### The TDD Cycle

```
1. RED    → Write a failing test first
2. GREEN  → Write minimal code to make it pass
3. REFACTOR → Clean up while keeping tests green
```

#### TDD Rules

1. **Never write production code without a failing test first**
2. **Write only enough test to fail** (compilation failures count)
3. **Write only enough code to pass the failing test**
4. **Refactor only when all tests pass**
5. **Each test should test ONE thing**

#### TDD in Practice

```bash
# Before implementing any feature:
pnpm test:watch                 # Start test watcher

# Write test first (it will fail)
# Write minimal code to pass
# Refactor if needed
# Repeat
```

#### Test File Organization

```
__tests__/
├── unit/                       # Unit tests (isolated, mocked dependencies)
│   ├── lib/                    # Business logic tests
│   ├── components/             # Component unit tests
│   └── utils/                  # Utility function tests
├── integration/                # Integration tests (real dependencies)
│   ├── api/                    # API route tests
│   └── db/                     # Database operation tests
└── e2e/                        # End-to-end tests (Playwright)
    ├── talent/                 # Talent user flows
    ├── producer/               # Producer user flows
    └── auditions/              # Audition workflow tests
```

#### Coverage Requirements

| Type       | Minimum | Target |
| ---------- | ------- | ------ |
| Statements | 80%     | 90%    |
| Branches   | 75%     | 85%    |
| Functions  | 80%     | 90%    |
| Lines      | 80%     | 90%    |

```bash
pnpm test:coverage              # Run with coverage report
```

## Build & Test

```bash
pnpm test                       # REQUIRED before committing
pnpm test:watch                 # Watch mode for TDD
pnpm test:coverage              # Coverage report
pnpm lint                       # REQUIRED - zero errors AND warnings
pnpm typecheck                  # TypeScript strict mode check
pnpm run build                  # Production build
```

## Pre-Commit Checklist

Before every commit:

- [ ] `pnpm test` passes (all tests green)
- [ ] `pnpm lint` has zero errors AND warnings
- [ ] `pnpm typecheck` passes
- [ ] New code has tests written FIRST (TDD)
- [ ] Coverage thresholds met
- [ ] No `console.log` in production code (use logger)
- [ ] No hardcoded secrets or API keys
- [ ] Database migrations are reversible

**CRITICAL: Fix ALL issues, not just your changes.**

When running lint, tests, or typecheck, you must fix **every** error and warning reported - not just those in files you modified. Common excuses that are NOT acceptable:

- "This error existed before my changes" - Fix it anyway
- "I didn't touch that file" - Fix it anyway
- "It's a pre-existing issue" - Fix it anyway
- "My changes work fine" - The codebase must be clean

The codebase should always be in a passing state. If you encounter existing issues, fixing them is part of your work. Never skip, ignore, or leave issues for someone else.

## Code Style

### TypeScript

- **Strict mode**: All strict flags enabled, no `any` types
- **Variables**: `const` over `let`, never `var`
- **Async**: `async/await` over raw promises, proper error handling
- **Null safety**: Optional chaining (`?.`) and nullish coalescing (`??`)
- **Types**: Explicit return types on exported functions, infer internal types
- **Enums**: Prefer const objects or union types over enums

```typescript
// Good
const STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;
type Status = (typeof STATUS)[keyof typeof STATUS];

// Avoid
enum Status {
  ACTIVE = "active",
  INACTIVE = "inactive",
}
```

### React

- **Components**: Functional components only, no class components
- **State**: Derive state during render when possible, avoid unnecessary `useEffect`
- **Loading**: Skeleton loaders for async content, never blank screens
- **Error boundaries**: Wrap feature sections with error boundaries
- **Keys**: Stable, unique keys for lists (never array index for dynamic lists)

```typescript
// Good - derive during render
function ProfileCard({ user }: { user: User }) {
  const fullName = `${user.firstName} ${user.lastName}`;
  return <h1>{fullName}</h1>;
}

// Avoid - unnecessary effect
function ProfileCard({ user }: { user: User }) {
  const [fullName, setFullName] = useState('');
  useEffect(() => {
    setFullName(`${user.firstName} ${user.lastName}`);
  }, [user]);
  return <h1>{fullName}</h1>;
}
```

### Database

- **Migrations**: Always create reversible migrations
- **Queries**: Use Drizzle ORM, never raw SQL in application code
- **Transactions**: Use transactions for multi-table operations
- **Indexes**: Add indexes for frequently queried columns
- **Soft deletes**: Use `deletedAt` for user-facing data, hard delete for internal

### API Design

- **Validation**: Validate all inputs with Zod schemas
- **Errors**: Use consistent error response format
- **Auth**: Check permissions at the start of every handler
- **Pagination**: Use cursor-based pagination for lists
- **Rate limiting**: Apply to all public endpoints

```typescript
// Standard API response format
type ApiResponse<T> = { success: true; data: T } | { success: false; error: string; code: string };
```

### Security

- **Never** commit secrets, API keys, or passwords
- **Never** log sensitive data (passwords, tokens, PII)
- **Always** sanitize user input before display (XSS prevention)
- **Always** use parameterized queries (SQL injection prevention)
- **Always** validate file uploads (type, size, content)
- **Always** check authorization on every request
- **Encrypt** sensitive documents at rest (W2, I-9, contracts)

### Comments

- Add comments to document **intent** when behavior isn't obvious
- Document **why**, not **what** (the code shows what)
- Comment non-obvious business rules and edge cases
- Keep comments up to date when code changes

```typescript
// Good - explains WHY
// Talent can only see their own documents; producers see documents
// for talent in their shows. This is a compliance requirement.
async function getDocuments(userId: string, viewerId: string) { ... }

// Bad - explains WHAT (obvious from code)
// Get documents for user
async function getDocuments(userId: string) { ... }
```

## Project Structure

```
app/                            # Next.js App Router
├── (auth)/                     # Auth pages (login, signup)
├── (talent)/                   # Talent dashboard
├── (producer)/                 # Producer dashboard
├── (public)/                   # Public profiles
└── api/                        # API routes
components/
├── ui/                         # Base UI components
├── talent/                     # Talent-specific components
├── producer/                   # Producer-specific components
└── shared/                     # Shared feature components
lib/
├── db/                         # Database schema, migrations, queries
├── auth/                       # Authentication logic
├── permissions/                # RBAC permission checks
├── validation/                 # Zod schemas
└── utils/                      # Utility functions
__tests__/                      # All test files (mirrors src structure)
```

## Git Workflow

### Branch Naming

```
<username>/<ticket>-<short-description>
```

Examples:

- `trenshaw/DRM-123-talent-profile-upload`
- `trenshaw/DRM-456-casting-board-drag-drop`

### Commit Messages

```
[DRM-123] Brief description of change

- Detail 1
- Detail 2
```

- Start with ticket number in brackets
- Use imperative mood ("Add feature" not "Added feature")
- Keep subject line under 72 characters
- Add details in body if needed

### MR Requirements

Every MR merged to main **must**:

1. **Pass all tests** - `pnpm test` green
2. **Pass linting** - `pnpm lint` zero errors/warnings
3. **Pass type check** - `pnpm typecheck` clean
4. **Meet coverage** - No reduction in coverage percentage
5. **Have tests** - New code must have tests (written first via TDD)
6. **Have review** - At least one approval
7. **Update docs** - Update relevant documentation

### Forbidden Git Operations

**NEVER run these commands:**

- `git stash` - Destroys in-progress work from concurrent sessions
- `git reset --hard` - Same, destroys uncommitted work
- `git checkout .` - Same, destroys uncommitted changes
- `git restore .` - Same, destroys uncommitted changes
- `git clean -f` - Same, removes untracked files
- `git push --force` to main - Destroys shared history

If you need to verify pre-existing state, check main branch separately or ask the user.

## Testing Guidelines

### Unit Tests

- Test one thing per test
- Use descriptive test names: `it('returns error when email is invalid')`
- Mock external dependencies (API calls, database)
- Test edge cases and error conditions

```typescript
describe("validateEmail", () => {
  it("returns true for valid email", () => {
    expect(validateEmail("user@example.com")).toBe(true);
  });

  it("returns false for email without @", () => {
    expect(validateEmail("userexample.com")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(validateEmail("")).toBe(false);
  });
});
```

### Integration Tests

- Test real database operations
- Test API routes with real request/response
- Use test database (reset between tests)
- Test permission boundaries

### E2E Tests

- Test critical user flows end-to-end
- Use Playwright with multiple browsers
- Test responsive breakpoints
- Include accessibility checks

```typescript
test("talent can create profile and generate resume", async ({ page }) => {
  await page.goto("/signup/talent");
  await page.fill('[name="email"]', "talent@example.com");
  // ... complete flow
  await expect(page.locator('[data-testid="resume-pdf"]')).toBeVisible();
});
```

## Error Handling

### API Errors

```typescript
// Use consistent error codes
const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

// Return structured errors
return Response.json(
  { success: false, error: "Invalid email format", code: "VALIDATION_ERROR" },
  { status: 400 }
);
```

### Client Errors

- Show user-friendly messages (not stack traces)
- Log detailed errors to monitoring (Sentry)
- Provide actionable next steps when possible
- Use error boundaries to prevent full-page crashes

## Performance Guidelines

- **Images**: Use Next.js Image component, serve WebP, lazy load below fold
- **Fonts**: Subset fonts, use `font-display: swap`
- **Bundle**: Code-split by route, lazy load heavy components
- **Database**: Add indexes, use pagination, avoid N+1 queries
- **Caching**: Cache API responses where appropriate, use SWR/React Query
- **Monitoring**: Track Core Web Vitals, set performance budgets

## Accessibility Requirements

- **WCAG 2.1 AA** compliance minimum
- Semantic HTML elements
- Proper heading hierarchy
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios (4.5:1 for text)
- Focus indicators visible
- Alt text for images
- Form labels and error messages

## Environment Variables

Required for development:

```bash
DATABASE_URL=                   # PostgreSQL connection string
NEXTAUTH_SECRET=                # Auth secret (generate with openssl)
NEXTAUTH_URL=http://localhost:6767
S3_ENDPOINT=                    # MinIO/R2/S3 endpoint
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
STRIPE_SECRET_KEY=              # Stripe test key
STRIPE_PUBLISHABLE_KEY=
```

**Never commit `.env` files. Use `.env.example` as template.**

---

## Accumulated Feedback

<!-- Entries added via project feedback commands -->

_No feedback recorded yet._

## Fixes & Troubleshooting

<!-- Entries added when issues are resolved -->

_No fixes recorded yet._
