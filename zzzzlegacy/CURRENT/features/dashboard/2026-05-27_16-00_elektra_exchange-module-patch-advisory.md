# ELEKTRA Security Report — Exchange Module Patch Advisory

**Date:** 2026-05-27
**Scope:** VCSM
**Reviewer:** ELEKTRA
**Scan Trigger:** BLACKWIDOW referral — BW-2705-01 (publish controller no identity binding), BW-2705-02 (no rate/currency validation)
**VENOM Cross-Reference:** `2026-05-27_15-00_venom_exchange-module-reverification.md`
**BLACKWIDOW Cross-Reference:** `2026-05-27_15-30_blackwidow_exchange-module-adversarial.md`
**Findings Summary:** 2 HIGH | 1 MEDIUM | 1 LOW | 1 INFO
**False Positives Rejected:** 4
**Suggested Patches:** 3

---

## Boundary Contract

Loaded: `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`
Application Scope: **VCSM**
Read-only scan. No source files modified. No patches applied.

---

## Executive Summary

ELEKTRA scanned the Exchange module's two primary vulnerability surfaces flagged by BLACKWIDOW: the `publishExchangeRateUpdateAsPostController` (which accepts a caller-provided `actorId` with no identity binding) and the `upsertVportRateController` (which accepts financial rate values with no server-side validation). Two HIGH findings were confirmed with full source-to-sink chains. The publish controller IDOR is directly exploitable by any authenticated user via React DevTools hook fiber access — severity depends on whether the `vc.posts` INSERT RLS migration (20260522010000) has been applied. The rate validation gap is exploitable by any legitimate exchange VPORT owner. Concrete, minimal patches are proposed for three files and one test update is recommended.

---

## ELEKTRA SCAN TARGET

```
Feature / Route / Engine: Exchange VPORT — Rate Upsert + Feed Post Publish
Application Scope: VCSM
Reason for scan: BW-2705-01 and BW-2705-02 confirmed by BLACKWIDOW — need precise patch advisory
Scan trigger: BLACKWIDOW referral
```

---

## ENTRY POINT MAP

```
Entry Point 1: /actor/:actorId/dashboard/exchange (VportDashboardExchangeScreen.jsx)
Input sources (user-controlled):
  - params.actorId (URL — VPORT actor being managed)
  - baseCurrency, quoteCurrency (form input)
  - buyRate, sellRate (form input)
  - shareToFeed (checkbox)
Trusted input boundary: Controller layer (upsertVportRateController, publishExchangeRateUpdateAsPostController)
Validation present at boundary:
  - upsertVportRateController: ownership check PRESENT; input validation ABSENT
  - publishExchangeRateUpdateAsPostController: ownership check ABSENT; identity binding ABSENT

Entry Point 2: usePublishExchangeRatePost hook (hook layer)
Input sources: actorId from props (traces to URL params)
Trusted input boundary: Hook should pass identity to controller
Validation present at boundary: ABSENT — hook does not read session identity
```

---

## High Findings

---

### SECURITY FINDING ELEK-2026-05-27-001

```
Finding ID:       ELEK-2026-05-27-001
Title:            IDOR — publishExchangeRateUpdateAsPostController accepts any actorId without identity verification
Category:         IDOR/BOLA
Severity:         HIGH
Status:           Open
Scope:            VCSM
Location:
  - apps/VCSM/src/features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller.js:20-48
  - apps/VCSM/src/features/profiles/kinds/vport/hooks/exchange/usePublishExchangeRatePost.js:4-20

Source:
  URL param → params.actorId (VportDashboardExchangeScreen.jsx:47)
  → passed as prop to usePublishExchangeRatePost({ actorId }) (line 68)
  → closed over in publishExchangeRatePost callback (usePublishExchangeRatePost.js:9)
  → passed as positional arg to publishExchangeRateUpdateAsPostController({ actorId }) (line 8-14)

Sink:
  createSystemPost({ actorId, ... }) → insertPost({ actor_id: actorId, user_id: user.id })
  File: apps/VCSM/src/features/upload/adapters/posts.adapter.js:15-27
  DAL: apps/VCSM/src/features/upload/dal/insertPost.dal.js:7-16 → vc.posts INSERT

Trust Boundary:
  publishExchangeRateUpdateAsPostController — line 20 — no identityActorId param, no assertActorOwnsVportActorController call

Impact:
  Any authenticated user can publish an "exchange_rate_update" system post attributed to any
  exchange VPORT's actor identity, without owning that VPORT.
  The feed post will appear under the victim VPORT's name with attacker-supplied rate values.
  Blast radius: feed-wide for victim VPORT's subscribers and public feed.

Evidence:
  publishExchangeRateUpdateAsPost.controller.js lines 20-27:
    export async function publishExchangeRateUpdateAsPostController({
      actorId,            ← no identityActorId
      baseCurrency,
      quoteCurrency,
      buyRate,
      sellRate,
    }) {
      if (!actorId) throw new Error("publishExchangeRateUpdateAsPost: actorId required");
      // ← no assertActorOwnsVportActorController call
      // ← no identity verification of any kind

  usePublishExchangeRatePost.js lines 4-20:
    export function usePublishExchangeRatePost({ actorId }) {
      // ← no useIdentity() call
      // ← actorId is from props (URL param), not from session
      const publishExchangeRatePost = useCallback(
        async ({ baseCurrency, quoteCurrency, buyRate, sellRate }) => {
          if (!actorId) return { published: false, reason: "no_actor" };
          return publishExchangeRateUpdateAsPostController({
            actorId,   ← caller-provided, not bound to session identity
            ...
          });
        },
        [actorId]  ← identity not in deps
      );

  VportDashboardExchangeScreen.jsx lines 65-68:
    // Hooks mounted BEFORE isOwner gate — hook is active on victim's dashboard
    const m = useUpsertVportRate({ actorId, rateType: "fx" });
    const { publishExchangeRatePost } = usePublishExchangeRatePost({ actorId });
    // actorId = params.actorId = VICTIM VPORT actorId (from URL)

Reproduction Steps:
  1. Authenticate as Actor A (any Citizen account)
  2. Navigate to /actor/{victimExchangeVportActorId}/dashboard/exchange
  3. Screen renders: "You can only manage exchange rates for your own vport."
  4. Open browser DevTools → React DevTools Profiler → locate mounted hook fiber for usePublishExchangeRatePost
  5. From fiber state, extract the publishExchangeRatePost callback
  6. Execute: publishExchangeRatePost({ baseCurrency: "USD", quoteCurrency: "MXN", buyRate: 100, sellRate: 99 })
  7. Controller receives actorId = victimActorId with no ownership check
  8. Feed post attributed to victim VPORT is created

Existing Defense:
  - Screen-level UI gate: if (!isOwner) returns early — form not rendered (PRESENT but UI-only)
  - createSystemPost adapter: checks supabase.auth.getUser() → requires authenticated session (PRESENT)
  - vc.posts INSERT RLS: posts_insert_actor_owner policy — status UNVERIFIED (may check user_id only, not actor_owners)

Why Defense Is Insufficient:
  - UI gate: bypassed via React DevTools hook fiber access; hook is mounted before gate
  - Auth check: validates session exists, not that session owns the target actor
  - RLS: CARNAGE 2026-05-22 confirms current policy checks user_id = auth.uid() only — no actor_owners join (migration 20260522010000 required but unverified)

Recommended Fix:
  1. Add identityActorId parameter to publishExchangeRateUpdateAsPostController
  2. Call assertActorOwnsVportActorController before any side effects
  3. Update usePublishExchangeRatePost to read identity.actorId from useIdentity() and pass it
  4. Verify vc.posts INSERT RLS migration 20260522010000 is applied in all environments

Suggested Patch:
  [See PATCH-1 and PATCH-2 below]

Follow-up Command: DB (verify vc.posts INSERT RLS), SPIDER-MAN (add regression tests), THOR (release gate)
```

---

### SECURITY FINDING ELEK-2026-05-27-002

```
Finding ID:       ELEK-2026-05-27-002
Title:            Financial Data Injection — zero, negative, and non-finite rate values accepted by controller
Category:         Injection (financial data integrity)
Severity:         HIGH
Status:           Open
Scope:            VCSM
Location:
  apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js:18-29

Source:
  Form input → VportDashboardExchangeScreen.jsx:59-60 (buyRate, sellRate state)
  → onSave handler → m.upsert({ buyRate, sellRate }) (line 112-119)
  → useUpsertVportRate → upsertVportRateController({ buyRate, sellRate })

Client-side transform (INSUFFICIENT):
  VportDashboardExchangeScreen.jsx:29-32:
    function toNumOrNull(v) {
      if (v === null || v === undefined || String(v).trim() === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;  ← passes 0, -999, etc.
    }
  Note: toNumOrNull is ONLY defined at screen layer; controller receives raw values from hook

Sink:
  upsertVportRateDal({ buyRate, sellRate })
  File: apps/VCSM/src/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js:25-43
  → vport.rates UPSERT (buy_rate, sell_rate columns)
  → If shareToFeed: publishExchangeRatePost({ buyRate, sellRate })
    → buildPostText: "Buy: 0.0000 · Sell: -500.0000"
    → vc.posts.text INSERT

Trust Boundary:
  upsertVportRateController — no buyRate/sellRate range validation before line 18 DAL call

Impact:
  Exchange VPORT owner stores zero or negative exchange rates in vport.rates.
  Rates are displayed publicly on the VPORT profile (VportRatesView) as authoritative financial data.
  If shareToFeed = true: feed post broadcast with invalid rate values to all subscribers.
  Financial risk: visitors may transact based on displayed rates (buy 0 → implies free exchange).

Evidence:
  upsertVportRate.controller.js:18-29:
    const result = await upsertVportRateDal({
      actorId,
      rateType,
      baseCurrency,    ← any string accepted
      quoteCurrency,   ← any string accepted
      buyRate,         ← any value accepted (0, -999, null all reach DAL)
      sellRate,        ← any value accepted
      meta,
    });
  No guard between ownership check (line 16) and DAL call (line 18) for rate values.

  Gas VPORT controller (comparison):
    submitFuelPriceSuggestion.controller.js includes:
      if (price <= 0) throw new Error("Price must be positive");
      if (price > settings.maxPrice) throw new Error(...);
    Exchange VPORT has no equivalent gate.

Reproduction Steps:
  1. Authenticate as owner of an exchange VPORT
  2. Navigate to /actor/{ownedVportActorId}/dashboard/exchange
  3. In the form: set buyRate = "0", sellRate = "-500"
  4. Click submit (onSave)
  5. toNumOrNull("0") → 0 (finite, passes)
  6. toNumOrNull("-500") → -500 (finite, passes)
  7. Controller receives buyRate: "0", sellRate: "-500" (raw string from form state)
  8. No validation at controller — passes directly to DAL
  9. vport.rates: buy_rate = 0, sell_rate = -500 stored

Existing Defense:
  - toNumOrNull at screen layer: converts to null for Infinity, NaN, empty strings (PRESENT but CLIENT-SIDE ONLY)
  - No controller-layer validation (ABSENT)
  - No DB CHECK constraint on vport.rates buy_rate/sell_rate (UNVERIFIED — not confirmed present)

Why Defense Is Insufficient:
  - Client-side toNumOrNull is bypassed: (a) if screen is ever bypassed (hook access), (b) if
    the hook is called with pre-converted numeric values, 0 and -999 pass toNumOrNull since
    Number.isFinite(0) = true and Number.isFinite(-999) = true
  - The gas VPORT type has server-side validation; exchange does not — asymmetric risk

Recommended Fix:
  1. Add assertValidRate() and assertValidCurrencyCode() functions in upsertVportRateController
  2. Validate buyRate > 0, sellRate > 0 before ownership check (fast-fail on bad input)
  3. Validate baseCurrency and quoteCurrency against ISO 4217 allow-list
  4. Reject baseCurrency === quoteCurrency (same-currency pair is not a valid FX rate)
  5. (Optional DB defense): Carnage to propose CHECK constraints on vport.rates

Suggested Patch:
  [See PATCH-3 below]

Follow-up Command: Wolverine (apply), Carnage (DB CHECK constraint), SPIDER-MAN (regression tests)
```

---

## Medium Findings

---

### SECURITY FINDING ELEK-2026-05-27-003

```
Finding ID:       ELEK-2026-05-27-003
Title:            Content Injection — arbitrary currency code strings stored in vport.rates and broadcast to feed
Category:         Injection (content integrity)
Severity:         MEDIUM
Status:           Open
Scope:            VCSM
Location:
  apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js:18-29
  apps/VCSM/src/features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller.js:13-17

Source:
  Form input → normalizeCurrencyCode (screen-level) → baseCurrency, quoteCurrency state
  → onSave → m.upsert({ baseCurrency, quoteCurrency })
  → upsertVportRateController → upsertVportRateDal

Client-side transform (INSUFFICIENT):
  VportDashboardExchangeScreen.jsx:21-26:
    function normalizeCurrencyCode(v) {
      return String(v ?? "").trim().toUpperCase().replace(/\s+/g, "");
    }
  Normalizes case and whitespace. Does NOT validate against ISO 4217 allow-list.

Sink 1: vport.rates.base_currency / quote_currency
  → rendered in VportRatesView as rate table column headers (public VPORT profile)

Sink 2: vc.posts.text (if shareToFeed)
  publishExchangeRateUpdateAsPost.controller.js:13-17:
    function buildPostText({ exchangeName, baseCurrency, quoteCurrency, buyRate, sellRate }) {
      const pair = `${baseCurrency}/${quoteCurrency}`;  ← unvalidated string in post text
      ...
      return `Exchange rates updated at ${name}\n\n${pair} — ${rates}`;
    }
  → stored in vc.posts.text → rendered in public feed

Trust Boundary:
  upsertVportRateController — no currency code allow-list validation

Impact:
  Exchange VPORT owner stores arbitrary strings ("FAKE", "GARBAGE", 200-char strings) in vport.rates
  and feed posts. Public profile and feed show misleading/nonsensical currency pair labels.
  React text rendering prevents HTML/JS XSS (strings are escaped). Risk is content integrity,
  not code execution.

Evidence:
  No currency code validation in controller or DAL. normalizeCurrencyCode only uppercases/trims.
  Any non-empty string passes. "FAKE", "DROP", "TESTTESTTEST" all stored successfully.

Reproduction Steps:
  1. Owner submits baseCurrency = "FAKE", quoteCurrency = "GARBAGE" via form
  2. normalizeCurrencyCode → "FAKE", "GARBAGE"
  3. Controller receives — no allow-list check — passes to DAL
  4. vport.rates: base_currency = "FAKE", quote_currency = "GARBAGE"
  5. VportRatesView renders: "FAKE / GARBAGE" as rate header on public VPORT profile

Existing Defense:
  - normalizeCurrencyCode: whitespace/case normalization (PRESENT but not allow-list)
  - No controller-layer allow-list (ABSENT)

Why Defense Is Insufficient:
  - Normalization does not constrain the value set — any uppercase non-empty string passes

Recommended Fix:
  Validate baseCurrency and quoteCurrency against SUPPORTED_FX_CURRENCIES set in controller.
  This is included in PATCH-3 for upsertVportRateController.

Suggested Patch:
  [Included in PATCH-3 — assertValidCurrencyCode()]

Follow-up Command: Wolverine
```

---

## Low Findings

---

### SECURITY FINDING ELEK-2026-05-27-004

```
Finding ID:       ELEK-2026-05-27-004
Title:            console.log of actorId + userId in security-critical DAL
Category:         Injection (debug leakage — dev-only)
Severity:         LOW
Status:           Open
Scope:            VCSM
Location:
  apps/VCSM/src/features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js:5-7

Source: actorId and userId passed as arguments to dalReadActorOwnerRow
Sink: console.log — browser console output
Trust Boundary: Dev/prod environment gate
Impact: userId (Supabase auth user ID) logged to browser console in development mode

Evidence:
  if (import.meta.env?.DEV) {
    console.log("[dalReadActorOwnerRow] actorId=", actorId, "userId=", userId);
  }
  This violates the project debug logging rule (no console.log; dev output must render on screen)
  and normalizes logging sensitive identity fields even in guarded contexts.

Existing Defense: import.meta.env?.DEV guard (PRESENT) — not production-visible

Why Defense Is Insufficient:
  - Project rule: no console.log regardless of env guard
  - Logs security-sensitive field (userId = raw Supabase auth UID)

Recommended Fix: Remove console.log. If debug visibility is needed, create a debugger panel
  in zNOTFORPRODUCTION/debuggers/ per the project debugger architecture pattern.

Suggested Patch: [See PATCH-4 below — one-line removal]

Follow-up Command: LOGAN (document pattern violation)
```

---

## Info Findings

---

### SECURITY FINDING ELEK-2026-05-27-005

```
Finding ID:       ELEK-2026-05-27-005
Title:            createSystemPost adapter — no actor ownership verification (systemic surface)
Category:         IDOR/BOLA (systemic design concern)
Severity:         INFO
Status:           Open
Scope:            VCSM
Location:
  apps/VCSM/src/features/upload/adapters/posts.adapter.js:4-28

Source: actorId parameter — accepted from any caller
Sink: insertPost({ actor_id: actorId }) → vc.posts INSERT
Trust Boundary: Adapter layer — no ownership verification

Impact:
  The adapter is a shared publish surface for 8 VPORT system post controllers.
  It verifies authentication (user is logged in) but does not verify that the
  authenticated user owns the actorId they are posting as.
  This means every controller that calls createSystemPost is responsible for
  its own ownership gate — if any controller omits the gate (as publishExchangeRateUpdateAsPost
  currently does), the adapter provides no backstop.

Evidence:
  createSystemPost({ actorId, text, post_type, realm_id, ... }) {
    // Checks: actorId present, text present, post_type present, realm_id present, user authenticated
    // Does NOT check: actor_owners relationship between user and actorId
    return insertPost({ actor_id: actorId, user_id: user.id, ... });
  }

Existing Defense:
  - vc.posts INSERT RLS: backstop — if migration 20260522010000 is applied, DB blocks unauthorized inserts
  - Individual controller gates: upsertVportRateController has ownership check (PRESENT)
  - publishExchangeRateUpdateAsPostController: no gate (ABSENT — addressed in ELEK-2026-05-27-001)

Why Defense Is Insufficient (as systemic risk):
  Any future controller that calls createSystemPost without an upstream ownership check
  would immediately inherit this gap. The adapter offers no defense-in-depth.

Recommended Fix (defense-in-depth option — requires architectural approval):
  Option A (current pattern — preferred): Each controller owns its gate. Fix ELEK-2026-05-27-001.
  Option B (adapter-level gate): Add identityActorId param + assertActorOwnsVportActorController
  to createSystemPost. This adds an ownership check at the adapter boundary regardless of caller.
  Trade-off: requires importing booking adapter from upload adapter (cross-adapter dependency —
  review for circular dependency risk before adopting).
  Recommendation: Fix Option A (ELEK-2026-05-27-001 patch) now; adopt Option B as a future
  hardening pass if the adapter ever surfaces in a new VPORT type without a controller gate.

Suggested Patch: [None for this finding — addressed by PATCH-1 which fixes the specific controller]

Follow-up Command: VENOM (note systemic surface in next full scan)
```

---

## False Positives Rejected

---

```
FALSE POSITIVE REJECTED

Candidate:       XSS via currency code or rate text in feed post
Location:        publishExchangeRateUpdateAsPost.controller.js:13-17 → buildPostText → vc.posts.text
Rejection reason: Sink does not execute user-controlled string as code
Chain gap:        Sink
Notes:
  buildPostText constructs: `${baseCurrency}/${quoteCurrency} — Buy: X · Sell: Y`
  This string is stored in vc.posts.text and rendered by React in the feed.
  React's JSX string rendering (no dangerouslySetInnerHTML) escapes HTML by default.
  Even if baseCurrency = "<script>alert(1)</script>", React renders it as text content,
  not as an HTML tag. No XSS execution path exists. Finding rejected.
```

---

```
FALSE POSITIVE REJECTED

Candidate:       SQL injection via buyRate/baseCurrency passed to Supabase
Location:        upsertVportRate.dal.js:25-43
Rejection reason: Supabase JS client uses parameterized PostgREST API — no raw string interpolation
Chain gap:        Sink
Notes:
  upsertVportRateDal constructs a Supabase query builder call:
    vportSchema.from("rates").upsert({ buy_rate: buyRate, base_currency: baseCurrency, ... })
  The Supabase client serializes this to a PostgREST REST call with JSON body.
  Values are not string-interpolated into SQL — they are bound parameters.
  SQL injection is not possible through this path. Finding rejected.
```

---

```
FALSE POSITIVE REJECTED

Candidate:       windowMs=0 exploit accessible from production UI
Location:        vportExchangeRatePost.read.dal.js:16
Rejection reason: windowMs is not exposed through any hook, controller, or UI surface in production code
Chain gap:        Source
Notes:
  hasRecentExchangeRatePostDAL({ actorId, windowMs = DEDUP_WINDOW_MS }) exports windowMs as a
  parameter. However, the only caller in the production code path is:
    publishExchangeRateUpdateAsPostController → hasRecentExchangeRatePostDAL({ actorId })
  No windowMs is passed — the default (1 hour) is always used.
  windowMs=0 bypass requires direct DAL import from a different code path (not current).
  Not a current production exploit. Noted as LOW in VENOM (VE-2705-04). Rejected as HIGH here.
```

---

```
FALSE POSITIVE REJECTED

Candidate:       profile_id leaked to client browser via hook state
Location:        upsertVportRate.dal.js RATES_SELECT + useUpsertVportRate.js state
Rejection reason: profile_id does not reach rendered output — model strips it before UI render
Chain gap:        Sink (impact not confirmed at client-facing layer)
Notes:
  RATES_SELECT includes profile_id. Controller returns raw DAL result including profile_id.
  Hook stores it in state.data. However:
    - The screen applies mapVportRateRow(saved) which omits profile_id from output
    - mapVportRateRow does not include profile_id in its return object
    - The UI renders the mapped output, not hook.data directly
  profile_id is in intermediate hook state but does not reach any rendered element or
  API response surface. Risk is dev tooling exposure (internal state inspection), not
  a client-facing leak. Retained as MEDIUM in VENOM for hygiene, rejected as HIGH here.
```

---

## Suggested Patches

*These patches are for human review only. ELEKTRA does not apply them.*

---

### PATCH-1: publishExchangeRateUpdateAsPost.controller.js — Add identity binding + ownership gate

**File:** `apps/VCSM/src/features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller.js`
**Finding:** ELEK-2026-05-27-001
**Complexity:** SIMPLE — one file, three additions (import, param, guard)
**Requires DB change:** No (but DB RLS verification required separately)

```diff
  import {
    resolveVportExchangeNameDAL,
    hasRecentExchangeRatePostDAL,
  } from "@/features/profiles/kinds/vport/dal/exchange/vportExchangeRatePost.read.dal";
  import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
  import { PUBLIC_REALM_ID } from "@/shared/utils/resolveRealm";
+ import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";
  
  function formatRate(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(4) : "—";
  }
  
  function buildPostText({ exchangeName, baseCurrency, quoteCurrency, buyRate, sellRate }) {
    const name = exchangeName ?? "this exchange";
    const pair = `${baseCurrency}/${quoteCurrency}`;
    const rates = `Buy: ${formatRate(buyRate)} · Sell: ${formatRate(sellRate)}`;
    return `Exchange rates updated at ${name}\n\n${pair} — ${rates}`;
  }
  
  export async function publishExchangeRateUpdateAsPostController({
+   identityActorId,
    actorId,
    baseCurrency,
    quoteCurrency,
    buyRate,
    sellRate,
  }) {
    if (!actorId) throw new Error("publishExchangeRateUpdateAsPost: actorId required");
+   if (!identityActorId) throw new Error("publishExchangeRateUpdateAsPost: identityActorId required");
    if (!baseCurrency || !quoteCurrency) return { published: false, reason: "missing_currencies" };
  
+   await assertActorOwnsVportActorController({
+     requestActorId: identityActorId,
+     targetActorId: actorId,
+   });
+
    const realmId = PUBLIC_REALM_ID;
    if (!realmId) return { published: false, reason: "missing_public_realm" };
  
    const alreadyPosted = await hasRecentExchangeRatePostDAL({ actorId });
    if (alreadyPosted) return { published: false, reason: "dedup_throttle" };
  
    const exchangeName = await resolveVportExchangeNameDAL(actorId);
    const text = buildPostText({ exchangeName, baseCurrency, quoteCurrency, buyRate, sellRate });
  
    const created = await createSystemPost({
      actorId,
      text,
      post_type: "exchange_rate_update",
      realm_id: realmId,
      media_url: null,
    });
  
    return { published: true, postId: created?.id ?? null };
  }
```

**Notes on ordering:** The ownership check is placed after the `baseCurrency`/`quoteCurrency` presence check (fast-fail on missing currencies) but before the dedup DAL query. This avoids a DB round-trip if currencies are missing, and avoids false dedup registration for unauthorized callers.

---

### PATCH-2: usePublishExchangeRatePost.js — Bind session identity + pass to controller

**File:** `apps/VCSM/src/features/profiles/kinds/vport/hooks/exchange/usePublishExchangeRatePost.js`
**Finding:** ELEK-2026-05-27-001
**Complexity:** SIMPLE — two imports added, one guard added, one param added, deps updated

```diff
- import { useCallback } from "react";
+ import { useCallback, useMemo } from "react";
+ import { useIdentity } from "@/state/identity/identityContext";
  import { publishExchangeRateUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller";
  
  export function usePublishExchangeRatePost({ actorId }) {
+   const { identity } = useIdentity();
+   const identityActorId = useMemo(() => identity?.actorId ?? null, [identity]);
+
    const publishExchangeRatePost = useCallback(
      async ({ baseCurrency, quoteCurrency, buyRate, sellRate }) => {
        if (!actorId) return { published: false, reason: "no_actor" };
+       if (!identityActorId) return { published: false, reason: "no_identity" };
        return publishExchangeRateUpdateAsPostController({
+         identityActorId,
          actorId,
          baseCurrency,
          quoteCurrency,
          buyRate,
          sellRate,
        });
      },
-     [actorId]
+     [actorId, identityActorId]
    );
  
    return { publishExchangeRatePost };
  }
```

**Pattern note:** This mirrors the exact pattern used in `useUpsertVportRate.js` (lines 18-20), which reads `identity?.actorId` via `useMemo` and passes it as `identityActorId`. Consistent with the hook contract.

---

### PATCH-3: upsertVportRate.controller.js — Add rate validation + currency allow-list

**File:** `apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js`
**Finding:** ELEK-2026-05-27-002, ELEK-2026-05-27-003
**Complexity:** MODERATE — two validation helpers + allow-list constant added; no schema change

```diff
  import upsertVportRateDal from "@/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js";
  import { invalidateRatesCache } from "@/features/profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js";
  import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";
  
+ // ISO 4217 currency allow-list.
+ // Extend as the platform adds new supported trading pairs.
+ const SUPPORTED_FX_CURRENCIES = new Set([
+   "USD", "EUR", "GBP", "MXN", "CAD", "AUD", "JPY", "CHF", "CNY", "INR",
+   "BRL", "KRW", "SGD", "HKD", "NOK", "SEK", "DKK", "CZK", "PLN", "HUF",
+   "RON", "TRY", "ZAR", "ARS", "CLP", "COP", "PEN", "GTQ", "HNL", "NIO",
+   "CRC", "PAB", "DOP", "CUP", "JMD", "TTD", "BBD", "BZD", "XCD",
+ ]);
+
+ function assertValidRate(name, value) {
+   const n = Number(value);
+   if (!Number.isFinite(n) || n <= 0) {
+     throw new Error(
+       `upsertVportRateController: ${name} must be a positive finite number — received ${JSON.stringify(value)}`
+     );
+   }
+   return n;
+ }
+
+ function assertValidCurrencyCode(name, value) {
+   const code = String(value ?? "").trim().toUpperCase();
+   if (!code || !SUPPORTED_FX_CURRENCIES.has(code)) {
+     throw new Error(
+       `upsertVportRateController: ${name} must be a supported ISO 4217 currency code — received "${code}"`
+     );
+   }
+   return code;
+ }
+
  export default async function upsertVportRateController({
    identityActorId,
    actorId,
    rateType = "fx",
    baseCurrency,
    quoteCurrency,
    buyRate,
    sellRate,
    meta = null,
  } = {}) {
    if (!identityActorId) throw new Error("upsertVportRateController: identityActorId required");
+
+   // Validate inputs before ownership check — fast-fail on malformed data
+   const validatedBase  = assertValidCurrencyCode("baseCurrency", baseCurrency);
+   const validatedQuote = assertValidCurrencyCode("quoteCurrency", quoteCurrency);
+   const validatedBuy   = assertValidRate("buyRate", buyRate);
+   const validatedSell  = assertValidRate("sellRate", sellRate);
+   if (validatedBase === validatedQuote) {
+     throw new Error("upsertVportRateController: baseCurrency and quoteCurrency must differ");
+   }
+
    await assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId });
  
    const result = await upsertVportRateDal({
      actorId,
      rateType,
-     baseCurrency,
-     quoteCurrency,
-     buyRate,
-     sellRate,
+     baseCurrency: validatedBase,
+     quoteCurrency: validatedQuote,
+     buyRate: validatedBuy,
+     sellRate: validatedSell,
      meta,
    });
  
    invalidateRatesCache();
    return result;
  }
```

**Ordering rationale:** Input validation runs before `assertActorOwnsVportActorController` so:
1. Malformed data fails immediately without a DB round-trip (cost savings, no false ownership errors)
2. The validated/coerced values (`validatedBase`, `validatedBuy`, etc.) flow into both the ownership assertion context and the DAL, ensuring consistency

**DB defense-in-depth (delegate to Carnage):**
```sql
-- Proposed DB constraint — delegate to Carnage for review and migration
ALTER TABLE vport.rates
  ADD CONSTRAINT rates_buy_rate_positive CHECK (buy_rate > 0),
  ADD CONSTRAINT rates_sell_rate_positive CHECK (sell_rate > 0);
-- Note: if existing rows have null or zero values, add a WHERE clause or update before applying
```

---

### PATCH-4: actorOwners.read.dal.js — Remove console.log

**File:** `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js`
**Finding:** ELEK-2026-05-27-004
**Complexity:** SIMPLE — remove 3 lines

```diff
  export async function dalReadActorOwnerRow({ actorId, userId } = {}) {
-   if (import.meta.env?.DEV) {
-     console.log("[dalReadActorOwnerRow] actorId=", actorId, "userId=", userId);
-   }
-
    if (!actorId || !userId) return null;
    ...
  }
```

---

## Test Coverage Advisory

The following test updates are required after patches are applied. Delegate to SPIDER-MAN.

### Test file: `upsertVportRate.controller.test.js`

Add test groups:

```
describe("upsertVportRateController — rate validation") {
  it("throws when buyRate = 0")
  it("throws when buyRate < 0")
  it("throws when sellRate = 0")
  it("throws when sellRate < 0")
  it("throws when buyRate is not a finite number")
  it("throws when baseCurrency is not in ISO 4217 allow-list")
  it("throws when quoteCurrency is not in ISO 4217 allow-list")
  it("throws when baseCurrency === quoteCurrency")
  it("passes valid rates through to DAL with coerced types")
}
```

### Test file: `publishExchangeRateUpdateAsPost.controller.test.js`

Add test groups:

```
describe("publishExchangeRateUpdateAsPostController — identity guard") {
  it("throws when identityActorId is missing")
  it("throws ownership error when identityActorId does not own actorId")
  it("does not call hasRecentExchangeRatePostDAL when ownership fails")
  it("does not call createSystemPost when ownership fails")
  it("calls assertActorOwnsVportActorController with correct params")
}
```

Mock additions needed:
```js
vi.mock("@/features/booking/adapters/booking.adapter", () => ({
  assertActorOwnsVportActorController: vi.fn(),
}));
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-05-27-001 | IDOR — publish controller no identity binding | HIGH | Controller + Hook | SIMPLE | No (but verify RLS) |
| 2 | ELEK-2026-05-27-002 | Financial data injection — zero/negative rates | HIGH | Controller | MODERATE | Recommended (CHECK constraint) |
| 3 | ELEK-2026-05-27-003 | Content injection — unvalidated currency codes | MEDIUM | Controller | MODERATE | No (included in PATCH-3) |
| 4 | ELEK-2026-05-27-004 | console.log with userId in DAL | LOW | DAL | SIMPLE | No |
| — | ELEK-2026-05-27-005 | createSystemPost systemic surface (INFO) | INFO | Adapter (future) | COMPLEX | No |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| SPIDER-MAN | Add regression tests for PATCH-1 (ownership guard) and PATCH-3 (validation) | PENDING — required before merge |
| DB | Verify vc.posts INSERT RLS migration 20260522010000 applied; confirm actor_owners JOIN in policy | PENDING — CRITICAL |
| Carnage | Propose DB CHECK constraints: vport.rates (buy_rate > 0, sell_rate > 0) | PENDING |
| THOR | Release gate evaluation — ELEK-2026-05-27-001 and ELEK-2026-05-27-002 are HIGH open findings | PENDING |
| VENOM | Cross-reference systemic createSystemPost surface (ELEK-2026-05-27-005) in next full scan | PENDING |

---

## THOR Release Gate Assessment

| Finding | Severity | Status | THOR Gate |
|---|---|---|---|
| ELEK-2026-05-27-001: Publish IDOR | HIGH | Open | **BLOCK** — must patch before exchange feed publish ships |
| ELEK-2026-05-27-002: Rate injection | HIGH | Open | **BLOCK** — financial data integrity |
| ELEK-2026-05-27-003: Currency code | MEDIUM | Open | CAUTION — included in PATCH-3, fix is grouped |
| ELEK-2026-05-27-004: console.log | LOW | Open | No gate |
| ELEK-2026-05-27-005: createSystemPost | INFO | Open | No gate |

---

*ELEKTRA is read-only. No source files were modified. All patches are advisory only — for human review and application.*
*Scope: VCSM. No cross-root violations occurred.*
