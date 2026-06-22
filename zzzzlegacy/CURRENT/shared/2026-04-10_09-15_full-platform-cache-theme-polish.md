# Session Summary — full-platform-cache-theme-polish (2026-04-10)

## What was worked on
- **Legal consent system** — Built complete consent infrastructure (DAL, controller, compliance engine, re-consent gate, signup flow, audit evidence with IP/locale/user_agent). Built versioning + re-consent engine. Fixed legal document version rendering (hardcoded v1.0 → dynamic from DB). Splash bypass for legal routes.
- **Theme unification** — Created centralized `--vc-*` CSS custom property system. Migrated 15+ feature CSS files from blue to purple-neutral tokens. Fixed root tokens (surfaces, borders, text). Applied to login, register, legal, all screens. Swept 568 Tailwind blue classes to zero across all production code.
- **VPORT portfolio + photos** — Removed Portfolio from restaurant/default tabs. Replaced custom PortfolioDetailModal with Photos tab's ImageViewerModal. Fixed iOS stacking context trap. Rewrote ImageViewerModal for proper fullscreen/close behavior. Reaction strip conditional on post context.
- **17 TTL caches implemented** — Created shared `ttlCache.js` utility. Cached: actor kind (10min), actor profile RPC (30s), vport type (10min), vport public details (60s), vport services (60s), vport reviews (60s), vport menu (60s), portfolio (60s), subscriber counts (60s), gas prices (60s), exchange rates (60s), legal docs (5min), booking availability (5min), vibe tags (2min), vibe catalog (5min), follower count (60s). Wired shared hydration store into all 5 surfaces.
- **Infrastructure** — Skeleton components for 14+ screens. Logan reorganization (46 files renamed). Kanban queue system for TP. Stack rules doc. Production safety rules. Debug panel minimization. Dashboard/menu/notification polish. 5-surface read audit. Deep profiles review (291 files).

## Decisions made
- **Purple-neutral palette** — Root CSS tokens changed from blue rgba to purple-neutral. All screens unified.
- **TypeScript banned** — Documented in stack rules. Zero .ts/.tsx allowed.
- **No README.md in source** — Only logan/README.md. All docs in /logan/.
- **Legal content in JSX, metadata in DB** — Title/version rendered dynamically from DB via `?v=` param.
- **18+ age attestation** — Platform changed from 13+ to 18+.
- **iOS stacking context rule** — Never render position:fixed modals inside styled card containers. Use React fragments.
- **Avatar rule** — Square with rounded corners. `rounded-lg` (8px) for medium/small, `rounded-2xl` (16px) for large (64px+). Never circular.
- **Simple TTL cache over React Query** — `createTTLCache(ttlMs)` factory at controller/DAL level. Owner/edit modes bypass cache.
- **Kanban queue for TP** — 4-file system: incoming → ready → active → backlog.
- **Hydration store as single actor cache** — All 5 surfaces now wired to shared Zustand store with 5min TTL.

## Files changed

### New files
- `apps/VCSM/src/shared/lib/ttlCache.js`
- `apps/VCSM/src/shared/components/Skeleton.jsx`
- `apps/VCSM/src/features/legal/` (15 new files — full consent system)
- `apps/VCSM/src/features/auth/styles/authTheme.js`
- `apps/VCSM/src/features/auth/components/ConsentCheckbox.jsx`
- `apps/VCSM/src/app/routes/public/legal.routes.jsx`
- `db_snapshot/seeds/legal_documents_seed.sql`
- `planning/.tp-ready.md`, `planning/.tp-active.md`, `planning/.tp-backlog.md`
- `logan/platform/vcsm.platform.stack-rules.md`
- `logan/platform/vcsm.platform.read-optimization-plan.md`
- `logan/platform/vcsm.platform.cache-recommendations.md`
- `logan/platform/vcsm.platform.read-audit-5-surfaces.md`
- `logan/platform/vcsm.platform.nav-screens-read-cache-skeleton.md`
- `logan/platform/vcsm.platform.avatar-rules.md`
- `logan/legal/vcsm.legal.consent-system.md`
- `logan/vcsm/theme/vcsm.theme.design-tokens.md`
- `logan/vcsm/theme/vcsm.theme.splash-screen.md`

### Cache implementations (modified)
- `engines/hydration/src/hydrate.js` (store-first check)
- `apps/VCSM/src/features/profiles/dal/readActorProfile.dal.js` (30s)
- `apps/VCSM/src/features/profiles/dal/readActorKind.dal.js` (10min)
- `apps/VCSM/src/features/profiles/dal/readVportType.dal.js` (10min)
- `apps/VCSM/src/features/profiles/dal/tags/readActorVibeTags.dal.js` (2min/5min)
- `apps/VCSM/src/features/profiles/kinds/vport/controller/getVportPublicDetails.controller.js` (60s)
- `apps/VCSM/src/features/profiles/kinds/vport/controller/services/getVportServices.controller.js` (60s)
- `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/getVportActorMenu.controller.js` (60s)
- `apps/VCSM/src/features/profiles/kinds/vport/controller/portfolio/VportPortfolio.controller.js` (60s)
- `apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviews.read.dal.js` (60s)
- `apps/VCSM/src/features/profiles/kinds/vport/dal/subscribersCount.dal.js` (60s)
- `apps/VCSM/src/features/profiles/kinds/vport/dal/gas/vportFuelPrices.read.dal.js` (60s)
- `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js` (60s)
- `apps/VCSM/src/features/social/friend/subscribe/dal/subscriberCount.dal.js` (60s)
- `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js` (5min)
- `apps/VCSM/src/features/booking/controller/getResourceAvailability.controller.js` (5min)
- `apps/VCSM/src/features/notifications/inbox/dal/senders.read.dal.js` (hydration store)
- `apps/VCSM/src/features/profiles/controller/getProfileView.controller.js` (hydration store upsert)

### Theme unification (modified — 30+ CSS + 40+ JSX files)
- `apps/VCSM/src/styles/citizens-theme.css`, `global.css`
- All feature CSS: profiles, post, chat, explore, upload, settings, notifications, module, ios
- All sub-CSS: profiles-friends, profiles-booking, profiles-booking-daypanel, profiles-photos, profiles-portfolio
- Onboarding components, notification components, upload components
- 568 Tailwind blue class replacements across entire src/features/ and src/shared/

### UI polish (modified)
- `apps/VCSM/src/features/upload/ui/ActorPill.jsx`
- `apps/VCSM/src/features/upload/styles/upload-modern.css`
- `apps/VCSM/src/features/upload/ui/CaptionCard.jsx`
- `apps/VCSM/src/shared/components/ActorLink.jsx`
- `apps/VCSM/src/features/post/commentcard/components/cc/CommentHeader.jsx`
- `apps/VCSM/src/features/post/commentcard/ui/CommentCard.view.jsx`
- `apps/VCSM/src/features/profiles/screens/views/tabs/photos/components/ImageViewerModal.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/portfolio/view/VportPortfolioView.jsx`
- `apps/VCSM/src/features/profiles/config/profileTabs.config.js`
- `apps/VCSM/src/features/notifications/types/components/NotificationCard.jsx` + 14 type items
- `apps/VCSM/src/features/dashboard/vport/screens/components/VportBackButton.jsx`
- `apps/VCSM/src/features/dashboard/vport/screens/model/vportDashboardShellStyles.js`
- `apps/VCSM/src/features/public/vportMenu/view/VportPublicMenuView.jsx`
- `debuggers/identity/IdentityDebugPanel.jsx`
- `apps/VCSM/index.html` (splash bypass, jsconfig fixes)
- `CLAUDE.md` (production safety rules)
- `.claude/commands/TP.md` (Kanban queue system)

### Logan documentation (46 renamed + 10 new + 5 drift fixes + multiple updates)

## Problems solved
- **No consent tracking** → Full system built from scratch
- **Blue theme everywhere** → Root tokens + 568 Tailwind classes fixed to purple-neutral
- **Legal version hardcoded** → Dynamic from DB via `?v=` param
- **Portfolio viewer trapped on iOS** → Fragment rendering, not inside card container
- **ImageViewerModal close button broken on iOS** → Own overlay layer with onTouchEnd
- **Upload ActorPill invisible** → `::before` gradient overlay covering content, fixed z-index
- **Notification View buttons** → Removed, entire card now clickable
- **Debug panel blocking screen** → IdentityDebugPanel starts minimized
- **5 surfaces bypassing actor cache** → All wired to shared hydration store
- **17 uncached read paths** → All now have TTL caches
- **Avatar inconsistency** → Standardized to rounded-lg (medium) / rounded-2xl (large)
- **3 logan content drift items** → Fixed (chat legacy, explore blocks, pipeline map reviews)
- **46 logan files with bad names** → All renamed to domain.system.topic.md
- **10 scattered .md files in src/** → Removed
- **Menu page no banner** → Added banner with card stacking overlay

## Open items
- **DB seed not run** — `legal_documents_seed.sql` needs execution for consent gate
- **`platform.current_user_consents` view** — Unknown if exists
- **CAPTAIN order: Migrate reads from old vc vertical detail tables to new vport schema** — Captured in 10-06.md
- **7 files with blue/cyan/sky hardcoded colors in profiles** — SubscribeButton, ServiceBadge, RateCard, RatesView, PrivateProfileGate, ActorProfileHeader, VportProfileTabs
- **Posts not cached** — Intentional (changes frequently, pull-to-refresh handles)
- **Friend ranks/lists not cached** — Intentional (derived from follow graph)
- **Remaining Tier 2 caches** — Feed pages, inbox list, notification list, settings data, block sets

## Context for next session
The VCSM app now has 17 TTL caches covering all profile reads (citizen + VPORT), legal docs, booking, and the shared actor hydration store wired into all 5 high-traffic surfaces. The Kanban queue system is active (incoming/ready/active/backlog). A CAPTAIN order exists in `10-06.md` for migrating reads from old `vc.vport_*` vertical detail tables to new `vport.*` schema tables — this is the next planned work. The DB seed for legal documents still needs to be run. Logan documentation is fully reorganized with 10 new docs created this session. Avatar rules are documented: `rounded-lg` for medium/small, `rounded-2xl` for large (64px+), never circular.
