-- Safe enum migration: Drop default first, then recreate enum
-- Step 1: Remove the default constraint
ALTER TABLE "public"."claims" ALTER COLUMN "status" DROP DEFAULT;-->statement-breakpoint

-- Step 2: Change column to text temporarily
ALTER TABLE "public"."claims" ALTER COLUMN "status" SET DATA TYPE text;-->statement-breakpoint

-- Step 3: Drop old enum and create new one
DROP TYPE IF EXISTS "public"."claim_status";-->statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('OPEN', 'DOCS_COLLECTION', 'RESERVE_SENT', 'DAMAGE_EVALUATION', 'CLAIM_SENT', 'NEGOTIATION_EXTRAJUDICIAL', 'NEGOTIATION_ASSISTED', 'LEGAL_ACTION', 'PARTIAL_RECOVERY', 'FULL_RECOVERY', 'CLOSED');-->statement-breakpoint

-- Step 4: Migrate existing 'NEGOTIATION' values to new format
UPDATE "public"."claims" SET "status" = 'NEGOTIATION_EXTRAJUDICIAL' WHERE "status" = 'NEGOTIATION';-->statement-breakpoint

-- Step 5: Convert column back to enum and restore default
ALTER TABLE "public"."claims" ALTER COLUMN "status" SET DATA TYPE "public"."claim_status" USING "status"::"public"."claim_status";-->statement-breakpoint
ALTER TABLE "public"."claims" ALTER COLUMN "status" SET DEFAULT 'OPEN';-->statement-breakpoint

-- Create document_type enum
CREATE TYPE "public"."document_type" AS ENUM('CMR_DDT', 'INVOICE', 'PHOTO_REPORT', 'EXPERT_REPORT', 'CORRESPONDENCE', 'LEGAL_ACT');-->statement-breakpoint

-- Create documents table
CREATE TABLE IF NOT EXISTS "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"claim_id" text NOT NULL,
	"type" "document_type" NOT NULL,
	"url" text NOT NULL,
	"filename" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);-->statement-breakpoint

-- Create power_of_attorney table
CREATE TABLE IF NOT EXISTS "power_of_attorney" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"document_url" text NOT NULL,
	"expiry_date" date,
	"sa_authorized_to_act" boolean DEFAULT false,
	"sa_authorized_to_collect" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);-->statement-breakpoint

-- Add new columns to claims
ALTER TABLE "claims" ADD COLUMN IF NOT EXISTS "location" text;-->statement-breakpoint
ALTER TABLE "claims" ADD COLUMN IF NOT EXISTS "ddt_cmr_number" text;-->statement-breakpoint
ALTER TABLE "claims" ADD COLUMN IF NOT EXISTS "has_third_party" boolean DEFAULT false;-->statement-breakpoint
ALTER TABLE "claims" ADD COLUMN IF NOT EXISTS "verified_damage" text;-->statement-breakpoint
ALTER TABLE "claims" ADD COLUMN IF NOT EXISTS "claimed_amount" text;-->statement-breakpoint
ALTER TABLE "claims" ADD COLUMN IF NOT EXISTS "recovered_amount" text;-->statement-breakpoint
ALTER TABLE "claims" ADD COLUMN IF NOT EXISTS "claim_followup_deadline" date;-->statement-breakpoint
ALTER TABLE "claims" ADD COLUMN IF NOT EXISTS "negotiation_deadline" date;-->statement-breakpoint
ALTER TABLE "claims" ADD COLUMN IF NOT EXISTS "legal_action_deadline" date;-->statement-breakpoint

-- Clean up old stripe columns (if exist)
DROP INDEX IF EXISTS "stripe_customer_id_idx";-->statement-breakpoint
ALTER TABLE "organization" DROP COLUMN IF EXISTS "stripe_customer_id";-->statement-breakpoint
ALTER TABLE "organization" DROP COLUMN IF EXISTS "stripe_subscription_id";-->statement-breakpoint
ALTER TABLE "organization" DROP COLUMN IF EXISTS "stripe_subscription_price_id";-->statement-breakpoint
ALTER TABLE "organization" DROP COLUMN IF EXISTS "stripe_subscription_status";-->statement-breakpoint
ALTER TABLE "organization" DROP COLUMN IF EXISTS "stripe_subscription_current_period_end";
