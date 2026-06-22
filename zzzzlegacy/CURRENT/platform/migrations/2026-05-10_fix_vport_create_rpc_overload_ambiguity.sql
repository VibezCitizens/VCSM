-- Migration: Fix vport.create_vport RPC overload ambiguity
-- Scope: vport schema (DB only — no app code changes)
-- Drops the legacy 6-arg overload. Hardens search_path on canonical 7-arg version.
--
-- Background:
--   Two overloads of vport.create_vport existed:
--     1. 6-arg (no p_directory_visible) — old, wrong search_path order, no callers
--     2. 7-arg (with p_directory_visible) — canonical, called by vport.core.dal.js
--   PostgREST returns 300 Multiple Choices if a caller sends params matching both.
--   Production DAL sends 7 params so was correctly resolved, but the dead overload
--   is a fragile surface and the 6-arg search_path has public first (CVE-2018-1058).
--
-- Safe: no app code calls the 6-arg version.
--       Diagnostics use supabase.schema('vc').rpc('create_vport') — different schema entirely.
--
-- Rollback: see ROLLBACK section at bottom of this file.

-- ── Step 1: Drop legacy 6-argument overload ──────────────────────────────────
DROP FUNCTION IF EXISTS vport.create_vport(
  text, text, text, text, text, text
);

-- ── Step 2: Harden search_path on canonical 7-arg version ────────────────────
-- Adds pg_temp to block temp-schema injection (CVE-2018-1058).
-- Previous path was: 'vport', 'vc', 'public', 'auth' (missing pg_temp).
ALTER FUNCTION vport.create_vport(
  text, text, text, text, text, text, boolean
) SET search_path TO 'vport', 'vc', 'public', 'auth', 'pg_temp';


-- ── Validation queries (run after applying) ──────────────────────────────────
/*
-- 1. Confirm only one overload remains
SELECT
  pg_get_function_identity_arguments(p.oid) AS signature,
  count(*) AS overload_count
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'vport' AND p.proname = 'create_vport'
GROUP BY signature;
-- Expected: 1 row — 7-arg signature with p_directory_visible boolean

-- 2. Confirm search_path includes pg_temp
SELECT unnest(proconfig) AS config_entry
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'vport' AND p.proname = 'create_vport';
-- Expected: search_path=vport, vc, public, auth, pg_temp

-- 3. Confirm EXECUTE grant preserved for authenticated
SELECT has_function_privilege('authenticated', p.oid, 'execute') AS can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'vport' AND p.proname = 'create_vport';
-- Expected: true

-- 4. Confirm delegate still passes p_directory_visible
SELECT pg_get_functiondef(p.oid) LIKE '%p_directory_visible%' AS passes_directory_visible
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'vport' AND p.proname = 'create_vport';
-- Expected: true
*/


-- ── ROLLBACK ─────────────────────────────────────────────────────────────────
/*
CREATE OR REPLACE FUNCTION vport.create_vport(
  p_slug                 text,
  p_name                 text,
  p_primary_category_key text,
  p_bio                  text DEFAULT NULL,
  p_avatar_url           text DEFAULT NULL,
  p_banner_url           text DEFAULT NULL
)
RETURNS TABLE(profile_id uuid, actor_id uuid, slug text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'auth', 'platform', 'vc', 'vport'
AS $$
declare
  v_actor_id uuid;
  v_user_id  uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;

  select a.id into v_actor_id
  from vc.actors a
  where a.id in (select vc.actor_ids_for_current_user())
    and a.kind = 'user'
    and coalesce(a.is_void, false) = false
  order by a.created_at asc
  limit 1;

  if v_actor_id is null then raise exception 'ACTOR_NOT_FOUND'; end if;

  return query
  select * from vport.create_vport_for_actor(
    p_actor_id             := v_actor_id,
    p_owner_user_id        := v_user_id,
    p_slug                 := p_slug,
    p_name                 := p_name,
    p_primary_category_key := p_primary_category_key,
    p_bio                  := p_bio,
    p_avatar_url           := p_avatar_url,
    p_banner_url           := p_banner_url
  );
end;
$$;

ALTER FUNCTION vport.create_vport(
  text, text, text, text, text, text, boolean
) SET search_path TO 'vport', 'vc', 'public', 'auth';
*/
