CREATE TYPE "public"."activity_type" AS ENUM('CREATED', 'STATUS_CHANGE', 'DOC_UPLOAD', 'DOC_DELETE', 'INFO_UPDATE', 'ECONOMICS_UPDATE');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "claim_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"claim_id" text NOT NULL,
	"user_id" text,
	"action_type" "activity_type" NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "claims" RENAME COLUMN "ddt_cmr_number" TO "document_number";--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "third_party_name" text;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "estimated_recovery" numeric(15, 2);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "claim_activities" ADD CONSTRAINT "claim_activities_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
