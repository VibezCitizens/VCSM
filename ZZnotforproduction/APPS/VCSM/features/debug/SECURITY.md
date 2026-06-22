# Security Posture — debug

Last Updated: 2026-06-04
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-DEBUG-001, VEN-DEBUG-002

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

Findings: 0 CRITICAL, 2 HIGH, 2 MEDIUM, 0 LOW

- VEN-DEBUG-001 | HIGH | Misnamed export `setLoginDebugEnabled` aliases getter `isIdentityDebugEnabled` — broken setter contract in loginDebug.store.js:13
- VEN-DEBUG-002 | HIGH | Dead-code `__vcsm_dbg` localStorage-activated debug panel with key name documented in source — identity state exposure on non-prod builds (ActorProfileScreen.jsx:53)
- VEN-DEBUG-003 | MEDIUM | Auth telemetry (userId, event type) written to sessionStorage via iosProdDebugger without DEV-only guard in AuthProvider.jsx
- VEN-DEBUG-004 | MEDIUM | BEHAVIOR.md is a PLACEHOLDER — no §5 Security Rules or §9 Must Never Happen invariants defined

Output: ZZnotforproduction/APPS/VCSM/features/debug/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_debug-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

Findings: 0 CRITICAL, 0 HIGH, 2 MEDIUM, 3 LOW, 2 INFO

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-DEBUG-001 | MEDIUM | getDebugPrivacyRowsController has no ownership assertion — privacy data, ownership rows, and follow graphs accessible to any caller-supplied actorId if single call-site DEV guard is removed | BLOCKED (currently) | DRAFT |
| BW-DEBUG-002 | LOW | appendIOSProdDebugLog call sites in ProtectedRoute.jsx and AuthProvider.jsx pass userId without call-site DEV guard; production safety relies solely on IS_PROD internal guard | BLOCKED | DRAFT |
| BW-DEBUG-003 | MEDIUM | feed.read.debugPrivacyRows.dal.js and getDebugPrivacyRowsController are in production bundle with no controller/DAL-layer production guard — single-point enforcement at hook call site only | PARTIAL | DRAFT |
| BW-DEBUG-004 | LOW | vite.config.js:52 dev-mode @debuggers alias references nonexistent path zNOTFORPRODUCTION/_ACTIVE/debuggers — dev builds may fail; production unaffected | N/A | DRAFT |
| BW-DEBUG-005 | LOW | loginDebug.store.js:13 exports isIdentityDebugEnabled as setLoginDebugEnabled — misnamed export; stub no-op in production; cannot set debug state | BLOCKED | DRAFT |
| BW-DEBUG-006 | LOW | chatNavDebugger.js statically imported (not lazy) in ConversationView; module-level side effect prevents tree-shaking; included in production bundle unnecessarily | BLOCKED | DRAFT |
| BW-DEBUG-007 | INFO | BEHAVIOR.md is PLACEHOLDER — no §9 invariants anchored; all production safety relies on source-inferred implicit contracts | N/A | DRAFT |

Output: ZZnotforproduction/APPS/VCSM/features/debug/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_debug-adversarial-review.md
