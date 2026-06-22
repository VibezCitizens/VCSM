# VENOM + ROBIN — LOCKSMITH VPORT Profile Audit

**Date:** 2026-05-10
**Application Scope:** VCSM
**VPORT Type:** `locksmith`
**Tab Preset:** `VPORT_BARBER_TABS` (exact-type override — same as individual barber)
**Tab Order:** `portfolio → book → services → reviews → content → about → photos → vibes → subscribers`
**Supabase Schema:** `vport.*` (locksmith_service_areas, locksmith_service_details, locksmith_portfolio_details, profiles), `reviews.*`, `platform.media_assets`
**Review Dimensions:** Work Quality, Timeliness, Communication, Professionalism, Value
**Domain Note:** Locksmith is a security-sensitive trade — service areas, pricing, and verification requirements are operational security data exposed on the public profile.

---

## VENOM TARGET

```
Feature / Route / Engine: VPORT Profile — Locksmith type
Application Scope: VCSM
Reason for review: Write-path controllers lack actor ownership checks on update/delete operations; unique security-sensitive service detail fields (requiresPhotoId, requiresProofOfOwnership); no native locksmith-specific DAL or controller
Primary trust boundary: Authenticated session only — no actor_owners check in update/delete controllers; RLS is sole protection
```

---

## SECURITY SURFACE

```
Entry point: /profile/:slug (public — About tab loads service areas + details), owner dashboard (write path)
Auth source: Supabase session → useIdentity() → actorId + kind
Authorization layer: MISSING in update/delete controllers — only ID presence checks
Identity surface: actorId (correct for reads); no ownership verification on writes
Sensitive objects: vport.locksmith_service_areas (geographic + pricing), vport.locksmith_service_details (verification requirements, pricing model), vport.locksmith_portfolio_details
Security-specific fields: requiresPhotoId, requiresProofOfOwnership — misrepresent verification requirements
```

---

## TRUST BOUNDARY TRACE

```
Client input: areaId / serviceId / portfolioItemId + mutation payload
Validated at: ID presence only (e.g., !areaId throws)
Identity resolved at: NOT RESOLVED in update/delete controllers — actorId is not passed or verified
Authorization enforced at: RLS (DB-level only for updates/deletes) — no app-level ownership check
Data returned to: getLocksmithProfileController (public read — About tab)
```

---

## SECURITY RISK FINDINGS

---

### VENOM SECURITY FINDING — VL-01 ⚠️ HIGH

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js:45-60`
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  export async function ctrlUpdateServiceArea(areaId, updates) {
    if (!areaId) throw new Error('[Locksmith] areaId required')
    // ...no actor ownership check...
    return dalUpdateLocksmithServiceArea(areaId, updates)
  }
  ```
  `ctrlUpdateServiceArea` accepts `areaId` and `updates` only. No `actorId` parameter. No `actor_owners` lookup. No verification that the calling actor owns the service area being updated. Any authenticated actor who knows a valid `areaId` from `vport.locksmith_service_areas` can update any locksmith's service area data — including pricing, ETAs, and emergency coverage flags.
- **Risk:** Cross-owner service area mutation. An attacker who can enumerate `areaId` values (e.g., via public API exploration or IDOR) can:
  - Modify a locksmith's travel fees (pricing fraud)
  - Disable emergency coverage flags (service misrepresentation)
  - Alter service area geography (false service area claims)
- **Severity:** HIGH
- **Why it matters:** Service area data is publicly displayed on the locksmith profile. False service areas could route customers to the wrong service provider or create false geographic coverage claims. Pricing manipulation (`travelFeeCents`) could defraud customers who book based on the displayed fee.
- **Recommended mitigation:** Add `actorId` parameter to `ctrlUpdateServiceArea`. Before calling the DAL, fetch the existing row and verify `row.actor_id === actorId` (or use `actor_owners` lookup). Add `.eq('actor_id', actorId)` as an additional filter on the update DAL query.
- **Rationale:** Write operations must always verify actor ownership. The controller is the correct layer for this check.
- **Follow-up command:** DB (audit `vport.locksmith_service_areas` RLS — is UPDATE scoped to actor_id?)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security, Security Architecture and Engineering

---

### VENOM SECURITY FINDING — VL-02 ⚠️ HIGH

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js:63-66`
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  export async function ctrlDeleteServiceArea(areaId) {
    if (!areaId) throw new Error('[Locksmith] areaId required')
    return dalDeleteLocksmithServiceArea(areaId)
  }
  ```
  No `actorId`. No ownership check. Any authenticated actor who knows an `areaId` can delete any locksmith's service area.
- **Risk:** Cross-owner service area deletion. A competitor, disgruntled user, or attacker could delete all service areas from a locksmith's profile, effectively breaking their geographic coverage display and making the profile appear as offering no coverage.
- **Severity:** HIGH
- **Why it matters:** Deletion is irreversible (unless there's a soft-delete mechanism — none visible in the DAL). Destroying a locksmith's service area data causes immediate product damage. For a locksmith who relies on VCSM as their business profile, this is a serious operational attack surface.
- **Recommended mitigation:** Add `actorId` parameter. Fetch the area row, verify ownership, then delete. Add `.eq('actor_id', actorId)` as an additional DAL filter so even if the controller is bypassed, the DB layer rejects cross-owner deletes.
- **Rationale:** Delete operations without ownership verification are the highest-impact IDOR pattern.
- **Follow-up command:** DB (audit `vport.locksmith_service_areas` RLS for DELETE policy)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING — VL-03 ⚠️ HIGH

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js:94-96`
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  export async function ctrlDeleteServiceDetail(serviceId) {
    return dalDeleteLocksmithServiceDetail(serviceId)
  }
  ```
  No ID presence check. No `actorId`. No ownership check. Bare pass-through to the DAL delete with only `serviceId` as input.
- **Risk:** Cross-owner service detail deletion. Any authenticated actor who knows a `serviceId` from `vport.locksmith_service_details` can delete any locksmith's service-specific metadata — including pricing models, verification requirements (`requiresPhotoId`, `requiresProofOfOwnership`), and ETA configurations.
- **Severity:** HIGH
- **Why it matters:** Deleting a locksmith's service detail removes their professionally configured verification requirements and pricing. It also removes the security verification flags (`requiresPhotoId`) that communicate to customers what verification the locksmith will request. Removal of these flags could create unsafe customer expectations in a security-sensitive trade.
- **Recommended mitigation:** Add `actorId` parameter. Fetch the detail row, verify `row.actor_id === actorId`, then delete. Add `.eq('actor_id', actorId)` to the DAL delete filter.
- **Rationale:** This function has no guards at all — not even an ID presence check. This is the most permissive delete pattern in the audited codebase.
- **Follow-up command:** DB (audit `vport.locksmith_service_details` RLS for DELETE policy)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING — VL-04 — MEDIUM

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js:100-116`
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  export async function ctrlSavePortfolioDetail(portfolioItemId, detail) {
    if (!portfolioItemId) throw new Error('[Locksmith] portfolioItemId required')
    return dalUpsertLocksmithPortfolioDetail({ portfolio_item_id: portfolioItemId, ... })
  }
  ```
  `ctrlSavePortfolioDetail` checks that `portfolioItemId` is present but does not verify that the calling actor owns the portfolio item. Any authenticated actor with a known `portfolioItemId` can upsert locksmith portfolio metadata (job type, property type, lock type, hardware brand, etc.) for any portfolio item.
- **Risk:** Cross-owner portfolio detail mutation. An attacker could modify a locksmith's portfolio items to add false job types, false security upgrade claims, or false `is_emergency_job` flags — distorting the locksmith's work history as displayed on their public portfolio tab.
- **Severity:** MEDIUM
- **Why it matters:** Portfolio is a public trust signal for locksmith VPORTs. False `is_security_upgrade: true` claims could mislead customers about the quality of past work. False `has_before_after: true` flags could create expectations the locksmith cannot meet.
- **Recommended mitigation:** Add `actorId` parameter. Look up the portfolio item's owner via `platform.media_assets` or portfolio item table, verify ownership before upsert.
- **Rationale:** Portfolio writes represent the locksmith's public professional record — they must be owner-gated.
- **Follow-up command:** DB (audit `vport.locksmith_portfolio_details` and `platform.media_assets` ownership model)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Asset Security

---

### VENOM SECURITY FINDING — VL-05 — MEDIUM

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithServiceAreas.write.dal.js:49-59`
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  export async function dalUpdateLocksmithServiceArea(areaId, updates) {
    const { data, error } = await vportSchema
      .from('locksmith_service_areas')
      .update(updates)
      .eq('id', areaId)   // ← only filters by id, no actor_id column check
  }
  ```
  The DAL update and delete functions filter only by `id`. There is no `actor_id` column added to the WHERE clause. If RLS on `vport.locksmith_service_areas` does not enforce UPDATE/DELETE ownership (or if a SECURITY DEFINER path bypasses RLS), these DAL functions perform cross-owner mutations.
- **Risk:** The DAL is correctly dumb (per architecture contract — DAL should not contain authorization). But because the controller layer (VL-01, VL-02) also has no ownership check, the combination leaves only RLS as protection. If RLS is misconfigured, cross-owner writes succeed silently.
- **Severity:** MEDIUM (the risk escalates to HIGH if RLS is not confirmed correct)
- **Why it matters:** Defense in depth requires controller-level ownership AND RLS. Neither layer enforces ownership currently.
- **Recommended mitigation:** Fix the controller (VL-01, VL-02). Additionally, add `.eq('actor_id', actorId)` to the DAL update/delete as a secondary safety filter — even if this overlaps with RLS, explicit column filtering prevents accidental cross-owner mutations if RLS is ever relaxed.
- **Rationale:** Two-layer defense: controller ownership check + DAL actor_id filter.
- **Follow-up command:** DB (confirm RLS on `vport.locksmith_service_areas` UPDATE and DELETE)
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING — VL-06 — MEDIUM

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/getLocksmithProfile.controller.js:52-69`
- **Application Scope:** VCSM
- **Current behavior:** `getLocksmithProfileController(actorId)` is a public read — no auth required. Returns `serviceAreas`, `serviceDetails`, and `gapServices` for any actor. `serviceDetails` includes: `requiresPhotoId`, `requiresProofOfOwnership`, `pricingModel`, `startingPriceCents`, `maxPriceCents`, `warrantyDays`.
- **Risk:** Operational pricing and verification requirement data is publicly readable without authentication. For a locksmith VPORT, this data is intentionally public (displayed on the About tab). However:
  1. `startingPriceCents` and `maxPriceCents` are live pricing data — publicly exposing precise service pricing enables competitive intelligence scraping at scale.
  2. `requiresPhotoId` and `requiresProofOfOwnership` communicate physical security verification requirements. If attackers can read these without visiting the profile (via direct API call), they can identify locksmiths who do NOT require ID verification.
- **Severity:** MEDIUM
- **Why it matters:** Locksmiths are a physical security trade. Customers who engage locksmiths rely on verification requirements to assess trustworthiness. Publicly exposing `requiresPhotoId: false` at scale (across all locksmiths) could help bad actors identify locksmiths with lax verification for exploitation.
- **Recommended mitigation:** No code change needed for the public read (this data is intentionally on the public profile). However: (1) Confirm the API access to this data is rate-limited to prevent scraping. (2) Consider moving pricing (`startingPriceCents`, `maxPriceCents`) to authenticated-only reads or showing only ranges publicly.
- **Rationale:** Public data on a profile is expected. Bulk programmatic access to sensitive field combinations is the risk.
- **Follow-up command:** Loki (API rate limiting audit)
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Security and Risk Management

---

### VENOM SECURITY FINDING — VL-07 — MEDIUM

- **Location:** `apps/VCSM/src/features/profiles/dal/vportPublicDetails.read.dal.js`
- **Application Scope:** VCSM
- **Current behavior:** Shared systemic issue — `vport_id` and `is_deleted` in public response.
- **Risk / Severity:** Same as VB-02 / VB-03 — MEDIUM / LOW.
- **Why it matters:** For locksmith, `vport_id` exposure combined with the write-path ownership gaps (VL-01–VL-03) increases risk — knowing the internal profile UUID can help correlate service area IDs.
- **Recommended mitigation:** Remove `vport_id`; add `is_deleted = false` filter.
- **Follow-up command:** review-contract
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Identity and Access Management

---

### IDENTITY SURFACE WARNING — VL-IDENT

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js` (all functions)
- **Current identity surface:** Functions receive `actorId` for creates (VL insert has `actor_id` on row), but `areaId`/`serviceId`/`portfolioItemId` only for updates and deletes — no `actorId` at all in update/delete signatures.
- **Expected identity surface:** All write functions must receive the calling actor's identity and verify ownership via `actor_owners`.
- **Risk:** Identity is completely absent from the update/delete boundary.
- **Suggested correction:** Add `actorId` parameter to `ctrlUpdateServiceArea`, `ctrlDeleteServiceArea`, `ctrlDeleteServiceDetail`, `ctrlSavePortfolioDetail`. Perform ownership verification at the top of each function.

---

## MITIGATION PLAN

| Risk | Layer to Fix | Priority |
|---|---|---|
| VL-01: ctrlUpdateServiceArea — no ownership check | Controller | HIGH — fix before any locksmith write surface is used |
| VL-02: ctrlDeleteServiceArea — no ownership check | Controller | HIGH — critical data loss risk |
| VL-03: ctrlDeleteServiceDetail — no check at all | Controller | HIGH — most permissive delete in codebase |
| VL-04: ctrlSavePortfolioDetail — no ownership check | Controller | MEDIUM |
| VL-05: DAL lacks actor_id column filter on updates/deletes | DAL (secondary layer) | MEDIUM — add after controller fix |
| VL-06: Pricing + verification field scraping | Rate limiting (infra) | MEDIUM |
| VL-07: vport_id / is_deleted in public response | DAL | MEDIUM / LOW |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VL-06 (scraping of sensitive field combinations) |
| Asset Security | 2 | VL-06, VL-07 |
| Security Architecture and Engineering | 2 | VL-05 (no dual-layer defense), VL-01 (single-layer RLS-only pattern) |
| Communication and Network Security | 0 | Public reads via standard profile route — no issues |
| Identity and Access Management | 4 | VL-01, VL-02, VL-03, VL-04 (ownership missing across all write functions) |
| Security Assessment and Testing | 0 | Out of scope |
| Security Operations | 0 | No logging/debug findings in scope |
| Software Development Security | 4 | VL-01, VL-02, VL-03, VL-05 (unsafe write patterns throughout) |

**Most impacted domain: Identity and Access Management** — 4 findings all traceable to missing ownership verification in write controllers.

---

## ROBIN — NATIVE TRANSFER ANALYSIS

### Module Reference
`native-transfer/modules/public-vport-profile.md` | Status: **Partial**

### PWA Source Files (Locksmith-specific)
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/getLocksmithProfile.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/publishLocksmithHoursUpdateAsPost.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/publishLocksmithServiceAreaUpdateAsPost.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithServiceAreas.read.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithServiceAreas.write.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithServiceDetails.read.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithServiceDetails.write.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithPortfolioDetails.write.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/hooks/useLocksmithProfile.js`
- `apps/VCSM/src/features/profiles/kinds/vport/hooks/useLocksmithOwner.js`

### Native Files (Locksmith-relevant)
**No confirmed locksmith-specific native files exist.** The profile feature files are general-purpose:
- `VCSMNativeApp/Features/Profile/Screens/ProfileViewScreen.swift` — generic profile shell
- `VCSMNativeApp/Features/Profile/Screens/VPortServicesEditorScreen.swift` — services (generic)
- `VCSMNativeApp/Features/Profile/DAL/ProfileReads.dal.swift` — general reads
- `VCSMNativeApp/Features/Booking/Screens/VPortBookingScreen.swift` — booking (generic)

### Tab Set — Locksmith Native Parity

| Tab | PWA | Native | Status |
|---|---|---|---|
| portfolio | ✓ | ✓ (generic portfolio) | Parity (generic) |
| book | ✓ (VportPublicBookingFlow / VportOwnerBookingView) | ✓ (VPortBookingScreen) | **Verify visitor vs owner variant** |
| services | ✓ | ✓ (VPortServicesEditorScreen) | Parity (generic) |
| reviews | ✓ | ✓ | Parity |
| content | ✓ | Not confirmed | **Verify P2** |
| about | ✓ (+ locksmith service areas section) | **Missing service areas section** | **GAP — P1** |
| photos | ✓ | ✓ | Parity |
| vibes | ✓ | ✓ | Parity |
| subscribers | ✓ | ✓ | Parity |

### Native Gaps — Locksmith

1. **P1 — About tab: locksmith service areas section missing.** In the PWA, the `about` tab for a locksmith additionally renders a service areas section (from `useLocksmithProfile(actorId, 'locksmith')`) showing geographic coverage areas, travel fees, and ETAs. Native `ProfileTabDetailSections.swift` does not have a confirmed equivalent for this locksmith-specific section. This is a significant display gap — the service areas are one of the most distinctive features of a locksmith profile.

2. **P1 — No locksmith-specific native DAL.** The PWA has 6 dedicated locksmith DAL files (`locksmithServiceAreas.read`, `locksmithServiceAreas.write`, `locksmithServiceDetails.read`, `locksmithServiceDetails.write`, `locksmithServiceDetails.write`, `locksmithPortfolioDetails.write`). Native has no equivalent. Any native implementation of locksmith owner management (add/edit/delete service areas, service details) would need these DALs implemented from scratch in Swift against the correct Supabase schema paths.

3. **P1 — No locksmith owner management in native.** `ctrlAddServiceArea`, `ctrlUpdateServiceArea`, `ctrlDeleteServiceArea`, `ctrlSaveServiceDetail`, `ctrlDeleteServiceDetail`, `ctrlSavePortfolioDetail` — none of these have native equivalents. A locksmith cannot manage their service areas or service details in the native app.

4. **P1 — Tab set correctly resolves to VPORT_BARBER_TABS for locksmith.** This is correct per the deep audit and transfer doc. Verify native `getTabsForVportType("locksmith")` → `VPORT_BARBER_TABS` is implemented. The tab resolver in native should have `case "barber", "locksmith": return VPORT_BARBER_TABS`.

5. **P1 — CRITICAL: Do not implement native locksmith write paths until VL-01/VL-02/VL-03 are fixed in the PWA.** If native locksmith owner management is implemented while the controller ownership checks are missing, the native app inherits the same cross-owner mutation vulnerability. Fix the PWA controllers first, then implement native.

6. **P2 — Locksmith portfolio details section.** Locksmith portfolio items have extra metadata (`job_type`, `property_type`, `lock_type`, `is_emergency_job`, `is_security_upgrade`). Native portfolio display for locksmith type should render these fields on portfolio item cards. No confirmed native implementation.

7. **P2 — Publish as post (portfolio/hours/service area update).** Three locksmith system post controllers exist in PWA. No native equivalent. Low priority for launch.

### RLS/Schema Watch — Locksmith

- `vport.locksmith_service_areas`: **URGENT** — confirm UPDATE and DELETE RLS enforces `actor_id` ownership. This is the sole protection while VL-01/VL-02 are unresolved.
- `vport.locksmith_service_details`: confirm UPDATE and DELETE RLS enforces `actor_id` ownership.
- `vport.locksmith_portfolio_details`: confirm ownership scope in RLS.
- Public read (`getLocksmithProfileController`) — no auth required, acceptable for public profile tab.

### Priority Classification

| Gap | Priority | Blocking? |
|---|---|---|
| About tab service areas section | P1 | Yes — core locksmith differentiator |
| No locksmith DAL in native | P1 | Yes — blocks owner management |
| No locksmith owner management in native | P1 | No (launch without owner tools is possible) |
| Tab set resolves correctly to VPORT_BARBER_TABS | P1 | Yes — correctness |
| Block native write until VL-01/02/03 fixed | P1 | YES — security blocker |
| Locksmith portfolio details in native | P2 | No |
| Publish as post | P2 | No |

---

## PWA → NATIVE TRANSFER LOG ENTRY

- **Date:** 2026-05-10
- **Change type:** Security audit / Gap discovery
- **PWA files reviewed:** `locksmithOwner.controller.js`, `locksmithServiceAreas.write.dal.js`, `getLocksmithProfile.controller.js`, all locksmith DAL files
- **Routes affected:** `/profile/:slug` (about tab service areas), locksmith owner dashboard write paths
- **Behavior findings:** PWA locksmith write controllers lack actor ownership verification (VL-01/02/03). About tab service areas section has no native equivalent.
- **Native impact:** Do not implement native locksmith write paths until PWA controller fixes land. About tab service areas must be added as a native P1.
- **Priority:** P1 (security), P1 (about tab gap)
- **Native status:** Not Started (locksmith-specific) / Partial (generic profile tabs)

---

*VENOM is read-only. No code was modified. All findings are recommendations only.*
*Robin analysis is planning-only. No native code was changed.*
*The locksmith type has the highest concentration of unowned write-path functions in the entire VPORT profile feature. Remediate VL-01, VL-02, and VL-03 before any locksmith owner management surface ships.*
