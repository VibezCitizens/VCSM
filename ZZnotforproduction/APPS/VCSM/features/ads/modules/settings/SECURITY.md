---
title: Settings Module — Security
status: STUB
feature: ads
module: settings
source: venom+blackwidow+elektra-derived
created: 2026-06-05
---

# ads / modules / settings — SECURITY

## THOR Status

NO CURRENT THOR BLOCKER — persistence is localStorage-only (pre-migration).

**Pre-migration escalation:** SETTINGS-SEC-001 and SETTINGS-SEC-002 become CRITICAL THOR BLOCKERS when ads migrates to Supabase. No migration may proceed without resolving these findings first.

## Findings

### SETTINGS-SEC-001 — Unguarded Route
| Field | Value |
|---|---|
| ID | SETTINGS-SEC-001 |
| Source Findings | VEN-ADS-001, BW-ADS-001 |
| Severity | HIGH (pre-migration CRITICAL) |
| Surface | Route /ads/vport/:actorId → VportAdsSettingsScreen.jsx |
| Description | Route is not nested inside OwnerOnlyDashboardGuard. Any authenticated Citizen can navigate to /ads/vport/{foreignActorId} and access another actor's ads settings screen. No ownership check at route level. |
| Status | OPEN |
| THOR | Not blocked (localStorage) — WILL BLOCK on Supabase migration |

### SETTINGS-SEC-002 — URL Param actorId Without Session Cross-Check
| Field | Value |
|---|---|
| ID | SETTINGS-SEC-002 |
| Source Findings | VEN-ADS-002, BW-ADS-002 |
| Severity | HIGH (pre-migration CRITICAL) |
| Surface | useVportAds.js → actorId from useParams() |
| Description | actorId resolved from URL param with no cross-check against authenticated session identity. A foreign actorId is accepted and used to load and mutate the ad pipeline. |
| Status | OPEN |
| THOR | Not blocked (localStorage) — WILL BLOCK on Supabase migration |

### SETTINGS-SEC-003 — No Actor Kind Gate
| Field | Value |
|---|---|
| ID | SETTINGS-SEC-003 |
| Source Findings | BW-ADS-003 |
| Severity | MEDIUM |
| Surface | VportAdsSettingsScreen.jsx |
| Description | No actor kind check at screen entry. User-kind actors (personal profiles) can access VPORT-only ads pipeline. Ads is a VPORT feature and should gate on actorKind='vport'. |
| Status | OPEN |
| THOR | Not blocked |

### SETTINGS-SEC-004 — Raw UUID in Route Path
| Field | Value |
|---|---|
| ID | SETTINGS-SEC-004 |
| Source Findings | BW-ADS-007 |
| Severity | LOW |
| Surface | Route /ads/vport/:actorId |
| Description | Raw actorId UUID exposed in route path. Violates platform no-raw-IDs-in-URLs policy. QR codes, share links, and navigation should use human-readable slugs. |
| Status | OPEN |
| THOR | Not blocked |

## Pre-Migration Security Gate Requirement

Before migrating ads to Supabase:
1. SETTINGS-SEC-001 must be resolved (route must be inside OwnerOnlyDashboardGuard or equivalent server-side check)
2. SETTINGS-SEC-002 must be resolved (actorId must be sourced from session, not URL params, or cross-checked)
3. SETTINGS-SEC-003 must be resolved (actor kind gate required)
4. Full VENOM + ELEKTRA + BW re-run required post-migration

## TODO

- [ ] Confirm scanner finding IDs against actual output files in features/ads/outputs/
- [ ] Confirm route guard config in router — where is /ads/* registered?
- [ ] Document ownership fix strategy: guard at route vs ownership check in hook vs both
