-- ============================================================
-- CARNAGE MIGRATION 03
-- Date: 2026-05-10
-- Source: Venom Finding 5 + Wolverine Item 6
-- Title: Enforce server-side accepted_at via DB default
-- Status: STAGED — must be reviewed and applied via Supabase SQL editor or CLI
-- ============================================================

-- The app DAL (userConsents.write.dal.js) no longer sends accepted_at in the insert
-- payload — it relies on the DB DEFAULT now(). This migration verifies and enforces
-- that the column default is in place, and adds a trigger guard that prevents any
-- insert from supplying a manually-set accepted_at that deviates from server time
-- by more than 10 seconds.
--
-- If the column already has DEFAULT now(), this migration is informational only.
-- Run the verification query below first.

-- 1. Ensure accepted_at has a server-side default.
--    This is a no-op if the default already exists.
ALTER TABLE platform.user_consents
  ALTER COLUMN accepted_at SET DEFAULT now();

-- 2. Trigger: reject any insert where accepted_at is manually set to a value
--    more than 10 seconds from the current DB time.
--    This prevents clock-manipulation attacks even if a future code path re-introduces
--    client-side accepted_at.
CREATE OR REPLACE FUNCTION platform.enforce_server_accepted_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.accepted_at IS NOT NULL AND
     abs(extract(epoch FROM (NEW.accepted_at - now()))) > 10 THEN
    RAISE EXCEPTION
      'platform.user_consents: accepted_at must be within 10 seconds of server time (received: %)',
      NEW.accepted_at;
  END IF;
  -- Overwrite with server time regardless
  NEW.accepted_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_server_accepted_at ON platform.user_consents;
CREATE TRIGGER trg_enforce_server_accepted_at
  BEFORE INSERT ON platform.user_consents
  FOR EACH ROW EXECUTE FUNCTION platform.enforce_server_accepted_at();

-- ============================================================
-- VERIFY AFTER APPLYING:
--   SELECT column_name, column_default, is_nullable
--   FROM information_schema.columns
--   WHERE table_schema = 'platform'
--     AND table_name = 'user_consents'
--     AND column_name = 'accepted_at';
-- ============================================================
