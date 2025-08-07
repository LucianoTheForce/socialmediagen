-- ========================================
-- OpenCut Database Migration to Upstash PostgreSQL
-- ========================================

-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS "accounts" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE; 
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "verifications" CASCADE;
DROP TABLE IF EXISTS "waitlist" CASCADE;

-- ========================================
-- Create Users Table
-- ========================================
CREATE TABLE "users" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "email_verified" boolean NOT NULL DEFAULT false,
    "image" text,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL,
    CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- ========================================
-- Create Accounts Table (Better Auth)
-- ========================================
CREATE TABLE "accounts" (
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
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL
);

-- ========================================
-- Create Sessions Table (Better Auth)
-- ========================================
CREATE TABLE "sessions" (
    "id" text PRIMARY KEY NOT NULL,
    "expires_at" timestamp NOT NULL,
    "token" text NOT NULL,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL,
    "ip_address" text,
    "user_agent" text,
    "user_id" text NOT NULL,
    CONSTRAINT "sessions_token_unique" UNIQUE("token")
);

-- ========================================
-- Create Verifications Table (Better Auth)
-- ========================================
CREATE TABLE "verifications" (
    "id" text PRIMARY KEY NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp,
    "updated_at" timestamp
);

-- ========================================
-- Create Waitlist Table
-- ========================================
CREATE TABLE "waitlist" (
    "id" text PRIMARY KEY NOT NULL,
    "email" text NOT NULL,
    "created_at" timestamp NOT NULL,
    CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);

-- ========================================
-- Add Foreign Key Constraints
-- ========================================
ALTER TABLE "accounts" 
ADD CONSTRAINT "accounts_user_id_users_id_fk" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") 
ON DELETE cascade ON UPDATE no action;

ALTER TABLE "sessions" 
ADD CONSTRAINT "sessions_user_id_users_id_fk" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") 
ON DELETE cascade ON UPDATE no action;

-- ========================================
-- Create Indexes for Performance
-- ========================================
CREATE INDEX "idx_accounts_user_id" ON "accounts"("user_id");
CREATE INDEX "idx_sessions_user_id" ON "sessions"("user_id");
CREATE INDEX "idx_sessions_token" ON "sessions"("token");
CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_verifications_identifier" ON "verifications"("identifier");

-- ========================================
-- Migration Complete
-- ========================================