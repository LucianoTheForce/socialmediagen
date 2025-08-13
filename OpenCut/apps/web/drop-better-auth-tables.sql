-- Drop Better Auth tables migration script
-- Run this script after confirming all users have been migrated to Supabase Auth

-- Drop the Better Auth specific tables
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS verifications CASCADE;

-- Note: We keep the users table as it will be synchronized with Supabase Auth
-- Supabase will manage auth while we keep user metadata in our database

-- Update any remaining foreign key references if needed
-- The application tables already reference users.id which will work with Supabase UUIDs