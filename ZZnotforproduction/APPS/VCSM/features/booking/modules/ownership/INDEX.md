---
title: Ownership Module — Index
status: STUB
feature: booking
module: ownership
source: architect+venom+elektra+bw-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/booking/
scanner-version: 1.1.0
---

# booking / modules / ownership

Actor ownership verification — the security linchpin for all management-source booking operations. No write surfaces. **VERIFIED SAFE per ELEK-004 hardening.** Must never regress.

## Module Summary

| Field | Value |
|---|---|
| Module | ownership |
| Feature | booking |
| Source Path | apps/VCSM/src/features/booking/ |
| Screens | 0 |
| Write Surfaces | None |
| Controllers | 2 (assertActorOwnsVportActor, resolveVportProfileId) |
| DAL Files | 4 (readActorOwnerLinkByActorAndUserProfile, getActorById, getVportProfileIdByActorId, getVportSlugByActorId) |
| Hooks | 1 (useQrLinks) |
| Tests | 1 (assertActorOwnsVportActor.controller.test.js — 17 assertions) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| controller/assertActorOwnsVportActor.controller.js | Controller | **Security linchpin** — actor ownership verification; ELEK-004 hardened |
| controller/resolveVportProfileId.controller.js | Controller | VPORT profile ID resolution |
| dal/readActorOwnerLinkByActorAndUserProfile.dal.js | DAL | actor_owners table read — core ownership table |
| dal/getActorById.dal.js | DAL | Actor lookup by ID |
| dal/getVportProfileIdByActorId.dal.js | DAL | VPORT profile ID read |
| dal/getVportSlugByActorId.dal.js | DAL | VPORT slug read (for notification link paths) |
| hooks/useQrLinks.js | Hook | QR link generation for booking |
| controller/__tests__/assertActorOwnsVportActor.controller.test.js | Test | 17 assertions — ownership gate coverage |

## Write Surface Map

None — read-only security verification layer.

## Security Flags

- INFO (VERIFIED SAFE): BW-BOOK-005 — stale/voided actor session blocked by live DB lookup in assertActorOwnsVportActorController (BLOCKED, CLOSED)
- INFO (VERIFIED SAFE): BW-BOOK-006 — VPORT-kind actor impersonation blocked by kind-check pre-self-shortcut (BLOCKED, CLOSED)
- INFO (VERIFIED SAFE): BW-BOOK-011 — null viewerActorId rejected at all controller gates (BLOCKED, CLOSED)
- CRITICAL REGRESSION RISK: any change to assertActorOwnsVportActor.controller.js or readActorOwnerLinkByActorAndUserProfile.dal.js requires full re-run of 17 test assertions + VENOM re-scan

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm assertActorOwnsVportActor.controller.test.js covers all 17 assertions (null actor, wrong kind, stale session, etc.)
- [ ] Confirm getVportSlugByActorId.dal.js returns slug (not UUID) — critical for notification linkPath fix
- [ ] Confirm readActorOwnerLinkByActorAndUserProfile.dal.js exact query and filters
