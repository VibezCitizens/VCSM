# VCSM Full Architecture Review — 2026-06-07

**Review ID:** VCSM-FULL-ARCHITECTURE-REVIEW-001
**Scope:** apps/VCSM/src + apps/scanner
**Type:** Read-only source-verified audit
**Status:** COMPLETE

---

## 1. Executive Verdict

| Dimension | Grade |
|---|---|
| Overall Architecture Grade | C+ |
| Cleanliness Grade | B- |
| Modularity Grade | C |
| Production Risk Grade | HIGH |

The VCSM codebase demonstrates genuine architectural intent — the adapter-boundary system, engine extraction pattern, and layered DAL/controller/hook/screen build order are well-conceived and largely respected across most features. Nine engines have been cleanly extracted (booking, chat, hydration, i18n, identity, media, notifications, portfolio, reviews), the dashboard-to-vportDashboard split was completed, and recent security sprints have made measurable progress on booking and notification hardening. However the codebase currently carries 442 confirmed boundary violations (across 7 violation types), 8 features with DRIFT or NEEDS_REORG grades, 18 BEHAVIOR_WITHOUT_ENFORCEMENT documentation findings, 28 features with no monitoring instrumentation, and 5 missing features from the scanner's awareness. The most systemic risks are the notifications/profiles/social circular dependency cluster (15 bidirectional pairs, 124 total cycles), the booking authorization defects (CRITICAL, open in finding-map), and the auth feature importing directly from the app layer. The codebase is architecturally sound in design but accumulating execution drift that requires disciplined triage before the next major release gate.

---

## 2. Top 20 Findings

| # | Severity | Title | Path | Evidence | Impact | Priority | Recommended Ticket |
|---|---|---|---|---|---|---|---|
| F-001 | CRITICAL | Booking state machine has no owner_actor_id scope on update | `features/booking/controller/` | VEN-BOOKING-001, TICKET-BOOKING-RPC-001 confirmed on live DB | Any authenticated user can update any booking record | **P0 — DONE 2026-06-07** | TICKET-ARCH-BOOKING-RPC-001 |
| F-002 | CRITICAL | moderation reporter_actor_id is fully caller-supplied | `features/moderation/controllers/report.controller.js` | BW-MOD-001: no session binding on reporter_actor_id or actor_id | Any user can file reports as any actor or target any actor | **P0 — DONE 2026-06-07** | TICKET-ARCH-MODERATION-IDOR-001 + TICKET-MODERATION-REPORTER-PARAM-CLEANUP-001 |
| F-003 | CRITICAL | notifications caller-controlled fields without session binding | `features/notifications/` | BW-NOTI-001, VEN-NOTIFICATIONS-002 — THOR Release Blocker | Notification spam/spoofing across actor boundaries | **P0 — DONE 2026-06-07** | TICKET-ARCH-NOTI-SESSION-001 (app-layer) + TICKET-ARCH-NOTI-SESSION-001-DB (DB trigger) |
| F-004 | CRITICAL | settings controller bypasses social DAL boundary directly | `features/settings/vports/controller/vportSocialSettings.controller.js:6-7` | `import { ... } from '@/features/social/privacy/dal/actorSocialSettings.dal'` — production code | Bypasses social feature's RLS and adapter contract | **P0 — DONE 2026-06-07** | TICKET-ARCH-SETTINGS-DAL-BYPASS-001 |
| F-005 | HIGH | wanders hook imports controller directly (no adapter) | `features/wanders/core/hooks/useWandersBusinessCardOps.js:1` | `import { submitVportBusinessCardLeadController } from '@/features/public/vportBusinessCard/controller/vportBusinessCard.controller'` | Couples wanders directly to public internals; any refactor breaks silently | P1 | TICKET-ARCH-WANDERS-BOUNDARY-001 |
| F-006 | HIGH | AuthProvider imports feature DAL directly (3 violations) | `apps/VCSM/src/app/providers/AuthProvider.jsx:9-12` | `import { dalSignOut } from '@/features/auth/dal/login.dal'`; `dalRegisterRecoveryPermit` from resetPasswordSecure.dal; `dalHydrateAuthSession` from authSession.read.dal | App layer hardwired to auth DAL — impossible to swap or test in isolation | **P1 — DONE 2026-06-07** | TICKET-ARCH-AUTHPROVIDER-DAL-001 |
| F-007 | HIGH | notifications/profiles/social circular dependency cluster | `features/notifications`, `features/profiles`, `features/social` | 15 bidirectional pairs; triangle cycles: notifications↔profiles↔media↔notifications, booking↔notifications↔profiles↔booking | Any breaking change in any node cascades across the entire cluster | P1 | TICKET-ARCH-CIRCULAR-DEPS-001 |
| F-008 | HIGH | identity is depended on by 28 consumers — single point of failure | `features/identity/` (engine + feature combined) | engine-candidates.json: 28 consumers; any identity API change requires 28 coordinated updates | Release velocity blocked by identity API stability requirement | P1 | TICKET-ARCH-IDENTITY-SPOF-001 |
| F-009 | HIGH | scanner feature-map has 5 missing VCSM features | `apps/scanner/maps/feature-map.json` | flyerBuilder, initiation, qrcode, shell, vportDashboard absent; dashboard ghost entry with 258 files attributed to nonexistent path | All scanner-derived security and governance reports for these features are missing | **P1 — DONE 2026-06-07** | TICKET-ARCH-SCANNER-DRIFT-001 |
| F-010 | HIGH | 5 hooks import directly from app/providers/AuthProvider in settings | `features/settings/` (vports/hooks/, privacy/hooks/, account/hooks/, profile/hooks/) | `import { useAuth } from '@/app/providers/AuthProvider'` — 5 files confirmed | Violates feature/app boundary; auth contract changes break settings silently | P1 | TICKET-ARCH-SETTINGS-APP-LAYER-001 |
| F-011 | HIGH | profiles DAL imports cross-feature adapter (inverted layer order) | `features/profiles/dal/readActorProfile.dal.js:3` | `import { getActorPrivacyAdapter } from '@/features/social/adapters/privacy/actorPrivacy.adapter'` | DAL calling cross-feature adapter violates build order; DAL must only call supabase | P1 | TICKET-ARCH-PROFILES-DAL-INVERSION-001 |
| F-012 | HIGH | 25 features have controllers and DAL but zero monitoring | Multiple features | monitoring audit: auth, upload, moderation, vportDashboard, vport, post, social, notifications, profiles, feed, settings, block, chat, explore, flyerBuilder, media, public, actors, ads, initiation, invite, join, legal, professional, wanderex | Production errors in write paths are invisible | **P1 — PARTIAL 2026-06-07** (auth/upload/moderation P1 done; 22 features remain) | TICKET-ARCH-MONITORING-GAPS-001 |
| F-013 | MEDIUM | 12 state/actors direct imports bypass actor adapter | `features/settings`, `features/chat`, `features/vport`, `features/social`, `features/feed`, `features/profiles` | `import { useActorSummary } from '@/state/actors/useActorSummary'` — 12 files | State layer imported directly instead of through declared adapter surface | P2 | TICKET-ARCH-STATE-ACTOR-BYPASS-001 |
| F-014 | MEDIUM | shared/ imports from features/ (inverted dependency direction) | `shared/components/PublicNavbar.jsx`, `shared/hooks/useOneSignalPush.js` | `import { useIdentity } from '@/features/identity/adapters/identity.adapter'` | shared/ must never depend on features/; circular coupling risk | P2 | TICKET-ARCH-SHARED-FEATURE-COUPLING-001 |
| F-015 | MEDIUM | 445 ENFORCEMENT_WITHOUT_BEHAVIOR_DOC findings | Scanner documentation-drift-map | profiles/kinds (139), wanders/core (52), social/friend (28), post/postcard (28) — top contributors | Security and behavior audits unreliable for undocumented behaviors | P2 | TICKET-ARCH-BEHAVIOR-DOC-DEBT-001 |
| F-016 | MEDIUM | vportDashboard.dal/booking adapter leaks DAL function | `features/booking/adapters/booking.adapter.js:22` | `getActorByIdDAL` re-exported with self-authorized §5.3 exception comment — no traceable governance doc | Consumers receive raw DAL symbol through adapter boundary | P2 | TICKET-ARCH-BOOKING-ADAPTER-DAL-LEAK-001 |
| F-017 | MEDIUM | dual controller folder naming (controller/ vs controllers/) across 14 features | `features/auth`, `features/booking`, `features/chat`, `features/explore`, `features/identity`, `features/initiation`, `features/invite`, `features/join`, `features/legal`, `features/media`, `features/moderation` (uses controllers/), `features/notifications`, `features/profiles`, `features/vport` | Layer folder named `controller/` (singular) vs platform convention `controllers/` (plural) | Tooling, grep patterns, and new contributor understanding affected | P3 | TICKET-ARCH-NAMING-CONVENTION-001 |
| F-018 | MEDIUM | monitoring service has 3 duplicate files between app/ and services/ | `app/monitoring/monitoring.js`, `app/monitoring/monitoringClient.js`, `app/monitoring/vcsmMonitoring.js` also exist at `services/monitoring/` | Both paths confirmed on disk — two simultaneous monitoring directories | Risk of consumers importing from wrong path; divergence over time | P2 | TICKET-ARCH-MONITORING-DUPE-001 |
| F-019 | MEDIUM | 8 dashboard behaviors declared with no enforcement code | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/*/BEHAVIOR.md` | BEHAVIOR_WITHOUT_ENFORCEMENT for dashboard/calendar, dashboard/exchange, dashboard/locksmith, dashboard/qrcode, dashboard/reviews, dashboard/services, dashboard/shared, dashboard/vportOwnerStats | Dead governance docs create false security assurance | P2 | TICKET-ARCH-DASHBOARD-GHOST-DOCS-001 |
| F-020 | LOW | debug feature misplaced inside features/ | `features/debug/` | loginDebug.helpers.js and loginDebug.store.js both marked DEPRECATED; LoginDebugPanel.jsx never mounted anywhere; debugger architecture rule requires zNOTFORPRODUCTION/debuggers/ | Dead code misleads future developers; violates debugger placement contract | P3 | TICKET-ARCH-DEBUG-MISPLACEMENT-001 |

---

### F-001 CRITICAL — Booking State Machine No Owner Scope on Update

- **Path:** `apps/VCSM/src/features/booking/controller/`
- **Evidence:** VEN-BOOKING-001 through VEN-BOOKING-010 confirmed open in finding-map. TICKET-BOOKING-RPC-001: customer_actor_id is caller-injected with no session binding; updateBookingStatusDAL has no owner scope confirmed on live DB.
- **Impact:** Any authenticated user can update any booking record by knowing the booking ID. Full state machine accessible without enforced actor ownership.
- **Priority:** P0
- **Recommended Ticket:** TICKET-ARCH-BOOKING-RPC-001 — Replace broad booking INSERT/UPDATE with typed state-machine RPCs; bind customer_actor_id to session at DB layer.

---

### F-002 CRITICAL — Moderation Reporter IDOR

- **Path:** `apps/VCSM/src/features/moderation/controllers/report.controller.js`
- **Evidence:** BW-MOD-001 (finding-map, status OPEN): "reporter_actor_id and actor_id on moderation reports are fully caller-supplied with no session binding."
- **Impact:** Any authenticated user can file reports as any actor or target any actor. Trust and safety system is compromised.
- **Priority:** P0
- **Recommended Ticket:** TICKET-ARCH-MODERATION-IDOR-001 — Bind reporter_actor_id to session actor at controller or RPC layer; validate target actor_id ownership.

---

### F-003 CRITICAL — Notifications Caller-Controlled Fields Without Session Binding

- **Path:** `apps/VCSM/src/features/notifications/`
- **Evidence:** BW-NOTI-001, VEN-NOTIFICATIONS-002, BW-NOTI-004, BW-NOTI-010 all OPEN in finding-map. Confirmed THOR Release Blocker.
- **Impact:** Notification spam and cross-actor spoofing possible without session validation.
- **Priority:** P0
- **Recommended Ticket:** TICKET-ARCH-NOTI-SESSION-001 — Session-bind all notification write fields; add ownership assertion before any notification emit.

---

### F-004 CRITICAL — Settings Controller Bypasses Social DAL Boundary

- **Path:** `apps/VCSM/src/features/settings/vports/controller/vportSocialSettings.controller.js:6-7`
- **Evidence:** `import { invalidateActorSocialPublicPolicyCache } from '@/features/social/privacy/dal/actorSocialPublicPolicy.dal'` — confirmed production code, not a test.
- **Impact:** settings bypasses social's RLS and adapter contract; social feature's public API is circumvented; any refactor of social DAL silently breaks settings.
- **Priority:** P0
- **Recommended Ticket:** TICKET-ARCH-SETTINGS-DAL-BYPASS-001 — Route through social.adapter.js; add cache invalidation to social's public adapter surface.

---

### F-005 HIGH — Wanders Hook Imports Public Controller Directly

- **Path:** `apps/VCSM/src/features/wanders/core/hooks/useWandersBusinessCardOps.js:1`
- **Evidence:** `import { submitVportBusinessCardLeadController } from '@/features/public/vportBusinessCard/controller/vportBusinessCard.controller'`
- **Impact:** Couples wanders directly to public internals; bypasses public adapter boundary; any refactor of the public controller breaks wanders silently.
- **Priority:** P1
- **Recommended Ticket:** TICKET-ARCH-WANDERS-BOUNDARY-001 — Route through `@/features/public/adapters/vportMenu.adapter.js` or extend the public adapter surface.

---

### F-006 HIGH — AuthProvider Imports Auth DAL Directly

- **Path:** `apps/VCSM/src/app/providers/AuthProvider.jsx:9-12`
- **Evidence:** Three confirmed imports: `import { dalSignOut } from '@/features/auth/dal/login.dal'`; `import { dalRegisterRecoveryPermit } from '@/features/auth/dal/resetPasswordSecure.dal'`; `import { dalHydrateAuthSession, dalSubscribeAuthStateChange } from '@/features/auth/dal/authSession.read.dal'`
- **Impact:** App layer is hardwired to auth DAL implementation; impossible to swap auth implementation without changing both layers; no testability boundary.
- **Priority:** P1
- **Recommended Ticket:** TICKET-ARCH-AUTHPROVIDER-DAL-001 — Expose needed functions through auth.adapter.js; import from adapter in AuthProvider.

---

### F-007 HIGH — Notifications/Profiles/Social Circular Dependency Cluster

- **Path:** `features/notifications`, `features/profiles`, `features/social`, `features/post`, `features/feed`
- **Evidence:** Dependency map: 15 bidirectional pairs confirmed. Triangle cycles: notifications→profiles→media→notifications; booking→notifications→profiles→booking; feed→profiles→social→feed. Total cycles in graph: 124.
- **Impact:** Any breaking change in any cluster node cascades across the entire dependency graph. Tree-shaking and lazy-loading cannot cleanly split these modules.
- **Priority:** P1
- **Recommended Ticket:** TICKET-ARCH-CIRCULAR-DEPS-001 — Map all cycle entry points; extract shared event types or emit patterns to break notification→profiles and profiles→social cycles.

---

### F-008 HIGH — Identity Engine Single Point of Failure (28 Consumers)

- **Path:** `engines/identity/`, `features/identity/`
- **Evidence:** engine-candidates.json: identity has 28 confirmed consumers spanning 20 VCSM features plus Wentrex auth/communication/identity/learning.
- **Impact:** Any breaking change to the identity engine or its adapter requires coordinated updates across 28 import sites. Release velocity is blocked by identity API stability.
- **Priority:** P1
- **Recommended Ticket:** TICKET-ARCH-IDENTITY-SPOF-001 — Implement versioned identity adapter contract; add breaking-change detection tests; document identity API surface formally.

---

### F-009 HIGH — Scanner Feature Map Missing 5 Active VCSM Features

- **Path:** `apps/scanner/maps/feature-map.json`
- **Evidence:** flyerBuilder (adapters/components/controller/dal/designStudio exist), initiation (adapters/components/controller/dal/hooks exist), qrcode (adapters/components/9 files), shell (adapters/modules/7 files), vportDashboard (~199 source files across adapters/components/controller/dal/dashboard/cards) — all absent from scanner output. Ghost entry `dashboard` reports 258 files at a path that does not exist on disk.
- **Impact:** All scanner-derived security findings, documentation drift reports, dead export analysis, and governance maps for these 5 features are missing. vportDashboard alone has ~199 files of invisible coverage.
- **Priority:** P1
- **Recommended Ticket:** TICKET-ARCH-SCANNER-DRIFT-001 — Re-run scanner; update feature-map; remove ghost entries; verify all 36 features are discovered.

---

### F-010 HIGH — Settings Feature Imports App Layer Directly (5 Violations)

- **Path:** `features/settings/vports/hooks/useVportsController.js`, `useVportsList.js`, `account/hooks/useAccountController.js`, `privacy/hooks/useActorPrivacy.js`, `profile/hooks/useProfileController.js`
- **Evidence:** All 5 files confirmed to import `useAuth` from `@/app/providers/AuthProvider`.
- **Impact:** Features must not import from the app layer. Auth contract changes silently break settings hooks.
- **Priority:** P1
- **Recommended Ticket:** TICKET-ARCH-SETTINGS-APP-LAYER-001 — Replace `useAuth` from app with `useIdentity` from identity adapter; remove all app/ imports from features/.

---

### F-011 HIGH — Profiles DAL Imports Cross-Feature Adapter (Inverted Layer)

- **Path:** `apps/VCSM/src/features/profiles/dal/readActorProfile.dal.js:3`
- **Evidence:** `import { getActorPrivacyAdapter } from '@/features/social/adapters/privacy/actorPrivacy.adapter'`
- **Impact:** DAL layer is the lowest-trust data layer and must only call supabase/services. A DAL importing a cross-feature adapter creates an inverted dependency that cannot be resolved by the standard layering rules.
- **Priority:** P1
- **Recommended Ticket:** TICKET-ARCH-PROFILES-DAL-INVERSION-001 — Lift privacy resolution into a controller; DAL should receive resolved privacy settings as a parameter or call supabase directly.

---

### F-012 HIGH — 25 Features With Write Paths and Zero Monitoring

- **Path:** Multiple features (see Monitoring Placement Map section)
- **Evidence:** Monitoring audit confirmed: only booking and identity/state layer have `captureVcsmError` instrumentation. 25 features have controllers + DAL with no monitoring calls.
- **Impact:** Production errors in auth (login, register, reset), upload (post creation), moderation (reports, visibility), vportDashboard (bookings, leads, schedule), and other write paths are invisible in production.
- **Priority:** P1 (auth, upload, moderation); P2 (remainder)
- **Recommended Ticket:** TICKET-ARCH-MONITORING-GAPS-001 — Instrument auth, upload, moderation, vportDashboard in priority order.

---

### F-013 MEDIUM — 12 State/Actors Direct Imports Bypass Actor Adapter

- **Path:** `features/settings`, `features/chat`, `features/vport`, `features/social`, `features/feed`, `features/profiles`
- **Evidence:** 12 confirmed `import { useActorSummary } from '@/state/actors/useActorSummary'` imports across features (PendingFollowRequests.jsx, BlockedUsersSimple.jsx, UserLookup.jsx, useAccountController.js, BlockedUsersScreen.jsx, RestoreVportScreen.jsx, useIncomingFollowRequests.js, useSubscribeAction.js, useCentralFeed.js, TopFriendsRankEditor.jsx, RankPickerModal.jsx). Plus `hydrateActorsFromRows` from `@/state/actors/hydrateActors` in 2 files.
- **Impact:** Actor state layer accessed directly without adapter mediation; refactoring actor state shape requires hunting 12 import sites across unrelated features.
- **Priority:** P2
- **Recommended Ticket:** TICKET-ARCH-STATE-ACTOR-BYPASS-001 — Create actors.adapter.js or extend existing actors adapter; route all cross-feature actor state access through it.

---

### F-014 MEDIUM — Shared Layer Imports From Features (Inverted Dependency)

- **Path:** `apps/VCSM/src/shared/components/PublicNavbar.jsx:3`, `apps/VCSM/src/shared/hooks/useOneSignalPush.js:20`, `apps/VCSM/src/shared/components/components/ActorActionsMenu.jsx:3`
- **Evidence:** `import { useIdentity } from '@/features/identity/adapters/identity.adapter'` in two shared files; `export { default } from '@/features/block/adapters/ui/ActorActionsMenu'` in ActorActionsMenu.jsx.
- **Impact:** shared/ must never depend on features/. This creates an upward coupling that prevents shared/ from being used independently; any identity or block change can break shared components.
- **Priority:** P2
- **Recommended Ticket:** TICKET-ARCH-SHARED-FEATURE-COUPLING-001 — Move PublicNavbar to features/public/ or app/; move useOneSignalPush to services/onesignal/; delete ActorActionsMenu shim from shared/.

---

### F-015 MEDIUM — 445 Behaviors With Code But No BEHAVIOR.md

- **Path:** Scanner documentation-drift-map
- **Evidence:** 445 ENFORCEMENT_WITHOUT_BEHAVIOR_DOC findings. Top: profiles/kinds (139 behaviors), wanders/core (52), social/friend (28), post/postcard (28), settings/vports (25), chat/inbox (25).
- **Impact:** Security and behavior audits for these modules cannot be completed. VENOM, ELEKTRA, and SPIDER-MAN scans over undocumented behaviors have no ground truth to compare against.
- **Priority:** P2
- **Recommended Ticket:** TICKET-ARCH-BEHAVIOR-DOC-DEBT-001 — Priority order: profiles/kinds, social/friend, post/postcard, settings/vports, chat/inbox.

---

### F-016 MEDIUM — Booking Adapter Leaks DAL Function With Self-Authorized Exception

- **Path:** `apps/VCSM/src/features/booking/adapters/booking.adapter.js:22`
- **Evidence:** `getActorByIdDAL` exported with inline comment `§5.3 exception` — no §5.3 section found in any governance document in ZZnotforproduction/CONTRACTS/.
- **Impact:** DAL function name leaks through adapter boundary to consumers; adapter contract states "Adapters never export DAL functions, models, or controllers."
- **Priority:** P2
- **Recommended Ticket:** TICKET-ARCH-BOOKING-ADAPTER-DAL-LEAK-001 — Wrap in a controller function; export the controller; trace and update the 9 call sites in dashboard controllers.

---

### F-017 MEDIUM — Dual controller/ vs controllers/ Naming Across 14 Features

- **Path:** Multiple features — confirmed singular in: auth, booking, chat, explore, identity, initiation, invite, join, legal, media, notifications, profiles, vport; plural in: moderation, settings
- **Evidence:** Direct directory listing confirmed controller/ (singular) as layer folder in 13+ features; controllers/ (plural) in at least 2.
- **Impact:** Grep patterns, tooling, and new contributor orientation affected; scanner path heuristics may miss some files.
- **Priority:** P3
- **Recommended Ticket:** TICKET-ARCH-NAMING-CONVENTION-001 — Standardize on controllers/ (plural) across all features; update scanner alias config.

---

### F-018 MEDIUM — Monitoring Files Duplicated Across Two Directories

- **Path:** `apps/VCSM/src/app/monitoring/` and `apps/VCSM/src/services/monitoring/`
- **Evidence:** Both directories confirmed on disk. Files monitoring.js, monitoringClient.js, vcsmMonitoring.js exist in both paths. Cleanup verification confirms both paths remain active.
- **Impact:** Consumers may import from either path; divergence over time if files are updated in one location but not the other.
- **Priority:** P2
- **Recommended Ticket:** TICKET-ARCH-MONITORING-DUPE-001 — Canonicalize to services/monitoring/; delete app/monitoring/ copies; update all import sites.

---

### F-019 MEDIUM — 8 Dashboard Behaviors Documented With No Enforcement Code

- **Path:** `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/*/BEHAVIOR.md`
- **Evidence:** Documentation drift scanner: BEHAVIOR_WITHOUT_ENFORCEMENT for dashboard/calendar, dashboard/exchange, dashboard/locksmith, dashboard/qrcode, dashboard/reviews, dashboard/services, dashboard/shared, dashboard/vportOwnerStats.
- **Impact:** Governance documents declare behaviors with no code behind them. Security reviews of these modules treat the BEHAVIOR.md as ground truth — if no code enforces these behaviors, the security posture is falsely documented.
- **Priority:** P2
- **Recommended Ticket:** TICKET-ARCH-DASHBOARD-GHOST-DOCS-001 — Audit each module: either confirm code exists (scanner missed it due to stale feature-map) or mark docs as PLANNED/NOT_IMPLEMENTED.

---

### F-020 LOW — Debug Feature Misplaced in features/

- **Path:** `apps/VCSM/src/features/debug/`
- **Evidence:** loginDebug.helpers.js and loginDebug.store.js marked `// DEPRECATED`. LoginDebugPanel.jsx confirmed to have no import references outside its own folder. Debugger placement rule requires `zNOTFORPRODUCTION/debuggers/[feature]/`.
- **Impact:** Dead code in production feature tree; violates debugger placement contract.
- **Priority:** P3
- **Recommended Ticket:** TICKET-ARCH-DEBUG-MISPLACEMENT-001 — Delete loginDebug.helpers.js and loginDebug.store.js; move or delete LoginDebugPanel.jsx; remove features/debug/ folder.

---

## 3. Folder Structure Assessment

| Folder | Assessment | Notes |
|---|---|---|
| `app/` | MOSTLY_CLEAN | Well-structured: guards, layout, providers, monitoring, platform, routes all organized. Issues: AuthProvider imports feature DAL directly (F-006); 3 app-layer imports from feature screens (auth:LoginScreen, feed:CentralFeedScreen, legal:useLegalConsent); duplicate monitoring files in app/monitoring/ (F-018); empty app/errors/ directory. The iOS platform sub-system (10 files) is well-isolated. |
| `features/` | DRIFT | 36 features, mixed quality. 16 CLEAN or MOSTLY_CLEAN; 8 DRIFT or NEEDS_REORG (debug, explore, hydration, initiation, professional, reviews, vgrid, wanderex). 442 total boundary violations. Circular dependency cluster in notifications/profiles/social is the highest systemic risk. Most adapters exist but quality varies widely. |
| `shared/` | DRIFT | 14 structural flags identified. Three wrong-direction imports (shared importing from features/). Feature-specific files in shared/lib/ (businessCard model, vportDashboard model, resolveVportProfileId with Supabase call). PublicNavbar/TopNav are app-shell specific, not truly shared. iosProdDebugger belongs in src/dev/. Double-nested components/components/ folder is a structural smell. |
| `state/` | MOSTLY_CLEAN | 21 files, well-organized into actors/, identity/, social/. One boundary violation: identitySelfHeal.controller.js imports from features/identity/adapters/ (inverted direction — state should not import from features). Identity state layer is the most comprehensively instrumented with monitoring. |
| `services/` | MOSTLY_CLEAN | Well-organized into cloudflare/, monitoring/, onesignal/, supabase/. Three-layer monitoring design (Sentry + two edge-function transports) is coherent. Duplicate of monitoring files in app/monitoring/ is a consolidation gap. One console.error violation in uploadToCloudflare.js. Supabase client is HMR-safe singleton. OneSignal SDK init is well-guarded (SSR, double-init, XSS race). |
| `learning/` | MOSTLY_CLEAN (FROZEN) | 176 files, full layer stack present, adapter boundary well-formed. Two structural defects: nested duplicate shim directories in components/common/ (5 domains), root-level screen shim. No i18n namespace for learning module. FROZEN per DOCS-ORG-001 — no changes permitted without unfreeze. |
| `i18n/` | CLEAN | 13 namespaces in en/ and es/ covering all active feature domains. setup.js is standard. No learning namespace (gap, but module is frozen). |
| `platform/` | CLEAN | 3 files, all i18n sub-feature only (LocaleSwitcher, VcsmI18nProvider, useLocale). Correctly scoped. |
| `bootstrap/` | CLEAN | 4 files, minimal and cohesive. Polling intervals, cache invalidation, hydration trigger, and selectors are well-organized. No feature coupling found. |
| `queries/` | CLEAN | 2 files: queryClient.js (minimal, no config override — note: no defaultOptions/retry/error handler is a gap for production resilience) and queryKeys.js (24 centralized key factories — good governance). |
| `season/` | MOSTLY_CLEAN | 3 files. Note: ChristmasTheme active dates are November 1-7 (not December) — likely a copy-paste error in the date range logic given the "christmas" label. Low impact but incorrect semantics. |
| `scripts/` | INFO | 3 load-test scripts (simulateAppUsers.mjs, simulateAuthenticatedActors.mjs, index.js). Not app code. Should be excluded from any production bundle via .gitignore or explicit build exclusion. |
| `assets/` | INFO | Not audited in detail. Assumed static asset folder. |
| `dev/` | MOSTLY_CLEAN | Diagnostics panel system (groups/, ui/, DiagnosticsPanel). Has 6 dead exports per scanner. profilesKindsFeature.group.js has a TODO DTAB-001 marker for updating vportTypeRegistry import. |
| `debuggers-stub/` | NEEDS_REORG | 8 entries at app root (actor-switch/, cycle.js, feed/, global/, identity/, media/, performance/, shared/). 104 dead exports per scanner (45 in performance/index.js alone). Role relative to canonical zNOTFORPRODUCTION/debuggers/ is unclear — may be shadowing or stale. |
| `screens/` (root) | NEEDS_REORG | Only 1 file: DevDiagnosticsScreen.jsx. Orphan screen outside the features tree. Should move to dev/ or features/debug/. |
| `styles/` (root) | INFO | 2 files: global.css, citizens-theme.css. Global CSS files — appropriate at src root. No violations. |

---

## 4. Feature-by-Feature Matrix

| Feature | Files | Adapter | Controllers | DAL | Hooks | Screens | Cross-Feature Imports | UI→DAL Bypass | Split Candidate | Grade |
|---|---|---|---|---|---|---|---|---|---|---|
| actors | 4 | YES | YES | YES | NO | NO | NONE | NO | NO | CLEAN |
| ads | 18 | YES (thin) | NO | YES | YES | YES | CLEAN (via adapters) | NO | NO | MOSTLY_CLEAN |
| auth | 65 | YES | YES | YES | YES | YES | 1 violation: wanders sub-path adapter; 3 app-layer imports | NO | NO | MOSTLY_CLEAN |
| block | 18 | YES | YES | YES | YES | NO | NONE | NO | NO | MOSTLY_CLEAN |
| booking | 68 | YES | YES | YES | YES | NO | CLEAN (via adapters) | NO | NO | MOSTLY_CLEAN |
| chat | 67 | YES (thin) | NO | YES | YES | YES | 1 app-layer import (ios platform) | NO | NO | MOSTLY_CLEAN |
| debug | 3 | NO | NO | NO | NO | NO | NONE | NO | NO | DRIFT |
| explore | 23 | NO | YES | YES | YES | YES | CLEAN (via adapters) | NO | NO | DRIFT |
| feed | 46 | YES | YES | YES | YES | YES | 1 app-layer import (useAuth) | NO | NO | MOSTLY_CLEAN |
| flyerBuilder | 54 | YES | YES | YES | YES | YES | CLEAN (via adapters) | NO | NO | MOSTLY_CLEAN |
| hydration | 2 | NO | NO | NO | NO | NO | 3 @/state/identity bypasses | NO | NO | NEEDS_REORG |
| identity | 10 | YES | YES | YES | YES | NO | NONE | NO | NO | MOSTLY_CLEAN |
| initiation | 18 | YES | YES | YES | YES | YES | CLEAN (via adapters) | NO | NO | MOSTLY_CLEAN |
| invite | 6 | NO | YES | YES | YES | YES | CLEAN (via adapters) | NO | NO | MOSTLY_CLEAN |
| join | 12 | NO | YES | YES | YES | YES | CLEAN (via adapters) | NO | NO | MOSTLY_CLEAN |
| legal | 27 | YES | YES | YES | YES | YES | 1 app-layer import (useAuth) | NO | NO | MOSTLY_CLEAN |
| media | 9 | YES | YES | YES | NO | NO | NONE | NO | NO | MOSTLY_CLEAN |
| moderation | 35 | YES | YES | YES | YES | NO | NONE | NO | NO | MOSTLY_CLEAN |
| notifications | 46 | YES | YES | YES | YES | YES | 2 cross-feature deep-path adapters | NO | NO | MOSTLY_CLEAN |
| onboarding | GHOST | — | — | — | — | — | — | — | — | N/A |
| portfolio | 2 | YES | NO | NO | NO | NO | NONE | NO | NO | MOSTLY_CLEAN |
| post | 126 | YES | YES | YES | YES | YES | CLEAN (via adapters) | NO | YES (already split-ready) | MOSTLY_CLEAN |
| professional | 33 | NO | YES | YES | YES | YES | 3 Card.adapter from settings | NO | NO | DRIFT |
| profiles | 383 | YES | YES | YES | YES | YES | 40 violations (booking model bypass, social DAL bypass, upload via adapter) | NO | YES (383 files, kinds/vport alone 256) | MOSTLY_CLEAN |
| public | 63 | YES | YES | YES | YES | YES | CLEAN (via adapters) | NO | NO | MOSTLY_CLEAN |
| qrcode | 9 | YES | NO | NO | NO | NO | NONE | NO | NO | CLEAN |
| reviews | 1 | NO | NO | NO | NO | NO | NONE | NO | NO | DRIFT |
| settings | 91 | YES (thin) | YES | YES | YES | YES | 1 DAL bypass (social dal); 5 app-layer imports | NO | YES (91 files, 4 sub-modules) | DRIFT |
| shell | 7 | YES | NO | NO | YES | NO | 2 bootstrap controller/selectors direct imports | NO | NO | MOSTLY_CLEAN |
| social | 45 | YES (anemic) | YES | YES | YES | NO | CLEAN (via adapters) | NO | NO | MOSTLY_CLEAN |
| upload | 39 | YES | YES | YES | YES | YES | CLEAN (via adapters) | NO | NO | MOSTLY_CLEAN |
| vgrid | 10 | YES (empty) | NO | NO | NO | NO | NONE | NO | NO | NEEDS_REORG |
| void | 11 | YES (empty) | NO | NO | NO | NO | NONE | NO | NO | MOSTLY_CLEAN |
| vport | 30 | YES | YES | YES | YES | YES | 1 app-layer import (useAuth in hook) | NO | NO | MOSTLY_CLEAN |
| vportDashboard | 200 | YES | YES | YES | YES | YES | CLEAN (via adapters) | NO | YES (200 files, 12 sub-domains) | MOSTLY_CLEAN |
| wanderex | 23 | NO | NO | YES | YES | YES | CLEAN | NO | NO | DRIFT |
| wanders | 124 | YES (minimal) | YES | YES | YES | YES | 1 controller bypass (public/vportBusinessCard) | NO | NO | DRIFT |

---

### Features Graded DRIFT — Explanations

**debug** — Entire feature is dead weight. LoginDebugPanel is never mounted. Both helper files are explicitly DEPRECATED. Feature violates the debugger placement contract (should be in zNOTFORPRODUCTION/debuggers/). No standard layers present.

**explore** — Missing adapter boundary entirely. 3 dead code items (usecases/search.usecase.js unused, useSearchTabsActor.js dead, FilterTabs.jsx dead). Broken import in ui/index.jsx (`@/features/explore/screen/ExploreScreen` — wrong path). Two stub UI components render hardcoded mock data. Layer naming uses `ui/` instead of `components/`, `controller/` instead of `controllers/`.

**professional** — No adapter boundary. Three files import `Card.adapter` from settings (shared UI primitive incorrectly homed in settings feature). Sub-module structure (briefings/enterprise/professional-nurse/core) deviates from flat-layer platform convention without governance justification. Possible mock seed data in enterprise/data/enterpriseSeed.data.js.

**reviews** — Single-file feature (`setup.js` only). Self-documents planned migration to `app/setup/reviews.setup.js` (ARCH-ENGINESETUP-001). Not a real feature — it is an engine-wiring stub that should be dissolved.

**settings** — 1 confirmed DAL boundary bypass in production controller (F-004). 5 app-layer imports from hooks. Non-standard sub-module structure. `queries/` is a non-standard layer. Orphaned sponsored/ module (Omd.view.jsx) not mounted anywhere. 91 files — split candidate.

**wanderex** — Missing adapter boundary. Missing controllers/ layer entirely (hooks call DAL directly). Misplaced model file in screens/. Feature is FROZEN per DOCS-ORG-001.

**wanders** — Dual-layer architecture collision (top-level layers + core/ sub-tree duplicating same names). Two implementations of useWandersReplies coexist. Dual model directories (model/ and models/). Generic hook useIsWide trapped inside feature. Feature is FROZEN per DOCS-ORG-001.

---

### Features Graded NEEDS_REORG — Explanations

**hydration** — 2-file feature (setup.js + vcsmActorHydrator.js). vcsmActorHydrator.js bypasses identity adapter by importing directly from `@/state/identity/identity.read.dal`, `@/state/identity/identity.model`, `@/state/identity/identity.controller`. Contains inline Supabase query bypassing DAL layer. Self-documents planned dissolution (ARCH-ENGINESETUP-001). Both files are orphans at feature root with no layer structure.

**vgrid** — Fully unimplemented scaffold. 10 files, all empty zero-byte stubs. Non-standard layer names (api/, lib/, usecases/, ui/ instead of controllers/, components/). FROZEN per DOCS-ORG-001.

---

## 5. Boundary Violation Matrix

### Group 1: Feature → Feature Internal Imports (Cross-Feature Direct, Total: 411)

| Violation Type | File | Import Target | Severity |
|---|---|---|---|
| DAL bypass (production) | `settings/vports/controller/vportSocialSettings.controller.js:6` | `@/features/social/privacy/dal/actorSocialSettings.dal` | CRITICAL |
| DAL bypass (production) | `settings/vports/controller/vportSocialSettings.controller.js:7` | `@/features/social/privacy/dal/actorSocialPublicPolicy.dal` | CRITICAL |
| Controller bypass | `wanders/core/hooks/useWandersBusinessCardOps.js:1` | `@/features/public/vportBusinessCard/controller/vportBusinessCard.controller` | HIGH |
| Model bypass (7 files) | `profiles/...` | `@/features/booking/model/` (not via adapter) | HIGH |
| App-layer import | `feed/hooks/useCentralFeed.js` | `@/app/providers/AuthProvider` (useAuth) | HIGH |
| App-layer import | `settings/vports/hooks/useVportsController.js` | `@/app/providers/AuthProvider` | HIGH |
| App-layer import | `settings/vports/hooks/useVportsList.js` | `@/app/providers/AuthProvider` | HIGH |
| App-layer import | `settings/account/hooks/useAccountController.js` | `@/app/providers/AuthProvider` | HIGH |
| App-layer import | `settings/privacy/hooks/useActorPrivacy.js` | `@/app/providers/AuthProvider` | HIGH |
| App-layer import | `settings/profile/hooks/useProfileController.js` | `@/app/providers/AuthProvider` | HIGH |
| App-layer import | `auth/screens/LoginScreen.jsx` | `@/app/platform/ios/components/IosInstallPrompt` | MEDIUM |
| App-layer import | `auth/screens/LoginScreen.jsx` | `@/app/platform/ios/useIOSInstallVisibility` | MEDIUM |
| App-layer import | `auth/hooks/useAuthOnboarding.js` | `@/app/providers/AuthProvider` | MEDIUM |
| App-layer import | `chat/screen/ConversationView.jsx` | `@/app/platform` (ios) | MEDIUM |
| App-layer import | `legal/hooks/useLegalConsent.js` | `@/app/providers/AuthProvider` | MEDIUM |
| App-layer import | `vport/hooks/useCreateVport.js` | `@/app/providers/AuthProvider` | MEDIUM |
| Wanders sub-path adapter | `auth/controllers/register.controller.js:2` | `@/features/wanders/adapters/services/wandersSupabaseClient.adapter` | MEDIUM |
| Cross-feature to booking model | `profiles` (7 files) | `@/features/booking/model/` | MEDIUM |
| DAL inverted (DAL calls adapter) | `profiles/dal/readActorProfile.dal.js:3` | `@/features/social/adapters/privacy/actorPrivacy.adapter` | HIGH |

**Note:** The full 411-violation list includes all CLEAN adapter-boundary-respecting imports (e.g., `@/features/identity/adapters/identity.adapter` called from 102 locations). The above table focuses on confirmed violations only. Clean adapter-boundary imports are compliant and not violations.

### Group 2: UI → DAL Bypass
**Total confirmed: 0**
No screen, component, or UI file was found importing from any feature's dal/ directory directly. The hook/controller/DAL chain is respected throughout the UI layer.

### Group 3: Shared → Feature (Inverted Dependency)

| File | Import | Severity |
|---|---|---|
| `shared/components/PublicNavbar.jsx:3` | `@/features/identity/adapters/identity.adapter` | HIGH |
| `shared/hooks/useOneSignalPush.js:20` | `@/features/identity/adapters/identity.adapter` | HIGH |
| `shared/components/components/ActorActionsMenu.jsx:3` | `@/features/block/adapters/ui/ActorActionsMenu` | MEDIUM |

**Total: 3**

### Group 4: App → Feature Internals (App Layer Breaking Out)

| File | Import | Severity |
|---|---|---|
| `app/providers/AuthProvider.jsx:9` | `@/features/auth/dal/login.dal` (dalSignOut) | CRITICAL |
| `app/providers/AuthProvider.jsx:10` | `@/features/auth/dal/resetPasswordSecure.dal` (dalRegisterRecoveryPermit) | CRITICAL |
| `app/providers/AuthProvider.jsx:12` | `@/features/auth/dal/authSession.read.dal` (dalHydrateAuthSession, dalSubscribeAuthStateChange) | CRITICAL |

**Total: 3**

### Group 5: State Direct Access Bypassing Adapter

| File | Import | Severity |
|---|---|---|
| `features/settings/privacy/ui/PendingFollowRequests.jsx:5` | `@/state/actors/useActorSummary` | MEDIUM |
| `features/settings/privacy/ui/BlockedUsersSimple.jsx:4` | `@/state/actors/useActorSummary` | MEDIUM |
| `features/settings/privacy/ui/UserLookup.jsx:6` | `@/state/actors/useActorSummary` | MEDIUM |
| `features/settings/queries/useBlockedCitizens.js:9` | `@/state/actors/hydrateActors` | MEDIUM |
| `features/settings/account/hooks/useAccountController.js:5` | `@/state/actors/useActorSummary` | MEDIUM |
| `features/chat/inbox/screens/settings/BlockedUsersScreen.jsx:16` | `@/state/actors/useActorSummary` | MEDIUM |
| `features/vport/screens/RestoreVportScreen.jsx:4` | `@/state/actors/useActorSummary` | MEDIUM |
| `features/social/friend/request/hooks/useIncomingFollowRequests.js:7` | `@/state/actors/hydrateActors` | MEDIUM |
| `features/social/friend/subscribe/hooks/useSubscribeAction.js:12` | `@/state/actors/profileGateStore` | MEDIUM |
| `features/feed/hooks/useCentralFeed.js:12` | `@/state/actors/actorStore` | MEDIUM |
| `features/profiles/screens/.../TopFriendsRankEditor.jsx:10` | `@/state/actors/useActorSummary` | MEDIUM |
| `features/profiles/screens/.../RankPickerModal.jsx:5` | `@/state/actors/useActorSummary` | MEDIUM |
| `features/notifications/inbox/controller/resolveVportOwnerActor.controller.js:1` | `@/state/identity/identity.read.dal` | HIGH |
| `features/chat/setup.js:16` | `@/state/identity/identitySelection.store` | LOW |
| `features/hydration/vcsmActorHydrator.js` | `@/state/identity/identity.read.dal`, `identity.model`, `identity.controller` | HIGH |

**Total: 15**

### Group 6: Feature-Root Barrel Imports (No Adapter Subpath)

| File | Import | Severity |
|---|---|---|
| `social/friend/subscribe/controllers/follow.controller.js:10` | `@/features/block` (bare barrel) | LOW |
| `social/friend/subscribe/controllers/__tests__/follow.controller.test.js:59` | `@/features/block` (bare barrel) | LOW |
| `social/friend/request/controllers/followRequests.controller.js:12` | `@/features/block` (bare barrel) | LOW |
| `social/friend/request/controllers/__tests__/followRequests.controller.test.js:63` | `@/features/block` (bare barrel) | LOW |
| `profiles/controller/friends/getTopFriendCandidates.controller.js:2` | `@/features/block` (bare barrel) | LOW |
| `upload/controllers/createPost.controller.js:16` | `@/features/block` (bare barrel) | LOW |

**Total: 6**

### Group 7: Circular Dependencies

| Pair Type | Features | Severity |
|---|---|---|
| Bidirectional | notifications ↔ profiles | HIGH |
| Bidirectional | notifications ↔ post | HIGH |
| Bidirectional | notifications ↔ social | HIGH |
| Bidirectional | notifications ↔ booking | HIGH |
| Bidirectional | profiles ↔ social | HIGH |
| Bidirectional | profiles ↔ post | HIGH |
| Bidirectional | feed ↔ post | MEDIUM |
| Bidirectional | feed ↔ social | MEDIUM |
| Bidirectional | dashboard ↔ profiles | MEDIUM |
| Bidirectional | dashboard ↔ settings | MEDIUM |
| Bidirectional | dashboard ↔ public | MEDIUM |
| Bidirectional | settings ↔ vport | MEDIUM |
| Bidirectional | settings ↔ ads | LOW |
| Bidirectional | auth ↔ legal | LOW |
| Bidirectional | block ↔ feed | LOW |
| Triangle | notifications → profiles → media → notifications | HIGH |
| Triangle | booking → notifications → profiles → booking | HIGH |
| Triangle | feed → profiles → social → feed | MEDIUM |
| Triangle | public → vport → settings → public | MEDIUM |

**Total bidirectional pairs: 15. Total cycles (including longer chains): 124.**

---

### Violation Summary Counts

| Violation Type | Count |
|---|---|
| Feature → Feature (all cross-feature imports, including clean adapter-boundary ones) | 411 total; violations subset: ~25 confirmed non-adapter or inverted |
| UI → DAL bypass | 0 |
| Shared → Feature (inverted dependency) | 3 |
| App → Feature internals (DAL bypass) | 3 |
| State direct access bypassing adapter | 15 |
| Feature-root barrel imports (no subpath) | 6 |
| Circular dependency pairs (bidirectional) | 15 |
| **Total confirmed hard violations** | **47** |

---

## 6. Scanner Accuracy Review

### Coverage Summary

The scanner at `apps/scanner/src/` contains 62 JS files across cli/, core/, graph/, outputs/, parsers/, resolvers/, scanners/, and validation/ directories. It produces 43 JSON maps and 8 markdown reports per scan run via `npm run scan`.

### What the Scanner Covers

| Domain | Scanner | Confidence |
|---|---|---|
| Feature discovery | featureScanner.js | HIGH |
| Cross-feature boundary violations | featureImportMapScanner.js (3 rules) | HIGH |
| Feature split candidates | featureImportMapScanner.js (>100 files) | HIGH |
| Identity ownership flow violations | identityFlowScanner.js | HIGH |
| DB policy coverage (RLS, migrations) | dbPolicyScanner.js | HIGH |
| Documentation drift | documentationDriftScanner.js | MEDIUM |
| Dead exports | deadExportScanner.js | HIGH |
| Runtime cost patterns | runtimeCostScanner.js | MEDIUM |
| Native parity | nativeParityScanner.js | LOW (token-match only) |
| Behavior test coverage | behaviorTestCoverageScanner.js | MEDIUM |
| Dependency graph | dependencyScanner.js | HIGH |
| Engine candidates | engineCandidateScanner.js | MEDIUM |
| Write surfaces | writeSurfaceScanner.js | HIGH |
| RPC calls | rpcScanner.js | HIGH |
| Edge function inventory | edgeFunctionScanner.js | HIGH |

### Feature Map Accuracy

**Generated:** 2026-06-05T03:29:11.562Z (2 days stale as of review date)

**Missing from scanner (5 active VCSM features):**
- `flyerBuilder` — active, adapters/components/controller/dal/designStudio present
- `initiation` — active, adapters/components/controller/dal/hooks present
- `qrcode` — active, 9 files with adapters/components
- `shell` — active, adapters/modules, 7 files
- `vportDashboard` — active, ~199 source files (the largest missing feature)

**Ghost entries in scanner (paths do not exist on disk):**
- `dashboard` — reported as 258 source files; no `/features/dashboard` directory exists. This is the pre-split monolith ghost.
- `onboarding` — reported as 16 files; no `/features/onboarding` directory exists.
- `ui` — reported as 1 file; no `/features/ui` directory exists.

**Net impact:** All scanner-derived reports for vportDashboard, flyerBuilder, initiation, qrcode, and shell — including security findings, dead exports, documentation drift, and behavior coverage — are absent. vportDashboard alone is the largest VCSM feature by file count (~200 files) and is completely invisible.

### Dependency Map Accuracy

Generated 2026-06-05. 380 edges total. No stale path references to removed directories found. Calendar-stale (2 days) but structurally sound. Feature-level rollups that reference ghost features (dashboard, onboarding, ui) will have incorrect attribution.

### Rules the Scanner Is Missing

| Missing Rule | Description | Risk |
|---|---|---|
| Intra-feature adapter bypass | Hook/screen calling feature's own DAL directly without controller | HIGH — most common form of layer skip, undetected |
| Monitoring/Sentry coverage | No check for captureVcsmError or ErrorBoundary presence in write paths | HIGH — 25 features are dark |
| Empty folder/feature governance | No flag for feature folders with zero source files | MEDIUM |
| Cross-app import violation | VCSM → Wentrex or vice versa — isolation breach | HIGH |
| Void realm contamination | No enforcement of resolvePublicRealmIdDAL() rule for system posts | HIGH — platform invariant with no coverage |
| Unauthenticated edge function | No check for authentication guards in edge function files | HIGH |
| Feature rename drift | No comparison of current scan vs previous to flag disappeared/renamed features | MEDIUM |
| Hook → DAL direct call | Hook importing DAL without going through controller | HIGH — detected manually in wanderex and explore |

### Scanner Accuracy Grade: C+

Accurate and comprehensive for discovered features, but the 5-feature blind spot (including vportDashboard at ~200 files) significantly reduces practical utility. All findings derived from the scanner for the past 2 days are missing vportDashboard coverage entirely. A rescan is required before any scanner-derived governance decision is made.

---

## 7. Stale Path / Dead Code Inventory

| Type | Path | Status | Action |
|---|---|---|---|
| EMPTY_FOLDER | `apps/VCSM/src/app/errors/` | Confirmed empty | Delete |
| EMPTY_FOLDER | `features/vportDashboard/dashboard/shared/styles/` | Confirmed empty | Delete |
| EMPTY_FOLDER | `features/vportDashboard/dal/write/__tests__/` | Confirmed empty | Delete |
| EMPTY_FOLDER | `features/vportDashboard/dashboard/cards/schedule/dal/` | Confirmed empty | Delete |
| EMPTY_FOLDER | `features/vportDashboard/dashboard/cards/team/model/` | Confirmed empty | Delete |
| ORPHAN_FILE | `apps/VCSM/src/screens/DevDiagnosticsScreen.jsx` | Outside feature tree | Move to `src/dev/` or `features/debug/` |
| ORPHAN_FILE | `features/debug/loginDebug.helpers.js` | DEPRECATED marker | Delete after confirming no consumers |
| ORPHAN_FILE | `features/debug/loginDebug.store.js` | DEPRECATED marker | Delete after confirming no consumers |
| ORPHAN_FILE | `features/debug/components/LoginDebugPanel.jsx` | Never mounted anywhere | Move to `zNOTFORPRODUCTION/debuggers/` or delete |
| ORPHAN_FILE | `features/public/screens/VportMenuRedirect.jsx` | Router points to vportMenu/screen/, not this file | Delete (only reference is dev diagnostics hasLegacyRedirect check) |
| ORPHAN_FILE | `features/void/void.js` | `export {}` stub at feature root | Delete |
| ORPHAN_FILE | `features/void/VoidScreen.jsx` | At feature root instead of screens/ | Move to `features/void/screens/` |
| ORPHAN_FILE | `features/vport/vport.public.js` | Self-documented migration barrel, consumed only by dev/diagnostics | Delete after updating diagnostics group |
| ORPHAN_FILE | `features/vport/CreateVportForm.jsx` | At feature root (refactor artifact) | Move to `features/vport/components/` |
| ORPHAN_FILE | `features/vport/createVportForm.model.js` | At feature root | Move to `features/vport/model/` |
| ORPHAN_FILE | `features/settings/constants.js` | cx helper + upload constants at root | Split: cx to shared/utils, constants to settings/profile/ |
| ORPHAN_FILE | `features/settings/index.js` | Empty auto-generated stub | Delete |
| ORPHAN_FILE | `features/settings/sponsored/ui/Omd.view.jsx` | Not mounted in SettingsScreen, no adapter | Delete or connect |
| ORPHAN_FILE | `features/wanders/components/wandersCardPreview.model.js` | Model file inside components/ | Move to `features/wanders/models/` |
| ORPHAN_FILE | `features/wanders/screens/view/wandersCardCta.model.js` | Model file inside screens/view/ | Move to `features/wanders/models/` |
| DEAD_EXPORT | `features/profiles/kinds/vport/vportTypeRegistry.js` | Marked DEPRECATED, linked TODO DTAB-001 | Delete after updating dev/diagnostics/groups/profilesKindsFeature.group.js |
| DEAD_EXPORT | `features/legal/dal/getPublicIp.dal.js` | Self-documented as "NOT CALLED — retained for reference only" | Delete |
| DEAD_EXPORT | `features/feed/hooks/useFeed.js` | Legacy hook replaced by useCentralFeed; adapter still points to this | Update adapter to useCentralFeed; delete useFeed |
| DEAD_EXPORT | `features/explore/usecases/search.usecase.js` | No consumer | Delete |
| DEAD_EXPORT | `features/explore/hooks/useSearchActor.js` | No consumer | Delete |
| DEAD_EXPORT | `features/explore/hooks/useSearchTabsActor.js` | Dead (controller unused) | Delete |
| DEAD_EXPORT | `features/explore/ui/FilterTabs.jsx` | No import found anywhere | Delete |
| DEAD_EXPORT | `features/explore/ui/CitizensRow.jsx` | Renders only when SHOW_EXPLORE_DISCOVERY_BLOCKS=false (never) | Delete or connect |
| DEAD_EXPORT | `features/explore/ui/FeatureSearchResultRow.jsx` | Superseded by FeaturedResultCard.jsx | Delete |
| STALE_IMPORT | `shared/components/components/BackHeader.jsx` | Imports `@/ui/components/Backbutton.jsx` — path does not exist | Fix alias to `apps/VCSM/src/shared/components/components/Backbutton.jsx` |
| STALE_IMPORT | `features/explore/ui/index.jsx` | Imports `@/features/explore/screen/ExploreScreen` (wrong: should be screens/) | Fix path or delete file |
| STALE_COMMENT | `features/upload/controllers/createPost.controller.js:1` | Windows absolute path stale comment | Remove |
| STALE_COMMENT | `features/invite/hooks/useInvite.js` | DEV probe marked "remove after CORS confirmed" | Remove probe |
| STALE_COMMENT | `features/invite/screens/InviteView.jsx` | Same DEV probe | Remove probe |
| DEPRECATED_HOOK | `state/identity/identityContext.jsx` | useIdentityDetailsDeprecated exported and used | Plan migration; document timeline |
| ZERO_BYTE_STUBS | `features/vgrid/**/index.js` (10 files) | All empty | Leave as-is (FROZEN) |
| ZERO_BYTE_STUBS | `features/void/**/index.js` (9 files) | All empty | Leave as-is (planned feature) |
| ZERO_BYTE_STUBS | `features/auth/ui/index.js`, `features/auth/usecases/index.js`, `features/settings/profile/index.js` | Empty scaffolding | Delete |
| BACKUP_FILE | None | No .bak/.old/.tmp files found | None needed |

---

## 8. Monitoring Placement Map

| Feature | Has Controller | Has DAL | Currently Monitored | Gap | Recommended Behavior ID Namespace |
|---|---|---|---|---|---|
| booking | YES | YES | YES (captureVcsmError in 6 controllers) | None | `booking.*` — already instrumented |
| identity/state | YES | YES | YES (captureVcsmError + captureIdentityError in 5+ files) | None | `identity.*` — already instrumented |
| auth | YES | YES | NO | P0 — login, register, session, callback failures are highest-value | `auth.login.*`, `auth.register.*`, `auth.reset_password.*`, `auth.session.*`, `auth.callback.*` |
| upload | YES | YES | NO | P1 — post creation, media record write failures | `upload.create_post.*`, `upload.record_media.*`, `upload.mention_search.*` |
| moderation | YES | YES | NO | P1 — report, visibility assertion, access control failures | `moderation.report.*`, `moderation.post_visibility.*`, `moderation.assert_access.*` |
| vportDashboard | YES | YES | NO | P1 — bookings, team, leads, schedule, settings mutations | `vportDashboard.booking.*`, `vportDashboard.team.*`, `vportDashboard.leads.*`, `vportDashboard.schedule.*` |
| vport | YES | YES | NO | P1 — create vport, service catalog, restore | `vport.create.*`, `vport.core_ops.*`, `vport.service_catalog.*` |
| post | YES | YES | NO | P1 — delete, edit, reactions, comments | `post.delete.*`, `post.edit.*`, `post.reactions.*`, `post.comments.*` |
| social | YES | YES | NO | P2 — follow, unfollow, follow requests, privacy | `social.follow.*`, `social.unfollow.*`, `social.follow_request.*`, `social.privacy.*` |
| notifications | YES | YES | NO | P2 — inbox, count, runtime | `notifications.inbox.*`, `notifications.count.*`, `notifications.runtime.*` |
| profiles | YES | YES | NO | P2 — slug resolve, kind, view, friends, photos | `profiles.resolve_slug.*`, `profiles.view.*`, `profiles.friends.*`, `profiles.photos.*` |
| feed | YES | YES | NO | P2 — viewer context, list posts | `feed.viewer_context.*`, `feed.list_posts.*` |
| settings | YES | YES | NO | P2 — account, profile save, privacy/blocks | `settings.account.*`, `settings.profile.*`, `settings.privacy.*`, `settings.vports.*` |
| block | YES | YES | NO | P2 — block actor, status, blocked set | `block.actor.*`, `block.status.*`, `block.list.*` |
| chat | YES | YES | NO | P2 — attachment record, unread count | `chat.attachment.*`, `chat.unread.*` |
| explore | YES | YES | NO | P2 — search results | `explore.search.*` |
| flyerBuilder | YES | YES | NO | P2 — editor, design studio load/save/export | `flyerBuilder.editor.*`, `flyerBuilder.design_studio.*` |
| media | YES | YES | NO | P2 — create asset, soft delete | `media.create.*`, `media.delete.*` |
| public | YES | YES | NO | P2 — menu, reviews, slug resolve | `public.vport_menu.*`, `public.vport_reviews.*`, `public.slug_resolve.*` |
| actors | YES | YES | NO | P3 — search | `actors.search.*` |
| ads | YES | YES | NO | P3 — ad storage | `ads.storage.*` |
| initiation | YES | YES | NO | P3 — onboarding, vibe tags | `initiation.onboarding.*`, `initiation.vibe_tags.*` |
| invite | YES | YES | NO | P3 — invite send | `invite.invite.*` |
| join | YES | YES | NO | P3 — join barbershop | `join.barbershop_account.*`, `join.barbershop_qr.*` |
| legal | YES | YES | NO | P3 — consent | `legal.consent.*` |
| professional | YES | YES | NO | P3 — briefings | `professional.briefings.*` |
| wanderex | NO (hooks call DAL directly) | YES | NO | P3 (FROZEN) | `wanderex.*` |
| wanders | YES | YES | NO | FROZEN — defer | — |
| qrcode | NO | NO | NO | None needed (pure render) | — |
| portfolio | NO (setup only) | NO | NO | None needed | — |
| reviews | NO (setup only) | NO | NO | None needed | — |
| shell | NO | NO | NO | None needed (nav only) | — |
| void | NO | NO | NO | None needed (scaffold) | — |
| vgrid | NO | NO | NO | None needed (FROZEN scaffold) | — |
| debug | NO | NO | NO | None needed (to be deleted) | — |

**Summary:** 2 of 36 features monitored (booking, identity/state). 25 features have write paths with zero monitoring. Priority instrumentation: auth, upload, moderation, vportDashboard (P0-P1).

---

## 9. Recently Completed Work Verification

| Work Item | Status | Evidence | Notes |
|---|---|---|---|
| Dashboard split (features/dashboard removed) | COMPLETE | `find /apps/VCSM/src/features/dashboard` returned no output — directory does not exist | Split executed successfully |
| vportDashboard move | COMPLETE | `/features/vportDashboard` exists with full internal structure; 200 files, 12 sub-domains under dashboard/cards/ | Feature fully present with adapters, controller, dal, hooks, screens |
| qrcode move | COMPLETE | `/features/qrcode` exists with 9 files across adapters/, components/, components/flyer/, __tests__/ | Adapter boundary present, SPIDER-MAN test suite enforces it |
| flyerBuilder move | COMPLETE | `/features/flyerBuilder` exists with controller/, screens/, adapters/, styles/, components/ all populated | designStudio sub-module present |
| BackButton migration | PARTIAL | VportBackButton correctly at `/shared/ui/dashboard/BackButton.jsx`; imported from there by vportDashboard screens. However `/features/ads/ui/VportAdsBackButton.jsx` is a standalone local variant with extra `style` prop | ads/ duplicate is a feature-local variant, not a migration leftover — low risk |
| Identity adapter bypass cleanup | COMPLETE | No feature outside `/identity/` importing directly from identity DAL — confirmed via grep | Boundary clean |
| Analytics to shared/lib (funnelSource) | COMPLETE | `/shared/lib/funnelSource.js` exists; still noted as analytics utility in shared/ rather than services/analytics/ — see shared/ flags | Technically COMPLETE but placement remains a structural flag |
| CSS to shared/styles | COMPLETE | `/shared/styles/` with profiles-modern.css, settings-modern.css, modern/ subdirectory | Clean |
| Monitoring adapter/instrumentation | PARTIAL | vcsmMonitoring.js confirmed in services/monitoring/. Duplicate copies also confirmed in app/monitoring/ — both paths active simultaneously | Consolidation to single canonical path not yet complete (F-018) |

---

## 10. Recommended Ticket Queue

| Priority | Ticket ID | Title | Type | Scope | Effort |
|---|---|---|---|---|---|
| ~~P0~~ **DONE 2026-06-07** | TICKET-ARCH-BOOKING-RPC-001 | Replace booking INSERT/UPDATE with typed state-machine RPCs; bind customer_actor_id to session | SEC | `features/booking/` + DB migrations | HIGH |
| ~~P0~~ **DONE 2026-06-07** | TICKET-ARCH-MODERATION-IDOR-001 + TICKET-MODERATION-REPORTER-PARAM-CLEANUP-001 | Bind reporter_actor_id to session; remove caller-supplied prop from hook and 6 callers | SEC | `features/moderation/` | MEDIUM |
| ~~P0~~ **DONE 2026-06-07** | TICKET-ARCH-NOTI-SESSION-001 + TICKET-ARCH-NOTI-SESSION-001-DB | App-layer session guard in publish.js + DB-level ownership trigger on notification.events | SEC | `features/notifications/` + `supabase/migrations/` | HIGH |
| ~~P0~~ **DONE 2026-06-07** | TICKET-ARCH-SETTINGS-DAL-BYPASS-001 | Route vportSocialSettings through social adapter; expose cache invalidation at social boundary | ARCH | `features/settings/vports/controller/vportSocialSettings.controller.js` | LOW |
| ~~P1~~ **DONE 2026-06-07** | TICKET-ARCH-AUTHPROVIDER-DAL-001 | AuthProvider must import from auth.adapter, not auth DAL directly | ARCH | `app/providers/AuthProvider.jsx` + `features/auth/adapters/auth.adapter.js` | MEDIUM |
| ~~P1~~ **DONE 2026-06-07** | TICKET-ARCH-SCANNER-DRIFT-001 | Re-run scanner; register flyerBuilder/initiation/qrcode/shell/vportDashboard; remove ghost features | TASK | `apps/scanner/` | LOW |
| P1 **PARTIAL 2026-06-07** | TICKET-ARCH-MONITORING-GAPS-001 | Instrument auth, upload, moderation, vportDashboard with captureVcsmError — P1 features done (auth/upload/moderation); 22 features remain | ENG | 4 of 25 features instrumented | HIGH |
| P1 | TICKET-ARCH-SETTINGS-APP-LAYER-001 | Replace useAuth app-layer imports in 5 settings hooks with identity adapter | ARCH | `features/settings/` (5 hook files) | LOW |
| P1 | TICKET-ARCH-PROFILES-DAL-INVERSION-001 | Lift privacy resolution out of profiles DAL into controller layer | ARCH | `features/profiles/dal/readActorProfile.dal.js` | MEDIUM |
| P1 | TICKET-ARCH-CIRCULAR-DEPS-001 | Map cycle entry points in notifications/profiles/social cluster; break mutual imports | ARCH | `features/notifications`, `features/profiles`, `features/social` | HIGH |
| P1 | TICKET-ARCH-WANDERS-BOUNDARY-001 | Route wanders business card ops through public adapter, not controller directly | ARCH | `features/wanders/core/hooks/useWandersBusinessCardOps.js` | LOW |
| P2 | TICKET-ARCH-MONITORING-DUPE-001 | Canonicalize monitoring to services/monitoring/; delete app/monitoring/ copies | TASK | `app/monitoring/`, `services/monitoring/` | LOW |
| P2 | TICKET-ARCH-STATE-ACTOR-BYPASS-001 | Route 12 state/actors direct imports through declared adapter surface | ARCH | Multiple features | MEDIUM |
| P2 | TICKET-ARCH-SHARED-FEATURE-COUPLING-001 | Remove features/ imports from shared/; move PublicNavbar to public feature | ARCH | `shared/components/PublicNavbar.jsx`, `shared/hooks/useOneSignalPush.js` | MEDIUM |
| P2 | TICKET-ARCH-BEHAVIOR-DOC-DEBT-001 | Write BEHAVIOR.md for profiles/kinds (139), social/friend (28), post/postcard (28), settings/vports (25), chat/inbox (25) | TASK | Documentation | HIGH |
| P2 | TICKET-ARCH-BOOKING-ADAPTER-DAL-LEAK-001 | Wrap getActorByIdDAL in controller function; update 9 call sites in dashboard controllers | ARCH | `features/booking/adapters/booking.adapter.js` | MEDIUM |
| P2 | TICKET-ARCH-DASHBOARD-GHOST-DOCS-001 | Audit 8 BEHAVIOR_WITHOUT_ENFORCEMENT dashboard docs; mark PLANNED or confirm code exists | TASK | ZZnotforproduction governance docs | LOW |
| P2 | TICKET-ARCH-IDENTITY-SPOF-001 | Document identity adapter surface formally; add breaking-change detection tests | ENG | `engines/identity/`, `features/identity/` | MEDIUM |
| P2 | TICKET-ARCH-FEED-ADAPTER-GAP-001 | Add useCentralFeed to feed adapter; deprecate useFeed adapter entry | ARCH | `features/feed/adapters/` | LOW |
| P2 | TICKET-ARCH-SOCIAL-DAL-ADAPTER-LEAK-001 | Replace actorSignalVisibility.adapter.js DAL re-export with controller wrapper | ARCH | `features/social/adapters/privacy/actorSignalVisibility.adapter.js` | LOW |
| P3 | TICKET-ARCH-NAMING-CONVENTION-001 | Standardize controller/ → controllers/ across all features | TASK | 14 features | MEDIUM |
| P3 | TICKET-ARCH-DEBUG-MISPLACEMENT-001 | Delete features/debug/ (deprecated shims, never-mounted panel); clean debuggers-stub/ | TASK | `features/debug/`, `src/debuggers-stub/` | LOW |
| P3 | TICKET-ARCH-HYDRATION-DISSOLVE-001 | Execute ARCH-ENGINESETUP-001: dissolve features/hydration/ into app/setup/ and identity/ | TASK | `features/hydration/` | LOW |
| P3 | TICKET-ARCH-REVIEWS-DISSOLVE-001 | Execute ARCH-ENGINESETUP-001: move features/reviews/setup.js to app/setup/reviews.setup.js | TASK | `features/reviews/` | LOW |
| P3 | TICKET-ARCH-DEAD-CODE-SWEEP-001 | Delete 30 identified dead/orphan files (see Dead Code Inventory) | TASK | Multiple paths | MEDIUM |
| P3 | TICKET-ARCH-VPORT-DASHBOARD-SPLIT-001 | Evaluate vportDashboard split: extract vportGasPrices and vportBookings as first-class features | ARCH | `features/vportDashboard/dashboard/cards/` | HIGH |
| P3 | TICKET-ARCH-PROFILES-SPLIT-001 | Evaluate profiles/kinds/vport/ extraction (256 files, 8+ sub-domains) to features/vportProfile | ARCH | `features/profiles/kinds/vport/` | HIGH |
| P3 | TICKET-ARCH-SETTINGS-SPLIT-001 | Evaluate settings split into settings-account, settings-privacy, settings-profile, settings-vports | ARCH | `features/settings/` | HIGH |

---

## 11. Final Verdict

### What Is Working Well

The VCSM codebase has a clearly articulated architecture philosophy that is genuinely followed in the majority of the codebase. The adapter boundary system — with 36 features publishing `*.adapter.js` files as their external contract — is a strong governance pattern, and it is respected by most cross-feature imports. The engine extraction is mature: 9 engines are fully extracted (booking, chat, hydration, i18n, identity, media, notifications, portfolio, reviews) with well-defined consumer contracts, and the dependency scanner confirms these engines are broadly consumed. Recent structural work is visible and credible — the dashboard split completed cleanly, vportDashboard is fully rehoused, qrcode and flyerBuilder are properly scaffolded, and the identity adapter bypass cleanup succeeded. The three-layer monitoring design (Sentry SDK + edge function transports) is sophisticated and correctly abstracted, even if deployment to features is incomplete. The scanner infrastructure is a genuine competitive advantage — 62 modules, 43 map outputs, and 8 governance reports give this team a capability most codebases lack.

### What Needs Immediate Attention (P0-P1)

Three security findings are P0 and must be resolved before any release gate: the booking state machine accepts unauthenticated updates (TICKET-BOOKING-RPC-001), moderation report fields are fully caller-supplied with no session binding (F-002), and notification write fields lack session ownership assertions (F-003). These are confirmed open in the finding-map and represent exploitable trust boundary failures, not theoretical risks. Alongside these, the `settings` controller importing directly from `social` DAL in production code (F-004) bypasses the social feature's entire API contract and must be corrected at the import level. At the architecture layer, the five missing features from the scanner (vportDashboard foremost, at ~200 files) mean that ongoing security and governance scans are operating with a significant blind spot. A rescan is needed before any scanner output is used as a governance signal.

### What Can Be Deferred (P2-P3)

The 442 total boundary-violation count sounds alarming but requires context: the large majority are clean adapter-boundary-respecting imports that the scanner classifies as cross-feature (correctly, they cross feature lines) but that are architecturally compliant. The true hard violations number approximately 47. These P2 items — the 12 state/actors direct imports, the 3 shared-imports-from-features violations, the 15 circular dependency pairs, the 445 undocumented behaviors — are real debt but do not represent immediate production risk. The P3 items (naming conventions, dead code sweep, feature splits for profiles/vportDashboard/settings) are quality-of-life improvements that will pay dividends as the team grows but impose no release risk today.

### Readiness for Continued Modularization

The codebase is ready for continued engine extraction and feature splitting, but should not pursue the next extraction wave until the scanner is resynced (TICKET-ARCH-SCANNER-DRIFT-001) and the P0 security findings are resolved. The three highest-value pending extractions identified by the engine candidate scanner are `profile` (21 consumers), `directory` (14 consumers, crosses all three apps), and `menu` (8 consumers, crosses all apps including Traffic). Of these, `profile` is the most pressing — `profiles` at 383 files is the largest feature in the codebase and its `kinds/vport/` sub-tree alone (256 files) dwarfs most standalone features. The split is structurally ready; it needs a ticket, a migration window, and a scanner rescan to confirm scope.

### Top 3 Recommended Next Steps

**1. Execute the P0 security remediation.** TICKET-BOOKING-RPC-001 (booking RPC), TICKET-ARCH-MODERATION-IDOR-001 (moderation IDOR), and TICKET-ARCH-NOTI-SESSION-001 (notification session binding) are confirmed open findings in the live security scan output. These should be the first three tickets executed in the next sprint, in priority order.

**2. Resync the scanner.** Run `npm run scan` from the scanner root to regenerate all 43 maps. The 5 missing features (especially vportDashboard at ~200 files) mean all current governance reports are materially incomplete. After the rescan, verify the ghost entries (`dashboard`, `onboarding`, `ui`) have been replaced by their correct successors and that flyerBuilder, initiation, qrcode, shell, and vportDashboard appear with correct file counts.

**3. Instrument auth, upload, and moderation with monitoring.** These three features have active write paths producing production errors that are currently invisible. Adding `captureVcsmError` to the top-level catch blocks in auth login/register/reset, upload createPost, and moderation report controllers requires 3-5 hours of work and immediately gives the team production error visibility for the highest-risk user flows.
