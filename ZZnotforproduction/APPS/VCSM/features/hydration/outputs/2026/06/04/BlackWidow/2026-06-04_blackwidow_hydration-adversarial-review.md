# BLACKWIDOW V2 Adversarial Review — hydration
## BW2.5 V2 / BW2.9 Report Format

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | hydration |
| App | VCSM |
| Review Date | 2026-06-04 |
| Reviewer | BLACKWIDOW V2 (BW2.5) |
| Scanner Version | 1.1.0 |
| Scanner Maps Timestamp | 2026-06-04T19:48:25.152Z (FRESH — ~7h old) |
| BEHAVIOR.md Status | PLACEHOLDER — all §9 invariants UNANCHORED |
| SECURITY.md Status | Pre-existing: 2 HIGH, 2 MEDIUM, 2 LOW (VENOM) |
| Report Status | COMPLETE |
| Finding Count | 0 CRITICAL, 3 HIGH, 2 MEDIUM, 2 LOW, 1 INFO |

---

## 2. Scanner Preflight

- Scanner Version: 1.1.0
- Maps Generated: 2026-06-04T19:48:25.152Z
- Status: FRESH
- Security paths attributed to hydration in scanner: 0 (feature has no scanner-registered security paths)
- Total platform security paths in map: 598
- Callgraph hydration nodes: 33
- Callgraph hydration edges: 98
- Write execution paths for hydration: 0 (no write paths — hydration is read-only infrastructure)
- RPC execution paths for hydration: 0 (RPC calls are reads via vc.get_actor_summaries)

Note: Zero scanner-registered security paths means the feature has LOW confidence coverage in the scanner map. Per Rule BW-002, the entire feature surface becomes the PRIMARY ATTACK TARGET.

---

## 3. Scanner Inputs Block

```
security-path-map.json   → 0 paths attributed to hydration
callgraph.json           → 33 nodes, 98 edges
write-execution-map.json → 0 paths attributed to hydration
rpc-execution-map.json   → 0 paths attributed to hydration
```

Source files read for this review:
- `engines/hydration/src/controller/hydrateActor.controller.js`
- `engines/hydration/src/store.js`
- `engines/hydration/src/dal.js`
- `engines/hydration/src/hydrate.js`
- `engines/hydration/src/useActorSummary.js`
- `engines/hydration/src/normalize.js`
- `engines/hydration/src/extract.js`
- `engines/hydration/src/config.js`
- `engines/hydration/index.js`
- `engines/hydration/src/adapters/index.js`
- `apps/VCSM/src/features/hydration/vcsmActorHydrator.js`
- `apps/VCSM/src/features/hydration/setup.js`
- `apps/VCSM/src/state/identity/identity.model.js`
- `apps/VCSM/src/state/identity/identity.read.dal.js`
- `apps/VCSM/src/state/identity/identity.controller.js` (lines 85–255)
- `apps/VCSM/src/features/settings/profile/controller/profile.controller.js`
- `apps/VCSM/src/features/feed/hooks/useFeed.js` (lines 120–158)
- `apps/VCSM/src/features/post/postcard/dal/post.read.dal.js`
- `apps/VCSM/src/debuggers-stub/identity/index.js`
- `apps/VCSM/vite.config.js` (lines 40–76)

---

## 4. Attack Surface Inventory

### 4.1 Security Path Coverage

| Category | Count | Confidence |
|---|---|---|
| Scanner-registered security paths | 0 | N/A |
| HIGH confidence (resolved sourceRoute) | 0 | HIGH |
| LOW confidence / unresolved | 0 | N/A |
| **ENTIRE FEATURE — source-inferred** | ALL | LOW (BW-002) |

All attack surfaces derived from direct source reading per BW-002.

### 4.2 Hook Entry Points (UI-accessible)

| Hook | File | Writes? |
|---|---|---|
| `useActorSummary` | `engines/hydration/src/useActorSummary.js` | READ ONLY — store selector |
| `useActorStore` | `engines/hydration/src/store.js` | YES — `upsertActors` publicly exported |

### 4.3 Controller Entry Points

| Controller | File | Auth Gate? |
|---|---|---|
| `hydrateActor` | `engines/hydration/src/controller/hydrateActor.controller.js` | NONE — no auth gate |
| `hydrateVcsmActor` | `apps/VCSM/src/features/hydration/vcsmActorHydrator.js` | NONE — no auth gate |

### 4.4 DAL Write Surfaces

Hydration is a read-only feature. No DAL write surfaces exist in the hydration engine itself. The single write-adjacent surface is:
- `useActorStore.upsertActors()` — in-memory store write, publicly exported from barrel

### 4.5 DAL Read Surfaces

| DAL Function | Source | Auth/Ownership Check |
|---|---|---|
| `getActorSummariesByIdsDAL` | `engines/hydration/src/dal.js:34` | NONE — relies on RLS |
| `readIdentityActorByIdDAL` | `identity.read.dal.js:50` | NONE — relies on RLS |
| `readProfileIdentityDAL` | `identity.read.dal.js:79` | NONE — relies on RLS; fetches PII columns |
| `readActorPrivacyDAL` | `identity.read.dal.js:92` | NONE — relies on RLS |
| `readVportIdentityDAL` | `identity.read.dal.js:118` | NONE — relies on RLS |
| `readActorOwnerUserDAL` | `identity.read.dal.js:144` | NONE — relies on RLS |
| Inline query | `vcsmActorHydrator.js:65-71` | NONE — bypasses DAL, relies on RLS |

### 4.6 Callgraph Backward Trace: Who reaches upsertActors?

- `profile.controller.js:saveProfileCore` — calls `upsertActors` directly (actorId from DB-resolved lookup, not client payload)
- `useFeed.js / useCentralFeed.js` — call `upsertActors` from pipeline data
- `hydrate.js:hydrateActorsFromRows` — calls `upsertActors` with normalized RPC data
- `hydrate.js:hydrateAndReturnSummaries` — calls `upsertActors` with normalized RPC data

---

## 5. Scanner Signals Block

| Signal | Value |
|---|---|
| Feature in security-path-map | NO — 0 paths |
| Feature in write-execution-map | NO — 0 paths |
| Feature in rpc-execution-map | NO — 0 paths |
| Callgraph nodes | 33 |
| Callgraph hook/controller entries | 4 (1 controller, 3 hook functions) |
| Write surfaces (in-memory) | 1 (`upsertActors`) |
| Scanner confidence classification | LOW CONFIDENCE (per BW-002) |

---

## 6. Adversarial Path Analysis

### 6A — OWNERSHIP BYPASS

**Attack:** Can an actor submit a mutation with another actor's resource ID?

**Analysis:** The hydration engine contains no mutation operations. `upsertActors` is a store write, not a DB write. The only DB writes triggered via hydration context are:
- `profile.controller.js:saveProfileCore` calls `upsertActors` but actorId is resolved server-side via `dalReadActorIdByProfileId(subjectId)` — DB lookup, not client-injected.
- No controller in the hydration engine validates actor ownership before hydrating data about an arbitrary actorId.

**vcsmActorHydrator.js:64-72** contains an inline fallback query to `vport.profile_actor_access` with no ownership check on the caller. Any actorId can be passed to `hydrateVcsmActor` and it will attempt full hydration including the owner resolution fallback.

**Result:** BLOCKED — no DB writes, in-memory store only. However, the lack of an ownership gate on `hydrateVcsmActor` means any actorId can trigger owner resolution lookups. Classified as INFO finding (informational, not exploitable in isolation).

**Provenance:** [SOURCE_VERIFIED] — `vcsmActorHydrator.js:18-83` (no ownership assertion present)

---

### 6B — SESSION MUTATION

**Attack:** Is viewerActorId taken from session (trusted) or from client payload (untrusted)?

**Analysis:** Hydration functions (`hydrateActorsFromRows`, `hydrateActorsByIds`, `hydrateAndReturnSummaries`) accept `actorIds` as parameters — no viewerActorId is required. These are read-only pipelines that fetch actor presentation data for any passed ID.

`hydrateActor` in `engines/hydration/src/controller/hydrateActor.controller.js:11-37` accepts `actorId` as a plain parameter with no session verification. Callers are responsible for ensuring they pass legitimate IDs.

The identity hydration path in `identity.controller.js` uses `selectedActorId` from `ctx.activeActor.actorId` which is resolved by the identity engine (trusted, from `resolveAuthenticatedContext`). This path is trusted.

**Result:** PARTIAL — hydration functions themselves do not consume a viewerActorId (they are actor-summary fetchers, not session-scoped actions). The controller has no session gate but the attack surface is only data presentation. Classified as MEDIUM finding.

**Provenance:** [SOURCE_VERIFIED] — `engines/hydration/src/controller/hydrateActor.controller.js:11-37` (no viewerActorId validation); `identity.controller.js:152` (trusted session context)

---

### 6C — RUNTIME ABUSE

**Attack:** Can a non-owner actor type reach owner-only paths?

**Analysis:** `vcsmActorHydrator.js:50-80` executes a two-step owner resolution for vport actors:
1. `readActorOwnerUserDAL(actor.id)` — queries `vc.actor_owners`
2. Fallback: inline query to `vport.profile_actor_access` (lines 65-71)

This owner resolution runs for **any** vport actor being hydrated — it is not gated by the calling actor's kind or ownership. A logged-in user hydrating any vport's profile triggers owner resolution and exposes `ownerActorId` in the returned object.

The returned `ownerActorId` is then surfaced in the identity object per `identity.model.js:1-9` via `toPublicIdentity()`. `toPublicIdentity` returns `ownerActorId` unconditionally for any actor object that has it.

**Result:** PARTIAL — the data exposure (ownerActorId leaking through the public identity surface) was already identified as VEN-HYDRATION-004 (MEDIUM). From an adversarial runtime perspective, no runtime abuse can occur because there are no write operations gated on this check. The ownerActorId is in-memory only, not served to an API consumer via this path. PARTIAL finding escalated to confirm.

**Provenance:** [SOURCE_VERIFIED] — `vcsmActorHydrator.js:57-79` (unconditional owner resolution); `identity.model.js:5-8` (`toPublicIdentity` exposes ownerActorId)

---

### 6D — RLS VERIFICATION

**Attack:** For each DAL read surface, is there an ownership filter, or is RLS the only barrier?

**Analysis:**

**`getActorSummariesByIdsDAL` (engines/hydration/src/dal.js:34):**
Calls `vc.get_actor_summaries` RPC with `p_actor_ids` array. No app-layer auth gate or ownership filter. RLS is the sole barrier. VENOM already flagged this as VEN-HYDRATION-001. Adversarial test: pass arbitrary actorIds — if RLS policy on get_actor_summaries is SECURITY DEFINER and filters by privacy, this is protected. If SECURITY INVOKER, authenticated users could enumerate public actor data for any actorId. The function is called in context of an authenticated Supabase session — user RLS applies.

**`readProfileIdentityDAL` (identity.read.dal.js:79):**
PROFILE_COLUMNS at line 6-23 explicitly selects `email`, `birthdate`, `age`, `sex`, `is_adult`, `last_seen`. No RLS filter is specified in app code — RLS on `public.profiles` is the sole barrier. This was VEN-HYDRATION-003 (HIGH — THOR BLOCKER). Adversarial confirmation: the columns ARE in the select list and ARE mapped into the identity object at `mapProfileActor` (identity.model.js:38-60).

**Inline query in `vcsmActorHydrator.js:65-71`:**
```
supabaseClient
  .schema("vport")
  .from("profile_actor_access")
  .select("actor_id")
  .eq("profile_id", vport.id)
  .eq("is_primary", true)
  .maybeSingle()
```
No ownership filter in app code. Bypasses DAL layer. RLS on `vport.profile_actor_access` is the sole barrier. VEN-HYDRATION-002 (MEDIUM) confirmed.

**Adversarial Result for DAL RLS:**
- VEN-HYDRATION-001: CONFIRMED OPEN — RLS assumed, not verified by BW
- VEN-HYDRATION-003: CONFIRMED OPEN — PII columns in select, RLS sole barrier
- VEN-HYDRATION-002: CONFIRMED OPEN — inline query bypasses DAL

New BW finding: The inline query at `vcsmActorHydrator.js:65-71` uses the module-level `supabaseClient` (public schema client) to query `vport.profile_actor_access`. This is architecturally inconsistent — the vport schema should be queried via the vport-scoped client. If the public client has broader access to the vport schema, this may bypass vport-scoped RLS policies.

**Provenance:** [SOURCE_VERIFIED] — `vcsmActorHydrator.js:16` (`import { supabase as supabaseClient }`); `identity.read.dal.js:6-23` (PII columns explicit)

---

### 6E — VIEWER CONTEXT FUZZING

**Attack:** What happens if null/undefined actorId is passed to each controller?

**`hydrateActor` (hydrateActor.controller.js:17-19):**
```js
if (!actorId) {
  return null
}
```
Null/undefined actorId returns null — BLOCKED.

**`hydrateVcsmActor` (vcsmActorHydrator.js:25-26):**
```js
if (!actorId) return null;
```
Null actorId returns null — BLOCKED.

**`getActorSummariesByIdsDAL` (dal.js:17-21):**
```js
if (!Array.isArray(actorIds) || actorIds.length === 0) {
  return { rows: [], error: null }
}
const uniqueActorIds = [...new Set(actorIds.filter(Boolean))]
if (uniqueActorIds.length === 0) { return { rows: [], error: null } }
```
Empty/null array returns empty — BLOCKED. `filter(Boolean)` strips null entries.

**`hydrateActorsFromRows` (hydrate.js:29-31):**
```js
const allIds = extractActorIdsForHydration(rows)
if (!allIds.length) return { hydrated: 0, errors: [] }
```
Empty rows returns early — BLOCKED.

**`useActorSummary` (useActorSummary.js:37-38):**
```js
const actorId = toActorId(actorRef)
const actor = useActorStore((s) => (actorId ? s.actors[actorId] : null))
```
Null actorRef → null actorId → null actor, returns `missing: true` with defaults — BLOCKED.

**Result:** BLOCKED across all entry points. Null guards are consistently implemented.

**Provenance:** [SOURCE_VERIFIED] — all files cited above with line numbers

---

### 6F — MUTATION REPLAY

**Attack:** Can a completed/cancelled operation be re-triggered?

**Analysis:** Hydration is a stateless read pipeline with no operation state machine. There are no terminal states, no booking-style state transitions, no idempotency concerns. `upsertActors` with `safeMerge` is idempotent by design — replaying the same hydration call just overwrites with same data.

**Result:** NOT APPLICABLE — no operation state machine in this feature.

---

### 6G — HYDRATION POISONING

**Attack:** Can actor summaries be poisoned or served stale?

**Sub-attack 1: Store injection via `upsertActors`**

`upsertActors` is exported from `engines/hydration/index.js:9` as part of `useActorStore`. Any component or hook that imports the store can call `upsertActors` directly. There is no access control on this function. The `safeMerge` logic (store.js:14-28) prevents overwriting non-null values with null but allows any non-null value to overwrite existing data when `force=false`.

Attack chain: A malicious feature module imports `useActorStore`, calls `upsertActors` with a fabricated actor row (`{ actor_id: 'victim-uuid', displayName: 'HACKED', photoUrl: 'evil.jpg' }`). This would poison the victim's display name in all UI components using `useActorSummary` until the 5-minute TTL expires and the next hydration cycle runs.

**Criticality:** This is a client-side store manipulation — only affects the attacker's own browser session (JavaScript execution context). Cannot affect other users. No server-side state is modified. However, it represents a store integrity gap.

**Result:** PARTIAL — client-side only, no cross-user impact possible. Single-step exploit chain in attacker's own context. MEDIUM finding.

**Provenance:** [SOURCE_VERIFIED] — `engines/hydration/index.js:9` (upsertActors exported); `engines/hydration/src/store.js:40-86` (no access gate); `store.js:22-25` (safeMerge only blocks null overwrites)

**Sub-attack 2: Stale actor display for deleted/deactivated actors**

VEN-HYDRATION-006 confirmed: store has no eviction path. `store.js` exports `upsertActors`, `isStale`, `getMissingOrStale`, `getActor` — no `evictActor`, `clearActor`, or `invalidate` method. If an actor is blocked, deactivated, or deleted after their data is in the store, the stale data persists for up to 5 minutes (STALE_AFTER_MS at line 8).

**Result:** PARTIAL — confirmed open. No cross-session impact. Data eventually corrects after TTL. LOW finding for adversarial confirmation.

**Provenance:** [SOURCE_VERIFIED] — `engines/hydration/src/store.js:8,40-115` (no eviction method in entire store definition)

**Sub-attack 3: Mixed-shape return from `hydrateAndReturnSummaries`**

`hydrate.js:122` returns `{ rows: [...fresh, ...summaries], error: null }`. The `fresh` entries are already normalized (camelCase, store shape). The `summaries` entries are raw RPC rows (snake_case). Downstream consumers receive a heterogeneous array.

At `post.read.dal.js:43`, the caller does `const actor = actorRows?.[0] ?? null` and uses it directly. If the first actor is from cache (camelCase: `displayName`, `photoUrl`) but caller expects `display_name` and `photo_url`, field access silently returns `undefined`.

This is not an injection path but is a data integrity defect — actor data may appear missing in UI without any error.

**Result:** BYPASSED — the heterogeneous return array can cause silent field access failures. This is a NEW finding not previously captured by VENOM. HIGH severity.

**Provenance:** [SOURCE_VERIFIED] — `engines/hydration/src/hydrate.js:87-122` (fresh = store-normalized, summaries = raw RPC rows, mixed in return); `apps/VCSM/src/features/post/postcard/dal/post.read.dal.js:42-43` (caller uses first element directly)

---

### 6H — URL SURFACE

**Attack:** Do any notification linkPaths, share links, or deep links expose raw UUIDs?

**Analysis:**

`useActorSummary.js:83-85`:
```js
const route = actorId
  ? `/profile/${encodeURIComponent(username ?? actorId)}`
  : '#'
```

When `username` is null or empty, `actorId` (a UUID) falls through as the route parameter. `username` can be null from the store when:
1. Actor has not yet been hydrated (store entry exists but `username` field is null)
2. RPC returned a row with null `username` / `vport_slug` fields
3. `safeMerge` preserved a null from a previous partial upsert

If `useActorSummary` is used to generate a navigation route before the actor's username is resolved, the route `/profile/<uuid>` would be rendered, violating the no-raw-IDs-in-URLs rule.

**Result:** BYPASSED — UUID exposure in route is possible when username is null. The route is consumed by UI components across the platform (BlockConfirmModal, BlockedState, PostCard, PendingFollowRequests, etc. — 15 callgraph edges to useActorSummary). This is a NEW finding. HIGH severity.

**Provenance:** [SOURCE_VERIFIED] — `engines/hydration/src/useActorSummary.js:83-85` (actorId falls through when username is null); `engines/hydration/src/normalize.js:34-36` (username can be null from normalize); `engines/hydration/src/store.js:58` (username stored as null)

**No notification linkPath construction exists in the hydration engine itself** — notifications are built in separate controllers. No URL surface beyond `useActorSummary.route` is present.

---

### 6I — §9 INVARIANT ATTACK (HIGHEST PRIORITY)

**BEHAVIOR.md status:** PLACEHOLDER — no §9 Must Never Happen section exists.

Because BEHAVIOR.md is a PLACEHOLDER with no §9 invariants defined, all invariant attacks are executed against source-inferred invariants derived from platform rules and the VENOM findings.

**Source-inferred invariant 1:** Actor summaries must never expose PII fields (email, birthdate, age, sex, is_adult, last_seen) to unauthenticated callers or via the public hydration store.

Attack: Read `identity.read.dal.js:PROFILE_COLUMNS` → `mapProfileActor` → identity store → `useIdentity()` surface.

Result: BYPASSED — `readProfileIdentityDAL` explicitly selects PII columns (line 6-23). `mapProfileActor` maps all of them to the identity object (identity.model.js:44-59: `email`, `birthdate`, `age`, `sex`, `isAdult`, `lastSeen`). These fields exist in the identity object accessible via `useIdentity()`. VEN-HYDRATION-003 CONFIRMED OPEN. THOR BLOCKER.

**Source-inferred invariant 2:** Route paths for actors must use human-readable slugs, never raw UUIDs.

Attack: Render a component using `useActorSummary` for an actor whose username has not yet been hydrated.

Result: BYPASSED — see finding BW-HYDR-007. Route falls back to raw actorId UUID.

**Source-inferred invariant 3:** Debug events emitting full user identity data must be strictly gated behind IS_DEV checks.

Attack: Trace `identity.controller.js` debug event calls for IS_DEV guard coverage.

Result: PARTIAL — `ENGINE_RESOLVE_START` (line 105) and `HYDRATION_START` (line 153) emit `userId` and `allActorIds` without IS_DEV guard. In production, the `@debuggers` alias resolves to stub no-ops (vite.config.js:50-51), so the data never escapes. However, the call site itself is not guarded — any non-production, non-minified build (staging, preview, development) would emit these values. LOW finding (production path safe, non-prod risk).

**Provenance:** [SOURCE_VERIFIED] — `identity.controller.js:105-108` (no IS_DEV guard); `identity.controller.js:153-159` (no IS_DEV guard); `vite.config.js:50-51` (prod stub routing)

---

## 7. Exploitability Assessment

| Finding ID | Severity | Attack Type | Exploitability | Conditions |
|---|---|---|---|---|
| BW-HYDR-001 | HIGH | Data Poisoning | PARTIAL — client-side only | Attacker controls their own JS context |
| BW-HYDR-002 | HIGH | PII Exposure (confirms VEN-003) | BYPASSED — source verified | Authenticated user, identity resolution path |
| BW-HYDR-003 | HIGH | Data Integrity / Injection | BYPASSED — mixed shape return | Any caller using hydrateAndReturnSummaries |
| BW-HYDR-004 | HIGH | URL UUID Exposure | BYPASSED — UUID fallback route | username null before/during hydration |
| BW-HYDR-005 | MEDIUM | No Session Gate on Hydrators | PARTIAL | Hydration controller has no auth gate |
| BW-HYDR-006 | MEDIUM | Missing Contract (confirms VEN-007) | BYPASSED — invariants unanchored | BEHAVIOR.md is PLACEHOLDER |
| BW-HYDR-007 | LOW | Store Staleness (confirms VEN-006) | PARTIAL — time-limited | Deleted/blocked actors persist 5 min |
| BW-HYDR-008 | LOW | Unguarded Debug Events | PARTIAL — prod safe | Staging/preview/dev builds only |
| BW-HYDR-009 | INFO | Arbitrary actorId hydration | BLOCKED — no write impact | Read-only, RLS applies |

---

## 8. Source Verification Summary

| Finding | File:Line | Verification Status |
|---|---|---|
| BW-HYDR-001 | `engines/hydration/index.js:9`, `store.js:40-86` | [SOURCE_VERIFIED] |
| BW-HYDR-002 | `identity.read.dal.js:6-23`, `identity.model.js:44-59` | [SOURCE_VERIFIED] |
| BW-HYDR-003 | `hydrate.js:87-122`, `post.read.dal.js:42-43` | [SOURCE_VERIFIED] |
| BW-HYDR-004 | `useActorSummary.js:83-85`, `normalize.js:34-36`, `store.js:58` | [SOURCE_VERIFIED] |
| BW-HYDR-005 | `hydrateActor.controller.js:11-37` | [SOURCE_VERIFIED] |
| BW-HYDR-006 | `BEHAVIOR.md:1-9` (PLACEHOLDER status) | [SOURCE_VERIFIED] |
| BW-HYDR-007 | `store.js:8,40-115` (no eviction path) | [SOURCE_VERIFIED] |
| BW-HYDR-008 | `identity.controller.js:105-108,153-159` | [SOURCE_VERIFIED] |
| BW-HYDR-009 | `vcsmActorHydrator.js:18-83`, `hydrateActor.controller.js:11-37` | [SOURCE_VERIFIED] |

All BYPASSED findings have [SOURCE_VERIFIED] citations per protocol.

---

## 9. Confidence Summary

| Finding | Scanner Confidence | Source Confidence | Final Confidence |
|---|---|---|---|
| BW-HYDR-001 (store poisoning) | LOW (no scanner path) | HIGH (source read) | HIGH |
| BW-HYDR-002 (PII confirmed) | LOW (no scanner path) | HIGH (explicit column list) | HIGH |
| BW-HYDR-003 (mixed shape) | LOW (no scanner path) | HIGH (line 122 explicit) | HIGH |
| BW-HYDR-004 (UUID in route) | LOW (no scanner path) | HIGH (fallback explicit) | HIGH |
| BW-HYDR-005 (no session gate) | LOW | HIGH | HIGH |
| BW-HYDR-006 (no contract) | SCANNER_LOW_CONF | VERIFIED | HIGH |
| BW-HYDR-007 (staleness) | LOW | HIGH | HIGH |
| BW-HYDR-008 (debug events) | LOW | HIGH (guarded by stub) | MEDIUM |
| BW-HYDR-009 (arbitrary hydration) | LOW | HIGH | HIGH |

---

## 10. §9 Invariant Attack Map

| Invariant Source | Invariant | Attack Designed | Result |
|---|---|---|---|
| Platform Rule (no raw IDs in URLs) | Actor routes must use human-readable slugs | useActorSummary null-username fallback | BYPASSED |
| VEN-HYDRATION-003 / Platform PII policy | PII fields must not be in public identity object | Trace readProfileIdentityDAL → mapProfileActor | BYPASSED — confirmed open |
| VEN-HYDRATION-006 / Store contract | Deleted/blocked actors should not serve stale UI data | Check store for eviction on block/delete event | PARTIAL — no eviction path |
| Platform security (debug logging) | Debug events with PII/IDs must be IS_DEV gated | Trace identity.controller.js debug call sites | PARTIAL — prod stub safe |
| BEHAVIOR.md §9 | **ALL §9 INVARIANTS UNANCHORED** | N/A — PLACEHOLDER file | MISSING |

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md is a PLACEHOLDER. No §4 Failure Paths, no §9 Must Never Happen entries exist.

This means:
- All adversarial invariants in this review are source-inferred, not contract-anchored
- Any invariant violation discovered here has no formal contract to cite in a THOR blocker
- The BEHAVIOR.md gap itself is a THOR blocker per VEN-HYDRATION-007

BW assessment: The absence of a behavior contract for a platform-wide engine (consumed by feed, chat, posts, notifications, explore, team, schedule) is HIGH risk. This engine underlies virtually all actor display throughout VCSM. Without §9 invariants, there is no governance boundary for:
- What fields must never appear in the public store
- What happens when hydration fails mid-render
- Whether `ownerActorId` is ever permitted in public-facing data
- Minimum data guarantees for the store shape

**This THOR blocker should be prioritized before any new feature builds on the hydration engine.**

---

## 12. THOR Impact

### Release Blockers (Confirmed Open after BW Review)

| Finding | Status | Description |
|---|---|---|
| VEN-HYDRATION-003 / BW-HYDR-002 | CONFIRMED OPEN | PII fields (email, birthdate, age, sex, is_adult, last_seen) in identity hydration object — THOR BLOCKER |
| VEN-HYDRATION-007 / BW-HYDR-006 | CONFIRMED OPEN | BEHAVIOR.md is PLACEHOLDER — no §9 invariants — THOR BLOCKER |

### New BW Findings — Require Triage for THOR Gate

| Finding | Severity | THOR Gate Recommendation |
|---|---|---|
| BW-HYDR-003 | HIGH | YES — mixed shape return from hydrateAndReturnSummaries causes silent data corruption |
| BW-HYDR-004 | HIGH | YES — UUID fallback in useActorSummary.route violates no-raw-IDs-in-URLs platform rule |
| BW-HYDR-001 | HIGH | NO — client-side only store poisoning, no cross-user impact |
| BW-HYDR-005 | MEDIUM | NO — hydration controllers are intentionally unauthenticated (they fetch public summaries) |
| BW-HYDR-007 | LOW | NO — time-limited, no security impact |
| BW-HYDR-008 | LOW | NO — production path is safe via stub routing |

---

## 13. SPIDER-MAN Test Requirements

The following test coverage is required to close BW findings:

### T1 — Mixed Shape Return (BW-HYDR-003) — HIGH
```
Test: hydrateAndReturnSummaries — fresh+stale split return shape consistency
Given: actorIds where some are in cache (fresh) and some are stale
When: hydrateAndReturnSummaries is called
Then: all returned rows MUST have consistent normalized shape (same field names)
Verify: fresh rows from cache use same shape as rows from RPC
```

### T2 — UUID Route Fallback (BW-HYDR-004) — HIGH
```
Test: useActorSummary route — null username fallback behavior
Given: an actor in store with null username and null vportSlug
When: useActorSummary is called with that actorId
Then: route must NOT contain the raw actorId UUID
Acceptable: route returns '#' or '/profile/unknown' — never '/profile/<uuid>'
```

### T3 — PII Field Exclusion (BW-HYDR-002 / VEN-003) — HIGH
```
Test: readProfileIdentityDAL column exclusion
Given: identity hydration is triggered for a user actor
When: mapProfileActor produces the identity object
Then: result must NOT contain email, birthdate, age, sex, isAdult, lastSeen fields
```

### T4 — Store Eviction (BW-HYDR-007 / VEN-006) — LOW
```
Test: actor store — eviction on block/delete signal
Given: an actor in the store
When: that actor is blocked or deactivated
Then: the store must either evict the entry or mark it invalid
```

### T5 — Null Guard Coverage (BW-HYDR regression)
```
Test: null actorId handling across all hydration entry points
Given: null/undefined actorId passed to hydrateActor, hydrateVcsmActor, getActorSummariesByIdsDAL
Then: all return null / empty without throwing — confirmed BLOCKED
```

---

## Finding Quick Reference

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-HYDR-001 | HIGH | `upsertActors` publicly exported from store with no access gate — client-side store poisoning vector | PARTIAL | DRAFT |
| BW-HYDR-002 | HIGH | PII columns (email, birthdate, age, sex, is_adult, last_seen) confirmed in identity hydration object via mapProfileActor | BYPASSED | DRAFT — cross-ref VEN-HYDRATION-003 |
| BW-HYDR-003 | HIGH | `hydrateAndReturnSummaries` returns mixed shape: fresh entries (camelCase store shape) + stale entries (snake_case RPC shape) — silent field access failures | BYPASSED | DRAFT — NEW |
| BW-HYDR-004 | HIGH | `useActorSummary.route` falls back to raw actorId UUID when username is null — violates no-raw-IDs-in-URLs platform rule | BYPASSED | DRAFT — NEW |
| BW-HYDR-005 | MEDIUM | Hydration controllers (`hydrateActor`, `hydrateVcsmActor`) have no session gate — any actorId can trigger owner resolution lookups | PARTIAL | DRAFT |
| BW-HYDR-006 | MEDIUM | BEHAVIOR.md is PLACEHOLDER — zero §9 invariants anchored — all invariant governance is absent | BYPASSED | DRAFT — cross-ref VEN-HYDRATION-007 |
| BW-HYDR-007 | LOW | Store has no eviction path for deleted/blocked/deactivated actors — stale data persists up to 5 minutes | PARTIAL | DRAFT — cross-ref VEN-HYDRATION-006 |
| BW-HYDR-008 | LOW | `ENGINE_RESOLVE_START` and `HYDRATION_START` debug events in `identity.controller.js` emit full userId and allActorIds without IS_DEV guard — production-safe via stub, staging risk only | PARTIAL | DRAFT |
| BW-HYDR-009 | INFO | No auth gate on hydration controllers — arbitrary actorId can trigger hydration — BLOCKED by RLS and read-only nature | BLOCKED | DRAFT |

---

*BLACKWIDOW V2 adversarial review complete. All BYPASSED findings are [SOURCE_VERIFIED] with file:line citations. No production source code was modified. No database schema or RLS policies were modified. All findings are DRAFT governance status.*
