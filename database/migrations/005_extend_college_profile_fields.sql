-- Migration 005: Persist the complete institution profile on colleges.
-- Safe for existing CampNova PostgreSQL databases.

ALTER TABLE colleges ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS reviews_count TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS stream TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS fees TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS cutoff TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS placement TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS avg_placement TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS highest_placement TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS recruiters TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS internship_support TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS eligibility TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS facilities_list TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS scholarships_info TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS courses_list TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS domains_list TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS video_url TEXT;

CREATE INDEX IF NOT EXISTS idx_colleges_name_lower ON colleges (LOWER(college_name));
