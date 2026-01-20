import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// This file defines the structure of your database tables using the Drizzle ORM.

// To modify the database schema:
// 1. Update this file with your desired changes.
// 2. Generate a new migration by running: `npm run db:generate`

// The generated migration file will reflect your schema changes.
// The migration is automatically applied during the next database interaction,
// so there's no need to run it manually or restart the Next.js server.

export const organizationSchema = pgTable(
  'organization',
  {
    id: text('id').primaryKey(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
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

// 11 workflow states per requirements
export const claimStatusEnum = pgEnum('claim_status', [
  'OPEN', // Aperto
  'DOCS_COLLECTION', // Documentazione in raccolta
  'RESERVE_SENT', // Riserva al responsabile inviata
  'DAMAGE_EVALUATION', // Danno in valutazione
  'CLAIM_SENT', // Reclamo inviato
  'NEGOTIATION_EXTRAJUDICIAL', // Negoziazione stragiudiziale
  'NEGOTIATION_ASSISTED', // Negoziazione assistita
  'LEGAL_ACTION', // Azione giudiziale
  'PARTIAL_RECOVERY', // Recupero parziale
  'FULL_RECOVERY', // Recupero totale
  'CLOSED', // Chiuso
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

  // Core fields
  eventDate: date('event_date').notNull(),
  location: text('location'), // Luogo evento
  ddtCmrNumber: text('ddt_cmr_number'), // Numero DDT/CMR
  carrierName: text('carrier_name'),
  hasThirdPartyResponsible: boolean('has_third_party').default(false), // Presenza terzi responsabili
  description: text('description'),
  documentUrl: text('document_url'), // Legacy single doc (kept for backwards compat)

  // Economic fields
  estimatedValue: text('estimated_value'), // Danno stimato
  verifiedDamage: text('verified_damage'), // Danno accertato
  claimedAmount: text('claimed_amount'), // Importo reclamato
  recoveredAmount: text('recovered_amount'), // Importo recuperato

  // Deadlines
  reserveDeadline: date('reserve_deadline'),
  prescriptionDeadline: date('prescription_deadline'),
  claimFollowUpDeadline: date('claim_followup_deadline'),
  negotiationDeadline: date('negotiation_deadline'),
  legalActionDeadline: date('legal_action_deadline'),

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
}, table => ({
  orgIdIdx: index('claims_org_id_idx').on(table.orgId),
  statusIdx: index('claims_status_idx').on(table.status),
  createdAtIdx: index('claims_created_at_idx').on(table.createdAt),
}));

// Type inference exports
export type Claim = typeof claimsSchema.$inferSelect;
export type NewClaim = typeof claimsSchema.$inferInsert;

// --- DOCUMENTS MODULE ---

export const documentTypeEnum = pgEnum('document_type', [
  'CMR_DDT',
  'INVOICE',
  'PHOTO_REPORT',
  'EXPERT_REPORT',
  'CORRESPONDENCE',
  'LEGAL_ACT',
]);

export const documentsSchema = pgTable('documents', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  claimId: text('claim_id').notNull(),
  type: documentTypeEnum('type').notNull(),
  url: text('url').notNull(),
  filename: text('filename'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Type inference exports
export type Document = typeof documentsSchema.$inferSelect;
export type NewDocument = typeof documentsSchema.$inferInsert;

// --- POWER OF ATTORNEY MODULE ---

export const powerOfAttorneySchema = pgTable('power_of_attorney', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id').notNull(),
  documentUrl: text('document_url').notNull(),
  expiryDate: date('expiry_date'),
  saAuthorizedToAct: boolean('sa_authorized_to_act').default(false),
  saAuthorizedToCollect: boolean('sa_authorized_to_collect').default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Type inference exports
export type PowerOfAttorney = typeof powerOfAttorneySchema.$inferSelect;
export type NewPowerOfAttorney = typeof powerOfAttorneySchema.$inferInsert;

// --- RELATIONS (for Drizzle query API) ---

export const claimsRelations = relations(claimsSchema, ({ many }) => ({
  documents: many(documentsSchema),
}));

export const documentsRelations = relations(documentsSchema, ({ one }) => ({
  claim: one(claimsSchema, {
    fields: [documentsSchema.claimId],
    references: [claimsSchema.id],
  }),
}));
