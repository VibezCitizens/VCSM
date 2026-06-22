-- ============================================================
-- STEP 5B: SEARCH_PATH HARDENING — TRIGGER & WANDERS FUNCTIONS
--
-- Run AFTER Step 5.
--
-- Findings from snapshot audit:
--
-- ALREADY HARDENED (have SET search_path — no action needed):
--   public.tg_notify_comment_likes        SET search_path TO 'public'
--   public.tg_notify_followers            SET search_path TO 'public'
--   public.tg_notify_post_comments        SET search_path TO 'public'
--   public.tg_notify_post_reactions_unified SET search_path TO 'public'
--   public.tg_notify_roses_ledger         SET search_path TO 'public'
--   public.tg_notify_story_reactions      SET search_path TO 'public'
--   public.tg_notify_vport_post_reactions SET search_path TO 'public'
--   public.tg_notify_vport_roses          SET search_path TO 'public'
--   public.tg_notify_vport_story_reactions SET search_path TO 'public'
--   vc.after_message_deleted_recompute    SET search_path TO 'vc', 'public'
--   vc.trg_actors_ensure_owner            SET search_path TO 'vc', 'public'
--   vc.trg_reconcile_on_actor_follows     SET search_path TO 'vc', 'public'
--   vc.trg_sfr_apply_accept_to_actor_follows SET search_path TO 'vc', 'public'
--   vc.trg_sfr_apply_status_to_actor_follows SET search_path TO 'vc', 'public'
--   vc.trg_vport_review_ratings_set_vport_type SET search_path TO 'vc', 'public'
--   vc.lovedrop_get_card_by_public_id     SET search_path TO 'vc', 'public'
--   vc.lovedrop_record_open               SET search_path TO 'vc', 'public'
--   vc.lovedrop_upsert_anon_identity      SET search_path TO 'vc', 'public'
--   wanders.bind_recipient_on_reply       SET search_path TO 'wanders', 'public'
--
-- NEEDS HARDENING (SECURITY DEFINER, no SET search_path in snapshot):
--   wanders.create_inbox_share_link  ← fixed below
--   wanders.drop_send_card           ← fixed below
--   wanders.redeem_inbox_share_link  ← fixed below
--
-- POST-SNAPSHOT ADDITIONS (not in full_schema.sql — verify live):
--   vc.trg_actor_follows_notify
--   vc.trg_comment_like_notify
--   vc.trg_follow_accept_notify
--   vc.trg_follow_request_notify
--   vc.trg_post_comments_notify
--   vc.trg_post_dislike_notify
--   vc.trg_post_like_notify
--   vc.trg_post_mentions_notify
--   vc.trg_post_reactions_notify
--   vc.trg_post_rose_gifts_notify
--   vc.trg_social_follow_requests_accept_notify
--   vc.trg_social_follow_requests_notify
--   See Part B below for the live-check query and patch procedure.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- PART A: wanders SECURITY DEFINER functions — add SET search_path
-- Bodies taken verbatim from full_schema.sql snapshot; only
-- the SET search_path TO 'wanders', 'public', 'pg_temp' line is new.
-- ─────────────────────────────────────────────────────────────

-- A1: wanders.create_inbox_share_link
CREATE OR REPLACE FUNCTION wanders.create_inbox_share_link(p_inbox_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'wanders', 'public', 'pg_temp'
AS $$
declare
  v_token text := encode(gen_random_bytes(32), 'hex');
  v_pin   text := substr(encode(gen_random_bytes(8), 'hex'), 1, 10);
  v_token_hash text := encode(digest(v_token, 'sha256'), 'hex');
  v_pin_hash   text := encode(digest(v_pin, 'sha256'), 'hex');
begin
  -- TODO: enforce ownership (owner_user_id OR owner_client_key via your rules)

  insert into wanders.inbox_share_links (
    inbox_id, token_hash, pin_hash, expires_at, max_uses
  ) values (
    p_inbox_id, v_token_hash, v_pin_hash, now() + interval '14 days', 5
  );

  return jsonb_build_object(
    'token', v_token,
    'pin', v_pin
  );
end;
$$;


-- A2: wanders.drop_send_card
CREATE OR REPLACE FUNCTION wanders.drop_send_card(
  p_drop_public_id text,
  p_client_key text,
  p_template_key text,
  p_message_text text,
  p_customization jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'wanders', 'public', 'pg_temp'
AS $$
declare
  v_drop wanders.inbox_drop_links;
  v_inbox wanders.inboxes;
  v_sender_anon uuid;
  v_card_id uuid;
  v_card_public_id text;
begin
  if p_drop_public_id is null or length(trim(p_drop_public_id)) = 0 then
    raise exception 'drop_public_id required';
  end if;

  if p_client_key is null or length(trim(p_client_key)) = 0 then
    raise exception 'client_key required';
  end if;

  if p_template_key is null or length(trim(p_template_key)) = 0 then
    raise exception 'template_key required';
  end if;

  select *
    into v_drop
  from wanders.inbox_drop_links
  where public_id = p_drop_public_id
    and is_active = true
    and (expires_at is null or expires_at > now())
  limit 1;

  if v_drop.id is null then
    raise exception 'drop link not found or inactive';
  end if;

  select *
    into v_inbox
  from wanders.inboxes
  where id = v_drop.inbox_id
    and is_active = true
  limit 1;

  if v_inbox.id is null then
    raise exception 'inbox not found or inactive';
  end if;

  if v_inbox.accepts_anon is not true then
    raise exception 'inbox does not accept anon';
  end if;

  select id into v_sender_anon
  from wanders.anon_identities
  where client_key = p_client_key
  order by created_at desc
  limit 1;

  if v_sender_anon is null then
    raise exception 'anon identity not found';
  end if;

  insert into wanders.cards (
    public_id, realm_id, status, sent_at,
    sender_anon_id,
    recipient_anon_id,
    recipient_channel,
    message_text,
    template_key,
    customization,
    is_anonymous,
    inbox_id
  )
  values (
    gen_random_uuid()::text,
    v_inbox.realm_id,
    'sent',
    now(),
    v_sender_anon,
    v_drop.owner_anon_id,
    'link',
    p_message_text,
    p_template_key,
    coalesce(p_customization, '{}'::jsonb),
    true,
    v_inbox.id
  )
  returning id, public_id into v_card_id, v_card_public_id;

  insert into wanders.mailbox_items (card_id, owner_anon_id, owner_role, folder, is_read)
  values (v_card_id, v_drop.owner_anon_id, 'recipient', v_inbox.default_folder, false);

  insert into wanders.mailbox_items (card_id, owner_anon_id, owner_role, folder, is_read)
  values (v_card_id, v_sender_anon, 'sender', 'outbox', true);

  insert into wanders.card_events (card_id, anon_id, event_type, meta)
  values (v_card_id, v_sender_anon, 'sent', jsonb_build_object('via', 'drop_link', 'drop_public_id', p_drop_public_id));

  return jsonb_build_object('ok', true, 'card_public_id', v_card_public_id);
end;
$$;


-- A3: wanders.redeem_inbox_share_link
CREATE OR REPLACE FUNCTION wanders.redeem_inbox_share_link(
  p_token text,
  p_pin text,
  p_client_key text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'wanders', 'public', 'pg_temp'
AS $$
declare
  v_token_hash text := encode(digest(p_token, 'sha256'), 'hex');
  v_pin_hash   text := encode(digest(p_pin,   'sha256'), 'hex');
  v_inbox_id uuid;
begin
  select inbox_id into v_inbox_id
  from wanders.inbox_share_links
  where token_hash = v_token_hash
    and pin_hash = v_pin_hash
    and is_active = true
    and (expires_at is null or expires_at > now())
    and used_count < max_uses
  for update;

  if v_inbox_id is null then
    raise exception 'invalid_link_or_pin';
  end if;

  update wanders.inbox_share_links
    set used_count = used_count + 1
  where token_hash = v_token_hash;

  update wanders.mailbox_items mi
  set owner_client_key = p_client_key,
      updated_at = now()
  from wanders.cards c
  where c.id = mi.card_id
    and c.inbox_id = v_inbox_id
    and mi.owner_user_id is null
    and mi.owner_role = 'recipient';

  return v_inbox_id;
end;
$$;


-- ─────────────────────────────────────────────────────────────
-- PART B: vc.trg_*_notify — POST-SNAPSHOT FUNCTIONS
--
-- These 12 trigger functions exist in all_functions.csv as
-- SECURITY DEFINER but their bodies are not in full_schema.sql
-- (they were created after the snapshot was taken).
--
-- Step 1: Run this query in Supabase SQL Editor to check which
--         ones are missing SET search_path:
-- ─────────────────────────────────────────────────────────────

/*
SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security,
  p.proconfig AS config_options
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'vc'
  AND p.proname IN (
    'trg_actor_follows_notify',
    'trg_comment_like_notify',
    'trg_follow_accept_notify',
    'trg_follow_request_notify',
    'trg_post_comments_notify',
    'trg_post_dislike_notify',
    'trg_post_like_notify',
    'trg_post_mentions_notify',
    'trg_post_reactions_notify',
    'trg_post_rose_gifts_notify',
    'trg_social_follow_requests_accept_notify',
    'trg_social_follow_requests_notify'
  )
ORDER BY p.proname;
*/

-- Step 2: For any row where config_options is NULL or does not contain
--         'search_path=...', retrieve its full body:
--
-- SELECT pg_get_functiondef(p.oid)
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'vc'
--   AND p.proname = '<function_name>';
--
-- Step 3: Copy the body, add:
--   SET search_path TO 'vc', 'public', 'pg_temp'
-- and run as CREATE OR REPLACE FUNCTION.
--
-- Template:
-- CREATE OR REPLACE FUNCTION vc.<function_name>()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path TO 'vc', 'public', 'pg_temp'
-- AS $$
-- <original body>
-- $$;
