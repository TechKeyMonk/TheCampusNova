-- Migration 004: Update colleges table for the real institutional dataset
-- Safe for existing CampNova PostgreSQL databases.

ALTER TABLE colleges ADD COLUMN IF NOT EXISTS aishe_code VARCHAR(50);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS location_type VARCHAR(50);

ALTER TABLE colleges ALTER COLUMN college_type DROP DEFAULT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'colleges'
          AND column_name = 'nirf_rank'
          AND data_type <> 'text'
    ) THEN
        ALTER TABLE colleges ALTER COLUMN nirf_rank TYPE TEXT USING nirf_rank::TEXT;
    END IF;
END $$;

ALTER TABLE colleges
    ALTER COLUMN status SET DEFAULT 'active';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.colleges'::regclass
          AND conname = 'colleges_status_check'
    ) THEN
        ALTER TABLE public.colleges
            ADD CONSTRAINT colleges_status_check
            CHECK (status IN ('active', 'inactive', 'pending_verification', 'archived'))
            NOT VALID;
    END IF;
END $$;

WITH legacy_rows AS (
    SELECT id, aishe_code
    FROM colleges
    WHERE aishe_code IS NULL OR btrim(aishe_code) = ''
)
UPDATE colleges c
SET aishe_code = 'legacy-' || c.id::TEXT
FROM legacy_rows l
WHERE c.id = l.id;

WITH duplicate_rows AS (
    SELECT id, aishe_code,
           ROW_NUMBER() OVER (PARTITION BY aishe_code ORDER BY id) AS rn
    FROM colleges
    WHERE aishe_code IS NOT NULL
)
UPDATE colleges c
SET aishe_code = c.aishe_code || '-' || d.rn::TEXT
FROM duplicate_rows d
WHERE c.id = d.id
  AND d.rn > 1;

ALTER TABLE colleges ALTER COLUMN aishe_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_colleges_aishe_code
    ON colleges (aishe_code);

CREATE INDEX IF NOT EXISTS idx_colleges_location_type
    ON colleges (location_type);

CREATE INDEX IF NOT EXISTS idx_colleges_status
    ON colleges (status);
