-- Migration 008: Ensure all 19 module tables have a status column for uniform workflow synchronization
ALTER TABLE rankings ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE placements ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE exam_preparation ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Set default active on any existing rows with null status
UPDATE rankings SET status = 'active' WHERE status IS NULL;
UPDATE placements SET status = 'active' WHERE status IS NULL;
UPDATE facilities SET status = 'active' WHERE status IS NULL;
UPDATE exam_preparation SET status = 'active' WHERE status IS NULL;
