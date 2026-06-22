-- ============================================================
-- CARNAGE MIGRATION 01
-- Date: 2026-05-10
-- Source: Venom Finding 3 + Wolverine Item 5
-- Title: platform.user_consents — INSERT GRANT + immutability enforcement
-- Status: STAGED — must be reviewed and applied via Supabase SQL editor or CLI
-- ============================================================

-- 1. Ensure authenticated role can insert consent rows.
--    This grant must be tracked to survive a fresh deployment.
GRANT INSERT ON platform.user_consents TO authenticated;

-- 2. Explicit immutability: deny UPDATE on consent rows for authenticated users.
--    RLS with no permissive policy silently denies — this makes it explicit and auditable.
CREATE POLICY user_consents_deny_update
  ON platform.user_consents
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (false);

-- 3. Explicit immutability: deny DELETE on consent rows for authenticated users.
CREATE POLICY user_consents_deny_delete
  ON platform.user_consents
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (false);

-- 4. Trigger to prevent mutation of legal audit fields after insert.
--    Catches any UPDATE that slips through (e.g. via service_role that bypasses RLS).
CREATE OR REPLACE FUNCTION platform.prevent_consent_audit_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.user_id        IS DISTINCT FROM OLD.user_id        OR
     NEW.legal_document_id IS DISTINCT FROM OLD.legal_document_id OR
     NEW.accepted_at    IS DISTINCT FROM OLD.accepted_at    OR
     NEW.accepted        IS DISTINCT FROM OLD.accepted THEN
    RAISE EXCEPTION 'platform.user_consents audit fields are immutable after insert';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_consent_audit_mutation ON platform.user_consents;
CREATE TRIGGER trg_prevent_consent_audit_mutation
  BEFORE UPDATE ON platform.user_consents
  FOR EACH ROW EXECUTE FUNCTION platform.prevent_consent_audit_mutation();

-- ============================================================
-- VERIFY AFTER APPLYING:
--   SELECT grantee, privilege_type FROM information_schema.role_table_grants
--   WHERE table_schema = 'platform' AND table_name = 'user_consents';
--
--   SELECT polname, polcmd, polroles FROM pg_policies
--   WHERE schemaname = 'platform' AND tablename = 'user_consents';
-- ============================================================
