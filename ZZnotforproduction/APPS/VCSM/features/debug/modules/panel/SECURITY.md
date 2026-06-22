---
title: Panel Module — Security
status: STUB
feature: debug
module: panel
source: venom+bw-derived
created: 2026-06-05
---

# debug / modules / panel — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — PANEL-SEC-001, PANEL-SEC-002**

## Findings

### PANEL-SEC-001 — Broken Setter Export in loginDebug.store.js [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | PANEL-SEC-001 |
| Source Findings | VEN-DEBUG-001, BW-DEBUG-005 |
| Severity | HIGH — THOR BLOCKER |
| Surface | loginDebug.store.js line 13 |
| Description | `isIdentityDebugEnabled` (a getter) is exported under the name `setLoginDebugEnabled`. Any caller expecting a setter cannot set debug state — silent no-op. Broken export contract. The misnamed export ships in the production bundle. BW-DEBUG-005: BLOCKED in production (no-op stub), but the broken export persists. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### PANEL-SEC-002 — localStorage-Activated Debug Key Documented in Source [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | PANEL-SEC-002 |
| Source Findings | VEN-DEBUG-002 |
| Severity | HIGH — THOR BLOCKER |
| Surface | ActorProfileScreen.jsx:53 (profiles feature) — triggered by debug feature code |
| Description | Dead-code `__vcsm_dbg` localStorage key activates a debug panel on non-prod builds. The key name is documented in source code. Any actor who reads the source can activate identity state exposure on staging/preview builds. Must be removed from source entirely, not just made unreachable. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### PANEL-SEC-003 — Auth Telemetry Written to sessionStorage Without DEV Guard
| Field | Value |
|---|---|
| ID | PANEL-SEC-003 |
| Source Findings | VEN-DEBUG-003, BW-DEBUG-002 |
| Severity | MEDIUM |
| Surface | AuthProvider.jsx → appendIOSProdDebugLog (app/shell module) |
| Description | Auth telemetry including userId and event type is written to sessionStorage via appendIOSProdDebugLog in AuthProvider.jsx without a call-site DEV-only guard. Production safety relies solely on the IS_PROD internal guard inside appendIOSProdDebugLog. Single-point enforcement. BW-DEBUG-002: BLOCKED (currently) — IS_PROD guard holds. |
| Status | OPEN — PARTIAL |
| THOR | Not blocked independently |

### PANEL-SEC-004 — Debug DAL/Controller in Production Bundle
| Field | Value |
|---|---|
| ID | PANEL-SEC-004 |
| Source Findings | BW-DEBUG-003 |
| Severity | MEDIUM |
| Surface | feed.read.debugPrivacyRows.dal.js + getDebugPrivacyRowsController (feed feature) |
| Description | Debug DAL and controller are included in the production bundle. Single-point enforcement at the hook call site. If the hook-level DEV guard is removed or bypassed, privacy data, ownership rows, and follow graphs become accessible. BW-DEBUG-001: no ownership assertion in controller. |
| Status | OPEN — PARTIAL |
| THOR | Not blocked independently |

### PANEL-SEC-005 — Debuggers Stub Safety Unverified
| Field | Value |
|---|---|
| ID | PANEL-SEC-005 |
| Source Findings | ARCHITECT observation |
| Severity | LOW |
| Surface | apps/VCSM/src/debuggers-stub/ |
| Description | Production @debuggers alias resolves to debuggers-stub. The stub's export safety has not been formally verified. If any stub export returns real data or has side effects, debug data could leak in production. |
| Status | OPEN — UNVERIFIED |
| THOR | Not blocked |

### PANEL-SEC-006 — chatNavDebugger.js Statically Imported
| Field | Value |
|---|---|
| ID | PANEL-SEC-006 |
| Source Findings | BW-DEBUG-006 |
| Severity | LOW |
| Surface | chat/ConversationView → chatNavDebugger.js (chat feature) |
| Description | chatNavDebugger.js is statically imported (not lazy) in ConversationView. Module-level side effects prevent tree-shaking. Included in production bundle unnecessarily. |
| Status | OPEN |
| THOR | Not blocked |

## Remediation Priority

1. PANEL-SEC-001: fix export name in loginDebug.store.js:13
2. PANEL-SEC-002: remove __vcsm_dbg activation code from ActorProfileScreen.jsx:53
3. PANEL-SEC-003: add call-site DEV guard to appendIOSProdDebugLog in AuthProvider.jsx
4. PANEL-SEC-004: move debug DAL/controller behind dynamic import with DEV guard
5. PANEL-SEC-005: audit debuggers-stub exports
6. PANEL-SEC-006: make chatNavDebugger.js import conditional on DEV

## ELEKTRA Status

ELEKTRA has NOT been run on this feature. Run ELEKTRA before next release.
