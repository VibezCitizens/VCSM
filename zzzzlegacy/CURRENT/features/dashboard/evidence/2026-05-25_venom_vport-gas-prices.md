# VENOM SECURITY AUDIT
**Date:** 2026-05-25  
**Reviewer:** VENOM  
**Feature:** VPORT Gas Prices Module  
**Trigger:** ARCHITECT module review surfaced CRITICAL ownership gap in `reviewFuelPriceSuggestion.controller.js`  
**Application Scope:** VCSM  
**Findings:** 1 CRITICAL | 3 HIGH | 3 MEDIUM | 3 LOW  

---

## VENOM TARGET

**Feature / Route / Engine:** VPORT Gas Prices — Public View + Owner Dashboard  
**Application Scope:** VCSM  
**Reason for review:** ARCHITECT identified missing app-layer ownership check in `reviewFuelPriceSuggestionController`. Full security audit requested.  
**Primary trust boundary:** Authenticated Citizen → Authenticated VPORT Owner

---

## SECURITY SURFACE

**Entry points:**  
- `/actor/:actorId/gas` — public gas price view (read + citizen submission)  
- `/actor/:actorId/dashboard/gas` — owner dashboard (review, approve, reject, unit change, direct update)

**Auth source:** Supabase session via `useIdentity()` hook  
**Authorization layer:** `OwnerOnlyDashboardGuard` (UI-only) + partial controller checks  
**Identity surface:** `actorId` from session / URL params  
**Sensitive objects involved:**  
- `fuel_prices` — official station prices (public trust signal)  
- `fuel_price_submissions` — citizen suggestions with proposed prices + submitter actor IDs  
- `fuel_price_submission_reviews` — approval/rejection audit log  
- `fuel_price_history` — permanent price change record with actor attribution  
- `station_price_settings` — sanity validation bounds (min/max price, delta limits)  
- `vc.posts` — public feed posts (fuel price update publications)

---

## TRUST BOUNDARY TRACE

**Client input:** `submissionId`, `decidedByActorId`, `decision`, `applyToOfficialOnApprove` — all caller-supplied  
**Validated at:** `reviewFuelPriceSuggestion.controller.js` — presence only (no ownership)  
**Identity resolved at:** `useIdentity()` (session-bound) — passed via hook to controller  
**Authorization enforced at:** `OwnerOnlyDashboardGuard` (UI only — not DB-enforced)  
**Data returned to:** React state via hook → component render

---

## FINDINGS

---

### VENOM SECURITY FINDING — F-001

**Finding ID:** F-001  
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/gas/reviewFuelPriceSuggestion.controller.js`  
**Application Scope:** VCSM  

**Platform Surface:**
- PWA
- Supabase Table/View (fuel_prices, fuel_price_submissions, fuel_price_submission_reviews, fuel_price_history)

**Trust Boundary:**
- Authenticated Citizen
- Authenticated VPORT Owner

**Boundary Violated:** Authenticated Citizen → Authenticated VPORT Owner

**Contract Violated:**
- Actor Ownership Contract
- Feed Publishing Contract (official price posts can be forged)

**Current behavior:**  
`reviewFuelPriceSuggestionController` accepts `{ submissionId, decision, decidedByActorId }` from the caller. It validates that all three fields are present, then:
1. Fetches the submission by `submissionId` (UUID accepted directly from caller — no access check)
2. Updates the submission status to `approved` or `rejected`
3. On approval: resolves the station's `targetActorId` from the submission's `profile_id`, then **upserts the official fuel price** and **writes a permanent history entry**
4. Creates a review record attributing the action to `decidedByActorId`

At no point does the controller verify that `decidedByActorId` is the actual owner of the station referenced in the submission. The `OwnerOnlyDashboardGuard` that wraps the dashboard route is explicitly documented as a "UI convenience only, NOT the authoritative security boundary."

**Attack chain:**  
```
Attacker = authenticated Citizen with actorId = C1
Target   = gas station VPORT with actorId = V1 (not owned by C1)

1. Attacker obtains a pending submissionId UUID
   - Via public read if anon GRANT on fuel_price_submissions has broad RLS (see F-005)
   - Via timing/correlation of their own submitted suggestion IDs
   - Via network observation (UUID returned in submission response)

2. Attacker calls directly:
   reviewFuelPriceSuggestionController({
     submissionId: "known-uuid",
     decision: "approved",
     decidedByActorId: "C1",  // attacker's own actorId
     applyToOfficialOnApprove: true
   })

3. Controller proceeds:
   → fetches submission (no access check ✓ passes)
   → submission.status === "pending" ✓ passes
   → resolves V1 from submission.profile_id
   → upserts fuel_prices for V1 (OFFICIAL PRICE OVERWRITTEN)
   → inserts fuel_price_history for V1 (PERMANENT AUDIT RECORD POISONED)
   → creates review attributed to C1

4. Result: Attacker has set the official fuel price at V1 to any value.
   Station owner sees incorrect prices, history log is corrupted.
```

**Risk:** Official fuel price manipulation at any gas station VPORT. Any authenticated citizen can approve or reject price submissions for stations they do not own, overwriting official prices displayed to the public and poisoning the permanent audit trail.

**Severity:** CRITICAL

**Exploitability:** HIGH  
**Attack Preconditions:**
- Authenticated Citizen account required (standard signup — no elevated privilege needed)
- One valid `submissionId` UUID (returned to submitter on creation; potentially discoverable via public read)
- No ownership verification required
- Attack is repeatable across all gas station VPORTs in the system

**Blast Radius:**
- Multi-actor (all gas station VPORTs)
- Public feed contamination (official price posts can be triggered)
- External API consumers (if any external site reads fuel prices from VCSM)
- Audit trail corruption (history table permanently records forged decisions)

**Identity Leak Type:** Actor correlation (review log incorrectly attributes action to attacker's actorId)

**Cache Trust Type:** Financial-sensitive (fuel prices are cached with 60s TTL — incorrect prices persist in cache after attack)

**RLS Dependency:** ASSUMED — no RLS policy inspection was performed on `fuel_prices`, `fuel_price_submission_reviews`, or `fuel_price_history`. The migration file confirms GRANTs were applied to `fuel_price_submissions` and `fuel_price_submission_reviews`, but no ownership-scoped policy (e.g., `USING (decided_by_actor_id = auth.uid())`) was found.

**Why it matters:**  
This is the only write path in the module that can set official fuel prices via the review pipeline. Attacking it allows price manipulation at scale across all gas stations on the platform, corrupts the audit history, and undermines the trust signal that fuel prices are owner-verified. A single authenticated user can affect every gas station VPORT simultaneously.

**Recommended mitigation:**

**Step 1 — Controller (P0, immediate):**  
Before any write, verify `decidedByActorId` is an owner of the station referenced in the submission. The `checkVportOwnershipController` already exists for this purpose:

```js
// In reviewFuelPriceSuggestion.controller.js, after fetching submission:
const targetActorId = await resolveActorIdFromProfileId(subRow.profile_id);
const isOwner = await checkVportOwnershipController({
  callerActorId: decidedByActorId,
  targetActorId,
});
if (!isOwner) {
  return { ok: false, reason: "not_owner" };
}
```

**Step 2 — Session binding (P1):**  
The controller should not trust `decidedByActorId` as a caller-supplied parameter. It should accept the session user and resolve actorId server-side, or at minimum validate that `decidedByActorId` matches the current Supabase session's user context.

**Step 3 — RLS defense-in-depth (P1, via Carnage/DB):**  
Add RLS policy to `fuel_price_submission_reviews` ensuring only the station owner can INSERT:
```sql
CREATE POLICY "owner_can_review_submissions"
ON fuel_price_submission_reviews
FOR INSERT
WITH CHECK (
  decided_by_actor_id IN (
    SELECT actor_id FROM actor_owners 
    WHERE owned_actor_id = (
      SELECT actor_id FROM profiles WHERE id = (
        SELECT profile_id FROM fuel_price_submissions WHERE id = submission_id
      )
    )
  )
);
```

**Step 4 — Cache invalidation:**  
After fix is deployed, invalidate `fuel_prices` cache for any station where unauthorized reviews may have occurred.

**Rationale:** The `checkVportOwnershipController` exists and is the correct tool for this check. Every other write controller in the gas module either uses direct actorId comparison or the full ownership controller. This one was left without any check, likely as an oversight during development.

**Follow-up command:** Wolverine (P0 fix), Carnage (RLS policy), DB (policy verification)

**CISSP Domain:**
- Primary: Identity and Access Management (5)
- Secondary: Software Development Security (8), Security Architecture and Engineering (3)

---

### VENOM SECURITY FINDING — F-002

**Finding ID:** F-002  
**Location:** `apps/VCSM/src/features/upload/adapters/posts.adapter.js` — `createSystemPost()`  
**Application Scope:** VCSM  

**Platform Surface:**
- PWA
- Supabase Table/View (vc.posts)
- Feed Engine

**Trust Boundary:**
- Authenticated Citizen
- Authenticated VPORT Owner

**Boundary Violated:** Authenticated Citizen → VPORT Actor Identity (post attribution)

**Contract Violated:**
- Feed Publishing Contract
- Actor Ownership Contract

**Current behavior:**  
```js
export async function createSystemPost({ actorId, text, post_type, realm_id }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("not authenticated");

  return insertPost({
    actor_id: actorId,   // ← from caller parameter, NOT from session
    user_id: user.id,    // ← from actual session
    post_type,
    realm_id,
    ...
  });
}
```

`actorId` is accepted from the caller without verifying that the authenticated session's user owns the actor being attributed. The session provides `user_id`, but the post is published under `actor_id` — a separate identity — with no cross-check.

**Risk:** An authenticated user can publish feed posts attributed to any VPORT actor (`actor_id`), not just VPORTs they own. This is a post impersonation / actor attribution forgery attack. Combined with F-001, an attacker could:
1. Forge a price approval (F-001)
2. Publish a fuel price update post attributed to the victimized station (F-002)

**Severity:** HIGH

**Exploitability:** MEDIUM  
**Attack Preconditions:**
- Authenticated session required
- Target `actorId` must be known (actor IDs are often visible in URLs/API responses)
- `post_type` and `realm_id` must be known (discoverable from normal usage)
- RLS policy on `vc.posts` is the only remaining guard — status UNVERIFIED

**Blast Radius:**
- Feed-wide (forged posts appear in public feed attributed to victim actor)
- Single VPORT target per attack, but repeatable across all actors
- Subscriber trust impact (subscribers see fabricated price announcements)

**Identity Leak Type:** Actor correlation (post misattributed to victim actor)

**Cache Trust Type:** Public-profile-sensitive (feed posts are public-facing, cached by feed consumers)

**RLS Dependency:** UNVERIFIED — `vc.posts` RLS policy was not inspected. If RLS validates `actor_id` against the session user's owned actors, this is mitigated at DB level. If RLS only checks `user_id = auth.uid()`, the actor_id field is unconstrained.

**Why it matters:**  
The `createSystemPost` adapter is a shared utility called by multiple vport controllers (locksmith, barbershop, gas, exchange rate). A vulnerability here affects the entire system post creation surface — not just gas prices.

**Recommended mitigation:**  
Add an ownership assertion before the insert:
```js
// Verify caller owns the actor they're posting as
const owned = await checkActorOwnership({ userId: user.id, actorId });
if (!owned) throw new Error("createSystemPost: caller does not own actorId");
```
Or pass the session-derived actorId rather than accepting it as a parameter.

**Rationale:** Post attribution is a trust signal for the feed. Allowing arbitrary `actor_id` values without ownership verification creates an impersonation surface.

**Follow-up command:** Wolverine, Venom (upstream audit of all createSystemPost callers)

**CISSP Domain:**
- Primary: Identity and Access Management (5)
- Secondary: Software Development Security (8)

---

### VENOM SECURITY FINDING — F-003

**Finding ID:** F-003  
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/gas/reviewFuelPriceSuggestion.controller.js`  
**Application Scope:** VCSM  

**Platform Surface:**
- PWA
- Supabase Table/View

**Trust Boundary:** Authenticated Citizen

**Boundary Violated:** Authenticated Citizen → VPORT Submission Access (resource enumeration)

**Contract Violated:** Actor Ownership Contract

**Current behavior:**  
`fetchFuelPriceSubmissionByIdDAL({ submissionId })` accepts a UUID directly from the caller. The DAL fetches the submission with no ownership filter — any valid `submissionId` returns the full submission row regardless of who submitted it or which station it belongs to.

This is directly exploited in the F-001 attack chain: an attacker who discovers one `submissionId` UUID can target the corresponding station.

**Risk:** Unauthenticated (or low-privilege) enumeration of fuel price submissions. An attacker can probe arbitrary UUIDs to retrieve submission data (proposed prices, submitter actor IDs, target station identity) without owning the station or having submitted the suggestion.

**Severity:** HIGH

**Exploitability:** MEDIUM  
**Attack Preconditions:**
- Authenticated session required
- Valid `submissionId` UUID required (returned to own submitter; potentially discoverable via anon GRANT — see F-005)
- No ownership check at DAL or controller level

**Blast Radius:**
- Multi-actor (all gas station VPORTs with pending submissions)
- Internal data exposure (proposed prices before official publication)

**Identity Leak Type:**
- Internal UUID exposure (submissionId)
- Actor correlation (submitted_by_actor_id in submission row)

**Cache Trust Type:** None (submissions are uncached)

**RLS Dependency:** UNVERIFIED — RLS on `fuel_price_submissions` is known to have GRANTs applied; policy content and ownership scope are unknown.

**Why it matters:**  
Without a caller-access check on submission fetches, the review controller becomes a read oracle for pending submission data. Combined with F-001, this creates a full read-then-manipulate attack path.

**Recommended mitigation:**  
Add an access check in `fetchFuelPriceSubmissionByIdDAL` or the controller:
- Owner access: verify `decidedByActorId` owns the station linked to the submission
- Submitter access: verify `decidedByActorId` is the original submitter
- Alternatively: pass `targetActorId` to the DAL and filter `WHERE id = submissionId AND profile_id = resolvedProfileId`

**Rationale:** Submissions are internal review-queue items. Access should be scoped to the station owner or the original submitter only.

**Follow-up command:** Wolverine, DB

**CISSP Domain:**
- Primary: Identity and Access Management (5)
- Secondary: Asset Security (2)

---

### VENOM SECURITY FINDING — F-004

**Finding ID:** F-004  
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/gas/reviewFuelPriceSuggestion.controller.js` — `decidedByActorId` parameter  
**Application Scope:** VCSM  

**Platform Surface:**
- PWA
- Supabase Table/View (fuel_price_submission_reviews)

**Trust Boundary:** Authenticated VPORT Owner

**Boundary Violated:** Authenticated VPORT Owner → Audit Trail Integrity

**Contract Violated:** Actor Ownership Contract

**Current behavior:**  
The controller accepts `decidedByActorId` as a caller-supplied parameter and writes it directly into the `decided_by_actor_id` field of the review record (audit log). There is no session-side verification that this parameter matches the currently authenticated user.

```js
// Controller trusts caller-supplied decidedByActorId:
const { data: reviewRow } = await createFuelPriceSubmissionReviewDAL({
  submissionId,
  decision,
  decidedByActorId,  // ← written to permanent audit log; not session-verified
  ...
});
```

**Risk:** Audit trail forgery. An attacker can attribute an approval or rejection action to any actor ID, including admins, moderators, or station owners. The permanent review log will show the forged actor as the decision maker.

**Severity:** HIGH

**Exploitability:** HIGH (when F-001 is unpatched — no ownership check means this is freely exploitable)

**Attack Preconditions:**
- Authenticated Citizen account required
- Same preconditions as F-001
- Attacker provides any `decidedByActorId` value — no validation

**Blast Radius:**
- Single VPORT (per attack), but repeatable
- Audit trail integrity system-wide (review logs cannot be trusted as attribution evidence)
- Admin/moderation — if admins ever rely on `decided_by_actor_id` for dispute resolution, forged records undermine that

**Identity Leak Type:** Actor correlation (forged attribution)

**Cache Trust Type:** None (review records are not cached)

**RLS Dependency:** ASSUMED — review INSERT policy not inspected

**Why it matters:**  
The audit log (`fuel_price_submission_reviews`) is described as the "immutable" record of who approved/rejected a price suggestion. If attackers can forge `decidedByActorId`, the entire audit trail is untrustworthy. This matters for dispute resolution, compliance, and moderation.

**Recommended mitigation:**  
Do not accept `decidedByActorId` as a caller parameter. Resolve it from the Supabase session server-side:
```js
const { data: { user } } = await supabase.auth.getUser();
// Resolve decidedByActorId from session user → actor mapping
const decidedByActorId = await resolveActorIdFromUserId(user.id);
```

**Rationale:** Audit log attribution must be derived from the authenticated session, not from caller-supplied values. This is a fundamental audit trail integrity principle.

**Follow-up command:** Wolverine, Carnage

**CISSP Domain:**
- Primary: Security Operations (7)
- Secondary: Identity and Access Management (5), Software Development Security (8)

---

### VENOM SECURITY FINDING — F-005

**Finding ID:** F-005  
**Location:** `zNOTFORPRODUCTION/_ACTIVE/migrations/2026-05-10_fix_fuel_price_submissions_grants.sql`  
**Application Scope:** VCSM  

**Platform Surface:**
- Supabase Table/View (fuel_price_submissions)

**Trust Boundary:** Public Visitor (anon role)

**Boundary Violated:** Public Visitor → Internal Submission Queue

**Contract Violated:** Asset Security (sensitive internal data)

**Current behavior:**  
The migration file contains:
```sql
GRANT SELECT TO anon ON fuel_price_submissions;
```
Combined with any RLS policy that allows public read (e.g., `USING (status = 'pending')` or `USING (true)`), this exposes the pending submission queue to all unauthenticated visitors.

**Risk:**  
If the RLS policy is `USING (true)` or `USING (status = 'pending')`, the following data is publicly readable without authentication:
- `submitted_by_actor_id` (submitter identity — actor correlation)
- `proposed_price` (price not yet approved — financial data)
- `submitted_at` (submission timing)
- `profile_id` (internal profile ID of the target station)
- `fuel_key` (which fuel type is targeted)
- `evidence` (any supporting data submitted)

**Severity:** MEDIUM

**Exploitability:** HIGH (if RLS policy is broad)  
**Attack Preconditions:**
- No authentication required
- Knowledge of Supabase endpoint + table name
- Depends entirely on RLS policy scope (UNVERIFIED)

**Blast Radius:**
- Multi-actor (all gas stations with pending submissions)
- SEO/indexing (search crawlers could index submission data if endpoints are discoverable)

**Identity Leak Type:**
- Actor correlation (submitted_by_actor_id exposed)
- Internal UUID exposure (profile_id, submission id)

**Cache Trust Type:** None

**RLS Dependency:** UNVERIFIED — anon GRANT is confirmed; policy scope is unknown. If policy restricts to `submitted_by_actor_id = auth.uid()` for anon (effectively no rows), risk is low. If policy allows broad reads, risk is HIGH.

**Why it matters:**  
Citizen price suggestions are internal review-queue items. Submitter identity and proposed prices should not be visible to the public before approval. Exposing this data via anon GRANT reveals competitive pricing intelligence and personal actor attribution to unauthenticated users.

**Recommended mitigation:**  
1. Audit the RLS policy on `fuel_price_submissions` for the anon role immediately (DB/Carnage)
2. If not needed, revoke the anon GRANT: `REVOKE SELECT FROM anon ON fuel_price_submissions;`
3. If citizen submitters need to read their own submissions (unauthenticated contexts), scope: `USING (submitted_by_actor_id = auth.uid())` — but `auth.uid()` is null for anon, so this effectively blocks all anon access

**Rationale:** Internal submission queues should not be accessible to unauthenticated users. The anon GRANT was likely added for a specific purpose (e.g., public price display) but should be scoped to only approved/official prices, not the pending queue.

**Follow-up command:** DB, Carnage

**CISSP Domain:**
- Primary: Asset Security (2)
- Secondary: Communication and Network Security (4)

---

### VENOM SECURITY FINDING — F-006

**Finding ID:** F-006  
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/gas/submitFuelPriceSuggestion.controller.js` + `updateStationFuelUnit.controller.js`  
**Application Scope:** VCSM  

**Platform Surface:**
- PWA
- Supabase Table/View

**Trust Boundary:** Authenticated VPORT Owner

**Boundary Violated:** Authenticated VPORT Owner → Actor Ownership Contract

**Contract Violated:** Actor Ownership Contract

**Current behavior:**  
Both controllers verify ownership with a simple string comparison:
```js
if (String(actorId) !== String(targetActorId)) {
  return { ok: false, reason: "not_owner" };
}
```
This check assumes that the owning actor's `actorId` is identical to the target VPORT's `actorId`. In the VCSM actor model, a user actor (`kind: 'user'`) can own a VPORT actor (`kind: 'vport'`) through the `actor_owners` table — meaning `user.actorId ≠ vport.actorId`.

The `checkVportOwnershipController` exists precisely for this purpose (traverses `actor_owners`) but is not used here.

**Risk:**  
If an actor's identity context is their user actorId (not the VPORT actorId), the ownership check `actorId !== targetActorId` will incorrectly block legitimate VPORT owners. More critically: if the identity switching always gives the VPORT's own actorId as the active identity, then `actorId === targetActorId` could be satisfied by simply knowing the target VPORT's actorId — without actual ownership verification via `actor_owners`.

**Severity:** MEDIUM

**Exploitability:** LOW (depends on how actor identity switching is implemented — if identity always resolves to the VPORT actorId only when truly owned, this is not directly exploitable)  
**Attack Preconditions:**
- Understanding of identity switching behavior
- Target VPORT actorId
- Session as a VPORT actor (requires legitimate account with that actorId)

**Blast Radius:** Single VPORT

**Identity Leak Type:** None

**Cache Trust Type:** Financial-sensitive (fuel prices updated)

**RLS Dependency:** ASSUMED

**Why it matters:**  
The consistent ownership check pattern across the codebase is `actor_owners` verification via `checkVportOwnershipController`. Deviating from this pattern creates an inconsistency that could become a bypass in edge cases (e.g., delegated VPORT management, future multi-owner scenarios).

**Recommended mitigation:**  
Replace string comparison with `checkVportOwnershipController`:
```js
const isOwner = await checkVportOwnershipController({
  callerActorId: actorId,
  targetActorId,
});
if (!isOwner) return { ok: false, reason: "not_owner" };
```

**Rationale:** `actor_owners` is the canonical ownership table. String comparison bypasses this table entirely and cannot handle multi-owner scenarios or delegated access.

**Follow-up command:** Wolverine

**CISSP Domain:**
- Primary: Identity and Access Management (5)
- Secondary: Security Architecture and Engineering (3)

---

### VENOM SECURITY FINDING — F-007

**Finding ID:** F-007  
**Location:** `apps/VCSM/src/shared/utils/resolveRealm.js`  
**Application Scope:** VCSM  

**Platform Surface:**
- PWA
- Feed Engine
- Supabase Table/View (vc.posts)

**Trust Boundary:** Authenticated VPORT Owner → Feed Publishing

**Boundary Violated:** None (informational — hardening recommendation)

**Contract Violated:** None directly

**Current behavior:**  
```js
export const PUBLIC_REALM_ID = "2d6c267f-9c43-48e4-aa5e-e0a0274e9bc2";
```
The public realm UUID is hardcoded as a string literal in a shared utility that is bundled to the client. This UUID is exposed in the JavaScript bundle delivered to every user's browser.

**Risk:**  
- **Information disclosure:** The internal UUID of the public realm is visible to any user who inspects the client bundle. This enables direct Supabase API calls targeting the specific realm.
- **Environment coupling:** If the UUID changes in a new environment (staging, new production instance), the hardcoded value silently breaks fuel price post publishing without error.
- **Realm spoofing (indirect):** A malicious caller could use the known realm UUID to publish posts or trigger realm-scoped operations directly against the Supabase API.

**Severity:** LOW

**Exploitability:** LOW (realm UUID exposure alone doesn't grant write access — Supabase RLS governs that)

**Blast Radius:** Feed-wide (all realm-scoped operations)

**Identity Leak Type:** Internal UUID exposure

**Cache Trust Type:** None

**RLS Dependency:** REQUIRED (RLS on `vc.posts` must enforce who can publish to the public realm)

**Why it matters:**  
Hardcoded internal UUIDs in client bundles are an information minimization concern. Combined with an unverified `actor_id` in `createSystemPost` (F-002), knowing the realm UUID lowers the barrier to publishing unauthorized posts.

**Recommended mitigation:**  
- Move `PUBLIC_REALM_ID` resolution to an Edge Function or server-side call where it is not bundled to the client
- Or: load realm configuration from an environment variable (`VITE_PUBLIC_REALM_ID`) so it is swappable per environment without code changes

**Rationale:** Internal system UUIDs should not appear in client bundles. This is a defense-in-depth and environment hygiene concern.

**Follow-up command:** Logan (documentation), Wolverine (if ENV var approach chosen)

**CISSP Domain:**
- Primary: Asset Security (2)
- Secondary: Communication and Network Security (4)

---

### VENOM SECURITY FINDING — F-008

**Finding ID:** F-008  
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/dal/gas/vportFuelPricePost.read.dal.js`  
**Application Scope:** VCSM  

**Platform Surface:**
- PWA
- Supabase Table/View (vc.posts, profiles)

**Trust Boundary:** System Service (internal DAL)

**Boundary Violated:** Trust context ambiguity (dual client)

**Contract Violated:** None (informational)

**Current behavior:**  
The file uses two separate Supabase clients:
1. `vportSchema` client → queries `profiles` table (vport schema)
2. Main `supabase` client → queries `vc.posts` table (main schema)

Different client instances may carry different session/auth contexts depending on how they are initialized. If `vportSchema` uses a service role or schema-specific client while `supabase` uses the authenticated user's session, RLS enforcement may differ between the two queries in the same DAL file.

**Risk:**  
Unclear auth context per query. If one client inadvertently uses elevated privileges (service role), it bypasses RLS on whichever table it queries. If both use the same session, the risk is lower, but the intent is opaque.

**Severity:** LOW

**Exploitability:** LOW (depends on client initialization — likely both are session-bound)

**Blast Radius:** Single request scope

**Identity Leak Type:** None

**Cache Trust Type:** None

**RLS Dependency:** ASSUMED for both clients

**Why it matters:**  
Dual client usage in one DAL without documented rationale creates maintainability and security review difficulty. Future developers may not realize the different contexts and introduce client-crossing bugs.

**Recommended mitigation:**  
Add inline documentation explaining why two clients are needed and confirming both use session-bound auth context (not service role). Verify during Carnage/DB audit that neither client is inadvertently elevated.

**Follow-up command:** DB, Logan

**CISSP Domain:**
- Primary: Security Architecture and Engineering (3)
- Secondary: Software Development Security (8)

---

### VENOM SECURITY FINDING — F-009

**Finding ID:** F-009  
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/dal/gas/vportFuelPrices.write.dal.js` — `resolveActorIdFromProfileId` export  
**Application Scope:** VCSM  

**Platform Surface:**
- PWA
- Supabase Table/View

**Trust Boundary:** Internal (DAL layer)

**Boundary Violated:** DAL file responsibility boundary

**Contract Violated:** None (informational — architecture hygiene)

**Current behavior:**  
`resolveActorIdFromProfileId()` is a read function exported from `vportFuelPrices.write.dal.js`. It is consumed by `reviewFuelPriceSuggestionController` to resolve a `targetActorId` from a submission's `profile_id`. The function performs a SELECT against `profiles`.

**Risk:**  
A read function in a write-scoped file creates confusion about the file's responsibility. Developers reading the file may assume all exports are write operations and miss that a read function exists here. In security reviews, write DAL files are scrutinized differently than read DAL files — hiding a read export here may cause it to be overlooked.

**Severity:** LOW

**Exploitability:** LOW (not a direct security vulnerability; primarily a code hygiene concern)

**Blast Radius:** Internal (developer confusion only)

**Identity Leak Type:** None

**Cache Trust Type:** None

**RLS Dependency:** ASSUMED

**Why it matters:**  
The security concern is secondary: the primary issue is that this function is the mechanism by which `reviewFuelPriceSuggestionController` resolves the target actor before writing. If the function is moved or modified without awareness of its consumer, the review controller could silently fail to resolve ownership context.

**Recommended mitigation:**  
Move `resolveActorIdFromProfileId` to `vportFuelPrices.read.dal.js`. Update the import in `reviewFuelPriceSuggestion.controller.js`.

**Rationale:** File scope should accurately reflect responsibility. Read functions belong in read DAL files.

**Follow-up command:** Wolverine

**CISSP Domain:**
- Primary: Software Development Security (8)
- Secondary: Security Operations (7)

---

### VENOM SECURITY FINDING — F-010

**Finding ID:** F-010  
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/gas/publishFuelPriceUpdateAsPost.controller.js` — `stationName` resolution  
**Application Scope:** VCSM  

**Platform Surface:**
- PWA
- Feed Engine
- Supabase Table/View

**Trust Boundary:** Authenticated VPORT Owner

**Boundary Violated:** Minimal (informational — defense in depth gap)

**Contract Violated:** Feed Publishing Contract (partial)

**Current behavior:**  
```js
const stationName = await resolveVportStationNameDAL(actorId);
const text = buildPostText({ stationName, updatedFuels });
```

`resolveVportStationNameDAL` fetches the station's `profiles.name` by `actorId`. No ownership verification is performed before this read — anyone with an `actorId` can resolve the station name via the controller. `buildPostText` uses `updatedFuels` supplied by the caller — including `price`, `currencyCode`, and `unit` — with no validation against actual current prices.

**Risk:**  
1. **Station name oracle:** The controller can be called with any `actorId` to resolve that actor's public name. This is a read-only risk (names are public) but represents unnecessary surface exposure.
2. **Post text injection:** `updatedFuels` array is caller-controlled. An attacker could publish a "fuel price update" post with fabricated prices, arbitrary fuelKey strings, and spoofed currency codes. The post text (`buildPostText`) does no sanitization beyond calling `.toFixed(2)` on price. A very long fuelKey string or crafted text could produce unexpected post content.
3. **Throttle bypass potential:** The 1-hour dedup check (`hasRecentFuelPricePostDAL`) is keyed by `actorId`. If an attacker can call this controller on behalf of another actor (F-002 context), they could trigger or bypass throttling for another station.

**Severity:** LOW (independently), MEDIUM (when combined with F-001/F-002)

**Exploitability:** LOW independently; elevated when chained

**Blast Radius:**
- Feed-wide (fabricated price posts appear in public feed)
- Single VPORT (per attack)

**Identity Leak Type:** None

**Cache Trust Type:** Public-profile-sensitive

**RLS Dependency:** REQUIRED for vc.posts INSERT

**Why it matters:**  
Feed post text is user-visible and feeds public trust in price data. Fabricated price posts — even if the official price is not changed — can mislead users about current fuel costs at a station.

**Recommended mitigation:**  
1. Add `fuelKey` validation against known fuel key enum before building post text
2. Add price sanity bounds (positive number, reasonable range) before including in post text
3. Require `updatedFuels` to match actual current prices from the DB (not just caller input)

**Follow-up command:** Wolverine

**CISSP Domain:**
- Primary: Software Development Security (8)
- Secondary: Feed Publishing Contract (internal)

---

## IDENTITY SURFACE WARNINGS

**IDENTITY SURFACE WARNING — ISW-001**  
**Location:** `reviewFuelPriceSuggestion.controller.js`  
**Current identity surface:** `decidedByActorId` — caller-supplied parameter  
**Expected identity surface:** Session-derived actorId from `supabase.auth.getUser()` → actor resolution  
**Risk:** Any actorId can be attributed as the decision maker; audit trail forgery  
**Suggested correction:** Resolve `decidedByActorId` from session server-side; do not accept as input

**IDENTITY SURFACE WARNING — ISW-002**  
**Location:** `createSystemPost()` in `posts.adapter.js`  
**Current identity surface:** `actorId` — caller-supplied parameter  
**Expected identity surface:** Session-derived actorId validated against `actor_owners`  
**Risk:** Posts attributed to any actor_id regardless of session ownership  
**Suggested correction:** Add `actor_owners` verification before INSERT, or derive actorId from session

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| F-001 — No ownership check in review controller | CRITICAL — price manipulation at any station | Controller | P0 | App | Wolverine |
| F-001 — RLS defense-in-depth on submission reviews | CRITICAL — defense-in-depth | RLS | P0 | DB | Carnage |
| F-002 — createSystemPost actor_id unverified | HIGH — post impersonation | Controller / Adapter | P1 | App | Wolverine |
| F-003 — submissionId access without owner check | HIGH — resource enumeration | Controller + DAL | P1 | App | Wolverine |
| F-004 — decidedByActorId not session-bound | HIGH — audit trail forgery | Controller | P0 (bundled with F-001 fix) | App | Wolverine |
| F-005 — anon GRANT on fuel_price_submissions | MEDIUM — submission data exposure | RLS | P1 | DB | DB |
| F-006 — string compare instead of actor_owners | MEDIUM — ownership model inconsistency | Controller | P1 | App | Wolverine |
| F-007 — PUBLIC_REALM_ID hardcoded in bundle | LOW — internal UUID exposure | UI / Config | P3 | App | Wolverine |
| F-008 — Dual client undocumented | LOW — trust context ambiguity | Documentation | P3 | Documentation | DB |
| F-009 — Read function in write DAL | LOW — file scope confusion | DAL | P2 | App | Wolverine |
| F-010 — updatedFuels caller-controlled in post | LOW/MEDIUM — fabricated price posts | Controller | P2 | App | Wolverine |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | F-001 — systemic ownership governance gap |
| Asset Security | 3 | F-003, F-005, F-007 — submission data exposure, UUID in bundle |
| Security Architecture and Engineering | 3 | F-001, F-006, F-008 — defense-in-depth gaps, dual client |
| Communication and Network Security | 2 | F-005, F-007 — public endpoint + anon access |
| Identity and Access Management | 5 | F-001, F-002, F-003, F-004, F-006 — ownership, attribution, enumeration |
| Security Assessment and Testing | 1 | F-001 — no tests for ownership gate on review path |
| Security Operations | 2 | F-004, F-009 — audit trail integrity, DAL file hygiene |
| Software Development Security | 5 | F-002, F-004, F-006, F-009, F-010 — coding pattern risks |

**Uncovered domains:**  
- **Security Assessment and Testing (6):** Partially covered via F-001 (missing test evidence). Full test coverage audit is out of scope for this review — recommend separate Sentry pass.  
- All 8 CISSP domains were addressed. No domain was fully out of scope for this module.

---

## FINAL RISK SUMMARY

| ID | Severity | Title | P-Level |
|---|---|---|---|
| F-001 | **CRITICAL** | No app-layer ownership check in `reviewFuelPriceSuggestion` | P0 |
| F-002 | **HIGH** | `createSystemPost` actor_id not session-verified | P1 |
| F-003 | **HIGH** | submissionId enumeration — no access check | P1 |
| F-004 | **HIGH** | `decidedByActorId` not session-bound — audit trail forgery | P0 |
| F-005 | **MEDIUM** | anon GRANT on `fuel_price_submissions` — RLS policy unverified | P1 |
| F-006 | **MEDIUM** | Ownership string compare instead of `actor_owners` table | P1 |
| F-007 | LOW | `PUBLIC_REALM_ID` hardcoded UUID in client bundle | P3 |
| F-008 | LOW | Dual Supabase client without documented trust context | P3 |
| F-009 | LOW | Read function exported from write DAL | P2 |
| F-010 | LOW | `updatedFuels` caller-controlled in feed post text | P2 |

**Do not release to production until F-001 and F-004 are resolved.** These are preconditions for any hardened release of the gas prices module.

**Recommended immediate handoffs:**
- 🔴 **Wolverine** — F-001, F-004 (P0 controller fixes)
- 🔴 **Carnage / DB** — F-001 RLS, F-005 anon GRANT audit
- 🟡 **Wolverine** — F-002, F-003, F-006 (P1 controller hardening)
- 🔵 **Thor** — Block release until P0 findings resolved
