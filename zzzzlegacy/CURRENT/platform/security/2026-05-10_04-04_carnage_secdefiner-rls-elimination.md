# CARNAGE / DB / VENOM — SECURITY DEFINER Elimination Plan
**Date:** 2026-05-10  
**Timestamp:** 04-04  
**Mode:** Read-only planning — no SQL executed, proposals only  
**Scope:** VCSM + ENGINE (all schemas: public, vc, chat, learning, wanders, platform)  
**Cross-reference (VENOM findings):** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_04-04_venom_secdefiner-trust-boundaries.md`

---

## Executive Summary

The database contains **140 SECURITY DEFINER functions** across all schemas. This review classifies every function into one of four categories and produces a phased elimination plan designed to reduce the attack surface from function-level privilege escalation without breaking application behavior.

**Result summary:**

| Classification | Count | Priority |
|---|---:|---|
| REMOVE — legacy/stub/wrapper | 13 | Batch 1 + 4 |
| REPLACE WITH RLS — pure SELECTs / single-table writes | 10 | Batch 2 + 3 |
| KEEP BUT HARDEN — legitimate atomic / trigger / bootstrap | 105 | Batch 5 |
| CRITICAL FIX REQUIRED — active vulnerability | 3 | Batch 1 (immediate) |
| UNKNOWN — body not inspected | 2 | Pre-release verification |

**Release blockers:** 7 items (see Section 8).

---

## 1. Classification Legend

| Label | Meaning |
|---|---|
| **REMOVE** | Function writes to dead legacy tables, is an empty stub, or is a pure passthrough wrapper. Drop immediately after verifying no active callers. |
| **REPLACE WITH RLS** | Function is a pure SELECT or single-table write against `auth.uid()`. Equivalent behavior achievable with RLS + direct table access. Remove SECURITY DEFINER after RLS policies are in place. |
| **KEEP BUT HARDEN** | Function has a legitimate reason to elevate privileges (atomic multi-table write, trigger-owned notification, anon-designed access, RLS helper to avoid recursion). Must add `SET search_path`, revoke broad EXECUTE grants, add internal auth checks where missing. |
| **CRITICAL FIX** | Function has an active security vulnerability. Fix or revoke before any other batch. |
| **UNKNOWN** | Function body not yet inspected. Treat as HIGH risk until verified. |

---

## 2. SECURITY DEFINER Elimination Map

### 2.1 PUBLIC Schema — Non-Trigger Functions

| Function | Classification | Reason |
|---|---|---|
| `public.admin_delete_user_everywhere(p_user_id)` | **CRITICAL FIX** | No internal auth guard — any authenticated caller can delete any user's data |
| `public.mark_all_messages_seen(uid uuid)` | **CRITICAL FIX** | Takes uid as parameter with no `auth.uid()` check — any caller updates any profile |
| `public.get_unread_message_total(uid uuid)` | **CRITICAL FIX** | Takes uid as parameter — suspected same pattern as `mark_all_messages_seen` |
| `public.block_user(target uuid)` | **REMOVE** | Writes to `public.user_blocks` (legacy table not in current schema inventory) |
| `public.cancel_friend_request(request_id, requester)` | **REMOVE** | Old 3-param overload, writes to `public.friend_requests` (legacy, not in schema) |
| `public.cancel_friend_request(target uuid)` | **REMOVE** | Writes to legacy `public.friend_requests` |
| `public.follow_user(follower, followed)` | **REMOVE** | Old 2-param overload, writes to `public.followers` (legacy, not in schema) |
| `public.follow_user(target uuid)` | **REMOVE** | Writes to legacy `public.followers` |
| `public.is_blocked(target uuid)` | **REMOVE** | Reads from legacy `public.user_blocks` — always returns false, dead code |
| `public.react_to_post(_post_id, _actor_id, _like)` | **REMOVE** | Empty stub — `BEGIN -- write operations allowed here END` with no logic |
| `public.respond_friend_request(request_id, action)` | **REMOVE** | Writes to legacy `public.friend_requests`, `public.friends`, `public.followers` |
| `public.respond_friend_request(request_id, responder, action)` | **REMOVE** | Old 3-param overload of above |
| `public.send_friend_request(requester, addressee, message)` | **REMOVE** | Old 3-param overload, writes to legacy `public.friend_requests` |
| `public.send_friend_request(target, msg)` | **REMOVE** | Writes to legacy `public.friend_requests` |
| `public.start_direct_conversation(other_user_id)` | **REMOVE** | Pure 1-line passthrough: `SELECT vc.start_direct_conversation(other_user_id)` |
| `public.get_profile_min_by_id(p_id)` | **REPLACE WITH RLS** | Simple SELECT on `public.profiles` — equivalent direct access with RLS |
| `public.get_profile_min_by_username(p_username)` | **REPLACE WITH RLS** | Simple SELECT on `public.profiles` by username |
| `public.profile_preview(p_slug)` | **REPLACE WITH RLS** | Simple SELECT on `public.profiles` — subset of columns |
| `public.publish_profile()` | **REPLACE WITH RLS** | Single UPDATE `WHERE id = auth.uid()` — trivially replaced with RLS + direct write |
| `public.unpublish_profile()` | **REPLACE WITH RLS** | Single UPDATE `WHERE id = auth.uid()` — same as above |
| `public.search_profiles(q, limit_n)` | **REPLACE WITH RLS** | Duplicates `vc.search_directory` — SELECT on discoverable profiles |
| `public.actor_id_for_user(u_id)` | **KEEP BUT HARDEN** | Cross-schema lookup helper used internally by provisioning flows |
| `public.actor_id_for_vport(v_id)` | **KEEP BUT HARDEN** | Cross-schema lookup helper |
| `public.create_tenant_bootstrap(...)` | **KEEP BUT HARDEN** | Atomic multi-table tenant provisioning (public-facing wrapper for Wentrex) |
| `public.ensure_dm_bootstrap(...)` | **KEEP BUT HARDEN** | Atomic DM conversation setup across vc.* tables |
| `public.generate_username(_display_name, _username)` | **KEEP BUT HARDEN** | Utility with sequence/uniqueness logic — not a simple SELECT |
| `public.get_post_login_destination()` | **KEEP BUT HARDEN** | Post-auth routing with complex joins across platform schema — verify uses `auth.uid()` internally |
| `public.handle_new_user()` | **KEEP BUT HARDEN** | Trigger on `auth.users INSERT` — provisions profile row — must be DEFINER |
| `public._notify_user(...)` | **KEEP BUT HARDEN** | Internal notification dispatch — writes to `vc.notifications` across RLS boundary |
| `public.notify_user(...)` | **KEEP BUT HARDEN** | Public wrapper for `_notify_user` — must cross RLS to write recipient's notification |
| `public.notify_post_rose(...)` | **KEEP BUT HARDEN** | Notification for rose gifts — writes to recipient's slot |
| `public.handle_post_reaction(...)` | **UNKNOWN** | Body not inspected — likely writes to `vc.post_reactions` or legacy table. Treat as HIGH until verified |
| `public.ensure_dm_bootstrap(...)` | **KEEP BUT HARDEN** | Already listed above |

### 2.2 PUBLIC Schema — Trigger Functions

All trigger functions in `public.*` must remain SECURITY DEFINER — they fire asynchronously after DML and write to notification/inbox tables that the original caller cannot INSERT into directly (those rows belong to a different actor's RLS-scoped scope).

| Function | Classification |
|---|---|
| `public.tg_notify_comment_likes` | **KEEP BUT HARDEN** (add SET search_path) |
| `public.tg_notify_followers` | **KEEP BUT HARDEN** (add SET search_path) |
| `public.tg_notify_post_comments` | **KEEP BUT HARDEN** (add SET search_path) |
| `public.tg_notify_post_reactions_unified` | **KEEP BUT HARDEN** (add SET search_path) |
| `public.tg_notify_roses_ledger` | **KEEP BUT HARDEN** (add SET search_path) |
| `public.tg_notify_story_reactions` | **KEEP BUT HARDEN** (add SET search_path) |
| `public.tg_notify_vport_post_reactions` | **KEEP BUT HARDEN** (add SET search_path) |
| `public.tg_notify_vport_roses` | **KEEP BUT HARDEN** (add SET search_path) |
| `public.tg_notify_vport_story_reactions` | **KEEP BUT HARDEN** (add SET search_path) |

---

### 2.3 VC Schema — Non-Trigger Functions

#### Identity / Auth Context Helpers (RLS Policy Dependencies)

These functions MUST remain SECURITY DEFINER. They are called inside RLS `USING` and `WITH CHECK` expressions. Making them SECURITY INVOKER would cause infinite recursion because the policy evaluation itself would trigger another policy evaluation.

| Function | Classification | Note |
|---|---|---|
| `vc.current_actor_id()` | **KEEP BUT HARDEN** | Core RLS helper — resolves auth.uid() → actor_id |
| `vc.actor_ids_for_current_user()` | **KEEP BUT HARDEN** | Returns all actor IDs for the current user |
| `vc.user_actor_ids()` | **KEEP BUT HARDEN** | User-type actor IDs for current session |
| `vc.my_actor_id()` | **KEEP BUT HARDEN** | Convenience alias for current_actor_id |

#### Authorization Helpers (Used in RLS Policies)

| Function | Classification | Note |
|---|---|---|
| `vc.can_view_actor(p_actor_id)` | **KEEP BUT HARDEN** | Checks privacy settings — used in RLS policies |
| `vc.is_actor_owner(p_actor_id)` | **KEEP BUT HARDEN** | Checks actor_owners table — used in RLS |
| `vc.is_active_vport_actor(p_actor_id)` | **KEEP BUT HARDEN** | Status check — used in RLS |
| `vc.is_vport_owner(p_vport_id)` | **KEEP BUT HARDEN** | Ownership check — IDENTITY SURFACE WARNING: takes vportId not actorId |
| `vc.ensure_actor_ownership(p_actor_id)` | **KEEP BUT HARDEN** | Raises exception if not owner |
| `vc.ensure_actor_ownership_for_actor(p_actor_id)` | **KEEP BUT HARDEN** | Variant for actor-scoped ownership |
| `vc.is_member_of_message_conversation(p_actor, p_message)` | **KEEP BUT HARDEN** | Conversation membership |
| `vc.user_is_in_conversation(p_conversation_id)` | **KEEP BUT HARDEN** | Conversation membership via auth.uid() |
| `vc.convo_created_by_actor(p_conversation_id)` | **KEEP BUT HARDEN** | Creator lookup |

#### Atomic Multi-Table Writes (Legitimate SECURITY DEFINER)

| Function | Classification | Reason |
|---|---|---|
| `vc.create_actor_for_user(...)` | **KEEP BUT HARDEN** | Atomic: INSERTs into `vc.actors` AND `vc.actor_owners` |
| `vc.create_notification(...)` | **KEEP BUT HARDEN** | Writes to recipient's notification row — crosses RLS boundary by design |
| `vc.create_vport(...)` | **KEEP BUT HARDEN** | Atomic: `vc.vports` + `vc.actors` + `vc.actor_owners` + detail tables |
| `vc.ensure_my_actor()` | **KEEP BUT HARDEN** | Bootstrap get-or-create — atomic, uses auth.uid() guard |
| `vc.ensure_inbox_for_conversation(p_conversation_id)` | **KEEP BUT HARDEN** | Inbox provisioning across conversation members |
| `vc.mark_read(p_conversation_id, p_actor_id, p_last_message_id)` | **KEEP BUT HARDEN** | Updates inbox_entries — verify p_actor_id is validated against auth.uid() |
| `vc.open_conversation(p_conversation_id, p_actor_id)` | **KEEP BUT HARDEN** | Conversation open tracking — verify actor ownership |
| `vc.recompute_conversation_pointers(p_conversation_id)` | **KEEP BUT HARDEN** | System maintenance — atomic pointer update |
| `vc.vc_get_or_create_one_to_one(a1, a2, p_realm_id)` | **KEEP BUT HARDEN** | Atomic conversation bootstrap — called server-side only |

#### Pure SELECT / Read Functions (Replace with RLS)

| Function | Classification | Reason |
|---|---|---|
| `vc.read_actor_profile(p_actor_id)` | **REPLACE WITH RLS** | Pure SELECT — returns `email`, `birthdate`, `age`, `sex`, `is_adult` (PII) with NO per-caller auth check |
| `vc.get_central_feed(_limit, _offset)` | **REPLACE WITH RLS** | Complex SELECT — all security logic is internal CTEs using `vc.current_actor_id()`. Direct table access with RLS achieves the same result |
| `vc.search_directory(_q, _limit, _offset)` | **REPLACE WITH RLS** | Pure SELECT on `discoverable=true` profiles — RLS can enforce this |

#### Aggregation / Read Helpers

| Function | Classification | Note |
|---|---|---|
| `vc.get_actor_summaries(p_actor_ids)` | **KEEP BUT HARDEN** | Batch profile hydration for UI — uses array input |
| `vc.get_vport_public_details(p_actor_id)` | **KEEP BUT HARDEN** | Public data aggregation (no private fields expected) — verify output |
| `vc.get_vport_public_menu(p_actor_id)` | **KEEP BUT HARDEN** | Public menu aggregation |
| `vc.count_subscribers(p_actor_id)` | **KEEP BUT HARDEN** | Count from actor_follows — could be SECURITY INVOKER if RLS covers it |
| `vc.list_subscribers(p_actor_id, limit, offset)` | **KEEP BUT HARDEN** | Paginated subscriber list |
| `vc.actor_id_for_profile(p_profile_id)` | **KEEP BUT HARDEN** | Cross-table lookup — IDENTITY SURFACE: takes profileId, returns actorId |
| `vc.actor_id_for_vport(p_vport_id)` | **KEEP BUT HARDEN** | Cross-table lookup — takes vportId, returns actorId |

#### Anon-Designed Functions (Lovedrop Gift Card System)

These functions are explicitly designed for unauthenticated (anon) access — the gift card system allows anonymous recipients to open cards, record views, and create anonymous identities. SECURITY DEFINER is required because anon role has no table-level access.

| Function | Classification | Note |
|---|---|---|
| `vc.lovedrop_get_card_by_public_id(p_public_id)` | **KEEP BUT HARDEN** | Anon card fetch by public_id — add `SET search_path` |
| `vc.lovedrop_record_open(p_public_id, p_anon_id)` | **KEEP BUT HARDEN** | Anon event write — add `SET search_path`, validate p_public_id exists |
| `vc.lovedrop_upsert_anon_identity(p_client_key)` | **KEEP BUT HARDEN** | Anon identity creation — add `SET search_path` |

#### Admin Actions

| Function | Classification | Note |
|---|---|---|
| `vc.vport_review_fuel_price_submission(...)` | **KEEP BUT HARDEN** | Admin review action — needs caller role verification, add `SET search_path` |

---

### 2.4 VC Schema — Trigger Functions

All must remain SECURITY DEFINER (cross-actor notification writes).

| Function | Classification |
|---|---|
| `vc.after_message_deleted_recompute` | **KEEP BUT HARDEN** |
| `vc.trg_actor_follows_notify` | **KEEP BUT HARDEN** |
| `vc.trg_actors_ensure_owner` | **KEEP BUT HARDEN** |
| `vc.trg_comment_like_notify` | **KEEP BUT HARDEN** |
| `vc.trg_follow_accept_notify` | **KEEP BUT HARDEN** |
| `vc.trg_follow_request_notify` | **KEEP BUT HARDEN** |
| `vc.trg_post_comments_notify` | **KEEP BUT HARDEN** |
| `vc.trg_post_dislike_notify` | **KEEP BUT HARDEN** |
| `vc.trg_post_like_notify` | **KEEP BUT HARDEN** |
| `vc.trg_post_mentions_notify` | **KEEP BUT HARDEN** |
| `vc.trg_post_reactions_notify` | **KEEP BUT HARDEN** |
| `vc.trg_post_rose_gifts_notify` | **KEEP BUT HARDEN** |
| `vc.trg_reconcile_on_actor_follows` | **KEEP BUT HARDEN** |
| `vc.trg_sfr_apply_accept_to_actor_follows` | **KEEP BUT HARDEN** |
| `vc.trg_sfr_apply_status_to_actor_follows` | **KEEP BUT HARDEN** |
| `vc.trg_social_follow_requests_accept_notify` | **KEEP BUT HARDEN** |
| `vc.trg_social_follow_requests_notify` | **KEEP BUT HARDEN** |
| `vc.trg_vport_review_ratings_set_vport_type` | **KEEP BUT HARDEN** |

---

### 2.5 CHAT Schema

| Function | Classification | Note |
|---|---|---|
| `chat.current_actor_id()` | **KEEP BUT HARDEN** | RLS helper — same pattern as vc.current_actor_id() |
| `chat.is_conversation_member(p_conversation_id)` | **KEEP BUT HARDEN** | Membership check used in RLS |
| `chat.can_current_actor_manage(p_conversation_id)` | **KEEP BUT HARDEN** | Authorization — used in RLS |
| `chat.can_current_actor_moderate(p_conversation_id)` | **KEEP BUT HARDEN** | Authorization — used in RLS |
| `chat.can_current_actor_post(p_conversation_id)` | **KEEP BUT HARDEN** | Authorization — used in RLS |
| `chat.can_current_actor_read_message(p_message_id)` | **KEEP BUT HARDEN** | Authorization — used in RLS |
| `chat.send_message_atomic(...)` | **KEEP BUT HARDEN** | Atomic: chat.messages + chat.message_receipts + chat.inbox_entries + chat.outbox_events |

---

### 2.6 LEARNING Schema

#### Auth Context Helpers (RLS Policy Dependencies)

| Function | Classification |
|---|---|
| `learning.current_actor_id()` | **KEEP BUT HARDEN** |
| `learning.current_actor_ids()` | **KEEP BUT HARDEN** |
| `learning.my_organization_ids()` | **KEEP BUT HARDEN** |

#### Authorization Policy Helpers (Used in RLS)

| Function | Classification |
|---|---|
| `learning.can_current_user_access_course(_course_id)` | **KEEP BUT HARDEN** |
| `learning.can_current_user_access_learning_center()` | **KEEP BUT HARDEN** |
| `learning.can_current_user_access_organization(_organization_id)` | **KEEP BUT HARDEN** |
| `learning.can_current_user_manage_course(_course_id)` | **KEEP BUT HARDEN** |
| `learning.can_current_user_manage_organization(_organization_id)` | **KEEP BUT HARDEN** |
| `learning.can_current_user_select_course_membership(...)` | **KEEP BUT HARDEN** |
| `learning.can_current_user_select_organization_membership(...)` | **KEEP BUT HARDEN** |
| `learning.has_org_role(p_organization_id, p_roles)` | **KEEP BUT HARDEN** |
| `learning.is_conversation_admin(_conversation_id)` | **KEEP BUT HARDEN** |
| `learning.is_conversation_member(_conversation_id)` | **KEEP BUT HARDEN** |
| `learning.is_current_user_platform_admin()` | **KEEP BUT HARDEN** |
| `learning.is_platform_owner(p_user_id)` | **KEEP BUT HARDEN** |

#### Atomic Multi-Tenant Provisioning

| Function | Classification | Note |
|---|---|---|
| `learning.create_tenant_bootstrap(...)` | **KEEP BUT HARDEN** | Atomic: realm + org + memberships + actors — called server-side only |
| `learning.ensure_org_member_account(...)` | **KEEP BUT HARDEN** | Atomic: profile + actor + membership provisioning |
| `learning.ensure_org_member_identity(...)` | **KEEP BUT HARDEN** | Atomic: full identity stack provisioning |
| `learning.ensure_parent_account(...)` | **KEEP BUT HARDEN** | Atomic: parent role provisioning |
| `learning.get_or_create_course_conversation(p_course_id)` | **KEEP BUT HARDEN** | Atomic conversation bootstrap for course |
| `learning.get_or_create_direct_conversation(p_to_actor_id)` | **KEEP BUT HARDEN** | Atomic DM bootstrap |

#### Utility Functions

| Function | Classification | Note |
|---|---|---|
| `learning.generate_student_login_id(p_year)` | **KEEP BUT HARDEN** | Counter-based sequence — must be DEFINER for atomic increment |
| `learning.generate_unique_tenant_slug(base_name)` | **KEEP BUT HARDEN** | Unique slug with conflict resolution |
| `learning.get_messageable_contacts()` | **KEEP BUT HARDEN** | Returns contact list for messaging UI — verify uses auth context internally |
| `learning.list_all_realms_admin(p_caller_user_id)` | **KEEP BUT HARDEN** | Admin realm list — verify p_caller_user_id is checked against auth.uid() or privileged role |

---

### 2.7 PLATFORM Schema

| Function | Classification | Note |
|---|---|---|
| `platform.provision_vcsm_identity(p_user_id)` | **KEEP BUT HARDEN** | Atomic VCSM identity provisioning — called server-side only |
| `platform.provision_wentrex_identity(p_actor_id, p_organization_id)` | **KEEP BUT HARDEN** | Atomic Wentrex identity provisioning — called server-side only |

---

### 2.8 WANDERS Schema

| Function | Classification | Note |
|---|---|---|
| `wanders.create_inbox_share_link(p_inbox_id)` | **KEEP BUT HARDEN** | Atomic token generation + link record |
| `wanders.drop_send_card(...)` | **KEEP BUT HARDEN** | Atomic: card creation + anon identity binding |
| `wanders.redeem_inbox_share_link(p_token, p_pin, p_client_key)` | **KEEP BUT HARDEN** | Atomic redemption + link binding |
| `wanders.bind_recipient_on_reply` | **KEEP BUT HARDEN** | Trigger function — binds reply recipient |

---

## 3. Functions Safe to Remove First (Batch 4 Targets)

These functions write to tables that no longer exist in the schema or are provably dead code. Removing them reduces the attack surface before any other changes are needed.

**Verification required before dropping:** grep all application code (apps/VCSM, apps/wentrex, engines/) for these function names via RPC calls or `.rpc()` invocations.

```
public.block_user
public.cancel_friend_request          (both overloads)
public.follow_user                     (both overloads)
public.is_blocked
public.react_to_post                   (empty stub)
public.respond_friend_request          (both overloads)
public.send_friend_request             (both overloads)
public.start_direct_conversation       (pure wrapper)
public.unread_total                    (after RLS replacement)
public.publish_profile                 (after RLS replacement)
public.unpublish_profile               (after RLS replacement)
public.get_profile_min_by_id           (after RLS replacement)
public.get_profile_min_by_username     (after RLS replacement)
public.profile_preview                 (after RLS replacement)
public.search_profiles                 (after vc.search_directory is promoted)
```

---

## 4. Functions That Must Remain Temporarily

These functions have active callers in the application code and cannot be dropped until the application is migrated to direct table access with RLS.

```
vc.read_actor_profile     — has active callers; replace with SELECT on vc.actors + profiles + RLS
vc.get_central_feed       — has active callers in feed DAL; replace with DAL-level query + RLS
vc.search_directory       — has active callers; promote to direct query + RLS
```

Application-side migration tracking needed before these can be removed.

---

## 5. Migration Batches

### Batch 1 — Revoke Dangerous EXECUTE Grants (IMMEDIATE — Release Blocker)

**Goal:** Stop anon and authenticated roles from calling functions they should never reach.

Supabase grants `EXECUTE` to `anon` and `authenticated` on all functions in `public` schema by default. This must be explicitly revoked for sensitive functions.

**Priority targets (CRITICAL vulnerabilities):**

```sql
-- CRITICAL: admin delete — no auth guard inside body
REVOKE EXECUTE ON FUNCTION public.admin_delete_user_everywhere(uuid) FROM anon, authenticated;

-- CRITICAL: uid-parameter with no auth.uid() check — any caller updates any profile's last_seen
REVOKE EXECUTE ON FUNCTION public.mark_all_messages_seen(uuid) FROM anon, authenticated;

-- CRITICAL: uid-parameter with no auth.uid() check — suspected same pattern
REVOKE EXECUTE ON FUNCTION public.get_unread_message_total(uuid) FROM anon, authenticated;
```

**Legacy functions (safe to revoke immediately — targets are dead tables):**

```sql
REVOKE EXECUTE ON FUNCTION public.block_user(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_friend_request(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_friend_request(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.follow_user(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.follow_user(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_blocked(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.react_to_post(uuid, uuid, boolean) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.respond_friend_request(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.respond_friend_request(uuid, uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_friend_request(uuid, uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_friend_request(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.start_direct_conversation(uuid) FROM anon, authenticated;
```

**Anon revoke for authenticated-only functions:**

```sql
-- These should never be called by anon — revoke specifically from anon role
REVOKE EXECUTE ON FUNCTION public.publish_profile() FROM anon;
REVOKE EXECUTE ON FUNCTION public.unpublish_profile() FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_tenant_bootstrap(uuid, text, text, text, uuid, text, text) FROM anon;
```

---

### Batch 2 — Add Missing RLS Policies

**Goal:** Create the policies that allow replacing SECURITY DEFINER SELECT functions with direct table access, and fix broad/broken policies discovered in the prior DB review.

#### 2A — Fix `public.profiles` — Private Profile Leakage

Current policy `profiles_public_read` (role: public, USING: true) exposes ALL profiles including private ones to anon.

```sql
-- Text proposal only — do not execute
-- Step 1: Drop the broad policy
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;

-- Step 2: Replace with a scoped policy
CREATE POLICY profiles_discoverable_read ON public.profiles
  FOR SELECT
  TO public
  USING (
    publish = true
    AND discoverable = true
    AND (private = false OR private IS NULL)
  );

-- Step 3: Add a self-read policy so users can always see their own profile
CREATE POLICY profiles_self_read ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());
```

#### 2B — Fix `learning.courses` — Multi-Tenant Isolation Broken

Two broad `true` policies silently override all org-scoped restrictions.

```sql
-- Text proposal only — do not execute
-- Remove the permissive overrides
DROP POLICY IF EXISTS "authenticated can insert courses" ON learning.courses;
DROP POLICY IF EXISTS "authenticated can view courses" ON learning.courses;

-- Replace with org-scoped INSERT
CREATE POLICY courses_org_member_insert ON learning.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    learning.can_current_user_manage_organization(organization_id)
  );

-- Replace with org-scoped SELECT
CREATE POLICY courses_org_member_select ON learning.courses
  FOR SELECT
  TO authenticated
  USING (
    learning.can_current_user_access_course(id)
  );
```

#### 2C — Actor Profile Direct-Access Policy (Replaces `vc.read_actor_profile`)

```sql
-- Text proposal only — do not execute
-- Authenticated read of actor presentation data (no PII)
CREATE POLICY actors_public_select ON vc.actors
  FOR SELECT
  TO authenticated
  USING (
    coalesce(is_deleted, false) = false
    AND coalesce(is_void, false) = false
  );

-- Scoped policy for PII fields on profiles — self only or owner-only
-- PII (email, birthdate, age, sex, is_adult) must only return for the owning user
CREATE POLICY profiles_self_pii_read ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());
```

#### 2D — Fix Broad `true` Policies on Social Tables

```sql
-- Text proposal only — do not execute

-- vc.comment_likes — currently SELECT USING (true) for all authenticated
DROP POLICY IF EXISTS "comment_likes_select" ON vc.comment_likes;
CREATE POLICY comment_likes_visible_select ON vc.comment_likes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vc.posts p
      WHERE p.id = post_id
        AND coalesce(p.deleted_at IS NULL, true)
    )
  );

-- vc.friend_ranks — currently SELECT USING (true) — exposes all friend rank scores globally
DROP POLICY IF EXISTS "friend_ranks visible to authenticated" ON vc.friend_ranks;
CREATE POLICY friend_ranks_self_select ON vc.friend_ranks
  FOR SELECT
  TO authenticated
  USING (
    actor_id = vc.current_actor_id()
    OR friend_actor_id = vc.current_actor_id()
  );
```

#### 2E — Fix `wanders.cards` — Anon INSERT

```sql
-- Text proposal only — do not execute
-- Current policy incorrectly includes anon role
DROP POLICY IF EXISTS "cards_insert_sender_user" ON wanders.cards;

CREATE POLICY cards_insert_sender_authenticated ON wanders.cards
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_user_id = auth.uid());
```

#### 2F — Fix `learning.*` — Public Role Policies Should Be Authenticated

Multiple learning tables use `{public}` role (anon + authenticated) instead of `{authenticated}`.

```sql
-- Text proposal only — do not execute
-- Affects: learning.communication_conversations, communication_messages,
--          communication_message_receipts, communication_inbox_entries,
--          communication_conversation_members, communication_message_attachments,
--          communication_message_moderation_actions,
--          learning.grades, learning.lessons, learning.submissions, learning.platform_admins

-- Pattern for each — example for communication_conversations:
DROP POLICY IF EXISTS "conversation_members_select" ON learning.communication_conversations;
CREATE POLICY comm_conversations_member_select ON learning.communication_conversations
  FOR SELECT
  TO authenticated  -- was: public
  USING (
    learning.is_conversation_member(id)
  );
-- Repeat for each affected table with appropriate org/member/admin scoping
```

---

### Batch 3 — Migrate Application Code Away from SECURITY DEFINER Functions

**Goal:** Update DAL files to use direct Supabase table queries instead of `.rpc()` calls to functions marked REPLACE WITH RLS. This batch must be done application-side.

**Function → DAL migration targets:**

| Function | Current Usage | Migration Target |
|---|---|---|
| `vc.read_actor_profile(p_actor_id)` | Actor profile page, profile preview | Direct SELECT on `vc.actors` + `public.profiles` + `vc.actor_privacy_settings` with RLS |
| `vc.get_central_feed(_limit, _offset)` | `feed.read.posts.dal.js` and related | Direct SELECT on `vc.posts` JOIN `vc.actor_follows` + `vc.user_blocks` with RLS |
| `vc.search_directory(_q, _limit, _offset)` | Directory search | Direct SELECT on `public.profiles` JOIN `vc.actors` with discoverable filter |
| `public.get_profile_min_by_id(p_id)` | Profile hydration | Direct SELECT on `public.profiles` |
| `public.get_profile_min_by_username(p_username)` | Username lookup | Direct SELECT on `public.profiles` |
| `public.profile_preview(p_slug)` | Profile card preview | Direct SELECT on `public.profiles` |
| `public.publish_profile()` | Settings page | Direct UPDATE on `public.profiles` WHERE id = auth.uid() |
| `public.unpublish_profile()` | Settings page | Direct UPDATE on `public.profiles` WHERE id = auth.uid() |
| `public.unread_total()` | Inbox badge | Direct SELECT on `vc.inbox_entries` WHERE user_id = auth.uid() |
| `public.search_profiles(q, limit_n)` | Any search — replace with vc.search_directory DAL | Direct SELECT with discoverable filter |

Application code files to search:

```bash
# Find all .rpc() calls across VCSM app
grep -r "\.rpc(" apps/VCSM/src/ --include="*.js" --include="*.jsx" -l

# Find all .rpc() calls across engines
grep -r "\.rpc(" engines/ --include="*.js" -l
```

---

### Batch 4 — Drop Deprecated Functions

**After Batch 3 is confirmed complete and no active callers remain:**

```sql
-- Text proposal only — do not execute

-- Legacy social functions (dead targets)
DROP FUNCTION IF EXISTS public.block_user(uuid);
DROP FUNCTION IF EXISTS public.cancel_friend_request(uuid, uuid);
DROP FUNCTION IF EXISTS public.cancel_friend_request(uuid);
DROP FUNCTION IF EXISTS public.follow_user(uuid, uuid);
DROP FUNCTION IF EXISTS public.follow_user(uuid);
DROP FUNCTION IF EXISTS public.is_blocked(uuid);
DROP FUNCTION IF EXISTS public.react_to_post(uuid, uuid, boolean);
DROP FUNCTION IF EXISTS public.respond_friend_request(uuid, text);
DROP FUNCTION IF EXISTS public.respond_friend_request(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.send_friend_request(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.send_friend_request(uuid, text);
DROP FUNCTION IF EXISTS public.start_direct_conversation(uuid);

-- Replaced by RLS (only after Batch 3 migration confirmed)
DROP FUNCTION IF EXISTS public.unread_total();
DROP FUNCTION IF EXISTS public.publish_profile();
DROP FUNCTION IF EXISTS public.unpublish_profile();
DROP FUNCTION IF EXISTS public.get_profile_min_by_id(uuid);
DROP FUNCTION IF EXISTS public.get_profile_min_by_username(text);
DROP FUNCTION IF EXISTS public.profile_preview(text);
DROP FUNCTION IF EXISTS public.search_profiles(text, integer);
DROP FUNCTION IF EXISTS vc.read_actor_profile(uuid);
DROP FUNCTION IF EXISTS vc.get_central_feed(integer, integer);
DROP FUNCTION IF EXISTS vc.search_directory(text, integer, integer);
```

---

### Batch 5 — Harden All Remaining SECURITY DEFINER Functions

**Goal:** Every function that must remain SECURITY DEFINER must have:
1. `SET search_path TO '<schema>', 'pg_temp'` (prevents CVE-2018-1058 search_path hijacking)
2. `REVOKE EXECUTE FROM anon` where anon should never call it
3. Internal `auth.uid()` validation for any function that takes a uid parameter
4. A comment documenting why SECURITY DEFINER is required

**Hardening template:**

```sql
-- Text proposal only — do not execute
-- Example for vc.create_actor_for_user (already has search_path — shown as template)
CREATE OR REPLACE FUNCTION vc.create_actor_for_user(
  p_kind text,
  p_profile_id uuid DEFAULT NULL,
  p_vport_id uuid DEFAULT NULL,
  p_is_void boolean DEFAULT false,
  p_is_primary boolean DEFAULT true
)
RETURNS vc.actors
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'vc', 'public', 'pg_temp'
AS $$
BEGIN
  -- SECURITY DEFINER: required for atomic INSERT into vc.actors + vc.actor_owners
  -- across RLS boundary (actor_owners requires owner to already exist)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  -- ... rest of body
END;
$$;

-- After body update, revoke anon
REVOKE EXECUTE ON FUNCTION vc.create_actor_for_user(text, uuid, uuid, boolean, boolean) FROM anon;
```

**Priority hardening list (missing search_path):**

Functions in the inventory with `SECURITY DEFINER` but without confirmed `SET search_path`:

```sql
-- Apply SET search_path to all public.* trigger notification functions
-- Apply SET search_path to vc.lovedrop_* functions
-- Apply SET search_path to wanders.* functions
-- Apply internal auth guard to vc.mark_read (verify p_actor_id matches auth.uid()-owned actor)
-- Apply internal auth guard to vc.open_conversation (verify p_actor_id is owned by caller)
-- Apply caller verification to learning.list_all_realms_admin (p_caller_user_id must be auth.uid())
```

**CRITICAL internal auth guard additions:**

```sql
-- Text proposal only — do not execute

-- Fix 1: public.admin_delete_user_everywhere — add admin role check
-- Current body has NO guard — any authenticated user can delete any other user
CREATE OR REPLACE FUNCTION public.admin_delete_user_everywhere(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
BEGIN
  -- GUARD: only service_role or designated platform admins may call this
  IF NOT EXISTS (
    SELECT 1 FROM learning.platform_admins
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'insufficient privileges';
  END IF;
  -- ... rest of deletion logic
END;
$$;

-- Fix 2: public.mark_all_messages_seen — replace uid param with auth.uid()
CREATE OR REPLACE FUNCTION public.mark_all_messages_seen()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  UPDATE profiles SET last_seen = now() WHERE id = auth.uid();
$$;
-- Note: changing the signature (removing uid param) requires Batch 3 app-side migration first

-- Fix 3: public.get_unread_message_total — replace uid param with auth.uid()
CREATE OR REPLACE FUNCTION public.get_unread_message_total()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'vc', 'pg_temp'
AS $$
  SELECT coalesce(sum(unread_count), 0)::integer
  FROM vc.inbox_entries
  WHERE user_id = auth.uid();
$$;
```

---

## 6. Table-by-Table RLS Policy Plan

### Tables Requiring New Policies

| Table | Current State | Required Action |
|---|---|---|
| `public.profiles` | `profiles_public_read` USING (true) exposes private profiles to anon | Replace with scoped discoverable-only policy + self-read policy |
| `learning.courses` | Two `USING (true)` policies override all org-scoped policies | Drop broad policies, add org-scoped INSERT + SELECT |
| `vc.comment_likes` | SELECT authenticated USING (true) — all comment likes globally visible | Scope to visible posts only |
| `vc.friend_ranks` | SELECT authenticated USING (true) — all friend scores globally visible | Scope to self + own friends only |
| `vc.post_reactions` | SELECT authenticated USING (true) — all reactions visible regardless of post privacy | Scope to visible posts only |
| `vc.post_rose_gifts` | SELECT authenticated USING (true) | Scope to visible posts |
| `wanders.cards` | INSERT includes `anon` role unnecessarily | Remove anon from INSERT policy |
| `learning.communication_*` (7 tables) | Uses `{public}` role (includes anon) | Restrict to `authenticated` only |
| `learning.grades` | Uses `{public}` role | Restrict to `authenticated` only |
| `learning.lessons` | Uses `{public}` role | Restrict to `authenticated` only |
| `learning.submissions` | Uses `{public}` role | Restrict to `authenticated` only |
| `learning.platform_admins` | Uses `{public}` role | Restrict to `authenticated` only |

### Tables with RLS Enabled but Zero Policies (Completely Inaccessible)

| Table | Action Required |
|---|---|
| `learning.lesson_progress` | Add student self-read, instructor read, student insert/update |
| `learning.modules` | Add org-member read, org-admin write |
| `learning.submission_files` | Add student owner read, instructor org-member read |
| `learning.assignment_rubrics` | Add org-member read, instructor write |
| `platform.legal_documents` | Add authenticated read (or anon read if public-facing) |
| `chat.conversation_keys` | Add conversation-member read |
| `chat.outbox_events` | Add system-write, no user direct read |

### Schemas with Zero Policies (Complete Access Gap)

These schemas have tables with no RLS whatsoever. If they are accessible via PostgREST, any anon/authenticated client can read/write unrestricted:

| Schema | Estimated Tables | Risk | Action |
|---|---|---|---|
| `moderation.*` | Unknown | CRITICAL — moderation data must be admin-only | Add RLS immediately, restrict to platform_admins |
| `notification.*` | Unknown | HIGH — notifications contain PII context | Add actor-scoped read policies |
| `identity.*` | Unknown | CRITICAL — identity data is authentication-sensitive | Add RLS immediately |
| `reviews.*` | Unknown | HIGH — currently has FORCE RLS with no policies = completely inaccessible | Add policies or disable FORCE RLS if intentional block |
| `vport.*` | 30+ tables | HIGH — vport business data may contain private config | Add RLS |
| `omd.*` | Unknown | UNKNOWN — verify purpose and exposure |
| `metrics.*` | Unknown | MEDIUM — metrics data should be read-restricted |
| `zubappnexrn.*` | Unknown | UNKNOWN — verify purpose and exposure |

---

## 7. SECURITY DEFINER Allowlist (Must Remain — Post-Elimination Target State)

After all 5 batches complete, the following represents the **minimum viable SECURITY DEFINER surface**:

**Trigger functions:** ~27 functions (must remain — cross-actor notification writes)

**RLS helper functions (context resolvers):**
- `chat.current_actor_id`
- `learning.current_actor_id`, `learning.current_actor_ids`, `learning.my_organization_ids`
- `vc.current_actor_id`, `vc.actor_ids_for_current_user`, `vc.user_actor_ids`, `vc.my_actor_id`

**Authorization policy helpers:** ~15 learning.can_*/is_* functions + vc authorization helpers

**Atomic multi-table writes:** ~15 functions across vc, chat, learning, platform, wanders

**Anon-designed access (lovedrop):** 3 functions

**Total target:** ~65 functions (down from 140 — a 54% reduction)

---

## 8. Release Blocker List

These items must be resolved before production launch. Labeled CRITICAL or HIGH per VENOM severity.

| # | Blocker | Severity | Batch | VENOM Finding |
|---|---|---|---|---|
| 1 | `public.admin_delete_user_everywhere` — no auth guard, any caller can delete any user | CRITICAL | Batch 1 (immediate revoke) | F-01 |
| 2 | `public.mark_all_messages_seen(uid)` — takes uid param, no auth.uid() check | CRITICAL | Batch 1 (immediate revoke) | F-02 |
| 3 | `public.get_unread_message_total(uid)` — takes uid param, suspected no auth.uid() check | CRITICAL | Batch 1 (immediate revoke) | F-03 |
| 4 | `public.profiles` — private profiles exposed to anon via broad `true` policy | HIGH | Batch 2 | F-04 |
| 5 | `learning.courses` — broad `true` policies break multi-tenant org isolation | HIGH | Batch 2 | F-05 |
| 6 | `vc.read_actor_profile` — returns PII (email, birthdate, age, sex, is_adult) with no per-caller auth check | HIGH | Batch 2+3 | F-06 |
| 7 | Supabase default EXECUTE grants — anon can call all `public.*` SECURITY DEFINER functions | HIGH | Batch 1 | F-07 |

---

## 9. SQL Proposals Summary

All SQL in this document is text-only and must not be executed automatically. Each proposal is labeled with its batch number.

Implementation sequence:
1. Batch 1 REVOKE statements — execute via Supabase migration or SQL editor, one at a time
2. Batch 2 policy changes — test in staging before applying to production
3. Batch 3 — code changes in apps/VCSM/ and engines/ — requires PR review
4. Batch 4 DROP statements — only after Batch 3 is confirmed with no active callers
5. Batch 5 — function rewrites — requires PR review + regression testing

---

*CARNAGE report complete. Cross-reference VENOM security findings at `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_04-04_venom_secdefiner-trust-boundaries.md`.*
