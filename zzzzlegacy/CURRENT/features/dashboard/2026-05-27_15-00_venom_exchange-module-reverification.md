# VENOM — Exchange Module Re-Verification
**Date:** 2026-05-27
**Application Scope:** VCSM
**Reviewer:** VENOM
**Branch:** vport-booking-feed-security-updates
**Trigger:** Post-remediation re-verification of Exchange module — VportDashboardExchangeScreen, upsertVportRate controller, publishExchangeRateUpdateAsPost controller, exchange DALs, and hooks.
**Previous report:** `2026-05-10_venom-robin_exchange-vport.md`
**Findings:** 0 CRITICAL | 2 HIGH | 3 MEDIUM | 3 LOW

---

## Boundary Contract

Loaded: `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`
Scope: **VCSM** — no cross-root modification. Analysis is read-only.

---

## VENOM TARGET

```
Feature / Route / Engine: Exchange VPORT — Dashboard Rate Management + Feed Post Publish
Application Scope: VCSM
Reason for review: Re-verification after security branch fixes; prior CRITICAL (VE-01 void identity) was patched.
Primary trust boundary: Authenticated VPORT Owner → Controller → DAL → DB (vport.rates + vc.posts)
```

---

## Files Inspected

| File | Layer | Role |
|---|---|---|
| `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx` | Screen | Entry + form orchestration |
| `apps/VCSM/src/features/profiles/kinds/vport/hooks/rates/useUpsertVportRate.js` | Hook | Upsert lifecycle + identity resolution |
| `apps/VCSM/src/features/profiles/adapters/kinds/vport/hooks/rates/useUpsertVportRate.adapter.js` | Adapter | Re-export passthrough |
| `apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js` | Controller | Ownership-gated rate write |
| `apps/VCSM/src/features/profiles/kinds/vport/controller/rates/getVportRates.controller.js` | Controller | Public rate read |
| `apps/VCSM/src/features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller.js` | Controller | Feed post publish |
| `apps/VCSM/src/features/profiles/kinds/vport/hooks/exchange/usePublishExchangeRatePost.js` | Hook | Publish hook wrapper |
| `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js` | DAL (write) | Rate upsert via profile_id |
| `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js` | DAL (read) | Cached rate reads |
| `apps/VCSM/src/features/profiles/kinds/vport/dal/exchange/vportExchangeRatePost.read.dal.js` | DAL (read) | Dedup check + exchange name |
| `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js` | DAL (read) | Actor owner lookup |
| `apps/VCSM/src/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal.js` | DAL (helper) | actorId → profile_id resolution |
| `apps/VCSM/src/features/profiles/kinds/vport/model/rates/vportRates.model.js` | Model | Rate row mapping |

---

## SECURITY SURFACE

```
Entry point: /actor/:actorId/dashboard/exchange (dashboard-gated route)
Auth source: Supabase session → useIdentity() → identity.actorId
Authorization layer (upsert): assertActorOwnsVportActorController (controller-level — FIXED since 2026-05-10)
Authorization layer (publish): NONE — no controller-level identity binding (OPEN)
Identity surface: actorId (correct), kind = 'vport'
Sensitive objects: vport.rates (financial data), vc.posts (public feed), vport.profiles
```

---

## TRUST BOUNDARY TRACE

```
Client input: baseCurrency, quoteCurrency, buyRate, sellRate (form), actorId (URL param)
Validated at: Screen (normalizeCurrencyCode, toNumOrNull — client-only)
Identity resolved at: useUpsertVportRate hook → identity.actorId (session)
Authorization enforced at:
  - Upsert path: assertActorOwnsVportActorController (controller) ← FIXED
  - Publish path: ONLY in screen UI (isOwner check) ← NOT FIXED
Data returned to: VportRatesView (public visitor), optimistic UI state (owner)
```

---

## REMEDIATION DELTA — Comparing to 2026-05-10

| Finding ID | Previous | Current Status |
|---|---|---|
| VE-01 CRITICAL: `void _identityActorId` | CRITICAL | ✅ REMEDIATED — controller now calls `assertActorOwnsVportActorController` |
| VE-02 HIGH: DAL-only protection | HIGH | ✅ CLOSED — resolved by VE-01 fix |
| VE-03 HIGH: No rate range validation | HIGH | 🔴 STILL OPEN |
| VE-04 MEDIUM: Currency code not ISO 4217 validated | MEDIUM | 🔴 STILL OPEN |
| VE-05 MEDIUM: Publish controller lacks ownership | MEDIUM | 🔴 ELEVATED → HIGH (asymmetry now visible) |
| VE-06 MEDIUM: vport_id / is_deleted in response | MEDIUM | OUT OF SCOPE this review |

---

## SECURITY RISK FINDINGS

---

### VENOM SECURITY FINDING — VE-2705-01
**Severity: HIGH**

- **Finding ID:** VE-2705-01
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller.js:20-48`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Feed Engine, Supabase Table/View (vc.posts)
- **Trust Boundary:** Authenticated Citizen, Authenticated VPORT Owner
- **Boundary Violated:** Authenticated Citizen → VPORT Owner (publish as any actor without identity verification)
- **Contract Violated:** Actor Ownership Contract, Feed Publishing Contract
- **Current behavior:**
  ```js
  export async function publishExchangeRateUpdateAsPostController({
    actorId,       // ← accepted from caller, never verified
    baseCurrency,
    quoteCurrency,
    buyRate,
    sellRate,
  }) {
    if (!actorId) throw new Error("...");
    // No identityActorId. No assertActorOwnsVportActorController.
    // No actor_owners lookup.
    ...
    const created = await createSystemPost({ actorId, text, ... });
  }
  ```
  The controller accepts `actorId` as a caller-provided parameter and publishes a feed post attributed to that actor with **zero identity or ownership verification**. The hook (`usePublishExchangeRatePost`) receives `actorId` from its props (which trace back to URL params `params?.actorId`) and passes it directly. No session `identityActorId` is involved at any point in the publish chain.

  Contrast: `upsertVportRateController` (the sibling) was fixed to call `assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId })`. The publish controller was not updated in the same pass.

- **Risk:** An authenticated actor who knows a target VPORT's `actorId` can publish a feed post attributed to that VPORT's identity without owning it. The only gate is the UI `isOwner` check in the screen — which is bypassed if the hook or controller is called directly (e.g., from a console, a different code path, or a future refactor).
- **Severity:** HIGH
- **Exploitability:** MEDIUM
- **Attack Preconditions:**
  - Authenticated Citizen account required
  - Target VPORT actorId known (from public URL, feed, or QR code)
  - Must invoke `publishExchangeRateUpdateAsPostController` bypassing the screen ownership gate (requires code execution in browser context or a future code path that calls the controller without the UI gate)
- **Blast Radius:** Feed-wide (false "exchange rate updated" posts appear on public feed attributed to victim VPORT)
- **Identity Leak Type:** Actor correlation (post published as victim actor)
- **Cache Trust Type:** None (write, not read)
- **RLS Dependency:** UNVERIFIED — `createSystemPost` writes to `vc.posts`; whether the posts RLS enforces actor ownership is not confirmed in this review
- **Why it matters:**
  1. The upsert path (financial data) is now ownership-gated. The publish path (public feed post) is not. This asymmetry is architecturally inconsistent and creates a gap that could be exploited independently.
  2. False "exchange rate updated" posts spread misinformation on the public feed, potentially influencing user behavior (false urgency to exchange currency).
  3. Defense-in-depth principle: controller-level ownership is mandatory regardless of UI gate presence.
- **Recommended mitigation:**
  1. Add `identityActorId` as a required parameter to `publishExchangeRateUpdateAsPostController`.
  2. Call `assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId })` before `createSystemPost`.
  3. Update `usePublishExchangeRatePost` to read `identity.actorId` from `useIdentity()` and pass it as `identityActorId`.
  4. Mirror the same pattern as `upsertVportRateController`.
- **Rationale:** Every write controller in VCSM that operates on actor-owned resources must verify ownership at the controller layer. The UI gate is not sufficient.
- **Follow-up command:** ELEKTRA (patch trace), then SPIDER-MAN (regression test)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security, Security Architecture and Engineering

---

### VENOM SECURITY FINDING — VE-2705-02
**Severity: HIGH**

- **Finding ID:** VE-2705-02
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js:17-29`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table/View (vport.rates)
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** No boundary violated at controller — data integrity boundary (missing validation)
- **Contract Violated:** None (integrity, not access)
- **Current behavior:**
  ```js
  const result = await upsertVportRateDal({
    actorId,
    rateType,
    baseCurrency,    // ← any string
    quoteCurrency,   // ← any string
    buyRate,         // ← any value, including 0, negative, Infinity
    sellRate,        // ← any value
    meta,
  });
  ```
  The controller enforces ownership (correctly) but passes `buyRate`, `sellRate`, `baseCurrency`, and `quoteCurrency` directly to the DAL without any input validation. The screen normalizes currency codes client-side (`normalizeCurrencyCode` — uppercase, trim) and coerces rates to numbers (`toNumOrNull`), but these are UI-layer-only protections.

- **Risk:**
  - **Rate values:** Zero, negative, or extreme values can be stored and displayed publicly as authoritative FX rates. An exchange VPORT owner could accidentally (or maliciously) post a buy rate of `0` or a sell rate of `-1`, which appears on the public profile and in the feed post text.
  - **Currency codes:** Any string up to the DB column limit can be stored. If the DB column is not strictly typed, values like `"XYZ"`, `"FAKE"`, or excessively long strings can be stored and rendered in feed posts via `buildPostText`.
- **Severity:** HIGH
- **Exploitability:** MEDIUM
- **Attack Preconditions:**
  - Authenticated VPORT Owner of any exchange VPORT
  - Can call the API with manipulated values
- **Blast Radius:**
  - Single VPORT (rate corruption)
  - Feed-wide (if `shareToFeed` is enabled — bad rate appears in exchange_rate_update post)
- **Identity Leak Type:** None
- **Cache Trust Type:** Financial-sensitive (rates cache TTL 60s — stale bad rate could persist)
- **RLS Dependency:** NONE — validation is app responsibility
- **Why it matters:** Exchange rates are financial data. The gas VPORT type has sanity bounds (`minPrice`, `maxPrice`, `maxDeltaPct`, `requireSanityForSuggestion`). The exchange type has none. An owner posting `buyRate: 0` could mislead customers.
- **Recommended mitigation:**
  1. Add controller-layer validation: reject `buyRate <= 0`, `sellRate <= 0`.
  2. Validate `baseCurrency` and `quoteCurrency` against an ISO 4217 allow-list (or a constrained list of supported pairs for the platform).
  3. Optionally add a delta sanity check: reject if new rate deviates by more than N% from the last stored rate.
- **Rationale:** Financial data integrity requires server-side input bounds, not client-side normalization only.
- **Follow-up command:** Wolverine
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security and Risk Management, Asset Security

---

### VENOM SECURITY FINDING — VE-2705-03
**Severity: MEDIUM**

- **Finding ID:** VE-2705-03
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js:7` + `apps/VCSM/src/features/profiles/kinds/vport/model/rates/vportRates.model.js:20-35`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table/View (vport.rates)
- **Trust Boundary:** System (internal identifier flow)
- **Boundary Violated:** Asset Security — internal identifier (`profile_id`) flows through to controller return value without model stripping
- **Contract Violated:** Asset Security Contract (internal ID minimization)
- **Current behavior:**
  The DAL selects:
  ```
  "id,profile_id,rate_type,base_currency,quote_currency,buy_rate,sell_rate,meta,updated_at,created_at"
  ```
  The `profile_id` field is included in the select and returned in the raw DAL result. The controller returns this raw result **without model mapping**:
  ```js
  const result = await upsertVportRateDal(...);
  invalidateRatesCache();
  return result;  // ← raw row including profile_id
  ```
  The hook stores this in state:
  ```js
  setState({ isLoading: false, data: res, error: null });
  ```
  The screen then calls `mapVportRateRow(saved)` to strip `profile_id` before use — but the hook's `.data` property contains the raw row with `profile_id` throughout the operation.

  Additionally: the model maps `row.actor_id` but the DAL select does **not include `actor_id`**. The model will always produce `actorId: null` for any row returned by the upsert DAL. The screen compensates by manually appending `actorId`:
  ```js
  const mapped = saved ? { ...mapVportRateRow(saved), actorId } : optimisticRate;
  ```
  This means the model has a silent null field that callers must patch manually.

- **Risk:**
  - `profile_id` (internal vport identifier UUID) is present in hook state. Any debug panel, logger, or error reporter that dumps hook state will expose this internal ID.
  - The model's `actorId: null` silent failure is a latent bug — if a future caller uses the model output without the manual patch, they get a null actorId and may break downstream logic.
- **Severity:** MEDIUM
- **Exploitability:** LOW (requires debug access to hook state; not directly user-facing)
- **Attack Preconditions:**
  - Debug tooling or error reporter that dumps hook state
  - Or a future code path using the model without the manual actorId patch
- **Blast Radius:** Single VPORT (internal ID only)
- **Identity Leak Type:** Internal UUID exposure (profile_id)
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:**
  1. `profile_id` is an internal identifier that should never appear in client state.
  2. The model failing silently on `actorId` (because `actor_id` is not selected) is a fragile pattern.
- **Recommended mitigation:**
  1. Apply model mapping at the controller layer before returning, not at the screen layer.
  2. Add `actor_id` to the DAL `RATES_SELECT` so the model can map it correctly, OR remove `actorId` from `mapVportRateRow` if it is never available from this DAL.
  3. Remove `profile_id` from `RATES_SELECT` — it is not needed by any domain consumer.
- **Rationale:** Internal identifiers must not flow into client-accessible state. Model mapping belongs at the controller boundary.
- **Follow-up command:** Wolverine
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING — VE-2705-04
**Severity: MEDIUM**

- **Finding ID:** VE-2705-04
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/dal/exchange/vportExchangeRatePost.read.dal.js:16-31`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table/View (vc.posts)
- **Trust Boundary:** System (dedup mechanism)
- **Boundary Violated:** None (dedup check is read-only)
- **Contract Violated:** None directly — operational integrity concern
- **Current behavior:**
  ```js
  const DEDUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
  
  export async function hasRecentExchangeRatePostDAL({ actorId, windowMs = DEDUP_WINDOW_MS }) {
    ...
    const { data, error } = await supabase
      .schema("vc")
      .from("posts")
      .select("id")
      .eq("actor_id", actorId)
      .eq("post_type", "exchange_rate_update")
      .is("deleted_at", null)
      .gte("created_at", since)
      .limit(1)
      .maybeSingle();
    return !!data;
  }
  ```
  The dedup check queries `vc.posts` for any existing `exchange_rate_update` post within a 1-hour window. This is the **only mechanism** preventing an actor from spamming exchange rate posts to the public feed. The dedup is enforced only in app code — no DB trigger, constraint, or RLS policy enforces this limit.

  The `windowMs` parameter is also caller-overridable (defaults to 1 hour but accepts any value). If the caller passes `windowMs: 0`, the dedup window collapses to "has a post been created in the past 0ms" — effectively disabling dedup.

- **Risk:**
  - App-layer dedup only. A caller can pass `windowMs: 0` to bypass the dedup.
  - In the current call chain this is not exploitable (the hook does not expose `windowMs`). But the DAL export allows any future caller to bypass.
- **Severity:** MEDIUM
- **Exploitability:** LOW (requires direct DAL access or future hook modification)
- **Attack Preconditions:**
  - Must call `hasRecentExchangeRatePostDAL` directly with `windowMs: 0`
  - Or call `publishExchangeRateUpdateAsPostController` in a loop (bypassing the dedup by calling it before the previous post is committed — race condition)
- **Blast Radius:** Feed-wide (exchange rate spam posts visible to all followers and public feed)
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE — dedup is entirely app-layer
- **Why it matters:** Without a DB-level rate limit, the public feed can be flooded with exchange rate posts from a single exchange VPORT if the app-layer check is bypassed.
- **Recommended mitigation:**
  1. Make `windowMs` internal-only (remove from the exported function signature, or validate it against a minimum floor).
  2. Consider adding a DB-level unique index or partial index on `(actor_id, post_type, created_at)` to enforce a rate limit at the DB layer, or a DB trigger that enforces the dedup window.
- **Rationale:** Critical rate limits (especially for public feed spam) should be enforced at the DB layer, not app layer only.
- **Follow-up command:** DB, Carnage
- **CISSP Domain:**
  - Primary: Security Operations
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING — VE-2705-05
**Severity: MEDIUM**

- **Finding ID:** VE-2705-05
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/rates/getVportRates.controller.js:7-27`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table/View (vport.rates)
- **Trust Boundary:** Public Visitor
- **Boundary Violated:** None (intentional public read — but undocumented)
- **Contract Violated:** None — needs documentation
- **Current behavior:**
  ```js
  export default async function getVportRatesController({ targetActorId, rateType = "fx" } = {}) {
    if (!targetActorId) throw new Error("getVportRatesController: targetActorId is required");
    const rows = await readVportRatesByActorDal({ actorId: targetActorId, rateType });
    ...
  }
  ```
  The controller has no authentication check. Any caller (authenticated or not) can read exchange rates for any VPORT. There is no session binding, no ownership check, no role check.

- **Risk:** Exchange rates for any VPORT are publicly readable by any caller. If this is intentional (exchange rates are public business information), it is correct but undocumented. If any VPORT type is intended to have private rates, this controller would expose them.
- **Severity:** MEDIUM
- **Exploitability:** HIGH (for enumeration — public data)
- **Attack Preconditions:** None — unauthenticated access
- **Blast Radius:** All exchange VPORTs (full rate enumeration possible)
- **Identity Leak Type:** None (rates are not identity-sensitive)
- **Cache Trust Type:** None (this is the correct behavior if rates are public)
- **RLS Dependency:** ASSUMED — if RLS on `vport.rates` restricts public read, this is fine; if RLS allows anon read, all rates are publicly enumerable
- **Why it matters:** The intentionality of this public read should be documented. If a VPORT type emerges that has private rates (e.g., negotiated rates for VIP clients), this controller would expose them.
- **Recommended mitigation:**
  1. Add a JSDoc comment or inline note explicitly stating: "Exchange rates are public business data — no auth required."
  2. Confirm `vport.rates` RLS allows anon read (and document that this is intentional).
  3. If any rate confidentiality is needed in the future, this controller must be updated before any new rate types are added.
- **Rationale:** Undocumented public read paths are a governance risk — the intention must be explicit.
- **Follow-up command:** DB (confirm vport.rates RLS allows anon read), LOGAN (document intent)
- **CISSP Domain:**
  - Primary: Security and Risk Management
  - Secondary: Communication and Network Security

---

### VENOM SECURITY FINDING — VE-2705-06
**Severity: LOW**

- **Finding ID:** VE-2705-06
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js:5-7`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** System (DAL internal)
- **Boundary Violated:** Debug Leakage Rule (project-level)
- **Contract Violated:** Platform debug logging rules
- **Current behavior:**
  ```js
  if (import.meta.env?.DEV) {
    console.log("[dalReadActorOwnerRow] actorId=", actorId, "userId=", userId);
  }
  ```
  `actorId` and `userId` are logged to the browser console in dev mode. While guarded by `import.meta.env?.DEV`, this violates the project's debug logging rules: debug output must render on-screen and be dev-only — never `console.log`.

- **Risk:** Low — production-guarded. But `userId` exposure (even in dev) in a DAL that handles security-critical ownership checks is a hygiene concern.
- **Severity:** LOW
- **Exploitability:** LOW (dev-only)
- **Attack Preconditions:** Developer access to source or browser console in DEV mode
- **Blast Radius:** None (dev only)
- **Identity Leak Type:** None (dev only — but userId logged)
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Violates the project debug logging contract. Dev-mode console logs with identity fields (userId) normalize unsafe patterns.
- **Recommended mitigation:** Remove the `console.log`. Add a dev-mode diagnostic panel in `zNOTFORPRODUCTION/debuggers/` if needed.
- **Rationale:** Project rule: no `console.log`. Debug output must be screen-rendered and dev-only via dedicated debugger files.
- **Follow-up command:** LOGAN
- **CISSP Domain:**
  - Primary: Security Operations
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING — VE-2705-07
**Severity: LOW**

- **Finding ID:** VE-2705-07
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/model/rates/vportRates.model.js:25` vs `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js:7`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** System (model/DAL alignment)
- **Boundary Violated:** None (internal consistency gap)
- **Contract Violated:** DAL select contract (implicit)
- **Current behavior:**
  The model maps:
  ```js
  actorId: toStr(row.actor_id),  // ← always null (actor_id not in DAL select)
  ```
  The DAL selects:
  ```
  "id,profile_id,rate_type,base_currency,quote_currency,buy_rate,sell_rate,meta,updated_at,created_at"
  ```
  `actor_id` is absent from the select. So `mapVportRateRow` always produces `actorId: null` for rows returned by this DAL. The screen compensates:
  ```js
  const mapped = saved ? { ...mapVportRateRow(saved), actorId } : optimisticRate;
  ```
  This is a fragile pattern — the model silently fails and callers must know to patch it.

- **Risk:** If `mapVportRateRow` is used in a context where the screen-level `actorId` patch is not applied (e.g., a future hook or component that uses the model directly), `actorId` will be null, causing silent domain failures downstream.
- **Severity:** LOW
- **Exploitability:** LOW (internal consistency, not an access control gap)
- **Attack Preconditions:** Future code refactor that uses the model without the manual patch
- **Blast Radius:** Single VPORT (null actorId in domain objects)
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Silent null fields in models violate the "domain shape translation, pure transforms" contract. The model should produce correct output from DAL input, not require caller-side patching.
- **Recommended mitigation:**
  1. Either add `actor_id` to the DAL `RATES_SELECT`, OR
  2. Remove `actorId` from `mapVportRateRow` and handle it separately where needed.
  3. Remove `profile_id` from `RATES_SELECT` (it is not needed by any domain consumer and creates the internal ID leakage described in VE-2705-03).
- **Rationale:** Model output must be reliable without external patching.
- **Follow-up command:** Wolverine
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering

---

### VENOM SECURITY FINDING — VE-2705-08
**Severity: LOW**

- **Finding ID:** VE-2705-08
- **Location:** `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx:174-180`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** Architecture layer boundary (Final Screen vs View Screen role)
- **Contract Violated:** ARCHITECTURE.md — Screen Role Boundaries
- **Current behavior:**
  ```jsx
  if (!identity) { return <div>Sign in required.</div>; }
  if (!isOwner) { return <div>You can only manage exchange rates for your own vport.</div>; }
  ```
  The ownership gate (`isOwner`) is enforced at the View Screen layer. Per the architecture contract: Final Screen = "Route entry + identity gate only" and View Screen = "Hooks + component composition — no business logic." The ownership check is an identity gate and belongs in a Final Screen, not a View Screen.

  Additionally, `onSave` (lines 80-163) contains substantial orchestration logic: optimistic update state management, upsert, model mapping, feed publish with error swallowing, toast display. This is all inside the same screen file.

- **Risk:** Ownership gate in wrong layer creates a pattern where future developers may assume the check is screen-portable, not a hard gate. If the View Screen is refactored or composed differently, the gate may not transfer.
- **Severity:** LOW
- **Exploitability:** LOW (architecture violation, not a current exploitable gap)
- **Attack Preconditions:** Future refactor that bypasses the View Screen
- **Blast Radius:** Single actor (if gate is dropped in a refactor)
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** REQUIRED (controller must remain the authoritative gate — which it is for upsert; not for publish — see VE-2705-01)
- **Why it matters:** Architecture violations compound over time. The screen doing both identity gating AND orchestration AND optimistic state management exceeds its contracted role.
- **Recommended mitigation:**
  1. Separate into a Final Screen (identity + ownership gate) and a View Screen (hook wiring + composition).
  2. Move `onSave` orchestration into a dedicated hook.
- **Rationale:** Architecture contract compliance prevents future security drift.
- **Follow-up command:** LOGAN, review-contract
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Software Development Security

---

## ACTOR OWNERSHIP WARNING

```
ACTOR OWNERSHIP WARNING
Location: publishExchangeRateUpdateAsPost.controller.js
Caller actor: (unknown — no identityActorId bound)
Target actor: actorId (caller-provided, URL-sourced)
Ownership verification: MISSING — no assertActorOwnsVportActorController call
Risk: Any authenticated caller can publish a feed post attributed to any VPORT actorId
Recommended mitigation: Add identityActorId param + assertActorOwnsVportActorController call
```

---

## DEBUG LEAKAGE WARNING

```
DEBUG LEAKAGE WARNING
Location: actorOwners.read.dal.js:5-7
Current behavior: console.log of actorId and userId in dev mode
Leak risk: userId (auth identifier) logged to browser console
Severity: LOW (dev-guarded)
Recommended mitigation: Remove console.log; move to screen-rendered debugger if needed
```

---

## IDENTITY SURFACE COMPLIANCE

| Surface | Compliance |
|---|---|
| upsertVportRateController: uses identityActorId ✅ | Compliant |
| publishExchangeRateUpdateAsPostController: no identityActorId ❌ | NON-COMPLIANT |
| usePublishExchangeRatePost: passes actorId from props only ❌ | NON-COMPLIANT |
| getVportRatesController: no identity (intentional public read) | Documented gap |
| actorOwners.read.dal.js: uses actorId + userId correctly ✅ | Compliant |

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VE-2705-01 | Publish controller no identity binding — feed post as any actor | Controller | P1 — HIGH | App | ELEKTRA + SPIDER-MAN |
| VE-2705-02 | Rate values not validated (zero/negative/arbitrary strings) | Controller | P1 — HIGH | App | Wolverine |
| VE-2705-03 | profile_id in hook state; actorId null from model | Controller + DAL + Model | P2 — MEDIUM | App | Wolverine |
| VE-2705-04 | Dedup window caller-overridable; app-only enforcement | DAL + DB | P2 — MEDIUM | DB | DB + Carnage |
| VE-2705-05 | Public read unauthenticated — undocumented | Documentation | P3 — LOW | Documentation | LOGAN + DB |
| VE-2705-06 | console.log in DAL with userId | DAL | P3 — LOW | App | LOGAN |
| VE-2705-07 | Model actorId always null — DAL/model mismatch | DAL + Model | P3 — LOW | App | Wolverine |
| VE-2705-08 | Architecture layer violation — screen does too much | Screen + Hook | P4 — LOW | App | LOGAN + review-contract |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 2 | VE-2705-02 (financial data integrity), VE-2705-05 (undocumented public read) |
| Asset Security | 2 | VE-2705-03 (profile_id in state), VE-2705-02 (financial data) |
| Security Architecture and Engineering | 3 | VE-2705-01 (no defense-in-depth), VE-2705-07 (model/DAL mismatch), VE-2705-08 (layer violation) |
| Communication and Network Security | 1 | VE-2705-05 (public enumeration) |
| Identity and Access Management | 2 | VE-2705-01 (no ownership check), VE-2705-02 (no input gates) |
| Security Assessment and Testing | 0 | Test coverage reviewed — upsert and publish tests exist; no test for bypassing publish ownership |
| Security Operations | 2 | VE-2705-04 (dedup app-only), VE-2705-06 (debug logging) |
| Software Development Security | 5 | VE-2705-01, VE-2705-02, VE-2705-03, VE-2705-06, VE-2705-07, VE-2705-08 |

**CISSP domain not meaningfully covered:** Security Assessment and Testing — test files were reviewed; unit tests exist for both upsertVportRateController and publishExchangeRateUpdateAsPostController. There is no test for a caller bypassing the publish controller's (absent) ownership check with a different actorId. This gap aligns with VE-2705-01.

---

## REMEDIATION PRIORITY ORDER

```
1. VE-2705-01 — Add identityActorId + assertActorOwnsVportActorController to publishExchangeRateUpdateAsPostController [HIGH — P1]
2. VE-2705-02 — Add controller-layer rate validation (buyRate > 0, sellRate > 0, ISO 4217 currency) [HIGH — P1]
3. VE-2705-03 — Strip profile_id from DAL select; apply model at controller layer [MEDIUM — P2]
4. VE-2705-04 — Harden dedup: internal windowMs, add DB-level rate limit [MEDIUM — P2]
5. VE-2705-05 — Document public read intent in getVportRatesController [LOW — P3]
6. VE-2705-06 — Remove console.log from actorOwners.read.dal.js [LOW — P3]
7. VE-2705-07 — Align DAL select with model expectations [LOW — P3]
8. VE-2705-08 — Split screen into Final + View layers [LOW — P4]
```

---

## NOTABLE POSITIVE — VE-01 REMEDIATED

The original CRITICAL finding from 2026-05-10 (`void _identityActorId` in the upsert controller) has been fully remediated. The current `upsertVportRateController` correctly:
1. Requires `identityActorId`
2. Calls `assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId })`
3. Propagates ownership rejection before any DAL write occurs
4. Has regression test coverage confirming ownership behavior

This is the correct pattern. The publish controller (VE-2705-01) should mirror it.

---

*VENOM is read-only. No code was modified. All findings are recommendations only.*
*Scope: VCSM. No cross-root modifications occurred or are recommended.*
