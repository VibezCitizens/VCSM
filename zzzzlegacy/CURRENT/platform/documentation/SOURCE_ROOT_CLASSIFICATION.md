# VCSM Source Root Classification

**Generated:** 2026-06-02  
**Source of truth:** `apps/VCSM/src/` — verified against actual filesystem  
**Purpose:** Canonical seed for the CURRENT/ documentation system. Every source root appears exactly once.  
**Scope:** VCSM only. Wentrex and Traffic are separate products — never classified here.

---

## Classification Legend

| Code | Meaning |
|---|---|
| `FEATURE` | Product-facing user capability with its own domain logic, screens, and data layer |
| `PLATFORM` | Foundational infrastructure consumed by features — not directly user-visible |
| `SHARED_INFRA` | Domain-neutral primitives (UI, hooks, utils, constants) — no business logic ownership |
| `SERVICE` | External service integrations and third-party SDK wrappers |
| `STATE` | Global runtime state management (Zustand stores, React Query slices) |
| `STYLE` | CSS and theme files — no logic |
| `DO_NOT_DOCUMENT_AS_FEATURE` | Dev tooling, build scripts, static assets, or stubs — never shipped as product |

---

## Documentation Folder Roots

```
CURRENT/
├── features/      — One subfolder per FEATURE
├── platform/      — One subfolder per PLATFORM area
├── shared/        — One subfolder per SHARED_INFRA area
├── services/      — One subfolder per SERVICE integration
├── state/         — One subfolder per STATE domain
└── styles/        — One entry for the global style system
```

---

## Classification Table

> Sorted: PLATFORM and DO_NOT_DOCUMENT entries grouped at bottom.  
> `features/` prefix = path lives under `apps/VCSM/src/features/`. All others are direct children of `apps/VCSM/src/`.

### Group A — FEATURE

| Source Root | Classification | Documentation Folder | Reason | Owner Command | Priority |
|---|---|---|---|---|---|
| `features/ads` | FEATURE | `CURRENT/features/ads/` | Advertising system — widgets, sponsored content, use-cases, API layer. User-visible ad surface with its own dal/model/screens. | IRONMAN | P3 |
| `features/block` | FEATURE | `CURRENT/features/block/` | User and content blocking — trust boundary protection. Has adapters, controllers, dal, guards, hooks, ui. | VENOM | P2 |
| `features/booking` | FEATURE | `CURRENT/features/booking/` | Booking engine — core service reservation flow. High-security write surface. Has adapters, components, controller, dal, hooks, model, screens. | VENOM | P0 |
| `features/chat` | FEATURE | `CURRENT/features/chat/` | Real-time messaging — conversation, inbox, store, styles. Direct user communication surface. | VENOM | P1 |
| `features/dashboard` | FEATURE | `CURRENT/features/dashboard/` | Dashboard system — VPORT cards, flyerBuilder (including designStudio), qrcode, shared components. Owner-only management surface. | ARCHITECT | P1 |
| `features/explore` | FEATURE | `CURRENT/features/explore/` | Discovery and search — controller, dal, hooks, model, screens, usecases, ui. User browsing and content discovery. | ARCHITECT | P2 |
| `features/feed` | FEATURE | `CURRENT/features/feed/` | Content feed pipeline — adapters, components, controllers, dal, hooks, model, pipeline, queries, screens. Core social feed surface. | ARCHITECT | P1 |
| `features/invite` | FEATURE | `CURRENT/features/invite/` | Invite token issuance and acceptance — controller, dal, hooks, screens. Shares DAL with features/join. Trust artifact lifecycle. | VENOM | P1 |
| `features/join` | FEATURE | `CURRENT/features/join/` | VPORT onboarding join flow — QR and account-based barbershop join, joinInvite.dal.js. Ownership-establishment surface. Active on current branch. | VENOM | P1 |
| `features/legal` | FEATURE | `CURRENT/features/legal/` | Legal agreements and consent tracking — controllers, dal, engine, hooks, screens, docs, config. Compliance-critical. | SENTRY | P2 |
| `learning` | FEATURE | `CURRENT/features/learning/` | Embedded LMS (VCSM `/learning` route) — full MVC: adapters, components, controller, dal, hooks, layout, model, routes, screens, styles, utils. NOT Wentrex. Roles: admin, teacher, student, parent. | ARCHITECT | P2 |
| `features/moderation` | FEATURE | `CURRENT/features/moderation/` | Content moderation and trust safety — adapters, components, controllers, dal, hooks, models, types. User-report and review-queue surface. | VENOM | P1 |
| `features/notifications` | FEATURE | `CURRENT/features/notifications/` | Push and in-app notification system — adapters, inbox, runtime, screen, styles, types. | ARCHITECT | P2 |
| `features/onboarding` | FEATURE | `CURRENT/features/onboarding/` | New user onboarding flow — adapters, components, controller, dal, hooks, model, screens. First-run user experience. | ARCHITECT | P2 |
| `features/portfolio` | FEATURE | `CURRENT/features/portfolio/` | Portfolio management — minimal state (directory stub; no subdirectories confirmed on disk). Verify before full coverage. | ARCHITECT | P3 |
| `features/post` | FEATURE | `CURRENT/features/post/` | Post creation and display — adapters, commentcard, postcard, screens, styles. Core social content surface. | ARCHITECT | P1 |
| `features/professional` | FEATURE | `CURRENT/features/professional/` | Professional vertical — briefings, enterprise data/hooks/model/ui, professional-nurse (facility, housing, screens), core config/storage, screens. Targets professional role types. | ARCHITECT | P3 |
| `features/profiles` | FEATURE | `CURRENT/features/profiles/` | Profile system — adapters, controller, dal, debug, hooks, kinds (vport), model, screens, styles, ui. Core identity display for all actor kinds. | ARCHITECT | P1 |
| `features/public` | FEATURE | `CURRENT/features/public/` | Unauthenticated public surfaces — vportBusinessCard (full MVC), vportMenu (full MVC), screens. Zero auth required. | VENOM | P1 |
| `features/reviews` | FEATURE | `CURRENT/features/reviews/` | Reviews system — minimal state (setup.js stub only; no subdirectories). Verify whether this is a scaffold placeholder or live feature. | ARCHITECT | P3 |
| `features/settings` | FEATURE | `CURRENT/features/settings/` | User and VPORT settings — account, adapters, privacy, profile, queries, screen, sponsored, styles, ui, vports. Write-heavy mutation surface. | VENOM | P1 |
| `features/social` | FEATURE | `CURRENT/features/social/` | Social graph — friend requests, subscriptions (follow), privacy controls. Has adapters, components, friend (request, subscribe), privacy (controllers, dal, hooks). | VENOM | P2 |
| `features/vgrid` | FEATURE | `CURRENT/features/vgrid/` | Virtual grid content browser — adapters, api, dal, hooks, lib, model, screens, ui, usecases. Content browsing layout feature. | ARCHITECT | P3 |
| `features/void` | FEATURE | `CURRENT/features/void/` | Void Realm — 18+ anonymous-but-DB-tracked content realm. System posts (fuel price, menu) must stay in public realm. Adapters, api, dal, hooks, lib, model, screens, ui, usecases. | VENOM | P2 |
| `features/vport` | FEATURE | `CURRENT/features/vport/` | Core VPORT identity and management — adapters, components, controller, dal, hooks, model, public, screens, utils. Foundation for all VPORT surfaces. | ARCHITECT | P0 |
| `features/wanderex` | FEATURE | `CURRENT/features/wanderex/` | WanderEx feature — components, dal, hooks, model, screens, styles. Purpose to be confirmed by ARCHITECT. | ARCHITECT | P3 |
| `features/wanders` | FEATURE | `CURRENT/features/wanders/` | Wanders feature — large: adapters (services), components (cardstemplates, model), controllers, core (adapters, controllers, dal, hooks), dal, hooks, lib, model, models, screens, services, utils. | ARCHITECT | P2 |

---

### Group B — PLATFORM

| Source Root | Classification | Documentation Folder | Reason | Owner Command | Priority |
|---|---|---|---|---|---|
| `app` | PLATFORM | `CURRENT/platform/app-shell/` | App shell — guards, layout, providers, routes (learning, protected, public), platform/ios config. Entry point scaffolding; all routes registered here. | ARCHITECT | P0 |
| `bootstrap` | PLATFORM | `CURRENT/platform/bootstrap/` | App startup — bootstrap.hydrate.controller.js, bootstrap.invalidate.js, bootstrap.selectors.js, bootstrap.store.js. Initializes state and hydration on app load. | ARCHITECT | P0 |
| `features/actors` | PLATFORM | `CURRENT/platform/actors/` | Actor identity abstraction layer — adapters, controllers, dal, model. The actor system underlies all identity operations. Separate from state/actors (Zustand slice). | ARCHITECT | P0 |
| `features/auth` | PLATFORM | `CURRENT/platform/auth/` | Authentication and session management — adapters, components, controllers, dal, hooks, model, screens, styles, ui, usecases. Foundational to all surfaces. | VENOM | P0 |
| `features/hydration` | PLATFORM | `CURRENT/platform/hydration/` | Data hydration setup — setup.js + vcsmActorHydrator.js. Bootstraps actor hydration on app load. Minimal but critical platform initializer. | ARCHITECT | P1 |
| `features/identity` | PLATFORM | `CURRENT/platform/identity/` | Identity resolution — adapters, controller, dal, hooks, resolvers. The canonical source of "who is the current viewer." All ownership gates depend on this. | ARCHITECT | P0 |
| `features/media` | PLATFORM | `CURRENT/platform/media/` | Media management infrastructure — adapters, controller, dal, model. Consumed by upload, portfolio, profiles, flyer-builder. Not a standalone user-facing feature. | ARCHITECT | P2 |
| `features/upload` | PLATFORM | `CURRENT/platform/upload/` | File upload infrastructure — adapters, api, controller, controllers, dal, hooks, lib, model, screens, styles, ui. Shared upload pipeline consumed by portfolio, media, flyer-builder. | VENOM | P2 |
| `platform` | PLATFORM | `CURRENT/platform/i18n-platform/` | Platform-level i18n configuration — platform/i18n/. Separate from src/i18n translation content. Configuration only. | ARCHITECT | P2 |

---

### Group C — SHARED_INFRA

| Source Root | Classification | Documentation Folder | Reason | Owner Command | Priority |
|---|---|---|---|---|---|
| `features/debug` | SHARED_INFRA | `CURRENT/shared/debug/` | Debug UI components — components/ only. Runtime debug rendering primitives. Not a product feature; not dev-only (different from src/dev). | ARCHITECT | P4 |
| `features/ui` | SHARED_INFRA | `CURRENT/shared/ui/` | UI primitives — modern/ subdirectory. Design system components consumed across features. No business logic. | ARCHITECT | P2 |
| `i18n` | SHARED_INFRA | `CURRENT/shared/i18n/` | Translation strings — en/, es/, setup.js. User-facing copy for English and Spanish. Bilingual platform; Spanish supplied directly by owner (no translation tooling). | LOGAN | P2 |
| `queries` | SHARED_INFRA | `CURRENT/shared/queries/` | React Query infrastructure — queryClient.js, queryKeys.js. Shared query registry consumed by all features. | ARCHITECT | P2 |
| `season` | SHARED_INFRA | `CURRENT/shared/season/` | Seasonal theme system — index.js, themes/ (ChristmasTheme, DefaultTheme). Date-activated theme overlays. Low impact. | ARCHITECT | P4 |
| `shared` | SHARED_INFRA | `CURRENT/shared/` | Domain-neutral primitives — components, config, constants, hooks, lib (language), styles, themes, ui, utils. Consumed everywhere; owns no domain logic. | ARCHITECT | P2 |

---

### Group D — SERVICE

| Source Root | Classification | Documentation Folder | Reason | Owner Command | Priority |
|---|---|---|---|---|---|
| `services` | SERVICE | `CURRENT/services/` | External service integrations — cloudflare (edge), monitoring (error tracking), onesignal (push), supabase (DB/auth client). Third-party SDK wrappers and configuration. | VENOM | P0 |

---

### Group E — STATE

| Source Root | Classification | Documentation Folder | Reason | Owner Command | Priority |
|---|---|---|---|---|---|
| `state` | STATE | `CURRENT/state/` | Global runtime state — actors/ (Zustand actor store), identity/ (controller + queries), social/. Three domain Zustand slices. Separate from features/actors (which owns the data layer). | ARCHITECT | P1 |

---

### Group F — STYLE

| Source Root | Classification | Documentation Folder | Reason | Owner Command | Priority |
|---|---|---|---|---|---|
| `styles` | STYLE | `CURRENT/styles/` | Global CSS — citizens-theme.css, global.css. App-level theme and reset. No logic; documentation is low-value beyond a brief inventory. | LOGAN | P4 |

---

### Group G — DO_NOT_DOCUMENT_AS_FEATURE

| Source Root | Classification | Documentation Folder | Reason | Owner Command | Priority |
|---|---|---|---|---|---|
| `assets` | DO_NOT_DOCUMENT_AS_FEATURE | — | Static assets only — fonts/, icons/, images/. No business logic; no documentation value. Reference by path in other docs. | — | P5 |
| `debuggers-stub` | DO_NOT_DOCUMENT_AS_FEATURE | — | Dev-only debugger stub shim. CLAUDE.md explicitly lists debuggers/ as "never ship to production." Zero coverage value. | — | P5 |
| `dev` | DO_NOT_DOCUMENT_AS_FEATURE | — | Dev diagnostics tooling — diagnostics/, groups/, helpers/, ui/, runAllDiagnostics.js. Modified on current branch for dev use only. Never ships to production per CLAUDE.md. | — | P5 |
| `screens` | DO_NOT_DOCUMENT_AS_FEATURE | — | Contains only DevDiagnosticsScreen.jsx — a single dev-only diagnostic screen. Not a product screen collection. No coverage needed. | — | P5 |
| `scripts` | DO_NOT_DOCUMENT_AS_FEATURE | — | Build and utility scripts — index.js, load/. Dev/build tooling, not product code. | — | P5 |

---

## Summary Counts

| Classification | Count | Notes |
|---|---|---|
| FEATURE | 27 | All require ARCHITECT or VENOM as first command |
| PLATFORM | 9 | All P0–P2; foundational — document before features that depend on them |
| SHARED_INFRA | 6 | Document after PLATFORM; referenced by all features |
| SERVICE | 1 | `services/` covers all 4 external integrations (cloudflare, monitoring, onesignal, supabase) |
| STATE | 1 | 3 domain slices under one root |
| STYLE | 1 | Low documentation value; CSS only |
| DO_NOT_DOCUMENT_AS_FEATURE | 5 | assets, debuggers-stub, dev, screens, scripts |
| **Total** | **50** | Every source root appears exactly once |

---

## Notes on Special Cases

### features/hydration vs bootstrap/
`features/hydration` provides the actor hydration logic (vcsmActorHydrator.js). `bootstrap/` provides the app startup sequence that calls it. They are distinct PLATFORM concerns; document separately.

### features/actors vs state/actors
`features/actors` owns the data layer (adapters, controllers, dal, model). `state/actors` owns the Zustand slice (runtime state). Both are PLATFORM. They are complementary, not duplicates.

### features/identity vs features/auth
`features/auth` = session management, login/logout, auth state. `features/identity` = resolves who the current viewer is given an auth session. Identity depends on auth; auth does not depend on identity.

### learning (src/learning)
This is the VCSM embedded `/learning` route — a distinct embedded LMS within the social platform. It is NOT Wentrex. Wentrex is a separate standalone LMS SaaS product in `apps/wentrex/`. Do not conflate them. VCSM learning supports roles: administration, teacher, student, parent. Document only under `CURRENT/features/learning/`.

### features/reviews — minimal state warning
`features/reviews/` contains only `setup.js`. Before creating full documentation coverage, confirm whether this is a live feature with logic in engines/ or a placeholder for upcoming work.

### features/portfolio — minimal state warning
`features/portfolio/` has no visible subdirectories from inspection. Verify before documenting as a full feature. Portfolio logic may live in `engines/portfolio/` with only a thin app-layer stub here.

### platform/ (src/platform)
`src/platform/` contains only `platform/i18n/` — platform-level i18n configuration. This is separate from `src/i18n/` (translation content strings). Document them as two separate CURRENT/ entries: `CURRENT/platform/i18n-platform/` and `CURRENT/shared/i18n/`.

### void realm rule
`features/void` is the 18+ anonymous-but-DB-tracked realm. System posts (fuel price submissions, menu updates) must always use `resolvePublicRealmIdDAL()` and must never be assigned to the void realm. Document this constraint prominently in `CURRENT/features/void/`.

---

## Recommended Documentation Build Order

Priority stack for creating CURRENT/ documentation folders:

**Phase 1 — Platform foundation (do first; everything depends on these):**
app → auth → identity → actors → bootstrap → services → state → hydration

**Phase 2 — High-risk product features (security audit backlog):**
booking → vport → public → settings → join → invite → social → moderation → void

**Phase 3 — Core social features:**
feed → profiles → post → chat → notifications → explore

**Phase 4 — Supporting features:**
dashboard → upload → media → onboarding → legal → block → learning → wanders

**Phase 5 — Shared infra and verticals:**
shared → ui → i18n → queries → ads → professional → vgrid → reviews → portfolio → wanderex

**Phase 6 — Styling and low-priority:**
season → styles → debug

**Phase 7 — DO NOT DOCUMENT (no action needed):**
assets → debuggers-stub → dev → screens → scripts
