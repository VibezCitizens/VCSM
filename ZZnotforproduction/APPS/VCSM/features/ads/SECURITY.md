# Security Posture — ads

Last Updated: 2026-06-07
Highest Open Severity: HIGH
THOR Release Blocker: NO (becomes YES before ads Supabase migration — see VEN-ADS-2026-001, VEN-ADS-2026-002, BW-ADS-001, BW-ADS-002)

---

## VENOM STATUS
VENOM Last Run: 2026-06-07
VENOM Status: COMPLETE

2 HIGH, 3 MEDIUM, 1 LOW — 6 findings total. All [SOURCE_VERIFIED]. No CRITICAL.
Pre-migration gate required: VEN-ADS-2026-001, VEN-ADS-2026-002, VEN-ADS-2026-003 escalate to CRITICAL when ads moves to Supabase persistence.

| Finding ID | Severity | Description | Status |
|---|---|---|---|
| VEN-ADS-2026-001 | HIGH | actorId from URL param not session-verified — any authenticated Citizen can load another actor's ad pipeline | OPEN |
| VEN-ADS-2026-002 | HIGH | Route not inside OwnerOnlyDashboardGuard — no ownership gate at route level | OPEN |
| VEN-ADS-2026-003 | MEDIUM | removeAd (dal:61) accepts bare id with no ownership pre-check at DAL layer | OPEN |
| VEN-ADS-2026-004 | MEDIUM | validateAdDraft permits http:// URLs for destinationUrl and mediaUrl — mixed content / phishing risk | OPEN |
| VEN-ADS-2026-005 | MEDIUM | localStorage keyed on global ADS_STORAGE_KEY with no per-actorId namespace — cross-actor co-mingling | OPEN |
| VEN-ADS-2026-006 | LOW | BEHAVIOR.md is a PLACEHOLDER — no §5 Security Rules or §9 Must Never Happen declared; all findings UNANCHORED | OPEN |

Output: ZZnotforproduction/APPS/VCSM/features/ads/outputs/2026/06/07/Venom/2026-06-07_venom_ads-security-review.md
Prior run (2026-06-04): ZZnotforproduction/APPS/VCSM/features/ads/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_ads-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-07
ELEKTRA Status: COMPLETE

0 CRITICAL | 2 HIGH | 2 MEDIUM | 0 LOW
2 False Positives Rejected
THOR Release Blocker: NONE (localStorage scope — pre-migration gate required)

| Finding ID | Severity | Description | Patch Type | Status |
|---|---|---|---|---|
| ELEK-ADS-2026-001 | HIGH | actorId URL param travels source→sink with no ownership check; adPipeline.usecase.js no sessionActorId==actorId guard | OWNERSHIP_GUARD (usecase) | OPEN |
| ELEK-ADS-2026-002 | MEDIUM | deleteAdUseCase: no ownership pre-check before removeAd(id) | OWNERSHIP_GUARD (usecase) | OPEN |
| ELEK-ADS-2026-003 | MEDIUM | validateAdDraft: isValidHttpUrl accepts http:// — change to return url.protocol === 'https:' | INPUT_SANITIZE (validation) | OPEN |
| ELEK-ADS-2026-004 | HIGH | /vport/:actorId/ads route missing OwnerOnlyDashboardGuard | ROUTE_GUARD (routing) | OPEN |

False Positives Rejected: FP-ADS-001 (localStorage CRITICAL — bounded to browser), FP-ADS-002 (DevTools tamper — design constraint)
Pre-migration mandatory patches: ELEK-ADS-2026-001 + ELEK-ADS-2026-004 before any Supabase ads migration.
Output: ZZnotforproduction/APPS/VCSM/features/ads/outputs/2026/06/07/ELEKTRA/2026-06-07_elektra_ads-security-scan.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-07
BLACKWIDOW Status: COMPLETE

0 CRITICAL, 1 HIGH, 2 MEDIUM, 1 LOW, 1 UNRESOLVED — 5 new findings + 2 carry-forwards
Current severity bounded by localStorage-only storage. Pre-migration gate: BW-ADS-2026-001 escalates to CRITICAL before Supabase migration.

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-ADS-2026-001 | HIGH | Route ownership bypass — /vport/victim-actorId/ads fully accessible to any authenticated Citizen; actorId from URL, no OwnerOnlyDashboardGuard | BYPASSED | OPEN |
| BW-ADS-2026-002 | MEDIUM | removeAd bare id deletion — same-browser scope limits impact; pattern is unguarded | PARTIAL | OPEN |
| BW-ADS-2026-003 | MEDIUM | http:// URL accepted in validateAdDraft — mixed content / phishing vector | BYPASSED | OPEN |
| BW-ADS-2026-004 | MEDIUM | localStorage cross-actor co-mingling — JS filter prevents display but data co-resides | PARTIAL | OPEN |
| BW-ADS-2026-005 | MEDIUM | localStorage contents fully tamperable via DevTools — arbitrary ad data trusted without validation | BYPASSED | OPEN |
| BW-ADS-2026-006 | LOW | No audit trail for ad creation/deletion — moderation blind spot | UNRESOLVED | OPEN |

Prior run (2026-06-04): BW-ADS-001 to BW-ADS-007 — all still OPEN
Output: ZZnotforproduction/APPS/VCSM/features/ads/outputs/2026/06/07/BlackWidow/2026-06-07_blackwidow_ads-adversarial-review.md
