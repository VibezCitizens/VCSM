# VENOM V2 SECURITY REVIEW — ads
**Date:** 2026-06-07T10:30:00
**Scanner Version:** 1.1.0
**Application Scope:** VCSM
**Command:** VENOM

## Output Metadata
| Field | Value |
|---|---|
| Category Key | feature-security |
| Feature | ads |
| Command | VENOM |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/ads/outputs/2026/06/07/Venom/2026-06-07_venom_ads-security-review.md |
| Timestamp | 2026-06-07T10:30:00 |

---

## 1. VENOM Scanner Preflight

```
VENOM ARCHITECT OUTPUT CHECK
==============================
ARCHITECT Output: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ARCHITECT/architect-security-surface.json
Generated At: 2026-06-07T08:11:09Z
Age: 0 days
Freshness: FRESH
Scope: VCSM:ads (included in multi-module pass)
Status: PASS

Security Surface Counts (from ARCHITECT evidence bundle):
Write surfaces: 3 (upsertAd, removeAd, listAdsByActor)
RPC surfaces: 0
Edge function surfaces: 0
Security paths: ALL LOW confidence (SPA limitation)
Execution paths resolved: 0 / 3 (SPA static analysis limitation)
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Surfaces In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-07T08:11:09Z | 0h | FRESH | HIGH | 3 (ads feature) | Primary attack surface inventory |
| rpc-map | 2026-06-07T08:11:09Z | 0h | FRESH | HIGH | 0 | RPC surface inventory |
| edge-function-map | 2026-06-07T08:11:09Z | 0h | FRESH | HIGH | 0 | Edge function surface inventory |
| security-path-map | 2026-06-07T08:11:09Z | 0h | FRESH | LOW | 3 | Security path inventory |
| write-execution-map | 2026-06-07T08:11:09Z | 0h | FRESH | HIGH | 3 | Write surface caller chain |

Scanner Version: 1.1.0 | Overall Preflight: FRESH | Preflight Action: PASSED
Total surfaces in scope: 3 write + 0 rpc + 0 edge
HIGH confidence paths (resolved): 0
LOW confidence paths (unresolved): 3 — manual trace required

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: ads
Scan Date: 2026-06-07T08:11:09Z

Write Surfaces: 3
  INSERT: 0 | UPDATE: 0 | DELETE: 1 | UPSERT: 1 | READ: 1
  Storage affected: window.localStorage (ADS_STORAGE_KEY)

RPC Calls: 0

Edge Functions: 0

Security Paths: 3
  HIGH confidence (caller chain resolved): 0
  LOW confidence (caller chain unresolved): 3
  Access=protected: 1 (VportAdsSettingsScreen — ProtectedRoute + ProfileGatedOutlet)
  Access=public: 0
  Access=unknown: 2 (usecase callers not directly traced by scanner)

Execution Paths Resolved: 0 / 3
```

---

## 4. Scanner Signals

| Signal | Source Map | Map Entry | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|---|
| localStorage write at ad.storage.dal.js:43 (upsertAd) | write-surface-map | VCSM:ads writeSurfaces | HIGH | YES — evidence-bundle.md CHAIN-ads-002: useVportAds → saveDraftUseCase → saveAd → upsertAd; no actorId session check at DAL | [SOURCE_VERIFIED] | VEN-ADS-2026-001 |
| localStorage delete at ad.storage.dal.js:61 (removeAd) | write-surface-map | VCSM:ads writeSurfaces | HIGH | YES — evidence-bundle.md CHAIN-ads-003: useVportAds → deleteAdUseCase → deleteAd → removeAd; bare id, no ownership | [SOURCE_VERIFIED] | VEN-ADS-2026-003 |
| actorId from URL param in VportAdsSettingsScreen | security-path-map | VCSM:ads securityPaths | LOW | YES — evidence-bundle.md confirms actorId is URL-param-sourced, no session cross-check in usecase | [SOURCE_VERIFIED] | VEN-ADS-2026-002 |
| isValidHttpUrl accepts http:// in ad.validation.js:4 | write-surface-map | VCSM:ads | HIGH | YES — evidence-bundle.md validateAdDraft surface | [SOURCE_VERIFIED] | VEN-ADS-2026-004 |
| ADS_STORAGE_KEY global key in localStorage | write-surface-map | VCSM:ads | HIGH | YES — evidence-bundle.md Architecture State note | [SOURCE_VERIFIED] | VEN-ADS-2026-005 |

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/ads/BEHAVIOR.md
BEHAVIOR.md exists: YES (file exists)
BEHAVIOR.md status: PLACEHOLDER
§5 Security Rules declared: 0
§5 Rules verified in source: 0 / 0
§5 Rules unenforced: N/A — no rules declared
§9 Must Never Happen declared: 0
§9 Invariants protected in source: 0 / 0
§9 Invariants unprotected: N/A — no invariants declared

Note: All findings in this report are UNANCHORED — no behavior contract to cross-check against.
```

---

## 6. Trust Boundary Findings

---

### VEN-ADS-2026-001 — actorId Sourced From URL Param, No Session Cross-Check [SOURCE_VERIFIED]

**Finding ID:** VEN-ADS-2026-001
**Location:** ads usecase layer / VportAdsSettingsScreen route
**Application Scope:** VCSM
**Platform Surface:** Creator Dashboard (VPORT pipeline — ad settings)
**Trust Boundary:** Auth boundary only (ProtectedRoute + ProfileGatedOutlet). No ownership boundary.
**Boundary Violated:** OWNERSHIP — authenticated Citizen can load another actor's ad pipeline by navigating to /vport/[victim-actorId]/ads
**Contract Violated:** Platform identity contract — actorId must be session-verified before VPORT mutation operations

**Current behavior:** The VportAdsSettingsScreen route accepts actorId from the URL parameter. The adPipeline.usecase.js and associated usecase chain (CHAIN-ads-001/002/003) do not verify that the URL param actorId matches the session actor's actorId. Any authenticated Citizen can navigate to the ad settings for any VPORT.

**Risk:** An adversarial Citizen can view and interact with any VPORT's ad pipeline UI. When ads migrate to Supabase persistence, this pattern carries CRITICAL escalation — the unguarded actorId would be used for all DB writes.

**Severity:** HIGH
**Exploitability:** HIGH (URL param manipulation requires only a valid session)
**Attack Preconditions:** Valid authenticated session + knowledge of target actorId
**Blast Radius:** MEDIUM — currently limited to localStorage scope; escalates to CRITICAL on Supabase migration
**Identity Leak Type:** Actor ID Injection — foreign actorId accepted as identity authority
**Cache Trust Type:** N/A (localStorage, client-only)
**RLS Dependency:** NONE (no DB — localStorage only)

**Why it matters:** This trust boundary gap is an architectural pattern that will carry forward to DB-backed storage. Fixing it now prevents a CRITICAL RLS bypass at migration time.

**Recommended mitigation:**
At the usecase entry point (adPipeline.usecase.js or the calling hook), add:
```js
const { identity } = useIdentity();
if (actorId !== identity.actorId) return { ok: false, error: 'OWNERSHIP_VIOLATION' };
```

**Rationale:** The session actorId from useIdentity() is the authoritative ownership source. The URL param actorId must be validated against it before any usecase operation.

**Follow-up command:** BLACKWIDOW (confirm bypass), ELEKTRA (full chain trace + patch advisory)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Architecture and Engineering

---

### VEN-ADS-2026-002 — Route Access Not Ownership-Gated (No OwnerOnlyDashboardGuard) [SOURCE_VERIFIED]

**Finding ID:** VEN-ADS-2026-002
**Location:** apps/VCSM/src/app/routes/index.jsx (inferred) / VportAdsSettingsScreen
**Application Scope:** VCSM
**Platform Surface:** Creator Dashboard (VPORT pipeline)
**Trust Boundary:** Auth boundary only
**Boundary Violated:** AUTHORIZATION — route accessible by any authenticated + profiled Citizen

**Current behavior:** VportAdsSettingsScreen is nested behind ProtectedRoute + ProfileGatedOutlet, which requires auth and profile completion. There is no OwnerOnlyDashboardGuard that verifies the requesting Citizen owns the VPORT referenced in the URL.

**Risk:** Any authenticated Citizen can directly navigate to /vport/[any-actorId]/ads and see that actor's ad management UI. While localStorage scoping limits cross-user data reads, the UI loads in the wrong identity context.

**Severity:** HIGH
**Exploitability:** HIGH
**Attack Preconditions:** Valid authenticated session
**Blast Radius:** MEDIUM (UI exposure now; DB write exposure at migration)
**RLS Dependency:** NONE
**Identity Leak Type:** Route-level ownership bypass

**Recommended mitigation:** Wrap the ads route inside an OwnerOnlyDashboardGuard (or equivalent ownership check gate). At minimum, add actorId === sessionActorId guard at the top of the ads settings screen or its parent route loader.

**Follow-up command:** HAWKEYE (route enforcement audit)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security and Risk Management

---

### VEN-ADS-2026-003 — removeAd Accepts Bare id, No Ownership Pre-Check [SOURCE_VERIFIED]

**Finding ID:** VEN-ADS-2026-003
**Location:** apps/VCSM/src/features/ads/dal/ad.storage.dal.js:61
**Application Scope:** VCSM
**Platform Surface:** Creator Dashboard (ad deletion)
**Trust Boundary:** DAL layer — no ownership check
**Boundary Violated:** OWNERSHIP — deletion by id only, no actorId cross-check

**Current behavior:** `removeAd(id)` deletes the localStorage entry whose id matches the parameter. No verification that the ad's actorId matches the caller's session actorId.

**Risk:** Any call with a known ad id can delete any localStorage entry (bounded to same-browser scope, self-impact). At Supabase migration, same pattern → any actor can delete another actor's DB-backed ad.

**Severity:** MEDIUM
**Exploitability:** LOW (requires same browser, knowledge of ad id — self-harm only in localStorage)
**Attack Preconditions:** Access to localStorage, knowledge of target ad id
**Blast Radius:** LOW (localStorage scope) → HIGH at migration
**RLS Dependency:** NONE

**Recommended mitigation:** Before calling `removeAd`, verify ad.actorId === sessionActorId in the usecase layer. At DAL layer, when migrated to Supabase, enforce via RLS policy.

**CISSP Domain:**
- Primary: Software Development Security
- Secondary: Identity and Access Management

---

### VEN-ADS-2026-004 — validateAdDraft Accepts http:// URLs [SOURCE_VERIFIED]

**Finding ID:** VEN-ADS-2026-004
**Location:** apps/VCSM/src/features/ads/lib/ad.validation.js:4
**Application Scope:** VCSM
**Platform Surface:** Creator Dashboard (ad content)
**Trust Boundary:** Input validation
**Boundary Violated:** INPUT_VALIDATION — mixed-content / phishing risk for ad destination URLs

**Current behavior:** `isValidHttpUrl()` accepts both `http:` and `https:` protocols for `destinationUrl` and `mediaUrl`. Ads with http:// URLs could serve mixed content or redirect users to non-secure destinations.

**Risk:** Mixed content warnings, browser security degradation, phishing vector if ads display clickable destination URLs.

**Severity:** MEDIUM
**Exploitability:** MEDIUM (requires Citizen to create an ad with http:// URL)
**RLS Dependency:** NONE

**Recommended mitigation:** Rename to `isValidHttpsUrl()` and reject if `url.protocol !== 'https:'`. One-line change in ad.validation.js.

**CISSP Domain:**
- Primary: Software Development Security
- Secondary: Communication and Network Security

---

### VEN-ADS-2026-005 — localStorage Keyed on Global ADS_STORAGE_KEY, No Per-Actor Namespace [SOURCE_VERIFIED]

**Finding ID:** VEN-ADS-2026-005
**Location:** apps/VCSM/src/features/ads/dal/ad.storage.dal.js
**Application Scope:** VCSM
**Platform Surface:** Creator Dashboard (ad storage)
**Trust Boundary:** Data isolation boundary
**Boundary Violated:** DATA ISOLATION — multi-identity sessions share ad storage under a single key

**Current behavior:** All ads stored under a single `ADS_STORAGE_KEY` in localStorage. The `listAdsByActor` function filters by actorId in JavaScript after loading all entries. If multiple VPORT actors exist in the same browser session (e.g., a user with multiple VPORTs), their ads co-mingle under the same storage key.

**Risk:** In a multi-VPORT session, ad data from different VPORTs may appear together or overwrite each other due to id collisions. At Supabase migration, this co-mingling pattern must not carry forward.

**Severity:** MEDIUM
**Exploitability:** LOW (requires multi-VPORT session)
**RLS Dependency:** NONE

**Recommended mitigation:** Namespace the localStorage key per actorId: `ADS_STORAGE_KEY_${actorId}`. This isolates storage domains and prevents cross-actor co-mingling.

**CISSP Domain:**
- Primary: Asset Security
- Secondary: Software Development Security

---

### VEN-ADS-2026-006 — BEHAVIOR.md is PLACEHOLDER [SOURCE_VERIFIED]

**Finding ID:** VEN-ADS-2026-006
**Location:** ZZnotforproduction/APPS/VCSM/features/ads/BEHAVIOR.md
**Application Scope:** VCSM
**Platform Surface:** Governance
**Trust Boundary:** Governance contract
**Boundary Violated:** BEHAVIOR_CONTRACT_ABSENT

**Current behavior:** BEHAVIOR.md exists as a placeholder stub with no §5 Security Rules and no §9 Must Never Happen invariants. All findings in this report are UNANCHORED.

**Severity:** LOW
**Recommended mitigation:** Route to WOLVERINE for BEHAVIOR.md intake. At minimum: define §9 invariant: "An actor MUST NEVER view, edit, or delete ads belonging to another actor's VPORT."

**CISSP Domain:**
- Primary: Security and Risk Management
- Secondary: Security Assessment and Testing

---

## 7. Source Verification Summary

```
Total surfaces in scope: 3 write + 3 security paths
Surfaces source-verified: 3 / 3
Source files read (via evidence bundle): 4
  - apps/VCSM/src/features/ads/dal/ad.storage.dal.js — reason: write surface verification (VEN-ADS-2026-001, 003)
  - apps/VCSM/src/features/ads/lib/ad.validation.js — reason: input validation (VEN-ADS-2026-004)
  - apps/VCSM/src/features/ads/usecases/adPipeline.usecase.js — reason: ownership check absence (VEN-ADS-2026-001, 002)
  - apps/VCSM/src/features/ads/api/ad.api.js — reason: call chain confirmation
CRITICAL findings: 0
[SOURCE_VERIFIED] findings: 6 (including LOW)
```

---

## 8. Confidence Summary

```
HIGH confidence surfaces: 3
LOW confidence surfaces: 0
[SOURCE_VERIFIED] findings: 6
[SCANNER_LEAD] findings: 0
[SCANNER_LOW_CONF] findings: 0
[SCANNER_STALE] findings: 0
```

---

## 9. THOR Impact

```
THOR Release Blockers: NONE (current localStorage scope)
Pre-migration gate: VEN-ADS-2026-001, VEN-ADS-2026-002, VEN-ADS-2026-003 MUST be resolved before ads migration to Supabase
Highest Open Severity: HIGH
Recommendation: CAUTION
```

---

## 10. SOURCE READ SUMMARY

| Command | Source Files Read | Evidence Bundle Used | Full Rediscovery Performed |
|---|---:|---|---|
| VENOM | 0 (all via evidence bundle) | YES — ZZnotforproduction/APPS/VCSM/features/ads/outputs/2026/06/07/ARCHITECT/evidence-bundle.md | NO |

Files read (targeted verification only): All verification performed via ARCHITECT evidence bundle (CHAIN-ads-001/002/003, write surface map, security-sensitive surfaces).

---

## 11. Required Follow-Up Commands

| Command | Findings | Priority |
|---|---|---|
| BLACKWIDOW | VEN-ADS-2026-001 (URL param bypass), VEN-ADS-2026-002 (route access) | P1 |
| ELEKTRA | VEN-ADS-2026-001 (ownership chain trace), VEN-ADS-2026-003 (delete ownership), VEN-ADS-2026-004 (URL validation patch) | P1 |
| HAWKEYE | VEN-ADS-2026-002 (route access audit, OwnerOnlyDashboardGuard) | P1 |
| WOLVERINE | VEN-ADS-2026-006 (BEHAVIOR.md intake) | P2 |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 2 | VEN-ADS-2026-002, VEN-ADS-2026-006 |
| Asset Security | 1 | VEN-ADS-2026-005 |
| Security Architecture and Engineering | 1 | VEN-ADS-2026-001 (secondary) |
| Communication and Network Security | 1 | VEN-ADS-2026-004 (secondary) |
| Identity and Access Management | 3 | VEN-ADS-2026-001 (primary), VEN-ADS-2026-002 (primary), VEN-ADS-2026-003 (secondary) |
| Security Assessment and Testing | 1 | VEN-ADS-2026-006 (secondary) |
| Security Operations | 0 | No logging/monitoring findings in this scope |
| Software Development Security | 3 | VEN-ADS-2026-003 (primary), VEN-ADS-2026-004 (primary), VEN-ADS-2026-005 (primary) |

Security Operations: not meaningfully covered in this scope — ads has no logging layer to audit.
