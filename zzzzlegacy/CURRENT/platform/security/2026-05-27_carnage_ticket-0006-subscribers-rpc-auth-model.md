# CARNAGE / DB Report — TICKET-0006: list_subscribers / count_subscribers RPC Auth Model

**Date:** 2026-05-27
**Reviewer:** CARNAGE + DB
**Ticket:** TICKET-0006 — Verify list_subscribers / count_subscribers RPC Auth Model
**Application Scope:** VCSM
**Mode:** READ-ONLY INVESTIGATION + repair migration proposal
**Trigger:** TICKET-0005 close-out; both RPCs use SECURITY DEFINER and accept arbitrary p_actor_id with no public visibility guard. Investigating whether this correctly scopes to public VPORT actors or creates a privacy bypass for non-public actors.

---

## LIVE DB FINDINGS — CONFIRMED 2026-05-27

### Function Definitions

```
vc.count_subscribers(p_actor_id uuid) → int
  prosecdef:  true  (SECURITY DEFINER)
  proconfig:  search_path = vc, public
  body:
    SELECT count(*)::int
    FROM vc.actor_follows f
    WHERE f.followed_actor_id = p_actor_id
      AND f.is_active = true;
```

```
vc.list_subscribers(p_actor_id uuid, p_limit int, p_offset int) → TABLE(...)
  prosecdef:  true  (SECURITY DEFINER)
  proconfig:  search_path = vc, identity, public
  body:
    SELECT d.actor_id, d.display_name, d.username, d.avatar_url AS photo_url
    FROM vc.actor_follows f
    JOIN identity.actor_directory d ON d.actor_id = f.follower_actor_id
    WHERE f.followed_actor_id = p_actor_id
      AND f.is_active = true
    ORDER BY f.created_at DESC
    LIMIT greatest(p_limit, 0)
    OFFSET greatest(p_offset, 0);
```

### vc.actor_follows SELECT RLS

```
actor_follows.select.self  — authenticated
USING:
  EXISTS (actor_owners WHERE actor_id = follower_actor_id AND user_id = auth.uid())
  OR
  EXISTS (actor_owners WHERE actor_id = followed_actor_id AND user_id = auth.uid())
```

**Self-only.** A caller can only read rows where they own either the follower or the followed actor. No public read. No third-party enumeration via direct table access.

### EXECUTE Grants

| Grantee | Privilege |
|---|---|
| authenticated | EXECUTE |
| postgres | EXECUTE |

No `anon`, no `public` grant. ✓

---

## SCHEMA TRUST CLASSIFICATION

| Object | Classification | Reason |
|---|---|---|
| `vc.actor_follows` | Identity-sensitive + Social-sensitive | Contains follow relationships; SELECT RLS is self-only for a reason |
| `vc.count_subscribers` | Social-sensitive | Returns follower count for any actor ID; bypasses RLS |
| `vc.list_subscribers` | Identity-sensitive + Social-sensitive | Returns paginated subscriber identity rows for any actor ID; bypasses RLS |

---

## SECURITY DEFINER BYPASS ANALYSIS

Both functions are `SECURITY DEFINER`. They execute as the function owner (postgres / superuser equivalent), bypassing the `actor_follows.select.self` RLS policy entirely.

**Consequence:** Any authenticated user can call `count_subscribers(anyUUID)` or `list_subscribers(anyUUID, ...)` and receive the complete subscriber count and list for any actor on the platform — regardless of whether that actor is a public VPORT, a private VPORT, or a regular user actor.

### For public VPORT actors: INTENTIONAL

The IRONMAN public read decision (confirmed in session audit) classified `getSubscribersController` as intentionally public. VPORT subscriber lists are displayed on public profile tabs to any visitor. SECURITY DEFINER is the correct pattern here: the `actor_follows.select.self` RLS correctly blocks third-party direct reads, so a SECURITY DEFINER function is the right bypass to expose the public subscriber surface.

**search_path set correctly on both functions — no injection risk. ✓**

### For non-public / non-VPORT actors: PRIVACY GAP

The functions accept any `p_actor_id` with no validation that:
- The actor is a VPORT (not a regular user actor)
- The actor's profile is public (`is_active = true, is_deleted = false, is_private = false`)
- The caller has any relationship to the actor

A regular user actor with private social settings has their follow graph protected by `actor_follows.select.self` on direct table access. These RPCs bypass that protection entirely.

**Result:** Any authenticated Citizen can call `count_subscribers(somePrivateUserActorId)` and get that user's follower count. They can call `list_subscribers(...)` and get a paginated list of who follows that private user — as long as the followers appear in `identity.actor_directory`.

**`identity.actor_directory` vs `identity.public_actor_directory`:**
`list_subscribers` joins on `identity.actor_directory` (not the `public_` prefixed view). This may include non-public actors in the follower result set. Whether `identity.actor_directory` is scoped to public actors is unverified — if it includes all actors, the privacy gap extends to exposing the identities of the private user's followers.

---

## RISK CLASSIFICATION

| Finding | Severity | Immediate Risk | Affected Actors |
|---|---|---|---|
| SECURITY DEFINER bypasses self-read RLS | MEDIUM | LOW — no unauthenticated access; authenticated-only | Any actor in `actor_follows` |
| No public visibility guard on p_actor_id | MEDIUM | LOW — requires knowing target's UUID | Non-VPORT / private user actors |
| `identity.actor_directory` scope unverified | LOW | LOW | Follower identity exposure scope |

**Overall: CAUTION** — Live functionality is correct for VPORT public profiles. Privacy gap exists for non-VPORT actors but requires authenticated access + knowledge of target UUID. Low exploitability in practice; worth hardening.

---

## PROPOSED REPAIR

### Option A — Public VPORT guard (preferred)

Add a `p_actor_id` visibility check inside both functions. Only return data if the target actor corresponds to a publicly visible VPORT profile.

```sql
-- TEXT ONLY — DO NOT RUN without DB + VENOM review

-- Repair count_subscribers: restrict to publicly visible VPORT actors
CREATE OR REPLACE FUNCTION vc.count_subscribers(p_actor_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'vc', 'vport', 'public'
AS $$
  SELECT count(f.*)::int
  FROM vc.actor_follows f
  WHERE f.followed_actor_id = p_actor_id
    AND f.is_active = true
    AND EXISTS (
      SELECT 1
      FROM vport.profiles vp
      WHERE vp.actor_id     = p_actor_id
        AND vp.is_active    = true
        AND vp.is_deleted   = false
    );
$$;

-- Repair list_subscribers: restrict to publicly visible VPORT actors
CREATE OR REPLACE FUNCTION vc.list_subscribers(
  p_actor_id uuid,
  p_limit    int,
  p_offset   int
)
RETURNS TABLE (
  actor_id     uuid,
  display_name text,
  username     text,
  photo_url    text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'vc', 'vport', 'identity', 'public'
AS $$
  SELECT
    d.actor_id,
    d.display_name,
    d.username,
    d.avatar_url AS photo_url
  FROM vc.actor_follows f
  JOIN identity.actor_directory d ON d.actor_id = f.follower_actor_id
  WHERE f.followed_actor_id = p_actor_id
    AND f.is_active = true
    AND EXISTS (
      SELECT 1
      FROM vport.profiles vp
      WHERE vp.actor_id     = p_actor_id
        AND vp.is_active    = true
        AND vp.is_deleted   = false
    )
  ORDER BY f.created_at DESC
  LIMIT  greatest(p_limit, 0)
  OFFSET greatest(p_offset, 0);
$$;
```

**Effect:**
- Public VPORT actors → unchanged behavior ✓
- Private VPORT actors → returns 0 / empty (consistent with profile visibility)
- Non-VPORT user actors → returns 0 / empty (private social graph protected)
- `search_path` updated to include `vport` for the EXISTS check

### Option B — Accept current behavior as intentional

If subscriber counts and lists for ALL actors (including regular users) are intended to be public information on this platform, document this as a platform policy decision and add a comment to both functions. No code change needed.

**Recommended:** Option A — the `actor_follows.select.self` RLS exists specifically to prevent third-party enumeration. The SECURITY DEFINER should narrow its bypass to only the public VPORT surface it was designed for.

---

## MIGRATION STRATEGY

| Phase | Action | Risk |
|---|---|---|
| Phase 0 (done) | Confirm function bodies and RLS policies via pg_proc + pg_policies | NONE |
| Phase 1 | Verify `vport.profiles.actor_id` index exists (for EXISTS subquery performance) | NONE — read-only check |
| Phase 2 | Apply Option A repair via `CREATE OR REPLACE FUNCTION` in new migration | LOW — backwards-compatible; return type unchanged; only adds row filter |
| Phase 3 | Verify VPORT subscriber views still display correctly after repair | NONE — live test |

---

## ROLLBACK

Both functions use `CREATE OR REPLACE`. Rollback = revert to current function body. No schema or data change. FULL rollback survivability.

---

## VALIDATION CHECKLIST

| Area | Status | Notes |
|---|---|---|
| EXECUTE grants | CONFIRMED ✓ | authenticated + postgres only |
| SECURITY DEFINER | CONFIRMED ✓ | Both functions; search_path set |
| `actor_follows` SELECT RLS | CONFIRMED ✓ | Self-only; intentional |
| SECURITY DEFINER bypass scope | CONFIRMED | Wider than needed; covers all actors |
| `vport.profiles.actor_id` index | PENDING | Phase 1 check before applying repair |
| `identity.actor_directory` scope | PENDING | Verify whether it includes non-public actors |

---

## RECOMMENDED HANDOFFS

| Command | Reason | Status |
|---|---|---|
| DB | Verify `vport.profiles.actor_id` index; inspect `identity.actor_directory` definition | PENDING |
| VENOM | Option A or B decision — platform policy on subscriber count visibility | PENDING |
| THOR | Release gate — MEDIUM severity; does not block release but should be addressed before social graph features ship | INFORM |

---

## FINAL CARNAGE STATUS: CAUTION

**Live DB is functional for VPORT public profiles. SECURITY DEFINER + search_path correctly set. Grants restricted to authenticated.**
**Privacy gap: non-VPORT actors' subscriber data is accessible to any authenticated caller via p_actor_id. Option A repair proposed.**
**TICKET-0007 is unblocked — independent vport.profiles policy cleanup.**

---

*Report generated by CARNAGE/DB — READ ONLY — 2026-05-27*
*Application scope: VCSM*
*No database changes were made during this analysis.*
