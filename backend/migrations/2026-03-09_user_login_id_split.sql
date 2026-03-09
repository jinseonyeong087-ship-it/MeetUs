-- Split user identifiers:
-- - user_id: internal management UUID
-- - login_id: user-facing login identifier
-- Target: PostgreSQL
-- Date: 2026-03-09

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS login_id VARCHAR(100);

-- Normalize empty values
UPDATE users
SET login_id = NULL
WHERE login_id IS NOT NULL AND btrim(login_id) = '';

-- Backfill missing login_id from email local-part.
-- Duplicate local-parts get numeric suffixes: user, user_2, user_3...
WITH seed AS (
  SELECT
    user_id,
    lower(split_part(email, '@', 1)) AS base_login_id,
    row_number() OVER (
      PARTITION BY lower(split_part(email, '@', 1))
      ORDER BY created_at, user_id
    ) AS rn
  FROM users
),
candidate AS (
  SELECT
    user_id,
    CASE
      WHEN rn = 1 THEN base_login_id
      ELSE base_login_id || '_' || rn::text
    END AS generated_login_id
  FROM seed
)
UPDATE users u
SET login_id = c.generated_login_id
FROM candidate c
WHERE u.user_id = c.user_id
  AND u.login_id IS NULL;

-- Enforce constraints only when safe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE login_id IS NULL) THEN
    ALTER TABLE users ALTER COLUMN login_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'users.login_id has NULL rows. Keeping nullable; fix data then set NOT NULL.';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM (
      SELECT login_id
      FROM users
      GROUP BY login_id
      HAVING count(*) > 1
    ) d
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'uq_users_login_id'
    ) THEN
      ALTER TABLE users
        ADD CONSTRAINT uq_users_login_id UNIQUE (login_id);
    END IF;
  ELSE
    RAISE NOTICE 'users.login_id has duplicates. Keeping UNIQUE unset; fix data then add unique.';
  END IF;
END $$;

COMMIT;

