-- Add meeting failure reason column for AI failed webhook payload
-- Target: PostgreSQL
-- Date: 2026-03-11

BEGIN;

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;

COMMIT;
