# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cremonini is a multi-tenant claims management platform for the Cremonini Group companies. It features strict data isolation via Clerk Organizations, a "God Mode" for S&A Admins (who can view all claims globally), and automated legal deadline tracking with email notifications.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Supabase + Drizzle ORM
- **Auth**: Clerk (multi-organization)
- **Storage**: Supabase Storage (private bucket)
- **Email**: Resend
- **UI**: Tailwind CSS + shadcn/ui

## Common Commands

```bash
npm run dev              # Start dev server (Next.js + Spotlight)
npm run build            # Production build
npm run lint             # ESLint
npm run lint:fix         # Fix linting issues
npm run check-types      # TypeScript type check
npm run test             # Unit tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)
npm run storybook        # Storybook on :6006

# Database (Drizzle)
npm run db:generate      # Generate migrations after Schema.ts changes
npm run db:push          # Push schema to local DB (uses .env.local)
npm run db:migrate       # Run migrations (uses production env)
npm run db:studio        # Open Drizzle Studio
```

## Architecture

### Multi-Tenancy & "God Mode"

Security is implemented at the application layer (not RLS). Every query checks `orgId` from Clerk auth:

```typescript
const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;
// Admin sees ALL claims, company reps see only their org's claims
where: isSuperAdmin ? undefined : eq(claimsSchema.orgId, orgId)
```

The `checkIsSuperAdmin()` helper in `src/libs/auth-utils.ts` centralizes this check.

### Directory Structure

- `src/app/(auth)/dashboard/` - Protected routes (claims, reports, procura)
- `src/app/(unauth)/` - Public pages (landing)
- `src/app/api/cron/` - Vercel Cron endpoints (deadline notifications)
- `src/features/*/` - Feature modules with actions, components, constants
- `src/models/Schema.ts` - Drizzle ORM schema (entire DB definition)
- `src/libs/` - Core utilities (DB, Env, Logger, deadline-logic, auth-utils)
- `src/components/ui/` - shadcn/ui components
- `src/constants/` - Business constants (Deadlines.ts, Economics.ts)

### Server Actions Pattern

All mutations use Server Actions in `src/features/*/actions/*.actions.ts`. Auth is verified via Clerk's `auth()` at the start of each action.

### Deadline Calculation Engine

`src/libs/deadline-logic.ts` calculates legal deadlines based on transport type and jurisdiction:

- **Types**: TERRESTRIAL, MARITIME, AIR, RAIL, STOCK_IN_TRANSIT
- **States**: NATIONAL, INTERNATIONAL
- **Key outputs**: reserveDeadline, prescriptionDeadline, legalActionDeadline, isDecadence

CMR (International Terrestrial) uses working-days calculation (skips Sundays/holidays via `src/utils/Holidays.ts`).

### Database Schema

Main tables in `src/models/Schema.ts`:
- `claims` - Core claim data with status workflow (11 states), economics, deadlines
- `documents` - Files attached to claims (types: CMR_DDT, INVOICE, PHOTO_REPORT, etc.)
- `claim_activities` - Audit trail (CREATED, STATUS_CHANGE, DOC_UPLOAD, etc.)
- `power_of_attorney` - Company-level authorization documents

To modify schema:
1. Edit `src/models/Schema.ts`
2. Run `npm run db:generate` to create migration
3. Run `npm run db:push` (dev) or `npm run db:migrate` (prod)

### Cron Job for Notifications

`src/app/api/cron/check-deadlines/route.ts` runs on Vercel Crons:
- Validates `CRON_SECRET` bearer token
- Finds claims with approaching deadlines (3 days for reserve, 30 days for prescription)
- Sends email alerts via Resend
- Marks notification flags to prevent duplicates

## Key Constants

`src/constants/Deadlines.ts` contains all deadline rules:
- Reserve days by transport type (3-14 days)
- Prescription periods (6 months to 3 years depending on type/state)
- Notification thresholds
- Legal action warning period (6 months before prescription)

## Environment Variables

Required server-side: `CLERK_SECRET_KEY`, `DATABASE_URL`, `RESEND_API_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`

Required client-side: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_ADMIN_ORG_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_STORAGE_BUCKET_NAME`, `NEXT_PUBLIC_APP_URL`

Uses `@t3-oss/env-nextjs` for type-safe validation in `src/libs/Env.ts`.
