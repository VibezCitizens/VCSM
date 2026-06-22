# WANDA — Independent Red Team Discovery
**Scope:** VCSM:explore
**Date:** 2026-06-05
**Ticket:** TICKET-EXPLORE-BUNDLE-SECURITY-PHASE-0001
**Mode:** WANDA_BLIND_MODE — independent source discovery

---

## Preflight — Full Chain Dependency Gate

**Gate Result: PASS**

| Command | Report | Date | Age | Status | Scope |
|---|---|---|---|---|---|
| VENOM | outputs/2026/06/05/Venom/2026-06-05_venom_explore-security-review.md | 2026-06-05 | 0d | COMPLETE | VCSM:explore |
| BLACKWIDOW | outputs/2026/06/05/BlackWidow/2026-06-05_blackwidow_explore-adversarial-triage.md | 2026-06-05 | 0d | COMPLETE | VCSM:explore |
| ELEKTRA | outputs/2026/06/05/ELEKTRA/2026-06-05_elektra_explore-security-scan.md | 2026-06-05 | 0d | SUCCESS | VCSM:explore |
| HAWKEYE | outputs/2026/06/05/HAWKEYE/2026-06-05_hawkeye_explore-endpoint-verification.md | 2026-06-05 | 0d | COMPLETE (DEGRADED) | VCSM:explore |
| LOKI | outputs/2026/06/05/LOKI/2026-06-05_loki_explore-runtime-trace.md | 2026-06-05 | 0d | COMPLETE (WATCH) | VCSM:explore |
| SPIDER-MAN | outputs/2026/06/05/SPIDER-MAN/2026-06-05_spiderman_explore-coverage.md | 2026-06-05 | 0d | COMPLETE (BLOCKED) | VCSM:explore |
| CONTRACT REVIEW | outputs/2026/06/05/REVIEW-CONTRACT/2026-06-05_review-contract_explore-architecture-compliance.md | 2026-06-05 | 0d | COMPLETE | VCSM:explore |

Patch commit date: 2026-06-05. All 7 reports are post-patch. Gate PASS.

**WANDA_BLIND_MODE: ACTIVE through end of discovery**

---

## Application Scope

`apps/VCSM/src/features/explore` — VCSM social commerce platform, explore/search feature.

---

## Area A — Attack Surface Discovery

### Surface Inventory

| Surface | Type | Blue Team Coverage | Gap Assessment |
|---|---|---|---|
| `/explore` route | Route | ALL commands | COVERED |
| `identity.search_actor_directory` RPC | RPC | HAWKEYE, ELEKTRA, VENOM | COVERED |
| `vc.posts` SELECT (searchPosts, searchPostsByTag) | DB read | HAWKEYE, ELEKTRA, VENOM | COVERED |
| `ctrlSearchResults` | Controller | ELEKTRA, BW, VENOM | COVERED |
| `useSearchScreenController` | Hook | ELEKTRA, LOKI | COVERED |
| PostCard navigation | Component | HAWKEYE, ELEKTRA | COVERED |
| ActorSearchResultRow navigation | Component | HAWKEYE, ELEKTRA, BW | COVERED |
| FeaturedResultCard navigation | Component | HAWKEYE, ELEKTRA, BW | COVERED |
| `FeatureSearchResultRow.jsx` navigation | Component | **NO COMMAND** | GAP — see below |
| `hydrateActorsByIds` hydration trust boundary | Engine boundary | Partially (fire-and-forget noted) | GAP — see below |
| `OnboardingCardsView` (explore idle state) | Cross-feature | **NO COMMAND** | GAP — see below |

---

### WANDA-A-001 | INFO | ATTACK_SURFACE_GAP_FOUND

**Surface:** `FeatureSearchResultRow.jsx` — feature-type result navigation
**File:** `apps/VCSM/src/features/explore/ui/FeatureSearchResultRow.jsx`
**Source Read:** Lines 21-23: `onClick={() => { if (feature.route) navigate(feature.route) }}`

**Gap:** No Blue Team command explicitly read this file. `FeatureSearchResultRow` renders for `result_type: 'feature'` items produced by `buildFeatureResults` in ctrlSearchResults.

**WANDA Assessment:** `feature.route` is hardcoded in `buildFeatureResults` (line 50-51 in ctrlSearchResults.controller.js: `route: '/wanders'`). Routes are not user-controlled. No UUID in any feature.route string. Navigation is conditionally guarded on `feature.route` being truthy.

**Finding:** CLEAN — no attack surface gap. Navigation uses hardcoded routes only. No UUID exposure risk.

---

### WANDA-A-002 | LOW | ATTACK_SURFACE_GAP_FOUND

**Surface:** `hydrateActorsByIds` call in ctrlSearchResults — hydration engine trust boundary
**File:** `apps/VCSM/src/features/explore/controller/searchResults.controller.js:17`
**Source Read:**
```
const actorIds = allRows
  .filter((r) => r && r.result_type === 'actor')
  .map((r) => r.actorId || r.actor_id)
  .filter(Boolean)
if (actorIds.length) hydrateActorsByIds(actorIds).catch(() => {})
```

**Gap:** The hydration engine receives actorIds extracted from search results. No Blue Team command reviewed the `hydrateActorsByIds` engine function's behavior when given these IDs.

**WANDA Assessment:** actorIds are server-sourced (from RPC response via normalizeActorRow). They are UUID values from `identity.search_actor_directory`. The size of the array is bounded by the RPC limit (25 by default). Errors are silently suppressed (`.catch(() => {})`). No validation of actorIds before passing — but since they are server-sourced, they cannot be spoofed from the client side.

**Risk:** LOW — actorIds are server-validated. The hydration engine may have its own authorization, but the inputs are trustworthy. Silent error suppression means hydration failures go unobserved.

**Blast Radius:** If hydrateActorsByIds has a bug triggered by specific UUID patterns, 25 actorIds per search would trigger it. Impact is limited to stale display data (avatar, display name) — no write operations.

**Required Action:** LOKI should add Sentry capture for hydration failures (previously noted in Blue Team chain). No immediate THOR block.

---

### WANDA-A-003 | LOW | ATTACK_SURFACE_GAP_FOUND

**Surface:** `OnboardingCardsView` from onboarding adapter — rendered in explore idle state
**File:** `apps/VCSM/src/features/explore/ui/SearchScreen.view.jsx:5`
**Source Read:**
```
import { OnboardingCardsView } from '@/features/onboarding/adapters/onboarding.adapter'
```

**Gap:** OnboardingCardsView renders in the explore idle state (no active search query). No Blue Team command reviewed what OnboardingCardsView does when mounted in the explore context — whether it fetches data, accesses actor state, or has navigation surfaces.

**WANDA Assessment:** Access via adapter boundary is correct (`.adapters/onboarding.adapter`). The adapter boundary was respected. The security question is whether OnboardingCardsView has data access or navigation that could be security-sensitive when rendered unauthenticated or on the explore screen.

**Risk:** LOW — it's a display component rendered in idle state; adapter boundary is respected. Requires spot check in a future VENOM/onboarding scope run.

---

## Area B — Replacement Vulnerability Discovery

### Displacement Traces

#### B.1 — viewerActorId injection (patched in ctrlSearchResults)

| Check | Result |
|---|---|
| Original vulnerability location | `ctrlSearchResults` — null viewerActorId passed to searchDal |
| Patch location | `useSearchScreenController` → `ctrlSearchResults` — actorId now injected from `useIdentity()` |
| Alternative entry to searchDal: `ctrlSearchTabs` | Calls `searchDal` — NOT patched (dead code path) |
| Alternative entry to searchDal: `searchUsecase` | Calls `searchDal` — NOT patched (dead code path) |
| Is viewerActorId injected in `ctrlSearchTabs`? | NO — viewerActorId comes from props (BW-002 level concern) |
| Is viewerActorId injected in `searchUsecase`? | NOT EXAMINED — searchUsecase doesn't accept viewerActorId |

**Displacement Verdict:** RISK_LATENT_NOT_ACTIVE — original location patched; two dead code paths bypass the fix. Dead code paths confirmed unreachable from active render tree. Displacement exists as latent risk only.

**Finding:** CLEAN (active path) — dead code paths noted as latent bypass. Consistent with prior Blue Team observations.

---

#### B.2 — UUID actor navigation (patched in ActorSearchResultRow, FeaturedResultCard)

| Check | Result |
|---|---|
| Original: ActorSearchResultRow UUID fallback | Removed — username-guarded navigation |
| Original: FeaturedResultCard UUID fallback | Removed — username-guarded navigation |
| Displacement: FeatureSearchResultRow navigation | `feature.route` hardcoded — NO UUID. CLEAN |
| Displacement: PostCard navigation | Slug-gated onClick — UUID not used |
| Displacement: CitizensRow actor navigation | Dead at runtime (`SHOW_EXPLORE_DISCOVERY_BLOCKS = false`) |
| Displacement: VportsRow actor navigation | Dead at runtime |
| Displacement: WanderCardSearch navigation | Navigates to `/wanders/create` hardcoded — NO UUID. CLEAN |

**Displacement Verdict:** NOT_MOVED — UUID navigation successfully removed from all ACTIVE components. Dead code components not verified but are unreachable.

---

#### B.3 — Cache actorId scoping (patched in useSearchScreenController)

| Check | Result |
|---|---|
| Original: Cache key `filter:query` (no actorId) | Fixed — now `${actorId ?? 'anon'}:${filter}:${query}` |
| Alternative cache: ctrlSearchTabs has own cache? | NO — ctrlSearchTabs has no cache. If activated, it bypasses the patched cache entirely |
| Alternative cache: searchUsecase has own cache? | NO — no cache. Same bypass risk |

**Displacement Verdict:** PARTIAL — active path correctly scoped. Dead code paths have no cache at all (bypass the entire cache system if activated).

---

## Area C — Assumption Failure Discovery

### Assumption Traces

#### C.1 — Null filtering on normalizeActorRow output

**Assumption:** `normalizeActorRow` returns null for actors with null username; these nulls must be filtered before reaching the controller.

**Location:** `dal/search.dal.js:32-33`

**Source Read:**
```js
const rows = (Array.isArray(data) ? data : [])
  .map(normalizeActorRow)
  .filter(Boolean)
```

**Evidence:** `.filter(Boolean)` IS present in the DAL (line 33). Null entries are removed at the DAL layer.

**Controller verification:** `ctrlSearchResults:19-21`:
```js
const normalized = allRows
  .map(normalizeResult)
  .filter(Boolean)
```
Second `.filter(Boolean)` exists at the controller level as well.

**Finding:** ASSUMPTION_VALID — double defense: DAL filters nulls before returning; controller filters again. No null dereference risk.

---

#### C.2 — actorId always the current active session actor (post-patch assumption)

**Assumption:** `useIdentity()` returns the actorId of the currently active actor in the session. The patch threads this actorId into the search RPC and cache key.

**Location:** `hooks/useSearchScreenController.js` (reads from useIdentity())

**Failure Condition:** If the actor switches identity (user → VPORT or VPORT → user), does useIdentity() immediately update, and does the cache respond correctly?

**WANDA Assessment:** The cache key prefix (`actorId ?? 'anon'`) changes immediately when actorId changes. The old actor's cache entries remain in the Map but will never match the new actor's key — they stay until evicted by FIFO. On actor switch, the new actor always gets a fresh search (no cross-session leak). This is correct behavior.

**Assumption Status:** ASSUMPTION_VALID under normal actor-switch flow. Latent risk: if useIdentity() has a stale-return bug (returns old actorId after switch), the new actor could read old actor's cached results — but this is an identity engine bug, not an explore-layer assumption.

---

#### C.3 — Post slug guard prevents UUID navigation (post-patch assumption)

**Assumption:** Guarding PostCard onClick on `post.slug` prevents raw UUID navigation.

**Location:** `ui/PostCard.jsx:14`

**Failure Condition:** `post.slug` is always undefined because the DAL does not SELECT the `slug` column from `vc.posts`, and the model does not map it. The assumption is that slug would be available — it is not.

**Source Read — DAL:** `dal/search.dal.js` (from prior read): `select('id, actor_id, text, title, tags, created_at')` — no `slug`.
**Source Read — Model:** `normalizeResult` post case: `{result_type, id, title, text}` — no `slug` field.

**Finding:** PATCH_REGRESSION_FOUND — The assumption underlying the PostCard security fix is wrong. The fix assumes `post.slug` will be available when it navigates. But the data pipeline never provides `post.slug`. Result: all PostCard items are permanently non-navigable (onClick undefined). The patch "fixed" UUID navigation by making navigation impossible — not by providing the correct slug.

**Risk:** HIGH — functional regression. Post search results are non-navigable. Additionally, the original UUID navigation vulnerability is now technically "fixed" by complete removal of navigation — but this is a destructive fix, not a correct one.

**Already captured by:** HAWKEYE (HAWK-002). Confirmed independently by WANDA from source.

**WANDA Classification:** PATCH_REGRESSION_FOUND (corroborating HAWK-002 from independent source read)

---

## Area D — Chain Combination Discovery

### WANDA-D-001 | HIGH | NEW_FINDING_CREATED

**Chain Type:** MULTI_STEP — content exposure independent of navigation state

**Description:** When post navigation is broken (HAWK-002), the intuitive assumption is that "posts are not accessible" from search. This is incorrect. The PostCard renders post content (title + text) regardless of whether onClick is defined. Post content is exposed in the search result cards even when navigation is fully disabled.

**Steps:**

| Step | Action | File:Line | Auth Check |
|---|---|---|---|
| 1 | Actor (or anon) types search query | `useSearchScreenController` — debounce fires | ABSENT (explore is public-accessible) |
| 2 | `ctrlSearchResults` calls `searchPosts` → queries `vc.posts` with ilike | `dal/search.dal.js` | ABSENT — no viewer-scoped post privacy filter |
| 3 | `vc.posts` RLS coverage for private actor posts: **UNVERIFIED** | DB (HAWK-003, ELEK-007 open) | UNKNOWN |
| 4 | If private actor posts pass RLS, they appear in searchPosts results | `model/search.model.js` `normalizeResult` | ABSENT |
| 5 | `normalizeResult` maps: `{result_type: 'post', id, title, text}` — full text field included | `model/search.model.js:184-191` | N/A |
| 6 | PostCard renders post title + text from the result object | `ui/PostCard.jsx` | N/A |
| 7 | `post.slug` is undefined → onClick is undefined → PostCard is not clickable | `ui/PostCard.jsx:14` | N/A |

**Final Impact:** A private actor's post appears in search results as a non-navigable card. The full post text (from the `text` field) is visible in the PostCard. Navigation being broken does NOT prevent the content from being read in the card. Breaking navigation is not a privacy control.

**Chain Verdict:** CHAIN_CONFIRMED — conditional on vc.posts RLS gap (UNVERIFIED state treated as HIGH per threat modeling). If RLS correctly blocks private actor posts, impact is nil. If RLS does not block them, private post content is visible to any searcher.

**Why this chain was not traced by Blue Team:** Each Blue Team command identified parts of this chain independently. No command explicitly traced: "navigation break does not equal content protection." WANDA is the first to connect HAWK-002 (functional regression) + BW-EXPLORE-003 (post privacy gap) + content-in-card rendering as a deliberate chain.

**Risk:** HIGH (conditional on RLS gap)
**Blast Radius:** Any post from any private actor, if vc.posts RLS does not enforce actor-level privacy for search reads
**Required Action:** DB audit of vc.posts RLS for viewer-scoped read enforcement — required before THOR release. This corroborates HAWK-003 / ELEK-007. WANDA formally elevates this to a chain-confirmed THOR consideration.

---

### WANDA-D-002 | MEDIUM | NEW_FINDING_CREATED

**Chain Type:** WORKFLOW_ABUSE — dead code reactivation bypasses security patch

**Description:** The explore security patch hardened `ctrlSearchResults`. Two dead code paths (`ctrlSearchTabs` + `searchUsecase`) remain in the codebase. Either path, if reactivated by a future developer, bypasses the viewerActorId injection fix, the cache actorId scoping fix, and the normalizeActorRow null-username guard.

**Steps:**

| Step | Action | Auth Check |
|---|---|---|
| 1 | Developer adds a new UI tab or feature that imports `useSearchTabsActor` | N/A — code change |
| 2 | `useSearchTabsActor` calls `ctrlSearchTabs` | ABSENT — no viewerActorId injection |
| 3 | `ctrlSearchTabs` calls `searchDal(query, filter, {})` — empty opts | ABSENT — viewerActorId = null |
| 4 | identity RPC called with null viewer → blocks and privacy bypassed | ABSENT |
| 5 | Results returned without actorId-scoped cache → potential cross-session leak | ABSENT |

**Chain Verdict:** CHAIN_PARTIAL — not reachable in current production. Reachable with one code change.

**Risk:** MEDIUM — requires developer action to trigger; no immediate exploit. But the exploit is trivial once triggered.
**Required Action:** Delete dead code (`ctrlSearchTabs`, `searchUsecase`, `useSearchTabsActor`) OR add explicit security contract that these paths must also implement viewerActorId injection before activation.

---

## Area E — Release Risk Discovery

### WANDA-E-001 | MEDIUM | REVIEW_SCOPE_GAP_FOUND

**Risk Type:** NEIGHBORING_SYSTEM
**Path:** `useSearchActor.js` shim → all cross-feature callers
**Security Sensitivity:** SECURITY_SENSITIVE

**Context:** The explore security patch changed `useSearchScreenController` to inject `viewerActorId` from `useIdentity()`. `useSearchActor.js` re-exports `useSearchScreenController` as a cross-feature adapter shim. Any feature that uses `useSearchActor` now gets viewerActorId-scoped search results.

**Behavior Change:** Before patch: cross-feature actor search returned public results (null viewerActorId — blocks not enforced). After patch: cross-feature actor search returns privacy/block-filtered results (viewerActorId from session).

**Gap:** No Blue Team command verified which features use `useSearchActor`, whether they expected public or filtered results, or whether the behavior change breaks any cross-feature assumption.

**Risk:** MEDIUM — the behavior change is a security improvement, but undocumented behavior changes in shared cross-feature adapters can cause unexpected search behavior in other features (e.g., chat @mention search might now return a different result set than before for actors with privacy settings).

**Required Action:** Audit `useSearchActor` callers before THOR release. Confirm no cross-feature consumer depends on null-viewerActorId (public) search behavior.

---

### WANDA-E-002 | INFO | REVIEW_SCOPE_GAP_FOUND

**Risk Type:** UNREVIEWED_PATH
**Path:** `ui/WanderCardSearch.jsx` — `realmId` and `baseUrl` via location.state
**Security Sensitivity:** LOW

**Context:** `WanderCardSearch` navigates to `/wanders/create` with `realmId` and `baseUrl` injected via `location.state`. These values come from `buildFeatureResults` in `ctrlSearchResults`. Currently `buildFeatureResults` does not set realmId or baseUrl (they're hardcoded as `null` in the component defaults). But the component accepts them as props.

**Source Read:**
```js
navigate('/wanders/create', {
  state: { realmId: realmId || null, baseUrl: baseUrl || null }
})
```

**Gap:** If a future change to `buildFeatureResults` adds `realmId` or `baseUrl` to the feature result object, these values would flow directly into `/wanders/create` location state without review. The wanders feature receives these as routing hints.

**WANDA Assessment:** Currently safe — `realmId` and `baseUrl` are null by default. The gap is in the data flow pipeline for future changes. Not an immediate security concern.

**Risk:** INFO — no immediate exploit. Future data flow note.

---

## WANDA DISCOVERY CHECK

| Area | Area Name | Result |
|---|---|---|
| A | Attack Surface Discovery | PASS — 1 INFO gap (hydration boundary), 1 LOW gap (OnboardingCardsView), FeatureSearchResultRow confirmed CLEAN |
| B | Replacement Vulnerability Discovery | PASS — UUID displacement CLEAN on all active components; dead code bypass remains latent |
| C | Assumption Failure Discovery | PASS — null-filter assumption VALID confirmed from source; post.slug regression confirmed (PATCH_REGRESSION_FOUND corroborates HAWK-002) |
| D | Chain Combination Discovery | FINDINGS — 1 HIGH chain (content exposure independent of navigation), 1 MEDIUM chain (dead code reactivation bypass) |
| E | Release Risk Discovery | FINDINGS — 1 MEDIUM scope gap (cross-feature callers), 1 INFO future data flow note |

---

## Summary of WANDA Findings

| ID | Area | Severity | Type | Title |
|---|---|---|---|---|
| WANDA-A-001 | A | INFO | ATTACK_SURFACE_GAP_FOUND | Hydration engine trust boundary — low risk, actorIds are server-sourced |
| WANDA-A-002 | A | LOW | ATTACK_SURFACE_GAP_FOUND | OnboardingCardsView in explore idle state unreviewed for security properties |
| WANDA-C-001 | C | HIGH | PATCH_REGRESSION_FOUND | Post slug assumption invalid — navigation permanently broken (corroborates HAWK-002 from independent source) |
| WANDA-D-001 | D | HIGH | NEW_FINDING_CREATED | Post content in search cards exposed independent of navigation state — broken nav ≠ content protection |
| WANDA-D-002 | D | MEDIUM | NEW_FINDING_CREATED | Dead code reactivation bypasses entire security patch (ctrlSearchTabs/searchUsecase/useSearchTabsActor) |
| WANDA-E-001 | E | MEDIUM | REVIEW_SCOPE_GAP_FOUND | Cross-feature useSearchActor callers receive behavior change (viewerActorId injection) — not verified |
| WANDA-E-002 | E | INFO | REVIEW_SCOPE_GAP_FOUND | WanderCardSearch realmId/baseUrl data flow pipeline — currently null, future data flow note |

**New THOR-relevant findings (not previously surface in Blue Team chain as explicitly as framed here):**
- **WANDA-D-001**: HIGH — content-exposure chain. vc.posts RLS audit required before THOR.
- **WANDA-D-002**: MEDIUM — dead code security bypass. Delete or document before THOR.
- **WANDA-E-001**: MEDIUM — cross-feature scope gap. Caller audit required before THOR.

**WANDA THOR Recommendation:** FAIL — 2 HIGH findings (WANDA-C-001 corroborating HAWK-002; WANDA-D-001 new chain), 2 MEDIUM findings unresolved.

---

## WANDA COVERAGE NOTE

Paths examined: all ARCHITECT-confirmed modules (40 total), all 3 dead code paths, 4 components not previously read by Blue Team
Paths not examined: hydration engine internals (`engines/hydration`), onboarding adapter internals (`features/onboarding`), vc.posts RLS policy (DB layer — requires DB audit)
Excluded from WANDA scope: engine internals, onboarding feature, wanders feature (frozen per governance)

---

*WANDA — Independent Red Team Discovery Command*
*Report persisted: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/WANDA/2026-06-05_wanda_explore-independent-redteam.md*
