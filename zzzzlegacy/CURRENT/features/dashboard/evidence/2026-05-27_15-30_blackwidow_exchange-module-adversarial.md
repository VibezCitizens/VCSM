# BLACKWIDOW Runtime Adversarial Report — Exchange Module

**Date:** 2026-05-27
**Scope:** VCSM
**Reviewer:** BLACKWIDOW
**Environment:** Repository-local adversarial simulation (read-only)
**Governance Status:** DRAFT
**VENOM Cross-Reference:** `2026-05-27_15-00_venom_exchange-module-reverification.md`
**Branch:** `vport-booking-feed-security-updates`

---

## Boundary Contract

Loaded: `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`
Application Scope: **VCSM**
No cross-root operations performed. All simulation is repository-local.

---

## Files Traced for Adversarial Simulation

| File | Role |
|---|---|
| `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx` | Entry point — UI gate + hook mounting |
| `apps/VCSM/src/features/profiles/kinds/vport/hooks/exchange/usePublishExchangeRatePost.js` | Publish hook — closes over caller-supplied actorId |
| `apps/VCSM/src/features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller.js` | Publish controller — **no identity binding** |
| `apps/VCSM/src/features/upload/adapters/posts.adapter.js` | System post adapter — checks auth only, not ownership |
| `apps/VCSM/src/features/upload/dal/insertPost.dal.js` | DAL — raw insert, no gate |
| `apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js` | Rate upsert controller — ownership-gated (FIXED) |
| `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js` | Rate upsert DAL — no validation |
| `apps/VCSM/src/features/profiles/kinds/vport/dal/exchange/vportExchangeRatePost.read.dal.js` | Dedup DAL — app-layer only, windowMs overridable |
| **CARNAGE doc:** `2026-05-22_10-00_carnage_vc-posts-insert-ownership-rls.md` | DB-layer context — `vc.posts` INSERT policy weakness documented |
| **CARNAGE doc:** `2026-05-22_carnage_vc-posts-insert-rls-cerebro-verification.md` | Migration 20260522010000 — status: PENDING at time of writing |

---

## Attack Surface Summary

Three primary attack surfaces:

1. **Publish controller with no identity binding** — hook is mounted unconditionally before the ownership gate; controller accepts any actorId from caller
2. **Rate data integrity** — no controller-layer validation of buyRate, sellRate, or currency codes; client-only normalization can be bypassed
3. **DB-layer backstop ambiguity** — `vc.posts` INSERT RLS migration (20260522010000) status is UNVERIFIED; if not applied, the publish bypass becomes CONFIRMED CRITICAL

---

## Simulated Threat Scenarios

### Attack 1 — Hook-Mounted Publish Bypass (VE-2705-01)

**Hypothesis:** The ownership gate in the screen blocks the form UI, but the publish hook is mounted unconditionally with victim's actorId. Can the hook callback be invoked to publish as the victim?

**Execution trace:**

```
1. Attacker is Actor A, authenticated via Supabase session.
2. Attacker knows Actor B's exchange VPORT actorId (from public profile URL, QR code, or feed).
3. Attacker navigates to /actor/{actorB}/dashboard/exchange
4. Screen evaluates:
   const actorId = params?.actorId        → actorB ← VICTIM
   const viewerActorId = identity?.actorId → actorA ← ATTACKER
   useVportOwnership(actorA, actorB)       → isOwner = false
5. Screen renders: "You can only manage exchange rates for your own vport."
6. BUT — the hooks are mounted BEFORE the early return:
   const m = useUpsertVportRate({ actorId: actorB })          ← MOUNTED
   const { publishExchangeRatePost } = usePublishExchangeRatePost({ actorId: actorB })  ← MOUNTED
7. usePublishExchangeRatePost creates a callback:
   publishExchangeRatePost = async ({ baseCurrency, quoteCurrency, buyRate, sellRate }) => {
     return publishExchangeRateUpdateAsPostController({
       actorId: actorB,    ← VICTIM's ID, baked into closure
       baseCurrency,
       quoteCurrency,
       buyRate,
       sellRate,
     });
   }
8. Via React DevTools Profiler → fiber inspection of the mounted hook:
   attacker invokes: publishExchangeRatePost({ baseCurrency: "USD", quoteCurrency: "MXN", buyRate: 100, sellRate: 99 })
9. publishExchangeRateUpdateAsPostController receives actorId = actorB.
10. NO identity check. NO actor_owners lookup. Proceeds:
    → hasRecentExchangeRatePostDAL({ actorId: actorB }) → false (no recent post)
    → resolveVportExchangeNameDAL(actorB) → "Downtown FX Exchange" ← victim's name
    → createSystemPost({ actorId: actorB, text: "Exchange rates updated at Downtown FX Exchange...", ... })
11. createSystemPost:
    → supabase.auth.getUser() → returns Actor A's session (attacker is authenticated) ← PASSES
    → insertPost({ actor_id: actorB, user_id: actorA_uid, ... })
12. insertPost inserts into vc.posts with actor_id = actorB, user_id = actorA_uid.
```

**DB gate:** `posts_insert_actor_owner` policy — documented by CARNAGE (2026-05-22) as checking only `user_id = auth.uid()`, NOT verifying actor ownership via `actor_owners`. Migration 20260522010000 proposes the fix but **status is UNVERIFIED**.

**Result if migration NOT applied:** Post inserted. Victim's feed shows a false rate update. **BYPASSED.**
**Result if migration APPLIED:** RLS rejects: `user_id = actorA_uid` does NOT match `actor_id = actorB` in `actor_owners`. **BLOCKED at DB layer.**

---

### Attack 2 — Zero/Negative Rate Injection (VE-2705-02)

**Hypothesis:** A legitimate owner can submit zero or negative exchange rates through the form. Does the controller validate?

**Execution trace:**

```
1. Attacker is the legitimate owner of an exchange VPORT.
2. Via form: baseCurrency = "USD", quoteCurrency = "MXN", buyRate = "0", sellRate = "-500"
3. Screen: toNumOrNull("0") → 0, toNumOrNull("-500") → -500
4. m.upsert({ actorId, rateType: "fx", baseCurrency: "USD", quoteCurrency: "MXN", buyRate: "0", sellRate: "-500" })
5. useUpsertVportRate → upsertVportRateController({
     identityActorId: ownerActorId,
     actorId: ownerActorId,
     buyRate: "0",
     sellRate: "-500"
   })
6. assertActorOwnsVportActorController → PASSES (owner is calling)
7. upsertVportRateDal({ buyRate: "0", sellRate: "-500", ... })
   → vport.rates.buy_rate = 0, sell_rate = -500 ← STORED
8. If shareToFeed = true:
   publishExchangeRatePost({ buyRate: "0", sellRate: "-500" })
   → buildPostText: "Buy: 0.0000 · Sell: -500.0000" ← PUBLISHED TO FEED
```

**Result:** **BYPASSED** — zero and negative rates are stored in `vport.rates` and broadcast to the public feed as authoritative exchange rates. No validation prevents this.

---

### Attack 3 — Arbitrary Currency Code Storage (VE-2705-02)

**Hypothesis:** Can an owner store garbage/arbitrary strings as currency codes?

**Execution trace:**

```
1. Attacker owns an exchange VPORT.
2. Sets baseCurrency = "FAKE", quoteCurrency = "GARBAGE" in the form.
3. Screen normalizeCurrencyCode("fake") → "FAKE"  (valid after normalization)
4. Controller receives baseCurrency = "FAKE", quoteCurrency = "GARBAGE"
5. No ISO 4217 check in controller or DAL.
6. vport.rates: base_currency = "FAKE", quote_currency = "GARBAGE" ← STORED
7. If shareToFeed: post text = "Exchange rates updated...\nFAKE/GARBAGE — Buy: 1.0000 · Sell: 2.0000"
   ← appears on public feed
8. VportRatesView renders: header shows "FAKE" / "GARBAGE" to all public profile visitors.
```

**Result:** **BYPASSED** — arbitrary strings stored and rendered publicly. Not an XSS vector (React text rendering), but a content integrity failure — misleading currency pair labels on a public financial profile.

---

### Attack 4 — Dedup Race Condition (VE-2705-04)

**Hypothesis:** Two simultaneous publish calls race past the dedup check, creating duplicate feed posts.

**Execution trace:**

```
1. Owner triggers two simultaneous publish calls:
   Promise.all([
     publishExchangeRatePost({ baseCurrency: "USD", quoteCurrency: "MXN", buyRate: 1, sellRate: 2 }),
     publishExchangeRatePost({ baseCurrency: "USD", quoteCurrency: "MXN", buyRate: 1, sellRate: 2 }),
   ])
2. Call A: hasRecentExchangeRatePostDAL → queries vc.posts → 0 recent posts → false
3. Call B: hasRecentExchangeRatePostDAL → queries vc.posts → 0 recent posts → false
   (neither has inserted yet — both read before either writes)
4. Call A: createSystemPost → insertPost → post A created
5. Call B: createSystemPost → insertPost → post B created
6. Two "Exchange rates updated" posts appear on the feed for the same VPORT.
```

**Result:** **BYPASSED** — dedup is TOCTOU-vulnerable. Race requires concurrent execution but is reproducible under double-tap or network retry conditions.

---

### Attack 5 — windowMs Override to Disable Dedup (VE-2705-04)

**Hypothesis:** The `windowMs` parameter in `hasRecentExchangeRatePostDAL` is a caller-controlled override. Can it be used to collapse the dedup window?

**Execution trace:**

```
1. Direct call to hasRecentExchangeRatePostDAL({ actorId, windowMs: 0 })
2. since = new Date(Date.now() - 0).toISOString() → now
3. Query: created_at >= [now] → will never match any existing post → returns false
4. Dedup check is now effectively disabled.
5. Any number of posts can be created in rapid succession.
```

**Note:** This requires calling the DAL directly — not currently possible via the screen UI. The hook does not expose `windowMs`. This is a code-path-only risk currently, but the exported function signature allows future callers to abuse it.

**Result:** **BYPASSED** (requires direct DAL invocation) — MEDIUM risk currently, HIGH risk if the DAL is ever exposed through a hook parameter.

---

### Attack 6 — Unauthenticated Identity Publish Attempt

**Hypothesis:** If identity is null, can the publish hook still fire?

**Execution trace:**

```
1. User navigates to exchange screen while unauthenticated.
2. Screen: if (!identity) → "Sign in required." — early return.
3. Hooks ARE mounted (before the early return):
   usePublishExchangeRatePost({ actorId }) → callback created
4. Attacker invokes publishExchangeRatePost(...) from DevTools.
5. publishExchangeRateUpdateAsPostController({ actorId, ... }) → no identity check.
6. createSystemPost: supabase.auth.getUser() → { user: null }
7. createSystemPost throws: "createSystemPost: not authenticated"
```

**Result:** **BLOCKED** — `createSystemPost` correctly rejects unauthenticated callers. Session authentication is the backstop here.

---

### Attack 7 — actorId URL Manipulation + Upsert Path

**Hypothesis:** Navigate to victim's exchange VPORT and attempt a rate upsert.

**Execution trace:**

```
1. Attacker (Actor A) navigates to /actor/{actorB}/dashboard/exchange.
2. isOwner = false → form not rendered → "not owner" message shown.
3. Attacker accesses m.upsert callback from React DevTools.
4. m.upsert({ actorId: actorB, baseCurrency: "USD", quoteCurrency: "MXN", buyRate: 1, sellRate: 2 })
5. useUpsertVportRate → upsertVportRateController({
     identityActorId: actorA,  ← attacker's session identity (correctly captured from useIdentity())
     actorId: actorB,          ← victim
   })
6. assertActorOwnsVportActorController({ requestActorId: actorA, targetActorId: actorB })
   → queries actor_owners: is Actor A an owner of Actor B? → NO → THROWS: "ownership check failed"
7. DAL is never reached. Rate is not written.
```

**Result:** **BLOCKED** — the upsert path is correctly protected by `assertActorOwnsVportActorController`.

---

### Attack 8 — createSystemPost Called Directly Across Features (Cross-Feature Abuse)

**Hypothesis:** Can any feature import `createSystemPost` and publish as any actor?

**Execution trace:**

```
1. Any feature imports:
   import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
2. Calls:
   createSystemPost({ actorId: "victim-actor-uuid", text: "Malicious post", post_type: "any_type", realm_id: "..." })
3. Adapter: actorId present ✓, text present ✓, post_type present ✓, realm_id present ✓
4. supabase.auth.getUser() → authenticated user ← PASSES
5. insertPost({ actor_id: "victim-actor-uuid", user_id: attacker_uid, ... })
6. Same as Attack 1 — vc.posts INSERT RLS is the sole backstop.
```

**Result:** **BYPASSED** if `vc.posts` INSERT RLS doesn't check actor ownership. The `createSystemPost` adapter has no ownership gate — it is callable by any authenticated caller with any actorId. This is a systemic platform risk, not limited to the Exchange module.

---

## Ownership Bypass Results

```
OWNERSHIP BYPASS ATTEMPT — A1 (Publish Path)
Target: publishExchangeRateUpdateAsPostController
Attack vector: Mount hook on victim's exchange dashboard; invoke from React DevTools fiber
Result: PARTIAL (UI gate holds; controller gate absent; DB gate UNVERIFIED)
Evidence: Controller accepts actorId with no assertActorOwnsVportActorController call; createSystemPost reaches insertPost with victim actorId
Controller gate: ABSENT
Severity: HIGH (CRITICAL if vc.posts INSERT RLS migration unverified/not applied)

OWNERSHIP BYPASS ATTEMPT — A7 (Upsert Path)
Target: upsertVportRateController
Attack vector: DevTools access to m.upsert with victim actorId
Result: BLOCKED
Evidence: assertActorOwnsVportActorController correctly verifies requestActorId vs targetActorId
Controller gate: PRESENT
Severity: N/A — BLOCKED
```

---

## Session Mutation Results

```
SESSION MUTATION ATTEMPT — A6 (Unauthenticated Publish)
Target: publishExchangeRateUpdateAsPostController → createSystemPost
Attack vector: Call publish callback while unauthenticated
Result: BLOCKED
Evidence: createSystemPost calls supabase.auth.getUser() and throws on null user
Session binding: ENFORCED (at createSystemPost adapter layer only — not at controller layer)
Severity: N/A — BLOCKED
```

---

## Runtime Abuse Results

```
RUNTIME ABUSE ATTEMPT — A2 (Zero Rate)
Target: upsertVportRateController + vport.rates
Actor role used: Authenticated VPORT Owner
Expected access: ALLOWED (owner) — but rate values should be validated
Result: ALLOWED with invalid data — buyRate = 0, sellRate = -500 stored
Evidence: No validation at controller or DAL layer; toNumOrNull(0) → 0 (passes)
Privilege gate: N/A (owner is the attacker; data integrity gate: ABSENT)
Severity: HIGH (financial data integrity)

RUNTIME ABUSE ATTEMPT — A3 (Arbitrary Currency Code)
Target: upsertVportRateController + vport.rates
Actor role used: Authenticated VPORT Owner
Expected access: ALLOWED (owner) — but currency must be ISO 4217
Result: ALLOWED with invalid data — "FAKE"/"GARBAGE" stored
Evidence: No ISO 4217 validation at controller layer
Privilege gate: N/A (owner is the attacker; data integrity gate: ABSENT)
Severity: MEDIUM (content integrity, public-facing)
```

---

## RLS Verification Results

```
RLS VERIFICATION ATTEMPT — vc.posts INSERT (A1, A8)
Table / View / RPC: vc.posts (INSERT)
Attack vector: insertPost({ actor_id: victimActorId, user_id: attackerUid })
RLS status: UNVERIFIED — migration 20260522010000 replaces weak auth-only policy with actor_owners JOIN
Current state per CARNAGE docs: posts_insert_actor_owner checks user_id = auth.uid() only (no actor ownership)
Result: BYPASSED if migration not applied; BLOCKED if migration applied
Evidence: CARNAGE 2026-05-22_10-00 explicitly documents: "Any authenticated user who knows another actor's UUID can create posts [...] bypassing all client-side ownership checks"
Severity: CRITICAL if unverified; HIGH if verified
```

---

## Viewer Context Fuzz Results

```
VIEWER CONTEXT FUZZ ATTEMPT — Null actorId hook
Target: usePublishExchangeRatePost({ actorId: null })
Injected context: actorId = null
Expected result: Early return / guard
Actual result: Hook guard at line 7 → "if (!actorId) return { published: false, reason: 'no_actor' }"
Context validation: ENFORCED (hook-level null guard)
Severity: N/A — BLOCKED

VIEWER CONTEXT FUZZ ATTEMPT — stale actorId in URL
Target: params.actorId resolved at component mount
Injected context: actorId from URL before identity loads
Expected result: Skeleton shown (loading gate)
Actual result: identityLoading guard catches this — skeleton rendered, no action possible
Context validation: ENFORCED (loading gate in screen)
Severity: N/A — BLOCKED
```

---

## Mutation Replay Results

```
MUTATION REPLAY ATTEMPT — Dedup Race Condition (A4)
Target resource: vc.posts via publishExchangeRateUpdateAsPostController
Resource state at time of replay: No recent post exists
Result: APPLIED — two posts created via concurrent calls racing the hasRecentExchangeRatePostDAL check
Evidence: TOCTOU pattern — both calls execute the check before either inserts
State check: PRESENT but TOCTOU-vulnerable
Severity: MEDIUM

MUTATION REPLAY ATTEMPT — windowMs=0 dedup bypass (A5)
Target resource: hasRecentExchangeRatePostDAL
Resource state: N/A
Result: BYPASSED (requires direct DAL call)
Evidence: hasRecentExchangeRatePostDAL({ actorId, windowMs: 0 }) collapses window to now
State check: ABSENT (no minimum floor on windowMs)
Severity: LOW (current code path doesn't expose this)
```

---

## Cross-Feature Abuse Results

```
CROSS-FEATURE ABUSE ATTEMPT — createSystemPost (A8)
Source feature: Any feature in the app
Target feature internal: @/features/upload/adapters/posts.adapter → insertPost.dal
Attack vector: Import createSystemPost; call with victim actorId; authenticate session as own actor
Result: BYPASSED (if vc.posts INSERT RLS weak) / BLOCKED (if migration applied)
Evidence: Adapter only checks authentication, not ownership; no actorId→user binding in adapter
Adapter isolation: WEAK — createSystemPost is a shared public adapter with no ownership gate
Severity: HIGH (systemic — affects all 8 VPORT publish controllers)
```

---

## URL Surface Results

```
URL SURFACE TEST — Exchange Dashboard Route
Route / Link: /actor/:actorId/dashboard/exchange
UUID exposure: PRESENT — actorId is used as route param
Slug enforcement: MISSING — actorId is a UUID, not a human-readable slug
Severity: LOW (consistent with current platform-wide pattern; the route requires authentication
           and ownership to be useful; actorId is already public via profile URLs)
Note: No new exposure specific to Exchange module beyond existing platform pattern.
```

---

## Successful Exploit Chains

### EC-01 — Publish Bypass (PARTIAL/CONFIRMED conditional on RLS state)

**Status:** CONFIRMED if `vc.posts` INSERT RLS migration 20260522010000 NOT applied; PARTIAL if applied.

```
Exploit Chain Type: Single-step injection + UI gate bypass
Chain:
  Navigate to victim's exchange dashboard URL
  → Hook mounted with victim actorId (unconditional)
  → React DevTools: invoke publishExchangeRatePost callback from fiber
  → publishExchangeRateUpdateAsPostController: no identity check
  → createSystemPost: authenticates caller only (not actor ownership)
  → insertPost: inserts with victim actor_id
  → vc.posts INSERT RLS: [UNVERIFIED]
  
If RLS check is auth-only: POST INSERTED as victim ← CRITICAL
If RLS checks actor_owners: POST BLOCKED at DB ← PARTIAL
```

**Blast Radius:** Feed-wide — false exchange rate update post attributed to victim VPORT

---

### EC-02 — Zero/Negative Rate Storage (BYPASSED)

**Status:** CONFIRMED. No defense holds.

```
Exploit Chain Type: Injection (invalid financial data accepted)
Chain:
  Owner submits buyRate = 0 via form
  → toNumOrNull: 0 is finite → passes
  → Controller: no validation → passes to DAL
  → DAL: upserts buy_rate = 0
  → vport.rates: stores 0
  → If shareToFeed: feed post broadcast with "Buy: 0.0000"
```

**Blast Radius:** Single VPORT profile (public display), feed-wide if shareToFeed enabled

---

### EC-03 — Arbitrary Currency Code (BYPASSED)

**Status:** CONFIRMED.

```
Exploit Chain Type: Injection (unvalidated enumerated field)
Chain:
  Owner submits baseCurrency = "FAKE"
  → normalizeCurrencyCode: uppercases, trims → "FAKE" (no ISO check)
  → Controller: passes directly
  → DAL: stores base_currency = "FAKE"
  → VportRatesView: renders "FAKE" publicly on VPORT profile
  → Feed post: "FAKE/GARBAGE" appears in exchange_rate_update post
```

---

### EC-04 — Dedup Race Condition (BYPASSED)

**Status:** CONFIRMED under concurrent execution.

```
Exploit Chain Type: Timing-dependent exploit (TOCTOU)
Chain:
  Two simultaneous publishExchangeRatePost calls
  → Both read hasRecentExchangeRatePostDAL before either writes
  → Both see: 0 recent posts → proceed
  → Both createSystemPost → two posts inserted
```

---

## Failed Exploit Chains (Defenses That Held)

```
FC-01 — Unauthenticated publish attempt
Defense: createSystemPost checks supabase.auth.getUser() → null → throws
Status: BLOCKED

FC-02 — Cross-actor upsert via m.upsert
Defense: assertActorOwnsVportActorController in upsertVportRateController
Status: BLOCKED

FC-03 — Null actorId publish
Defense: Hook guard in usePublishExchangeRatePost returns { published: false, reason: "no_actor" }
Status: BLOCKED

FC-04 — Pre-auth form rendering (timing)
Defense: identityLoading + ownershipLoading gates render skeleton during load
Status: BLOCKED
```

---

## BLACKWIDOW FINDINGS

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-2705-01

- **Finding ID:** BW-2705-01
- **Scenario:** Publish Controller Hook Mounting Bypass
- **Target:** `publishExchangeRateUpdateAsPostController` + `usePublishExchangeRatePost`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Feed Engine, Supabase Table (vc.posts)
- **Attack Vector:** React DevTools fiber inspection of mounted hook on victim's exchange dashboard page; callback invocation bypasses UI ownership gate
- **Exploit Chain Type:** Single-step injection + UI gate bypass
- **Governance Status:** DRAFT
- **Result:** PARTIAL (UI gate holds; controller gate absent; DB gate **UNVERIFIED** — converts to CONFIRMED CRITICAL if vc.posts INSERT RLS migration not applied)
- **Evidence:**
  - Hook `usePublishExchangeRatePost({ actorId: victimActorId })` is mounted unconditionally at screen render, before the `!isOwner` early return
  - Controller has zero identity binding — no `identityActorId` param, no `assertActorOwnsVportActorController` call
  - `createSystemPost` adapter checks auth session only (`supabase.auth.getUser()`), not actor ownership
  - CARNAGE 2026-05-22: `posts_insert_actor_owner` RLS policy checks `user_id = auth.uid()` only — no `actor_owners` join
  - Migration 20260522010000 to fix RLS: status PENDING at 2026-05-22; current status UNVERIFIED
- **Defense Gate:** ABSENT at controller; ABSENT at adapter; UNVERIFIED at DB (RLS)
- **Blast Radius:** Feed-wide (false posts attributed to victim exchange VPORT appear in public feed and all subscriber feeds)
- **Severity:** HIGH (CRITICAL if RLS migration unverified)
- **VENOM Finding Cross-Reference:** VE-2705-01 (VENOM 2026-05-27)
- **Recommended Fix:**
  1. Add `identityActorId` to `publishExchangeRateUpdateAsPostController` and call `assertActorOwnsVportActorController`
  2. Update `usePublishExchangeRatePost` to read and pass `identity.actorId`
  3. Verify migration 20260522010000 is applied to all environments
  4. Verify `vc.posts` INSERT policy uses `actor_owners` JOIN (not auth-only)
- **Layer to Fix:** Controller (P1), DB/RLS verification (P1)
- **Required Follow-up Command:** ELEKTRA (patch trace), DB (verify vc.posts INSERT RLS), THOR (release gate)

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-2705-02

- **Finding ID:** BW-2705-02
- **Scenario:** Zero/Negative Rate Injection
- **Target:** `upsertVportRateController` → `upsertVportRateDal` → `vport.rates`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table (vport.rates)
- **Attack Vector:** Legitimate VPORT owner submits `buyRate = 0` or `sellRate = -500` via exchange form; client-side `toNumOrNull` passes these as valid finite numbers
- **Exploit Chain Type:** Injection exploit (invalid financial data accepted)
- **Governance Status:** DRAFT
- **Result:** BYPASSED — confirmed via code trace
- **Evidence:**
  - `toNumOrNull(0)` → 0 (Number.isFinite(0) = true); `toNumOrNull(-500)` → -500 (Number.isFinite(-500) = true)
  - Controller passes these directly to DAL with no range check
  - `vport.rates.buy_rate = 0, sell_rate = -500` stored and displayed publicly
  - If `shareToFeed = true`: feed post text contains "Buy: 0.0000 · Sell: -500.0000"
  - Gas VPORT has `minPrice`, `maxPrice`, `maxDeltaPct` sanity guards; Exchange VPORT has none
- **Defense Gate:** ABSENT (controller), ABSENT (DAL), UNKNOWN (vport.rates CHECK constraint not inspected)
- **Blast Radius:** Single VPORT profile (financial data corruption); feed-wide if shareToFeed enabled
- **Severity:** HIGH
- **VENOM Finding Cross-Reference:** VE-2705-02 (VENOM 2026-05-27)
- **Recommended Fix:**
  1. Controller: reject `buyRate <= 0` or `sellRate <= 0` with a typed error
  2. Controller: validate `baseCurrency` and `quoteCurrency` against an ISO 4217 allow-list
  3. DB: add CHECK constraint on `vport.rates (buy_rate > 0, sell_rate > 0)` for defense-in-depth
- **Layer to Fix:** Controller (P1), DB/RLS (P2)
- **Required Follow-up Command:** Wolverine (fix), Carnage (DB constraint proposal)

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-2705-03

- **Finding ID:** BW-2705-03
- **Scenario:** Arbitrary Currency Code Storage and Feed Broadcast
- **Target:** `upsertVportRateController` → `buildPostText` → `vc.posts.text`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table (vport.rates, vc.posts)
- **Attack Vector:** Owner submits `baseCurrency = "FAKE"` / `quoteCurrency = "GARBAGE"` via form; screen normalization does not validate against ISO 4217
- **Exploit Chain Type:** Injection exploit (unvalidated enumerated field)
- **Governance Status:** DRAFT
- **Result:** BYPASSED — confirmed via code trace
- **Evidence:**
  - `normalizeCurrencyCode("fake")` → `"FAKE"` (no allow-list check)
  - Controller passes directly to DAL: `base_currency = "FAKE"` stored in `vport.rates`
  - `buildPostText` constructs: `"FAKE/GARBAGE — Buy: 1.0000 · Sell: 2.0000"` — published to `vc.posts.text`
  - Rendered publicly on VPORT profile and feed
- **Defense Gate:** ABSENT at controller and DAL; DB column type (varchar) accepts arbitrary strings
- **Blast Radius:** Single VPORT profile (misleading rate label); feed-wide (broadcast post with garbage currency pair)
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VE-2705-02 (currency code component)
- **Recommended Fix:** Add ISO 4217 allow-list validation in controller before DAL call
- **Layer to Fix:** Controller
- **Required Follow-up Command:** Wolverine

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-2705-04

- **Finding ID:** BW-2705-04
- **Scenario:** Dedup Race Condition — Concurrent Publish Bypass
- **Target:** `hasRecentExchangeRatePostDAL` + `publishExchangeRateUpdateAsPostController`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Feed Engine
- **Attack Vector:** Owner triggers two simultaneous `publishExchangeRatePost` calls (Promise.all, double-tap, network retry); both pass dedup check before either inserts
- **Exploit Chain Type:** Timing-dependent exploit (TOCTOU)
- **Governance Status:** DRAFT
- **Result:** BYPASSED under concurrent execution
- **Evidence:**
  - `hasRecentExchangeRatePostDAL` queries `vc.posts` for recent posts → reads 0 → both calls proceed
  - `createSystemPost` → `insertPost` → two rows inserted into `vc.posts`
  - No DB-level unique constraint or serialization prevents concurrent identical inserts
- **Defense Gate:** ABSENT (no lock, no serializable transaction, no unique index on post dedup)
- **Blast Radius:** Feed-wide (duplicate exchange rate posts; spam risk)
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VE-2705-04
- **Recommended Fix:**
  1. Minimum: UI debounce on the submit action (already has `m.isLoading` guard — extend to publish)
  2. Better: DB-level partial index to enforce dedup window
  3. Best: Server-side (Edge Function) serialization for system post creation
- **Layer to Fix:** Controller (debounce), DB (constraint)
- **Required Follow-up Command:** Carnage

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-2705-05

- **Finding ID:** BW-2705-05
- **Scenario:** createSystemPost Adapter — Systemic Actor Impersonation Surface
- **Target:** `@/features/upload/adapters/posts.adapter.js` → `createSystemPost`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table (vc.posts)
- **Attack Vector:** Any feature or controller that imports `createSystemPost` can pass any `actorId` and publish posts attributed to that actor; the adapter has no ownership gate
- **Exploit Chain Type:** Injection exploit (ownership-less shared adapter)
- **Governance Status:** DRAFT
- **Result:** BYPASSED (if vc.posts RLS is weak) / BLOCKED (if RLS migration applied)
- **Evidence:**
  - `createSystemPost` checks: actorId present, text present, post_type present, realm_id present, user authenticated
  - Does NOT check: is `auth.uid()` an owner of `actorId` in `actor_owners`?
  - This adapter is the shared publish surface for ALL 8 VPORT system post controllers
  - Exchange (VE-2705-01), gas, menu, barbershop, locksmith controllers all route through this path
- **Defense Gate:** ABSENT at adapter layer; UNVERIFIED at DB layer
- **Blast Radius:** All VPORT types — any of the 8 publish controllers inherits this gap
- **Severity:** HIGH (systemic — not limited to Exchange)
- **VENOM Finding Cross-Reference:** BW-2705-01 (same root cause, broader scope)
- **Recommended Fix:**
  1. Add ownership verification to `createSystemPost`: add `identityActorId` param + `actor_owners` lookup before insert
  2. OR: rely on RLS + ensure migration 20260522010000 is applied and verified across all environments
  3. Document the chosen defense model: "adapter trusts controller" vs "adapter enforces independently"
- **Layer to Fix:** Adapter (Controller), DB/RLS
- **Required Follow-up Command:** ELEKTRA (trace all 8 callers), DB (verify vc.posts INSERT RLS)

---

## THOR Release Gate Assessment

| Finding | Severity | Status | THOR Gate |
|---|---|---|---|
| BW-2705-01: Publish hook bypass | HIGH (CRITICAL if RLS unverified) | DRAFT | **BLOCK** — verify vc.posts RLS before any exchange publish release |
| BW-2705-02: Zero/negative rate injection | HIGH | BYPASSED | **BLOCK** — financial data integrity |
| BW-2705-03: Arbitrary currency code | MEDIUM | BYPASSED | CAUTION |
| BW-2705-04: Dedup race condition | MEDIUM | BYPASSED | CAUTION |
| BW-2705-05: createSystemPost ownership gap (systemic) | HIGH | BYPASSED/conditional | **BLOCK** — verify RLS migration status |

**THOR VERDICT:** HOLD on Exchange module release until:
1. BW-2705-01 publish controller ownership check is implemented (controller fix)
2. BW-2705-02 rate validation is implemented (controller fix)
3. `vc.posts` INSERT RLS migration 20260522010000 is verified applied in all environments (DB)

---

## Required Harness Files

*The following harnesses simulate the adversarial scenarios documented above. They require explicit user approval before being written to `zNOTFORPRODUCTION/_ACTIVE/redteam-harnesses/`. They are provided here as code blocks for review.*

**Harness 1: BW-2705-01 — Publish Bypass Simulation**

```js
// 2026-05-27_blackwidow_exchange-publish-bypass.harness.js
// SANDBOX ONLY — never import in production
// Simulates: React DevTools fiber access to mounted publish hook
//
// Pre-condition: authenticated as Actor A, navigate to Actor B's exchange dashboard.
// This harness replays what an attacker would do via DevTools.

import { publishExchangeRateUpdateAsPostController } from
  "@/features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller";

const VICTIM_ACTOR_ID = "test-victim-exchange-vport-actor-id";  // replace with test actor

async function runHarness() {
  console.log("[BW-2705-01] Attempting publish bypass as non-owner...");
  try {
    const result = await publishExchangeRateUpdateAsPostController({
      actorId: VICTIM_ACTOR_ID,
      baseCurrency: "USD",
      quoteCurrency: "MXN",
      buyRate: 999,
      sellRate: 1,
    });
    console.log("[BW-2705-01] RESULT:", result);
    // EXPECTED IF PROTECTED: throws "ownership required" error
    // ACTUAL (unprotected): { published: true, postId: "..." }
  } catch (err) {
    console.log("[BW-2705-01] BLOCKED:", err.message);
  }
}

export { runHarness };
```

**Harness 2: BW-2705-02 — Zero Rate Injection Simulation**

```js
// 2026-05-27_blackwidow_exchange-rate-validation.harness.js
// SANDBOX ONLY — never import in production
// Simulates: legitimate owner submitting invalid rate values

import upsertVportRateController from
  "@/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js";

const OWNER_ACTOR_ID = "test-owner-exchange-vport-actor-id";  // replace with test actor

const cases = [
  { buyRate: 0, sellRate: 1.5, label: "Zero buyRate" },
  { buyRate: 1.5, sellRate: -500, label: "Negative sellRate" },
  { buyRate: "NaN", sellRate: 1.5, label: "NaN string" },
  { buyRate: 9999999999, sellRate: 1, label: "Extreme high rate" },
];

async function runHarness() {
  for (const c of cases) {
    console.log(`[BW-2705-02] Testing: ${c.label}...`);
    try {
      const result = await upsertVportRateController({
        identityActorId: OWNER_ACTOR_ID,
        actorId: OWNER_ACTOR_ID,
        rateType: "fx",
        baseCurrency: "USD",
        quoteCurrency: "MXN",
        buyRate: c.buyRate,
        sellRate: c.sellRate,
      });
      console.log(`[BW-2705-02] STORED (no validation gate):`, result);
    } catch (err) {
      console.log(`[BW-2705-02] BLOCKED: ${err.message}`);
    }
  }
}

export { runHarness };
```

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| ELEKTRA | Trace exact patch locations for BW-2705-01, BW-2705-05 (publish controller + createSystemPost adapter) | PENDING |
| DB | Verify vc.posts INSERT RLS migration 20260522010000 applied; confirm actor_owners JOIN is in the current policy | PENDING — CRITICAL |
| SPIDER-MAN | Add regression tests: publish bypass attempt blocked at controller; zero rate rejected | PENDING |
| Carnage | Propose DB CHECK constraint on vport.rates (buy_rate > 0, sell_rate > 0); dedup index on vc.posts | PENDING |
| THOR | Evaluate release gate — BW-2705-01 + BW-2705-02 must be resolved before Exchange publish surface ships | PENDING |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| VENOM | Trust-boundary source authority — cross-referenced 2026-05-27 report | COMPLETE |
| LOKI | Validate runtime telemetry for exploit paths (BW-2705-01, BW-2705-04) | PENDING |
| THOR | Evaluate release blocking status for BW-2705-01, BW-2705-02 | PENDING |

---

*BLACKWIDOW is non-destructive. No production code was modified. No data was mutated. All simulation was repository-local source-code trace only.*
*Scope: VCSM. No cross-root violations occurred.*
