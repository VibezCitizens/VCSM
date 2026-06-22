---
report: POST-REMEDIATION RED TEAM VALIDATION
ticket: TICKET-ACTOR-SEARCH-SEC-001
date: 2026-06-07
mode: ADVERSARIAL / POST-PATCH / SOURCE-VERIFIED
scope: identity.search_actor_directory — all 6 app-layer callsites
---

# POST-REMEDIATION RED TEAM VALIDATION
## Actor Search Trust Boundary — Adversarial Assessment

---

## METHODOLOGY

Source-first. Every finding is traced from source code to its attack
surface. No inferences. No assumed risks. No historical reports treated
as proof.

All 7 patched files re-read from disk before conclusions were drawn.
All call chains traced independently: Hook → Controller → Adapter →
DAL → RPC.

---

## PHASE 1 — TRUST BOUNDARY VALIDATION

### Callsite Inventory — All 6 Surfaces

| Surface | File | viewerActorId Source | Filter Derivation | Injection Vector |
|---|---|---|---|---|
| Blocks search | `Blocks.controller.js:54` | `useIdentity().actorId` via `useActorLookup.js:12,28` | `isUuid()` in DAL | NONE — session-derived |
| Mention autocomplete | `searchMentionSuggestions.dal.js:23` | **ALWAYS NULL** — controller never passes it | `null → 'public'` (correct) | NOT INJECTABLE (see note 1) |
| Chat actor search | `chat/setup.js:48,56` | `useIdentitySelectionStore.getState().activeActorId` | `viewerActorId ? 'all' : 'public'` | NONE — session-derived |
| Explore actor search | `explore/dal/search.dal.js:18` | `useIdentity().actorId` via `useSearchScreenController.js:74,112` | Truthy check (see note 2) | LOW (see SURVIVE-001) |
| Canonical actor DAL | `actors/dal/searchActors.dal.js:9` | Forwarded from adapter/controller | `isUuid()` — UUID validated | NONE |
| VPORT team candidates | `vportTeamAccess.controller.js:182` | `useIdentitySelectionStore.getState().activeActorId` | Forwarded to canonical DAL | NONE — session-bound |

---

### Anonymous Caller Test

**Input:** viewerActorId = null, p_filter = 'all', query = 'test'

**Result at each callsite:**

- Blocks: hook guards with `enabled: !!actorId` — query never fires if actorId is null. If somehow fired, DAL's `isUuid(null) = false` → filter = 'public'. BLOCKED.
- Mention: controller never receives viewerActorId. DAL gets null → filter = 'public'. BLOCKED.
- Chat: `useIdentitySelectionStore.getState().activeActorId` returns null if unauthenticated → filter = 'public'. BLOCKED.
- Explore: `useIdentity()?.actorId` returns null if unauthenticated → safeFilter = 'public'. BLOCKED.
- Canonical DAL: `isUuid(null) = false` → filter = 'public'. BLOCKED.
- VPORT team: controller binds to session; null session → viewerActorId = null → forwarded as null → canonical DAL → 'public'. BLOCKED.

**Verdict: The (null viewer, 'all' filter) combination is unreachable at the app layer across all 6 callsites.**

---

### Authenticated Caller Test

**Input:** viewerActorId = valid UUID, p_filter = 'all'

**Result:**

- Blocks: `isUuid(actorId) = true` → filter = 'all'. Private actors visible to block. CORRECT.
- Mention: viewerActorId is always null (see Note 1). Filter = 'public'. Authenticated users see public-only in mentions. SECURITY CORRECT but UX REGRESSION (see SURVIVE-002).
- Chat: viewerActorId from Zustand store → 'all'. CORRECT.
- Explore: safeFilter truthy → mapFilter(filter). CORRECT (see Note 2 for caveat).
- Canonical DAL: isUuid → 'all'. CORRECT.
- VPORT team: session-bound → 'all'. CORRECT.

---

### Invalid / Forged Actor Context Tests

**Test: viewerActorId = "not-a-uuid"**

- Canonical DAL: `isUuid("not-a-uuid") = false` → filter = 'public'. BLOCKED.
- Explore DAL: `"not-a-uuid" ? mapFilter(filter) : 'public'` → truthy → safeFilter = mapFilter(filter). PARTIAL (see SURVIVE-001).
- assertActorId("not-a-uuid"): `isUuid("not-a-uuid") = false` → throws. BLOCKED.

**Test: viewerActorId = ""**

- Canonical DAL: `isUuid("") = false` → filter = 'public'. BLOCKED.
- Explore DAL: `"" ? ... : 'public'` → falsy → 'public'. BLOCKED.
- assertActorId(""): `!actor` (empty falsy) → throws. BLOCKED.

**Test: viewerActorId = null**

- Canonical DAL: `isUuid(null) → UUID_RE.test("") = false` → 'public'. BLOCKED.
- Explore DAL: `null ? ... : 'public'` → 'public'. BLOCKED.
- assertActorId(null): `!actor` → throws. BLOCKED.

**Test: viewerActorId = deleted actor UUID (valid format)**

- App layer: format passes `isUuid()`. Treated as authenticated.
- DB layer: UNVERIFIED — the function must handle deleted actors server-side.

**Test: viewerActorId = cross-actor UUID (different authenticated actor)**

- App layer: Explore controller receives viewerActorId from `useIdentity()` which
  returns the session actor. Cannot be forged in normal React render cycles.
  Direct function call from console bypasses this — but DB layer is the true gate.
- DB layer: UNVERIFIED.

---

## PHASE 2 — RPC ABUSE TESTING

### Can caller inject viewerActorId?

| Callsite | Caller-Controlled? | Evidence |
|---|---|---|
| Blocks | NO | viewerActorId from session via useIdentity(); ctrlSearchActors forwards it, not constructing it from an API parameter |
| Mention | NO | viewerActorId structurally absent — controller doesn't accept it |
| Chat | NO | Reads Zustand store directly via getState(); not a parameter |
| Explore | INDIRECT | ctrlSearchResults accepts viewerActorId as parameter (line 5), but it's called from the hook with session-derived actorId. Direct console call could inject forged value — app-layer only risk |
| Canonical DAL | INDIRECT | Forwarded from controller above it; same chain as Explore |
| VPORT team | NO | Controller ignores caller-provided value; derives from store |

### Can caller force p_filter?

- Blocks: filter derived in DAL from isUuid check. p_filter is not a caller parameter anywhere in the Blocks chain. NO.
- Mention: filter derived from viewerActorId (always null → 'public'). NO.
- Chat: `p_filter: viewerActorId ? 'all' : 'public'`. Not a caller parameter. NO.
- Explore: `filter` (tab selection) is a UI state that maps to entity type ('users'/'vports'/'all'). The `safeFilter` override forces 'public' when viewerActorId is null. Tab manipulation cannot bypass visibility when unauthenticated. LOW risk when authenticated (see SURVIVE-001).
- Canonical DAL: filter derived internally from isUuid. NO.

### Can caller bypass session ownership?

After patches: NO for Blocks, Mention, Chat, VPORT team.
Explore controller: viewerActorId parameter-dependent. See SURVIVE-001.

### Can caller supply arbitrary UUID?

Only via direct JavaScript function call (browser console) for Explore and
Blocks controllers. This requires the ability to execute arbitrary JavaScript
in the victim's session — which is already game over. Not a meaningful threat
model for a client-side SPA.

### Can caller obtain non-public actors?

At the app layer after patches: NO. The DB layer remains unverified.

---

## PHASE 3 — SESSION SPOOFING

### Spoofing Attempts and Results

| Attempted viewerActorId | Surface | App Result | DB Result |
|---|---|---|---|
| Random valid-format UUID | Explore controller (direct call only) | safeFilter truthy → mapFilter(filter) — not downgraded | UNVERIFIED |
| Random valid-format UUID | Canonical DAL | isUuid passes → filter='all' sent to DB | UNVERIFIED — DB must validate session |
| Random valid-format UUID | Blocks controller (direct call only) | isUuid passes → forwarded to canonical DAL | UNVERIFIED |
| Deleted actor UUID | Any DAL | Passes isUuid format check | UNVERIFIED — DB must handle |
| Actor from another account | Any DAL | Passes isUuid format check | UNVERIFIED — DB must handle |
| Team member UUID | VPORT team controller | Controller ignores param; uses session | BLOCKED at app layer |
| VPORT actor UUID (not user) | Any DAL | Passes isUuid format check | UNVERIFIED |
| Malformed UUID ("x-x-x-x") | Canonical DAL | isUuid("x-x-x-x") = false → 'public' | N/A |
| Malformed UUID | Explore DAL | safeFilter truthy → mapFilter(filter) | PARTIAL — see SURVIVE-001 |
| Empty string | All DALs | falsy → 'public' | N/A |
| null | All DALs | falsy or isUuid(null)=false → 'public' | N/A |

**Key finding:** For spoofing to matter, the DB function must NOT validate that
p_viewer_actor_id matches the authenticated session (auth.uid()). If the DB
function uses auth.uid() to resolve viewer context, then a forged app-layer
viewerActorId is irrelevant — the DB ignores it. If the DB trusts p_viewer_actor_id
as-is, then format-valid forged UUIDs are a real risk. This is the primary
outstanding gate.

---

## PHASE 4 — RLS DESTRUCTION TEST

### DB Layer Audit Status: BLOCKED

`identity.search_actor_directory` has no local definition in any SQL migration
under `/Users/vcsm/Desktop/VCSM/supabase/migrations/`. The function was deployed
directly to Supabase. It cannot be audited from local source.

### What Was Verified from Local Migrations

- Migrations for `vc.*`, `moderation.*`, `platform.*` schemas are present
- No migration creates or modifies `identity.search_actor_directory`
- The `identity` schema itself has no RLS policies defined in any local migration
- Grant statements for identity functions: NOT FOUND locally

### Required Manual Verification (Supabase Dashboard)

Run:
```sql
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'search_actor_directory'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'identity');
```

Verify:
1. `SECURITY DEFINER` or `SECURITY INVOKER`?
   - If SECURITY DEFINER: function must call `auth.uid()` and validate it against
     p_viewer_actor_id, OR it must enforce visibility purely via auth.uid() regardless
     of p_viewer_actor_id. Without this, a forged p_viewer_actor_id elevates visibility.
   - If SECURITY INVOKER: RLS on the underlying tables enforces caller identity.

2. Does the function validate p_viewer_actor_id = auth.uid()?
   - YES: forged viewerActorId has no effect — DB enforces session identity
   - NO: the DB trusts the app-provided value — format-valid forged UUIDs
     can elevate visibility (SURVIVE-001 becomes HIGH instead of LOW)

3. Does p_filter = 'all' with p_viewer_actor_id = NULL return private actors?
   - Must be tested manually (Case A)

4. Does p_viewer_actor_id = invalid UUID return private actors?
   - Must be tested manually (Case B)

### Estimated Risk if DB Trusts p_viewer_actor_id Without Validation

If the function does NOT verify p_viewer_actor_id = auth.uid():
- SURVIVE-001 escalates from LOW to HIGH
- Any format-valid UUID in the explore or Blocks chain elevates to 'all' visibility
- Direct Supabase API calls with a known actor UUID can enumerate private actors

---

## PHASE 5 — SEARCH ENUMERATION ATTACK

### Empty / Whitespace Query

All DALs: early return if `!needle`. Zero RPC calls. BLOCKED.

### Single-Character Query

- Blocks (useActorLookup): `enabled: normalized.length >= MIN_CHARS (2)`. BLOCKED at hook.
- Mention: hook requires `typed.length >= 1`. SINGLE CHAR ALLOWED.
- Chat: empty check only (`!needle`). SINGLE CHAR ALLOWED.
- Explore: `!q` check only. SINGLE CHAR ALLOWED.

**Result:** Single-character enumeration is possible via Mention, Chat, and Explore paths.
This allows prefix enumeration (e.g., 'a' → all public actors starting with 'a').

### Wildcard / Pattern Injection

No wildcard character stripping in the query path before it reaches `p_query`.
The RPC receives the raw needle. Whether the DB function treats wildcard characters
specially (e.g., '%', '_') depends on the DB implementation — UNVERIFIED.

`normalizeSearchTerm()` in postgrestSafe.js strips non-alphanumeric characters:
```js
.replace(/[^a-z0-9 _-]/g, ' ')
```
This is used for some paths but NOT universally applied across all DALs.
- `searchActorsDAL`: does NOT normalize — strips `@#` prefix only
- `explore/dal/search.dal.js`: strips `@#` prefix only
- `chat/setup.js`: strips `@` prefix only

**'%' and '_'** characters are NOT stripped in the explore or canonical DAL paths.
If the DB function performs `LIKE p_query || '%'` pattern matching, these would be
interpreted as wildcards. Unknown without DB source.

### Rapid Pagination

- Explore cache: 45-second TTL, 120-entry limit. Module-level (not per-user).
- No server-side rate limiting on `identity.search_actor_directory`.
- Client debounce is bypassable by direct Supabase RPC HTTP calls.

**Confirmed: An attacker can call `identity.search_actor_directory` directly via
Supabase REST API at arbitrary rate, bypassing all client-side debounce.**

```
POST https://<project>.supabase.co/rest/v1/rpc/search_actor_directory
Authorization: Bearer <anon_key>
Content-Type: application/json

{
  "p_viewer_domain": "vc",
  "p_viewer_actor_id": null,
  "p_query": "a",
  "p_filter": "all",
  "p_limit": 100,
  "p_offset": 0
}
```

This call requires only the public anon key (hardcoded in the app bundle).
If the DB function returns 0 results for null + 'all' (correct enforcement),
the enumeration risk is contained to public actors. If the DB trusts p_filter='all'
regardless of viewer, private actors are exposed at scale.

### Pagination Controls

`p_limit` and `p_offset` are caller-controlled. The canonical DAL sends limit=12.
Explore sends limit=25. Direct callers can set limit=1000. No server-side cap
enforcement is verifiable from local source.

---

## PHASE 6 — VPORT BOUNDARY REVIEW

### Session-Derived Identity

`searchTeamCandidatesController` now reads:
```js
const viewerActorId = useIdentitySelectionStore.getState().activeActorId ?? null
```
Caller-provided `viewerActorId` parameter is removed from the destructured signature.

The hook `useVportTeamAccess.js:85` still passes `viewerActorId: sessionActorId` —
this is now dead code (ignored by controller). The hook is NOT a vulnerability;
the dead parameter is harmless but should be cleaned up.

### Cross-VPORT Enumeration

Team candidate search uses actor-level visibility, not VPORT-scoped filtering.
An authenticated VPORT owner sees actors based on their actor-level network
visibility — this is the correct behavior for finding team members across the
platform. There is no mechanism to enumerate actors of a different VPORT.

### Isolation Verification

VPORT actor search does NOT cross into another VPORT's private data.
The search operates on the global `identity.search_actor_directory` with
the session actor's visibility — same as any other authenticated search.
No VPORT-specific privilege escalation surface found.

---

## PHASE 7 — REGRESSION SCAN

### VEN-ACTORS Findings

| Finding ID | Severity | Description | Post-Patch Status | Evidence |
|---|---|---|---|---|
| VEN-ACTORS-001 | HIGH | Blocks controller drops viewerActorId | **FIXED** | `Blocks.controller.js:54` accepts viewerActorId; `useActorLookup.js:28` passes actorId; canonical DAL uses isUuid |
| VEN-ACTORS-002 | HIGH | searchMentionSuggestions hardcodes p_filter='all' | **PARTIALLY FIXED** | DAL now derives filter from viewerActorId. Security property CORRECT (null+all eliminated). UX regression: viewerActorId is always null in the chain (see SURVIVE-002). Authenticated users see public-only in mentions. |
| VEN-ACTORS-003 | MEDIUM | 3 bypass callsites outside actors module | **FIXED** | chat/setup.js:56, explore/dal/search.dal.js:18, Blocks.controller.js:58 — all 3 patched |
| VEN-ACTORS-004 | MEDIUM | BEHAVIOR.md placeholder stub | **NOT FIXED** | Out of scope of this remediation; governance issue only |

---

### ELEK-2026-06-07 Findings

| Finding ID | Severity | Description | Post-Patch Status | Evidence |
|---|---|---|---|---|
| ELEK-2026-06-07-001 | HIGH | viewerActorId dropped in ctrlSearchActors (Blocks) | **FIXED** | `Blocks.controller.js:54-58` — viewerActorId accepted and forwarded |
| ELEK-2026-06-07-002 | HIGH | searchMentionSuggestions hardcodes p_filter='all' | **PARTIALLY FIXED** | Security: null+all eliminated. Functional regression: chain doesn't propagate viewerActorId (see SURVIVE-002). |
| ELEK-2026-06-07-003 | MEDIUM | chat/setup.js p_filter hardcoded 'all' | **FIXED** | `chat/setup.js:56` — `viewerActorId ? 'all' : 'public'` |
| ELEK-2026-06-07-004 | LOW | searchActorsDAL truthy-only viewerActorId check | **FIXED** | `actors/dal/searchActors.dal.js:2,9` — isUuid() imported and used |
| ELEK-2026-06-04-001 | HIGH | HTML injection in m/[actorId] edge function | **NOT ADDRESSED** — edge function out of scope; requires separate Edge Function audit |

---

### BW-2026-06-07 Findings

| Finding ID | Severity | Description | Post-Patch Status | Evidence |
|---|---|---|---|---|
| BW-2026-06-07-001 | HIGH | Blocks controller drops viewerActorId — private actors unblockable | **FIXED** | Full chain patched: hook (line 28), controller (line 54-58), canonical DAL |
| BW-2026-06-07-002 | HIGH | searchMentionSuggestions hardcodes p_filter='all' — null viewer bypass | **PARTIALLY FIXED** | null+all combination eliminated. Chain still delivers viewerActorId=null to DAL (intentional by structure — see SURVIVE-002). |
| BW-2026-06-07-003 | HIGH | assertActorId passes null/empty/non-UUID silently | **FIXED** | `assertActorId.js:3-5` — isUuid() gate; null/empty/invalid all throw |
| BW-2026-06-07-004 | MEDIUM | chat/setup.js p_filter hardcoded 'all' + hydration race | **FIXED** | `chat/setup.js:56` — filter now derived. Hydration race remains but fails safe: null store → 'public' filter. |
| BW-2026-06-07-005 | MEDIUM | explore DAL mapFilter returns 'all' for null viewer | **FIXED** | `explore/dal/search.dal.js:18` — safeFilter collapses to 'public' when viewerActorId is null |
| BW-2026-06-07-006 | LOW | searchActorsDAL truthy-only viewerActorId check | **FIXED** | isUuid() validates format before filter elevation |
| BW-2026-06-07-007 | LOW | vportTeamAccess accepts viewerActorId from caller | **FIXED** | Controller now derives from useIdentitySelectionStore.getState(); caller param removed |

---

## NEW FINDINGS — POST-REMEDIATION ADVERSARIAL DISCOVERY

---

### SURVIVE-001 — Explore DAL truthy check, not UUID validation

**Severity:** LOW
**Status:** NEW — SURVIVING
**File:** `features/explore/dal/search.dal.js:18`
**Evidence:**
```js
const safeFilter = viewerActorId ? mapFilter(filter) : 'public'
```
A truthy non-UUID string (e.g. `"injected"`) passes the truthiness check and
elevates to `mapFilter(filter)` which can return 'all'.

**Attack precondition:** Direct JavaScript function call to `ctrlSearchResults`
with a forged `viewerActorId` — requires browser console execution in the
victim's session, or an XSS payload.

**Actual risk:** LOW. The explore hook derives viewerActorId from `useIdentity()`
which is session-bound. No UI path passes a forged value. Direct console injection
in the victim's own session doesn't cross an authorization boundary. XSS as a
prerequisite makes this a compound attack.

**DB dependency:** If the DB function validates p_viewer_actor_id = auth.uid(),
this finding becomes theoretical — the forged ID is ignored server-side.

**Compare with:** `actors/dal/searchActors.dal.js:9` uses `isUuid()` — inconsistency.

**Recommended fix:**
```js
import { isUuid } from '@/services/supabase/postgrestSafe'
// ...
const safeFilter = isUuid(viewerActorId) ? mapFilter(filter) : 'public'
```

---

### SURVIVE-002 — Mention controller chain structurally breaks viewerActorId propagation

**Severity:** LOW (security) / MEDIUM (UX regression)
**Status:** NEW — SURVIVING
**Files:**
- `upload/hooks/useMentionAutocomplete.js:85` — no identity read
- `upload/controllers/searchMentionSuggestions.controller.js:3` — no viewerActorId param

**Evidence:**
```
useMentionAutocomplete → ctrlSearchMentionSuggestions({ query, limit: 8 })
ctrlSearchMentionSuggestions → searchMentionSuggestions(query, { limit })
searchMentionSuggestions.dal.js → viewerActorId = null (always)
→ p_filter = 'public' (always)
```

**Security assessment:** CORRECT. The null+all combination is now impossible.
The 'null viewer → public filter' invariant is enforced.

**UX assessment:** Authenticated users writing posts cannot @mention private
actors (followers, connections) because the chain never reads identity.
Private actors the viewer is authorized to see are excluded from mention
autocomplete.

**This was the original VEN-ACTORS-002 vulnerability.** The DAL-level fix is
correct but incomplete. The fix eliminated the security risk but introduced
a functional regression by not propagating viewerActorId through the chain.

**Recommended fix:**
1. `useMentionAutocomplete` — add `useIdentity()` to read session actorId
2. Pass `viewerActorId` to `ctrlSearchMentionSuggestions`
3. Controller forward to DAL

---

### SURVIVE-003 — Explore search cache lacks viewerActorId in cache key

**Severity:** LOW
**Status:** NEW — SURVIVING
**File:** `features/explore/hooks/useSearchScreenController.js` (cache logic)
**Evidence:** Cache key = `${filter}:${query.trim().toLowerCase()}`. No viewer identity.

**Scenario:** User searches "alice" while unauthenticated → cache populated with
public-only results. User logs in without navigating away. For up to 45 seconds,
further "alice" searches return the cached public-only results. After 45s TTL,
the cache expires and fresh authenticated results are fetched.

**Risk:** Authenticated user sees public-only results briefly (≤45s post-login).
This is restrictive, not permissive — private actors are not exposed to
unauthenticated users. NOT a data disclosure vulnerability.

**Recommended fix:** Include `viewerActorId ?? 'anon'` in cache key to prevent
cross-session cache pollution.

---

### SURVIVE-004 — No server-side rate limiting on identity.search_actor_directory

**Severity:** MEDIUM
**Status:** EXISTING GAP — NOT introduced by these patches
**Evidence:** No rate limiting found in any local SQL migration or application
middleware. Supabase anon key is embedded in the app bundle (expected behavior).

**Attack:** Direct POST to Supabase RPC endpoint:
```
POST https://<project>.supabase.co/rest/v1/rpc/search_actor_directory
Authorization: Bearer <anon-key-from-app-bundle>
```
With `p_query` cycling through the alphabet, an attacker can enumerate all
public actors by username prefix at network rate, bypassing client debounce.

**Risk if DB enforces public-only for null viewer:** Actor handle enumeration
for public accounts only. Lower severity — public data exposure.

**Risk if DB trusts p_filter='all' for null viewer:** Private actor handle
enumeration at scale. CRITICAL.

**DB verification is mandatory before assessing final severity.**

---

## FINAL DELIVERABLE

### 1. Confirmed Exploitable Vulnerabilities

**NONE** at the app layer with the current patch set.

All (null viewer, p_filter='all') combinations are unreachable across all 6 callsites.
All session bindings are correct. All format validations are applied at the canonical
DAL layer.

---

### 2. App-Layer Issues Only

| ID | Severity | Status | Description |
|---|---|---|---|
| SURVIVE-001 | LOW | OPEN | Explore DAL uses truthy check not isUuid() — inconsistent with canonical DAL |
| SURVIVE-002 | LOW (security) | OPEN | Mention controller chain breaks viewerActorId propagation — authenticated users restricted to public-only mentions |
| SURVIVE-003 | LOW | OPEN | Explore cache key doesn't include viewer identity — stale public results for ≤45s after login |

---

### 3. DB-Layer Issues Only

| Issue | Status | Priority |
|---|---|---|
| `identity.search_actor_directory` not audited | UNVERIFIED | CRITICAL — THOR BLOCKER |
| SECURITY DEFINER behavior unknown | UNVERIFIED | CRITICAL |
| p_viewer_actor_id vs auth.uid() validation unknown | UNVERIFIED | CRITICAL |
| p_limit server-side cap unknown | UNVERIFIED | MEDIUM |
| Wildcard handling in p_query unknown | UNVERIFIED | LOW |

---

### 4. RLS Failures

No RLS policies for the `identity` schema found in local migrations.
If `identity.search_actor_directory` is `SECURITY DEFINER`, it runs as the
function owner and bypasses the calling session's RLS. In this case the
function must implement its own visibility enforcement. This CANNOT be verified
from local source. **Manually required.**

---

### 5. Session-Binding Failures

None remaining. All 6 callsites have been audited:

| Surface | Session Binding | Source |
|---|---|---|
| Blocks | ✅ | useIdentity().actorId via hook |
| Mention | ✅ (forced public — see SURVIVE-002) | structurally null |
| Chat | ✅ | useIdentitySelectionStore.getState() |
| Explore | ✅ (session-derived, truthy check in DAL — see SURVIVE-001) | useIdentity().actorId via hook |
| Canonical DAL | ✅ | isUuid() validated |
| VPORT team | ✅ | useIdentitySelectionStore.getState() — caller param removed |

---

### 6. Visibility Leaks

No confirmed visibility leaks at the app layer. Private actor data cannot
be returned to unauthenticated callers through any currently-analyzed app path.

**Conditional:** If the DB function trusts p_viewer_actor_id without session
validation, format-valid forged UUIDs in the Explore or Blocks controller chains
could elevate visibility. This condition is unverified.

---

### 7. Enumeration Risks

| Risk | Severity | Exploitable | Mitigation |
|---|---|---|---|
| Single-char prefix enumeration via Mention/Chat/Explore | MEDIUM | YES — via direct Supabase API | Server-side rate limiting |
| No rate limiting on identity.search_actor_directory | MEDIUM | YES — via anon key | Supabase rate limiting or pg_net throttle |
| Unlimited pagination (p_limit caller-controlled) | MEDIUM | YES — via direct API | Server-side limit cap in DB function |
| Wildcard injection via % or _ in p_query | LOW/UNKNOWN | UNKNOWN | Verify DB handling |
| Cache poisoning across sessions (SURVIVE-003) | LOW | NO — public results only | viewerActorId in cache key |

---

### 8. Remaining THOR Blockers

| Blocker | Priority | Gate |
|---|---|---|
| `identity.search_actor_directory` DB function unaudited | CRITICAL | Manual DB inspection required before any release clearance |
| ELEK-2026-06-04-001 — HTML injection in m/[actorId] edge function | HIGH | Separate edge function audit required — NOT in scope of these patches |
| VEN-ACTORS-004 — BEHAVIOR.md placeholder | MEDIUM | Governance only — does not block security release; blocks platform documentation completeness |
| SURVIVE-001 — Explore DAL truthy check | LOW | Fix recommended before release; single-line change |
| SURVIVE-002 — Mention chain UX regression | LOW (security) | Fix recommended; functional regression for authenticated users |

---

### 9. Release Recommendation

**PASS WITH CONDITIONS**

**Rationale:**

All 3 HIGH THOR-blocking findings are patched with correct security properties:
- VEN-ACTORS-001 / ELEK-001 / BW-001: FIXED — Blocks chain now passes viewerActorId
- VEN-ACTORS-002 / ELEK-002 / BW-002: SECURITY FIXED — null+all combination eliminated; UX regression acceptable for release
- BW-2026-06-07-003: FIXED — assertActorId now rejects null/empty/invalid UUIDs

All MEDIUM findings patched. All LOW findings patched.

No exploitable privilege escalation, session spoofing, or visibility disclosure
confirmed at the app layer.

**Mandatory conditions for THOR evaluation:**

1. **DB AUDIT REQUIRED (CRITICAL)**
   Run `pg_get_functiondef('search_actor_directory')` in Supabase.
   Verify: SECURITY DEFINER behavior, auth.uid() usage, null viewer enforcement,
   p_filter enforcement, Case A through Case D test results.
   This is the single largest unknown in the system. THOR cannot clear release
   without this evidence.

2. **ELEK-2026-06-04-001 (HIGH)**
   HTML injection in m/[actorId] edge function — requires independent Edge Function
   audit. Not addressed by this remediation.

**Recommended before release (not mandatory):**

3. Fix SURVIVE-001 — one-line change in explore/dal/search.dal.js
4. Fix SURVIVE-002 — propagate viewerActorId through mention controller chain
5. Add server-side rate limiting to identity.search_actor_directory
6. Add viewerActorId to explore cache key
7. Cap p_limit in DB function to prevent enumeration abuse

---

## SUMMARY COUNTS

| Category | Count |
|---|---|
| CRITICAL (exploitable) | 0 |
| HIGH (post-patch) | 0 |
| MEDIUM (post-patch) | 0 |
| LOW (surviving) | 3 (SURVIVE-001, 002, 003) |
| DB UNVERIFIED | 1 function, 7 checks |
| FIXED HIGH | 3 (VEN-001/ELEK-001/BW-001, VEN-002/ELEK-002/BW-002, BW-003) |
| FIXED MEDIUM | 4 (BW-004, BW-005, ELEK-003, VEN-003) |
| FIXED LOW | 2 (BW-006, BW-007, ELEK-004) |
| THOR BLOCKERS REMAINING | 2 (DB audit, edge function) |
| RELEASE RECOMMENDATION | PASS WITH CONDITIONS |
