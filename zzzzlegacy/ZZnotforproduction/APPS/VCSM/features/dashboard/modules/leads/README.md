# dashboard/modules/leads

Status: ACTIVE
Last Updated: 2026-06-04

---

## Purpose

Owner-only module that lets a VPORT owner view, manage, and act on business card scan leads. A lead is a contact record created when someone scans the VPORT's public business card QR code and submits their name, phone, email, and message.

Access is intentionally OWNER ONLY — no delegation to team members or staff by design.

## Source

`apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/`

## Key Facts

- Table: `vport.business_card_leads` (PII — name, phone, email, message)
- All 5 operations gated by `assertActorOwnsVportActorController`
- Write DALs scope by `profileId` AND `leadId`
- New leads badge polled every 60 seconds
- Routes: `/actor/:actorId/dashboard/leads` (canonical), `/vport/:actorId/dashboard/leads` (legacy redirect)
- No engine dependencies
- Rule 9 compliant barrel

## Governance Status

BEHAVIOR.md: MISSING — Wolverine intake required
SECURITY.md: MISSING — VENOM review required (PII module)
