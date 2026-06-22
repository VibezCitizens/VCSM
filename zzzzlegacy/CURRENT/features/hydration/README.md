# Feature Overview — hydration

## Registry Entry

| Field | Value |
|---|---|
| Feature | hydration |
| Status | ACTIVE |
| Security Tier | LOW |
| Source Path | apps/VCSM/src/features/hydration/ |
| CURRENT Path | zNOTFORPRODUCTION/CURRENT/features/hydration/ |
| Created | 2026-06-02 |

## Purpose

Actor hydration utility. Provides the runtime hydration store that resolves actor summaries
(display name, avatar, kind) across the platform. Cache invalidation on deactivation/deletion
is a security concern — see VENOM/BLACKWIDOW hydration poisoning scenarios.

## Governance State

Initial scaffold — no governance commands have run on this feature yet.
Runtime-sensitive utility — LOKI + KRAVEN pass recommended for cache behavior verification.

Run `/Dr.Strange hydration` for current status and command routing.

---
*Scaffold created: 2026-06-02 via TICKET-GOV-MISSING-CURRENT-FOLDERS-0001*
*Pending: ARCHITECT + VENOM (cache invalidation review) initial pass*
