ALTER TABLE "claims" ALTER COLUMN "estimated_value" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "claims" ALTER COLUMN "verified_damage" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "claims" ALTER COLUMN "claimed_amount" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "claims" ALTER COLUMN "recovered_amount" SET DATA TYPE numeric(15, 2);