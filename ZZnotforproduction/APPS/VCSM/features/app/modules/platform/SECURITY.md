---
title: Platform Module — Security
status: STUB
feature: app
module: platform
source: architect-derived
created: 2026-06-05
---

# app / modules / platform — SECURITY

## THOR Status

NO THOR BLOCKERS identified. One HIGH-severity finding pending confirmation.

## Findings

### PLATFORM-SEC-001 — IOSDebugHUD in Production (UNVERIFIED)
| Field | Value |
|---|---|
| ID | PLATFORM-SEC-001 |
| Source Finding | ARCHITECT observation |
| Severity | MEDIUM |
| Surface | platform/ios/IOSDebugHUD.jsx |
| Description | IOSDebugHUD renders device and environment information. If this component is rendered in production builds (no NODE_ENV or release flag gate), it exposes internal environment details to users. Must be dev-only. |
| Status | OPEN — UNVERIFIED (production gate not confirmed) |
| THOR | Not blocked |

### PLATFORM-SEC-002 — IOSProdRouteDebugger Production Status CRITICAL-TO-VERIFY
| Field | Value |
|---|---|
| ID | PLATFORM-SEC-002 |
| Source Finding | ARCHITECT observation |
| Severity | HIGH |
| Surface | platform/ios/IOSProdRouteDebugger.jsx |
| Description | "Prod" in the component name suggests this debugger may intentionally render in production environments (designed for production debugging, not dev-only). If rendered, it exposes internal route tree and navigation state to end users. Must be confirmed immediately — if active in production, it is a data-exposure finding. |
| Status | OPEN — REQUIRES IMMEDIATE VERIFICATION |
| THOR | Potential THOR BLOCKER if confirmed active in production builds |

### PLATFORM-SEC-003 — UA Detection Fallback
| Field | Value |
|---|---|
| ID | PLATFORM-SEC-003 |
| Source Finding | ARCHITECT observation |
| Severity | LOW |
| Surface | platform/ios/useIOSPlatform.js |
| Description | User agent sniffing for iOS detection is inherently unreliable. If the UA check fails or returns false positive, iOS-specific keyboard and layout behaviors may apply incorrectly on non-iOS devices. Low security impact; primarily a reliability concern. |
| Status | OPEN — LOW PRIORITY |
| THOR | Not blocked |

## Action Required

**PLATFORM-SEC-002 must be verified before next release.** Read platform/ios/IOSProdRouteDebugger.jsx to confirm:
1. What conditions render it
2. What it renders (route names? paths? state?)
3. Whether it has a production gate

If rendered in production: escalate to THOR BLOCKER immediately.

## TODO

- [ ] Read IOSProdRouteDebugger.jsx — confirm production gate
- [ ] Read IOSDebugHUD.jsx — confirm NODE_ENV or releaseFlags gate
- [ ] Update PLATFORM-SEC-002 severity based on findings
