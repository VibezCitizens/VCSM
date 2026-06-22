---
title: Dashboard Shell Behavior Contract
status: ACTIVE
feature: dashboard
module: dashboard
source: reverse-engineered
generated: 2026-06-05
owner: ARCHITECT
ticket: TICKET-ARCHITECT-BEHAVIOR-REVERSE-0001
---

# Dashboard Shell Behavior Contract

---

## 1. Purpose

The dashboard shell is the VPORT owner control center entry screen. It is a navigation dispatcher only — it owns no write surfaces, performs no mutations, and does not load privileged owner data. It verifies actor ownership, builds a type-specific card grid, and dispatches the owner to card sub-modules via imperative navigation.

---

## 2. Scope

This contract covers the dashboard shell module only:

- Route entry and guard chain (`/actor/:actorId/dashboard`)
- Actor identity and ownership gate
- Card catalog construction and grid rendering
- Imperative navigation dispatch to card sub-modules
- VPORT banner header render
- Desktop portal rendering

Out of scope: card sub-module internals, write surfaces in child modules, quick stats hook internals.

---

## 3. Evidence Sources

| Source | Purpose | Status |
|---|---|---|
| VportDashboardScreen.jsx | Primary screen behavior | [SOURCE_VERIFIED] |
| useVportOwnership.js | Ownership hook behavior | [SOURCE_VERIFIED] |
| checkVportOwnership.controller.js | Ownership resolution logic | [SOURCE_VERIFIED] |
| vportOwnerStats.controller.js | Quick stats data contract | [SOURCE_VERIFIED] |
| buildDashboardCards.model.js | Card catalog and builder | [SOURCE_VERIFIED] |
| dashboardViewByVportType.model.js | View presets and type resolution | [SOURCE_VERIFIED] |
| dashboardVportDetails.model.js | VPORT details normalizer | [SOURCE_VERIFIED] |
| appRoutes.redirects.jsx | OwnerOnlyDashboardGuard + BlockedVportGuard | [SOURCE_VERIFIED] |
| app.routes.jsx | Route registration and guard wrapping | [SOURCE_VERIFIED] |
| apps/scanner/maps/route-map.json | Route access scanner classification | [SCANNER_VERIFIED] |
| apps/scanner/maps/screen-map.json | Screen-to-route linking | [SCANNER_VERIFIED] |
| modules/dashboard/ARCHITECTURE.md | Call graph, layer map, render guards | [ARCHITECT_VERIFIED] |
| modules/dashboard/INDEX.md | Module summary, navigation dispatch map | [ARCHITECT_VERIFIED] |

---

## 4. Actors

| Actor | Role | Evidence |
|---|---|---|
| VPORT actor in VPORT-mode identity | Full dashboard access — `identity.actorId === URL actorId` | [SOURCE_VERIFIED] appRoutes.redirects.jsx:29 |
| User actor in citizen mode | Blocked — `identity.actorId !== URL actorId` → redirect to /feed | [SOURCE_VERIFIED] appRoutes.redirects.jsx:29-31 |
| Unauthenticated visitor | Blocked — ProtectedRoute redirects to /login | [ARCHITECT_VERIFIED] ARCHITECTURE.md |
| Actor with incomplete profile | Blocked — ProfileGatedOutlet gate | [ARCHITECT_VERIFIED] ARCHITECTURE.md |
| Blocked VPORT actor | Blocked — BlockedVportGuard redirects to /vport/restore | [SOURCE_VERIFIED] appRoutes.redirects.jsx:40 |
| Void VPORT actor | Blocked by screen ownership check — isOwner=false | [SOURCE_VERIFIED] checkVportOwnership.controller.js:10 |

---

## 5. Entry Routes

| Route | Screen | Params | Guard Chain | Evidence |
|---|---|---|---|---|
| `/actor/:actorId/dashboard` | VportDashboardScreen | `actorId` — VPORT actor UUID | ProtectedRoute → ProfileGatedOutlet → BlockedVportGuard → OwnerOnlyDashboardGuard | [SOURCE_VERIFIED] app.routes.jsx:204-205 |
| `/vport/:actorId/dashboard` | VportToActorDashboardRedirect | `actorId` | ProtectedRoute → ProfileGatedOutlet | [SOURCE_VERIFIED] app.routes.jsx:237-240 — legacy redirect to `/actor/:actorId/dashboard` |

**Route access scanner classification:** "public" (scanner does not detect component-level guard chain) — [SCANNER_VERIFIED] route-map.json. Actual access is OWNER ONLY.

---

## 6. Happy Paths

### BEH-DASHBOARD-SHELL-001 — Route Entry and Guard Chain

| Step | Behavior | Evidence |
|---|---|---|
| 1 | Browser navigates to `/actor/:actorId/dashboard` | [SOURCE_VERIFIED] app.routes.jsx:205 |
| 2 | `ProtectedRoute` verifies Supabase session, email verification, legal consent | [ARCHITECT_VERIFIED] ARCHITECTURE.md |
| 3 | `ProfileGatedOutlet` enforces profile completeness gate | [ARCHITECT_VERIFIED] ARCHITECTURE.md |
| 4 | `BlockedVportGuard` reads `identity.blockedVport` — if true, redirects to `/vport/restore` | [SOURCE_VERIFIED] appRoutes.redirects.jsx:36-42 |
| 5 | `OwnerOnlyDashboardGuard` reads `identity.actorId` and URL `actorId` — if `identityLoading`, returns null; if `!identity`, redirects to `/feed`; if `identity.actorId !== actorId`, redirects to `/feed` | [SOURCE_VERIFIED] appRoutes.redirects.jsx:23-34 |
| 6 | `VportDashboardScreen` mounts — `useVportOwnership(identity?.actorId, actorId)` fires async check | [SOURCE_VERIFIED] VportDashboardScreen.jsx:34 |
| 7 | While `identityLoading || ownershipLoading`: SkeletonCardList renders | [SOURCE_VERIFIED] VportDashboardScreen.jsx:145 |
| 8 | Ownership resolves: `checkVportOwnershipController` returns true (self-access path for VPORT actor) | [SOURCE_VERIFIED] checkVportOwnership.controller.js:8-11 |
| 9 | `isOwner=true` — card grid renders | [SOURCE_VERIFIED] VportDashboardScreen.jsx:147+ |

**Note:** `OwnerOnlyDashboardGuard` is documented as "UI convenience only — not the authoritative security boundary." — [SOURCE_VERIFIED] appRoutes.redirects.jsx:14-21.

---

### BEH-DASHBOARD-SHELL-002 — Card Catalog Dispatch by VPORT Type

| Step | Behavior | Evidence |
|---|---|---|
| 1 | `vportType` resolved from `identity?.vportType ?? dashboardDetails.vportType` via `normalizeVportType()` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:88-91 |
| 2 | `normalizeVportType(type)` normalizes to lowercase, replaces underscores with spaces, trims | [SOURCE_VERIFIED] dashboardViewByVportType.model.js:129-132 |
| 3 | `getDashboardViewByVportType(vportType, { getTabsFn })` selects a view preset | [SOURCE_VERIFIED] dashboardViewByVportType.model.js:146-158 |
| 4 | Type-override lookup: `TYPE_TO_VIEW[normalized]` — matches barber, barbershop, locksmith, "gas station", exchange | [SOURCE_VERIFIED] dashboardViewByVportType.model.js:96-102 |
| 5 | Group fallback: `resolveVportTypeGroup(type)` → `GROUP_TO_VIEW[group]` → preset ID → `DASHBOARD_VIEW_PRESETS[id]` | [SOURCE_VERIFIED] dashboardViewByVportType.model.js:154-157 |
| 6 | `withCalendarCardIfVportHasBookingTab(view, type, getTabsFn)` — if VPORT type has "book" tab: prepends `calendar` key to card set | [SOURCE_VERIFIED] dashboardViewByVportType.model.js:114-127 |
| 7 | `withVisibleCardKeys(view)` — filters card keys through `isDashboardCardEnabled(key)` release flags | [SOURCE_VERIFIED] dashboardViewByVportType.model.js:104-112 |
| 8 | `buildDashboardCards({ keys, handlers, isDesktop })` maps remaining keys to `{ key, title, body, onClick, locked }` | [SOURCE_VERIFIED] buildDashboardCards.model.js:118-139 |
| 9 | Cards with `getLocked`: `flyer` and `flyer_edit` are `locked: true` when `!isDesktop` | [SOURCE_VERIFIED] buildDashboardCards.model.js:19-27 |
| 10 | `cards.map(card => <DashboardCard ... />)` renders the grid | [SOURCE_VERIFIED] VportDashboardScreen.jsx:188-195 |

---

### BEH-DASHBOARD-SHELL-003 — Card Navigation Dispatch

Each card's `onClick` handler is a `useCallback`-memoized `navigate()` call. The shell navigates; it does not render card sub-module content inline.

| Handler | Target Route | Slug-Preferring | Evidence |
|---|---|---|---|
| openQr | `/profile/:slug/menu/qr` else `/actor/:actorId/menu/qr` | YES | [SOURCE_VERIFIED] VportDashboardScreen.jsx:50-55 |
| openFlyer | `/actor/:actorId/menu/flyer[?variant=table]` | NO | [SOURCE_VERIFIED] VportDashboardScreen.jsx:56-61 |
| openFlyerEditor | `/actor/:actorId/menu/flyer/edit` | NO | [SOURCE_VERIFIED] VportDashboardScreen.jsx:62 |
| openOnlineMenuPreview | `/profile/:slug/menu` else `/actor/:actorId/menu` | YES | [SOURCE_VERIFIED] VportDashboardScreen.jsx:63-68 |
| openExchangeRates | `/actor/:actorId/dashboard/exchange` | NO | [SOURCE_VERIFIED] VportDashboardScreen.jsx:69 |
| openServices | `/actor/:actorId/dashboard/services` | NO | [SOURCE_VERIFIED] VportDashboardScreen.jsx:70 |
| openReviews | `/actor/:actorId/dashboard/reviews` | NO | [SOURCE_VERIFIED] VportDashboardScreen.jsx:71 |
| openLeads | `/actor/:actorId/dashboard/leads` | NO | [SOURCE_VERIFIED] VportDashboardScreen.jsx:72 |
| openReviewsQr | `/profile/:slug/reviews/qr` else `/actor/:actorId/reviews/qr` | YES | [SOURCE_VERIFIED] VportDashboardScreen.jsx:73-78 |
| openTeam | `/actor/:actorId/dashboard/team` | NO | [SOURCE_VERIFIED] VportDashboardScreen.jsx:79 |
| openCalendar | `/actor/:actorId/dashboard/calendar` | NO | [SOURCE_VERIFIED] VportDashboardScreen.jsx:80 |
| openPortfolio | `/actor/:actorId/dashboard/portfolio` | NO | [SOURCE_VERIFIED] VportDashboardScreen.jsx:81 |
| openBookingHistory | `/actor/:actorId/dashboard/booking-history` | NO | [SOURCE_VERIFIED] VportDashboardScreen.jsx:82 |
| openLocksmith | `/actor/:actorId/dashboard/locksmith` | NO | [SOURCE_VERIFIED] VportDashboardScreen.jsx:83 |
| openGasPrices | `/actor/:actorId/dashboard/gas` | NO | [SOURCE_VERIFIED] VportDashboardScreen.jsx:84 |
| openAdsPipeline | `/ads/vport/:actorId` | NO | [SOURCE_VERIFIED] VportDashboardScreen.jsx:85 |
| openSettings | `/actor/:actorId/settings` | NO | [SOURCE_VERIFIED] VportDashboardScreen.jsx:86 |

**Slug-preferring pattern:** `slug` resolves from `dashboardDetails.slug` (normalized from the public VPORT profile). When slug is null or empty, falls back to raw `actorId` in the URL.

**Flyer variant:** `openFlyer` appends `?variant=table` when `normalizeVportType(identity?.vportType ?? dashboardDetails.vportType) === "restaurant"` — [SOURCE_VERIFIED] VportDashboardScreen.jsx:58-60.

---

### BEH-DASHBOARD-SHELL-004 — VPORT Banner Header Render

| Step | Behavior | Evidence |
|---|---|---|
| 1 | `useVportDashboardDetails(actorId)` fetches public VPORT profile via profiles adapter | [SOURCE_VERIFIED] VportDashboardScreen.jsx:25 |
| 2 | `normalizeDashboardVportDetails(publicDetails)` normalizes: name, slug, tagline, bannerUrl, avatarUrl, vportType, hours, address, highlights, etc. | [SOURCE_VERIFIED] dashboardVportDetails.model.js:185-235 |
| 3 | `VportBannerHeader({ profile, headerLoading })` renders banner image, avatar (72px square), display name, username, tagline | [SOURCE_VERIFIED] VportDashboardScreen.jsx:164 |
| 4 | While `headerLoading`: display name shows "Loading..." | [ARCHITECT_VERIFIED] ARCHITECTURE.md §4 |

---

### BEH-DASHBOARD-SHELL-005 — Desktop Portal Rendering

| Step | Behavior | Evidence |
|---|---|---|
| 1 | `isDesktop` from `useDesktopBreakpoint()` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:31 |
| 2 | When `isDesktop === true` and `typeof document !== 'undefined'`: renders content via `createPortal(content, document.body)` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:204-208 |
| 3 | Portal renders as fixed full-screen overlay: `position: fixed`, `inset: 0`, `z-index: 9999`, `overflow: auto`, `background: #000` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:206 |
| 4 | When `isDesktop === false`: renders content inline (no portal) | [SOURCE_VERIFIED] VportDashboardScreen.jsx:211 |

**Reason:** iOS stacking context workaround — avoids `position:fixed` rendering inside parent containers with `backdrop-filter`, `transform`, or `overflow:hidden` with `border-radius`. — [SOURCE_VERIFIED] BEHAVIOR.md §5 (prior ARCHITECT note), VportDashboardScreen.jsx comment.

---

### BEH-DASHBOARD-SHELL-006 — Ownership Re-Verification on Window Focus

| Step | Behavior | Evidence |
|---|---|---|
| 1 | After initial ownership check, `useVportOwnership` registers event listeners: `window.addEventListener("focus", onFocus)` and `document.addEventListener("visibilitychange", onVisibility)` | [SOURCE_VERIFIED] useVportOwnership.js:50-51 |
| 2 | On window focus OR `document.visibilityState === "visible"`: calls `checkVportOwnershipController` again | [SOURCE_VERIFIED] useVportOwnership.js:45-48 |
| 3 | Re-check does NOT set `ownershipLoading` — background refresh only | [SOURCE_VERIFIED] useVportOwnership.js:29, check(false) call |
| 4 | `isOwner` may change without loading state if ownership was revoked between focus events | [SOURCE_VERIFIED] useVportOwnership.js:32 |
| 5 | Listeners are removed on cleanup via effect return | [SOURCE_VERIFIED] useVportOwnership.js:53-56 |

---

## 7. Authorization / Ownership Rules

| Rule | Expected Behavior | Evidence |
|---|---|---|
| Supabase session required | Redirect to /login if no session | [ARCHITECT_VERIFIED] ProtectedRoute |
| Email verification required | VerifyEmailRequiredScreen if email not verified | [ARCHITECT_VERIFIED] ProtectedRoute |
| Legal consent required | ConsentGateScreen if consent not given | [ARCHITECT_VERIFIED] ProtectedRoute |
| Profile completeness required | CompleteProfileGate if profile incomplete | [ARCHITECT_VERIFIED] ProfileGatedOutlet |
| VPORT not blocked | Redirect to /vport/restore if `blockedVport=true` | [SOURCE_VERIFIED] appRoutes.redirects.jsx:40 |
| identity.actorId must match URL actorId | Redirect to /feed if mismatch | [SOURCE_VERIFIED] appRoutes.redirects.jsx:29-31 |
| Screen-level: useVportOwnership must resolve true | "You can only access the dashboard for your own vport" if isOwner=false | [SOURCE_VERIFIED] VportDashboardScreen.jsx:147 |
| Screen-level: identity must be present | "Sign in required" if !identity | [SOURCE_VERIFIED] VportDashboardScreen.jsx:146 |
| Self-access bypass: kind=vport + !is_void | VPORT-kind actor with callerActorId===targetActorId granted without actor_owners check | [SOURCE_VERIFIED] checkVportOwnership.controller.js:8-11 |
| isOwner is UI convenience only | All card sub-module mutations must independently verify ownership | [SOURCE_VERIFIED] useVportOwnership.js:4-10 |
| OwnerOnlyDashboardGuard is UI convenience only | Not the authoritative security boundary — controllers verify independently | [SOURCE_VERIFIED] appRoutes.redirects.jsx:14-21 |

---

## 8. Data Reads

| Read | Source File | Purpose | Timing | Evidence |
|---|---|---|---|---|
| Public VPORT profile | `useVportDashboardDetails(actorId)` via profiles.adapter | Banner header: name, slug, tagline, banner URL, avatar URL, vportType | On mount, before ownership resolves | [SOURCE_VERIFIED] VportDashboardScreen.jsx:25 |
| Session actor identity | `useIdentity()` → identityContext (global state) | Caller actorId, vportType for card preset | Synchronous from context, always available | [SOURCE_VERIFIED] VportDashboardScreen.jsx:24 |
| VPORT tab config | `useProfilesOps().getVportTabsByType` | Determines if "book" tab exists → calendar card injection | On mount (memoized on vportType) | [SOURCE_VERIFIED] VportDashboardScreen.jsx:36, :93 |
| Release flags | `isDashboardCardEnabled(key)` from `@/shared/config/releaseFlags` | Filters card keys to visible set | Synchronous, called in buildDashboardCards | [SOURCE_VERIFIED] dashboardViewByVportType.model.js:106 |
| Actor record | `getActorByIdDAL({ actorId: callerActorId })` via booking.adapter | Self-access bypass: actor.kind + actor.is_void | Within useVportOwnership async check | [SOURCE_VERIFIED] checkVportOwnership.controller.js:9 |
| actor_owners record | `assertActorOwnsVportActorController` via booking.adapter | Non-self ownership verification | Within useVportOwnership async check (non-self path) | [SOURCE_VERIFIED] checkVportOwnership.controller.js:12-15 |

---

## 9. Data Writes

No dashboard shell-level writes verified.

The shell dispatches navigation only. All mutations belong to card sub-modules.

---

## 10. UI States

| State | Trigger | Behavior | Evidence |
|---|---|---|---|
| No actorId | `actorId` is null/undefined from URL | Returns `null` (renders nothing) | [SOURCE_VERIFIED] VportDashboardScreen.jsx:144 |
| Loading | `identityLoading \|\| ownershipLoading` is true | Renders `<SkeletonCardList count={3} showBody={false} />` inside a padded div | [SOURCE_VERIFIED] VportDashboardScreen.jsx:145 |
| Not authenticated | `!identity` after loading | Renders "Sign in required." centered message | [SOURCE_VERIFIED] VportDashboardScreen.jsx:146 |
| Not owner | `!isOwner` after loading | Renders "You can only access the dashboard for your own vport." centered message | [SOURCE_VERIFIED] VportDashboardScreen.jsx:147 |
| Header loading | `headerLoading` from useVportDashboardDetails | VportBannerHeader shows loading placeholder for display name | [ARCHITECT_VERIFIED] ARCHITECTURE.md §4 |
| Success (desktop) | isOwner=true, isDesktop=true | Portal to document.body — fixed full-screen overlay (z-index 9999) | [SOURCE_VERIFIED] VportDashboardScreen.jsx:204-208 |
| Success (mobile) | isOwner=true, isDesktop=false | Renders inline content (no portal) | [SOURCE_VERIFIED] VportDashboardScreen.jsx:211 |
| Card locked | card.locked=true | `DashboardCard` renders with locked state — flyer/flyer_edit locked on mobile | [SOURCE_VERIFIED] buildDashboardCards.model.js:19-27 |

---

## 11. Module Handoffs

| Child Module | Trigger | Route / Link | Evidence |
|---|---|---|---|
| QR Code | openQr card click | `/profile/:slug/menu/qr` or `/actor/:actorId/menu/qr` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:50-55 |
| Flyer View | openFlyer card click | `/actor/:actorId/menu/flyer[?variant=table]` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:56-61 |
| Flyer Editor | openFlyerEditor card click | `/actor/:actorId/menu/flyer/edit` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:62 |
| Menu Preview | openOnlineMenuPreview card click | `/profile/:slug/menu` or `/actor/:actorId/menu` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:63-68 |
| Exchange Rates | openExchangeRates card click | `/actor/:actorId/dashboard/exchange` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:69 |
| Services | openServices card click | `/actor/:actorId/dashboard/services` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:70 |
| Reviews | openReviews card click | `/actor/:actorId/dashboard/reviews` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:71 |
| Leads | openLeads card click | `/actor/:actorId/dashboard/leads` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:72 |
| Reviews QR | openReviewsQr card click | `/profile/:slug/reviews/qr` or `/actor/:actorId/reviews/qr` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:73-78 |
| Team | openTeam card click | `/actor/:actorId/dashboard/team` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:79 |
| Calendar | openCalendar card click | `/actor/:actorId/dashboard/calendar` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:80 |
| Portfolio | openPortfolio card click | `/actor/:actorId/dashboard/portfolio` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:81 |
| Bookings | openBookingHistory card click | `/actor/:actorId/dashboard/booking-history` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:82 |
| Locksmith Manager | openLocksmith card click | `/actor/:actorId/dashboard/locksmith` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:83 |
| Gas Prices | openGasPrices card click | `/actor/:actorId/dashboard/gas` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:84 |
| Ads Pipeline | openAdsPipeline card click | `/ads/vport/:actorId` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:85 |
| Settings | openSettings card click | `/actor/:actorId/settings` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:86 |
| Back navigation | VportBackButton click | `/profile/:actorId` | [SOURCE_VERIFIED] VportDashboardScreen.jsx:49 |

All handoffs are imperative `useNavigate` calls — no route link components used.

---

## 12. Failure Paths

| Failure | Result | Evidence |
|---|---|---|
| actorId absent from URL | Returns null (no render) | [SOURCE_VERIFIED] VportDashboardScreen.jsx:144 |
| checkVportOwnershipController throws | catch → `setIsOwner(false)` (fail-closed) | [SOURCE_VERIFIED] useVportOwnership.js:33-34 |
| callerActorId or targetActorId is null | `isOwner=false`, `ownershipLoading=false` immediately | [SOURCE_VERIFIED] useVportOwnership.js:19-22 |
| Identity not yet loaded | SkeletonCardList — waits for identityLoading=false | [SOURCE_VERIFIED] VportDashboardScreen.jsx:145 |
| actor.kind !== 'vport' (self-access path) | Self-access bypass not granted; falls through to actor_owners check | [SOURCE_VERIFIED] checkVportOwnership.controller.js:10 |
| actor.is_void === true (self-access path) | Self-access bypass not granted; returns false | [SOURCE_VERIFIED] checkVportOwnership.controller.js:10 |
| VPORT actor blocked (blockedVport=true) | BlockedVportGuard redirects to /vport/restore | [SOURCE_VERIFIED] appRoutes.redirects.jsx:40 |
| identity.actorId !== URL actorId | OwnerOnlyDashboardGuard redirects to /feed | [SOURCE_VERIFIED] appRoutes.redirects.jsx:29-31 |
| Unauthenticated (no session) | ProtectedRoute redirects to /login | [ARCHITECT_VERIFIED] |
| Card key not in CARD_CATALOG | `getDashboardCardMetaByKey` returns null → `.filter(Boolean)` removes it | [SOURCE_VERIFIED] buildDashboardCards.model.js:123-138 |
| handler undefined for card key | `card.onClick` is `undefined` — card renders but click has no effect | [SOURCE_VERIFIED] buildDashboardCards.model.js:128, :133 |
| No cards after release flag filter | Empty card grid renders (no error state defined) | [SOURCE_VERIFIED] withVisibleCardKeys + buildDashboardCards |

---

## 13. Unknown / Unverified Behavior

| Behavior | Reason | Classification |
|---|---|---|
| `useOwnerQuickStats` consumer | Hook file exists in module directory but not called from VportDashboardScreen.jsx — consumer unknown | [UNKNOWN] |
| `identity.blockedVport` field definition | `BlockedVportGuard` checks this field; its origin in identityContext and what triggers it to true was not traced | [UNKNOWN] |
| `useVportDashboardDetails` internals | Called via deep profiles adapter path; data fetching, caching, and error handling are outside shell scope | [UNKNOWN] |
| QR code URL encoding | Shell navigates to `/actor/:actorId/menu/qr`; whether the QR generation page encodes raw actorId or slug into the QR code is in the QR sub-module, not the shell | [UNKNOWN] |
| Release flag values at runtime | `isDashboardCardEnabled(key)` is called synchronously but the flag values in `@/shared/config/releaseFlags` were not read in this run | [UNKNOWN] |

---

## 14. Behavior Coverage Summary

| Area | Status | Notes |
|---|---|---|
| Route entry behavior | VERIFIED | Full 4-layer guard chain confirmed from source |
| Identity / ownership behavior | VERIFIED | 4-guard chain + screen-level hook + controller logic all traced |
| Screen composition behavior | VERIFIED | VportDashboardScreen fully read; card catalog and view presets confirmed |
| Navigation behavior | VERIFIED | All 17 card navigation handlers confirmed from source |
| Data loading behavior | VERIFIED | 6 shell-level reads identified and traced to source |
| Permission behavior | VERIFIED | 9 permission rules identified and sourced |
| Module handoff behavior | VERIFIED | All 17 card sub-module handoffs documented |
| Failure behavior | VERIFIED | 12 failure paths documented from source |
| Desktop portal behavior | VERIFIED | createPortal logic and trigger condition confirmed |
| Ownership re-verify behavior | VERIFIED | focus/visibilitychange re-check confirmed |
| Quick stats behavior | UNKNOWN | Hook in module but not called from primary screen |
| Release flag behavior | PARTIAL | Filtering logic confirmed; runtime flag values not checked |
| blockedVport field semantics | UNKNOWN | Guard uses field but origin not traced |

---

*Behavior contract reverse-engineered from source — TICKET-ARCHITECT-BEHAVIOR-REVERSE-0001 — 2026-06-05*
*Replaced prior STUB (content was placeholder) — now ACTIVE*
