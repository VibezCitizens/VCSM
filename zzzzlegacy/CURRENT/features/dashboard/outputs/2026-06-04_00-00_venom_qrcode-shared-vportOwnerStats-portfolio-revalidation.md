# VENOM V2 SECURITY REVIEW
## Source-Only Revalidation — qrcode · shared · vportOwnerStats · portfolio

---

## Output Metadata

| Field | Value |
|---|---|
| Feature | qrcode, dashboard/shared, vportOwnerStats, portfolio |
| Command | VENOM |
| Ticket | TICKET-VENOM-CODE-ONLY-REVALIDATION-DASHBOARD-COMPLETE-0001 |
| Scanner Version | 1.1.0 |
| Output Path | CURRENT/outputs/2026/06/04/Venom/2026-06-04_00-00_venom_qrcode-shared-vportOwnerStats-portfolio-revalidation.md |
| Timestamp | 2026-06-04T00:00:00 |

---

## 1. VENOM Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 3 days
Current Date: 2026-06-04
Maps Generated: 2026-06-03T00:22:42Z (approx 24h ago)

| Map                  | Generated At              | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-03T00:22:42Z      | ~24h | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-03T00:22:42Z      | ~24h | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-03T00:22:42Z      | ~24h | FRESH     | HIGH       | PASS   |
| callgraph            | 2026-06-03T00:22:42Z      | ~24h | FRESH     | HIGH       | PASS   |
| rpc-map              | N/A (not loaded)          | —    | —         | —          | N/A    |
| edge-function-map    | N/A (not loaded)          | —    | —         | —          | N/A    |
| route-execution-map  | N/A (not loaded)          | —    | —         | —          | N/A    |
| rpc-execution-map    | N/A (not loaded)          | —    | —         | —          | N/A    |
| edge-execution-map   | N/A (not loaded)          | —    | —         | —          | N/A    |

Overall Preflight: PASS (required maps loaded and FRESH)
Note: Ticket scope required write-surface-map, security-path-map, write-execution-map, callgraph per task prompt.
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Surfaces In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-03T00:22:42Z | ~24h | FRESH | HIGH | 16 | Primary attack surface inventory (portfolio + locksmith) |
| security-path-map | 2026-06-03T00:22:42Z | ~24h | FRESH | HIGH | 16 | Security path inventory |
| write-execution-map | 2026-06-03T00:22:42Z | ~24h | FRESH | HIGH | 1 | Write surface caller chain resolution |
| callgraph | 2026-06-03T00:22:42Z | ~24h | FRESH | HIGH | — | Dependency tracing |

Scanner Version: 1.1.0
Overall Preflight: FRESH
Preflight Action: PASSED
Total surfaces in scope: 16 write + 0 rpc + 0 edge
Total security paths in scope: 16
HIGH confidence paths (resolved): 16
LOW confidence paths (unresolved): 16 (all portfolio/locksmith paths have LOW confidence — route unresolved)

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Features: qrcode / dashboard/shared / vportOwnerStats / portfolio

QRCODE MODULE
Write Surfaces: 0
  No Supabase write calls in dashboard/qrcode/*
  QR write surfaces exist in engines/booking (qr_links) — OUT OF SCOPE for this module

DASHBOARD SHARED MODULE
Write Surfaces: 0
  BackButton.jsx — pure presentational, no data access

VPORTOWNERSTATS MODULE
Write Surfaces: 0
  vportOwnerStats.controller.js — read-only, no write surfaces

PORTFOLIO MODULE
Write Surfaces: 16
  INSERT: 2 (portfolio_items, portfolio_media)
  UPDATE: 3 (portfolio_items, portfolio_items soft-delete, portfolio_media.media_asset_id)
  DELETE: 2 (portfolio_media hard-delete, portfolio_tags)
  UPSERT: 3 (portfolio_tags, locksmith_portfolio_details, barber/locksmith service areas/details)
  Tables affected: vport.portfolio_items, vport.portfolio_media, vport.portfolio_tags,
                   vport.locksmith_portfolio_details, vport.locksmith_service_areas,
                   vport.locksmith_service_details

RPC Calls: 0
Edge Functions: 0
Security Paths: 16
  HIGH confidence (caller chain resolved): 0
  LOW confidence (caller chain unresolved): 16
  Access=protected: 0
  Access=public: 0
  Access=unknown: 16

Execution Paths Resolved: 0 / 16
```

---

## 4. Scanner Signals

| Signal | Source Map | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|
| UPDATE portfolio_media at portfolioMediaRecord.write.dal.js | write-surface-map | HIGH | YES — line 10, .eq('profile_id', callerProfileId) scope present | [SOURCE_VERIFIED] | CLEAR |
| UPSERT locksmith_portfolio_details at locksmithPortfolioDetails.write.dal.js | write-surface-map | HIGH | YES — line 14, no owner scope at DAL layer; caller chain traced to usePortfolioItemSubmit line 123 — parameter mismatch found | [SOURCE_VERIFIED] | VEN-PORT-001 |
| INSERT portfolio_items at portfolioItems.write.dal.js | write-surface-map | HIGH | YES — line 22, no caller scope; controller gate verified at createItem.controller.js line 34 | [SOURCE_VERIFIED] | CLEAR (gated) |
| UPDATE portfolio_items at portfolioItems.write.dal.js | write-surface-map | HIGH | YES — line 50, .eq('id', itemId) only; controller gate verified at updateItem.controller.js line 36 | [SOURCE_VERIFIED] | VEN-PORT-004 |
| UPDATE portfolio_items (soft-delete) | write-surface-map | HIGH | YES — line 84, .eq('id', itemId) only; controller gate at deleteItem.controller.js line 33 | [SOURCE_VERIFIED] | VEN-PORT-004 |
| DELETE portfolio_media at portfolioMedia.write.dal.js | write-surface-map | HIGH | YES — line 51, .eq('id', mediaId); comment: "RLS enforces ownership"; controller gate at removeMedia.controller.js line 39 | [SOURCE_VERIFIED] | VEN-PORT-004 (partial) |
| INSERT portfolio_media at portfolioMedia.write.dal.js | write-surface-map | HIGH | YES — line 16, profileId passed as column; controller gate at addMedia.controller.js line 40 | [SOURCE_VERIFIED] | CLEAR (gated) |
| DELETE/UPSERT portfolio_tags at portfolioTags.write.dal.js | write-surface-map | HIGH | YES — dalReplacePortfolioTags line 62, .eq('portfolio_item_id', itemId) only; controller gate at updateItem.controller.js | [SOURCE_VERIFIED] | VEN-PORT-005 |
| listPortfolio — no visibility filter | portfolioItems.read.dal.js | HIGH | YES — line 47-58, .eq('is_deleted', false) only, no visibility or is_active filter | [SOURCE_VERIFIED] | VEN-PORT-002 |
| probeVportPortfolioController — no auth gate | security-path-map (access: unknown) | LOW | YES — probeVportPortfolio.controller.js line 5, no session/ownership check | [SOURCE_VERIFIED] | VEN-PORT-003 |

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: CURRENT/features/qrcode/BEHAVIOR.md
BEHAVIOR.md exists: NO → MISSING_BEHAVIOR_CONTRACT [qrcode]

BEHAVIOR.md path: CURRENT/features/dashboard-shared/BEHAVIOR.md
BEHAVIOR.md exists: NO → MISSING_BEHAVIOR_CONTRACT [dashboard/shared]

BEHAVIOR.md path: CURRENT/features/vportOwnerStats/BEHAVIOR.md
BEHAVIOR.md exists: NO → MISSING_BEHAVIOR_CONTRACT [vportOwnerStats]

BEHAVIOR.md path: CURRENT/features/portfolio/BEHAVIOR.md
BEHAVIOR.md exists: NO → MISSING_BEHAVIOR_CONTRACT [portfolio]

§5 Security Rules declared: 0 (no contracts to read)
§5 Rules verified in source: 0 / 0
§5 Rules unenforced: NONE (no contract to cross-check against)
§9 Must Never Happen declared: 0
§9 Invariants protected in source: 0 / 0
§9 Invariants unprotected: NONE (no contract to cross-check against)

All findings below are marked UNANCHORED — derived from source only,
no BEHAVIOR.md to validate against.
```

---

## 6. Trust Boundary Findings

---

### FINDING VEN-BEHAV-001 — MISSING_BEHAVIOR_CONTRACT [all four modules]

**VENOM SECURITY FINDING**

- **Finding ID:** VEN-BEHAV-001
- **Location:** CURRENT/features/ (qrcode, dashboard-shared, vportOwnerStats, portfolio)
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** All (Authenticated Citizen, Authenticated VPORT Owner, Public Visitor)
- **Boundary Violated:** Cannot be evaluated — contract absent
- **Contract Violated:** Boundary Isolation Contract (documentation clause)
- **Current behavior:** None of the four modules under review have a BEHAVIOR.md file. §5 Security Rules and §9 Must Never Happen invariants are undeclared. VENOM cannot cross-check enforcement.
- **Risk:** Security posture cannot be fully evaluated without declared Security Rules (§5) and Must Never Happen invariants (§9). All source-based findings in this report are UNANCHORED — they are based on observed code behavior, not a declared contract. Regressions could occur without tripping any declared invariant.
- **Severity:** HIGH
- **Exploitability:** LOW (the missing contract itself is not exploitable — it is a governance gap)
- **Attack Preconditions:** N/A
- **Blast Radius:** All four modules
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Without a BEHAVIOR.md, there is no stated invariant for SPIDER-MAN to test, no declared "Must Never Happen" for THOR to gate, and no §5 Security Rules for future VENOM passes to verify against. Each missing contract is a gap in the governance chain.
- **Recommended mitigation:** Create BEHAVIOR.md for each module at CURRENT/features/[module]/BEHAVIOR.md with §5 Security Rules and §9 Must Never Happen invariants. Route to WOLVERINE for intake.
- **Rationale:** VENOM Behavior Contract Integration — TICKET-BEHAV-VENOM-001.
- **Follow-up command:** Wolverine (intake)
- **CISSP Domain:**
  - Primary: Security Assessment and Testing
  - Secondary: Security and Risk Management

---

### FINDING VEN-PORT-001 — Locksmith Portfolio Detail — Call Signature Mismatch → Broken Ownership Assertion

**VENOM SECURITY FINDING** `[SOURCE_VERIFIED]`

- **Finding ID:** VEN-PORT-001
- **Location:**
  - Caller: `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/hooks/usePortfolioItemSubmit.js:123`
  - Target: `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js:115-134`
  - DAL: `apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithPortfolioDetails.write.dal.js`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** Authenticated VPORT Owner → Owner-only write surface
- **Contract Violated:** Actor Ownership Contract

**Current behavior:**

`usePortfolioItemSubmit.js` calls `ctrlSavePortfolioDetail` with **3 positional arguments**:

```js
// usePortfolioItemSubmit.js line 123
await ctrlSavePortfolioDetail(actorId, itemId, {
  jobType: jobType || "other",
  propertyType: propertyType || null,
  ...
});
```

The controller function signature requires **4 arguments**:

```js
// locksmithOwner.controller.js line 115
export async function ctrlSavePortfolioDetail(identityActorId, actorId, portfolioItemId, detail) {
```

**Resulting argument misalignment:**

| Parameter | Expected | Received |
|---|---|---|
| `identityActorId` | User-level actor ID | `actorId` (VPORT actor UUID) |
| `actorId` | VPORT actor ID | `itemId` (portfolio item UUID — NOT an actor) |
| `portfolioItemId` | Portfolio item UUID | `{jobType: ..., ...}` (the detail object) |
| `detail` | Detail object | `undefined` |

**Ownership assertion executed with wrong IDs:**

```js
await assertActorOwnsVportActorController({
  requestActorId: actorId,   // VPORT actor — should be user actor
  targetActorId:  itemId,    // portfolio item UUID — should be VPORT actor
})
```

The `identityActorId` variable (the actual user actor) is computed at line 40 of `usePortfolioItemSubmit.js` but is **never passed** to this controller call.

**Risk:**
1. The intended ownership check — "does the user actor own the VPORT?" — is never performed.
2. The actual check uses a VPORT actorId as `requestActorId` and a portfolio item UUID as `targetActorId`. Both are wrong types for `actor_owners` lookup.
3. The assertion will likely throw (portfolio item UUID is not a valid actor ID), blocking the write — this is secure-by-failure but **not a functioning security control**.
4. If the assertion happens to pass in any edge case, the DAL receives the detail object as `portfolio_item_id`, causing a DB-level rejection or silent schema corruption.
5. The user actor's ownership of the VPORT is **never verified** in this write path.

- **Severity:** HIGH
- **Exploitability:** MEDIUM
- **Attack Preconditions:**
  - Authenticated Citizen account required
  - Must reach the locksmith portfolio create/edit flow with `isLocksmith = true`
  - The functional impact (write failure or wrong assertion) is what's exploitable
- **Blast Radius:** Locksmith VPORT portfolio detail writes (per portfolio item creation)
- **Identity Leak Type:** None (no identity exposure — identity MISSING from the check)
- **Cache Trust Type:** None
- **RLS Dependency:** UNVERIFIED — even if RLS exists on `locksmith_portfolio_details`, the app-layer ownership check is broken
- **Why it matters:** The locksmith portfolio detail write path has a broken ownership gate. The user actor's ownership of the VPORT is never verified. The functional consequence is that locksmith portfolio details cannot be saved (assertion fails). The security consequence is that if the assertion were to pass, ownership would not have been verified at all.
- **Recommended mitigation:**

```js
// usePortfolioItemSubmit.js — fix the call:
if (isLocksmith) {
  await ctrlSavePortfolioDetail(identityActorId, actorId, itemId, {
    jobType: jobType || "other",
    // ...
  });
}
```

The `identityActorId` variable is already computed at the top of the hook — it just needs to be passed as the first argument.

- **Rationale:** The controller signature requires `(identityActorId, actorId, portfolioItemId, detail)`. All other locksmith controllers follow this pattern. This call is missing `identityActorId` as arg 1.
- **Follow-up command:** SPIDER-MAN (regression test for correct 4-arg call), ELEKTRA (patch advisory)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

### FINDING VEN-PORT-002 — Portfolio List — Private Items Returned in Public Read

**VENOM SECURITY FINDING** `[SOURCE_VERIFIED]`

- **Finding ID:** VEN-PORT-002
- **Location:**
  - DAL: `engines/portfolio/src/dal/portfolioItems.read.dal.js:38-72` (`dalListPortfolioItemsByProfileId`)
  - Controller: `engines/portfolio/src/controller/listPortfolio.controller.js:21-72`
  - App cache: `apps/VCSM/src/features/profiles/kinds/vport/controller/portfolio/VportPortfolio.controller.js:7`
- **Application Scope:** VCSM + ENGINE
- **Platform Surface:** PWA, Supabase Table/View
- **Trust Boundary:** Public Visitor
- **Boundary Violated:** Public Visitor → Private item read (no ownership required)
- **Contract Violated:** Asset Security, Feed Publishing Contract

**Current behavior:**

`dalListPortfolioItemsByProfileId` filters on:
```js
.eq('is_deleted', false)
// Missing: .eq('visibility', 'public')
// Missing: .eq('is_active', true)
```

Portfolio items with `visibility = 'private'` or `is_active = false` are returned to any viewer who calls `ctrlListPortfolio(actorId)` — including unauthenticated public profile visitors. The controller caches the result for 60 seconds keyed by `actorId`.

**Risk:**

Any actor with a portfolio can create private items (visibility: 'private') with the expectation that those items are not public. Under the current DAL query, private items are returned to every viewer. The 60-second TTL cache spreads this data to all viewers of that actorId's portfolio for a full cache window.

The `PortfolioItemModel` includes `visibility` field in the domain object, confirming the column is tracked and therefore intentionally differentiated — but the DAL does not apply the filter.

- **Severity:** MEDIUM
- **Exploitability:** MEDIUM
- **Attack Preconditions:**
  - No authentication required
  - Any actor's public profile URL is sufficient
  - Target actor must have at least one private portfolio item
- **Blast Radius:** All vport actors with portfolio items marked visibility = 'private' or is_active = false
- **Identity Leak Type:** Resource enumeration, ownership inference
- **Cache Trust Type:** Public-profile-sensitive
- **RLS Dependency:** UNVERIFIED — if RLS on vport.portfolio_items filters by visibility for anon/viewer sessions, this is partially mitigated; if not, private items are returned by DB. Requires DB inspection.
- **Why it matters:** Portfolio items marked as private can contain work-in-progress images, sensitive client work, or personal projects the actor has deliberately hidden. Any public visitor can enumerate them.
- **Recommended mitigation:**

Add visibility and active filters to `dalListPortfolioItemsByProfileId`:

```js
.eq('is_deleted', false)
.eq('is_active', true)
.eq('visibility', 'public')
```

Owner-facing reads (dashboard portfolio manager) should bypass this filter. The engine should accept a `viewerIsOwner` parameter and apply the visibility filter only when false.

- **Rationale:** The `visibility` field is modeled, stored, and returned — it is clearly intended to gate access. The filter is absent at DAL layer with no compensating control observed.
- **Follow-up command:** DB (verify RLS on vport.portfolio_items for visibility), SPIDER-MAN (regression test for public list respecting visibility), ELEKTRA (patch advisory)
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Identity and Access Management

---

### FINDING VEN-PORT-003 — probeVportPortfolioController — No Ownership Gate, Reads Sensitive Session Data

**VENOM SECURITY FINDING** `[SOURCE_VERIFIED]`

- **Finding ID:** VEN-PORT-003
- **Location:**
  - Controller: `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/controller/probeVportPortfolio.controller.js:5-56`
  - Hook: `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/hooks/useVportPortfolioProbe.js:23-38`
  - Panel: `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/components/PortfolioDevDiagnosticPanel.jsx:16`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Authenticated Citizen → Another actor's profile/access/ownership data
- **Contract Violated:** Actor Ownership Contract, Asset Security

**Current behavior:**

`probeVportPortfolioController` accepts `{ actorId, identity, userId, email }` and:
1. Reads `vport.profiles` for the supplied `actorId` (any actor)
2. Reads profile actor access rows for that actor
3. Reads `vc.actor_owners` rows for that actor
4. Returns `result.session = { userId, email }` — caller-supplied session identity in output

No authentication check is performed in the controller. No ownership verification gate exists. The controller will read and return profile data, actor access data, and actor_owners data for **any** actorId passed to it.

The UI protection is:
```js
// PortfolioDevDiagnosticPanel.jsx:16
if (!import.meta.env.DEV) return null;

// useVportPortfolioProbe.js:17
if (!import.meta.env.DEV) return undefined;  // (trace subscription only)
```

The `runProbe` callback (line 23) has no DEV guard — only the trace subscription does.

- **Risk:** The controller is exported from a non-guarded file. Any code path that imports and calls `probeVportPortfolioController` with an arbitrary actorId will get that actor's profile data, actor access rows, and actor_owners. The session email returned in the output passes the caller-supplied email directly through with no filtering.
- **Severity:** MEDIUM
- **Exploitability:** LOW (in production the UI panel is fully hidden; the probe hook's `runProbe` callback would only execute if something else triggers it)
- **Attack Preconditions:**
  - Must reach and invoke the probe controller by another code path (not the dev panel)
  - In production builds: `import.meta.env.DEV = false`, component returns null, probe cannot be triggered through normal UI
  - In development builds: the full probe is available to any actor who can see the dashboard
- **Blast Radius:** Single actor per probe call; any actor's profile/access/ownership data
- **Identity Leak Type:** Actor correlation, Ownership inference, Internal UUID exposure
- **Cache Trust Type:** None
- **RLS Dependency:** ASSUMED — supabase queries in the probe rely on authenticated session for RLS, but the controller does no explicit session verification
- **Why it matters:** Diagnostic controllers that read actor ownership and session metadata should be either fully inlined as dev-only utilities or explicitly protected by both a DEV guard AND an ownership gate. As written, the controller is an ungated read surface for actor ownership data.
- **Recommended mitigation:** Add an explicit ownership gate to `probeVportPortfolioController`:
  ```js
  if (!actorId) throw new Error('[probe] actorId required')
  await assertActorOwnsVportActorController({
    requestActorId: identity?.actorId,
    targetActorId: actorId,
  })
  ```
  Additionally, remove `email` from the returned `result.session` object — userId is sufficient for diagnostic purposes.
- **Rationale:** Diagnostic controllers in non-production builds should still enforce ownership. The absence of an ownership gate means the controller can be called for any actor, not just the viewer's own actor.
- **Follow-up command:** ELEKTRA (patch advisory), SPIDER-MAN (test: probe requires ownership)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Operations, Asset Security

---

### FINDING VEN-PORT-004 — DAL Write Surfaces Without Caller-Scope Filter (Engine-Level)

**VENOM SECURITY FINDING** `[SOURCE_VERIFIED]`

- **Finding ID:** VEN-PORT-004
- **Location:**
  - `engines/portfolio/src/dal/portfolioItems.write.dal.js:50` (`dalUpdatePortfolioItem` — `.eq('id', itemId)`)
  - `engines/portfolio/src/dal/portfolioItems.write.dal.js:84` (`dalSoftDeletePortfolioItem` — `.eq('id', itemId)`)
  - `engines/portfolio/src/dal/portfolioMedia.write.dal.js:51` (`dalDeletePortfolioMedia` — `.eq('id', mediaId)`, comment: "RLS enforces ownership")
- **Application Scope:** VCSM + ENGINE
- **Platform Surface:** Supabase Table/View, Shared Engine
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** None at app layer — controller gates exist. Engine DAL exposes raw write surface.
- **Contract Violated:** None (defense-in-depth gap, not a direct violation)

**Current behavior:**

Three engine DAL write functions operate without a `profile_id` or `portfolio_item_id` scope on the caller:

- `dalUpdatePortfolioItem`: `.update(row).eq('id', itemId)` — any itemId would be updated if called directly
- `dalSoftDeletePortfolioItem`: `.update({is_deleted: true}).eq('id', itemId)` — same
- `dalDeletePortfolioMedia`: `.delete().eq('id', mediaId)` — comment says "RLS enforces ownership"

These are protected at the controller layer:
- `updateItem.controller.js` verifies `existing.profile_id === callerProfileId` AND `isActorOwner(actorId)` before calling the DAL
- `deleteItem.controller.js` verifies the same dual gate
- `removeMedia.controller.js` verifies `media.profile_id === callerProfileId` AND `isActorOwner(actorId)`

The DAL functions themselves have no internal ownership enforcement.

- **Risk:** Defense-in-depth gap at engine DAL layer. If any other caller reaches these DAL functions without going through the controller gates (dynamic dispatch, future engine consumer, or test utility), arbitrary items can be mutated.
- **Severity:** LOW (controller gates are present and verified; RLS claimed as backup)
- **Exploitability:** LOW (DAL is internal to the engine; no public route resolves to direct DAL calls)
- **Attack Preconditions:**
  - Must bypass the engine's public adapter surface (adapters/index.js)
  - Must call DAL function directly — not possible through normal app flows
- **Blast Radius:** Any portfolio item or media record (if DAL bypassed)
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** ASSUMED for `dalDeletePortfolioMedia` (comment says so); UNVERIFIED for `dalUpdatePortfolioItem` and `dalSoftDeletePortfolioItem`
- **Why it matters:** Engine DALs should ideally accept a `callerProfileId` parameter and include a `.eq('profile_id', callerProfileId)` scope on all mutations, providing defense-in-depth at the data layer independent of controller enforcement.
- **Recommended mitigation:** Add `callerProfileId` parameter to `dalUpdatePortfolioItem` and `dalSoftDeletePortfolioItem`, applied as `.eq('profile_id', profileId)` on the update query. Verify RLS on vport.portfolio_items for UPDATE operations.
- **Rationale:** The pattern is already implemented correctly in `updatePortfolioMediaAssetIdDAL` (VCSM app-level DAL), which adds `.eq('profile_id', callerProfileId)`. The engine DALs should follow the same pattern.
- **Follow-up command:** DB (verify RLS for vport.portfolio_items UPDATE), ELEKTRA (optional hardening advisory)
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Software Development Security

---

### FINDING VEN-PORT-005 — dalReplacePortfolioTags — Full-Delete Without Ownership Scope

**VENOM SECURITY FINDING** `[SOURCE_VERIFIED]`

- **Finding ID:** VEN-PORT-005
- **Location:** `engines/portfolio/src/dal/portfolioTags.write.dal.js:58-76` (`dalReplacePortfolioTags`)
- **Application Scope:** VCSM + ENGINE
- **Platform Surface:** Supabase Table/View, Shared Engine
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** None at app layer — controller gate present
- **Contract Violated:** None (hardening gap)

**Current behavior:**

```js
export async function dalReplacePortfolioTags({ itemId, tags }) {
  // Delete ALL tags for this itemId:
  await supabase.schema('vport').from('portfolio_tags').delete().eq('portfolio_item_id', itemId)
  // Then reinsert:
  return dalInsertPortfolioTags({ itemId, tags })
}
```

No `profile_id` or caller-ownership scope on the DELETE. Any `itemId` passed would have all its tags deleted. The owning controller (`updateItem`) verifies ownership before calling this.

- **Risk:** Same class as VEN-PORT-004 — a direct DAL call without controller intermediary could delete all tags for any portfolio item.
- **Severity:** LOW
- **Exploitability:** LOW
- **Attack Preconditions:** Same as VEN-PORT-004 — must bypass engine adapter
- **Blast Radius:** Single portfolio item's tags per call
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** UNVERIFIED
- **Why it matters:** A full-delete-then-reinsert pattern without ownership scope is a potential data loss surface at the DAL layer if called without controller gates.
- **Recommended mitigation:** Add `callerProfileId` to `dalReplacePortfolioTags` and verify the itemId's `profile_id` matches before executing the delete.
- **Rationale:** Consistent with recommended hardening in VEN-PORT-004.
- **Follow-up command:** DB (verify RLS for vport.portfolio_tags DELETE)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering

---

## 7. Source Verification Summary

| Module | Write Surfaces | Surfaces Source-Verified | Auth Gate Present | Ownership Gate Present | Notes |
|---|---|---|---|---|---|
| qrcode | 0 | — | N/A | N/A | Pure render module |
| dashboard/shared | 0 | — | N/A | N/A | Single UI component |
| vportOwnerStats | 0 | 3 reads verified | YES (assertActorOwnsVportActor) | YES (callerActorId required) | CLEAR |
| portfolio (engine) | 10 | 10 / 10 | YES (isActorOwner) | YES (profileId cross-check) | VEN-PORT-001,002,004,005 |
| portfolio (VCSM app) | 6 | 6 / 6 | YES (via engine) | YES (via engine) | VEN-PORT-001,003 |

Source files read:
- `apps/VCSM/src/features/dashboard/qrcode/adapters/qrcode.adapter.js`
- `apps/VCSM/src/features/dashboard/qrcode/components/QrCode.jsx`
- `apps/VCSM/src/features/dashboard/qrcode/components/QrCard.jsx`
- `apps/VCSM/src/features/dashboard/qrcode/components/flyer/ClassicFlyer.jsx`
- `apps/VCSM/src/features/dashboard/qrcode/components/flyer/PosterFlyer.jsx`
- `apps/VCSM/src/features/dashboard/qrcode/__tests__/qrcode.spiderman.test.js`
- `apps/VCSM/src/features/dashboard/shared/components/BackButton.jsx`
- `apps/VCSM/src/features/dashboard/shared/__tests__/shared.spiderman.test.js`
- `apps/VCSM/src/features/dashboard/vport/controller/vportOwnerStats.controller.js`
- `apps/VCSM/src/features/dashboard/vport/hooks/useOwnerQuickStats.js`
- `apps/VCSM/src/features/dashboard/vport/controller/__tests__/vportOwnerStats.controller.test.js`
- `apps/VCSM/src/features/portfolio/setup.js`
- `apps/VCSM/src/features/portfolio/adapters/portfolioTrace.adapter.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/controller/addPortfolioMediaWithRecord.controller.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/controller/probeVportPortfolio.controller.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/dal/portfolioMediaRecord.write.dal.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/hooks/usePortfolioItemSubmit.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/hooks/usePortfolioMediaUpload.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/hooks/useVportPortfolioProbe.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/components/PortfolioDevDiagnosticPanel.jsx`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/VportDashboardPortfolioScreen.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopPortfolioUpdateAsPost.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithPortfolioDetails.write.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/portfolio/VportPortfolio.controller.js`
- `engines/portfolio/src/config.js`
- `engines/portfolio/src/controller/createItem.controller.js`
- `engines/portfolio/src/controller/deleteItem.controller.js`
- `engines/portfolio/src/controller/updateItem.controller.js`
- `engines/portfolio/src/controller/addMedia.controller.js`
- `engines/portfolio/src/controller/removeMedia.controller.js`
- `engines/portfolio/src/controller/listPortfolio.controller.js`
- `engines/portfolio/src/dal/portfolioItems.write.dal.js`
- `engines/portfolio/src/dal/portfolioItems.read.dal.js`
- `engines/portfolio/src/dal/portfolioMedia.write.dal.js`
- `engines/portfolio/src/dal/portfolioTags.write.dal.js`
- `engines/portfolio/src/model/PortfolioItem.model.js`

CRITICAL findings: 0
All [SOURCE_VERIFIED]: N/A (no CRITICAL findings)

---

## 8. Confidence Summary

| Tag | Count |
|---|---|
| [SOURCE_VERIFIED] | 6 (all non-trivial findings) |
| [SCANNER_LEAD] | 0 |
| [SCANNER_LOW_CONF] | 0 |
| [SCANNER_STALE] | 0 |

HIGH confidence surfaces: 16
LOW confidence surfaces (unresolved caller chain): 16 (all portfolio paths — scanner could not resolve route→controller chain; manually traced)
All CRITICAL findings: 0

---

## 9. THOR Impact

THOR Release Blockers: NONE

| Finding | Severity | THOR Status | Reason |
|---|---|---|---|
| VEN-BEHAV-001 | HIGH | CAUTION | Missing behavior contracts for all 4 modules |
| VEN-PORT-001 | HIGH | CAUTION | Locksmith portfolio detail save broken — functional + ownership |
| VEN-PORT-002 | MEDIUM | CAUTION | Private portfolio items returned to public viewers |
| VEN-PORT-003 | MEDIUM | CAUTION | Probe controller reads actor ownership without ownership gate |
| VEN-PORT-004 | LOW | CLEAR | Engine DAL hardening gap — controller gates present |
| VEN-PORT-005 | LOW | CLEAR | Engine DAL hardening gap — controller gates present |

Highest Open Severity: HIGH

---

## 10. Module Security Inventory

### Module 1 — qrcode

| Item | Detail |
|---|---|
| Routes | None (rendering component only) |
| Hooks | None |
| Controllers | None |
| DALs | None |
| Write surfaces | 0 |
| Ownership gates | N/A |
| Auth gates | N/A |

**Trust boundary:** Value passed as prop by parent caller. QR URL builders enforce `isQrSafeSlug()` validation at the view layer (verified by SPIDERMAN tests). `ClassicFlyer` renders `menuUrl` in clickable `<a href>` — mitigated upstream by slug validation confirmed in flyer view test.

**Security posture: CLEAR** (no write surfaces; rendering only; upstream URL validation confirmed by test coverage)

---

### Module 2 — dashboard/shared

| Item | Detail |
|---|---|
| Routes | None |
| Hooks | None |
| Controllers | None |
| DALs | None |
| Write surfaces | 0 |
| Components | BackButton.jsx (presentational) |

**Security posture: CLEAR** (single UI component; no data access; SPIDERMAN test verifies no forbidden imports)

---

### Module 3 — vportOwnerStats

| Item | Detail |
|---|---|
| Routes | None (consumed via hook) |
| Hooks | `useOwnerQuickStats(actorId, callerActorId)` |
| Controllers | `loadOwnerQuickStatsController({ actorId, callerActorId })` |
| DALs | 3 read DALs (profile, resources, bookings) |
| Write surfaces | 0 |
| Ownership gate | `assertActorOwnsVportActorController` — called BEFORE all DAL reads |
| Auth gate | Requires `callerActorId` — session must supply identity |

**Trust boundary trace:**
- User session → `useIdentity()` → `callerActorId`
- Hook passes both `actorId` and `callerActorId` to controller
- Controller verifies `callerActorId` owns `actorId` via `assertActorOwnsVportActorController`
- Only then reads: profile → resources → bookings

**Data returned:** `{ todayCount, upcomingCount, activeBarbers }` — aggregate counts only, no PII or sensitive fields.

**Test coverage:** SPIDERMAN test covers: missing actorId rejection, missing callerActorId rejection, unauthorized caller rejection (before any DAL call), stats read post-ownership, no-resource early return. All paths verified.

**Security posture: CLEAR**

---

### Module 4 — portfolio (multi-layer)

| Layer | Write Surfaces | Auth Gate | Ownership Gate | Posture |
|---|---|---|---|---|
| Engine controllers | 5 (create/update/delete/addMedia/removeMedia) | YES (isActorOwner) | YES (profileId cross-check) | PARTIAL |
| Engine DALs (items) | 3 (insert/update/softdelete) | Inherited from engine | NO caller scope at DAL | PARTIAL |
| Engine DALs (media) | 2 (insert/delete) | Inherited from engine | Partial (insert has profileId col; delete relies on RLS) | PARTIAL |
| Engine DALs (tags) | 3 (insert/delete/replace) | Inherited from engine | NO caller scope at DAL | PARTIAL |
| VCSM app controllers | 2 (addPortfolioMediaWithRecord, probeVport) | Via engine for addMedia; NONE for probe | Via engine for addMedia; NONE for probe | PARTIAL |
| VCSM app DAL | 1 (updatePortfolioMediaAssetIdDAL) | Inherited from caller | YES (callerProfileId scope) | CLEAR |
| VCSM app hook | 1 (usePortfolioItemSubmit) | Via engine isActorOwner | BROKEN for locksmith detail (VEN-PORT-001) | OPEN |
| Locksmith controller | 1 (ctrlSavePortfolioDetail) | YES (assertActorOwnsVportActor) | Correct — but called with wrong args | OPEN |

**Security posture: PARTIAL → OPEN (VEN-PORT-001 locksmith path broken)**

---

## 11. Required Follow-Up Commands

| Priority | Finding | Command | Action |
|---|---|---|---|
| P1 | VEN-PORT-001 | ELEKTRA | Patch advisory: fix 4-arg call signature in usePortfolioItemSubmit |
| P1 | VEN-PORT-001 | SPIDER-MAN | Regression test: ctrlSavePortfolioDetail called with identityActorId as arg 1 |
| P2 | VEN-PORT-002 | DB | Verify RLS on vport.portfolio_items for visibility field |
| P2 | VEN-PORT-002 | ELEKTRA | Patch: add visibility/is_active filter to dalListPortfolioItemsByProfileId |
| P2 | VEN-PORT-003 | ELEKTRA | Patch: add ownership gate to probeVportPortfolioController |
| P3 | VEN-PORT-004 | DB | Verify RLS on vport.portfolio_items for UPDATE |
| P3 | VEN-BEHAV-001 | Wolverine | Intake: create BEHAVIOR.md for all 4 modules |

---

## 12. Mitigation Plan

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-PORT-001 | Broken locksmith portfolio ownership assertion | Hook (usePortfolioItemSubmit) | P1 | App | ELEKTRA, SPIDER-MAN |
| VEN-PORT-002 | Private portfolio items exposed to public | Engine DAL | P2 | Engine | DB, ELEKTRA |
| VEN-PORT-003 | Probe controller reads actor data without ownership gate | Controller | P2 | App | ELEKTRA |
| VEN-PORT-004 | DAL write without caller-profile scope | Engine DAL | P3 | Engine | DB |
| VEN-PORT-005 | Tag replace-delete without caller scope | Engine DAL | P3 | Engine | DB |
| VEN-BEHAV-001 | Missing behavior contracts for all modules | Documentation | P2 | Documentation | Wolverine |

---

## 13. CISSP Domain Coverage Summary

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VEN-BEHAV-001 — governance gap from missing behavior contracts |
| Asset Security | 2 | VEN-PORT-002 (private items), VEN-PORT-003 (actor data exposure) |
| Security Architecture and Engineering | 2 | VEN-PORT-004, VEN-PORT-005 — DAL defense-in-depth gaps |
| Communication and Network Security | 0 | No route/RPC/edge function surfaces in scope; not applicable |
| Identity and Access Management | 3 | VEN-PORT-001 (broken ownership), VEN-PORT-003 (no ownership gate), VEN-BEHAV-001 (secondary) |
| Security Assessment and Testing | 1 | VEN-BEHAV-001 — no BEHAVIOR.md contracts to drive tests |
| Security Operations | 1 | VEN-PORT-003 — diagnostic controller returns sensitive session data |
| Software Development Security | 3 | VEN-PORT-001 (call signature mismatch), VEN-PORT-004, VEN-PORT-005 |

**CISSP Completion Rule:**
- All findings assigned to CISSP domains: YES
- CISSP summary table included: YES
- Uncovered domains: Communication and Network Security — no route/RPC/edge function surfaces in scope for these modules; out of scope for this review, not a gap.
- All other domains covered meaningfully: YES

---

## 14. Final Scorecard

| Module | Security Score | Open Findings | THOR Status |
|---|---|---|---|
| qrcode | 9/10 — CLEAR | VEN-BEHAV-001 (behavior contract) | CLEAR |
| dashboard/shared | 10/10 — CLEAR | VEN-BEHAV-001 (behavior contract) | CLEAR |
| vportOwnerStats | 9/10 — CLEAR | VEN-BEHAV-001 (behavior contract) | CLEAR |
| portfolio | 6/10 — PARTIAL | VEN-PORT-001 (HIGH), VEN-PORT-002 (MEDIUM), VEN-PORT-003 (MEDIUM), VEN-PORT-004 (LOW), VEN-PORT-005 (LOW) | CAUTION |

**Cross-cutting:** VEN-BEHAV-001 (HIGH) — all four modules lack BEHAVIOR.md

---

## 15. Recommended Next Ticket

**TICKET-PORT-SECURITY-001**
```
Type: SEC
App: VCSM + ENGINE
Priority: P1
Status: Open
Goal: Fix locksmith portfolio detail call signature (VEN-PORT-001) and add visibility filter to portfolio list (VEN-PORT-002)
Scope:
  1. usePortfolioItemSubmit.js:123 — add identityActorId as first arg to ctrlSavePortfolioDetail
  2. dalListPortfolioItemsByProfileId — add .eq('visibility', 'public').eq('is_active', true) for public reads
  3. probeVportPortfolioController — add assertActorOwnsVportActorController gate
Next Action: ELEKTRA for patch advisory on all three
```

---

## VENOM_SOURCE_ONLY_REVALIDATION_COMPLETE

**Review Completed:** 2026-06-04
**Reviewer:** VENOM V2
**Trigger:** TICKET-VENOM-CODE-ONLY-REVALIDATION-DASHBOARD-COMPLETE-0001
**Findings Summary:** 1 HIGH (governance) · 1 HIGH (ownership) · 2 MEDIUM · 2 LOW = 6 total
**THOR Release Blockers:** NONE (no CRITICAL findings; HIGH findings are CAUTION)
**Write 1 (report):** CURRENT/outputs/2026/06/04/Venom/2026-06-04_00-00_venom_qrcode-shared-vportOwnerStats-portfolio-revalidation.md — COMPLETE
**Write 2 (SECURITY.md):** Pending — see below
