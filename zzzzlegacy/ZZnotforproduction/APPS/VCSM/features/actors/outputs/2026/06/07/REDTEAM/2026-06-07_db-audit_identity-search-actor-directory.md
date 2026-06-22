---
report: DB FUNCTION AUDIT — identity.search_actor_directory
ticket: TICKET-ACTOR-SEARCH-SEC-001
date: 2026-06-07
mode: SOURCE-VERIFIED — function definition provided directly
migration: supabase/migrations/20260607100000_harden_identity_search_actor_directory.sql
---

# DB AUDIT: identity.search_actor_directory
## Post-Remediation Adversarial Review

---

## FUNCTION PROFILE

| Property | Value |
|---|---|
| Schema | `identity` |
| Language | `sql` |
| Volatility | `stable` |
| Security context | **SECURITY INVOKER** (no SECURITY DEFINER clause) |
| auth.uid() used | **NO** |
| p_viewer_actor_id ownership validated | **NO** (pre-patch) |
| Return shape | Table of actor directory rows |

---

## SECURITY MODEL: SECURITY INVOKER

The function runs with the privileges of the **calling role** (`anon` or
`authenticated`). This means:

- RLS policies on `identity.actor_directory` and `moderation.blocks` apply
  to the caller's role, not a privileged owner role.
- `auth.uid()` IS available within SECURITY INVOKER context in Supabase.
  The function does not call it — this is the core gap.
- `anon` role: no EXECUTE grant found in local migrations. Grant hygiene
  migration `20260606000001` explicitly notes that `anon` EXECUTE on
  `identity.refresh_actor_directory_row` was revoked (IDRLS-001). The new
  remediation migration explicitly issues `REVOKE EXECUTE ... FROM anon` and
  `GRANT EXECUTE ... TO authenticated`.

---

## TEST CASES A–D: ANALYTICAL EXECUTION

### Case A — null viewer + p_filter='all'

**Input:**
```
p_viewer_actor_id = NULL
p_filter          = 'all'
p_query           = 'test'
```

**Function trace:**
```sql
-- normalized_input:
filter_key = 'public'  -- NULL viewer forces 'public' unconditionally
lim        = 20

-- candidate_rows WHERE:
(p_viewer_actor_id is not null)  → FALSE
(ad.is_private = false)          → required to pass

-- filter branch:
ni.filter_key = 'public'         → TRUE for all actor kinds
```

**Result:** `is_private = false` actors only.
`p_filter = 'all'` from the caller is **overridden** by the DB's null-viewer
guard before it is evaluated. The override is unconditional.

**Verdict: PASS — public actors only. DB invariant holds.**

---

### Case B — invalid UUID + p_filter='all'

**Input:**
```
p_viewer_actor_id = 'not-a-uuid'  (passed as text)
p_filter          = 'all'
```

**Function trace:**

The parameter type is `uuid`. PostgreSQL performs an implicit cast at the
call boundary. `'not-a-uuid'` fails the cast:
```
ERROR: invalid input syntax for type uuid: "not-a-uuid"
```
The function body never executes.

**Verdict: PASS — PostgreSQL type system rejects malformed UUIDs before the
function runs. App-layer isUuid() validation is defense-in-depth.**

---

### Case B-prime — nil UUID (bypasses app-layer isUuid, accepted by Postgres)

**Input:**
```
p_viewer_actor_id = '00000000-0000-0000-0000-000000000000'  (nil UUID)
p_filter          = 'all'
```

The app's `isUuid()` regex enforces version bits `[1-5]` — nil UUID (version 0)
fails the app check. But PostgreSQL accepts nil UUID as a valid `uuid` type.

**Pre-patch function trace:**
```sql
-- normalized_input:
filter_key = 'all'  -- nil UUID is not null → 'all' path taken

-- candidate_rows WHERE:
(p_viewer_actor_id is not null)  → TRUE (nil UUID is non-null)
                                 → private actors pass the gate
```

**Pre-patch result:** Private actors returned to a caller using the nil UUID.

**Post-patch (verified_viewer CTE):**
```sql
-- verified_viewer:
-- auth.uid() IS NOT NULL (authenticated caller)
-- EXISTS(actor_owners WHERE actor_id = nil_uuid) → FALSE (no real actor is nil)
-- → verified viewer_actor_id = NULL (downgraded)

-- normalized_input:
filter_key = 'public'  -- downgraded viewer → public-only path

-- candidate_rows WHERE:
(ni.viewer_id is not null)  → FALSE → ad.is_private = false required
```

**Post-patch result:** Public actors only. Nil UUID attack closed.

**Verdict: CLOSED by patch — but only if caller is authenticated. Anonymous
callers cannot reach the function (no EXECUTE grant to anon).**

---

### Case C — authenticated actor + p_filter='all'

**Input:**
```
p_viewer_actor_id = <valid UUID owned by auth.uid()>
p_filter          = 'all'
```

**Pre-patch function trace:**
```sql
filter_key = 'all'

(p_viewer_actor_id is not null) → TRUE → all actors pass privacy gate
filter_key = 'all' → all actor kinds pass
```

**Post-patch function trace:**
```sql
-- verified_viewer: auth.uid() owns p_viewer_actor_id → viewer_actor_id = p_viewer_actor_id

filter_key = 'all'
(ni.viewer_id is not null) → TRUE → all actors pass privacy gate
filter_key = 'all' → all actor kinds pass
```

**Result:** All active, non-void, listable, discoverable, published actors
(both public and private) are returned.

**Design note:** "Private" in this function = hidden from anonymous search.
ALL authenticated actors can find ALL private actors. No relationship/follower
gate exists. If the platform intends private = follower-only discoverability,
a separate migration adding a `vc.actor_follows` join is required. This was
NOT the intent of this remediation sprint.

**Verdict: PASS for intended design. Note: private actors are platform-wide
discoverable to any authenticated user — confirm this is intended.**

---

### Case D — private actor, anonymous viewer

**Input:**
```
p_viewer_actor_id = NULL
p_filter          = 'all'
p_query           = <private actor's username>
```

**Function trace:**
```sql
filter_key = 'public'

(p_viewer_actor_id is not null) → FALSE
(ad.is_private = false)         → required
```

**Result:** Private actor does NOT appear in results.

**Verdict: PASS — null viewer cannot enumerate private actors.**

---

## CONFIRMED FINDINGS

---

### DB-CRITICAL-1 — No auth.uid() validation; cross-actor UUID spoofing enables block bypass

**Severity:** CRITICAL (pre-patch)
**Status:** FIXED by migration `20260607100000`
**Location:** `normalized_input` CTE; `unblocked` CTE

**Evidence:**
```sql
-- ORIGINAL (vulnerable):
-- normalized_input uses p_viewer_actor_id directly
case
  when p_viewer_actor_id is null then 'public'
  when p_filter in ('all', 'users', 'vports') then p_filter
  else 'all'
end as filter_key

-- unblocked block check:
b.blocker_actor_id = p_viewer_actor_id   -- raw parameter, not validated
b.blocked_actor_id = p_viewer_actor_id   -- raw parameter, not validated
```

**Attack chain:**
1. Authenticated user (actor_X) has been blocked by actor_Z
2. actor_X calls function with `p_viewer_actor_id = actor_Y_uuid` (any other actor)
3. Block check runs against actor_Y's blocks, not actor_X's
4. actor_Z (who blocked actor_X) appears in results
5. Block safety feature bypassed — blocked actor is discoverable

**Why this matters:** Blocking is a safety feature on VCSM (domestic violence
protection, harassment prevention). If a blocked user can rediscover their
blocker by spoofing another actor's UUID, the safety guarantee is broken.

**Fix:**
```sql
-- NEW (verified_viewer CTE):
case
  when p_viewer_actor_id is null then null::uuid
  when auth.uid() is null        then null::uuid
  when exists (
    select 1 from vc.actor_owners ao
    where ao.actor_id = p_viewer_actor_id
      and ao.user_id  = auth.uid()
  ) then p_viewer_actor_id
  else null::uuid                 -- forged/unowned → downgrade to null
end as viewer_actor_id
```

Block check updated to use `c.viewer_id` (verified) instead of `p_viewer_actor_id` (raw).

---

### DB-CRITICAL-2 — p_limit uncapped; full directory extraction possible

**Severity:** CRITICAL
**Status:** FIXED by migration `20260607100000`
**Location:** `normalized_input` CTE

**Evidence:**
```sql
-- ORIGINAL (vulnerable):
greatest(coalesce(p_limit, 20), 1) as lim
-- greatest(X, 1) enforces minimum 1 but has NO maximum
-- p_limit = 1000000 → lim = 1000000
```

**Attack:**
Direct API caller sends `p_limit = 10000`. Gets up to 10,000 rows in a single
request. With repeated offset pagination, entire actor directory (public +
private, depending on viewer context) can be extracted with a small number
of API calls.

```
p_limit = 10000, p_offset = 0    → rows 1–10000
p_limit = 10000, p_offset = 10000 → rows 10001–20000
...
```

Even with the public-only restriction for anonymous callers, this allows
bulk extraction of all public actor usernames, display names, and avatars
at scale.

**Fix:**
```sql
-- NEW:
least(greatest(coalesce(p_limit, 20), 1), 100) as lim
-- enforces: 1 ≤ lim ≤ 100
```

---

### DB-HIGH-1 — "Private" actors visible to all authenticated users (no relationship gate)

**Severity:** HIGH
**Status:** NOT FIXED — by design for this sprint; confirm platform intent

**Evidence:**
```sql
and (
  p_viewer_actor_id is not null   -- ANY non-null viewer passes
  or ad.is_private = false
)
```

No `vc.actor_follows`, `vc.actor_connections`, or similar relationship check
exists. "Private" actors are returned to ANY authenticated viewer.

**Behavior confirmed:**
- Anonymous: cannot find private actors ✅
- Authenticated actor A: can find private actor B even with zero relationship ❗

**Design question:** If "private" means "discoverable only by followers/approved
connections," this requires a relationship gate. The function currently treats
"private" as "hidden from unauthenticated search only."

**If relationship-gated discoverability is required, the fix would be:**
```sql
and (
  ad.is_private = false
  or (
    ni.viewer_id is not null
    and exists (
      select 1 from vc.actor_follows af
      where af.follower_actor_id = ni.viewer_id
        and af.followed_actor_id = ad.actor_id
        and af.status = 'active'
    )
  )
)
```

This was intentionally NOT included in the remediation migration because it
would require schema and relationship data verification and could break
the block-user search flow (you need to find the user before you can block them).

---

### DB-HIGH-2 — Nil UUID bypasses app isUuid() but passes Postgres uuid type

**Severity:** HIGH (pre-patch) / CLOSED (post-patch)
**Status:** FIXED by migration `20260607100000` via ownership verification

**Evidence:**
- App: `UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`
  - Version bits `[1-5]` — nil UUID (version 0) fails
- PostgreSQL: `'00000000-0000-0000-0000-000000000000'::uuid` → valid, no error

**Pre-patch:** Nil UUID reaches the function as non-null → filter_key='all' →
private actors returned to the caller.

**Post-patch:** Nil UUID passes PostgreSQL type cast, reaches `verified_viewer`
CTE. `actor_owners WHERE actor_id = nil_uuid` returns zero rows → downgraded
to null → public-only results.

---

### DB-MEDIUM-1 — LIKE '%q%' with leading wildcard; sequential scan risk

**Severity:** MEDIUM
**Status:** NOT FIXED — performance concern, not security

**Evidence:**
```sql
lower(coalesce(ad.username, '')) like '%' || ni.q_lower || '%'
```

Leading `%` prevents B-tree index use. For short queries (1-2 chars),
this forces a full table scan of `identity.actor_directory`. Combined
with no server-side rate limiting (other than the now-fixed p_limit cap),
short repeated queries are a DoS vector against the directory table.

**Mitigation options:**
1. Add minimum query length enforcement in the function: `length(ni.q) >= 2`
2. Ensure `pg_trgm` GIN index exists on `lower(username)` and `lower(display_name)`
3. Use only the `%` trigram operator (not the LIKE + trigram combination)

---

### DB-LOW-1 — Rank threshold 0.05 is very permissive for short queries

**Severity:** LOW
**Status:** NOT FIXED — no immediate security impact

**Evidence:**
```sql
where
  ni.q is null
  or u.rank_score > 0.05
```

`similarity()` returns 0.0–1.0 based on trigram overlap. For a 1-char query
against a long username, similarity can be near 0 but still pass `> 0.05`.
Combined with LIKE '%q%', this returns virtually all actors whose name contains
the query character, even at the lowest relevance level.

For enumeration: an attacker paging through single-character queries ('a', 'b',
..., 'z') can map all public actors in ~26 requests with `p_limit=100`.

---

## CASE A–D VERDICT TABLE

| Case | Input | Expected | Actual (pre-patch) | Actual (post-patch) | Pass/Fail |
|---|---|---|---|---|---|
| A | null viewer + 'all' filter | public only | public only | public only | ✅ PASS |
| B | invalid UUID + 'all' filter | error or public | PostgreSQL type error → no results | same | ✅ PASS |
| B-prime | nil UUID + 'all' filter | public only | **private actors returned** | public only | ✅ FIXED |
| C | authenticated actor + 'all' | authenticated visibility | authenticated visibility | authenticated visibility | ✅ PASS |
| D | private actor, anonymous | not returned | not returned | not returned | ✅ PASS |

---

## RLS INTERACTION

**identity.actor_directory** (the underlying view queried by the function):

No RLS policies on `identity.actor_directory` found in local migrations.
The function is SECURITY INVOKER — it runs as the calling role.

The grant `GRANT SELECT ON identity.public_actor_directory TO authenticated`
was found in `20260503052543`. This is `public_actor_directory`, not
`actor_directory`. These may be different views:

- `identity.public_actor_directory` — public-filtered view for direct client reads
- `identity.actor_directory` — broader view used by the search function (includes private actors)

Since the function works in production, `identity.actor_directory` must be
accessible to the `authenticated` role via an untracked grant or a different
mechanism. If `identity.actor_directory` has its own RLS restricting `authenticated`
to `is_private = false` rows, the cross-actor spoofing attack (DB-CRITICAL-1)
would be partially mitigated at the table level — but the block bypass would
still work.

**Verified from local migrations:** No explicit RLS on `identity.actor_directory`.
The function's WHERE clause is the primary visibility enforcement layer.

---

## MUST NEVER HAPPEN — VERIFIED STATUS

| Condition | Pre-patch | Post-patch |
|---|---|---|
| null viewer returns private actors | IMPOSSIBLE (WHERE gate) | IMPOSSIBLE |
| invalid UUID returns private actors | IMPOSSIBLE (type error) | IMPOSSIBLE |
| nil UUID returns private actors | **POSSIBLE** | IMPOSSIBLE (ownership gate) |
| forged UUID returns private actors with non-matching blocks | **POSSIBLE** | IMPOSSIBLE (ownership gate) |
| p_filter bypasses visibility enforcement | IMPOSSIBLE (null override) | IMPOSSIBLE |
| p_limit enables full directory extraction | **POSSIBLE** | IMPOSSIBLE (100-row cap) |

---

## GRANT HYGIENE — VERIFIED

| Role | EXECUTE (pre-patch) | EXECUTE (post-patch) |
|---|---|---|
| `anon` | Unknown — no local grant found; IDRLS-001 revoked anon on refresh_actor_directory_row | Explicitly REVOKED by migration |
| `authenticated` | Likely granted (function works in production) | Explicitly GRANTED by migration |
| `service_role` | Full access (Supabase default) | Unchanged |

---

## MIGRATION SUMMARY

**File:** `supabase/migrations/20260607100000_harden_identity_search_actor_directory.sql`

**Changes:**
1. New `verified_viewer` CTE — validates p_viewer_actor_id ownership via `vc.actor_owners` + `auth.uid()`. Forged, unowned, nil, or unauthenticated viewer IDs downgrade to null.
2. `normalized_input` — `filter_key` derivation now uses `verified_viewer.viewer_actor_id` instead of raw `p_viewer_actor_id`.
3. `candidate_rows` WHERE — privacy gate uses `ni.viewer_id` (verified). Block check uses `c.viewer_id` (verified).
4. `p_limit` capped at 100 via `least(..., 100)`.
5. `REVOKE EXECUTE ... FROM anon` + `GRANT EXECUTE ... TO authenticated` for grant hygiene.

**Not changed:**
- Return shape — backward compatible with all 6 app callsites.
- Rank logic, LIKE/trigram matching, ordering.
- "Private = hidden from anonymous only" design (no relationship gate added).

---

## THOR GATE ASSESSMENT

| Gate | Pre-patch | Post-patch |
|---|---|---|
| null viewer → public only | ✅ | ✅ |
| auth.uid() ownership validation | ❌ BLOCKER | ✅ FIXED |
| block bypass closed | ❌ BLOCKER | ✅ FIXED |
| p_limit server-side cap | ❌ BLOCKER | ✅ FIXED (100 rows) |
| nil UUID bypass closed | ❌ HIGH | ✅ FIXED |
| anon EXECUTE revoked | UNVERIFIED | ✅ EXPLICIT |
| Private = anonymous-only (design) | OPEN QUESTION | OPEN — confirm intent |

**THOR release gate for actor search: CONDITIONAL PASS**

Mandatory before THOR session:
1. Deploy migration `20260607100000_harden_identity_search_actor_directory.sql`
2. Confirm `identity.actor_directory` SELECT grant state for `authenticated` role in Supabase
3. Confirm platform intent: "private" = anonymous-only, OR "private" = follower-gated
4. Separate audit still required for ELEK-2026-06-04-001 (m/[actorId] edge function)
