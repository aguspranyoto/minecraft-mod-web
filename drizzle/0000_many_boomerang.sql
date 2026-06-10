CREATE TABLE "minecraft_mod_web_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "minecraft_mod_web_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"url" text NOT NULL,
	"bucket" text NOT NULL,
	"content_type" text,
	"size" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "minecraft_mod_web_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"content" text,
	"is_premium" boolean DEFAULT true NOT NULL,
	"files" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "minecraft_mod_web_products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "minecraft_mod_web_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "minecraft_mod_web_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "minecraft_mod_web_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"order_id" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "minecraft_mod_web_users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "minecraft_mod_web_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "minecraft_mod_web_verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "minecraft_mod_web_accounts" ADD CONSTRAINT "minecraft_mod_web_accounts_user_id_minecraft_mod_web_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."minecraft_mod_web_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minecraft_mod_web_sessions" ADD CONSTRAINT "minecraft_mod_web_sessions_user_id_minecraft_mod_web_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."minecraft_mod_web_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minecraft_mod_web_subscriptions" ADD CONSTRAINT "minecraft_mod_web_subscriptions_user_id_minecraft_mod_web_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."minecraft_mod_web_users"("id") ON DELETE cascade ON UPDATE no action;