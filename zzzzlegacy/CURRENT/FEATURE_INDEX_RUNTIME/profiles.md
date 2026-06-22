# Runtime Feature Index: profiles

## Metadata

| Field | Value |
|---|---|
| Feature | profiles |
| CURRENT Folder | CURRENT/features/profiles |
| Source Folder | apps/VCSM/src/features/profiles |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |
| ARCHITECT Run | 2026-06-02 (ARCHITECT-PROFILES-0001) |

## Source Inventory

| Layer | Count | Key Files |
|---|---:|---|
| Controllers | 51 | getProfileView, resolveActorBySlug, buildActorCanonicalSlug, locksmithOwner, upsertVportRate, deleteVportContentPage, publishExchangeRateUpdateAsPost, upsertVportServices, VportPortfolio |
| DALs | 63 | readActorProfile.dal, resolveActorSlug.dal, upsertVportRate.dal, readVportServicesByActor.dal, locksmithServiceAreas.write.dal, content/ (8 DALs), menu/ (10 DALs) |
| Hooks | 69 | useProfileView, useResolveActorBySlug, useProfileGate, useVportPublicDetails, useVportProfileBySlug, useActorProfileActions, booking screen hooks (6), menu hooks (3) |
| Models | 23 | profile.model, actorSeo.model, mapVportPublicDetails.model, vportOwnership.model, VportActorMenu.model, vportRates.model, vportService.model |
| Screens | 167 | ActorProfileScreen, ActorProfileViewScreen, VportProfileViewScreen, ActorProfileFriendsView, ActorProfilePhotosView, booking/ view, menu/ view, rates/ view |
| Components | 75 | Comprehensive UI across all profile types |
| Routes | 3 | /profile/:actorId (AUTH), /actor/:actorId (redirect), VPORT kind sub-routes (AUTH/OWNER) |
| Tests | 12 | barbershop (2), exchange (1), locksmith (1), menu (1), rates (1), subscribers (1), dal (1), model (2) |

## Route / Screen Map

| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| /profile/:actorId | screens/ActorProfileScreen.jsx | AUTH | Privacy gate client-side (VF-004 OPEN) |
| /actor/:actorId | screens/UsernameProfileRedirect.jsx | AUTH | Slug resolution; UUID not exposed (VF-001 RESOLVED) |
| VPORT kind screens (barbershop, locksmith, restaurant, gas, exchange) | kinds/vport/screens/ | AUTH + OWNER write surfaces | Profile display + owner write via assertActorOwns gate |
| VPORT booking screen | kinds/vport/screens/booking/ | AUTH | Consumer booking flow |
| VPORT menu screen | kinds/vport/screens/menu/ | AUTH + OWNER | Menu management — owner-gated writes |
| VPORT rates screen | kinds/vport/screens/rates/ | AUTH + OWNER | FX rates management |
| VPORT content pages | kinds/vport/screens/content/ | AUTH + OWNER (write) / PUBLIC (read) | Content page CMS |
| VPORT owner screen | kinds/vport/screens/owner/ | OWNER | Owner-only management view |

## Mutation Surface Map

| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| upsertVportServices.controller.js | kinds/vport/controller/services/ | UPDATE (vport services) | YES — assertActorOwnsVportActorController | MEDIUM |
| upsertVportRate.controller.js | kinds/vport/controller/rates/ | UPSERT (FX rates) | YES — assertActorOwnsVportActorController + full input validation | MEDIUM |
| locksmithOwner.controller.js (6 write paths) | kinds/vport/controller/locksmith/ | INSERT/UPDATE/DELETE (service areas, details, portfolio) | YES — RESOLVED 2026-06-02 (was S-BLK-001) | LOW |
| content page controllers (create/update/delete/toggle) | kinds/vport/controller/content/ | INSERT/UPDATE/DELETE (content_pages) | YES — assertActorOwnsVportActorController + row check | MEDIUM |
| publishExchangeRateUpdateAsPost | kinds/vport/controller/exchange/ | INSERT (posts + rate dedup) | YES — assertActorOwnsVportActorController | MEDIUM |
| publishBarbershop*/publishLocksmith* controllers | kinds/vport/controller/barbershop/, locksmith/ | INSERT (system posts) | YES — assertActorOwnsVportActorController | MEDIUM |
| menu save/delete controllers | kinds/vport/controller/menu/ | INSERT/UPDATE/DELETE (menu_categories, menu_items) | PARTIAL — not directly confirmed in all paths | MEDIUM |
| VportPortfolio.controller.js | kinds/vport/controller/portfolio/ | MEDIA_WRITE (portfolio items) | PARTIAL — ELEK-040 OPEN | HIGH |
| friends/saveTopFriendRanks.controller.js | controller/friends/ | WRITE (friend ranks) | NONE — no assertActorOwns; actorId caller-supplied | MEDIUM |
| checkActorOwnership.controller.js | controller/ | VALIDATION (hollow) | YES — but logic in DAL layer (VF-003 OPEN) | HIGH |

## Security-Sensitive Surface Map

| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| useProfileGate.js | hooks/ | PRIVACY | VF-004 (HIGH OPEN): privacy enforced entirely client-side; bypassable via devtools or direct API |
| checkActorOwnership.controller.js | controller/ | OWNERSHIP | VF-003 (HIGH OPEN): hollow controller; ownership logic in DAL layer |
| ActorProfileScreen.jsx (debug import) | screens/ | BUNDLE LEAK | VF-005 (HIGH OPEN): ActorProfileProdDebugPanel bundled in production build |
| fetchPostsForActor.dal.js | dal/ | GOD METHOD | SF-003 (MEDIUM OPEN): 262-line multi-schema DAL — single point of failure |
| social/privacy/dal/actorSignalVisibility.dal (direct import) | dal/readActorProfile.dal | BOUNDARY VIOLATION | Bypasses social adapter — direct cross-feature DAL import |
| vc.posts INSERT RLS (DR-001) | DB | DB_RLS | CRITICAL OPEN: any auth user can INSERT as any actor — pending migration |
| VportPortfolio.controller.js write path | kinds/vport/controller/portfolio/ | OWNERSHIP | ELEK-040 (HIGH OPEN): gate status unconfirmed |
| Ownership gate in booking feature | kinds/vport/controller/ (all writes) | COUPLING | All VPORT write auth depends on booking feature adapter — silent break risk |

## Audit / Ticket Evidence

| Item | Status | Updated |
|---|---|---|
| S-BLK-001 — locksmith gate missing (6 write paths) | RESOLVED 2026-06-02 | Branch: vport-booking-feed-security-updates |
| DR-001 CRITICAL — vc.posts INSERT RLS gap | OPEN — migration PENDING STAGING | 2026-05-23 |
| VF-003 (HIGH) — ownership logic in DAL | OPEN | 2026-05-22 |
| VF-004 (HIGH) — client-side privacy gate | OPEN | 2026-05-22 |
| VF-005 (HIGH) — debug component in production bundle | OPEN | 2026-05-22 |
| ELEK-040 (HIGH) — portfolio gate unconfirmed | OPEN | 2026-05-22 |
| SF-002 through SF-006 (HIGH to MEDIUM) | OPEN | 2026-05-22 |
| THOR: Code release CONDITIONAL PASS | CONDITIONAL | 2026-05-23 |
| BLACKWIDOW — NOT RUN this cycle | NOT RUN | — |
| SPIDER-MAN — BLOCKED | BLOCKED | — |
| ARCHITECT scan | COMPLETE | 2026-06-02 (ARCHITECT-PROFILES-0001) |

## Runtime Risk Summary

Profiles is the largest feature in the platform (362 source files, 51 controllers, 63 DALs, 69 hooks, 167 screens, 12 tests). The locksmith gate S-BLK-001 is now RESOLVED on the current branch (2026-06-02). Highest remaining risks: ELEK-040 (portfolio write gate OPEN), DR-001 (DB RLS gap on vc.posts — pending migration), VF-004 (client-side privacy gate bypassable), VF-005 (debug component in production bundle). A direct cross-feature DAL import from social (social/privacy/dal/) violates adapter boundaries. All VPORT write authorization is gated through a function owned by the booking feature adapter — a silent coupling risk.

## Recommended Next Command

ELEKTRA

## Recommended Next Ticket

ELEK-040 — confirm or add ownership gate in `VportPortfolio.controller.js`. Audit all portfolio write paths. Second priority: move `ActorProfileProdDebugPanel` import behind a dev-only conditional or to `debuggers/` (VF-005).
