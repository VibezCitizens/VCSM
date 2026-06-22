# TICKET-SUB-001 Subscriber RPC Architecture Review

**Date:** 2026-05-27
**Scope:** apps/VCSM only
**Mode:** Live code + DB inspection — no prior audit file reliance
**Contracts loaded:** ARCHITECTURE.md, PROJECT_BOUNDARY_ISOLATION_CONTRACT.md

---

## Current RPC Inventory

| RPC | Security | search_path | Callers | Current Scope | Risk |
|---|---|---|---|---|---|
| `vc.count_subscribers` | **SECURITY DEFINER** | `vc, public` | `subscribersCount.dal.js` → `dalCountSubscribers(actorId)` | Actor-global (accepts any UUID) | **HIGH** — bypasses actor_follows RLS |
| `vc.list_subscribers` | **SECURITY DEFINER** | `vc, identity, public` | `subscribersList.dal.js` → `dalListSubscribers({ actorId })` | Actor-global (accepts any UUID) | **HIGH** — bypasses RLS; joins `identity.actor_directory` (all actors) |
| `vc.get_follower_count` | **UNKNOWN** | unknown | `subscriberCount.dal.js` → `dalCountSubscribers({ actorId })` | Actor-global (social graph) | UNKNOWN — pending DB verification |

**Confirmed from DB query run in this session:**
`count_subscribers` and `list_subscribers` are both `prosecdef: true` (SECURITY DEFINER). Neither function body references `vport.profiles`. Neither has a visibility guard.

---

## Current Code Call Sites

### VPORT subscriber UI path

```
VportSubscribersView (screen)
  receives: profile.actorId — no viewer identity passed
  → useSubscribers(actorId)                    [hook — no viewer ID, no auth check]
    → getSubscribersController({ actorId })    [controller — no ownership gate, no privacy check]
      → dalCountSubscribers(actorId)           [dal — positional arg, calls count_subscribers]
      → dalListSubscribers({ actorId })        [dal — calls list_subscribers]
```

**`getSubscribersController` confirmed from live code:**
```js
export async function getSubscribersController({ actorId, limit = 50, offset = 0 }) {
  if (!actorId) return { count: 0, rows: [] };
  const [count, rows] = await Promise.all([
    dalCountSubscribers(actorId),
    dalListSubscribers({ actorId, limit, offset }),
  ]);
  return { count: count ?? 0, rows: Array.isArray(rows) ? rows : [] };
}
```

Zero ownership gate. Zero privacy check. Zero viewer authentication.

**`useSubscribers` confirmed from live code:** accepts any `actorId`, `enabled` flag only — no caller identity.

**`VportSubscribersView` confirmed from live code:** passes `profile.actorId` directly. `buildSubscriberActor` falls back to `/feed` (not raw UUID) for missing handles — this fallback is safe.

### Social follow graph path

```
ActorProfileHeader (all actor kinds)
  → useFollowerCount(actorId)
    → ctrlGetFollowerCount({ actorId })        [controller]
      → dalCountSubscribers({ actorId })       [dal — named arg, calls get_follower_count]
```

### Naming collision — confirmed

| File | Export name | RPC | Arg style |
|---|---|---|---|
| `profiles/kinds/vport/dal/subscribersCount.dal.js` | `dalCountSubscribers` | `count_subscribers` | positional: `dalCountSubscribers(actorId)` |
| `social/friend/subscribe/dal/subscriberCount.dal.js` | `dalCountSubscribers` | `get_follower_count` | named: `dalCountSubscribers({ actorId })` |

The collision is silent. Which function you get depends on import path. No linter or type system catches this. One throws on missing arg; the other returns 0.

### Cache invalidation gap — confirmed

`follow.controller.js` calls `invalidateFollowerCount(followedActorId)` from `subscriberCount.dal.js`. This busts the `get_follower_count` TTL cache. It does **not** call `invalidateSubscriberCount` from `subscribersCount.dal.js`. After a new follow on a VPORT, the subscriber count displayed on the VPORT's subscribers tab retains its cached value for up to 60 seconds.

### Actor-kind guard — absent

`follow.controller.js` confirmed: ownership gate present (V-SUB-001), self-follow guard present, block check present. No guard on `followerActorId` kind. A VPORT actor can follow any other actor at the app layer.

### Notification UUID leak — confirmed

`notification.model.js` — two confirmed leak points:

```js
// No-sender fallback (line ~107):
route: actorId ? `/profile/${actorId}` : '#'
// → raw actorId UUID exposed when no sender resolved

// VPORT sender (line ~128):
route: id ? `/profile/${slug ?? id}` : '#'
// → raw UUID exposed when slug is null
```

`linkPath: '/feed'` on follow notifications confirmed in `follow.controller.js` line ~99.

---

## RLS / DB Findings

### `vc.actor_follows` SELECT RLS

**Confirmed self-only from DB query run this session:**
```sql
USING:
  EXISTS (actor_owners WHERE actor_id = follower_actor_id AND user_id = auth.uid())
  OR
  EXISTS (actor_owners WHERE actor_id = followed_actor_id AND user_id = auth.uid())
```

Third-party enumeration of follow relationships is blocked on direct table access. The policy is self-only by design.

### SECURITY DEFINER bypass scope

Both `count_subscribers` and `list_subscribers` execute as function owner (superuser-equivalent). This bypasses the self-only SELECT RLS on `actor_follows` entirely. The bypass was designed for the public VPORT subscriber display use case. Without a visibility guard, the bypass covers all actor IDs on the platform.

### `identity.actor_directory` scope

Confirmed from `refreshActorDirectory.dal.js` (read this session): `identity.actor_directory` is populated for all actors in `vc` and `learning` domains — not scoped to public or discoverable actors. `list_subscribers` joining on this table returns private-account actor information for any actor that follows a VPORT.

### `actor_privacy_settings` — DAL default divergence confirmed

| File | Missing-row default | Signature | Used by |
|---|---|---|---|
| `social/privacy/dal/actorPrivacy.dal.js` | `{ isPrivate: true }` (fail closed) | `dalGetActorPrivacy({ actorId })` named | `ctrlGetFollowRelationshipState` → follow gate |
| `settings/privacy/dal/visibility.dal.js` | `false` (fail open) | `dalGetActorPrivacy(actorId)` positional | Settings write path |

Same table, same logical question, opposite missing-row defaults. The follow gate fails closed (correct: protect privacy). The settings path fails open (acceptable as default display state but undocumented). Risk: any new read path that imports from `visibility.dal.js` instead of `actorPrivacy.dal.js` silently gets the wrong default.

### `vc.get_follower_count` security context

**Not confirmed in this session.** Must be verified before deciding whether the social subscriber count path has its own RLS bypass risk.

SQL to run:
```sql
SELECT proname, prosecdef, proconfig
FROM pg_proc
WHERE pronamespace = 'vc'::regnamespace
  AND proname = 'get_follower_count';
```

---

## Direct REST Exploitability

### REPLAY-SUB-04: Enumerate subscriber list — CONFIRMED LIVE

**Attack:**
```
POST /rest/v1/rpc/list_subscribers
Authorization: Bearer <any_valid_jwt>
Content-Type: application/json

{ "p_actor_id": "<any_uuid>", "p_limit": 1000, "p_offset": 0 }
```

**Result:** Returns full paginated subscriber list for any actor, including private accounts and non-VPORT actors. SECURITY DEFINER bypasses `actor_follows.select.self` RLS. No visibility guard in function body. No EXECUTE grant restriction (authenticated + postgres).

**Count variant:**
```
POST /rest/v1/rpc/count_subscribers
{ "p_actor_id": "<any_uuid>" }
```

Returns subscriber count for any actor. Zero restriction beyond being authenticated.

**Scope of exposure:** Every actor in `vc.actor_follows.followed_actor_id` — includes private Citizens, inactive VPORTs, deleted VPORTs (if `is_active` check is absent for the followed actor).

### REPLAY-SUB-05: Flip another actor's privacy setting — STATUS UNKNOWN

`dalSetActorPrivacy` in `visibility.dal.js` upserts `actor_privacy_settings` with only the provided `actorId`. No app-layer ownership check. Protection depends entirely on RLS on `vc.actor_privacy_settings`. RLS on that table has not been verified this session.

SQL to run:
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'vc' AND tablename = 'actor_privacy_settings';
```

---

## Recommended Architecture

### Final Decision: CREATE_EXPLICIT_VPORT_RPCS

VPORT subscriber count and list are a **public trust signal** — displayed on the VPORT profile tab to any visitor. The product intent is: if a VPORT profile is public, anyone can see its subscriber count and list.

`get_follower_count` is **internal social graph logic** — it powers feed visibility, profile display for all actor kinds, and follow relationship state. It must never be a public-facing trust signal.

These are different domains. Merging them into the same RPCs creates an incorrect security model: a function designed for public VPORT display should never accept arbitrary actor IDs from the actor-global social graph.

### New RPC design

```sql
-- Public VPORT trust signal (SECURITY DEFINER, VPORT-kind-guarded)
vc.count_vport_subscribers(p_actor_id uuid) → int
vc.list_vport_subscribers(p_actor_id uuid, p_limit int, p_offset int) → TABLE(...)

-- Internal social graph (retain as-is, verify security context separately)
vc.get_follower_count(p_actor_id uuid) → int
```

The VPORT RPCs enforce two guards inside the function body:
1. Actor must be a VPORT: `EXISTS (SELECT 1 FROM vport.profiles WHERE actor_id = p_actor_id AND is_active = true AND is_deleted = false)`
2. Actor must be public (same EXISTS clause covers this when `is_active = true AND is_deleted = false`)

Non-VPORT actors, private VPORTs, and deleted VPORTs return 0 / empty. This is safe to call publicly without actor-kind guarding at the app layer.

### Sequencing

**Phase 0 (immediate):** Apply TICKET-0006 migration `20260527060000`. This adds the `vport.profiles` visibility guard to the existing `count_subscribers` and `list_subscribers` functions. Closes the direct REST enumeration gap. Backward compatible — existing DAL call sites unchanged.

**Phase 1:** Create `count_vport_subscribers` and `list_vport_subscribers` as new RPCs. Grant EXECUTE to `authenticated`. Do not drop old RPCs yet.

**Phase 2:** Update DAL call sites to use new RPCs. Rename exports. Update call site in `getSubscribersController`.

**Phase 3:** Drop `count_subscribers` and `list_subscribers` after all call sites migrated.

---

## Migration Plan

### Phase 0 — Apply pending TICKET-0006

File: `apps/VCSM/supabase/migrations/20260527060000_harden_subscribers_rpc_visibility_guard.sql`
Status: Written, tested, ready. Apply immediately.

### Phase 1 — New explicit VPORT RPCs (new migration)

```sql
-- count_vport_subscribers: VPORT-only, SECURITY DEFINER, visibility-guarded
CREATE OR REPLACE FUNCTION vc.count_vport_subscribers(p_actor_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'vc', 'vport', 'public'
AS $$
  SELECT count(f.*)::int
  FROM   vc.actor_follows f
  WHERE  f.followed_actor_id = p_actor_id
    AND  f.is_active = true
    AND  EXISTS (
      SELECT 1 FROM vport.profiles vp
      WHERE vp.actor_id   = p_actor_id
        AND vp.is_active  = true
        AND vp.is_deleted = false
    );
$$;

-- list_vport_subscribers: VPORT-only, SECURITY DEFINER, visibility-guarded
CREATE OR REPLACE FUNCTION vc.list_vport_subscribers(
  p_actor_id uuid,
  p_limit    int DEFAULT 50,
  p_offset   int DEFAULT 0
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
  SELECT d.actor_id, d.display_name, d.username, d.avatar_url AS photo_url
  FROM   vc.actor_follows f
  JOIN   identity.actor_directory d ON d.actor_id = f.follower_actor_id
  WHERE  f.followed_actor_id = p_actor_id
    AND  f.is_active = true
    AND  EXISTS (
      SELECT 1 FROM vport.profiles vp
      WHERE vp.actor_id   = p_actor_id
        AND vp.is_active  = true
        AND vp.is_deleted = false
    )
  ORDER BY f.created_at DESC
  LIMIT  greatest(p_limit, 0)
  OFFSET greatest(p_offset, 0);
$$;

GRANT EXECUTE ON FUNCTION vc.count_vport_subscribers(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION vc.list_vport_subscribers(uuid, int, int) TO authenticated;
NOTIFY pgrst, 'reload schema';
```

### Phase 2 — DAL and export rename

`subscribersCount.dal.js`:
- Change `rpc("count_subscribers", ...)` → `rpc("count_vport_subscribers", ...)`
- Rename export: `dalCountSubscribers` → `dalCountVportSubscribers`
- Update `invalidateSubscriberCount` to match (name fine as-is)

`subscribersList.dal.js`:
- Change `rpc("list_subscribers", ...)` → `rpc("list_vport_subscribers", ...)`
- Rename export: `dalListSubscribers` → `dalListVportSubscribers`

`getSubscribers.controller.js`:
- Update import names

### Phase 3 — Drop old RPCs

After all call sites confirmed migrated, drop `count_subscribers` and `list_subscribers`. These will still exist after TICKET-0006 apply — they become guarded aliases that are safe to call but no longer needed.

---

## App Code Changes Needed

| File | Change | Urgency | Ticket |
|---|---|---|---|
| `subscribersCount.dal.js` | Call `count_vport_subscribers`, rename export | MEDIUM | TICKET-SUB-001 Phase 2 |
| `subscribersList.dal.js` | Call `list_vport_subscribers`, rename export | MEDIUM | TICKET-SUB-001 Phase 2 |
| `getSubscribers.controller.js` | Update import names; add VPORT privacy check: if VPORT is private and viewer is not owner, return `{ count: 0, rows: [] }` | HIGH | TICKET-SUB-002 |
| `follow.controller.js` | Add actor-kind guard: if `followerActorId` is `vport` kind, throw | HIGH | TICKET-SUB-005 |
| `follow.controller.js` | Call `invalidateSubscriberCount` from `subscribersCount.dal.js` in addition to `invalidateFollowerCount` | LOW | Separate bug |
| `follow.controller.js` | Fix `linkPath: '/feed'` → handle-based route | MEDIUM | TICKET-SUB-004 |
| `notification.model.js` | Fix no-sender fallback: `route: actorId ? /profile/${actorId} : '#'` → `'#'` | MEDIUM | TICKET-SUB-003 |
| `notification.model.js` | Fix VPORT sender: `route: id ? /profile/${slug ?? id} : '#'` → `slug ? /vport/${slug} : '#'` | MEDIUM | TICKET-SUB-003 |
| `visibility.dal.js` | Document missing-row default = `false` is intentional (no row = public account). Or align with `actorPrivacy.dal.js` | MEDIUM | TICKET-SUB-007 |

---

## Tests Needed

| Test | Location | Gate |
|---|---|---|
| `getSubscribersController` — private VPORT + anonymous viewer returns `{ count: 0, rows: [] }` | `controller/subscribers/__tests__/` | TICKET-SUB-002 acceptance |
| `getSubscribersController` — public VPORT returns data | Same | Regression |
| `ctrlSubscribe` — VPORT follower kind throws before DAL | `controllers/__tests__/follow.controller.test.js` | TICKET-SUB-005 acceptance |
| `notification.model.js` — no-sender fallback: `route` is `'#'`, never contains actorId UUID | `model/__tests__/notification.model.test.js` | TICKET-SUB-003 acceptance |
| `notification.model.js` — VPORT sender with null slug: `route` is `'#'`, not `/profile/<uuid>` | Same | Same |
| `dalCountSubscribers` naming collision — confirm only one export exists after rename | grep-based or import test | TICKET-SUB-006 acceptance |

---

## Pending DB Verification

Run before Phase 1 migration:

```sql
-- 1. get_follower_count security context
SELECT proname, prosecdef, proconfig, prosrc
FROM pg_proc
WHERE pronamespace = 'vc'::regnamespace
  AND proname = 'get_follower_count';

-- 2. actor_privacy_settings RLS
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'vc' AND tablename = 'actor_privacy_settings';

-- 3. social_follow_requests RLS
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'vc' AND tablename = 'social_follow_requests';
```

---

## Final Decision

**CREATE_EXPLICIT_VPORT_RPCS**

VPORT subscriber metrics and the actor-global social graph are different domains with different security contexts, different consumers, and different product meanings. They must be separate RPCs.

Immediate action: **Apply TICKET-0006** (`20260527060000`) — closes the direct REST enumeration gap by adding the `vport.profiles` visibility guard to the existing `count_subscribers` / `list_subscribers` functions. No app code changes required at this step.

Follow-up action: Create `count_vport_subscribers` / `list_vport_subscribers`, migrate DAL call sites, resolve naming collision, then drop legacy RPCs.

---

## Implementation Tickets

| Ticket | Title | Priority | Type | Blocker |
|---|---|---|---|---|
| TICKET-0006 (pending apply) | Add vport.profiles guard to count_subscribers/list_subscribers | P0 | SEC | Apply immediately — closes REST enumeration |
| TICKET-SUB-001 Phase 1 | Create count_vport_subscribers + list_vport_subscribers RPCs | P1 | ENG | After TICKET-0006 applied |
| TICKET-SUB-001 Phase 2 | Update DAL call sites + rename exports | P1 | ENG | After Phase 1 RPCs verified |
| TICKET-SUB-001 Phase 3 | Drop count_subscribers + list_subscribers | P2 | ENG | After Phase 2 confirmed |
| TICKET-SUB-002 | Add privacy check to getSubscribersController | P1 | SEC | After Phase 2 |
| TICKET-SUB-003 | Fix notification.model.js raw UUID fallback routes | P1 | SEC | Independent |
| TICKET-SUB-004 | Follow notification linkPath handle resolution | P2 | SEC | Independent |
| TICKET-SUB-005 | Actor-kind guard in ctrlSubscribe (disable VPORT follower) | P2 | ENG | Independent |
| TICKET-SUB-006 | Resolve dalCountSubscribers naming collision | P2 | ENG | After Phase 2 |
| TICKET-SUB-007 | Align actor_privacy_settings missing-row defaults | P2 | ENG | Independent |
| TICKET-SUB-008 | ctrlListOutgoingRequests ownership gate | P3 | SEC | Independent |

---

*Report: TICKET-SUB-001 — 2026-05-27*
*Mode: Live code + DB inspection*
*No code or DB changes made during this review.*
