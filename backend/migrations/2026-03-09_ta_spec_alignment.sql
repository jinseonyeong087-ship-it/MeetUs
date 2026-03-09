-- TA spec alignment migration
-- Target: PostgreSQL
-- Date: 2026-03-09

BEGIN;

-- 1) Add missing columns used by updated backend code
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS owner_id UUID;

ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS role VARCHAR(50);

ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;

ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS assignee_member_id UUID;

-- 2) Backfill workspace_members defaults
UPDATE workspace_members
SET role = 'MEMBER'
WHERE role IS NULL OR role = '';

UPDATE workspace_members
SET created_at = NOW()
WHERE created_at IS NULL;

-- Ensure at least one OWNER per workspace
UPDATE workspace_members wm
SET role = 'OWNER'
FROM (
  SELECT DISTINCT ON (workspace_id) member_id, workspace_id
  FROM workspace_members
  ORDER BY workspace_id, created_at, member_id
) pick
WHERE wm.member_id = pick.member_id
  AND NOT EXISTS (
    SELECT 1
    FROM workspace_members x
    WHERE x.workspace_id = pick.workspace_id
      AND x.role = 'OWNER'
  );

-- 3) Backfill workspaces.owner_id
-- Priority 1: member with OWNER role
UPDATE workspaces w
SET owner_id = wm.user_id
FROM workspace_members wm
WHERE w.workspace_id = wm.workspace_id
  AND wm.role = 'OWNER'
  AND w.owner_id IS NULL;

-- Priority 2: first member if no OWNER row exists
UPDATE workspaces w
SET owner_id = pick.user_id
FROM (
  SELECT DISTINCT ON (workspace_id) workspace_id, user_id
  FROM workspace_members
  ORDER BY workspace_id, created_at, member_id
) pick
WHERE w.workspace_id = pick.workspace_id
  AND w.owner_id IS NULL;

-- 4) Defaults / nullability
ALTER TABLE workspace_members
  ALTER COLUMN role SET DEFAULT 'MEMBER';

ALTER TABLE workspace_members
  ALTER COLUMN role SET NOT NULL;

ALTER TABLE workspace_members
  ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE workspace_members
  ALTER COLUMN created_at SET NOT NULL;

-- owner_id NOT NULL only when all rows are backfilled
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM workspaces WHERE owner_id IS NULL) THEN
    ALTER TABLE workspaces ALTER COLUMN owner_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'workspaces.owner_id has NULL rows. Keeping nullable; fix data then set NOT NULL.';
  END IF;
END $$;

-- 5) Foreign keys (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_workspaces_owner_id'
  ) THEN
    ALTER TABLE workspaces
      ADD CONSTRAINT fk_workspaces_owner_id
      FOREIGN KEY (owner_id) REFERENCES users(user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_todos_assignee_member_id'
  ) THEN
    ALTER TABLE todos
      ADD CONSTRAINT fk_todos_assignee_member_id
      FOREIGN KEY (assignee_member_id) REFERENCES workspace_members(member_id);
  END IF;
END $$;

-- 6) Helpful index
CREATE INDEX IF NOT EXISTS idx_todos_assignee_member_id
  ON todos(assignee_member_id);

COMMIT;

