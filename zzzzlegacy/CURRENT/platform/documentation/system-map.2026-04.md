# VCSM Workspace — System Map

**Generated:** 2026-04-12
**Scanned Roots:** apps/VCSM, apps/wentrex, engines/

---

## 1. Application Boundaries

### VCSM Application
**Path:** `apps/VCSM/`
**Product:** Social marketplace hybrid (Instagram + Airbnb)
**Stack:** React 19, Vite, Supabase, Zustand, UnoCSS

Features:
- auth (login, register, reset, onboarding)
- feed (central feed, post pipeline)
- post (post detail, comments, reactions, roses, mentions)
- profiles (citizen + vport actor profiles, social graph)
- chat (engine-backed messaging via @chat)
- notifications (bell badge, notification list, per-kind renderers)
- booking (resource scheduling, availability, calendar)
- moderation (reports, blocks, actions)
- explore (actor search, directory)
- upload (post creation, media compression)
- social (follows, friend requests, privacy, subscriptions)
- wanders (async postcards/mailbox system)
- legal (consent, terms, privacy policy)
- settings (account, profile, privacy, vport settings)
- dashboard (vport owner dashboards — gas, reviews, services, portfolio, etc.)
- professional (briefings, workspace access)
- vport (vport creation, service catalog)
- learning (embedded LMS — student/teacher/parent/admin)
- public (public vport menus, QR, flyers)
- void (void screen)
- ads (vport ads settings)

Dev Tooling:
- debuggers/ (identity, feed, global, actor-switch, performance)
- dev/diagnostics (DevDiagnosticsScreen, 30+ diagnostic groups)

### Wentrex Application
**Path:** `apps/wentrex/`
**Product:** Standalone multi-tenant LMS SaaS
**Stack:** React, Vite, Supabase

Features:
- auth (login, password reset/update)
- identity (WentrexIdentityContext, provisioning, resolver)
- actors (actor summaries DAL)
- communication (chat engine adapter, inbox, conversation)
- moderation (report/spam adapters)
- block (block confirm adapter)
- services (supabase client, cloudflare upload)
- learning/administration (full LMS — 60+ DALs, 50+ controllers, courses, assignments, grades, memberships, organizations, realms)

---

## 2. Engine Boundaries

### Implemented Engines

| Engine | Path | Schema | DALs | Controllers | Services |
|--------|------|--------|------|-------------|----------|
| **Chat** | engines/chat/ | chat.* | 27 | 29 | 9 |
| **Identity** | engines/identity/ | platform.* | 10 | 3 | 7 |
| **Hydration** | engines/hydration/ | — (cross-schema) | 1 | 1 | 0 |
| **Reviews** | engines/reviews/ | reviews.* | 7 | 6 | 3 |
| **Portfolio** | engines/portfolio/ | vc.vport_portfolio_* | 7 | 8 | 1 |
| **Notifications** | engines/notifications/ | notification.* | 11 | 4 | 4 |

### Not Yet Implemented
- engines/booking/ (stub)
- engines/feed/ (stub)

---

## 3. Dependency Direction

```
apps/VCSM     ──┐
                ├──→ engines/ ──→ (database schemas)
apps/wentrex  ──┘

Apps depend on engines via Vite aliases:
  @identity  → engines/identity/index.js
  @hydration → engines/hydration/index.js
  @chat      → engines/chat/index.js
  @reviews   → engines/reviews/index.js
  @portfolio → engines/portfolio/index.js
  @notifications → engines/notifications/index.js
  @debuggers → debuggers/

Engines NEVER import from apps.
Engines NEVER import from each other.
Apps NEVER import from each other.
```

---

## 4. Shared Infrastructure

| Layer | Path | Purpose |
|-------|------|---------|
| Debuggers | debuggers/ | Dev-only panels (identity, feed, global, actor-switch, performance) |
| Shared | shared/ | Domain-neutral primitives (UI, utils, types) — currently minimal |
| Contract | contract/ | Architecture contracts (security, senior dev, anti-hallucination, ops, strategy) |
| Logan | logan/ | System documentation (40+ files) |
| Planning | planning/ | TP task planning (session-scoped) |

---

## 5. Database Schema Families

| Schema | Owner | Purpose |
|--------|-------|---------|
| vc.* | VCSM app | Posts, profiles, follows, vports, booking, notifications (legacy) |
| public.* | Auth/Supabase | Auth-linked profiles |
| platform.* | Identity engine | Shared identity state (apps, accounts, actor links, preferences) |
| chat.* | Chat engine | Conversations, messages, inbox entries |
| reviews.* | Reviews engine | Review dimensions, reviews, ratings, revisions |
| notification.* | Notifications engine | Events, recipients, rendered, inbox, delivery, preferences, templates |
| moderation.* | VCSM app (neutral schema) | Reports, actions, blocks, block events |
| wanders.* | VCSM app | Postcards, mailbox items, replies |
| learning.* | VCSM app (embedded LMS) | Courses, lessons, assignments, submissions, grades, realms |
| auth.* | Supabase managed | Users, sessions |

---

## 6. DI Configuration Pattern

All engines follow the same DI pattern:

```javascript
// Engine setup (called once at app startup):
configure[Engine]Engine({
  supabaseClient,           // required (always)
  // App-specific resolvers:
  resolveAppContext,         // identity
  resolveRecipients,         // notifications
  isActorOwner,              // reviews, portfolio
  resolveActorCard,          // reviews, notifications
  getActorSummariesByIds,    // chat
  debugReporter,             // all (optional)
})
```

**VCSM setup files:**
- `src/features/identity/setup.js` → configureIdentityEngine
- `src/features/chat/setup.js` → configureChatEngine
- `src/features/reviews/setup.js` → configureReviewsEngine
- `src/features/portfolio/setup.js` → configurePortfolioEngine
- (notifications engine not yet wired into VCSM app)

**Wentrex setup files:**
- `src/features/identity/setup.js` → configureIdentityEngine
- `src/features/communication/setup.js` → configureChatEngine
