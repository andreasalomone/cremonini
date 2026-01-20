CREATE TYPE "public"."claim_status" AS ENUM('OPEN', 'DOCS_COLLECTION', 'NEGOTIATION', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."claim_type" AS ENUM('TRANSPORT', 'STOCK', 'DEPOSIT');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "claims" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"creator_id" text,
	"status" "claim_status" DEFAULT 'OPEN' NOT NULL,
	"type" "claim_type" NOT NULL,
	"event_date" date NOT NULL,
	"carrier_name" text,
	"estimated_value" text,
	"description" text,
	"document_url" text,
	"reserve_deadline" date,
	"prescription_deadline" date,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
