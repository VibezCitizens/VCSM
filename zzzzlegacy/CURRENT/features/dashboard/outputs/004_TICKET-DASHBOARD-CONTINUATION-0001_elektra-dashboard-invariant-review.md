# ELEKTRA V2 VULNERABILITY SCAN
## TICKET-DASHBOARD-CONTINUATION-0001 — Phase 4: Dashboard Invariant Review

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | dashboard |
| Feature | dashboard (ALL modules) |
| Command | ELEKTRA |
| Ticket | TICKET-DASHBOARD-CONTINUATION-0001 |
| Scanner Version | 1.1.0 |
| Output Path | CURRENT/outputs/2026/06/04/ELEKTRA/004_TICKET-DASHBOARD-CONTINUATION-0001_elektra-dashboard-invariant-review.md |
| Timestamp | 2026-06-04T00:00:00Z |
| Application Scope | VCSM |
| Scan Trigger | TICKET-DASHBOARD-CONTINUATION-0001 Phase 4 (Invariant Review) + VENOM cross-reference |

---

## 1. ELEKTRA Scanner Preflight

```
ELEKTRA SCANNER PREFLIGHT
===========================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 3 days

| Map                 | Generated At                | Age  | Freshness | Confidence | Status |
|---------------------|-----------------------------|------|-----------|------------|--------|
| security-path-map   | 2026-06-03T00:22:42.771Z    | 1.0d | FRESH     | HIGH       | PASS   |
| write-surface-map   | 2026-06-03T00:22:42.771Z    | 1.0d | FRESH     | HIGH       | PASS   |
| rpc-map             | 2026-06-03T00:22:42.771Z    | 1.0d | FRESH     | HIGH       | PASS   |
| edge-function-map   | 2026-06-03T00:22:42.771Z    | 1.0d | FRESH     | HIGH       | PASS   |
| callgraph           | 2026-06-03T00:22:42.771Z    | 1.0d | FRESH     | HIGH       | PASS   |
| write-execution-map | 2026-06-03T00:22:42.771Z    | 1.0d | FRESH     | HIGH       | PASS   |
| rpc-execution-map   | 2026-06-03T00:22:42.771Z    | 1.0d | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Sinks In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-03T00:22:42Z | 1.0d | FRESH | HIGH | 38 | Sink inventory |
| callgraph | 2026-06-03T00:22:42Z | 1.0d | FRESH | HIGH | 559 nodes | Chain pre-computation |
| write-execution-map | 2026-06-03T00:22:42Z | 1.0d | FRESH | HIGH | 38 (all LOW conf) | Caller chain candidates |

Identity-tier sinks: 2 (profile_public_details ×2)
Resource-tier sinks: 15 (bookings ×2, resources ×10, fuel_prices ×2, business_card_leads ×1)
Content-tier sinks: 21 (design_* ×14, portfolio_media ×1, fuel_price_* ×6)

---

## 3. Vulnerability Surface Inventory

```
ELEKTRA VULNERABILITY SURFACE INVENTORY
=========================================
Feature: dashboard
Scan Date: 2026-06-03T00:22:42.771Z

Write Sinks: 38 (all confidence: HIGH in write-surface-map; all confidence: LOW in write-execution-map)
  INSERT: 14 | UPDATE: 14 | DELETE: 7 | UPSERT: 3
  Identity-tier: 2 — profile_public_details (UPSERT×2)
  Resource-tier: 15 — bookings, resources, fuel_prices, leads
  Content-tier: 21 — design_*, portfolio_media, fuel_price_*

RPC Sinks: 0
Edge Function Sinks: 0

Note: All 38 write execution paths have conf:LOW in write-execution-map.
All chains were elevated to HIGH PRIORITY per Rule E-002.
All 38 chains manually source-traced (inheriting work from ARCHITECT + VENOM passes).
```

---

## 4. Scanner Signals

| Chain Candidate | Source Map | Callgraph Path | Scanner Confidence | Source Verified | Chain Verdict | Provenance | Finding |
|---|---|---|---|---|---|---|---|
| ownerActorId → saveFlyerPublicDetails (profile_public_details UPSERT) | write-surface-map | useFlyerEditor → flyerEditor.controller → flyer.write.dal | LOW | YES — flyerEditor.controller.js:32: profileId caller-supplied, not derived from ownerActorId | VALID FINDING — profileId binding gap | [SOURCE_VERIFIED] | ELEK-2026-06-04-001 (ELEK-2026-06-02-001 update) |
| ownerActorId + documentId → ctrlCreateDesignPage (design_pages INSERT) | write-surface-map | designStudio pages controller | LOW | YES — designStudio.pages.controller.js:74: documentId not verified against ownerActorId | VALID FINDING — documentId binding gap | [SOURCE_VERIFIED] | ELEK-2026-06-04-002 (ELEK-2026-06-02-002 update) |
| ownerActorId + documentId → ctrlSaveDesignPageScene (design_page_versions INSERT) | write-surface-map | designStudio pages controller | LOW | YES — pages.controller.js:32: page-to-doc binding present but doc-to-actor binding absent | VALID FINDING — documentId binding gap (partial defense) | [SOURCE_VERIFIED] | ELEK-2026-06-04-002 (same) |
| ownerActorId + documentId → ctrlDeleteDesignPage (design_pages DELETE) | write-surface-map | designStudio pages controller | LOW | YES — pages.controller.js:123: pageId verified against documentId but documentId not verified against actor | VALID FINDING — documentId binding gap | [SOURCE_VERIFIED] | ELEK-2026-06-04-002 (same) |
| ownerActorId + documentId → ctrlQueueDesignExport (design_exports INSERT) | write-surface-map | designStudio assetsExports controller | LOW | YES — assetsExports.controller.js:58: documentId+pageId caller-supplied, no actor binding | VALID FINDING — documentId binding gap | [SOURCE_VERIFIED] | ELEK-2026-06-04-002 (same, extended scope) |
| actorId → loadOwnerQuickStatsController (bookings + resources READ) | callgraph | useOwnerQuickStats → vportOwnerStats.controller | LOW | YES — vportOwnerStats.controller.js:24: no assertActorOwnsVportActorController | VALID FINDING — missing ownership gate | [SOURCE_VERIFIED] | ELEK-2026-06-04-003 (VEN-DASH-001 confirm) |
| callerActorId → updateVportBookingDAL (bookings UPDATE, bookingId scope only) | write-surface-map | controller gate confirmed; DAL lacks profile_id scope | LOW | YES — updateVportBooking.write.dal.js:26 | VALID — DAL defense gap | [SOURCE_VERIFIED] | ELEK-2026-06-04-004 (LOW) |
| All other 34 chains (bookings insert, team, leads, portfolio, gas prices) | write-surface-map | Various controllers | LOW | YES — all verified secure in VENOM pass; ownership gates confirmed at controller level | VALID CHAINS — SAFE | [SOURCE_VERIFIED] | No finding — defenses confirmed |

---

## 5. Dashboard Invariant Definitions (MUST NEVER HAPPEN)

The following invariants MUST NEVER occur for any authenticated actor in the dashboard:

### Booking Card Invariants
- **INV-BOOK-001:** A VPORT owner must never create a booking for a resource they do not own
- **INV-BOOK-002:** A booking must never be updated to a status by a caller who is neither the VPORT owner nor the booking customer
- **INV-BOOK-003:** A terminal booking (completed, cancelled, no_show) must never be mutated
- **INV-BOOK-004:** A public booking must never have a caller-supplied customerActorId (injection risk)
- **INV-BOOK-005:** A booking update must never change ownership fields (profile_id, customer_actor_id, source)

### Team Card Invariants
- **INV-TEAM-001:** A team member must never be added to a VPORT by an actor who does not own it
- **INV-TEAM-002:** A team request must never be accepted by an actor who does not own the barber VPORT being added
- **INV-TEAM-003:** A team invite must never be declined by a string-equality check alone (requires DB ownership verification)
- **INV-TEAM-004:** The last active owner must never be removed or demoted from a team

### Leads Card Invariants
- **INV-LEADS-001:** Business card leads (PII: name, phone, email) must never be read by an actor who does not own the VPORT
- **INV-LEADS-002:** A lead must never be deleted by an actor who does not own the VPORT

### Gas Prices Card Invariants
- **INV-GAS-001:** Official fuel prices must never be updated without the actor owning the station or an approved reviewer
- **INV-GAS-002:** A fuel price suggestion review must never be performed by a non-owner of the station
- **INV-GAS-003:** Fuel key values must only come from the ALLOWED_FUEL_KEYS allowlist — client-supplied keys must be rejected

### Portfolio Card Invariants
- **INV-PORT-001:** Portfolio media records must never be updated to a media asset not created by the caller's VPORT

### Settings Card Invariants
- **INV-SET-001:** Public details (contact, hours, address) must never be written for a VPORT the caller does not own
- **INV-SET-002:** A write to profile_public_details must never proceed with only a legacy owner_user_id check (belt-and-suspenders only)

### Flyer Builder Invariants
- **INV-FLYER-001:** Flyer public details must never be written to a profileId that does not belong to the authenticated ownerActorId
- **INV-FLYER-002:** Design studio operations must never mutate a document not owned by the authenticated ownerActorId

### Owner Stats Invariants
- **INV-STATS-001:** Booking statistics (count, barber headcount) must never be read for a VPORT by an actor who does not own it

### Enforcement Status

| Invariant | Status | Evidence |
|---|---|---|
| INV-BOOK-001 through INV-BOOK-005 | ENFORCED | Source-verified in VENOM pass |
| INV-TEAM-001 through INV-TEAM-004 | ENFORCED | Source-verified (vportTeamAccess + vportTeamInvite controllers) |
| INV-LEADS-001, INV-LEADS-002 | ENFORCED | Source-verified (vportLeads.controller + profileId-scoped DAL) |
| INV-GAS-001 through INV-GAS-003 | ENFORCED | Source-verified (reviewFuelPriceSuggestionController + ALLOWED_FUEL_KEYS) |
| INV-PORT-001 | ENFORCED | callerProfileId scope in portfolioMediaRecord.write.dal.js |
| INV-SET-001 | ENFORCED | assertActorOwnsVportActorController + RLS |
| INV-SET-002 | PARTIALLY ENFORCED | Legacy check is belt-and-suspenders only; canonical gates present |
| INV-FLYER-001 | **VIOLATED** | ELEK-2026-06-04-001 — profileId caller-supplied |
| INV-FLYER-002 | **VIOLATED** | ELEK-2026-06-04-002 — documentId not bound to actor |
| INV-STATS-001 | **VIOLATED** | ELEK-2026-06-04-003 — no ownership gate |

---

## 6. Verified Vulnerabilities

---

### ELEK-2026-06-04-001 — Flyer Builder: profileId Caller-Supplied, Not Bound to ownerActorId

```
SECURITY FINDING

Finding ID:       ELEK-2026-06-04-001
Title:            saveFlyerPublicDetailsCtrl accepts caller-supplied profileId without binding to ownerActorId
Category:         IDOR/BOLA
Severity:         HIGH
Status:           Open
Scope:            VCSM
Location:         apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js:32–35
Source:           useFlyerEditor.js:23 — profileId passed from component prop to controller
Sink:             flyer.write.dal.js:29 — .upsert({ profile_id: profileId }) on vport.profile_public_details
Trust Boundary:   flyerEditor.controller.js:33 — requireOwnerActorAccess(ownerActorId)
Impact:           VPORT owner A can overwrite flyer fields (website_url, phone_public, hours,
                  logo_url, flyer_headline, flyer_subheadline, flyer_note, accent_color)
                  of any target VPORT B whose profileId is known.
Provenance:       [SOURCE_VERIFIED]

Evidence:
  flyerEditor.controller.js lines 32–35:
    export async function saveFlyerPublicDetailsCtrl({ profileId, patch, ownerActorId }) {
      await requireOwnerActorAccess(ownerActorId)     // verifies actor ownership ✓
      return saveFlyerPublicDetails({ profileId, patch })  // profileId NOT verified ✗
    }

  flyer.write.dal.js lines 26–43:
    .upsert({ profile_id: profileId, ...cleanPatch }, { onConflict: "profile_id" })
    // No auth or ownership check in DAL — writes to whatever profileId is provided

  useFlyerEditor.js line 23:
    const res = await saveFlyerPublicDetailsCtrl({ profileId, patch: draft, ownerActorId: vportId })
    // profileId comes from component prop — user-controlled

Chain:
  Source:    useFlyerEditor.js:4 — profileId from component prop
  Boundary:  flyerEditor.controller.js:33 — requireOwnerActorAccess(ownerActorId) [ACTOR verified]
  Gap:       No check that profileId belongs to ownerActorId
  Sink:      flyer.write.dal.js:29 — UPSERT vport.profile_public_details WHERE profile_id = profileId
  Impact:    Cross-VPORT public details write (contact, hours, flyer content)

Reproduction Steps:
  1. Authenticate as VPORT owner (actorId = A, owns profileId = P_A)
  2. Intercept/observe a request to learn victim's profileId = P_VICTIM
  3. POST to saveFlyerPublicDetailsCtrl with { profileId: P_VICTIM, ownerActorId: A_ACTOR_ID, patch: malicious }
  4. requireOwnerActorAccess(A_ACTOR_ID) passes — A owns their VPORT
  5. DAL upserts to profile_public_details WHERE profile_id = P_VICTIM

Existing Defense:
  - requireOwnerActorAccess validates ownerActorId via actor_owners DB check
  - vport.profile_public_details RLS (actor_can_manage_profile) is final backstop
  (RLS not independently verified by ELEKTRA — DB verification required)

Why Defense Is Insufficient:
  The app layer does not bind profileId to the verified ownerActorId. If RLS exists
  and is correctly scoped, the DB rejects the cross-VPORT write. But RLS is the SOLE
  defense — the app layer provides none. This violates the PORT-V-005 defense-in-depth
  principle established elsewhere in the same codebase.

Status: THOR BLOCKED (ELEK-2026-06-02-001)
Follow-up Command: WOLVERINE (apply patch), CARNAGE (verify RLS on profile_public_details)
```

---

### ELEK-2026-06-04-002 — Design Studio: documentId Not Bound to ownerActorId (Extended Scope)

```
SECURITY FINDING

Finding ID:       ELEK-2026-06-04-002
Title:            Design studio write controllers accept caller-supplied documentId without
                  binding it to the authenticated ownerActorId
Category:         IDOR/BOLA
Severity:         HIGH
Status:           Open
Scope:            VCSM
Location:
  apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.pages.controller.js
  apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js
Source:           Caller-supplied documentId and pageId parameters
Sink:             designStudio.write.dal.js — INSERT/UPDATE/DELETE on design_pages,
                  design_page_versions, design_exports, design_render_jobs
Trust Boundary:   requireOwnerActorAccess(ownerActorId) — actor verified but documentId unverified
Impact:           VPORT owner A can create, overwrite, or delete design pages in VPORT B's
                  documents if A knows B's documentId (and pageId for save/delete operations).
Provenance:       [SOURCE_VERIFIED]

Affected controllers (all read the documentId parameter without binding to ownerActorId):

1. ctrlSaveDesignPageScene (pages.controller.js:32)
   - Has PARTIAL defense: checks pageRow.document_id === documentId (page-to-doc binding)
   - DOES NOT check document.owner_actor_id === ownerActorId
   - Attacker who knows victim documentId + pageId can save arbitrary scene content

2. ctrlCreateDesignPage (pages.controller.js:74)
   - No document ownership binding at all
   - Calls dalListDesignPagesByDocument(documentId) — reads victim's document to check page count
   - Calls dalCreateDesignPage({ documentId }) — creates a page in victim's document

3. ctrlDeleteDesignPage (pages.controller.js:123)
   - Has PARTIAL defense: verifies pageId is in documentId's page list
   - DOES NOT check document.owner_actor_id === ownerActorId
   - Attacker who knows victim documentId + pageId can delete victim's pages

4. ctrlQueueDesignExport (assetsExports.controller.js:58)
   - No document or page binding
   - Creates design_exports + design_render_jobs referencing caller-supplied documentId + pageId
   - Lower severity (no direct content modification)

Evidence (ctrlCreateDesignPage):
  pages.controller.js lines 74–89:
    export async function ctrlCreateDesignPage({ ownerActorId, documentId }) {
      await requireOwnerActorAccess(ownerActorId);          // actor verified ✓
      const pages = await dalListDesignPagesByDocument(documentId);  // documentId NOT verified ✗
      ...
      const pageRow = await dalCreateDesignPage({ documentId, ... });  // writes to victim doc ✗
    }

Available defense in read DAL:
  designStudio.read.dal.js:33 — dalReadDesignDocumentById(documentId) returns { owner_actor_id }
  This function exists and can be used to bind documentId to ownerActorId.

Status: THOR BLOCKED (ELEK-2026-06-02-002)
Follow-up Command: WOLVERINE (apply patches), CARNAGE (verify design_* table RLS)
```

---

### ELEK-2026-06-04-003 — vportOwnerStats: Missing Ownership Gate (VEN-DASH-001 Confirmation)

```
SECURITY FINDING

Finding ID:       ELEK-2026-06-04-003
Title:            loadOwnerQuickStatsController reads VPORT booking and staff stats with no ownership check
Category:         IDOR/BOLA
Severity:         HIGH
Status:           Open
Scope:            VCSM
Location:         apps/VCSM/src/features/dashboard/vport/controller/vportOwnerStats.controller.js:24–64
Source:           useOwnerQuickStats.js:13 — actorId from hook parameter (prop-sourced)
Sink:             vportOwnerStats.controller.js:34-53 — reads vport.bookings + vport.resources by profileId
Trust Boundary:   None — no assertActorOwnsVportActorController call present
Impact:           Any authenticated user can read operational stats (today's booking count,
                  7-day booking count, active barber headcount) for any VPORT by actorId.
Provenance:       [SOURCE_VERIFIED]

Evidence:
  vportOwnerStats.controller.js lines 24–64:
    export async function loadOwnerQuickStatsController({ actorId }) {
      if (!actorId) throw new Error("actorId is required");
      // NO assertActorOwnsVportActorController call
      const profile = await readVportProfileByActorIdDAL({ actorId });   // no auth scope
      ...
      const [todayBookings, upcomingBookings] = await Promise.all([...]);  // reads bookings
      ...
    }

  useOwnerQuickStats.js lines 5–21:
    export function useOwnerQuickStats(actorId) {
      // actorId from component prop — no callerActorId passed
      loadOwnerQuickStatsController({ actorId })  // no ownership context
    }

Follow-up Command: WOLVERINE (apply patch)
```

---

### ELEK-2026-06-04-004 — updateVportBookingDAL: No profile_id Scope (Defense-in-Depth Gap)

```
SECURITY FINDING

Finding ID:       ELEK-2026-06-04-004
Title:            updateVportBookingDAL scopes UPDATE by bookingId only — no profile_id defense-in-depth
Category:         IDOR/BOLA (latent — controller gate strong)
Severity:         LOW
Status:           Open
Scope:            VCSM
Location:         apps/VCSM/src/features/dashboard/vport/dal/write/updateVportBooking.write.dal.js:26
Source:           Controller-provided bookingId (trusted from DB fetch, not from caller)
Sink:             .update(row).eq("id", bookingId) — no additional ownership scope
Trust Boundary:   Controllers (updateBookingStatusController + rescheduleBookingController) enforce
                  assertActorOwnsVportActorController before calling this DAL — STRONG
Impact:           Not exploitable via current controller paths. Latent risk if DAL called directly
                  (e.g., via Rule 9 index export, test harness, or new code path).
Provenance:       [SOURCE_VERIFIED]

Note: Both callers resolve profileId from the booking before calling the DAL.
profileId is available and could be passed as a column scope for defense-in-depth.
```

---

## 7. Patch Recommendations

---

### ELEKTRA PATCH ADVISORY — ELEK-2026-06-04-001

```
ELEKTRA PATCH ADVISORY
========================
Finding ID: ELEK-2026-06-04-001
Chain ID: CHAIN-dashboard-flyer-001
Provenance: [SOURCE_VERIFIED]
Severity: HIGH

CHAIN:
  Source:    useFlyerEditor.js:23 — profileId from component prop
  Boundary:  flyerEditor.controller.js:33 — requireOwnerActorAccess(ownerActorId) [gap: profileId unverified]
  Sink:      flyer.write.dal.js:29 — UPSERT vport.profile_public_details WHERE profile_id = profileId
  Impact:    Cross-VPORT public details overwrite
  Missing:   profileId derived from ownerActorId server-side

ROOT CAUSE:
  The controller accepts profileId as a parameter from the caller rather than deriving it
  server-side from the verified ownerActorId. The ownership gate verifies the actor but
  does not bind the write target to that actor.

SUGGESTED PATCH — File: apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js

// Before (line 32):
export async function saveFlyerPublicDetailsCtrl({ profileId, patch, ownerActorId }) {
  await requireOwnerActorAccess(ownerActorId)
  return saveFlyerPublicDetails({ profileId, patch })
}

// After (suggested — human must review before applying):
import { getVportProfileIdByActorDAL } from '@/features/dashboard/vport/dal/read/vportProfile.read.dal'

export async function saveFlyerPublicDetailsCtrl({ patch, ownerActorId }) {
  // Remove: profileId from parameter surface — derive it server-side
  await requireOwnerActorAccess(ownerActorId)
  const profileId = await getVportProfileIdByActorDAL({ actorId: ownerActorId })
  if (!profileId) throw new Error('Could not resolve VPORT profile for this actor.')
  return saveFlyerPublicDetails({ profileId, patch })
}

CALLER UPDATE REQUIRED — File: apps/VCSM/src/features/dashboard/flyerBuilder/hooks/useFlyerEditor.js

// Before (line 23):
const res = await saveFlyerPublicDetailsCtrl({ profileId, patch: draft, ownerActorId: vportId })

// After:
const res = await saveFlyerPublicDetailsCtrl({ patch: draft, ownerActorId: vportId })
// Remove: profileId from call site — controller now derives it

Explanation:
  By removing profileId from the public controller surface and deriving it server-side
  from the verified ownerActorId, no caller can supply an arbitrary profileId.
  The ownerActorId is verified via actor_owners, and the profileId is resolved from
  the same actor. Cross-VPORT write becomes impossible at the app layer.

Patch Type: SESSION_BIND + OWNERSHIP_CHECK
Patch Complexity: SIMPLE — one controller file, one hook call site
Requires DB Change: NO (RLS remains the backstop; no schema change needed)
```

---

### ELEKTRA PATCH ADVISORY — ELEK-2026-06-04-002

```
ELEKTRA PATCH ADVISORY
========================
Finding ID: ELEK-2026-06-04-002
Chain ID: CHAIN-dashboard-design-001
Provenance: [SOURCE_VERIFIED]
Severity: HIGH

CHAIN:
  Source:    Caller-supplied documentId parameter
  Boundary:  requireOwnerActorAccess(ownerActorId) — actor verified, documentId unverified
  Sink:      design_pages INSERT/DELETE, design_page_versions INSERT, design_exports INSERT
  Impact:    Cross-VPORT document mutation (create pages, overwrite scenes, delete pages)
  Missing:   documentId ownership binding to ownerActorId

ROOT CAUSE:
  All design studio write controllers verify that the caller owns the actor (via
  requireOwnerActorAccess) but do not verify that the supplied documentId belongs to
  that actor. dalReadDesignDocumentById returns owner_actor_id — this check is available
  but not called.

SUGGESTED PATCH — Create a shared document ownership assertion helper

New helper (add to designStudio.shared.controller.js):

// After (add to bottom of file):
import { dalReadDesignDocumentById } from '@/features/dashboard/flyerBuilder/designStudio/dal/designStudio.read.dal'

export async function requireDocumentOwnership(ownerActorId, documentId) {
  // Caller must have already passed requireOwnerActorAccess(ownerActorId)
  if (!documentId) throw new Error('Document id is required.')
  const doc = await dalReadDesignDocumentById(documentId)
  if (!doc || doc.is_deleted) throw new Error('Document not found.')
  if (String(doc.owner_actor_id) !== String(ownerActorId)) {
    throw new Error('Document not found or not owned by this actor.')
  }
  return doc
}

PATCH — File: apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.pages.controller.js

// Add import at top:
import { requireOwnerActorAccess, requireDocumentOwnership } from './designStudio.shared.controller'

// ctrlSaveDesignPageScene — add after requireOwnerActorAccess (line 33):
export async function ctrlSaveDesignPageScene({ ownerActorId, documentId, pageId, scene }) {
  await requireOwnerActorAccess(ownerActorId);
  await requireDocumentOwnership(ownerActorId, documentId);  // ADD THIS LINE
  ...
}

// ctrlCreateDesignPage — add after requireOwnerActorAccess (line 75):
export async function ctrlCreateDesignPage({ ownerActorId, documentId }) {
  await requireOwnerActorAccess(ownerActorId);
  await requireDocumentOwnership(ownerActorId, documentId);  // ADD THIS LINE
  ...
}

// ctrlDeleteDesignPage — add after requireOwnerActorAccess (line 124):
export async function ctrlDeleteDesignPage({ ownerActorId, documentId, pageId }) {
  await requireOwnerActorAccess(ownerActorId);
  await requireDocumentOwnership(ownerActorId, documentId);  // ADD THIS LINE
  ...
}

PATCH — File: apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js

// Add import:
import { requireOwnerActorAccess, requireDocumentOwnership } from './designStudio.shared.controller'

// ctrlQueueDesignExport — add after requireOwnerActorAccess (line 65):
export async function ctrlQueueDesignExport({ ownerActorId, documentId, pageId, versionId, format }) {
  await requireOwnerActorAccess(ownerActorId);
  await requireDocumentOwnership(ownerActorId, documentId);  // ADD THIS LINE
  ...
}

// ctrlRefreshDesignExports — add after requireOwnerActorAccess (line 97):
export async function ctrlRefreshDesignExports({ ownerActorId, documentId }) {
  await requireOwnerActorAccess(ownerActorId);
  await requireDocumentOwnership(ownerActorId, documentId);  // ADD THIS LINE (READ path hardening)
  ...
}

Explanation:
  The new requireDocumentOwnership helper is called after requireOwnerActorAccess.
  It reads the document from DB and verifies owner_actor_id matches ownerActorId.
  This binds the documentId to the authenticated actor at the app layer.
  No schema changes required — dalReadDesignDocumentById already returns owner_actor_id.

Patch Type: OWNERSHIP_CHECK
Patch Complexity: SIMPLE — shared helper + 5 call sites (one-liner each)
Requires DB Change: NO (relies on existing design_documents.owner_actor_id column)
```

---

### ELEKTRA PATCH ADVISORY — ELEK-2026-06-04-003

```
ELEKTRA PATCH ADVISORY
========================
Finding ID: ELEK-2026-06-04-003
Chain ID: CHAIN-dashboard-stats-001
Provenance: [SOURCE_VERIFIED]
Severity: HIGH

CHAIN:
  Source:    useOwnerQuickStats(actorId) — actorId from prop
  Boundary:  loadOwnerQuickStatsController({ actorId }) — NO ownership gate
  Sink:      vport.bookings + vport.resources reads via profileId resolution
  Impact:    Operational stats (booking counts, barber headcount) accessible for any VPORT
  Missing:   assertActorOwnsVportActorController before reads

SUGGESTED PATCH — File: apps/VCSM/src/features/dashboard/vport/controller/vportOwnerStats.controller.js

// Add import at top:
import { assertActorOwnsVportActorController } from '@/features/booking/adapters/booking.adapter'

// Before:
export async function loadOwnerQuickStatsController({ actorId }) {
  if (!actorId) throw new Error("actorId is required");

// After:
export async function loadOwnerQuickStatsController({ actorId, callerActorId }) {
  if (!actorId) throw new Error("actorId is required");
  if (!callerActorId) throw new Error("callerActorId is required");
  await assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: actorId,
  });

CALLER UPDATE — File: apps/VCSM/src/features/dashboard/vport/hooks/useOwnerQuickStats.js

// Before:
export function useOwnerQuickStats(actorId) {
  ...
  loadOwnerQuickStatsController({ actorId })

// After:
import { useIdentity } from '@/state/identity/identityContext'

export function useOwnerQuickStats(actorId) {
  const { identity } = useIdentity()
  const callerActorId = identity?.actorId ?? null
  ...
  loadOwnerQuickStatsController({ actorId, callerActorId })
  // Note: if !callerActorId, controller will throw → catch block silences and returns null stats
  // This is the correct behavior — unauthenticated users get no stats

Explanation:
  Adds the canonical ownership gate (assertActorOwnsVportActorController) matching
  the pattern used by every other sensitive controller in the dashboard.
  The hook derives callerActorId from the session identity (already available in
  other hooks in the same file directory).

Patch Type: OWNERSHIP_CHECK
Patch Complexity: SIMPLE — controller + hook, one-liner each
Requires DB Change: NO
```

---

### ELEKTRA PATCH ADVISORY — ELEK-2026-06-04-004

```
ELEKTRA PATCH ADVISORY
========================
Finding ID: ELEK-2026-06-04-004
Chain ID: CHAIN-dashboard-booking-update-001
Provenance: [SOURCE_VERIFIED]
Severity: LOW

ROOT CAUSE:
  updateVportBookingDAL scopes UPDATE by bookingId only. profileId is available
  at both controller call sites (resolved from the booking before the DAL call).

SUGGESTED PATCH — File: apps/VCSM/src/features/dashboard/vport/dal/write/updateVportBooking.write.dal.js

// Before (line 22):
export async function updateVportBookingDAL({ bookingId, updates } = {}) {
  if (!bookingId) throw new Error("updateVportBookingDAL: bookingId is required");
  ...
  const { data, error } = await vportSchema
    .from("bookings")
    .update(row)
    .eq("id", bookingId)

// After (PORT-V-005 pattern):
export async function updateVportBookingDAL({ bookingId, profileId, updates } = {}) {
  if (!bookingId) throw new Error("updateVportBookingDAL: bookingId is required");
  if (!profileId) throw new Error("updateVportBookingDAL: profileId is required");
  ...
  const { data, error } = await vportSchema
    .from("bookings")
    .update(row)
    .eq("id", bookingId)
    .eq("profile_id", profileId)  // ADD: defense-in-depth scope

CALLER UPDATES (both pass profileId after resolving it from the booking):
  updateBookingStatusController: already resolves vportActorId from profileId
  rescheduleBookingController: already has booking.profile_id available
  Both callers need: pass profileId (derived from booking.profile_id) to DAL call.

Patch Type: OWNERSHIP_CHECK (defense-in-depth)
Patch Complexity: SIMPLE — DAL + 2 controller call sites
Requires DB Change: NO
```

---

## 8. False Positives Rejected

**CHAIN-dashboard-team-role-001: updateTeamMemberRoleDAL — resourceId-only scope**
- Candidate: updateTeamMemberRoleDAL scopes by resourceId only — potential IDOR
- Investigation: vportTeamAccess.controller.js:84–103 verified — `fetchTeamMembersByProfileId(profileId)` + `.find(r.id === resourceId)` is a secondary ownership check. The resource must exist in the caller's team.
- Chain: Controller DOES verify member belongs to caller's VPORT before calling DAL
- Chain verdict: REJECTED — defense confirmed adequate in controller; DAL gap is LOW priority hardening only
- Defense found: vportTeamAccess.controller.js line 94–96 (profileId-scoped member lookup)

**CHAIN-dashboard-booking-terminal-001: terminal state guard bypassable via updateVportBookingDAL directly**
- Candidate: Terminal booking guard only in controller — DAL has no terminal state check
- Investigation: updateVportBookingDAL is called only via two controllers, both of which enforce terminal guard before calling the DAL
- Chain: Terminal guard at controller layer is sufficient for current call paths
- Chain verdict: REJECTED — no bypass path via current call chains; noted as DAL hardening opportunity

**CHAIN-dashboard-leads-fastcount-001: fastCountNewVportLeadsController bypasses auth**
- Candidate: fastCountNewVportLeadsController(profileId) — no ownership check
- Investigation: Only called from useVportNewLeadsCount.js — polling fast path after auth'd first call; profileId derived from authenticated result
- Chain: profileId only reached via hook after successful auth'd call; function exported but no external call sites found
- Chain verdict: PARTIALLY REJECTED — hook usage is safe; function export is a VEN-DASH-004 concern (MEDIUM) but chain to exploit is incomplete. ELEKTRA classifies as LOW (INFO) — no direct exploit path from current code.

---

## 9. Source Verification Summary

- Chain candidates evaluated: 11
- Chains source-verified: 11 / 11
- Source files read (ELEKTRA pass): 4 new files (designStudio.pages.controller, designStudio.assetsExports.controller, designStudio.load.controller, designStudio.read.dal — partial)
- Total source files read (session): 26
- Valid findings: 4 (3 HIGH, 1 LOW)
- Rejected (false positive): 3
- Incomplete (scanner leads): 0

---

## 10. Confidence Summary

| Type | Count |
|---|---|
| HIGH confidence scanner chains | 0 |
| LOW confidence chains | 11 (all elevated per Rule E-002) |
| [SOURCE_VERIFIED] findings | 4 |
| [SCANNER_LEAD] findings | 0 |

---

## 11. THOR Impact

**THOR Release Blockers:**
- ELEK-2026-06-04-001: HIGH — flyer profileId binding gap — UNPATCHED
- ELEK-2026-06-04-002: HIGH — design studio documentId binding gap — UNPATCHED
- ELEK-2026-06-04-003: HIGH — quickStats no ownership gate — UNPATCHED

**Highest Open Severity:** HIGH

**Dashboard THOR Status: BLOCKED** — 3 HIGH findings, 3 concrete patches proposed.

---

## 12. Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-04-001 | Flyer profileId binding gap | HIGH | Controller | SIMPLE | NO |
| 2 | ELEK-2026-06-04-002 | Design studio documentId binding gap | HIGH | Controller (shared helper + 5 sites) | SIMPLE | NO |
| 3 | ELEK-2026-06-04-003 | quickStats missing ownership gate | HIGH | Controller + Hook | SIMPLE | NO |
| 4 | ELEK-2026-06-04-004 | updateVportBookingDAL no profile_id scope | LOW | DAL + 2 controller call sites | SIMPLE | NO |

---

## 13. Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| WOLVERINE | Apply patches for ELEK-001, ELEK-002, ELEK-003 | REQUIRED before THOR |
| BLACKWIDOW | Adversarial verification of all 3 HIGH patches after application | REQUIRED |
| CARNAGE | Verify RLS on profile_public_details + design_* tables | REQUIRED |
| SPIDER-MAN | Add regression tests for cross-VPORT write rejection | RECOMMENDED |
| THOR | Re-run release gate after all 3 HIGH findings patched + BW verified | PENDING |

---

*ELEKTRA V2 run complete. Boundary contract: VCSM scope only. No code modifications. All patches are advisory only — for human review and application.*
