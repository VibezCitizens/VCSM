# Platform: Documentation Governance

**Scope:** Documentation drift detection — LOGAN audit chain
**Last audit date:** 2026-05-11
**Phases run:** Cleanup (2026-05-11) + 3a through 3f (all 2026-05-11)

## What This Area Covers

Documentation drift between source code and canonical docs (`zNOTFORPRODUCTION/_CANONICAL/logan/`).
Tracks which documentation areas have gaps, confirmed drift, or outstanding corrections needed
after the 2026-05-11 LOGAN audit chain.

## Audit Chain Summary

| Phase | Scope | Report |
|---|---|---|
| Cleanup | `_CANONICAL/logan/` — trash removal + stale doc classification | `_ACTIVE/audits/documentation/logan-cleanup-report-2026-05-11.md` |
| 3a | Identity docs — 17 docs in `logan/vcsm/identity/` | `_ACTIVE/audits/documentation/phase3a-identity-drift-2026-05-11.md` |
| 3b | Booking + Vports docs — 1 booking doc + 18 vport docs | `_ACTIVE/audits/documentation/phase3b-booking-vports-drift-2026-05-11.md` |
| 3c | Chat docs + engine audit chain cross-links — 5 chat + 3 notifications + 17 engine docs | `_ACTIVE/audits/documentation/phase3c-chat-engines-audit-chain-2026-05-11.md` |
| 3d | Runtime mutation docs — 12 docs in `logan/vcsm/runtime/` | `_ACTIVE/audits/documentation/phase3d-runtime-mutations-drift-2026-05-11.md` |
| 3e | Profiles + Public + Notifications docs — 4 + 5 + 3 docs | `_ACTIVE/audits/documentation/phase3e-profiles-public-notifications-drift-2026-05-11.md` |
| 3f | Full vport schema migration scope — cross-cutting `vc.vport_*` → `vport.*` | `_ACTIVE/audits/documentation/phase3f-vport-schema-migration-scope-2026-05-11.md` |

## Drift Summary by Phase

### Cleanup (2026-05-11)
Two files deleted (`.DS_Store`, stale JSON blob). One file proposed for deletion (D-01):
`architecture/vcsm-architecture-report.md` — pre-dates architecture work, Windows path embedded.
Four files proposed for archive (A-01 through A-04): superseded system maps and chat audit.
Several files flagged NEEDS_VERIFICATION — awaiting owner confirmation.

### Phase 3a — Identity (17 docs)
**Summary:** 10 ALIGNED · 2 MINOR DRIFT · 2 NEEDS_VERIFICATION · 3 STALE · 0 CRITICAL

Open drift:
- F-3a-01 (LOW): `invalidateIdentityResultCache()` call missing from actor-switch-pipeline.md
- F-3a-02 (LOW): `vcsm.identity.citizen-to-vport-switch.md` — minor drift (details in source)
- 3 STALE docs: `vcsm.identity.actor-hydration-pipeline-audit.md` (HIGH stale),
  `vcsm.identity.context-forensic-review.md` (HIGH stale),
  `vcsm.identity.migration-checklist.md` (MEDIUM stale)
- 2 NEEDS_VERIFICATION: `vcsm.identity.actor-directory-projection.md`,
  `vcsm.identity.invite-pipeline.md`

### Phase 3b — Booking + Vports
Open drift:
- F-3b-01 (HIGH, CONTRADICTORY): `vcsm.booking.pipeline.md` doc claims `vport` schema does
  not exist and all DALs use `vc` schema. Code shows `vportClient.js` still exports
  `supabase.schema('vport')` and DALs still query that schema. Unresolved contradiction.
- Vports doc scan: 18 docs scanned but full code audit deferred. Status of individual
  vport docs: UNKNOWN pending Phase 3f cross-reference.

### Phase 3c — Chat + Engine Audit Chain
No code-vs-doc drift found in chat docs. Chat engine audit chain (V1 → V2 → V3) structurally sound.
All 6 engine audit cross-link path errors corrected (mutable docs only).
Open:
- F-3c-01 (LOW, FLAGGED ONLY): Wrong cross-link paths in engine audit files
  (`CHAT_ENGINE_AUDIT_V3.md`, `CHAT_ENGINE_AUDIT_V1.md`, `NOTIFICATIONS_ENGINE_AUDIT_V1.md`).
  Immutable — cannot be edited.

### Phase 3d — Runtime Mutations (12 docs)
Immediate fixes applied: stale source paths corrected in 2 files; mutation-matrix and
authority-matrix chat sections updated to reflect engine migration.
Open:
- F-3d-01 (HIGH, CONTRADICTORY + DOC MISSING): Four runtime docs reference
  `createBookingController` → `vc.bookings` and old file paths
  (`apps/VCSM/src/features/booking/controller/`). Code shows new controllers at
  `apps/VCSM/src/features/dashboard/vport/controller/` writing to `vportSchema.from('bookings')`.
  Dependent on F-3b-01 resolution.

### Phase 3e — Profiles + Public + Notifications
Profiles: 3 ALIGNED, 1 UNVERIFIED (historical). Public: 3 ALIGNED, 2 UNVERIFIED. Notifications: 3 ALIGNED/FIXED.
Open:
- F-3e-01 (HIGH, UNVERIFIED): `vcsm.notifications.pipeline.md` Section 10 references
  `vc.bookings` for Appointments tab reads. Dependent on F-3b-01 resolution.
- 2 public docs UNVERIFIED: `vcsm.public.conversion-funnel.md`, `vcsm.public.seo-infrastructure.md`
  (not inspected this pass).

### Phase 3f — Full vport Schema Migration Scope
15 Logan doc tables still referencing old `vc.vport_*` names — all PENDING correction:
`vc.vport_public_details`, `vc.vport_actor_menu_categories`, `vc.vport_actor_menu_items`,
`vc.vport_rates`, `vc.vport_fuel_prices`, `vc.vport_fuel_price_submissions`,
`vc.vport_fuel_price_submission_reviews`, `vc.vport_fuel_price_history`,
`vc.vport_portfolio_items`, `vc.vport_portfolio_media`, `vc.vport_portfolio_tags`,
`vc.vport_barber_portfolio_details`, `vc.vport_locksmith_portfolio_details`,
`vc.vport_locksmith_service_areas`, `vc.vport_locksmith_service_details`.

Booking tables fixed in Phase 3 (7 tables: bookings, resources, availability_rules,
availability_exceptions, service_booking_profiles, resource_services, services).
