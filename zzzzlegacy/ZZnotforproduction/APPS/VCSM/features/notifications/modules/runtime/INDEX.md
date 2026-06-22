---
title: Runtime Module — Index
status: STUB
feature: notifications
module: runtime
source: venom+bw-derived
created: 2026-06-05
---

# notifications / modules / runtime

Notification publishing and real-time delivery runtime. Handles publishEvent (caller-supplied sourceActorId), runtime DAL (Supabase realtime subscription), and setup.

## Source Files

| File | Layer |
|---|---|
| runtime/index.js | runtime boot |
| runtime/notificationRuntime.dal.js | realtime DAL |
| runtime/notificationRuntime.model.js | model |
| publish.js | publish entry point |
| setup.js | boot config |
| adapters/notifications.adapter.js | adapter |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

No THOR blockers scoped to runtime. RUNTIME-SEC-001 (HIGH) requires fix before release.
