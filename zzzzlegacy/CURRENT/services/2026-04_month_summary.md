# Monthly Summary — 2026-04

## Month
April 2026

## Sessions This Month
- 2026-04-01_10-15_engine-independence-identity-chat.md — Engine independence (identity + chat), schema-truth alignment, parent provisioning fix, BUGSBUNNY/TP commands created
- 2026-04-05_09-30_logan-audit-architecture-contracts.md — Logan audit (35→34 docs), architecture contracts locked, dead code purge (68 files), barber booking bug, i18n audit (750 strings)
- 2026-04-06_08-45_chat-audit-legacy-dal-removal.md — Chat audit, legacy vc.* DAL removal (46 files), image send pipeline, chat UI bugs fixed
- 2026-04-06_12-30_moderation-hydration-engine-explore.md — Moderation migration to moderation.* schema, hydration engine created (engines/hydration/), Explore search refactor
- 2026-04-09_08-00_booking-identity-reviews-explore.md — Booking pipeline, identity engine refactor, review pipeline improvements, explore/search debugging
- 2026-04-09_14-00_reviews-engine-build.md — Reviews engine built from scratch (engines/reviews/), VCSM migration to engine, optimistic UI, full UI overhaul
- 2026-04-10_08-30_legal-compliance-theme-unification.md — Legal compliance audit, legal consent system (full infra), re-consent engine, theme unification (--vc-* tokens)
- 2026-04-10_12-00_legal-theme-portfolio-notifications-ios.md — Legal consent + theme (continued), VPORT portfolio polish, notification card polish, iOS stacking context fixes
- 2026-04-10_16-00_legal-theme-ttl-caches-skeletons-logan.md — Legal + theme (continued), 17 TTL caches implemented, skeleton components, Logan reorganization (46 files renamed)
- 2026-04-12_10-00_psl-notification-engine-traffic-batman.md — PSL foundation, notification engine migration (all 14 events), Traffic locksmith SEO, Traffic↔Vport integration audit (Batman)
- 2026-04-13_09-00_vport-dal-schema-migration.md — vport DAL schema migration (vc.vport_* → vport.*), live DB verification, RPC audit (20 RPCs), vcsmActorHydrator ownerActorId fix

## Primary Work Streams
- Full engine-independence refactor: identity engine, chat engine, reviews engine, hydration engine, notifications engine all extracted into `engines/`
- Legal compliance infrastructure: consent system, re-consent engine, legal gate components built from scratch
- Theme unification: all color tokens migrated to `--vc-*` CSS custom properties; hardcoded Tailwind color classes eliminated
- Schema migrations: `vc.*` → domain-namespaced schemas (`vport.*`, `moderation.*`) with live DB verification
- Documentation overhaul: Logan reorganized from 35 to 34 docs with consistent naming; 46 files renamed
- Traffic SEO foundation: locksmith static pages, Traffic↔VCSM VPORT integration audit via Batman

## Key Decisions
- All shared domain logic must live in `engines/` — apps never re-implement engine concerns
- Actor hydration uses `useActorStore` (Zustand, 5min TTL) as single display cache; `upsertActors` is the only write path
- `select('*')` is banned across all DALs — explicit column lists required
- Legal consent is a first-class system: `legal_consent` table, `re-consent` engine, gate components — not a UI bolt-on
- TTL cache pattern (`shared/lib/ttlCache.js`) adopted as standard for all read-heavy features
- iOS stacking context: `position: fixed` modals must render as fragment siblings, never inside parents with `backdrop-filter` or `transform`
- `vport.*` schema replaces `vc.vport_*` across all DALs — migration verified live

## Files Most Changed
- `engines/hydration/` — created from scratch (store, hydrate, useActorSummary, index)
- `engines/reviews/` — created from scratch
- `engines/notifications/` — migrated and extended (14 events)
- `apps/VCSM/src/features/settings/` — legal consent, account settings, theme
- `apps/VCSM/src/styles/citizens-theme.css` — single source of truth for --vc-* tokens
- `apps/VCSM/src/features/chat/dal/` — legacy vc.* removal, image pipeline
- `apps/VCSM/src/features/vport/dal/` — schema migration vc.vport_* → vport.*
- `zNOTFORPRODUCTION/logan/` — 46 files renamed, architecture contracts added

## Architecture Changes
- `engines/hydration/` — new engine: actor display cache, batch hydration, useActorSummary hook
- `engines/reviews/` — new engine: review pipeline, optimistic UI, VCSM consumer wiring
- `engines/notifications/` — migrated from app-local to engine, all 14 notification events covered
- Moderation: migrated to `moderation.*` schema
- VPort: migrated to `vport.*` schema
- Theme: `--vc-*` token system established as locked standard
- Legal consent: new system boundary (consent table + engine + gate components)
- Architecture contract locked: DAL→Model→Controller→Hook→Screen layer order enforced, no exceptions

## Open Items Carried Forward
- vcsmActorHydrator ownerActorId fix was partial — confirmed working but hydrator still not seeding useActorStore on identity load (resolved in May 03 session)
- Traffic↔VCSM deep-link wiring deferred (Traffic still runs on mock data)
- Batman PSL audit deferred to May for full deletion pipeline coverage

## Notes for AI Agents
April 2026 was the largest single month of structural work in the repository. The engines/ directory was built out from near-empty to containing hydration, reviews, and notifications. The architecture contract was locked — it is in `zNOTFORPRODUCTION/zcontract/ARCHITECTURE.md` and overrides all local assumptions. All vport DALs now use `vport.*` schema. The `--vc-*` token system is the only allowed styling mechanism — no hardcoded Tailwind color classes. Legal consent is a real system, not a UI checkbox — do not treat it as cosmetic.
