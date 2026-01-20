# Product Requirements Document: S&A Claims Management Platform (Cremonini Group)

**Version:** 2.0 (Post-MVP Pivot)
**Status:** In Progress (Phase 1 Core Complete)

## 1. Executive Summary & Core Value

* **Problem:** The Cremonini Group faces challenges in managing claims due to fragmented communication, manual data entry, and high risk of missing critical legal deadlines (prescriptions). S&A needs centralized visibility while maintaining strict data segregation for Group companies.
* **Solution:** A centralized, multi-tenant web application. It uses **Clerk** for authentication and organization management, **Drizzle ORM** for type-safe database interactions, and **UploadThing** for secure document storage.
* **Key Differentiator:** "God Mode" capability allowing S&A Admins to oversee all tenants (Group Companies) while restricting Company Representatives to their own data.

## 2. User Stories & Acceptance Criteria

### 2.1 Administrator (S&A)

**User Story:** As an **S&A Admin**, I want to **view and manage claims across all Cremonini companies**, so that I can intervene on critical deadlines without logging in and out of different accounts.

* **Implementation Status:** ✅ **DONE**
* **Acceptance Criteria:**
* Verify Admin can see a global list of claims ignoring `orgId` filters.
* Verify Admin can filter the list by specific Company if needed.
* Verify Admin can update status to "Closed" and trigger `closedAt` timestamp.

### 2.2 Company Representative (Cremonini Group)

**User Story:** As a **Company Rep**, I want to **open a new claim and upload documents**, so that S&A can begin the recovery process.

* **Implementation Status:** ✅ **DONE** (Uploads & Creation active)
* **Acceptance Criteria:**
* Verify user sees *only* claims where `claim.orgId` matches their active Clerk Organization.
* Verify `New Claim` form automatically binds the claim to the user's active Organization.
* Verify file uploads (PDF/Images) are successful via UploadThing.

### 2.3 System (Automated Logic)

**User Story:** As the **System**, I must **calculate legal deadlines**, so that users are alerted before a claim becomes time-barred.

* **Implementation Status:** ✅ **DONE**
* **Acceptance Criteria:**
* Verify `Reserve Deadline` = Event Date + 7 days (Transport).
* Verify `Prescription Deadline` = Event Date + 1 year (CMR).
* Verify dates are stored as strict `DATE` types to avoid timezone shifts.

## 3. UX/UI Requirements

### 3.1 Components (Shadcn UI)

* **Dashboard (`/dashboard/claims`):**
* **Table:** Sortable/Filterable. Columns: Status, Company, Date, Value, Actions.
* **Status Dropdown:** Interactive component with Italian labels ("Aperto", "Documentazione in raccolta", "Negoziazione", "Chiuso").

* **New Claim Wizard (`/dashboard/claims/new`):**
* **File Uploader:** Drag & Drop zone (UploadThing) accepting `.pdf`, `.jpg`, `.png` (Max 4MB).
* **Form:** Validated inputs for `Event Date`, `Type`, `Estimated Value`.

### 3.2 UI Nuances

* **Localization (Italian First):**
    *   **Primary Language:** Italian (`it`) is the default and source of truth across the platform.
    *   **Fallback:** English (`en`) and French (`fr`) translations are maintained for broader accessibility.
    *   **Branding:** Standard boilerplate text is replaced with Cremonini-specific branding in all locales.

---

### 3.3 Routing Architecture
*   **Authentication Boundary:** All dashboard routes are nested under the `(auth)` group to enforce authentication and organization context.
*   **Paths:**
    *   `/dashboard`: Command Center / KPI Overview.
    *   `/dashboard/claims`: Claims Management Table.
    *   `/dashboard/organization-profile`: Company Settings.
    *   `/dashboard/user-profile`: Profile Management.

## 4. Technical Implementation Specs

### 4.1 Architecture Stack

* **Framework:** Next.js 15 (App Router).
* **Auth & Tenancy:** **Clerk**.
* *Mapping:* Clerk "Organization" = Cremonini "Company".
* *Mapping:* Clerk "Organization ID" (`NEXT_PUBLIC_ADMIN_ORG_ID`) = Super Admin Context.

* **Database:** PostgreSQL (via **Supabase**) managed by **Drizzle ORM**.
* **Storage:** **UploadThing** (S3 wrapper).

### 4.2 Database Schema (Drizzle)

```typescript
// db/schema.ts

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkOrgId: text('clerk_org_id').notNull().unique(), // Links to Clerk
  name: text('name').notNull(),
  // ...
});

export const claims = pgTable('claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(), // Tenant Isolation Key
  creatorId: text('creator_id').notNull(),

  // Core Business Data
  status: text('status').notNull().default('OPEN'), // Enum mapped in UI
  type: text('type').notNull(), // TRANSPORT, STOCK, DEPOSIT
  eventDate: date('event_date').notNull(),

  // Economics
  estimatedValue: decimal('estimated_value', { precision: 10, scale: 2 }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  closedAt: timestamp('closed_at'), // Critical for KPIs

  // Files
  documentUrl: text('document_url'), // From UploadThing
});
```

### 4.3 Security & "God Mode" Logic

Since we removed Supabase RLS, security is enforced at the **Application Layer (Server Actions)**.

**The `getClaims` Pattern:**

1. **Authenticate:** `const { userId, orgId } = auth();`
2. **Check Admin:** `const isSuperAdmin = orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;`
3. **Execute Query:**
* **IF `isSuperAdmin`:** `return db.select().from(claims);` (Access All).
* **IF Standard User (with `orgId`):** `return db.select().from(claims).where(eq(claims.orgId, orgId));` (Strict Isolation).
* **IF No Org Context:** Return `[]` (Graceful handling of personal workspace).

## 5. Logic & Business Rules

### 5.1 Status Lifecycle

The system enforces the following flow, mappable to S&A's custom states:

1. **OPEN** (Aperto)
2. **DOCS_COLLECTION** (Documentazione in raccolta)
3. **NEGOTIATION** (Negoziazione)
4. **CLOSED** (Chiuso) -> *Trigger:* Sets `closedAt` to `new Date()`.

### 5.2 Deadlines (The "Brain")

* **Logic:** Triggered on Claim Creation.
* **Rule A (Transport):** `reserveDeadline` = `eventDate` + 7 days.
* **Rule B (Prescription):** `prescriptionDeadline` = `eventDate` + 1 year.
* **Handling:** Dates must be calculated server-side using `date-fns` to ensure consistency.

## 6. UI & Brand Identity Refactoring (Current Focus)

### 6.1 Landing Page Pivot
*   **Minimalist Core:** The landing page must be reduced to its absolute essentials.
*   **UVP (Unique Value Proposition):** A powerful, single-sentence statement defining the platform (e.g., *"Gestione Sinistri Professionale per il Gruppo Cremonini: Monitoraggio, Conformità e Risultati"*).
*   **Action Driven:** Primary focus on "Accedi" (Sign In) and "Inizia" (Sign Up) with Cremonini corporate styling.
*   **Zero Boilerplate:** Remove all placeholder text, generic SaaS illustrations, and "Next.js SaaS Boilerplate" branding (credits/links).

### 6.2 Application Interface Cleanup
*   **Dashboard Branding:** Ensure all logos, colors, and fonts align with S&A/Cremonini brand guidelines (Professional, Secure, Institutional).
*   **Boilerplate Removal:** Scrub the footer, settings page, and notification headers of any remaining boilerplate-provided text or links.

## 7. Roadmap & Implementation Plan

### Phase 1: The Core (✅ Completed)

* [x] Project Setup (Next.js + Clerk + Drizzle).
* [x] Database Migration (Claims Table).
* [x] "God Mode" Data Access Layer.
* [x] UI: Dashboard Table & New Claim Form.
* [x] Feature: Status Updates with Timestamp Logic.
* [x] Feature: File Uploads via UploadThing.

### Phase 2: Intelligence & UI Refinement (📍 Current Focus)

* [ ] **UI Refactor:** Implement minimal landing page and scrub boilerplate traces.
* [ ] **Dashboard Branding:** Align UI with S&A corporate identity.
* [ ] **Deadline Service Integration:** Ensure cron job is triggered and monitoring is active.
* [ ] **Dashboard KPIs:** Visualize "Claims Open" vs "Claims Closed" using Charts.

### Phase 3: AI Enhancements (Future)

* [ ] **OCR:** Auto-fill form data from uploaded CMRs.
* [ ] **Letter Gen:** Generate "Letter of Reserve" PDF based on claim data.
