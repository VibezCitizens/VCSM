# ELEKTRA Security Report

**Date:** 2026-05-27 · 18:00
**Scope:** VCSM — VPORT Exchange Rate Module
**Reviewer:** ELEKTRA
**Scan Trigger:** VENOM cross-reference (VEN-EXCH-001–005) + BLACKWIDOW referral (BW-EXCH-001–005)
**Findings Summary:** 0 HIGH | 1 MEDIUM | 3 LOW | 2 INFO
**False Positives Rejected:** 4
**Suggested Patches:** 5 (1 DB advisory only)

---

## Executive Summary

ELEKTRA completed a full source-to-sink chain validation of the VPORT Exchange Rate module write surfaces following the 2026-05-27 hardening cycle. All prior ELEK-001–004 fixes were confirmed closed at code level. Five new findings were evaluated: one MEDIUM (DB function legacy branch — requires CARNAGE, no JS patch), three LOW (rateType allow-list, publish rate validation, target void check), and two INFO (meta size guard, actorId null guard placement). No HIGH findings were identified. No secrets exposure, XSS, open redirect, or SSRF surfaces were found. The module's primary write path (upsert → ownership → DAL → RLS) is well-hardened. The only actionable items requiring code changes are LOW severity and are scoped to `upsertVportRateController` and `publishExchangeRateUpdateAsPostController`.

---

## ENTRY POINT MAP

| Route / Controller | Input Sources | Trusted Boundary | Validation Present |
|---|---|---|---|
| `upsertVportRateController` | `rateType`, `baseCurrency`, `quoteCurrency`, `buyRate`, `sellRate`, `meta` from caller | Controller layer | PARTIAL — currency + rate validated; rateType + meta not validated |
| `publishExchangeRateUpdateAsPostController` | `actorId`, `identityActorId`, `baseCurrency`, `quoteCurrency`, `buyRate`, `sellRate` from caller | Controller layer | PARTIAL — currency presence checked; rate values not validated |
| `assertActorOwnsVportActorController` | `requestActorId`, `targetActorId` from callers | Controller layer | PARTIAL — requester void checked; target void not checked |
| `VportDashboardExchangeScreen` → hooks | Form state: `baseCurrency`, `quoteCurrency`, `buyRate`, `sellRate`, `shareToFeed` | Screen + hook layer | PRESENT — all write paths flow to controllers above |

---

## Medium Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-005
- Title:              DB Function actor_can_manage_profile Retains Legacy owner_user_id Branch
- Category:           Supabase RLS
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           DB function: vport.actor_can_manage_profile (live DB — not a JS file)
                      Evidence source: apps/VCSM/supabase/migrations/20260523020000_fix_vport_rates_rls.sql
                      (migration comment, lines 14–18)
- Source:             Authenticated Supabase session (auth.uid()) of a user who was formerly
                      the original creator of a VPORT profile (profiles.owner_user_id = their uuid)
- Sink:               vport.rates INSERT / UPDATE / DELETE — permitted by actor_can_manage_profile
                      when auth.uid() matches profiles.owner_user_id
- Trust Boundary:     vport.rates INSERT/UPDATE/DELETE RLS → actor_can_manage_profile DB function
- Impact:             A user removed from actor_owners (ownership transferred to another actor)
                      retains DB-layer write access to vport.rates for the profile they originally
                      created, if actor_can_manage_profile still has the legacy owner_user_id branch.
                      Application-layer assertActorOwnsVportActorController correctly blocks this
                      at the controller level. Risk only materializes if the DB is accessed directly
                      (e.g., via Supabase client with valid session, bypassing the app controller).
- Evidence:           Migration 20260523020000 comment (lines 14–18):
                      "The legacy owner_user_id branch of actor_can_manage_profile is residual
                      architectural debt in the function itself; removing it from policies is
                      the first step toward full contract compliance."
                      Migration drops legacy policies but explicitly does NOT modify the function body.
- Reproduction Steps: 
  1. User A creates a VPORT — profiles.owner_user_id = user_A_uuid
  2. VPORT ownership transferred — actor_owners now contains only User B
  3. User A retains authenticated session (auth.uid() = user_A_uuid)
  4. User A calls Supabase client directly: vportClient.from("rates").upsert({profile_id: X, ...})
  5. DB: actor_can_manage_profile(vc.current_actor_id(), X) evaluates
  6. If legacy branch: profiles.owner_user_id = user_A_uuid → auth.uid() match → PERMITS INSERT
  7. User A's rate write succeeds at DB layer despite removal from actor_owners
- Existing Defense:   assertActorOwnsVportActorController at application layer BLOCKS this path
                      via actor_owners verification — correct and enforced.
                      App-layer defense is complete. Only direct DB access (bypassing controllers)
                      exposes this risk.
- Why Defense Is Insufficient:
                      Application-layer defense cannot compensate for DB RLS that permits direct
                      Supabase client writes. Any user with a valid session and the victim's
                      profile_id can bypass the app controller entirely. The DB must be
                      the final defense layer for writes.
- Recommended Fix:    CARNAGE must inspect the actor_can_manage_profile DB function body on the
                      live DB. Remove the profiles.owner_user_id = auth.uid() branch. Replace
                      with the canonical actor_owners path only (via profile_actor_access).
- Suggested Patch:    DB ADVISORY — no JS patch. Route to CARNAGE.

  -- CARNAGE migration: remove legacy branch from actor_can_manage_profile
  -- Expected current function body (partial — confirm with live inspection):
  --   RETURN (
  --     profiles.owner_user_id = auth.uid()   ← REMOVE THIS BRANCH
  --     OR
  --     EXISTS (SELECT 1 FROM vport.profile_actor_access pa
  --       WHERE pa.profile_id = <arg> AND pa.user_id = auth.uid())
  --   );
  --
  -- Target function body after fix:
  --   RETURN (
  --     EXISTS (SELECT 1 FROM vport.profile_actor_access pa
  --       WHERE pa.profile_id = <arg> AND pa.user_id = auth.uid())
  --   );
  --
  -- Note: actor_can_view_profile may have the same legacy branch. Inspect both.

- Follow-up Command:  CARNAGE (inspect function body, plan migration to remove legacy branch)
                      DB (live DB verification of function body)
```

---

## Low Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-001
- Title:              rateType Parameter Stored Without Allow-List Validation
- Category:           Injection (enum injection / unvalidated type field)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js
                      Line 38 (function signature: rateType = "fx")
                      Line 57 (passed to upsertVportRateDal)
- Source:             rateType parameter — caller-supplied, defaults to "fx" but accepts any string
- Sink:               upsertVportRateDal → vport.rates.rate_type column INSERT
                      apps/VCSM/src/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js:26
- Trust Boundary:     upsertVportRateController — validation should occur before DAL call
- Impact:             Authenticated VPORT owner can store arbitrary strings as rate_type values
                      in vport.rates (e.g., "shadow", "test", "fx2"), polluting the rate type
                      namespace. Upsert conflict key includes rate_type — custom types create
                      distinct rows outside the canonical "fx" type set.
- Evidence:           
  // controller line 38:
  rateType = "fx",    // default present but no validation
  
  // controller line 57 (no assertValidRateType call before):
  const result = await upsertVportRateDal({
    actorId,
    rateType,         // raw value passed through
    ...
  });
  
  // dal line 26:
  rate_type: rateType,  // raw value stored in DB column

- Reproduction Steps:
  1. Authenticated VPORT owner calls upsertVportRateController with rateType: "shadow"
  2. Currency + rate validation passes (unrelated to rateType)
  3. Ownership check passes (legitimate owner)
  4. upsertVportRateDal receives rateType: "shadow"
  5. DB: vport.rates row inserted with rate_type = "shadow"
  Result: Arbitrary rate type string stored in vport.rates

- Existing Defense:   None at controller layer. Default value "fx" is a fallback, not a constraint.
- Why Defense Is Insufficient:
                      A default parameter is not input validation. The caller can override the
                      default with any string value. No DB CHECK constraint on rate_type is
                      visible in migrations.
- Recommended Fix:    Add assertValidRateType allow-list function in upsertVportRateController,
                      following the same pattern as assertValidCurrencyCode. Initial set: ["fx"].
- Suggested Patch:    ← FOR HUMAN REVIEW ONLY — not auto-applied

  // Add to upsertVportRate.controller.js BEFORE existing assertValidCurrencyCode calls:

  const SUPPORTED_RATE_TYPES = new Set(["fx"]);

  function assertValidRateType(name, value) {
    const t = String(value ?? "").trim().toLowerCase();
    if (!t || !SUPPORTED_RATE_TYPES.has(t)) {
      throw new Error(
        `upsertVportRateController: ${name} must be a supported rate type — received "${t}"`
      );
    }
    return t;
  }

  // In upsertVportRateController body, add as the FIRST validation after identityActorId check:
  const validatedRateType = assertValidRateType("rateType", rateType);

  // Then pass validatedRateType to the DAL call:
  const result = await upsertVportRateDal({
    actorId,
    rateType: validatedRateType,  // was: rateType
    baseCurrency: validatedBase,
    quoteCurrency: validatedQuote,
    buyRate: validatedBuy,
    sellRate: validatedSell,
    meta,
  });

  // Note: Also add to readVportRatesByActorDal if rateType is accepted there as a filter param.
  // Current readVportRatesByActorDal:
  //   .eq("rate_type", rateType)
  // The read DAL also passes rateType without validation. Adding allow-list to the write
  // controller is the priority; the read DAL is low-risk (public data) but benefits from
  // the same validation for consistency.

- Follow-up Command:  Wolverine (implement patch), CARNAGE (add DB CHECK constraint on rate_type)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-004
- Title:              Publish Controller Embeds Rate Values in Public Feed Post Without Validation
- Category:           Injection (unvalidated financial values in stored content)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/profiles/kinds/vport/controller/exchange/
                      publishExchangeRateUpdateAsPost.controller.js lines 9–18 (buildPostText),
                      lines 21–55 (controller body)
- Source:             buyRate, sellRate — caller-supplied parameters; not validated by this controller
- Sink:               buildPostText → post text string → createSystemPost → vc.posts INSERT
                      (published to public feed, visible to all feed subscribers)
- Trust Boundary:     publishExchangeRateUpdateAsPostController — rate validation should occur
                      before buildPostText is called
- Impact:             Authenticated VPORT owner can publish feed posts with arbitrary rate values
                      (zero, negative, or misleading figures). formatRate() does NOT reject
                      zero or negative values — it formats them as "0.0000" and "-5.0000".
                      Post text containing "Buy: 0.0000 · Sell: -5.0000" is published to the
                      public feed under the VPORT's actor identity.
- Evidence:
  // formatRate — line 9:
  function formatRate(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(4) : "—";  // 0 and negatives ARE finite → formatted
  }

  // buildPostText — line 14:
  const rates = `Buy: ${formatRate(buyRate)} · Sell: ${formatRate(sellRate)}`;
  // No assertValidRate called before this line

  // Controller body — no rate validation before buildPostText:
  const exchangeName = await resolveVportExchangeNameDAL(actorId);
  const text = buildPostText({ exchangeName, baseCurrency, quoteCurrency, buyRate, sellRate });

  // createSystemPost — line 47:
  const created = await createSystemPost({
    actorId,
    text,   // text may contain "Buy: 0.0000 · Sell: -5.0000"
    post_type: "exchange_rate_update",
    realm_id: realmId,
    media_url: null,
  });

- Reproduction Steps:
  1. Authenticated VPORT owner calls publishExchangeRateUpdateAsPostController directly
  2. buyRate: 0, sellRate: -5
  3. actorId + identityActorId guards pass; currency presence check passes
  4. assertActorOwnsVportActorController passes (legitimate owner)
  5. hasRecentExchangeRatePostDAL → false (no recent post)
  6. buildPostText called: "Buy: 0.0000 · Sell: -5.0000"
  7. createSystemPost → post created with misleading rate data in vc.posts

- Existing Defense:   upsertVportRate.controller.js validates positive-finite rates before
                      the DB upsert. In the normal screen flow, the upsert controller runs
                      first and rates are validated there. However, publishExchangeRateUpdateAsPost
                      is a separate controller that does NOT share or import this validation.
- Why Defense Is Insufficient:
                      The publish controller is callable independently of the upsert controller.
                      The two controllers share no validation utility — rate validation must be
                      explicitly called in each controller where rate values are used for a write.
- Recommended Fix:    Extract assertValidRate to a shared module. Import and call it in
                      publishExchangeRateUpdateAsPostController before buildPostText.
                      Treat invalid rates as a validation error: return { published: false,
                      reason: "invalid_rates" } rather than throwing, for consistency with
                      other soft-fail returns in this controller.
- Suggested Patch:    ← FOR HUMAN REVIEW ONLY — not auto-applied

  // STEP 1: Create shared validation utility
  // New file: apps/VCSM/src/features/profiles/kinds/vport/controller/exchange/exchangeRateValidation.js

  export function assertValidRate(name, value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error(
        `${name} must be a positive finite number — received ${JSON.stringify(value)}`
      );
    }
    return n;
  }

  // STEP 2: Update upsertVportRate.controller.js to import from shared utility
  // Replace the inline assertValidRate definition with:
  import { assertValidRate } from "@/features/profiles/kinds/vport/controller/exchange/exchangeRateValidation";

  // STEP 3: Update publishExchangeRateUpdateAsPost.controller.js
  // Add import:
  import { assertValidRate } from "@/features/profiles/kinds/vport/controller/exchange/exchangeRateValidation";

  // Add rate validation block AFTER the ownership check, BEFORE resolveVportExchangeNameDAL:
  // (soft-fail pattern consistent with existing returns in this controller)
  let validatedBuy, validatedSell;
  try {
    validatedBuy  = assertValidRate("buyRate", buyRate);
    validatedSell = assertValidRate("sellRate", sellRate);
  } catch {
    return { published: false, reason: "invalid_rates" };
  }

  // Then pass validated values to buildPostText:
  const exchangeName = await resolveVportExchangeNameDAL(actorId);
  const text = buildPostText({
    exchangeName,
    baseCurrency,
    quoteCurrency,
    buyRate: validatedBuy,   // was: buyRate
    sellRate: validatedSell, // was: sellRate
  });

  // Note: The test for publishExchangeRateUpdateAsPost.controller.js will need
  // a new test group: "rate validation — returns {published:false, reason:'invalid_rates'}
  // when buyRate or sellRate is 0, negative, or non-finite."

- Follow-up Command:  Wolverine (implement patch + update tests), SPIDER-MAN (test coverage)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-003
- Title:              assertActorOwnsVportActorController Does Not Verify Target Actor Void State
- Category:           Privilege Escalation (VPORT lifecycle bypass)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js
                      Lines 40–49 (owner link verification — no target actor fetch)
                      9 call sites: upsertVportRate.controller.js, publishExchangeRateUpdateAsPost.controller.js,
                      and 7 other dashboard controllers
- Source:             targetActorId — caller-supplied; represents the VPORT to be operated on
- Sink:               All write operations that gate on this controller (rate upsert, feed publish,
                      team management, booking operations) — the controller's return permits the write
- Trust Boundary:     assertActorOwnsVportActorController — both requester and target actor states
                      should be verified here
- Impact:             A legitimate owner of a void VPORT (is_void = true) can pass the ownership
                      check and write data to that void VPORT. Data writes to void actors create
                      inconsistent state that may surface if the actor is reactivated.
                      Note: vport.rates SELECT RLS (actor_can_view_profile) gates on is_active +
                      is_deleted — void VPORT rates are not publicly readable. Impact is primarily
                      data integrity, not public data leakage.
- Evidence:
  // assertActorOwnsVportActor.controller.js — no target actor fetch:
  const ownerLink = await readActorOwnerLinkByActorAndUserProfileDAL({
    targetActorId,
    userProfileId: requesterProfileId,
  });

  if (!ownerLink || ownerLink.is_void === true) {  // checks LINK is_void, not TARGET ACTOR is_void
    throw new Error("Actor does not own this vport actor.");
  }

  return { ok: true, mode: "actor_owner", ownerLink };
  // targetActorId void state never checked — getActorByIdDAL only called for requestActorId

- Reproduction Steps:
  1. VPORT actor has is_void = true in vc.actors
  2. Owner (non-void user actor) still has a valid actor_owners link (not auto-revoked on void)
  3. Owner calls upsertVportRateController targeting the void VPORT
  4. assertActorOwnsVportActorController: requester valid, link exists, link is_void=false
  5. Ownership check PASSES despite target VPORT being void
  6. Rate write proceeds to upsertVportRateDal

- Existing Defense:   vport.rates SELECT RLS prevents void VPORT rates from being publicly
                      readable (actor_can_view_profile gates on is_active + is_deleted).
- Why Defense Is Insufficient:
                      The SELECT gate prevents public exposure of void VPORT data but does not
                      prevent writes to void actors. Data integrity is violated — void actors
                      should not accumulate new state changes.
- Recommended Fix:    Add getActorByIdDAL call for targetActorId after owner link verification.
                      Throw if target actor is void.
- Suggested Patch:    ← FOR HUMAN REVIEW ONLY — not auto-applied

  // In assertActorOwnsVportActor.controller.js, add AFTER the ownerLink verification block:
  // (after line 46: "if (!ownerLink || ownerLink.is_void === true) { throw... }")

  // Verify target actor is not void before permitting write
  const targetActor = await getActorByIdDAL({ actorId: targetActorId });
  if (!targetActor || targetActor.is_void === true) {
    throw new Error("Target vport actor is not available.");
  }

  return { ok: true, mode: "actor_owner", ownerLink };

  // Note: getActorByIdDAL is already imported in this file (used for requesterActor on line 20).
  // This adds one additional DB call per ownership check. If performance is a concern under
  // high write volume, consider caching targetActor lookups with a short TTL (e.g., 30s)
  // using the existing createTTLCache pattern from shared/lib/ttlCache.js.

  // This fix affects all 9 call sites of assertActorOwnsVportActorController.
  // SPIDER-MAN should add test coverage: "target actor void → throws" for each controller
  // that calls this ownership check.

- Follow-up Command:  Wolverine (implement patch), CARNAGE (verify actor_can_manage_profile
                      also checks target void state at DB layer), SPIDER-MAN (test coverage
                      for the new void check across 9 call sites)
```

---

## Info Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-002
- Title:              meta Field Accepted Without Size Limit or Schema Validation
- Category:           Injection (unvalidated jsonb blob)
- Severity:           INFO
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js
                      Line 41 (meta = null in function signature)
                      Line 57 (meta passed to DAL)
                      apps/VCSM/src/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js
                      Line 35 (meta: meta ?? {})
- Source:             meta parameter — caller-supplied, arbitrary JSON object or null
- Sink:               upsertVportRateDal → vport.rates.meta jsonb column
- Trust Boundary:     upsertVportRateController — size/schema validation should occur before DAL
- Impact:             Authenticated VPORT owner can store unbounded JSON payloads in meta.
                      Currently meta is not rendered in any public UI component. Risk is latent:
                      activates if a future consumer renders, evaluates, or indexes meta.
                      No confirmed exploit path at current implementation state.
- Evidence:
  // Controller — no meta validation:
  meta = null,   // no size check, no schema check

  // DAL — raw passthrough:
  meta: meta ?? {},   // stored as jsonb; accepts any valid JSON structure

  // Model — mapped back as-is:
  meta: toObj(row.meta),   // toObj only checks typeof === "object", no filtering

- Reproduction Steps: Owner submits meta: { data: "A".repeat(50000) } → stored without size limit
- Existing Defense:   None at application layer. PostgreSQL jsonb has implicit row size limits
                      (typically 1GB) but no application-layer size or schema guard.
- Why Defense Is Insufficient:
                      No current exploit path — meta is not rendered. Classified INFO because
                      the impact chain requires a future change (meta render or evaluation).
                      Worth hardening now before meta accumulates semantic meaning.
- Recommended Fix:    Add size guard in controller. Document meta as opaque owner-controlled blob.
                      If meta gains structured semantics, add schema validation at that time.
- Suggested Patch:    ← FOR HUMAN REVIEW ONLY — not auto-applied

  // Add to upsertVportRate.controller.js, AFTER identityActorId check,
  // BEFORE assertValidRateType (from ELEK-2026-05-27-001):

  function assertValidMeta(value) {
    if (value === null || value === undefined) return null;
    if (typeof value !== "object" || Array.isArray(value)) {
      throw new Error("upsertVportRateController: meta must be a plain object or null");
    }
    const serialized = JSON.stringify(value);
    if (serialized.length > 2048) {
      throw new Error(
        `upsertVportRateController: meta exceeds maximum size of 2048 bytes — received ${serialized.length} bytes`
      );
    }
    return value;
  }

  // In controller body:
  const validatedMeta = assertValidMeta(meta);

  // Pass validatedMeta to DAL:
  const result = await upsertVportRateDal({
    ...
    meta: validatedMeta,  // was: meta
  });

- Follow-up Command:  LOGAN (document meta field contract in module Logan doc)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-006
- Title:              actorId Null Guard Missing in upsertVportRateController (Error Delegation to Wrong Layer)
- Category:           Privilege Escalation (INFO — no exploit path)
- Severity:           INFO
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js
                      Line 43 (identityActorId guard present)
                      Line 55 (assertActorOwnsVportActorController called with potentially null actorId)
- Source:             actorId parameter — caller-supplied; null path possible
- Sink:               assertActorOwnsVportActorController — throws with wrong error message
- Trust Boundary:     upsertVportRateController — own parameter guards
- Impact:             When actorId is null, the error thrown is:
                      "assertActorOwnsVportActorController: targetActorId is required"
                      instead of "upsertVportRateController: actorId is required".
                      Functionally safe — write is blocked. No exploit path exists.
                      Error attribution is incorrect — debugging is obscured.
- Evidence:
  // Line 43: identityActorId guard is explicit ✅
  if (!identityActorId) throw new Error("upsertVportRateController: identityActorId required");

  // Lines 46–54: currency + rate validation proceeds even with null actorId

  // Line 55: actorId passed without prior guard
  await assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId });
  // If actorId is null → assertActorOwnsVportActorController throws "targetActorId is required"

- Reproduction Steps: Call upsertVportRateController({ identityActorId: "x", actorId: null, ... })
                      → error thrown from wrong controller layer
- Existing Defense:   assertActorOwnsVportActorController catches null actorId and throws.
                      Write is blocked. INFO-level only.
- Recommended Fix:    Add explicit actorId guard in upsertVportRateController, parallel to identityActorId.
- Suggested Patch:    ← FOR HUMAN REVIEW ONLY — not auto-applied

  // In upsertVportRateController, immediately after identityActorId guard (line 43):
  if (!actorId) throw new Error("upsertVportRateController: actorId is required");

  // Full guard block becomes:
  if (!identityActorId) throw new Error("upsertVportRateController: identityActorId required");
  if (!actorId) throw new Error("upsertVportRateController: actorId is required");
  // ... then currency + rate validation ...

- Follow-up Command:  Wolverine (trivial — batch with other hardening in same PR)
```

---

## False Positives Rejected

---

```
FALSE POSITIVE REJECTED

- Candidate:       resolveVportExchangeNameDAL reads vport profile name without auth
- Location:        apps/VCSM/src/features/profiles/kinds/vport/dal/exchange/vportExchangeRatePost.read.dal.js:6
- Rejection reason: Impact link broken — exchange business name is intentionally public data
                    (visible on VPORT profile pages). No sensitive data exposed.
- Chain gap:        Impact — reading a business name is not a security impact
- Notes:           None
```

---

```
FALSE POSITIVE REJECTED

- Candidate:       readVportRatesByActorDal accepts actorId from caller without session binding
- Location:        apps/VCSM/src/features/profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js
- Rejection reason: Impact link broken — exchange rates are intentionally public information.
                    The function is a public read path; no auth requirement is correct by design.
                    DB SELECT RLS (rates_select) restricts reads to active/non-deleted profiles — 
                    appropriate visibility gate for public data.
- Chain gap:        Impact — reading public exchange rates is not a security impact
- Notes:           None
```

---

```
FALSE POSITIVE REJECTED

- Candidate:       toNumOrNull in VportDashboardExchangeScreen accepts 0 and negative values
- Location:        apps/VCSM/src/features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx:28
- Rejection reason: Sink not reached — toNumOrNull is used only for optimistic display state
                    (building the optimistic rate object for UI rendering). It does not flow
                    to any DAL write or DB operation. The actual write path calls
                    useUpsertVportRate → upsertVportRateController where assertValidRate
                    enforces positive-finite constraint. Chain terminates at UI display.
- Chain gap:        Sink — value never reaches a dangerous write operation
- Notes:           The asymmetry between toNumOrNull (accepts 0) and assertValidRate (rejects 0)
                    creates a brief visual inconsistency: the optimistic display may show "0.0000"
                    before the controller error surfaces. This is a UX concern, not a security concern.
```

---

```
FALSE POSITIVE REJECTED

- Candidate:       VportRateEditorCard free-text currency input (no UI allow-list)
- Location:        apps/VCSM/src/features/profiles/kinds/vport/screens/rates/components/VportRateEditorCard.jsx:60
- Rejection reason: Defense already present at the correct layer — controller enforces
                    SUPPORTED_FX_CURRENCIES allow-list. Free-text UI input does not reach
                    the DB without passing through assertValidCurrencyCode in the controller.
                    UI input validation would be defense-in-depth (UX improvement), not a
                    missing security control.
- Chain gap:        Missing defense — defense IS present at the controller (correct layer)
- Notes:           Recommend adding a UI dropdown or inline error preview for UX, but this
                   is not a security finding.
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-05-27-005 | actor_can_manage_profile legacy owner_user_id branch | MEDIUM | RLS / DB Function | COMPLEX | YES — DB function body rewrite |
| 2 | ELEK-2026-05-27-001 | rateType stored without allow-list | LOW | Controller | SIMPLE | Recommended (CHECK constraint) |
| 3 | ELEK-2026-05-27-004 | Publish controller embeds rates without validation | LOW | Controller | MODERATE | NO (shared utility + controller change + test update) |
| 4 | ELEK-2026-05-27-003 | Target actor void state not verified | LOW | Controller | SIMPLE | Recommended (CARNAGE verification) |
| 5 | ELEK-2026-05-27-002 | meta field accepted without size limit | INFO | Controller | SIMPLE | NO |
| 6 | ELEK-2026-05-27-006 | actorId null guard in wrong layer | INFO | Controller | SIMPLE | NO |

---

## Implementation Order Recommendation

Patches 2, 4, 5, 6 can be batched into a single controller-hardening PR (simple, same-file changes, no schema changes). Patch 3 introduces a new shared file — recommend as a separate PR to keep the diff clean. Patch 1 (DB advisory) goes to CARNAGE independently.

**Batch A (single PR — controller hardening):**
- ELEK-2026-05-27-001 — `assertValidRateType` in upsertVportRateController
- ELEK-2026-05-27-003 — target void check in assertActorOwnsVportActorController
- ELEK-2026-05-27-002 — `assertValidMeta` in upsertVportRateController
- ELEK-2026-05-27-006 — actorId null guard in upsertVportRateController

**Batch B (separate PR — publish validation):**
- ELEK-2026-05-27-004 — `exchangeRateValidation.js` shared module + publish controller update + test update

**Batch C (DB — route to CARNAGE):**
- ELEK-2026-05-27-005 — `actor_can_manage_profile` legacy branch removal

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| Wolverine | Implement Batch A (controller hardening) and Batch B (publish validation) | PENDING |
| CARNAGE | Inspect `actor_can_manage_profile` and `actor_can_view_profile` DB function bodies; remove legacy `owner_user_id` branch; plan migration (ELEK-2026-05-27-005) | PENDING |
| DB | Verify live DB function bodies for actor_can_manage_profile and actor_can_view_profile | PENDING |
| SPIDER-MAN | Add test coverage: (a) rateType invalid → throws; (b) publishExchangeRateUpdateAsPost with invalid rates → {published:false, reason:"invalid_rates"}; (c) target actor void → ownership check throws (across 9 call sites) | PENDING |
| LOGAN | Update security.md: (a) correct migration reference 20260522010000 → 20260523010000; (b) document new findings and patch advisory | PENDING |
| Thor | Release gate: no HIGH findings; MEDIUM (ELEK-005) pending CARNAGE verification — current release posture is CAUTION until CARNAGE confirms legacy branch status | PENDING |

---

## THOR Release Gate Summary

- **No HIGH findings confirmed.** No CRITICAL findings.
- **MEDIUM (ELEK-2026-05-27-005):** DB function legacy branch — pending CARNAGE verification. If CARNAGE confirms legacy branch is active: escalate to HIGH, block release. If CARNAGE confirms legacy branch is removed: CLOSE.
- **LOW and INFO findings:** No release blockers. Should be included in next hardening cycle.
- **THOR recommendation:** CAUTION — clear CARNAGE verification of `actor_can_manage_profile` before final release approval.

---

*ELEKTRA is analysis and advisory only. No source code was modified. All suggested patches are for human review and must be implemented by a developer with Wolverine orchestration.*
