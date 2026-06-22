# Session Summary — booking-review-identity-audit (2026-04-09)

## What was worked on
- **Booking pipeline**: Full audit, citizen-only slot selection enforcement, auto-close past slots, booking card profile display improvements, appointment card layout polish
- **Identity engine**: Neutral engine refactor (cleaned stale docs, added BOUNDARY.md guardrails), feed viewer desync fix, actor-switch race condition analysis, app-wide identity consistency audit across all 59 useIdentity consumers
- **Review pipeline**: Full end-to-end audit, implementation of 4 improvements (citizen-only controller guard, edit UI, cursor-based pagination, delete UI with confirmation), fix for "Anonymous" author display and missing overall score
- **Explore/search debugging**: Root cause analysis for user search failures (dot-stripping in normalizeHandleTerm, RLS privacy filtering, identity.actor_directory visibility flags)
- **Architecture contracts**: Created FORBID_PLATFORM_OWNERS_USAGE contract, strengthened identity engine CONTRACT.md and BOUNDARY.md

## Decisions made
- **Citizen-only booking**: Enforced at 4 layers (UI, hook, controller, RLS) using `canCitizenBook(identity)` selector as single source of truth. `identity.kind === "user"` is the canonical check — no separate `actorKind` field exists on the identity object.
- **Past-slot filtering**: Added as 4th exclusion layer in availability pipeline (rules - exceptions - occupied - expired). `isSlotExpired()` is the single source of truth for slot expiry.
- **Identity engine neutrality**: Engine is already clean — no app-specific code. Resolver files were already removed. Documentation was stale and needed updating. BOUNDARY.md added with anti-leak rules, forbidden imports, code review checklist.
- **Feed viewer sync**: Moved `debugFeedViewer` from CentralFeedScreen (screen-local) to IdentityProvider (global), with `[identity, user]` as dependencies to catch all identity changes including actor switches.
- **Review author enrichment**: Added `identity.actor_directory` fallback when `vc.actors` RLS blocks private user actors during author card hydration.
- **Review overall score**: Screen was reading `r.stats` (undefined) instead of `r.overallAverage` — confirmed as a pre-existing bug, not a regression.
- **Actor switch race condition**: Identified that `switchActor()` lacks a version guard (unlike boot-time resolve which uses `_resolveVersion`). Documented as secondary root cause — minimal fix is ~5 lines adding `_switchVersion` counter.

## Files changed
- `apps/VCSM/src/state/identity/identitySelectors.js` — added `canCitizenBook()`
- `apps/VCSM/src/state/identity/identityContext.jsx` — global feed viewer sync, `debugFeedViewer` import
- `apps/VCSM/src/features/booking/controller/createBooking.controller.js` — citizen-only guard, past-slot rejection
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/hooks/useVportBookingMutations.js` — citizen + past-slot guards
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/hooks/useVportBookingView.js` — viewerCanBook, slot gating, auto-clear interval, isSlotExpired import, consistency check
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/view/VportBookingView.jsx` — viewerCanBook prop pass-through
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/components/BookingCalendarDayPanel.jsx` — citizen notice, viewerCanBook, ActorLink for all views, layout improvements
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/model/bookingCalendarDate.model.js` — isSlotExpired()
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/model/bookingCalendarAvailability.model.js` — expired slot filtering, clientName/service pass-through
- `apps/VCSM/src/features/profiles/styles/profiles-booking-daypanel-modern.css` — appointment card layout alignment
- `apps/VCSM/src/features/profiles/kinds/vport/controller/review/VportReviews.controller.js` — citizen-only guard, cursor pagination
- `apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviews.read.dal.js` — cursor pagination
- `apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviewAuthors.read.dal.js` — identity.actor_directory fallback, avatar null fix, displayName fallback improvement
- `apps/VCSM/src/features/profiles/kinds/vport/hooks/review/useVportReviews.js` — myReview state, isEditing, startEdit, cancelEdit, deleteMyReview, pagination (hasMore, loadMore), ctrlDeleteMyReview import
- `apps/VCSM/src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx` — edit UI, delete confirmation modal, pagination props, overall score fix, consistency check
- `apps/VCSM/src/features/profiles/kinds/vport/screens/review/components/ReviewsList.jsx` — edit/delete buttons on own review, load more button, viewerActorId prop
- `apps/VCSM/src/features/feed/screens/CentralFeedScreen.jsx` — removed debugFeedViewer (moved to global), consistency check
- `apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx` — consistency check
- `debuggers/feed/helpers.js` — FEED_VIEWER_SYNC event logging, getFeedDebugState import
- `debuggers/identity/useActorConsistencyCheck.js` — new dev-only mismatch detector
- `engines/identity/CONTRACT.md` — removed stale temporary section, strengthened rules
- `engines/identity/CLAUDE.md` — removed stale resolver references
- `engines/identity/BOUNDARY.md` — new anti-leak guardrails
- `docs/ENGINE_BOUNDARY_AUDIT.md` — updated to reflect resolved violations
- `zcontract/FORBID_PLATFORM_OWNERS_USAGE.md` — new contract
- `logan/VCSM_BOOKING_PIPELINE.md` — new + updated with citizen-only and past-slot sections
- `logan/IDENTITY_ENGINE_ARCHITECTURE.md` — new 10-section architecture deliverable
- `logan/vport-review-pipeline-audit.md` — new 12-section audit
- `logan/vport-review-focused-plan.md` — new 4-improvement plan
- `logan/vport-review-implementation-plan.md` — new full 12-section plan
- `logan/vcsm-actor-switch-consumption-audit.md` — new 12-section audit
- `logan/actor-switch-root-cause-debug.md` — new 17-section forensic report

## Problems solved
- Booking: citizens can now only select/book future slots; vport identities blocked from citizen booking flow; past slots auto-close
- Booking cards: now show citizen profile photo + display name via ActorLink for all views (not just owner)
- Booking card layout: badge + accept/cancel buttons aligned horizontally
- Identity engine: stale documentation cleaned, BOUNDARY.md guardrails added, resolvers/ directory removed
- Feed viewer: no longer null after identity resolve on non-feed screens; no longer stale after actor switch
- Review "Anonymous": fixed by adding identity.actor_directory fallback when vc.actors RLS blocks private authors
- Review overall score: fixed property access from `r.stats` (undefined) to `r.overallAverage`
- Review avatar: fixed empty string fallback to null so `/avatar.jpg` default triggers
- User search "su.23": root cause identified — normalizeHandleTerm strips dots + RLS privacy filter
- Explore search "Carlos": root cause identified — `is_listable_in_app = false` on citizen actor directory row

## Open items
- **Actor switch race condition**: `switchActor()` in identityContext.jsx:28 lacks `_switchVersion` guard. Documented in logan/actor-switch-root-cause-debug.md. ~5 line fix pending.
- **normalizeHandleTerm dot fix**: `postgrestSafe.js` strips dots from search terms — needs `/[^a-z0-9_.-]/g` to preserve dots. Not yet implemented.
- **Carlos is_listable_in_app**: Data-level issue — his citizen actor has `is_listable_in_app = false` in identity.actor_directory. Needs investigation into what source condition sets this flag.
- **Review overall_rating trigger**: DB trigger that computes `overall_rating` on vport_reviews is undocumented. If it's missing or broken, scores stay NULL.
- **Session summary + single-source actor architecture**: Queued as planning 09-12, not yet executed.
- **Planning files 09-01 through 09-11**: All marked complete. 09-12 is next (session summary + architecture rules).

## Context for next session
This session covered massive ground across booking, reviews, identity engine, and search — 11 planning files executed in sequence. The core architecture is healthy: all 59 useIdentity consumers derive from React context correctly with zero stale patterns. The main remaining risk is the `switchActor()` race condition (no version guard for rapid switches). The review pipeline now has citizen-only guards, edit/delete UI, and cursor pagination. The identity engine is fully neutral with formal boundary protections. The explore search uses `identity.search_actor_directory` RPC with strict visibility flags — users missing from search should be checked for `is_listable_in_app`, `discoverable`, and `publish` flags on their directory row.
