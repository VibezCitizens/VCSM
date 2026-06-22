---
title: Debug Module — Behavior
status: STUB
feature: chat
module: debug
source: scanner-derived
created: 2026-06-04
source-path: apps/VCSM/src/features/chat/debug/
---

# chat / modules / debug — BEHAVIOR

## Status

STUB. No behaviors confirmed for this module yet.

## Known Constraints

- Dev-only — behavior must be gated behind a dev/diagnostics guard
- Must not render in production builds
- Must not expose message content or actor PII in debug output

## TODO

- [ ] List debug utilities provided by this module
- [ ] Confirm dev-guard mechanism (env check, diagnostics group, etc.)
- [ ] Document what state/data the debug panel surfaces
