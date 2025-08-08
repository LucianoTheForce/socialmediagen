-- ========================================
-- OpenCut Complete Database Migration for Supabase PostgreSQL
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS "project_exports" CASCADE;
DROP TABLE IF EXISTS "ai_image_generations" CASCADE;
DROP TABLE IF EXISTS "ai_text_generations" CASCADE;
DROP TABLE IF EXISTS "timeline_elements" CASCADE;
DROP TABLE IF EXISTS "project_collaborators" CASCADE;
DROP TABLE IF EXISTS "projects" CASCADE;
DROP TABLE IF EXISTS "user_media" CASCADE;
DROP TABLE IF EXISTS "media_folders" CASCADE;
DROP TABLE IF EXISTS "templates" CASCADE;
DROP TABLE IF EXISTS "template_categories" CASCADE;
DROP TABLE IF EXISTS "social_formats" CASCADE;
DROP TABLE IF EXISTS "accounts" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE; 
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "verifications" CASCADE;
DROP TABLE IF EXISTS "waitlist" CASCADE;

-- ========================================
-- Create Users Table (Better Auth)
-- ========================================
CREATE TABLE "users" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "email_verified" boolean NOT NULL DEFAULT false,
    "image" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
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
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ========================================
-- Create Sessions Table (Better Auth)
-- ========================================
CREATE TABLE "sessions" (
    "id" text PRIMARY KEY NOT NULL,
    "expires_at" timestamp NOT NULL,
    "token" text NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
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
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- ========================================
-- Create Waitlist Table
-- ========================================
CREATE TABLE "waitlist" (
    "id" text PRIMARY KEY NOT NULL,
    "email" text NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);

-- ========================================
-- Create Social Formats Table
-- ========================================
CREATE TABLE "social_formats" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "platform" text NOT NULL,
    "width" integer NOT NULL,
    "height" integer NOT NULL,
    "aspect_ratio" text NOT NULL,
    "max_duration" integer,
    "recommended_formats" jsonb DEFAULT '[]'::jsonb,
    "max_file_size" bigint,
    "supported_features" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "safe_zones" jsonb DEFAULT '[]'::jsonb,
    "branding_guidelines" jsonb,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ========================================
-- Create Template Categories Table
-- ========================================
CREATE TABLE "template_categories" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "description" text,
    "icon" text,
    "parent_id" uuid REFERENCES "template_categories"("id"),
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ========================================
-- Create Templates Table
-- ========================================
CREATE TABLE "templates" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "description" text,
    "category_id" uuid NOT NULL REFERENCES "template_categories"("id"),
    "tags" jsonb DEFAULT '[]'::jsonb,
    "social_format_id" uuid NOT NULL REFERENCES "social_formats"("id"),
    "thumbnail_url" text NOT NULL,
    "preview_url" text,
    "template_data" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "ai_prompts" jsonb,
    "placeholders" jsonb DEFAULT '[]'::jsonb,
    "usage_count" integer DEFAULT 0,
    "rating" decimal(3,2) DEFAULT 0,
    "rating_count" integer DEFAULT 0,
    "created_by" text REFERENCES "users"("id"),
    "visibility" text DEFAULT 'public',
    "is_active" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ========================================
-- Create Media Folders Table
-- ========================================
CREATE TABLE "media_folders" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "description" text,
    "color" text DEFAULT '#3b82f6',
    "parent_id" uuid REFERENCES "media_folders"("id"),
    "is_shared" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ========================================
-- Create User Media Table
-- ========================================
CREATE TABLE "user_media" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "filename" text NOT NULL,
    "original_name" text NOT NULL,
    "mime_type" text NOT NULL,
    "file_size" bigint NOT NULL,
    "storage_provider" text NOT NULL,
    "storage_key" text NOT NULL,
    "public_url" text NOT NULL,
    "media_type" text NOT NULL,
    "dimensions" jsonb,
    "duration" decimal(10,3),
    "thumbnail_url" text,
    "tags" jsonb DEFAULT '[]'::jsonb,
    "description" text,
    "folder_id" uuid REFERENCES "media_folders"("id"),
    "usage_count" integer DEFAULT 0,
    "last_used_at" timestamp,
    "ai_analysis" jsonb,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ========================================
-- Create Projects Table
-- ========================================
CREATE TABLE "projects" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "description" text,
    "template_id" uuid REFERENCES "templates"("id"),
    "social_format_id" uuid NOT NULL REFERENCES "social_formats"("id"),
    "canvases" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "active_canvas_id" text,
    "project_data" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "owner_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "status" text DEFAULT 'draft',
    "last_edited_by" text REFERENCES "users"("id"),
    "last_edited_at" timestamp DEFAULT now(),
    "exports" jsonb DEFAULT '[]'::jsonb,
    "share_settings" jsonb,
    "ai_generations_used" integer DEFAULT 0,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ========================================
-- Create Project Collaborators Table
-- ========================================
CREATE TABLE "project_collaborators" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "role" text NOT NULL,
    "permissions" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "status" text DEFAULT 'active',
    "invited_by" text REFERENCES "users"("id"),
    "invited_at" timestamp,
    "joined_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    CONSTRAINT "project_user_unique" UNIQUE("project_id", "user_id")
);

-- ========================================
-- Create Timeline Elements Table
-- ========================================
CREATE TABLE "timeline_elements" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "canvas_id" text NOT NULL,
    "type" text NOT NULL,
    "name" text NOT NULL,
    "track_index" integer NOT NULL,
    "start_time" decimal(10,3) NOT NULL,
    "duration" decimal(10,3) NOT NULL,
    "x" decimal(10,2) DEFAULT 0,
    "y" decimal(10,2) DEFAULT 0,
    "width" decimal(10,2),
    "height" decimal(10,2),
    "rotation" decimal(6,2) DEFAULT 0,
    "opacity" decimal(4,3) DEFAULT 1,
    "properties" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "ai_generated" boolean DEFAULT false,
    "ai_generation_id" uuid,
    "ai_provider" text,
    "is_synced" boolean DEFAULT false,
    "sync_group" text,
    "z_index" integer DEFAULT 1,
    "is_locked" boolean DEFAULT false,
    "is_hidden" boolean DEFAULT false,
    "created_by" text REFERENCES "users"("id"),
    "last_edited_by" text REFERENCES "users"("id"),
    "last_edited_at" timestamp DEFAULT now(),
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ========================================
-- Create AI Text Generations Table
-- ========================================
CREATE TABLE "ai_text_generations" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "prompt" text NOT NULL,
    "context" jsonb,
    "provider" text NOT NULL,
    "model" text NOT NULL,
    "generated_text" text NOT NULL,
    "alternatives" jsonb DEFAULT '[]'::jsonb,
    "tokens_used" integer,
    "cost" decimal(10,6),
    "response_time" integer,
    "applied_to_element" text,
    "is_used" boolean DEFAULT false,
    "user_rating" integer,
    "user_feedback" text,
    "created_at" timestamp NOT NULL DEFAULT now()
);

-- ========================================
-- Create AI Image Generations Table
-- ========================================
CREATE TABLE "ai_image_generations" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "prompt" text NOT NULL,
    "negative_prompt" text,
    "style" text,
    "provider" text NOT NULL,
    "width" integer NOT NULL,
    "height" integer NOT NULL,
    "seed" bigint,
    "steps" integer,
    "guidance" decimal(4,2),
    "image_url" text NOT NULL,
    "thumbnail_url" text,
    "alternatives" jsonb DEFAULT '[]'::jsonb,
    "generation_time" integer,
    "cost" decimal(10,6),
    "applied_to_element" text,
    "is_used" boolean DEFAULT false,
    "user_rating" integer,
    "user_feedback" text,
    "created_at" timestamp NOT NULL DEFAULT now()
);

-- ========================================
-- Create Project Exports Table
-- ========================================
CREATE TABLE "project_exports" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "canvas_id" text NOT NULL,
    "social_format_id" uuid NOT NULL REFERENCES "social_formats"("id"),
    "export_settings" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "status" text DEFAULT 'pending',
    "output_url" text,
    "thumbnail_url" text,
    "file_size" bigint,
    "duration" decimal(10,3),
    "processing_started_at" timestamp,
    "processing_completed_at" timestamp,
    "processing_time" integer,
    "error_message" text,
    "download_count" integer DEFAULT 0,
    "last_downloaded_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ========================================
-- Add Foreign Key Constraints
-- ========================================
ALTER TABLE "accounts" 
ADD CONSTRAINT "accounts_user_id_users_id_fk" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") 
ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "sessions" 
ADD CONSTRAINT "sessions_user_id_users_id_fk" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") 
ON DELETE CASCADE ON UPDATE NO ACTION;

-- ========================================
-- Create Indexes for Performance
-- ========================================

-- Authentication indexes
CREATE INDEX "idx_accounts_user_id" ON "accounts"("user_id");
CREATE INDEX "idx_sessions_user_id" ON "sessions"("user_id");
CREATE INDEX "idx_sessions_token" ON "sessions"("token");
CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_verifications_identifier" ON "verifications"("identifier");

-- Project and template indexes
CREATE INDEX "idx_projects_owner_created" ON "projects"("owner_id", "created_at" DESC);
CREATE INDEX "idx_templates_category_active" ON "templates"("category_id", "is_active", "is_featured");
CREATE INDEX "idx_templates_format_rating" ON "templates"("social_format_id", "rating" DESC);

-- Timeline and elements indexes
CREATE INDEX "idx_timeline_elements_project_canvas" ON "timeline_elements"("project_id", "canvas_id");
CREATE INDEX "idx_timeline_elements_track_time" ON "timeline_elements"("track_index", "start_time");
CREATE INDEX "idx_timeline_elements_sync_group" ON "timeline_elements"("sync_group");

-- AI generations indexes
CREATE INDEX "idx_ai_text_project" ON "ai_text_generations"("project_id");
CREATE INDEX "idx_ai_text_user" ON "ai_text_generations"("user_id");
CREATE INDEX "idx_ai_text_provider" ON "ai_text_generations"("provider");
CREATE INDEX "idx_ai_image_project" ON "ai_image_generations"("project_id");
CREATE INDEX "idx_ai_image_user" ON "ai_image_generations"("user_id");
CREATE INDEX "idx_ai_image_provider" ON "ai_image_generations"("provider");

-- Media and folders indexes
CREATE INDEX "idx_user_media_user" ON "user_media"("user_id");
CREATE INDEX "idx_user_media_type" ON "user_media"("media_type");
CREATE INDEX "idx_user_media_folder" ON "user_media"("folder_id");
CREATE INDEX "idx_media_folder_user" ON "media_folders"("user_id");
CREATE INDEX "idx_media_folder_parent" ON "media_folders"("parent_id");

-- Exports indexes
CREATE INDEX "idx_export_project" ON "project_exports"("project_id");
CREATE INDEX "idx_export_user" ON "project_exports"("user_id");
CREATE INDEX "idx_export_status" ON "project_exports"("status");

-- ========================================
-- Insert Default Social Formats
-- ========================================
INSERT INTO "social_formats" ("name", "slug", "platform", "width", "height", "aspect_ratio", "max_duration", "recommended_formats", "supported_features") VALUES
('Instagram Post', 'instagram-post', 'instagram', 1080, 1080, '1:1', NULL, '["jpg", "png"]', '{"supportsVideo": false, "supportsAudio": false, "supportsText": true, "supportsStickers": true, "supportsFilters": true, "maxLayers": 10, "supportsTransitions": false}'),
('Instagram Story', 'instagram-story', 'instagram', 1080, 1920, '9:16', 15, '["mp4", "mov", "jpg", "png"]', '{"supportsVideo": true, "supportsAudio": true, "supportsText": true, "supportsStickers": true, "supportsFilters": true, "maxLayers": 10, "supportsTransitions": true}'),
('Instagram Carousel', 'instagram-carousel', 'instagram', 1080, 1080, '1:1', NULL, '["jpg", "png"]', '{"supportsVideo": false, "supportsAudio": false, "supportsText": true, "supportsStickers": true, "supportsFilters": true, "maxLayers": 10, "supportsTransitions": false}'),
('TikTok Video', 'tiktok-video', 'tiktok', 1080, 1920, '9:16', 180, '["mp4", "mov"]', '{"supportsVideo": true, "supportsAudio": true, "supportsText": true, "supportsStickers": true, "supportsFilters": true, "maxLayers": 15, "supportsTransitions": true}'),
('YouTube Thumbnail', 'youtube-thumbnail', 'youtube', 1280, 720, '16:9', NULL, '["jpg", "png"]', '{"supportsVideo": false, "supportsAudio": false, "supportsText": true, "supportsStickers": false, "supportsFilters": true, "maxLayers": 8, "supportsTransitions": false}'),
('Facebook Post', 'facebook-post', 'facebook', 1200, 630, '1.91:1', NULL, '["jpg", "png", "mp4"]', '{"supportsVideo": true, "supportsAudio": true, "supportsText": true, "supportsStickers": false, "supportsFilters": true, "maxLayers": 8, "supportsTransitions": false}'),
('LinkedIn Post', 'linkedin-post', 'linkedin', 1200, 627, '1.91:1', NULL, '["jpg", "png"]', '{"supportsVideo": false, "supportsAudio": false, "supportsText": true, "supportsStickers": false, "supportsFilters": false, "maxLayers": 5, "supportsTransitions": false}'),
('Twitter Post', 'twitter-post', 'twitter', 1200, 675, '16:9', NULL, '["jpg", "png"]', '{"supportsVideo": false, "supportsAudio": false, "supportsText": true, "supportsStickers": false, "supportsFilters": true, "maxLayers": 5, "supportsTransitions": false}');

-- ========================================
-- Insert Default Template Categories
-- ========================================
INSERT INTO "template_categories" ("name", "slug", "description", "icon") VALUES
('Business', 'business', 'Professional templates for business content', 'briefcase'),
('Social Media', 'social-media', 'Templates optimized for social platforms', 'share'),
('Marketing', 'marketing', 'Promotional and marketing templates', 'megaphone'),
('Education', 'education', 'Educational and informational templates', 'book'),
('Entertainment', 'entertainment', 'Fun and engaging templates', 'film'),
('Health & Fitness', 'health-fitness', 'Health and wellness templates', 'heart'),
('Food & Beverage', 'food-beverage', 'Culinary and restaurant templates', 'utensils'),
('Technology', 'technology', 'Tech and innovation templates', 'laptop'),
('Travel', 'travel', 'Travel and adventure templates', 'plane'),
('Fashion', 'fashion', 'Style and fashion templates', 'shirt');

-- ========================================
-- Enable Row Level Security (RLS) on relevant tables
-- ========================================
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_collaborators" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "timeline_elements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_text_generations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_image_generations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_exports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "media_folders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "templates" ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Create RLS Policies
-- ========================================

-- Users can only access their own projects
CREATE POLICY "users_own_projects" ON "projects"
FOR ALL USING ("owner_id" = auth.uid()::text);

-- Users can access projects they're collaborators on
CREATE POLICY "collaborator_project_access" ON "projects"
FOR ALL USING (
    "id" IN (
        SELECT "project_id" FROM "project_collaborators"
        WHERE "user_id" = auth.uid()::text AND "status" = 'active'
    )
);

-- Users can access their own media
CREATE POLICY "users_own_media" ON "user_media"
FOR ALL USING ("user_id" = auth.uid()::text);

-- Users can access their own media folders
CREATE POLICY "users_own_folders" ON "media_folders"
FOR ALL USING ("user_id" = auth.uid()::text);

-- Users can access timeline elements for their projects
CREATE POLICY "timeline_elements_project_access" ON "timeline_elements"
FOR ALL USING (
    "project_id" IN (
        SELECT "id" FROM "projects"
        WHERE "owner_id" = auth.uid()::text
        OR "id" IN (
            SELECT "project_id" FROM "project_collaborators"
            WHERE "user_id" = auth.uid()::text AND "status" = 'active'
        )
    )
);

-- Users can access AI generations for their projects
CREATE POLICY "ai_text_generations_access" ON "ai_text_generations"
FOR ALL USING ("user_id" = auth.uid()::text);

CREATE POLICY "ai_image_generations_access" ON "ai_image_generations"
FOR ALL USING ("user_id" = auth.uid()::text);

-- Users can access exports for their projects
CREATE POLICY "project_exports_access" ON "project_exports"
FOR ALL USING ("user_id" = auth.uid()::text);

-- Public templates are accessible to all authenticated users
CREATE POLICY "public_templates_access" ON "templates"
FOR SELECT USING ("visibility" = 'public' AND "is_active" = true);

-- Users can access their own private templates
CREATE POLICY "private_templates_access" ON "templates"
FOR ALL USING ("created_by" = auth.uid()::text);

-- ========================================
-- Migration Complete
-- ========================================

-- Create a function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON "accounts"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON "sessions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verifications_updated_at BEFORE UPDATE ON "verifications"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON "projects"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON "templates"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_elements_updated_at BEFORE UPDATE ON "timeline_elements"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SUCCESS: Database migration completed!
-- ========================================