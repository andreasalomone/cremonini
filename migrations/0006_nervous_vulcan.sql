CREATE INDEX IF NOT EXISTS "claims_org_id_idx" ON "claims" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "claims_status_idx" ON "claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "claims_created_at_idx" ON "claims" USING btree ("created_at");