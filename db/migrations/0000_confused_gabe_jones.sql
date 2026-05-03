CREATE SCHEMA "free_pickup";
--> statement-breakpoint
CREATE TYPE "free_pickup"."item_category" AS ENUM('muebles', 'electrodomesticos', 'ropa', 'electronica', 'juguetes', 'libros', 'otros');--> statement-breakpoint
CREATE TYPE "free_pickup"."item_status" AS ENUM('available', 'reserved', 'picked_up');--> statement-breakpoint
CREATE TYPE "free_pickup"."item_type" AS ENUM('donation', 'sale');--> statement-breakpoint
CREATE TYPE "free_pickup"."match_status" AS ENUM('pending', 'confirmed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "free_pickup"."match_type" AS ENUM('donante_fletero', 'cliente_cliente');--> statement-breakpoint
CREATE TYPE "free_pickup"."role" AS ENUM('donante', 'fletero', 'cliente');--> statement-breakpoint
CREATE TYPE "free_pickup"."token_purchase_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "free_pickup"."token_transaction_type" AS ENUM('purchase', 'match_spend', 'free_match', 'refund', 'bonus');--> statement-breakpoint
CREATE TABLE "free_pickup"."account" (
	"id" varchar PRIMARY KEY NOT NULL,
	"account_id" varchar NOT NULL,
	"provider_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"access_token" varchar,
	"refresh_token" varchar,
	"id_token" varchar,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" varchar,
	"password" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "free_pickup"."item_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"r2_key" varchar NOT NULL,
	"r2_url" varchar NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "free_pickup"."items" (
	"id" serial PRIMARY KEY NOT NULL,
	"donante_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"category" "free_pickup"."item_category" NOT NULL,
	"item_type" "free_pickup"."item_type" DEFAULT 'donation' NOT NULL,
	"price" integer,
	"status" "free_pickup"."item_status" DEFAULT 'available' NOT NULL,
	"address" varchar NOT NULL,
	"neighborhood" varchar,
	"city" varchar NOT NULL,
	"lat" numeric,
	"lng" numeric,
	"reserved_by_fleeter_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "free_pickup"."matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"requester_id" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"item_id" integer,
	"match_type" "free_pickup"."match_type" NOT NULL,
	"status" "free_pickup"."match_status" DEFAULT 'pending' NOT NULL,
	"token_cost" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "free_pickup"."profiles" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"role" "free_pickup"."role" DEFAULT 'cliente' NOT NULL,
	"full_name" varchar NOT NULL,
	"phone" varchar,
	"tokens_balance" integer DEFAULT 0 NOT NULL,
	"free_matches_used" integer DEFAULT 0 NOT NULL,
	"free_matches_reset_at" timestamp,
	"average_rating" numeric(2, 1),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "free_pickup"."reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"reviewer_id" varchar NOT NULL,
	"reviewee_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "free_pickup"."session" (
	"id" varchar PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar,
	"user_agent" varchar,
	"user_id" varchar NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "free_pickup"."token_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" varchar NOT NULL,
	"amount_paid_cents" integer NOT NULL,
	"tokens_purchased" integer NOT NULL,
	"status" "free_pickup"."token_purchase_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "free_pickup"."token_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" varchar NOT NULL,
	"amount" integer NOT NULL,
	"transaction_type" "free_pickup"."token_transaction_type" NOT NULL,
	"description" varchar,
	"match_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "free_pickup"."user" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "free_pickup"."verification" (
	"id" varchar PRIMARY KEY NOT NULL,
	"identifier" varchar NOT NULL,
	"value" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "free_pickup"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "free_pickup"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_pickup"."item_photos" ADD CONSTRAINT "item_photos_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "free_pickup"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_pickup"."items" ADD CONSTRAINT "items_donante_id_profiles_id_fk" FOREIGN KEY ("donante_id") REFERENCES "free_pickup"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_pickup"."items" ADD CONSTRAINT "items_reserved_by_fleeter_id_profiles_id_fk" FOREIGN KEY ("reserved_by_fleeter_id") REFERENCES "free_pickup"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_pickup"."matches" ADD CONSTRAINT "matches_requester_id_profiles_id_fk" FOREIGN KEY ("requester_id") REFERENCES "free_pickup"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_pickup"."matches" ADD CONSTRAINT "matches_recipient_id_profiles_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "free_pickup"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_pickup"."matches" ADD CONSTRAINT "matches_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "free_pickup"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_pickup"."profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "free_pickup"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_pickup"."reviews" ADD CONSTRAINT "reviews_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "free_pickup"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_pickup"."reviews" ADD CONSTRAINT "reviews_reviewer_id_profiles_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "free_pickup"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_pickup"."reviews" ADD CONSTRAINT "reviews_reviewee_id_profiles_id_fk" FOREIGN KEY ("reviewee_id") REFERENCES "free_pickup"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_pickup"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "free_pickup"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_pickup"."token_purchases" ADD CONSTRAINT "token_purchases_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "free_pickup"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_pickup"."token_transactions" ADD CONSTRAINT "token_transactions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "free_pickup"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_pickup"."token_transactions" ADD CONSTRAINT "token_transactions_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "free_pickup"."matches"("id") ON DELETE no action ON UPDATE no action;