import {
  bigint,
  boolean,
  date,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// This file defines the structure of your database tables using the Drizzle ORM.

// To modify the database schema:
// 1. Update this file with your desired changes.
// 2. Generate a new migration by running: `npm run db:generate`

// The generated migration file will reflect your schema changes.
// The migration is automatically applied during the next database interaction,
// so there's no need to run it manually or restart the Next.js server.

// Need a database for production? Check out https://www.prisma.io/?via=saasboilerplatesrc
// Tested and compatible with Next.js Boilerplate
export const organizationSchema = pgTable(
  'organization',
  {
    id: text('id').primaryKey(),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripeSubscriptionPriceId: text('stripe_subscription_price_id'),
    stripeSubscriptionStatus: text('stripe_subscription_status'),
    stripeSubscriptionCurrentPeriodEnd: bigint(
      'stripe_subscription_current_period_end',
      { mode: 'number' },
    ),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      stripeCustomerIdIdx: uniqueIndex('stripe_customer_id_idx').on(
        table.stripeCustomerId,
      ),
    };
  },
);

export const todoSchema = pgTable('todo', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// --- CLAIMS MODULE ---

export const claimStatusEnum = pgEnum('claim_status', [
  'OPEN',
  'DOCS_COLLECTION',
  'NEGOTIATION',
  'CLOSED',
]);

export const claimTypeEnum = pgEnum('claim_type', [
  'TRANSPORT',
  'STOCK',
  'DEPOSIT',
]);

export const claimsSchema = pgTable('claims', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id').notNull(), // Links to Clerk Organization
  creatorId: text('creator_id'), // Links to Clerk User

  status: claimStatusEnum('status').default('OPEN').notNull(),
  type: claimTypeEnum('type').notNull(),

  eventDate: date('event_date').notNull(),
  carrierName: text('carrier_name'),
  estimatedValue: text('estimated_value'), // Storing as text or numeric(10,2) handled in logic
  description: text('description'),
  documentUrl: text('document_url'), // UploadThing URL

  // Deadlines
  reserveDeadline: date('reserve_deadline'),
  prescriptionDeadline: date('prescription_deadline'),

  // Timestamps
  closedAt: timestamp('closed_at', { mode: 'date' }),

  // Notification Tracking
  reserveNotificationSent: boolean('reserve_notification_sent').default(false).notNull(),
  prescriptionNotificationSent: boolean('prescription_notification_sent').default(false).notNull(),

  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
