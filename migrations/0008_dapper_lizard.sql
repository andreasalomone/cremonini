CREATE TYPE "public"."claim_state" AS ENUM('NATIONAL', 'INTERNATIONAL');--> statement-breakpoint
ALTER TYPE "public"."claim_type" ADD VALUE 'TERRESTRIAL' BEFORE 'TRANSPORT';--> statement-breakpoint
ALTER TYPE "public"."claim_type" ADD VALUE 'MARITIME' BEFORE 'TRANSPORT';--> statement-breakpoint
ALTER TYPE "public"."claim_type" ADD VALUE 'AIR' BEFORE 'TRANSPORT';--> statement-breakpoint
ALTER TYPE "public"."claim_type" ADD VALUE 'RAIL' BEFORE 'TRANSPORT';--> statement-breakpoint
ALTER TYPE "public"."claim_type" ADD VALUE 'STOCK_IN_TRANSIT' BEFORE 'TRANSPORT';--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "state" "claim_state" DEFAULT 'NATIONAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "document_path" text;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "stock_inbound_date" date;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "stock_outbound_date" date;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "has_stock_inbound_reserve" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "has_gross_negligence" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "path" text;--> statement-breakpoint
ALTER TABLE "power_of_attorney" ADD COLUMN "document_path" text;