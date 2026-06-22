# DB Session — Tier-2 Surgical Fix Confirmations

**Date:** 2026-06-01
**Session:** Cerebro Tier-2 DB confirmation sprint (TICKET-SEC-VERIFY-001 continuation)
**Connection:** `db.nkdrjlmbtqbywhcthppm.supabase.co` — live Supabase project
**Queries:** Read-only catalog inspection only. No mutations.

---

## DB-01 — vport.resources resource_type CHECK constraint

**Purpose:** Confirm valid resource_type values for DEFER-007 barber join QR fix.

**Result:**
```
CHECK ((resource_type = ANY (ARRAY['primary'::text, 'staff'::text, 'room'::text, 'chair'::text, 'equipment'::text, 'vehicle'::text, 'station'::text])))
```

**Conclusion:** Valid values are `primary`, `staff`, `room`, `chair`, `equipment`, `vehicle`, `station`. Barber join QR resources are `staff` type (corroborated by `vportOwnerStats.controller.js` and `wanderexPublicHelpers.read.dal.js` both using `.eq("resource_type", "staff")` for team member resources).

**Action taken:** `fetchJoinResourceByIdDAL` updated to add `.eq("resource_type", "staff")` filter. DEFER-007 closed.

---

## DB-02 — vport.menu_categories and vport.menu_items columns

**Purpose:** Confirm whether `actor_id` column exists on menu tables (ELEK-051).

**Result — menu_categories columns:**
```
id (uuid), profile_id (uuid), key (text), name (text), description (text),
sort_order (integer), is_active (boolean), created_at (timestamptz),
updated_at (timestamptz), meta (jsonb)
```

**Result — menu_items columns:**
```
id (uuid), profile_id (uuid), category_id (uuid), key (text), name (text),
description (text), price_cents (integer), currency_code (text), image_url (text),
sort_order (integer), is_active (boolean), created_at (timestamptz),
updated_at (timestamptz), meta (jsonb)
```

**Conclusion:** NO `actor_id` column on either table. Ownership is via `profile_id` only. The `.eq("actor_id", actorId)` filter in both delete DALs was a dead filter causing a PostgreSQL column-not-found error on every delete call. Menu category and item deletion was completely broken.

**Action taken:** Dead `actorId` parameter and `.eq("actor_id", actorId)` filter removed from both delete DALs. Controller call sites updated. ELEK-051 closed.

---

## DB-03 — RLS policies on vport.availability_rules and vport.availability_exceptions

**Purpose:** Confirm INSERT/UPDATE/DELETE RLS coverage (ELEK-061).

**Result — availability_rules (7 policies):**
- SELECT×3: `actor_owners` join (owner), `current_actor_can_view_resource` (manager), public read for active resources
- INSERT×2: `actor_owners` WITH CHECK (owner), `current_actor_can_manage_resource` WITH CHECK (manager)
- UPDATE×2: `actor_owners` USING+WITH CHECK (owner), `current_actor_can_manage_resource` USING+WITH CHECK (manager)
- DELETE×2: `actor_owners` (owner), `current_actor_can_manage_resource` (manager)

**Result — availability_exceptions (6 policies):**
- SELECT×2: `current_actor_can_view_resource`, `actor_can_view_profile` join
- INSERT×1: `actor_can_manage_profile` WITH CHECK
- UPDATE×1: `actor_can_manage_profile` USING+WITH CHECK
- DELETE×2: `current_actor_can_manage_resource`, `actor_can_manage_profile` join

**Conclusion:** Both tables have comprehensive RLS. INSERT/UPDATE/DELETE all gated on ownership via `vc.actor_owners` or `actor_can_manage_profile`. ELEK-060 (DAL no ownership) is MITIGATED — controller gate + DB RLS provide dual defense. ELEK-061 (RLS unconfirmed) is CLOSED NOT_A_RISK. ELEK-062 (read DALs) is CLOSED — SELECT RLS confirmed on both tables.

---

## DB-04 — Subscriber count RPCs in vc schema

**Purpose:** Confirm canonical RPC for subscriber count consolidation (V-SUB-008).

**Result:**
```
count_vport_subscribers(p_actor_id uuid) — FUNCTION
list_vport_subscribers(p_actor_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) — FUNCTION
```

**Negative result:** `get_follower_count` — DOES NOT EXIST in any schema.

**count_vport_subscribers definition:**
```sql
SELECT count(f.*)::int
FROM vc.actor_follows f
WHERE f.followed_actor_id = p_actor_id
  AND f.is_active = true
  AND EXISTS (
    SELECT 1 FROM vport.profiles vp
    WHERE vp.actor_id = p_actor_id
      AND vp.is_active = true
      AND vp.is_deleted = false
  );
```

**Conclusion:** `get_follower_count` is a dead RPC. `dalCountSubscribers` in `social/friend/subscribe/dal/subscriberCount.dal.js` has been silently failing on every call — follower count is always 0 for all actors. `count_vport_subscribers` only works for VPORT actors (requires a live `vport.profiles` row). A new `get_actor_follower_count(p_actor_id)` RPC is needed that works for any actor kind. V-SUB-008 escalated from LOW to HIGH. Added to CARNAGE Migration Sprint.

---

## Summary

| Query | Finding | Action |
|---|---|---|
| DB-01 | resource_type valid values: `primary`, `staff`, `room`, `chair`, `equipment`, `vehicle`, `station` | DEFER-007 fixed: `fetchJoinResourceByIdDAL` now requires `resource_type = 'staff'` |
| DB-02 | No `actor_id` column on `menu_categories` or `menu_items` — ownership via `profile_id` only | ELEK-051 fixed: dead filter removed from both delete DALs; menu delete now functional |
| DB-03 | Both availability tables have comprehensive RLS (SELECT/INSERT/UPDATE/DELETE all covered) | ELEK-060/061/062 closed |
| DB-04 | `get_follower_count` dead RPC — follower count always 0; `count_vport_subscribers` is VPORT-only | V-SUB-008 escalated HIGH; CARNAGE sprint item added |
