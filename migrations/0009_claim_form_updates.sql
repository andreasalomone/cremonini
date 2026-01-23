ALTER TABLE "claims" RENAME COLUMN "ddt_cmr_number" TO "document_number";--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "third_party_name" text;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "estimated_recovery" numeric(15, 2);
