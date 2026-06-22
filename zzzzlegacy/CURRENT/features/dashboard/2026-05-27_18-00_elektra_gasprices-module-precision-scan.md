# ELEKTRA Security Report

**Date:** 2026-05-27  
**Scope:** VCSM  
**Reviewer:** ELEKTRA  
**Scan Trigger:** VENOM + BlackWidow cross-reference — full security chain (ARCHITECT → VENOM → BlackWidow → ELEKTRA)  
**Module:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/`  
**Findings Summary:** 0 HIGH | 2 MEDIUM | 5 LOW | 2 INFO  
**False Positives Rejected:** 4  
**Suggested Patches:** 9  

---

```
ELEKTRA SCAN TARGET
Feature / Route / Engine:  Gas Prices module — citizen submission + owner review + public display
Application Scope:         VCSM
Reason for scan:           Third step of full security chain; trace VENOM/BlackWidow findings to source→sink
Scan trigger:              VENOM cross-reference + BlackWidow referral
```

---

## Executive Summary

The gas prices module's core write authorization is solid — all five write controllers enforce ownership via `checkVportOwnershipController` before mutating data. No cross-actor escalation exploit chain was confirmed. Two medium-severity gaps affect **data integrity**, not authentication: the citizen submit path accepts arbitrary `fuelKey` strings with no domain enum validation (injection into public display tables), and the submission INSERT has no uniqueness constraint allowing concurrent duplicates to flood the owner review queue. Five low-severity findings cover decision enum injection (self-harm only), unvalidated evidence JSONB, raw error message rendering, dev machine path leakage in source files, and a barrel export that leaks an internal DAL utility. A high-severity **functional bug** (`pendingSubmissions` always empty) means the owner review UI is completely non-functional and must be fixed before the review feature ships.

---

## Entry Point Map

```
ENTRY POINT MAP

Route: /actor/:actorId/gas → VportGasPricesView
  Input sources: actorId from URL param; identity from useIdentity()
  Trusted input boundary: useIdentity() for viewer; actorId is display target
  Validation at boundary: NO write path on this route — read only

Route: /actor/:actorId/dashboard/gas → VportDashboardGasScreen
  Input sources: actorId from URL; identity from useIdentity()
  Trusted input boundary: OwnerOnlyDashboardGuard (route guard)
  Validation at boundary: PARTIAL — guard present; controller re-validates

Controller: submitFuelPriceSuggestion
  Input sources: fuelKey, proposedPrice, actorId, evidence, ownerUpdate (all from hook)
  Trusted input boundary: controller entry — lines 46-49
  Validation at boundary: PARTIAL — presence only; no enum/whitelist for fuelKey

Controller: reviewFuelPriceSuggestion
  Input sources: submissionId, decision, decidedByActorId (from useOwnerPendingSuggestions)
  Trusted input boundary: controller entry — lines 25-27
  Validation at boundary: PARTIAL — presence only; no enum for decision

Controller: publishFuelPriceUpdateAsPost
  Input sources: actorId, updatedFuels (array of { fuelKey, price })
  Trusted input boundary: FUEL_LABELS whitelist ✓ — enum validated
  Validation at boundary: STRONG

Controller: updateStationFuelUnit
  Input sources: actorId, targetActorId, unit
  Trusted input boundary: ALLOWED_UNITS whitelist ✓ — enum validated
  Validation at boundary: STRONG
```

---

## Medium Findings

---

```
SECURITY FINDING

Finding ID:         ELEK-2026-05-27-001
Title:              fuelKey: no domain enum validation — arbitrary strings written to DB and displayed publicly
Category:           Injection
Severity:           MEDIUM
Status:             Open
Scope:              VCSM
Location:           submitFuelPriceSuggestion.controller.js:47
                    vportFuelPriceSubmissions.write.dal.js:39
                    vportFuelPrices.write.dal.js:54
                    model/gasPrices.model.js:72 (public display sink)
                    reviewFuelPriceSuggestion.controller.js:80 (escalation sink)

Source:             fuelKey parameter — hook-supplied, ultimately from UI or direct API call
                    submitFuelPriceSuggestion.controller.js:28 → parameter destructured from caller

Trust Boundary:     submitFuelPriceSuggestion.controller.js lines 46–47:
                      if (!targetActorId) throw new Error("targetActorId required");
                      if (!fuelKey) throw new Error("fuelKey required");
                    ← Only presence check. No domain enum validation.

Sink A — Submission table (citizen path):
                    vportFuelPriceSubmissions.write.dal.js:39
                      fuel_key: fuelKey  ← arbitrary string inserted to vport.fuel_price_submissions

Sink B — Official prices table (owner path):
                    vportFuelPrices.write.dal.js:54
                      fuel_key: fuelKey  ← arbitrary string upserted to vport.fuel_prices
                      ON CONFLICT (profile_id, fuel_key) — creates permanent new row per unique junk key

Sink C — Public display (escalation via community suggestion display):
                    gasPrices.model.js:72
                      for (const k of Object.keys(communitySuggestionByFuelKey || {})) keys.add(String(k));
                    ← communitySuggestionByFuelKey is keyed by fuelKey — any stored junk key
                      flows directly into the public gas prices panel's display row set

Sink D — Official prices via approval escalation:
                    reviewFuelPriceSuggestion.controller.js:80
                      fuelKey: updatedSubRow.fuel_key  ← stored fuelKey promoted to official prices on approve
                    ← If owner carelessly approves a junk-fuelKey submission, the junk key
                      writes to fuel_prices permanently (cannot be removed via normal UI)

Impact:             1. Authenticated citizen submits fuelKey="garbage_label" (no UI validation bypass
                       needed — direct controller call or browser devtools)
                    2. Row stored in fuel_price_submissions.fuel_key = "garbage_label"
                    3. Public gas tab loads communitySuggestionByFuelKey — "garbage_label" key
                       flows into resolveFuelKeys() → displayed as a fuel row to all visitors
                       (60s cache means persistence across all public views of the station)
                    4. If owner approves: permanently written to vport.fuel_prices as a new
                       official price row — no deletion path via normal UI
                    Standard UI limits users to 4 buttons, but this is UI-only restriction —
                    no controller or DB enforcement.

Evidence:
  submitFuelPriceSuggestion.controller.js:47  → if (!fuelKey) throw  [no whitelist follows]
  vportFuelPriceSubmissions.write.dal.js:39   → fuel_key: fuelKey    [raw passthrough]
  vportFuelPrices.write.dal.js:54             → fuel_key: fuelKey    [raw passthrough]
  gasPrices.model.js:72                       → keys.add(String(k))  [DB key → display set]
  reviewFuelPriceSuggestion.controller.js:80  → fuelKey: updatedSubRow.fuel_key [DB→official]
  publishFuelPriceUpdateAsPost.controller.js  → FUEL_LABELS whitelist PRESENT on post path
  updateStationFuelUnit.controller.js         → ALLOWED_UNITS whitelist PRESENT on unit path
  — Both sibling controllers have whitelists. submitFuelPriceSuggestion is the gap.

Reproduction Steps:
  1. Authenticate as any citizen
  2. Identify a target VPORT actorId (visible in URL)
  3. Call submitFuelPriceSuggestionController({ targetActorId, fuelKey: "test_fuel", proposedPrice: 1.50, actorId })
  4. Observe: vport.fuel_price_submissions row with fuel_key = "test_fuel"
  5. Navigate to target VPORT gas tab — observe "Test Fuel" row in community suggestions
  6. Owner approves: vport.fuel_prices row created for fuel_key = "test_fuel" permanently

Existing Defense:     FUEL_LABELS whitelist on publishFuelPriceUpdateAsPost — downstream only
                      UI renders only 4 known fuel buttons — UI-layer only

Why Defense Insufficient: UI restriction is not enforced at the controller trust boundary.
                          Any direct controller call bypasses it. FUEL_LABELS is not
                          imported or applied in submitFuelPriceSuggestion.controller.js.

Recommended Fix:      Extract ALLOWED_FUEL_KEYS to gasPrices.model.js. Add guard in both
                      submitFuelPriceSuggestion (citizen AND owner paths). Add secondary
                      guard in reviewFuelPriceSuggestion before upsert on approval.
                      Add DB CHECK constraint via Carnage as defense-in-depth.

Suggested Patch:

  Step 1 — model/gasPrices.model.js (add constant, shared by all controllers):

    // Add near top of file after formatters section:
    export const ALLOWED_FUEL_KEYS = new Set([
      "regular", "midgrade", "premium", "diesel", "e85", "kerosene",
    ]);

  Step 2 — submitFuelPriceSuggestion.controller.js (lines 46–48, add after fuelKey check):

    import { ALLOWED_FUEL_KEYS } from "@/features/dashboard/vport/dashboard/cards/gasprices/model/gasPrices.model";

    // after: if (!fuelKey) throw new Error("fuelKey required");
    if (!ALLOWED_FUEL_KEYS.has(fuelKey)) return { ok: false, reason: "invalid_fuel_key" };

  Step 3 — reviewFuelPriceSuggestion.controller.js (add before upsert on approve, line ~75):

    import { ALLOWED_FUEL_KEYS } from "@/features/dashboard/vport/dashboard/cards/gasprices/model/gasPrices.model";

    // before: const { data: officialRow, error: officialErr } = await upsertVportFuelPriceDAL(...)
    if (!ALLOWED_FUEL_KEYS.has(updatedSubRow.fuel_key)) {
      return { ok: false, reason: "invalid_fuel_key_in_submission" };
    }

  Step 4 — DB layer (Carnage migration — optional but recommended defense-in-depth):

    ALTER TABLE vport.fuel_prices
      ADD CONSTRAINT fuel_prices_fuel_key_check
      CHECK (fuel_key IN ('regular', 'midgrade', 'premium', 'diesel', 'e85', 'kerosene'));

    ALTER TABLE vport.fuel_price_submissions
      ADD CONSTRAINT fuel_price_submissions_fuel_key_check
      CHECK (fuel_key IN ('regular', 'midgrade', 'premium', 'diesel', 'e85', 'kerosene'));

Follow-up Command:  Carnage (DB constraint), Wolverine (code patch)
```

---

```
SECURITY FINDING

Finding ID:         ELEK-2026-05-27-002
Title:              No uniqueness constraint on pending submissions — concurrent duplicate flood
Category:           IDOR/BOLA (integrity abuse)
Severity:           MEDIUM
Status:             Open
Scope:              VCSM
Location:           vportFuelPriceSubmissions.write.dal.js:34-57
                    submitFuelPriceSuggestion.controller.js (citizen path — no pre-check)

Source:             Multiple concurrent submit() calls from useSubmitFuelPriceSuggestion.js
                    within a single event-loop tick (button double-tap, script, rapid programmatic call)

Trust Boundary:     submitFuelPriceSuggestion.controller.js citizen path (lines 123–160)
                    No existing-pending check before createFuelPriceSubmissionDAL call.

Sink:               vportFuelPriceSubmissions.write.dal.js:34-48
                      const result = await vportSchema
                        .from("fuel_price_submissions")
                        .insert([{ profile_id, fuel_key, proposed_price, ... status: "pending" }])
                    ← Plain INSERT. No ON CONFLICT clause. No application-level dedup.
                      Two identical concurrent calls produce two independent rows.

Impact:             Authenticated citizen fires N concurrent submits for same fuelKey:
                    1. All N requests reach controller — no pending pre-check
                    2. All N DAL calls execute independently
                    3. N rows inserted into fuel_price_submissions for same (profile_id, fuel_key)
                    4. Owner review queue shows N identical pending items
                    5. At 6 common fuelKeys × N concurrent submits = 6N rows per burst
                    6. invalidatePendingSubmissionsCache called N×6 times — unnecessary DB churn
                    Review queue integrity degraded; owner must dismiss duplicates manually.

Evidence:
  vportFuelPriceSubmissions.write.dal.js:34-48  → plain INSERT, no ON CONFLICT
  submitFuelPriceSuggestion.controller.js:148    → createFuelPriceSubmissionDAL called directly
  — No prior call to fetchPendingFuelPriceSubmissionsDAL to check existing pending state
  — No mutex or debounce at hook or controller layer

Reproduction Steps:
  1. Authenticate as any citizen
  2. Identify target VPORT actorId and a valid fuelKey
  3. Fire Promise.all([submit(...), submit(...), submit(...)]) with identical payload
  4. Observe: 3 rows in vport.fuel_price_submissions with same (profile_id, fuel_key, submitted_by_actor_id)
  5. Owner opens review queue — sees 3 identical pending items for same citizen/fuel

Existing Defense:     30s TTL cache on fetchPendingFuelPriceSubmissionsDAL — write side bypassed
                      DB: no partial UNIQUE index on (profile_id, fuel_key, submitted_by_actor_id) WHERE status='pending'

Why Defense Insufficient: Cache is read-side only. Write INSERT path has no guard.
                           TOCTOU race exists even with application pre-check alone.
                           Must be closed at DB layer with partial unique index.

Recommended Fix:      Two-layer defense:
                      Layer 1 (Application): Pre-check in controller citizen path before INSERT
                      Layer 2 (DB): Partial unique index on pending submissions per citizen

Suggested Patch:

  Layer 1 — submitFuelPriceSuggestion.controller.js (citizen path, before createFuelPriceSubmissionDAL call ~line 148):

    import { fetchPendingFuelPriceSubmissionsDAL } from ".../dal/vportFuelPriceSubmissions.read.dal";

    // Before: const { data: row, error } = await createFuelPriceSubmissionDAL(...)
    const { data: existingPending } = await fetchPendingFuelPriceSubmissionsDAL({
      targetActorId,
      fuelKey,
    });
    const alreadyPending = Array.isArray(existingPending) &&
      existingPending.some((s) => s.submitted_by_actor_id === actorId);
    if (alreadyPending) return { ok: false, reason: "already_pending" };

  Layer 2 — DB migration (Carnage — closes TOCTOU race):

    CREATE UNIQUE INDEX fuel_price_submissions_citizen_pending_unique
      ON vport.fuel_price_submissions(profile_id, fuel_key, submitted_by_actor_id)
      WHERE (status = 'pending');

    -- createFuelPriceSubmissionDAL insert can then safely do:
    -- .insert([...]).select(SUBMISSION_SELECT).maybeSingle()
    -- Duplicate will return a Postgres unique_violation (code 23505)
    -- Application handles as already_pending

Follow-up Command:  Carnage (partial unique index), Wolverine (controller pre-check)
```

---

## Low Findings

---

```
SECURITY FINDING

Finding ID:         ELEK-2026-05-27-003
Title:              Co-owner routing: client-side actorId equality check silently demotes co-owners to citizen path
Category:           Auth Bypass (privilege degradation — not escalation)
Severity:           LOW
Status:             Open
Scope:              VCSM
Location:           hooks/useSubmitFuelPriceSuggestion.js:24-30, 58

Source:             me.actorId and targetActorId from identity context / URL param
                    Both values trusted — comparison is the gate

Trust Boundary:     hooks/useSubmitFuelPriceSuggestion.js:24-30
                      const isOwner = useMemo(() =>
                        Boolean(me?.actorId) &&
                        Boolean(targetActorId) &&
                        String(me.actorId) === String(targetActorId),
                        [me, targetActorId]
                      );

Sink:               hooks/useSubmitFuelPriceSuggestion.js:58
                      ownerUpdate: isOwner  ← forwarded to submitFuelPriceSuggestionController
                    If co-owner (actorId ≠ VPORT actorId), isOwner = false → ownerUpdate = false
                    → citizen path selected, bypassing checkVportOwnershipController server gate

Impact:             Co-owners (actors in actor_owners for a VPORT with different actorId than
                    the VPORT actor itself) always get ownerUpdate=false. Their price updates
                    enter the pending submission queue instead of writing officially.
                    They may end up reviewing their own submissions.
                    Note: server gate is NOT bypassed upward — no privilege escalation.
                    This is a functionality correctness failure, not a security breach.

Evidence:
  hooks/useSubmitFuelPriceSuggestion.js:24-30  → String(me.actorId) === String(targetActorId)
  hooks/useSubmitFuelPriceSuggestion.js:58      → ownerUpdate: isOwner
  submitFuelPriceSuggestion.controller.js:79    → checkVportOwnershipController called only when ownerUpdate=true
  — actor_owners supports multiple owners per VPORT; this hook only recognizes the primary actor

Reproduction Steps:
  1. Create VPORT actor (primary actorId = "A")
  2. Add actor "B" to actor_owners for VPORT "A" (co-owner)
  3. Authenticate as actor "B"
  4. Navigate to VPORT "A"'s gas dashboard
  5. Submit price update — observe: goes to citizen submission queue, not official price
  6. Compare: actor "A" submitting → goes to official price directly

Existing Defense:     Server-side checkVportOwnershipController at controller:79 is correct
                      — if ownerUpdate=true were sent by a co-owner, the server gate WOULD pass them

Why Defense Insufficient: The hook's client-side comparison prevents co-owners from ever
                           reaching the server gate with ownerUpdate=true. The gate is
                           correct but unreachable for co-owners.

Recommended Fix:      Remove client-side isOwner useMemo from the hook. Always pass
                      ownerUpdate: false from the hook. Change controller to unconditionally
                      determine the path from checkVportOwnershipController result.

Suggested Patch:

  hooks/useSubmitFuelPriceSuggestion.js — remove lines 23-30, remove isOwner from submit call:

    // DELETE: const isOwner = useMemo(...)
    // CHANGE line 58:
    ownerUpdate: false,  // path determined server-side by checkVportOwnershipController

    // ALSO update publishFeedPost (line 73-74):
    // publishFeedPost currently guards on isOwner — tie it to server response instead
    // or keep it UI-only (it runs through its own ownership gate anyway)

  submitFuelPriceSuggestion.controller.js — change owner path entry condition:

    // CURRENT (line 76): if (ownerUpdate) {
    // REPLACE WITH:
    const isOwnerVerified = await checkVportOwnershipController({ callerActorId: actorId, targetActorId });
    if (isOwnerVerified) {
      // owner path — already verified via actor_owners
      // ... existing owner path code (remove the inner checkVportOwnershipController call on line 79)
    }
    // else: fall through to citizen path

  Note: ownerUpdate parameter can be removed from the controller signature after this change.
        The parameter was only meaningful because it gated the server-side ownership check.

Follow-up Command:  Wolverine
```

---

```
SECURITY FINDING

Finding ID:         ELEK-2026-05-27-004
Title:              Decision enum injection: arbitrary status string written to fuel_price_submissions
Category:           Injection
Severity:           LOW
Status:             Open
Scope:              VCSM
Location:           reviewFuelPriceSuggestion.controller.js:25-27, 57-63
                    vportFuelPriceReviews.write.dal.js:45-46

Source:             decision parameter from useOwnerPendingSuggestions.js:70
                    Hook passes caller-provided string directly to controller

Trust Boundary:     reviewFuelPriceSuggestion.controller.js:26
                      if (!decision) throw new Error("decision required");
                    ← Presence check only. No whitelist validation.

Sink:               vportFuelPriceReviews.write.dal.js:45-46
                      .update({ status, ... })
                    where status = decision (from caller, unmodified)
                    ← Arbitrary string stored in vport.fuel_price_submissions.status column

Impact:             Authenticated VPORT owner (ownership verified at controller:41-45 before this point)
                    can persist arbitrary status string for their own submission rows.
                    Example: decision = "hacked" → submission.status = "hacked"
                    Row becomes invisible to pending queue (status='pending' filter no longer matches)
                    and invisible to any approved/rejected view (not a known status).
                    Ghost row — permanently orphaned in the table unless manually deleted.
                    No cross-actor impact — ownership verified before this call.
                    reviewFuelPriceSuggestion.controller.js:75 correctly checks
                    `if (decision === "approved")` before writing to official prices —
                    so the approval-to-official-price escalation is NOT exploitable via this.

Evidence:
  reviewFuelPriceSuggestion.controller.js:57-63:
    await updateFuelPriceSubmissionStatusDAL({
      submissionId,
      status: decision,  ← no whitelist applied before this call
      ...
    });
  vportFuelPriceReviews.write.dal.js:45: .update({ status, ... }) ← raw status from caller
  reviewFuelPriceSuggestion.controller.js:75: if (decision === "approved") ← hardcoded string check

Reproduction Steps:
  1. Authenticate as VPORT owner
  2. Obtain a pending submissionId for your station
  3. Call reviewFuelPriceSuggestionController({ submissionId, decision: "ghost", decidedByActorId })
  4. Observe: submission.status = "ghost"; row excluded from all normal queries

Existing Defense:     checkVportOwnershipController at line 41 — caller must own the station
                      Approval-to-official escalation gated on hardcoded "approved" string check

Why Defense Insufficient: Whitelist guards ownership (correct) but not the status value itself.
                           Any non-empty string is accepted and written to DB.

Recommended Fix:      Add VALID_DECISIONS set check before DAL call.

Suggested Patch:

  reviewFuelPriceSuggestion.controller.js — add after line 27 (decidedByActorId check):

    const VALID_DECISIONS = new Set(["approved", "rejected"]);
    if (!VALID_DECISIONS.has(decision)) {
      return { ok: false, reason: "invalid_decision" };
    }

Follow-up Command:  Wolverine
```

---

```
SECURITY FINDING

Finding ID:         ELEK-2026-05-27-005
Title:              Unvalidated evidence JSONB: arbitrary object stored with no schema enforcement
Category:           Injection
Severity:           LOW
Status:             Open
Scope:              VCSM
Location:           submitFuelPriceSuggestion.controller.js:35, 148-156
                    vportFuelPriceSubmissions.write.dal.js:25, 43

Source:             evidence = {} parameter — hook-supplied
                    submitFuelPriceSuggestion.controller.js:35 destructured from caller

Trust Boundary:     submitFuelPriceSuggestion.controller.js — no evidence validation anywhere
                    Controller signature: evidence = {} (arbitrary object, no shape check)

Sink:               vportFuelPriceSubmissions.write.dal.js:43
                      evidence,  ← entire caller-supplied object written to JSONB column

Impact:             Forward-looking XSS risk only — no current exploit path.
                    Any future UI component that renders evidence content using
                    dangerouslySetInnerHTML or equivalent would execute stored attacker payloads.
                    Currently: no evidence field rendered anywhere in the codebase.
                    Closing this now prevents a future regression.

Evidence:
  submitFuelPriceSuggestion.controller.js:35  → evidence = {}  [no schema check]
  submitFuelPriceSuggestion.controller.js:155 → evidence,      [raw passthrough to DAL]
  vportFuelPriceSubmissions.write.dal.js:43   → evidence,      [raw passthrough to INSERT]
  — UI always passes evidence: {} (empty). No rendering component exists.

Reproduction Steps:
  1. Call submitFuelPriceSuggestionController with evidence: { __proto__: { xss: "<script>alert(1)</script>" } }
  2. Observe: arbitrary JSON stored in fuel_price_submissions.evidence
  3. If future component renders evidence.notes with dangerouslySetInnerHTML → XSS
  Currently no rendering path exists.

Existing Defense:   None. evidence parameter has no validation whatsoever.

Why Defense Insufficient: No validation equals open ingestion surface for future rendering.

Recommended Fix:     Option A (preferred — zero cost): Strip evidence entirely from the
                     citizen submit path since the UI never sends it. Remove from DAL INSERT.
                     Option B (if evidence feature is planned): Enforce strict schema
                     { notes?: string, photoUrl?: string } with length and format constraints.

Suggested Patch:

  Option A — Remove evidence from citizen submit path:

    submitFuelPriceSuggestion.controller.js:
      Remove `evidence = {}` from destructuring (line 35)
      Remove `evidence,` from createFuelPriceSubmissionDAL call (line 155)

    vportFuelPriceSubmissions.write.dal.js:
      Remove `evidence = {}` from destructuring (line 25)
      Remove `evidence,` from INSERT payload (line 43)

  Option B — Enforce schema (if evidence feature planned):

    submitFuelPriceSuggestion.controller.js — add before createFuelPriceSubmissionDAL:

      const safeEvidence = {};
      if (evidence && typeof evidence === "object") {
        if (typeof evidence.notes === "string" && evidence.notes.length <= 500) {
          safeEvidence.notes = evidence.notes.trim();
        }
        if (typeof evidence.photoUrl === "string" && /^https:\/\//.test(evidence.photoUrl)) {
          safeEvidence.photoUrl = evidence.photoUrl;
        }
      }
      // pass safeEvidence instead of evidence to createFuelPriceSubmissionDAL

Follow-up Command:  Wolverine
```

---

```
SECURITY FINDING

Finding ID:         ELEK-2026-05-27-006
Title:              Raw error messages rendered to UI — internal error details visible to users
Category:           Secrets Exposure (information disclosure)
Severity:           LOW
Status:             Open
Scope:              VCSM
Location:           components/BulkUpdateFuelPricesModal.jsx:104
                    screens/VportGasPricesView.jsx:90

Source:             controller throws and Supabase DB errors propagated through hook error state

Trust Boundary:     Should be normalized at hook or component layer before rendering

Sink A:             BulkUpdateFuelPricesModal.jsx:104
                      {String(error?.message ?? error)}

Sink B:             VportGasPricesView.jsx:90
                      {String(submitError?.message ?? submitError)}

Impact:             Postgres error messages (constraint violations, policy errors, RLS failures)
                    include table names, constraint names, schema details. Known current leaks:
                    "targetActorId required", "profile not found for actor" — internal guards
                    visible to end user. If a DB-level error reaches the catch (unhandled
                    Supabase error), constraint names like
                    "fuel_price_submissions_profile_id_fkey" would be visible in the UI.
                    Limited to requesting actor's own session — not cross-actor.

Evidence:
  BulkUpdateFuelPricesModal.jsx:104  → {String(error?.message ?? error)}
  VportGasPricesView.jsx:90          → {String(submitError?.message ?? submitError)}
  submitFuelPriceSuggestion.controller.js:60 → reason: "profile_not_found" [controlled]
  submitFuelPriceSuggestion.controller.js:80 → reason: "not_owner" [controlled]
  — Controlled reason codes exist — but raw .message fallback bypasses them

Existing Defense:   Controller uses reason-coded returns (profile_not_found, not_owner, etc.)
                    — but the rendering uses error.message as fallback, which leaks raw throws

Why Defense Insufficient: String(error?.message ?? error) falls back to the raw JS Error
                           message or Supabase PostgrestError.message, bypassing the controlled
                           reason-code system already in place.

Recommended Fix:     Map known reason codes to user-friendly display text in a shared utility.
                     Use mapped text at both render sites. Fall back to generic message.

Suggested Patch:

  Create: gasprices/model/gasErrorMessages.js

    export const GAS_ERROR_MESSAGES = {
      not_owner: "You don't have permission to update this station.",
      out_of_range: "Price is outside the allowed range.",
      too_far_from_official: "Price differs too much from the current official price.",
      profile_not_found: "This station isn't set up yet.",
      invalid_fuel_key: "Fuel type is not recognized.",
      already_pending: "You already have a pending suggestion for this fuel type.",
      invalid_number: "Please enter a valid price.",
      not_pending: "This suggestion has already been reviewed.",
      invalid_decision: "Invalid review decision.",
    };

    export function normalizeGasError(err) {
      if (!err) return null;
      const reason = err?.reason ?? null;
      return GAS_ERROR_MESSAGES[reason] ?? "Something went wrong. Please try again.";
    }

  BulkUpdateFuelPricesModal.jsx:104 — replace:
    // {String(error?.message ?? error)}
    {normalizeGasError(error)}

  VportGasPricesView.jsx:90 — replace:
    // {String(submitError?.message ?? submitError)}
    {normalizeGasError(submitError)}

Follow-up Command:  Wolverine
```

---

```
SECURITY FINDING

Finding ID:         ELEK-2026-05-27-007
Title:              Windows developer path comments in 9 source files — dev machine identity in source
Category:           Secrets Exposure (developer identity in source artifact)
Severity:           LOW
Status:             Open
Scope:              VCSM
Location:           hooks/useVportGasPrices.js:1
                    hooks/useSubmitFuelPriceSuggestion.js:1
                    hooks/useOwnerPendingSuggestions.js:1
                    components/FuelPriceRow.jsx:1
                    components/GasStates.jsx:1
                    components/OwnerPendingSuggestionsList.jsx:1
                    components/OwnerSuggestionReviewCard.jsx:1
                    screens/VportGasPricesScreen.jsx:1
                    screens/VportGasPricesView.jsx:1

Source:             Stale path comments from original Windows development machine

Trust Boundary:     Source build pipeline — comments should be stripped or never committed

Sink:               Production source maps (if Vite source maps enabled in prod build)

Impact:             Developer username "trest" and OneDrive directory structure leaked
                    in source artifact. OSINT/social engineering surface.
                    All 9 confirmed with // C:\Users\trest\OneDrive\Desktop\VCSM\...

Evidence:
  hooks/useSubmitFuelPriceSuggestion.js:1  → // C:\Users\trest\OneDrive\...
  hooks/useOwnerPendingSuggestions.js:1    → // C:\Users\trest\OneDrive\...
  screens/VportGasPricesView.jsx:1         → // C:\Users\trest\OneDrive\...
  [6 additional files — same pattern, line 1]

Reproduction Steps:
  1. Enable source maps in Vite production build
  2. Inspect bundle — path comments appear in source map file content

Existing Defense:   None

Why Defense Insufficient: No build-time comment stripping configured.

Recommended Fix:     Delete line 1 from all 9 affected files.

Suggested Patch:

  Delete the first line from each of these files:
    hooks/useVportGasPrices.js
    hooks/useSubmitFuelPriceSuggestion.js
    hooks/useOwnerPendingSuggestions.js
    components/FuelPriceRow.jsx
    components/GasStates.jsx
    components/OwnerPendingSuggestionsList.jsx
    components/OwnerSuggestionReviewCard.jsx
    screens/VportGasPricesScreen.jsx
    screens/VportGasPricesView.jsx

Follow-up Command:  Wolverine
```

---

## Info Findings

---

```
SECURITY FINDING

Finding ID:         ELEK-2026-05-27-008
Title:              Barrel export leaks resolveActorIdFromProfileId — internal DAL utility as public API
Category:           Injection (architecture surface leak)
Severity:           INFO
Status:             Open
Scope:              VCSM
Location:           index.js:2
                    dal/vportFuelPrices.read.dal.js:12-20

Source:             index.js line 2: export * from "./dal/vportFuelPrices.read.dal"
                    → resolveActorIdFromProfileId is exported alongside public DAL methods

Trust Boundary:     Module public API surface — index.js barrel is the contract

Sink:               Any external feature that imports from gasprices index gets access to
                    resolveActorIdFromProfileId without going through profiles/adapters/

Impact:             Architecture contract violation: cross-feature access must go through
                    adapters only. No active misuse confirmed (grep clean). But the function
                    is discoverable and importable. If adopted, it creates a direct profiles DAL
                    dependency outside the approved adapter path, making the dependency
                    invisible to contract enforcement tooling.

Evidence:
  index.js:2  → export * from "./dal/vportFuelPrices.read.dal"
  dal/vportFuelPrices.read.dal.js:12  → export async function resolveActorIdFromProfileId(...)
  reviewFuelPriceSuggestion.controller.js:7  → internal import (direct, not via barrel — correct)
  submitFuelPriceSuggestion.controller.js  → does NOT import this function

Recommended Fix:     Change barrel export for the read DAL to named exports, excluding
                     resolveActorIdFromProfileId.

Suggested Patch:

  index.js — replace line 2:

    // Before:
    export * from "./dal/vportFuelPrices.read.dal";

    // After (named exports only — excludes internal utility):
    export {
      fetchVportFuelPricesDAL,
      invalidateFuelPriceCache,
    } from "./dal/vportFuelPrices.read.dal";

  resolveActorIdFromProfileId remains importable via its direct module path by internal
  controllers that need it — no internal functionality changes.

Follow-up Command:  Wolverine (architecture hygiene)
```

---

```
SECURITY FINDING

Finding ID:         ELEK-2026-05-27-009
Title:              pendingSubmissions always empty — field name mismatch between controller and hook
Category:           Auth Bypass (functional — owner review UI non-operational)
Severity:           INFO (security context) / HIGH (functional reliability)
Status:             Open
Scope:              VCSM
Location:           hooks/useOwnerPendingSuggestions.js:39-44
                    controller/getVportGasPrices.controller.js:83-88

Source:             getVportGasPricesController return shape (controller:83-88)

Trust Boundary:     Controller API contract — return shape documented implicitly

Sink:               hooks/useOwnerPendingSuggestions.js:39-44
                      const pending =
                        res.pendingSubmissions ??
                        res.pending ??
                        res.pendingSuggestions ??
                        res.submissionsPending ??
                        [];

Impact:             Controller returns:
                      { actorId, settings, official, communitySuggestionByFuelKey }
                    None of the four probed field names exist.
                    pendingSubmissions is ALWAYS [].
                    Owner review panel (OwnerPendingSuggestionsList) is completely non-functional —
                    always shows empty state regardless of actual DB content.
                    Owners cannot review citizen submissions via the dashboard UI.
                    Additional issue: getVportGasPricesController gates pending load on
                    settings.showCommunitySuggestion (line 48) — even if field name fixed,
                    owner review would fail when setting is false.

Evidence:
  controller/getVportGasPrices.controller.js:83-88:
    return { actorId, settings, official, communitySuggestionByFuelKey: latestPendingByFuelKey };
    ← No pendingSubmissions, pending, pendingSuggestions, or submissionsPending key

  hooks/useOwnerPendingSuggestions.js:39-44:
    res.pendingSubmissions ?? res.pending ?? res.pendingSuggestions ?? res.submissionsPending ?? []
    ← All four probes miss — evaluates to []

  controller/getVportGasPrices.controller.js:48:
    if (settings.showCommunitySuggestion) {  ← owner pending load is gated on this setting

Recommended Fix:    Two-part fix:
                    1. Add pendingSubmissions: pending to controller return shape (and load
                       unconditionally for owner context, not gated on showCommunitySuggestion)
                    2. Update hook to use the correct field name

Suggested Patch:

  controller/getVportGasPrices.controller.js — modify return (line 83):

    // BEFORE:
    return { actorId, settings, official, communitySuggestionByFuelKey: latestPendingByFuelKey };

    // AFTER:
    return {
      actorId,
      settings,
      official,
      communitySuggestionByFuelKey: latestPendingByFuelKey,
      pendingSubmissions: pending,  // full list for owner review; always populated
    };

    // ALSO: move pending load outside the showCommunitySuggestion gate
    // OR pass an isOwner flag to the controller so it always loads when owner
    // (simplest: always load pending; the community display gate is separate from owner review)

    // Revised pending load (remove the if (settings.showCommunitySuggestion) gate):
    const { data: pendingRows, error: pendingErr } =
      await fetchPendingFuelPriceSubmissionsDAL({ targetActorId: actorId, fuelKey, limit: 50 });
    if (pendingErr) throw pendingErr;
    const pending = mapFuelPriceSubmissionRows(pendingRows);
    // Still gate communitySuggestionByFuelKey on showCommunitySuggestion for the public display:
    const communitySuggestionByFuelKey = settings.showCommunitySuggestion
      ? pending.reduce(...) : {};

  hooks/useOwnerPendingSuggestions.js:39-44 — replace probe:

    // BEFORE:
    const pending = res.pendingSubmissions ?? res.pending ?? res.pendingSuggestions ?? res.submissionsPending ?? [];

    // AFTER:
    const pending = res.pendingSubmissions ?? [];

Follow-up Command:  Wolverine (this is a HIGH functional bug — owner review is non-functional)
```

---

## False Positives Rejected

```
FALSE POSITIVE REJECTED

Candidate:       Cross-actor ownership write via spoofed ownerUpdate=true
Location:        submitFuelPriceSuggestion.controller.js:79
Rejection reason: Sink (upsertVportFuelPriceDAL) is gated by checkVportOwnershipController
                  which resolves against actor_owners DB table. Confirmed at controller:79:
                  const isOwner = await checkVportOwnershipController({ callerActorId: actorId, targetActorId });
                  if (!isOwner) return { ok: false, reason: "not_owner" };
                  Actor B cannot write to Actor A's fuel_prices regardless of ownerUpdate flag.
Chain gap:       Impact — confirmed BLOCKED
Notes:           Server-side ownership gate fully closes this vector.
```

```
FALSE POSITIVE REJECTED

Candidate:       Null/missing actorId bypass on citizen submit path
Location:        submitFuelPriceSuggestion.controller.js:49
Rejection reason: Controller line 49: if (!actorId) throw new Error("actorId required")
                  createFuelPriceSubmissionDAL unreachable without actorId.
Chain gap:       Impact — confirmed BLOCKED
Notes:           N/A
```

```
FALSE POSITIVE REJECTED

Candidate:       Non-owner access to reviewFuelPriceSuggestion
Location:        reviewFuelPriceSuggestion.controller.js:38-45
Rejection reason: targetActorId is resolved from DB row (subRow.profile_id → resolveActorIdFromProfileId),
                  NOT from caller. Then checkVportOwnershipController verifies caller against
                  actor_owners for that DB-derived targetActorId. Caller cannot manipulate
                  the ownership check target.
Chain gap:       Impact — confirmed BLOCKED
Notes:           Review path ownership derivation from DB row is the correct pattern.
```

```
FALSE POSITIVE REJECTED

Candidate:       SQL injection via fuelKey parameter
Location:        vportFuelPriceSubmissions.write.dal.js:39
Rejection reason: Supabase JS client uses parameterized queries exclusively. All .insert(),
                  .update(), .upsert() calls pass values as bound parameters — never string
                  concatenation into SQL. fuelKey value is stored as data, not executed as SQL.
Chain gap:       Sink — parameterized binding prevents SQL injection regardless of input value
Notes:           Data pollution (ELEK-001) is the real risk, not SQL injection.
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-05-27-001 | fuelKey domain enum validation missing | MEDIUM | Controller + Model | MODERATE | YES — Carnage (CHECK constraint on 2 tables) |
| 2 | ELEK-2026-05-27-002 | Concurrent submission uniqueness gap | MEDIUM | Controller + DAL | MODERATE | YES — Carnage (partial UNIQUE index) |
| 3 | ELEK-2026-05-27-003 | Co-owner routing — client-side isOwner | LOW | Hook + Controller | MODERATE | NO |
| 4 | ELEK-2026-05-27-004 | Decision enum injection | LOW | Controller | SIMPLE | NO |
| 5 | ELEK-2026-05-27-005 | Unvalidated evidence JSONB | LOW | Controller + DAL | SIMPLE | NO |
| 6 | ELEK-2026-05-27-006 | Raw error messages rendered to UI | LOW | Component + Model | SIMPLE | NO |
| 7 | ELEK-2026-05-27-007 | Dev path comments in source | LOW | Source files (9) | SIMPLE | NO |
| 8 | ELEK-2026-05-27-008 | Barrel export leaks internal DAL util | INFO | index.js | SIMPLE | NO |
| 9 | ELEK-2026-05-27-009 | pendingSubmissions always empty (functional bug) | INFO/HIGH | Controller + Hook | MODERATE | NO |

---

## Execution Priority

| Priority | Finding | Rationale |
|---|---|---|
| P0 — Fix now | ELEK-009 | Owner review panel is completely broken — if this feature is in scope for any release, this must ship first |
| P1 — Fix before enabling citizen suggestions | ELEK-001 | Public price table can be polluted with arbitrary labels; visible to all VPORT visitors |
| P1 — Fix before enabling citizen suggestions | ELEK-002 | Review queue can be flooded before any rate limiting exists |
| P2 — Fix before co-owner feature | ELEK-003 | Co-owner gas price management is non-functional until this is fixed |
| P3 — Fix this sprint | ELEK-004 | Enum injection — low impact but trivial to fix |
| P3 — Fix this sprint | ELEK-005 | JSONB evidence — remove or schema-constrain before any rendering is added |
| P3 — Housekeeping | ELEK-006 | Error display normalization — 1 shared utility, 2 callsites |
| P3 — Housekeeping | ELEK-007 | Remove 9 path comments — trivial |
| P4 — Architecture hygiene | ELEK-008 | Barrel export — no active misuse; fix before another feature copies the pattern |

---

## THOR Release Gate Assessment

| Condition | Status |
|---|---|
| Any ELEKTRA finding with Severity = HIGH | NONE |
| Secrets exposure findings | NONE |
| IDOR/BOLA with confirmed code-level exploit | NONE — all ownership gates hold |
| RLS gap on actor-scoped write path | NONE — all write paths owner-gated |

**THOR gate: CAUTION**

No outright release blockers by ELEKTRA's HIGH-severity rules. However:
- ELEK-009 is a HIGH **functional** bug — owner review feature is completely non-functional. If this feature is in scope for the release, it must be fixed.
- ELEK-001 and ELEK-002 are MEDIUM data-integrity gaps that should be closed before the citizen-suggestion feature is enabled in production.
- Owner-only gas price management (no community suggestions) can ship with ELEK-003 through ELEK-008 as open items.

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| Carnage | DB migrations: CHECK constraints on fuel_key (ELEK-001) + partial UNIQUE index on pending submissions (ELEK-002) | PENDING |
| Wolverine | Code patches: ELEK-001 through ELEK-009 — 9 patches, 3 files new/modified | PENDING |
| VENOM | Cross-reference F-001 through F-006 — all findings confirmed at code level; VENOM mitigations validated | COMPLETE (no new action needed) |
| BlackWidow | EC-001, EC-002, EC-003 exploit chains — all grounded by ELEKTRA traces; no additional runtime simulation needed | COMPLETE |
| Thor | Release gate evaluation — CAUTION state documented above | PENDING |

---

*ELEKTRA report — gas prices module — 2026-05-27*  
*Read-only analysis. No source files modified. No patches applied.*  
*All findings grounded in source code evidence. No theoretical risks reported.*  
*Cross-references: VENOM `2026-05-27_venom_gasprices-module-deep-scan.md` · BlackWidow `2026-05-27_blackwidow_gasprices-module-adversarial.md`*
