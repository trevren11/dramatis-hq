# Implementation Plan: Stripe Integration

## Overview

Implement Stripe subscription billing for producer accounts with plan selection, payment processing, and subscription management.

## Phase 1: Database & Dependencies

### Task 1.1: Install Stripe Dependencies

```bash
pnpm add stripe @stripe/stripe-js
```

### Task 1.2: Create Database Schema

Create `lib/db/schema/subscriptions.ts`:

- `subscriptions` table: id, organizationId, stripeCustomerId, stripeSubscriptionId, plan, status, currentPeriodStart, currentPeriodEnd, canceledAt, trialEnd
- `invoices` table: id, organizationId, stripeInvoiceId, amount, status, paidAt, invoiceUrl

### Task 1.3: Add Environment Variables

Add to `.env.example`:

- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_MONTHLY
- STRIPE_PRICE_ANNUAL

## Phase 2: Stripe Server Setup

### Task 2.1: Create Stripe Client

Create `lib/stripe.ts`:

- Initialize Stripe with secret key
- Export configured client

### Task 2.2: Implement Checkout Session

Create `app/api/stripe/checkout/route.ts`:

- Create Stripe checkout session
- Include trial period (14 days)
- Support monthly/annual plans
- Set success/cancel URLs

### Task 2.3: Implement Webhook Handler

Create `app/api/stripe/webhook/route.ts`:

- Verify webhook signature
- Handle `checkout.session.completed` - activate subscription
- Handle `invoice.paid` - record payment
- Handle `invoice.payment_failed` - handle failure
- Handle `customer.subscription.deleted` - deactivate
- Handle `customer.subscription.updated` - plan changes

## Phase 3: Frontend Components

### Task 3.1: Pricing Page

Create `components/billing/PricingPlans.tsx`:

- Display free trial info
- Monthly plan card
- Annual plan card (with discount badge)
- "Subscribe" buttons

### Task 3.2: Checkout Integration

Create `components/billing/CheckoutButton.tsx`:

- Initialize Stripe.js
- Redirect to Stripe Checkout
- Handle success/failure callbacks

### Task 3.3: Subscription Settings

Create `components/billing/SubscriptionSettings.tsx`:

- Show current plan
- Show billing period
- Upgrade/downgrade buttons
- Cancel subscription button
- Link to Stripe customer portal

### Task 3.4: Billing History

Create `components/billing/BillingHistory.tsx`:

- List invoices
- Show payment status
- Download invoice links

## Phase 4: Access Control

### Task 4.1: Subscription Middleware

Create `lib/subscription-guard.ts`:

- Check subscription status
- Allow access during trial
- Block expired/canceled subscriptions
- Grace period for failed payments

### Task 4.2: Upgrade Prompts

Create `components/billing/UpgradePrompt.tsx`:

- Show when trial is ending
- Show when subscription required
- CTA to pricing page

## Phase 5: API Routes

### Task 5.1: Billing API Routes

Create:

- `app/api/billing/subscription/route.ts` - GET current subscription
- `app/api/billing/portal/route.ts` - GET Stripe portal link
- `app/api/billing/invoices/route.ts` - GET invoice history

## Phase 6: Testing

### Task 6.1: Webhook Tests

Create `__tests__/api/stripe/webhook.test.ts`:

- Test each webhook event type
- Verify database updates
- Test signature verification

### Task 6.2: Integration Tests

Create `__tests__/billing/subscription.test.ts`:

- Test subscription flow
- Test access control
- Test plan changes

## Commit Strategy

1. Phase 1: "feat(billing): add subscription database schema and Stripe deps"
2. Phase 2: "feat(billing): implement Stripe checkout and webhook handling"
3. Phase 3: "feat(billing): add pricing and subscription UI components"
4. Phase 4: "feat(billing): implement subscription access control"
5. Phase 5: "feat(billing): add billing API routes"
6. Phase 6: "test(billing): add webhook and integration tests"

## Definition of Done

- [ ] Can subscribe via Stripe Checkout
- [ ] Subscription status reflects in app
- [ ] Can manage subscription in portal
- [ ] Webhooks update status correctly
- [ ] Failed payments handled gracefully
- [ ] Invoices viewable/downloadable
- [ ] Tests for webhook handling
