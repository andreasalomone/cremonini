import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  decimal,
  index,
  jsonb,
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
  'TERRESTRIAL',
  'MARITIME',
  'AIR',
  'RAIL',
  'STOCK_IN_TRANSIT',
  // Legacy values kept for compatibility if needed, but not used for new claims
  'TRANSPORT',
  'STOCK',
  'DEPOSIT',
]);

export const claimStateEnum = pgEnum('claim_state', [
  'NATIONAL',
  'INTERNATIONAL',
]);

export const claimsSchema = pgTable('claims', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id').notNull(), // Links to Clerk Organization
  creatorId: text('creator_id'), // Links to Clerk User

  status: claimStatusEnum('status').default('OPEN').notNull(),
  type: claimTypeEnum('type').notNull(),
  state: claimStateEnum('state').default('NATIONAL').notNull(),

  // Core fields
  eventDate: date('event_date').notNull(),
  location: text('location'), // Luogo evento
  documentNumber: text('document_number'), // Renamed from ddtCmrNumber
  carrierName: text('carrier_name'),
  hasThirdPartyResponsible: boolean('has_third_party').default(false), // Presenza terzi responsabili
  thirdPartyName: text('third_party_name'),
  estimatedRecovery: decimal('estimated_recovery', { precision: 15, scale: 2 }),
  description: text('description'),
  documentUrl: text('document_url'), // Legacy single doc (kept for backwards compat)
  documentPath: text('document_path'), // Supabase Storage path

  // Stock in Transit fields
  stockInboundDate: date('stock_inbound_date'),
  stockOutboundDate: date('stock_outbound_date'),
  hasStockInboundReserve: boolean('has_stock_inbound_reserve').default(false),

  // Legal fields
  hasGrossNegligence: boolean('has_gross_negligence').default(false),

  // Economic fields
  estimatedValue: decimal('estimated_value', { precision: 15, scale: 2 }), // Danno stimato
  verifiedDamage: decimal('verified_damage', { precision: 15, scale: 2 }), // Danno accertato
  claimedAmount: decimal('claimed_amount', { precision: 15, scale: 2 }), // Importo reclamato
  recoveredAmount: decimal('recovered_amount', { precision: 15, scale: 2 }), // Importo recuperato

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
  url: text('url').notNull(), // Legacy (kept for backwards compat)
  path: text('path'), // Supabase Storage path
  filename: text('filename'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Type inference exports
export type Document = typeof documentsSchema.$inferSelect;
export type NewDocument = typeof documentsSchema.$inferInsert;

// --- CLAIM ACTIVITIES MODULE ---

export const activityTypeEnum = pgEnum('activity_type', [
  'CREATED',
  'STATUS_CHANGE',
  'DOC_UPLOAD',
  'DOC_DELETE',
  'INFO_UPDATE',
  'ECONOMICS_UPDATE',
]);

export const claimActivitiesSchema = pgTable('claim_activities', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  claimId: text('claim_id')
    .references(() => claimsSchema.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id'), // Clerk User ID of the operator
  actionType: activityTypeEnum('action_type').notNull(),
  description: text('description').notNull(),
  metadata: jsonb('metadata'), // JSONB for queryable structured data
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Type inference exports
export type ClaimActivity = typeof claimActivitiesSchema.$inferSelect;
export type NewClaimActivity = typeof claimActivitiesSchema.$inferInsert;

// --- POWER OF ATTORNEY MODULE ---

export const powerOfAttorneySchema = pgTable('power_of_attorney', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id').notNull(),
  documentUrl: text('document_url').notNull(), // Legacy (kept for backwards compat)
  documentPath: text('document_path'), // Supabase Storage path
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
  activities: many(claimActivitiesSchema),
}));

export const documentsRelations = relations(documentsSchema, ({ one }) => ({
  claim: one(claimsSchema, {
    fields: [documentsSchema.claimId],
    references: [claimsSchema.id],
  }),
}));

export const claimActivitiesRelations = relations(claimActivitiesSchema, ({ one }) => ({
  claim: one(claimsSchema, {
    fields: [claimActivitiesSchema.claimId],
    references: [claimsSchema.id],
  }),
}));
