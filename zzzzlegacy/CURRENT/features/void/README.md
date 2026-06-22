# Feature Overview — void

## Registry Entry

| Field | Value |
|---|---|
| Feature | void |
| Status | ACTIVE |
| Security Tier | LOW |
| Source Path | apps/VCSM/src/features/void/ |
| CURRENT Path | zNOTFORPRODUCTION/CURRENT/features/void/ |
| Created | 2026-06-02 |

## Purpose

Planned future realm — 18+ anonymous-but-DB-tracked content realm.
System posts (fuel price, menu) must stay in the public realm, not the void realm.
VPORT system posts are void:false by construction; always use resolvePublicRealmIdDAL(),
never viewer session realmId.

## Governance State

Initial scaffold — no governance commands have run on this feature yet.
Feature is early-stage — ARCHITECT pass recommended before any implementation begins.

Run `/Dr.Strange void` for current status and command routing.

---
*Scaffold created: 2026-06-02 via TICKET-GOV-MISSING-CURRENT-FOLDERS-0001*
*Pending: ARCHITECT initial pass before implementation*
