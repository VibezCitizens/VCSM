# Platform Documentation — Current Status

**As of:** 2026-05-11 (last audit date in source files)
**Audit chain:** LOGAN cleanup + phases 3a through 3f

---

## Overall Coverage

| Area | Docs Audited | Result |
|---|---:|---|
| Identity (`logan/vcsm/identity/`) | 17 | 10 ALIGNED, 2 MINOR DRIFT, 2 NEEDS_VERIFICATION, 3 STALE |
| Booking (`logan/vcsm/booking/`) | 1 | MINOR DRIFT (HIGH contradiction on schema) |
| Vports (`logan/vports/`) | 18 | Scanned — full code audit deferred |
| Chat (`logan/vcsm/chat/`) | 5 | ALIGNED (cross-links corrected) |
| Notifications (`logan/vcsm/notifications/`) | 3 | ALIGNED / FIXED |
| Engine audit files (`logan/engines/`) | 17 | Cross-links corrected where mutable |
| Runtime mutations (`logan/vcsm/runtime/`) | 9 (of 12) | Partial — 3 UI audit docs excluded |
| Profiles (`logan/vcsm/profiles/`) | 4 | 3 ALIGNED, 1 UNVERIFIED |
| Public (`logan/vcsm/public/`) | 5 | 3 ALIGNED, 2 UNVERIFIED |
| Architecture (`logan/architecture/`) | Multiple | Stale docs proposed for deletion/archive |

---

## Open Drift Findings

| Finding | Phase | Severity | Status |
|---|---|---|---|
| F-3a-01: `invalidateIdentityResultCache()` missing from actor-switch-pipeline.md | 3a | LOW | OPEN |
| F-3a-02: Minor drift in `vcsm.identity.citizen-to-vport-switch.md` | 3a | LOW | OPEN |
| 3 STALE identity docs (actor-hydration-pipeline-audit, context-forensic-review, migration-checklist) | 3a | HIGH / MEDIUM | OPEN |
| F-3b-01: `vcsm.booking.pipeline.md` contradicts code — `vport` schema status | 3b | HIGH | OPEN |
| F-3c-01: Wrong cross-link paths in engine audit files (immutable) | 3c | LOW | FLAGGED ONLY — cannot edit |
| F-3d-01: Four runtime docs reference old booking controllers + `vc.bookings` | 3d | HIGH | OPEN — blocked on F-3b-01 |
| F-3e-01: `vcsm.notifications.pipeline.md` references `vc.bookings` for Appointments tab | 3e | HIGH | OPEN — blocked on F-3b-01 |
| 15 Logan docs with `vc.vport_*` table names (Phase 3f scope) | 3f | HIGH | OPEN — pending correction |

---

## Open Verification Items

| Item | Phase | Status |
|---|---|---|
| `vcsm.identity.actor-directory-projection.md` — may be superseded | 3a | NEEDS_VERIFICATION |
| `vcsm.identity.invite-pipeline.md` — invite flow changed | 3a | NEEDS_VERIFICATION |
| `vcsm.profiles.citizen-vs-vport-audit.md` — 1159-line historical ref | 3e | UNVERIFIED (sampled only) |
| `vcsm.public.conversion-funnel.md` — not inspected this pass | 3e | UNVERIFIED |
| `vcsm.public.seo-infrastructure.md` — not inspected this pass | 3e | UNVERIFIED |

---

## Cleanup Items — Awaiting Owner Confirmation

| ID | File | Action |
|---|---|---|
| D-01 | `architecture/vcsm-architecture-report.md` | DELETE_CANDIDATE — stale, pre-dates architecture work, Windows path embedded |
| A-01 | `architecture/system-map.2026-04.md` | ARCHIVE_CANDIDATE — double-superseded |
| A-02 | `architecture/system-map.md` | ARCHIVE_CANDIDATE — superseded by `marvel/architect/system-map.md` |
| A-03 | `vports/vcsm.vport.business-pipeline.md` | ARCHIVE_CANDIDATE — v2 explicitly supersedes v1 |
| A-04 | `engines/CHAT_ENGINE_AUDIT.md` | ARCHIVE_CANDIDATE — rename to V1 then archive |

---

## Core Blocker

**F-3b-01 is a root blocker for F-3d-01 and F-3e-01.**

The `vport` schema status is contradictory: the booking pipeline doc says the schema does not
exist, but `vportClient.js` and all dashboard-local DALs query `supabase.schema('vport')`.
Until this contradiction is resolved at the code level (or confirmed as intentional architecture),
runtime mutation docs and notifications pipeline docs cannot be safely updated.
