-- ==============================================================================
-- Migration 007: Add Social Media Link Columns to Mentors Table
-- ==============================================================================

ALTER TABLE mentors
    ADD COLUMN IF NOT EXISTS facebook_url  TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS linkedin_url  TEXT DEFAULT NULL;
