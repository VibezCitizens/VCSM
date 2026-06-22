# Security Posture — shared

Last Updated: 2026-06-06
Highest Open Severity: HIGH
THOR Release Blocker: NO
BW Run: 2026-06-04 | BW Findings: 0 CRITICAL, 0 HIGH, 2 MEDIUM, 3 LOW, 1 INFO

---

## VENOM STATUS
VENOM Last Run: 2026-06-06 (targeted — bottom navigation bar)
VENOM Status: COMPLETE

Prior run (2026-06-04 broad scan): 5 findings — 0 CRITICAL, 2 HIGH, 2 MEDIUM, 1 LOW
This run (2026-06-06 bottom-nav targeted): 7 findings — 0 CRITICAL, 1 HIGH, 2 MEDIUM, 4 LOW

--- Prior Run Findings (2026-06-04) ---
- VEN-SHARED-001 | HIGH | OPEN | Scanner gap + PII: reverse-geocode edge function call not captured by scanner map; GPS coordinates transmitted without scanner coverage
- VEN-SHARED-002 | MEDIUM | STILL OPEN (source-verified 2026-06-06) | Adapter boundary violated: BottomNavBar imports profiles controller directly, bypassing profiles adapter
- VEN-SHARED-003 | MEDIUM | STILL OPEN | Behavior contract missing: BEHAVIOR.md is a PLACEHOLDER stub — no §5 Security Rules or §9 Must Never Happen invariants
- VEN-SHARED-004 | MEDIUM | OPEN | Hardcoded UUID fallbacks in resolveRealm.js; dual realm resolution path bypasses canonical DAL resolver
- VEN-SHARED-005 | LOW | OPEN | Ungated console.error calls in useUserLocation.js fire in production (lines 74, 126)

--- Bottom-Nav Targeted Findings (2026-06-06) ---
- V-BN-001 | HIGH | OPEN | MISSING_BEHAVIOR_CONTRACT — no §5 or §9 contract for session-critical persistent shell component
- V-BN-002 | MEDIUM | OPEN | Supabase auth UUID (user.id) transmitted to OneSignal third-party; no DPA documentation; stale binding risk on session expiry
- V-BN-003 | LOW | OPEN | window.OneSignal global writable — XSS amplification path: auth UUID exfiltration via fake SDK login() call
- V-BN-004 | MEDIUM | STILL OPEN | Re-verify of VEN-SHARED-002 — profiles controller direct import unchanged (source-verified 2026-06-06)
- V-BN-005 | LOW | OPEN | Identity adapter bypass — 3 new sites in shell layer: RootLayout.jsx, VportLeadsChip.jsx, useVportNewLeadsCount.js
- V-BN-006 | LOW | OPEN | OneSignal external-user binding persists on server-side session expiry; no lifecycle cleanup hook outside explicit sign-out
- V-BN-007 | LOW | OPEN | noti:refresh DOM event — untyped global; XSS-amplifiable query-spam and future misuse surface

Outputs:
- 2026-06-06: ZZnotforproduction/APPS/VCSM/features/shared/outputs/2026/06/06/Venom/2026-06-06_venom_bottom-nav-security-review.md
- 2026-06-04: ZZnotforproduction/APPS/VCSM/features/shared/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_shared-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-06 (targeted — bottom navigation bar)
ELEKTRA Status: COMPLETE
ELEKTRA Recommendation: CAUTION

Findings: 0 HIGH | 1 MEDIUM | 2 LOW | 1 INFO | 5 False Positives Rejected
THOR Release Blockers from ELEKTRA: NONE

| Finding ID | Severity | Provenance | Description | Status |
|---|---|---|---|---|
| ELEK-2026-06-06-001 | MEDIUM | SOURCE_VERIFIED | window.OneSignal reference not frozen — XSS can intercept auth UUID via fake sdk.login(); `os()` re-reads window.OneSignal on every call | OPEN |
| ELEK-2026-06-06-002 | LOW | SOURCE_VERIFIED | VportLeadsChip.jsx:15 embeds raw actorId UUID in navigation URL `/actor/{uuid}/dashboard/leads`; violates no-raw-IDs contract | OPEN |
| ELEK-2026-06-06-003 | LOW | SCANNER_LEAD | OneSignal session expiry logout gap — `!user` guard present at useOneSignalPush.js:72 but AuthProvider SIGNED_OUT propagation unverified; DEADPOOL verification required | OPEN |
| ELEK-2026-06-06-004 | INFO | SOURCE_VERIFIED | noti:refresh event dispatched as bare string in 2 files — no shared constant; typo risk; no exploit path | OPEN |

Patch Queue:
1. ELEK-001: Freeze `_sdk` reference in `onesignalClient.js:14-16` — SIMPLE, no DB change
2. ELEK-002: Replace UUID path in VportLeadsChip with `useActorCanonicalSlug()` — MODERATE, no DB change
3. ELEK-003: Verify AuthProvider SIGNED_OUT → user=null propagation; add auth listener if absent — SIMPLE
4. ELEK-004: Extract `NOTI_REFRESH_EVENT` constant to `bootstrap.hydrate.controller.js` — SIMPLE

Output: ZZnotforproduction/APPS/VCSM/features/shared/modules/bottomBarNav/2026-06-06_elektra_bottom-nav-security-scan.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-06 (targeted — bottom navigation bar)
BLACKWIDOW Status: COMPLETE
BLACKWIDOW Recommendation: CAUTION

--- Prior Run (2026-06-04 broad scan) ---
6 findings — 0 CRITICAL, 0 HIGH, 2 MEDIUM, 3 LOW, 1 INFO

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-SHARED-001 | MEDIUM | Adapter boundary violation: BottomNavBar imports getCachedActorCanonicalSlug from profiles controller directly (not via profiles.adapter.js) — mirrors VEN-SHARED-002, confirmed unfixed | BLOCKED (architecture) | DRAFT |
| BW-SHARED-002 | MEDIUM | buildActorSlug legacy function exports UUID-prefixed slugs; remains exported and callable; if used in public URL routing, raw UUIDs would be exposed | BLOCKED (not currently routed) | DRAFT |
| BW-SHARED-003 | LOW | shareNative is a transparent URL passthrough; post share URL constructed as /post/${postId} where postId is a raw UUID — violates no-raw-IDs-in-public-URLs contract | PARTIAL | DRAFT |
| BW-SHARED-004 | LOW | console.error calls in useUserLocation.js:74,127 and formatTimestamp.js:17 lack inline DEV guards; prod silencing relies solely on disableConsoleInProd side-effect import in main.jsx — fragile | BLOCKED (fragile mitigation) | DRAFT |
| BW-SHARED-005 | LOW | isDashboardCardEnabled returns true for unrecognized keys (line 33); silent feature enablement if new flag added without updating switch | BLOCKED (governance) | DRAFT |
| BW-SHARED-006 | INFO | copyToClipboard writes unsanitized text to clipboard; independent non-exploit — requires existing DOM XSS as pre-condition | BLOCKED | DRAFT |

All §9 invariant attacks BLOCKED:
- Void realm exclusion for system posts: BLOCKED (system post controllers import PUBLIC_REALM_ID directly)
- QR UUID guard: BLOCKED (isQrSafeSlug gates all 4 builders)
- GPS unauthenticated transmission: BLOCKED (token null check before coordinate send)
- Debug tools in production: BLOCKED (IS_PROD guard + render-site DEV guard)
- console.* in production: BLOCKED via disableConsoleInProd (fragile — see BW-SHARED-004)

--- Bottom-Nav Targeted Run (2026-06-06) ---
3 new BW findings — 0 CRITICAL, 1 MEDIUM (BYPASSED), 2 LOW (1 BYPASSED, 1 PARTIAL)
11 total attacks: 8 BLOCKED, 2 BYPASSED, 1 PARTIAL

| Finding ID | Severity | Type | Description | Status |
|---|---|---|---|---|
| BW-BN-001 | MEDIUM | BYPASSED | window.OneSignal XSS amplification — full auth UUID exfiltration chain confirmed; `os()` reads unguarded `window.OneSignal`; fake SDK login() receives user.id | OPEN |
| BW-BN-002 | LOW | BYPASSED | VportLeadsChip.jsx:15 generates raw actorId UUID in navigation URL `/actor/{uuid}/dashboard/leads`; no XSS required; violates no-raw-IDs platform contract | OPEN |
| BW-BN-003 | LOW | PARTIAL | noti:refresh flooding under XSS — query invalidation flood confirmed; React Query batching limits amplification; self-DoS only | OPEN |

VENOM reverifications (2026-06-06): V-BN-001 STILL_OPEN · V-BN-002 STILL_OPEN · V-BN-003 BYPASSED (escalated) · V-BN-004 STILL_OPEN · V-BN-005 STILL_OPEN · V-BN-006 STILL_OPEN · V-BN-007 PARTIAL

BEHAVIOR.md §9 invariants: NONE DECLARED — BEHAVIOR.md is a placeholder stub; §9 attack map could not be executed.

Outputs:
- 2026-06-06: ZZnotforproduction/APPS/VCSM/features/shared/modules/bottomBarNav/2026-06-06_blackwidow_bottom-nav-adversarial-review.md
- 2026-06-04: ZZnotforproduction/APPS/VCSM/features/shared/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_shared-adversarial-review.md
