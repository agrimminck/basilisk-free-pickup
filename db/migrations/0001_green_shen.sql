ALTER TABLE "free_pickup"."token_purchases" ADD COLUMN "preference_id" varchar;--> statement-breakpoint
ALTER TABLE "free_pickup"."token_purchases" ADD COLUMN "mp_payment_id" varchar;--> statement-breakpoint
ALTER TABLE "free_pickup"."token_purchases" ADD COLUMN "mp_init_point" varchar;--> statement-breakpoint
ALTER TABLE "free_pickup"."token_purchases" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;