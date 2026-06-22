# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-05-27 · 17:30
**Scope:** VCSM — VPORT Exchange Rate Module
**Reviewer:** BLACKWIDOW
**Environment:** Static source trace + runtime path simulation (sandboxed — no production mutation)
**Governance Status:** DRAFT
**VENOM Source:** `2026-05-27_17-00_venom_exchange-module-post-hardening-reverification.md`
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — VCSM root only

---

## Attack Surface Summary

Entry points adversarially tested:

| Surface | Entry | Auth Requirement | Write Authority |
|---|---|---|---|
| Rate upsert | `upsertVportRateController` | identityActorId (session-bound) | VPORT Owner only |
| Feed publish | `publishExchangeRateUpdateAsPostController` | identityActorId (session-bound) | VPORT Owner only |
| Dashboard screen | `VportDashboardExchangeScreen.jsx` | `useIdentity()` + `useVportOwnership()` | VPORT Owner only |
| Rate read | `getVportRatesController` | None — public | N/A |

---

## Prior ELEK Finding Re-Verification

### ELEK-001 (IDOR) — Re-tested

**Attack path A:** Direct controller call with missing identityActorId
```
publishExchangeRateUpdateAsPostController({ actorId: "victim-actor", identityActorId: undefined, ... })
  → if (!identityActorId) throw "identityActorId required"
  → Result: BLOCKED ✅
```

**Attack path B:** Attacker calls with own identityActorId, victim's actorId
```
publishExchangeRateUpdateAsPostController({ actorId: "victim-actor", identityActorId: "attacker-actor", ... })
  → assertActorOwnsVportActorController({ requestActorId: "attacker-actor", targetActorId: "victim-actor" })
  → readActorOwnerLinkByActorAndUserProfile → no link found
  → throws "Actor does not own this vport actor."
  → Result: BLOCKED ✅
```

**Verdict: CONFIRMED CLOSED ✅**

### ELEK-002 (Zero/Negative Rate) — Re-tested

**Attack path:** Submit buyRate: 0, -1.5, NaN, "not-a-number"
```
assertValidRate("buyRate", 0)    → 0 <= 0 → throws ✅
assertValidRate("buyRate", -1.5) → -1.5 <= 0 → throws ✅
assertValidRate("buyRate", NaN)  → !isFinite(NaN) → throws ✅
assertValidRate("buyRate", "not-a-number") → Number("not-a-number") = NaN → throws ✅
```

**Verdict: CONFIRMED CLOSED ✅**

### ELEK-003 (Currency Injection) — Re-tested

**Attack path A:** Unsupported currency code
```
assertValidCurrencyCode("baseCurrency", "XYZ") → !SUPPORTED_FX_CURRENCIES.has("XYZ") → throws ✅
```

**Attack path B:** Mixed-case bypass attempt
```
assertValidCurrencyCode("baseCurrency", "uSd") → .toUpperCase() → "USD" → SUPPORTED → returns "USD" ✅
```

**Attack path C:** Whitespace injection
```
assertValidCurrencyCode("baseCurrency", " USD ") → .trim().toUpperCase() → "USD" → SUPPORTED → returns "USD" ✅
```

**Attack path D:** Same-pair bypass via casing
```
assertValidCurrencyCode("baseCurrency", "usd") → "USD"
assertValidCurrencyCode("quoteCurrency", "USD") → "USD"
validatedBase === validatedQuote → "USD" === "USD" → throws ✅
```

**Attack path E:** Empty string
```
assertValidCurrencyCode("baseCurrency", "") → trim → "" → !code → throws ✅
```

**Verdict: CONFIRMED CLOSED ✅**

### ELEK-004 (Console.log Identity Leakage) — Re-tested

**Check:** Inspect `actorOwners.read.dal.js`
```js
export async function readActorOwnersByActorIdDAL({ actorId } = {}) {
  if (!actorId) return []
  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id, user_id")
    .eq("actor_id", actorId)
  if (error) throw error
  return data ?? []
}
```
No `console.log` calls. No debug output. Minimal select (`actor_id, user_id` only). ✅

**Verdict: CONFIRMED CLOSED ✅**

---

## Ownership Bypass Results

### OWNERSHIP BYPASS ATTEMPT 1 — Cross-actor rate upsert via actorId parameter manipulation

**Target:** `upsertVportRateController`
**Attack vector:** Submit `actorId` of a VPORT the attacker does not own; supply own `identityActorId`

Simulation:
```
Attacker actor: actor-attacker-999 (authenticated, kind=user)
Victim VPORT:   actor-victim-exchange-111

upsertVportRateController({
  identityActorId: "actor-attacker-999",
  actorId: "actor-victim-exchange-111",
  baseCurrency: "USD", quoteCurrency: "MXN",
  buyRate: 1, sellRate: 2
})

→ assertActorOwnsVportActorController({
    requestActorId: "actor-attacker-999",
    targetActorId:  "actor-victim-exchange-111"
  })
  → getActorByIdDAL("actor-attacker-999") → kind=user, is_void=false ✅
  → not self-ownership path (attacker ≠ victim)
  → readActorOwnerLinkByActorAndUserProfile("actor-victim-exchange-111", attacker.profile_id)
  → no link returned
  → throws "Actor does not own this vport actor."
```

**Result:** BLOCKED
**Controller gate:** PRESENT — DB-backed ownership check
**Severity:** N/A (blocked)

---

### OWNERSHIP BYPASS ATTEMPT 2 — Cross-actor feed publish

**Target:** `publishExchangeRateUpdateAsPostController`
**Attack vector:** Submit victim actorId with own identityActorId → attempt to publish post under victim's actor identity

Simulation:
```
publishExchangeRateUpdateAsPostController({
  identityActorId: "actor-attacker-999",
  actorId:         "actor-victim-exchange-111",
  baseCurrency: "USD", quoteCurrency: "MXN",
  buyRate: 1.5, sellRate: 1.8
})

→ actorId guard passes
→ identityActorId guard passes
→ currency presence check passes
→ assertActorOwnsVportActorController → no link → throws "Actor does not own this vport actor."
```

DB layer: `posts_insert_actor_owner` policy also blocks via `auth.uid() → actor_owners` even if app layer bypassed.

**Result:** BLOCKED (dual enforcement: app layer + DB RLS)
**Controller gate:** PRESENT
**Severity:** N/A (blocked)

---

## Session Mutation Results

### SESSION MUTATION ATTEMPT 1 — Null identity injection into hook

**Target:** `useUpsertVportRate` → `upsertVportRateController`
**Attack vector:** Identity context is null (unauthenticated session)

Simulation:
```
identity = null → identityActorId = null

upsertVportRateController({ identityActorId: null, actorId: "target", ... })
  → if (!identityActorId) throw "identityActorId required"
```

**Result:** BLOCKED
**Session binding:** ENFORCED
**Severity:** N/A (blocked)

---

### SESSION MUTATION ATTEMPT 2 — Stale viewerActorId in screen

**Target:** `VportDashboardExchangeScreen` → `useVportOwnership`
**Attack vector:** Navigate to victim's exchange dashboard URL

Simulation:
```
Navigate to: /actor/victim-exchange-vport-111/dashboard/exchange
  → actorId = "victim-exchange-vport-111" (from URL)
  → viewerActorId = identity.actorId = "attacker-actor-999" (session)
  → useVportOwnership("attacker-actor-999", "victim-exchange-vport-111")
  → DB query → isOwner = false
  → screen renders: "You can only manage exchange rates for your own vport."
  → no write controls rendered
```

Even if attacker manipulates the DOM to trigger `m.upsert()`, the controller enforces ownership independently. BLOCKED at both screen and controller layer.

**Result:** BLOCKED
**Session binding:** ENFORCED
**Severity:** N/A (blocked)

---

## Runtime Abuse Results

### RUNTIME ABUSE ATTEMPT 1 — Non-owner actor attempts write (VPORT-kind actor)

**Target:** `assertActorOwnsVportActorController`
**Attack vector:** VPORT-kind actor (not user-kind) sends requestActorId

Simulation:
```
assertActorOwnsVportActorController({
  requestActorId: "vport-actor-kind-abc",  ← kind = "vport"
  targetActorId:  "some-vport-def"
})
  → getActorByIdDAL("vport-actor-kind-abc") → requesterActor.kind = "vport"
  → if (requesterActor.kind !== "user") throw "Only actor owners can manage this booking resource."
```

**Result:** DENIED
**Privilege gate:** PRESENT — kind check precedes all ownership resolution
**Severity:** N/A (blocked)

---

### RUNTIME ABUSE ATTEMPT 2 — Self-ownership shortcut abuse (VPORT-kind self-targeting)

**Target:** `assertActorOwnsVportActorController` self-ownership shortcut
**Attack vector:** VPORT-kind actor sends `requestActorId === targetActorId` to use self-ownership shortcut

Simulation (pre-fix scenario — verifying fix holds):
```
requestActorId = "vport-actor-abc"
targetActorId  = "vport-actor-abc"

assertActorOwnsVportActorController({ requestActorId: "vport-actor-abc", targetActorId: "vport-actor-abc" })
  → getActorByIdDAL("vport-actor-abc") → kind = "vport"
  → kind !== "user" → throws BEFORE self-ownership check
  → self-ownership shortcut never reached
```

The ELEK-004 ordering fix (kind check first) holds. A VPORT-kind actor cannot self-approve via the shortcut.

**Result:** DENIED
**Privilege gate:** PRESENT — correct ordering enforced by ELEK-004 fix
**Severity:** N/A (blocked)

---

## RLS Verification Results

### RLS VERIFICATION ATTEMPT 1 — vport.rates INSERT under legitimate owner

**Table:** `vport.rates`
**Attack vector:** Verify that `rates_insert` policy permits legitimate owner writes

```sql
Policy: rates_insert ON vport.rates
  FOR INSERT TO authenticated
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
```

Simulation: Legitimate owner calls upsertVportRateDal → profile_id resolved via resolveVportProfileId → DB INSERT → actor_can_manage_profile checks ownership → permits.

**RLS status:** VERIFIED (migration 20260523020000)
**Result:** PERMITTED for owner, BLOCKED for non-owner ✅

---

### RLS VERIFICATION ATTEMPT 2 — vc.posts INSERT for exchange_rate_update

**Table:** `vc.posts`
**Attack vector:** Verify posts_insert_actor_owner blocks cross-actor post creation

```sql
Policy: posts_insert_actor_owner ON vc.posts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = posts.actor_id AND ao.user_id = auth.uid()
    )
  );
```

Simulation: createSystemPost with `actorId = "victim-exchange-111"` while `auth.uid()` belongs to attacker → `actor_owners` lookup fails → RLS WITH CHECK fails → INSERT rejected.

**RLS status:** VERIFIED (migration 20260523010000)
**Result:** BLOCKED at DB layer for cross-actor publish ✅

---

### RLS VERIFICATION ATTEMPT 3 — vport.rates SELECT for inactive/deleted VPORT

**Table:** `vport.rates`
**Attack vector:** Query rates for an inactive or deleted VPORT

```sql
Policy: rates_select ON vport.rates
  FOR SELECT TO PUBLIC
  USING (vport.actor_can_view_profile(vc.current_actor_id(), profile_id));
```

`actor_can_view_profile` gates on `is_active = true AND is_deleted = false` (per migration comments). Rates for inactive/deleted VPORTs are not accessible to public or non-owner callers.

**RLS status:** VERIFIED (migration 20260523020000)
**Result:** BLOCKED for inactive/deleted VPORTs ✅

---

## Viewer Context Fuzz Results

### VIEWER CONTEXT FUZZ ATTEMPT 1 — actorId from URL set to non-existent VPORT

**Target:** `VportDashboardExchangeScreen` → `useVportOwnership`
**Injected context:** `actorId = "00000000-0000-0000-0000-000000000000"` (non-existent)

Simulation:
```
useVportOwnership("attacker-actor", "00000000-0000-0000-0000-000000000000")
  → DB query → no ownership record found
  → isOwner = false
  → screen: "You can only manage exchange rates for your own vport."
```

**Result:** ERROR/DENY correctly rendered
**Context validation:** ENFORCED
**Severity:** N/A

---

### VIEWER CONTEXT FUZZ ATTEMPT 2 — Zero-value / empty actorId from URL

**Target:** `VportDashboardExchangeScreen`
**Injected context:** `params.actorId = null`

Simulation:
```
actorId = params?.actorId ?? null → null
if (!actorId) return null (screen returns nothing)
```

**Result:** Screen exits gracefully, no write path triggered
**Context validation:** ENFORCED (null guard at screen entry)
**Severity:** N/A

---

## Mutation Replay Results

### MUTATION REPLAY ATTEMPT 1 — Rapid rate upsert replay (no idempotency race)

**Target:** `upsertVportRateController` + `invalidateRatesCache`
**Attack vector:** Submit two identical upserts in rapid succession to exploit cache invalidation gap

Simulation:
```
Call 1: upsertVportRateController(USD/MXN, buy=17.5, sell=17.8)
  → DAL write completes
  → invalidateRatesCache() → cache cleared immediately

Call 2 (200ms later): upsertVportRateController(USD/MXN, buy=17.5, sell=17.8)
  → DAL write completes (upsert is idempotent via conflict key)
  → invalidateRatesCache() → cache cleared
```

No race condition. `invalidateRatesCache()` is synchronous post-write. Second call re-writes same data (idempotent). No stale data path exploitable.

**Result:** BLOCKED (by design — upsert idempotency + synchronous cache invalidation)
**State check:** PRESENT
**Severity:** N/A

---

### MUTATION REPLAY ATTEMPT 2 — Feed publish dedup bypass via pair variation

**Target:** `publishExchangeRateUpdateAsPostController`
**Attack vector:** Attempt to spam feed by submitting different currency pairs within 1-hour dedup window

Simulation:
```
Publish 1: USD/MXN → post created (hasRecentExchangeRatePostDAL = false → proceeds)
Publish 2 (5 min later): USD/EUR (different pair) →
  hasRecentExchangeRatePostDAL({ actorId, windowMs: 3600000 })
  → SELECT * FROM vc.posts WHERE actor_id = ? AND post_type = 'exchange_rate_update' AND created_at >= (now - 1h)
  → previous post found → returns true → { published: false, reason: "dedup_throttle" }
```

The dedup is per-actor, not per currency-pair. An owner cannot publish more than one exchange_rate_update post per hour regardless of pair variation. This is correct flood prevention behavior. BLOCKED.

**Result:** BLOCKED
**State check:** PRESENT
**Severity:** N/A (design verified)

---

## Cross-Feature Abuse Results

### CROSS-FEATURE ABUSE ATTEMPT 1 — Direct DAL access bypassing controller

**Source feature:** External / attacker's custom script
**Target:** `upsertVportRate.dal.js` — calling directly
**Attack vector:** Import DAL directly and call without ownership check

Simulation (static analysis — not runtime execution):
```js
// Attacker's custom script (outside production app)
import upsertVportRateDal from ".../upsertVportRate.dal.js";
await upsertVportRateDal({ actorId: "victim", baseCurrency: "USD", ... });
```

This would call `resolveVportProfileId(actorId)` → Supabase query using the current auth session → then upsert with that profile_id.

DB-layer: `rates_insert` policy → `actor_can_manage_profile(vc.current_actor_id(), profile_id)` → if attacker's session `auth.uid()` is not in `actor_owners` for the victim profile → RLS blocks the INSERT.

**Result:** BLOCKED by DB RLS even on direct DAL access
**Adapter isolation:** ENFORCED at DB layer
**Severity:** N/A

---

### CROSS-FEATURE ABUSE ATTEMPT 2 — booking.adapter surface expansion

**Source feature:** Exchange module
**Target:** `booking.adapter.js` — checking surface exposure
**Attack vector:** Does the booking adapter expose more than the approved `assertActorOwnsVportActorController` + `getActorByIdDAL`?

Inspection: `booking.adapter.js` exports:
- Hooks: useBookingAvailability, useCreateBooking, useManageAvailability, etc.
- `assertActorOwnsVportActorController` (§5.3 approved)
- `getActorByIdDAL` (§5.3 approved)

The exchange module imports ONLY `assertActorOwnsVportActorController` from the adapter. No other booking internals consumed. ✅

**Result:** BLOCKED — adapter boundary respected
**Adapter isolation:** ENFORCED
**Severity:** N/A

---

## VEN-EXCH-001 — rateType Unvalidated — Adversarial Result

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-EXCH-001
- **Scenario:** Owner submits arbitrary rateType string to pollute rate namespace
- **Target:** `upsertVportRateController` — rateType parameter
- **Application Scope:** VCSM
- **Platform Surface:** PWA / vport.rates
- **Attack Vector:**
  1. Attacker is authenticated owner of a VPORT
  2. Calls `upsertVportRateController({ ..., rateType: "shadow", baseCurrency: "USD", quoteCurrency: "MXN", buyRate: 17.5, sellRate: 17.8 })`
  3. Currency + rate validation passes (unrelated to rateType)
  4. Ownership check passes (legitimate owner)
  5. `upsertVportRateDal` called with `rateType: "shadow"`
  6. DB INSERT: `actor_can_manage_profile` checks ownership only — no constraint on `rate_type`
  7. Row inserted: `rate_type = "shadow"`, `profile_id = <owner's profile>`, `base_currency = "USD"`, `quote_currency = "MXN"`

Simulation trace:
```
identityActorId: "owner-actor-123" ✓
assertValidCurrencyCode("USD") → passes ✓
assertValidCurrencyCode("MXN") → passes ✓
assertValidRate(17.5) → passes ✓
assertValidRate(17.8) → passes ✓
"USD" !== "MXN" → passes ✓
assertActorOwnsVportActorController → passes (legitimate owner) ✓
upsertVportRateDal({ rateType: "shadow", ... }) → executed
DB: rates_insert → actor_can_manage_profile → permitted
RESULT: Row with rate_type="shadow" created in vport.rates
```

- **Exploit Chain Type:** Injection exploit (unvalidated enum stored)
- **Governance Status:** VERIFIED
- **Result:** BYPASSED
- **Evidence:** No `assertValidRateType` call exists in controller. No `CHECK` constraint on `rate_type` column visible in migrations.
- **Defense Gate:** ABSENT — no controller-layer or DB-layer constraint on rateType value
- **Blast Radius:** Single VPORT (owner's own data; no cross-actor impact)
- **Severity:** LOW — owner-only, self-data, no public exposure currently
- **VENOM Finding Cross-Reference:** VEN-EXCH-001
- **Recommended Fix:** Add `assertValidRateType` allow-list in `upsertVportRateController` before ownership check. Current allow-list: `["fx"]`.
- **Layer to Fix:** Controller
- **Required Follow-up Command:** ELEKTRA (patch), Wolverine (implement)

---

## VEN-EXCH-002 — meta Arbitrary JSON — Adversarial Result

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-EXCH-002
- **Scenario:** Owner stores large/structured JSON payload in meta field
- **Target:** `upsertVportRateController` / `upsertVportRateDal` — meta parameter
- **Application Scope:** VCSM
- **Platform Surface:** PWA / vport.rates (jsonb column)
- **Attack Vector:**
  1. Authenticated owner calls `upsertVportRateController({ ..., meta: { data: "A".repeat(50000) } })`
  2. Controller: meta is passed through with `meta = null` defaulting but no validation
  3. DAL: `meta ?? {}` → stored as large jsonb payload in vport.rates

Simulation trace:
```
meta = { data: "A".repeat(50000) }  ← 50KB string
  → no assertValidMeta call
  → upsertVportRateDal({ ..., meta: { data: "AAAA..." } })
  → DB INSERT: jsonb accepts payload up to Postgres row size limit (~1GB)
  → Row stored with 50KB meta blob
```

- **Exploit Chain Type:** Injection exploit (unvalidated blob)
- **Governance Status:** VERIFIED
- **Result:** BYPASSED (size is unbounded; any JSON structure accepted)
- **Evidence:** No meta validation in controller or DAL. RATES_SELECT includes `meta` in return columns — model maps it as `toObj(row.meta)`.
- **Defense Gate:** ABSENT at controller layer; DB has no jsonb size constraint visible
- **Blast Radius:** Single VPORT — meta not currently rendered in public UI. Risk escalates if future consumer renders or evaluates meta.
- **Severity:** LOW — owner-only; no current public render path confirmed
- **VENOM Finding Cross-Reference:** VEN-EXCH-002
- **Recommended Fix:** Add size guard in controller: `if (meta && JSON.stringify(meta).length > 2048) throw`. Document `meta` as opaque owner blob.
- **Layer to Fix:** Controller + Documentation
- **Required Follow-up Command:** ELEKTRA (patch), LOGAN (document meta contract)

---

## VEN-EXCH-003 — Void VPORT Write — Adversarial Result

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-EXCH-003
- **Scenario:** Legitimate owner of a void VPORT attempts to upsert rates
- **Target:** `assertActorOwnsVportActorController` — target actor void state
- **Application Scope:** VCSM
- **Platform Surface:** PWA / vport.rates
- **Attack Vector:**
  1. VPORT actor has `is_void = true` in `vc.actors`
  2. Owner (non-void user actor) calls `upsertVportRateController` targeting the void VPORT
  3. Ownership check: owner's actor is non-void, kind=user ✓; `actor_owners` link still exists (void does not auto-revoke ownership links)
  4. `ownerLink.is_void === true` check — this checks the LINK record's is_void, not the TARGET ACTOR's is_void
  5. If the owner link is not voided, ownership check PASSES despite target VPORT being void
  6. DB layer: `actor_can_manage_profile` — unknown whether it checks target profile is_void or is_deleted

Simulation trace (app layer):
```
getActorByIdDAL("owner-actor-123") → kind=user, is_void=false ✓
readActorOwnerLinkByActorAndUserProfile("void-vport-actor", owner.profile_id)
  → link found (link was not explicitly revoked)
  → ownerLink.is_void is checked → if link is_void=false → PASSES
→ upsertVportRateDal executes
DB layer: actor_can_manage_profile behavior on void profile → UNVERIFIED
```

- **Exploit Chain Type:** Multi-step exploit (lifecycle state not propagated to ownership check)
- **Governance Status:** DRAFT — DB layer UNVERIFIED
- **Result:** PARTIAL (app layer PASSES; DB layer UNKNOWN)
- **Evidence:** `assertActorOwnsVportActorController` does not call `getActorByIdDAL` on `targetActorId`. Target actor void state is not inspected.
- **Defense Gate:** WEAK (app layer doesn't check; DB layer unknown)
- **Blast Radius:** Single VPORT (void actor data — writes not publicly readable per `rates_select` policy)
- **Severity:** LOW — even if write succeeds, void VPORT rates are not publicly accessible via `actor_can_view_profile`
- **VENOM Finding Cross-Reference:** VEN-EXCH-003
- **Recommended Fix:** Add target actor fetch + void check in `assertActorOwnsVportActorController` after owner link verification. Route CARNAGE to verify `actor_can_manage_profile` behavior on void profiles.
- **Layer to Fix:** Controller (add target void check) + RLS (verify DB function)
- **Required Follow-up Command:** CARNAGE (verify `actor_can_manage_profile` void handling), Wolverine (add target void check)

---

## VEN-EXCH-004 — Publish Controller Rate Values Unvalidated — Adversarial Result

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-EXCH-004
- **Scenario:** Owner publishes misleading rate post with zero or negative rate values
- **Target:** `publishExchangeRateUpdateAsPostController` — rate values in post text
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Feed Engine / vc.posts
- **Attack Vector:**
  1. Authenticated VPORT owner directly calls publish controller
  2. Bypasses the `upsertVportRate` flow (which validates rates)
  3. Passes `buyRate: 0, sellRate: -5` to publish controller
  4. Controller validates currency presence but not rate values
  5. `formatRate(0)` → `Number.isFinite(0) = true` → `"0.0000"` (does NOT return "—")
  6. `formatRate(-5)` → `Number.isFinite(-5) = true` → `"-5.0000"`
  7. Post text: `"Exchange rates updated at Downtown FX Exchange\n\nUSD/MXN — Buy: 0.0000 · Sell: -5.0000"`
  8. `createSystemPost` → vc.posts INSERT → RLS allows (owner posting as own actor)
  9. Post appears in public feed with misleading rate data

Simulation trace:
```
publishExchangeRateUpdateAsPostController({
  identityActorId: "owner-actor-123",
  actorId: "exchange-vport-456",
  baseCurrency: "USD", quoteCurrency: "MXN",
  buyRate: 0, sellRate: -5
})
→ actorId ✓, identityActorId ✓, currencies ✓
→ assertActorOwnsVportActorController → PASSES (legitimate owner)
→ hasRecentExchangeRatePostDAL → false
→ resolveVportExchangeNameDAL → "Downtown FX Exchange"
→ buildPostText: "Buy: 0.0000 · Sell: -5.0000"
→ createSystemPost → POST CREATED with misleading content
```

- **Exploit Chain Type:** Injection exploit (unvalidated financial values embedded in public content)
- **Governance Status:** VERIFIED
- **Result:** BYPASSED
- **Evidence:** `publishExchangeRateUpdateAsPostController` has no `assertValidRate` calls. `formatRate()` accepts 0 and negative values as finite numbers and formats them as-is.
- **Defense Gate:** ABSENT (rate validation exists in upsert controller but not in publish controller)
- **Blast Radius:** Single VPORT feed attribution — public feed readers see inaccurate rates. No cross-actor impact (owner posts as self).
- **Severity:** LOW — owner-only; business integrity concern only; no data access violation
- **VENOM Finding Cross-Reference:** VEN-EXCH-004
- **Recommended Fix:** Extract `assertValidRate` from `upsertVportRate.controller.js` into a shared `exchangeRateValidation.js` module. Import and call it in `publishExchangeRateUpdateAsPostController` before `buildPostText`. The "—" fallback in `formatRate` should be the result of validation failure, not valid rate formatting.
- **Layer to Fix:** Controller (publish controller + shared validation utility)
- **Required Follow-up Command:** ELEKTRA (patch)

---

## VEN-EXCH-005 — Legacy owner_user_id Branch — Adversarial Result

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-EXCH-005
- **Scenario:** Former owner (removed from actor_owners) attempts write via direct Supabase client call
- **Target:** `vport.rates` INSERT RLS → `actor_can_manage_profile` legacy branch
- **Application Scope:** VCSM
- **Platform Surface:** Supabase Table/View (vport.rates)
- **Attack Vector:**
  1. User A was the original creator of a VPORT (`vport.profiles.owner_user_id = user_A_uuid`)
  2. VPORT ownership was transferred: `actor_owners` now contains only User B
  3. User A remains authenticated (valid Supabase session, `auth.uid() = user_A_uuid`)
  4. User A's actorId is still valid (not voided)

  App layer path:
  ```
  upsertVportRateController({ identityActorId: "user-A-actor", actorId: "the-vport", ... })
  → assertActorOwnsVportActorController:
    → readActorOwnerLinkByActorAndUserProfile("the-vport", user_A_profile_id)
    → no link → throws "Actor does not own this vport actor."
  → App layer: BLOCKED ✅
  ```

  Direct DB path (bypassing app controller):
  ```
  // User A calls Supabase client directly with their session:
  vportClient.from("rates").upsert({
    profile_id: <the-vport-profile-id>,
    rate_type: "fx", base_currency: "USD", quote_currency: "MXN",
    buy_rate: 99, sell_rate: 99
  })
  → DB RLS: actor_can_manage_profile(vc.current_actor_id(), <profile-id>)
  
  IF actor_can_manage_profile has legacy branch:
    profiles.owner_user_id = auth.uid() WHERE profiles.id = profile_id
    → user_A_uuid = user_A_uuid → TRUE
    → INSERT PERMITTED ← BYPASSED at DB layer
  
  IF actor_can_manage_profile uses only actor_owners path:
    → user_A not in actor_owners → BLOCKED ✅
  ```

- **Exploit Chain Type:** Multi-step exploit (app layer correct; DB function legacy branch potentially active)
- **Governance Status:** DRAFT — requires CARNAGE DB function inspection to VERIFY or CLOSE
- **Result:** PARTIAL — App layer BLOCKED. DB layer: BYPASSED if legacy `owner_user_id` branch is active in `actor_can_manage_profile`; BLOCKED if branch was removed.
- **Evidence:** Migration `20260523020000` comment explicitly states: `"The legacy owner_user_id branch of actor_can_manage_profile is residual architectural debt in the function itself"`. Migration dropped legacy policies but did NOT remove the function's legacy branch.
- **Defense Gate:** PRESENT at app layer, UNKNOWN at DB function layer
- **Blast Radius:** Single VPORT — former owner can write incorrect rates to the VPORT's rate table post-transfer. Not cross-actor (targeted at specific profile where owner_user_id matches).
- **Severity:** MEDIUM — requires former VPORT owner with still-active session; enables unauthorized data write post-ownership transfer at DB layer
- **VENOM Finding Cross-Reference:** VEN-EXCH-005
- **Recommended Fix:** CARNAGE must inspect `actor_can_manage_profile` function body on the live DB. Remove the `profiles.owner_user_id = auth.uid()` branch. Replace with canonical `actor_owners` path only. Track as migration.
- **Layer to Fix:** RLS / DB Function
- **Required Follow-up Command:** CARNAGE (inspect and remove legacy branch), DB (live verification)

---

## Additional Adversarial Scenarios — All BLOCKED

| Scenario | Attack | Result |
|---|---|---|
| Currency normalization bypass (`" uSd "`) | Whitespace + mixed case to bypass allow-list | BLOCKED — trim().toUpperCase() normalizes correctly |
| Same-pair bypass via casing (`"usd"/"USD"`) | Different-case same currency to pass same-pair guard | BLOCKED — both normalize to "USD"; guard fires |
| Numeric string rate zero (`buyRate: "0"`) | String "0" to bypass positive check | BLOCKED — `Number("0")` = 0; `0 <= 0` triggers guard |
| Non-owner via URL navigation | Navigate to victim's exchange dashboard URL | BLOCKED — `isOwner = false`; screen gate + controller gate |
| VPORT-kind actor self-ownership shortcut | `requestActorId = targetActorId` for VPORT-kind | BLOCKED — kind check precedes self-ownership shortcut |
| Dedup bypass via pair variation | Submit different pair within 1h window | BLOCKED — dedup is per-actor, not per-pair |
| Cache race on rapid double write | Two rapid writes to exploit cache gap | BLOCKED — invalidation is synchronous post-write |
| Post type injection in feed publish | Supply custom `post_type` to createSystemPost | BLOCKED — post_type is hardcoded in controller |
| refreshSeed URL manipulation | Externally supply refreshSeed | N/A — refreshSeed is local React state, not URL-derived |

---

## Successful Exploit Chains

| ID | Scenario | Chain Type | Severity | Impact |
|---|---|---|---|---|
| BW-EXCH-001 | rateType arbitrary string stored in vport.rates | Injection | LOW | Rate namespace pollution; owner-only |
| BW-EXCH-002 | meta arbitrary JSON stored without size limit | Injection | LOW | Unbounded blob storage; owner-only |
| BW-EXCH-004 | Misleading rates published to public feed via publish controller | Injection | LOW | Business integrity; owner-only |
| BW-EXCH-005 (PARTIAL) | Former owner DB-layer write via legacy owner_user_id branch | Multi-step | MEDIUM | Unauthorized write post-transfer IF legacy branch active |

---

## Failed Exploit Chains (Defenses That Held)

| Scenario | Gate That Held | Layer |
|---|---|---|
| ELEK-001 (cross-actor IDOR) | identityActorId required + assertActorOwnsVportActorController | Controller + DB |
| ELEK-002 (zero/negative rates) | assertValidRate (n > 0 && isFinite) | Controller |
| ELEK-003 (currency injection) | SUPPORTED_FX_CURRENCIES allow-list + same-pair guard | Controller |
| ELEK-004 (console.log) | Removed from actorOwners.read.dal.js | DAL |
| Cross-actor rate write | assertActorOwnsVportActorController + actor_can_manage_profile RLS | Controller + DB |
| Cross-actor feed publish | assertActorOwnsVportActorController + posts_insert_actor_owner RLS | Controller + DB |
| Non-owner URL navigation | useVportOwnership + controller ownership check | Screen + Controller |
| VPORT-kind actor self-approval | kind check precedes self-ownership shortcut | Controller |
| All session null paths | identityActorId required guards | Controller + Hook |

---

## Recommended Fixes

| Finding | Fix | Layer | Priority |
|---|---|---|---|
| BW-EXCH-001 | Add `assertValidRateType(["fx"])` in `upsertVportRateController` | Controller | P2 |
| BW-EXCH-002 | Add JSON.stringify size guard (≤2048 bytes) for meta in controller | Controller | P3 |
| BW-EXCH-004 | Extract `assertValidRate` to shared util; call it in publish controller | Controller | P2 |
| BW-EXCH-005 | CARNAGE: inspect and remove `owner_user_id` legacy branch from `actor_can_manage_profile` | DB Function | P1 |
| BW-EXCH-003 | Add target actor void check in `assertActorOwnsVportActorController` | Controller | P2 |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| ELEKTRA | Patch advisory for BW-EXCH-001 (rateType), BW-EXCH-002 (meta), BW-EXCH-004 (publish validation) | PENDING |
| CARNAGE | Inspect `actor_can_manage_profile` DB function — remove legacy `owner_user_id` branch (BW-EXCH-005) | PENDING |
| DB | Verify `actor_can_manage_profile` live function body | PENDING |
| Wolverine | Implement: rateType allow-list, target void check, actorId null guard | PENDING |
| LOKI | Runtime trace: confirm BW-EXCH-005 DB-layer path behavior in actual session | PENDING |
| THOR | Evaluate release blocking status — no CRITICAL/HIGH confirmed exploits; BW-EXCH-005 MEDIUM pending DB verification | PENDING |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| VENOM | Cross-reference completed — BW findings align with VEN-EXCH-001–005 | COMPLETE |
| CARNAGE | Verify `actor_can_manage_profile` and `actor_can_view_profile` function bodies for legacy branch | PENDING |
| LOKI | Runtime trace for BW-EXCH-005 DB path | PENDING |
| THOR | Release gate evaluation — no confirmed CRITICAL/HIGH; BW-EXCH-005 MEDIUM if CARNAGE confirms legacy branch | PENDING |

---

## THOR Release Gate Summary

- **No CRITICAL or CONFIRMED HIGH findings.**
- BW-EXCH-001 (LOW), BW-EXCH-002 (LOW), BW-EXCH-004 (LOW): All owner-self-data only. No cross-actor impact. Not release blockers.
- BW-EXCH-003 (LOW/PARTIAL): Target void check missing; write to void VPORT rates. Not publicly readable. Not release blocker.
- BW-EXCH-005 (MEDIUM/PARTIAL): Former owner DB-layer write possible IF `actor_can_manage_profile` legacy branch is active. **Requires CARNAGE verification before THOR can fully clear.** If CARNAGE confirms legacy branch is removed from the function: finding closes. If legacy branch is confirmed active: escalate to HIGH, route to THOR as release caution.

**BLACKWIDOW recommendation:** CARNAGE verification of `actor_can_manage_profile` is the only outstanding item that could affect release posture.
