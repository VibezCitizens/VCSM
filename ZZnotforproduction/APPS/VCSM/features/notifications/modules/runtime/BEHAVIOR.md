---
title: Runtime Module — Behavior
status: STUB
feature: notifications
module: runtime
source: venom+bw-derived
created: 2026-06-05
---

# notifications / modules / runtime — BEHAVIOR

## Status

STUB.

## Expected Behaviors (UNVERIFIED)

- setup.js configures notification engine on app boot
- publish.js (publishVcsmNotification) accepts notification payload and dispatches via engines/notifications
- notificationRuntime.dal.js maintains Supabase realtime subscription for live inbox updates
- notifications.adapter.js exposes publish boundary to other features

## Invariants (UNVERIFIED)

- sourceActorId must be session-derived (NOT enforced — BW-NOTI-005 BYPASSED)
- linkPath must not contain raw UUIDs (NOT enforced — BW-NOTI-009 BYPASSED)

## TODO

- [ ] Confirm publishEvent payload shape
- [ ] Confirm realtime subscription table and channel name
