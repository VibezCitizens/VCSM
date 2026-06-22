# REPOSITORY ARCHITECTURE INTERPRETATION

**Generated:** 2026-04-12
**Analyst:** Wolverine (principal architecture review)
**Scope:** Full repository — all roots, all engines, all contracts

---

## 1. Executive Summary

This repository implements a **multi-application platform with engine-driven shared infrastructure and programmatic SEO acquisition**. Three applications serve distinct purposes: VCSM (social marketplace), Wentrex (multi-tenant LMS), and Traffic (SEO directory engine). A shared engine layer provides domain-neutral capabilities (identity, chat, reviews, portfolio, notifications, hydration). A governance layer of 14 AI commands, 11 architecture contracts, and a structured documentation system (Logan) enforces engineering discipline at scale.

The system is architecturally mature: clean app isolation, proper dependency direction (apps → engines → shared), consistent DAL → Model → Controller → Hook → Screen layering, and 22 TTL caches reducing database load. Key remaining gaps: feed still has optimization headroom, notification engine not yet wired into the app, and Traffic app is early-stage scaffold.

---

## 2. Architecture Type

**Engine-Driven Multi-Application Platform**

This is not a simple monorepo. The signals indicate a deliberate platform architecture:

| Signal | Evidence |
|--------|----------|
| Shared engines with DI | 6 engines (identity, chat, reviews, portfolio, notifications, hydration) — all use `configure[Engine]()` pattern |
| App isolation boundary | `apps/VCSM` and `apps/wentrex` never import from each other, enforced by contract |
| Dependency direction locked | `apps → engines → shared` — no reverse, verified by ARCHITECT scan (0 violations) |
| Multi-domain schema | 10 PostgreSQL schemas: `vc`, `platform`, `chat`, `reviews`, `notification`, `moderation`, `wanders`, `learning`, `auth`, `public` |
| Acquisition layer | Traffic app generates SEO-indexable pages routing discovery into the core platform |
| Governance-as-code | 14 commands, 11 contracts, immutable engine audits, prompt provenance registry |

**Architecture evolution path:** Currently engine-driven. Trending toward **capability-based architecture** where engines become first-class platform capabilities consumed by any application.

---

## 3. Application Roles

### VCSM — Social Marketplace Platform
- **Stack:** React 19, Vite, Supabase, Zustand, UnoCSS
- **Identity:** Actor-based (`actorId` + `kind`) — users and vports (business storefronts)
- **Features:** 34 feature modules — feed, profiles, chat, notifications, booking, social graph, wanders, learning (embedded LMS), portfolio, reviews, explore, upload, moderation, dashboard, ads, legal consent
- **Scale:** 187 DAL files, 235 files with `.from()` calls, 22 TTL caches
- **Role:** The primary consumer product. Instagram meets Airbnb with creator/business identity system.

### Wentrex — Multi-Tenant LMS SaaS
- **Stack:** React, Vite, Supabase
- **Identity:** Membership/role-based per realm (student, teacher, parent, admin, super admin)
- **Features:** 8 feature modules — auth, identity, actors, communication (chat adapter), moderation, block, services, learning/administration (60+ DALs)
- **Multi-tenancy:** Realm-scoped queries, RLS per tenant
- **Role:** Standalone education product. Shares identity and chat engines with VCSM but has completely separate domain model.

### Traffic — SEO Acquisition Engine
- **Stack:** Next.js, TypeScript (separate from VCSM/Wentrex stack rules)
- **Architecture:** Programmatic SEO directory — generates indexable city/service/neighborhood/provider pages
- **Data model:** Cities, neighborhoods, services, specialties, providers, price aggregates, provider stats
- **URL structure:** `/{city}`, `/{city}/{service}`, `/{city}/{neighborhood}/{service}`, `/{city}/{neighborhood}/{service}/{specialty}`, `/pro/{provider}`
- **Quality guards:** Minimum provider thresholds before pages become indexable
- **Current state:** Scaffold with mock data connector. No live database integration yet.
- **Role:** Top-of-funnel acquisition. Routes organic search traffic into the VCSM ecosystem. Providers listed here map to VCSM vports.

### App Interaction Model

```
Traffic (SEO) ──discovery──→ VCSM (marketplace) ←──shared engines──→ Wentrex (LMS)
     │                            │                                        │
     └── indexable pages           ├── engines/identity                     ├── engines/identity
                                   ├── engines/chat                        └── engines/chat
                                   ├── engines/reviews
                                   ├── engines/portfolio
                                   ├── engines/notifications
                                   └── engines/hydration
```

---

## 4. Engine System

**6 implemented engines forming a shared platform layer:**

| Engine | Schema | DALs | Controllers | DI Dependencies | Consuming Apps |
|--------|--------|------|-------------|----------------|---------------|
| Identity | platform.* | 10 | 3 | supabaseClient, resolveAppContext, debugReporter | VCSM, Wentrex |
| Chat | chat.* | 27 | 29 | supabaseClient, getActorSummariesByIds, resolveRealm, 8+ others | VCSM, Wentrex |
| Reviews | reviews.* | 7 | 6 | supabaseClient, isActorOwner, resolveActorCard | VCSM |
| Portfolio | vc.vport_portfolio_* | 7+ | 8 | supabaseClient, isActorOwner | VCSM |
| Notifications | notification.* | 11 | 4 | supabaseClient, resolveRecipients, resolveActorCard | Not yet wired |
| Hydration | vc (RPC) | 1 | 1 | supabaseClient, getHydrator | VCSM |

**Engine architecture model:**
- Each engine owns its database schema exclusively
- Public API via `adapters/index.js` only — no deep imports
- DI config via `configure[Engine]Engine()` — apps inject supabase client + domain resolvers
- Domain events via `events.js` — engine emits, apps subscribe
- Immutable versioned audits in `engines/[name]/docs/`

**Engine maturity:** Chat is the most mature (27 DALs, 29 controllers, hooks, models, services). Notifications engine is structurally complete but not yet integrated into VCSM app (Slice 4 pending).

---

## 5. Layer Model

```
Database (Supabase PostgreSQL)
  │
  ├─ DAL (Data Access Layer)
  │   • Raw Supabase queries only
  │   • Explicit column selection (never .select('*'))
  │   • One responsibility per function
  │   • Schema-scoped (vc.*, chat.*, notification.*, etc.)
  │
  ├─ Model
  │   • Pure row → domain object transforms
  │   • No side effects
  │   • snake_case → camelCase mapping
  │
  ├─ Controller
  │   • Business logic orchestration
  │   • Calls DALs, composes results
  │   • Validates inputs
  │   • Emits domain events
  │
  ├─ Service (engines only)
  │   • Shared logic used by multiple controllers
  │   • Domain rules (preference evaluation, template rendering)
  │
  ├─ Adapter (cross-feature/engine boundary)
  │   • Re-exports safe public API
  │   • Prevents deep coupling
  │
  ├─ Hook
  │   • React lifecycle management
  │   • Calls controllers
  │   • Manages loading/error/data states
  │
  ├─ Component
  │   • Presentational UI
  │   • Receives data via props
  │
  └─ Screen
      • Pure composition
      • No computation
      • No direct DB access
```

**Verified layer discipline:** ARCHITECT scan found 7 borderline `.from()` calls outside DAL (setup files, 2 notification controllers). The VCSM app DAL boundary is otherwise clean across 187 DAL files.

---

## 6. Governance and Contract System

### Architecture Contracts (11)

| Contract | Scope | Enforcement |
|----------|-------|-------------|
| Senior Developer | All work | Verify before claiming, minimal changes |
| Security Engineering | Backend, auth, DB | Least privilege, RLS, defense in depth |
| Anti-Hallucination | All claims | Classify as confirmed/likely/uncertain |
| Strategic Reality Debrief | Product analysis | Real behavior, not ideal assumptions |
| Real-World Ops | Operations | Observable, recoverable, safe releases |
| Architecture Layers | All code | DAL → Model → Controller → Hook → Screen |
| Platform Contract | Platform layer | Engine boundaries, DI patterns |
| Engine Contract | Engines | Schema ownership, adapter-only API |
| Capability Contract | Capabilities | Cross-feature communication rules |
| Project Boundary Isolation | All roots | No cross-root modifications without approval |
| Single Source Actor | Identity | Actor-based identity across platform |

### Command System (14 commands)

| Layer | Commands | Purpose |
|-------|----------|---------|
| Execution | Wolverine | Sole task orchestrator |
| Governance | Logan, Ironman, review-contract | Docs, ownership, compliance |
| Observation | Loki, DB, Architect | Runtime, database, structure |
| Performance | Kraven | Bottleneck hunting |
| Security | Venom | Trust boundary review |
| Migration | Carnage | Schema evolution planning |
| Release | Thor | Ship/no-ship gate |
| Debug | BugsBunny | Forensic investigation |
| Planning | Captain | Future work capture |
| Utility | session-summary | Handoff logs |

### Documentation System (Logan)

- 65+ Logan docs in structured `domain.system.topic.md` format
- 13-section standard structure (purpose → scope → ownership → data flow → ... → change log)
- Immutable engine audits (`SYSTEM_ENGINE_AUDIT_V[N].md`)
- Marvel command execution logs (`logan/marvel/[command]/`)
- Prompt provenance registry in planning files

**Governance maturity:** This is an unusually mature governance system for a product codebase. The command system functions as an AI engineering operating system with clear authority boundaries, approval gates, and traceability.

---

## 7. Runtime Data Flow

### Feed Load (highest-traffic path)

```
CentralFeedScreen → useFeed → fetchFeedPagePipeline
  ├─ readFeedPostsPage (vc.posts) — sequential, cursor-based
  └─ Promise.all([
       readPostMediaMap (vc.post_media) — 60s per-post cache
       fetchPostMentionRows (vc.post_mentions + vc.actor_presentation) — conditional
       readHiddenPostsForViewer (moderation.actions) — uncached, fresh
       readActorsBundle (vc.actors + profiles + privacy + vports) — 30s per-actor cache
       readFeedBlockRowsDAL (moderation.blocks) — 60s per-viewer cache
       readFeedFollowRowsDAL (vc.actor_follows) — 60s per-viewer cache
     ])
  → normalizeFeedRows → upsertActors → selective hydration (skip if fresh)
```

### Identity Resolution

```
AuthProvider → onAuthStateChange
  → IdentityProvider → resolveAuthenticatedContext (@identity engine)
    → platform.* reads (access, accounts, actor links, preferences, state)
  → VCSM identity hydrator
    → vc.actors + profiles + vports + privacy + realms
```

### Badge Counts (now optimized)

```
BottomNavBar (always mounted, CSS-hidden when not visible)
  ├─ useNotiCount → vc.notifications COUNT (15s TTL, 60s poll, realtime debounced 2s)
  └─ useUnreadBadge → chat.inbox_entries SUM (10s TTL, 20s poll, realtime debounced 2s)
```

### Traffic Acquisition (planned)

```
Google/Bing → Traffic app (Next.js SSG/SSR)
  → /{city}/{service} indexable pages
  → CTA links → VCSM /profile/{actorId} or /actor/{actorId}/menu
```

---

## 8. Data Optimization Findings

### Resolved This Session

| Issue | Fix | Impact |
|-------|-----|--------|
| Duplicate actor hydration | `getMissingOrStale()` skip | ~4 reads saved per page |
| Uncached actor bundle | 30s per-actor TTL cache | Cross-page dedup |
| Uncached block/follow | 60s per-viewer TTL cache | 2 reads saved per page |
| Uncached media metadata | 60s per-post TTL cache | 1 read saved per page |
| Badge subscription churn | BottomNavBar CSS-hide + 2s debounce | N×6 → 6 subscriptions per session |

### Remaining Opportunities

| Area | Issue | Priority |
|------|-------|----------|
| Cross-feature actor reads | 8+ DAL files independently query `vc.actors` | Medium |
| Cross-feature profile reads | 7+ features query `public.profiles` independently | Medium |
| Cross-feature block state | 3 features query `moderation.blocks` independently | Low |
| Profile page sequential reads | `fetchPostsForActor` reads actor → profile → vport sequentially | Medium |
| Learning course remounts | Courses + assignments re-fetched every screen mount | Low |

---

## 9. Performance Architecture

### Current Cache Inventory: 22 TTL caches

| Tier | Count | TTL Range | Status |
|------|-------|-----------|--------|
| Tier 1 (VPORT, portfolio, legal, booking) | 12 | 60s-5min | ALL IMPLEMENTED |
| Tier 2 (profile header, feed DALs) | 5 | 30s-60s | Feed done, actor posts pending |
| Session caches (badge counts, search) | 3 | 10s-45s | ALL IMPLEMENTED |
| Immutable caches (actor kind, vport type) | 2 | 10min | ALL IMPLEMENTED |

### Dev Observability (built this session)

| Tool | Purpose |
|------|---------|
| Performance Dashboard (`/dev/performance`) | Global query/API/load timing with waterfall |
| Supabase Proxy | Auto-captures every `.from()` call |
| Feed DAL Profiler | Per-feed-load DAL call counting + timeline |
| Floating overlays (2) | PERF + FEED pills on every dev page |

### Polling Inventory

| Hook | Interval | Table |
|------|----------|-------|
| useNotiCount | 60s | vc.notifications |
| useUnreadBadge | 20s | chat.inbox_entries |

Both now use debounced realtime with stable subscriptions (no remount churn).

---

## 10. Traffic App Architecture

### What It Is

A **programmatic SEO directory engine** built on Next.js. Publishes indexable pages for city/service/neighborhood/provider combinations to capture organic search traffic.

### URL Architecture

```
/{city}                                          → City landing page
/{city}/{service}                                → City + service directory
/{city}/{neighborhood}/{service}                 → Neighborhood directory
/{city}/{neighborhood}/{service}/{specialty}     → Specialty page
/pro/{provider}                                  → Provider profile page
```

### Data Model

| Entity | Purpose |
|--------|---------|
| City | Geographic entry point (slug-based) |
| Neighborhood | Sub-city area |
| Service | Business category (barber, locksmith, etc.) |
| Specialty | Service subspecialty |
| Provider | Maps to VCSM vport |
| ProviderStats | Rating, reviews, response rate, rank score |
| PriceAggregate | Market pricing by city/service (p25, p50, p75) |

### Current State

- **Scaffold stage** — structure and types defined, mock data connector
- **No live database** — uses `mockDataset.js` hardcoded data
- **Quality guards** — minimum provider thresholds before pages become indexable
- **JavaScript** — converted from TypeScript to JS (monorepo-wide rule: zero TypeScript)
- **Next.js** — server-rendered, SEO-optimized (separate from Vite SPA stack)

### Strategic Role

Traffic acts as the **top-of-funnel acquisition layer**. It generates public, indexable pages that rank for "[service] in [city]" searches and routes discovery into the VCSM platform. Providers listed on Traffic pages correspond to VCSM vports — creating a bridge from search intent to marketplace engagement.

### Integration Path (not yet built)

```
Traffic provider page → CTA "View on Vibez Citizens" → VCSM /profile/{actorId}
                      → CTA "Book Now" → VCSM /actor/{actorId}/menu
```

When live data replaces mock data, Traffic repositories will likely query a read replica or public API for provider/city/service data sourced from VCSM's `vc.vports`, `vc.vport_services`, and a future `traffic.*` schema.

---

## 11. Top Architectural Risks

| # | Risk | Severity | Evidence |
|---|------|----------|----------|
| 1 | **Notification engine not wired** | High | Engine built (31 files) but not consumed by VCSM. Legacy `vc.notifications` still active. Migration gap. |
| 2 | **Cross-feature actor/profile duplication** | Medium | 8+ DAL files independently query `vc.actors`, 7+ query `public.profiles`. No shared request-scope loader. |
| 3 | **Traffic mock data** | Medium | Traffic app uses hardcoded mock dataset. No live database integration. Blocks SEO launch. |
| 4 | **2 controller-level DB calls in notifications engine** | Low | `countUnread.controller.js` and `getInbox.controller.js` have `.from()` calls — layer violation. Should be extracted to DAL. |
| 5 | **No test coverage command** | Low | No command in the system owns test strategy, execution verification, or coverage analysis. Thor has no test signal. |

---

## 12. Highest-Value Improvements

### 1. Wire Notification Engine Into VCSM (HIGH)
- **Problem:** Engine exists with 31 files but VCSM still uses legacy `vc.notifications`
- **Why it matters:** Two parallel notification systems = maintenance burden, no template rendering, no preference evaluation
- **Impact:** Unified notification pipeline, multi-channel delivery, preference-aware routing
- **Direction:** Create `features/notifications/setup.js`, wire `publishEvent()` into booking/review controllers, seed event types + templates

### 2. Request-Scope Actor Loader (MEDIUM)
- **Problem:** 8+ features independently query `vc.actors`. Feed, profiles, notifications, chat each have their own actor reads.
- **Why it matters:** Same actors re-fetched across features in the same page render
- **Impact:** Consolidate to a single request-scope actor resolution that feeds all features
- **Direction:** Extend the hydration store to act as a request-scope cache. Features call `getOrFetchActors(ids)` instead of direct DAL.

### 3. Connect Traffic to Live Data (MEDIUM)
- **Problem:** Traffic app uses mock data. Can't launch SEO pages without real provider/city/service data.
- **Why it matters:** Traffic is the acquisition funnel. No live data = no organic traffic growth.
- **Impact:** Enables programmatic SEO pages backed by real VCSM provider data
- **Direction:** Replace `mockDataset.js` with Supabase connector or public read API. May need a `traffic.*` schema or read-only views over `vc.*`.

### 4. Cross-Feature Cache Invalidation Bus (LOW)
- **Problem:** Each cache has its own `invalidate*()` function. No coordination between related caches (e.g., profile edit doesn't clear vport details cache).
- **Why it matters:** Stale data may persist up to 60s after edits across feature boundaries
- **Impact:** Single event → all related caches invalidated
- **Direction:** Lightweight `window.dispatchEvent` pattern with `cache:invalidate` custom events.

---

## 13. RUN ARCHITECT RECOMMENDATION

ARCHITECT was already run this session and produced 5 documents. The maps are current.

**Next recommended ARCHITECT run scope:** After notification engine Slice 4 (VCSM wiring) is complete, re-run ARCHITECT to update the dependency-map with the new `@notifications` consumer chain and update the database-read-map with any new `notification.*` reads from the VCSM app.

**Next recommended specialist runs:**
- **Ironman** — Generate ownership records for top 5 features (feed, notifications, chat, profiles, booking). This would give Thor a foundation for release readiness assessment.
- **Carnage** — Plan the Traffic app database integration (new schema or read views for the mock data replacement).

---

## 14. Repository Architecture Model — Martin Fowler Pattern Analysis

### 14.1 Architecture Classification

This system is an **Engine-Driven Modular Monolith** combining:

- **Layered Architecture** — strict DAL → Model → Controller → Hook → Screen separation
- **Service Layer Pattern** — controllers orchestrate business logic, DALs handle data access
- **Repository Pattern** — DAL files act as repositories with explicit column selection
- **Ports and Adapters (Hexagonal)** — engines expose adapters as their only public surface; apps inject dependencies via DI
- **Modular Monolith** — three applications + shared engines in one repository with enforced boundaries

This is not a microservices system. It is a deliberately structured monolith where modules (engines) enforce domain boundaries within a single deployment unit.

### 14.2 Comparison to Martin Fowler Architectural Styles

#### Layered Architecture (Fowler: "Presentation-Domain-Data Source")

The repository implements strict layering as described by Fowler. Each layer has a single responsibility and only calls the layer below it.

```
Screen (Presentation)
  └─ Hook (Presentation-Domain bridge)
      └─ Controller (Domain Logic / Service Layer)
          └─ Model (Domain Model — pure transforms)
              └─ DAL (Data Source — Repository pattern)
                  └─ Database (Supabase PostgreSQL)
```

**Key enforcement:** Components never call DALs directly. Hooks never query the database. Controllers orchestrate but don't render. This is verified by ARCHITECT scans and SENTRY contract reviews.

#### Service Layer Pattern (Fowler: "Service Layer")

Controllers in this system act as Fowler's Service Layer — they define the application's boundary, orchestrate domain operations, and coordinate between data access and presentation.

```javascript
// Controller = Service Layer
export async function getProfileView({ actorId }) {
  const actor = await readActorProfile(actorId)          // DAL call
  const posts = await readActorPostsDAL(actorId)          // DAL call
  const reactions = await readPostReactionsDAL(postIds)    // DAL call
  return { actor, posts, reactions }                       // orchestration
}
```

Engine services (e.g., `preferenceEvaluator.service.js`, `templateRenderer.service.js`) add a second service tier for domain logic shared across controllers.

#### Repository Pattern (Fowler: "Repository")

DAL files implement the Repository pattern. Each DAL encapsulates database access for a specific domain entity, with explicit column selection and schema-scoped queries.

```javascript
// DAL = Repository
export async function dalListReviewsByTarget({ targetActorId, cursor, limit }) {
  return supabase
    .schema('reviews')
    .from('reviews')
    .select('id, target_actor_id, author_actor_id, body, overall_rating, created_at')
    .eq('target_actor_id', targetActorId)
    .order('review_activity_at', { ascending: false })
    .limit(limit)
}
```

**Rule enforced:** `.select('*')` is banned. Every DAL specifies exact columns. This is an architecture contract.

#### Ports and Adapters / Hexagonal Architecture (Fowler: "Hexagonal Architecture")

Engines implement the Ports and Adapters pattern:

- **Ports** = `config.js` with `configure[Engine]Engine()` — defines what the engine needs from the outside world (supabase client, resolvers, ownership checks)
- **Adapters** = `adapters/index.js` — the only public surface, re-exports controllers and models
- **Core** = `controller/`, `services/`, `model/`, `dal/` — internal, never imported directly

```
App (driving adapter)
  │
  └─ configureReviewsEngine({ supabaseClient, isActorOwner })  ← PORT (inbound)
  │
  └─ import { listReviews } from '@reviews'                     ← ADAPTER (outbound)
       │
       └─ Engine Core (controllers, services, DALs, models)      ← DOMAIN
```

Apps never import engine internals. Engines never import from apps. This boundary is enforced by the Engine Contract in `zcontract/enginecontract.md`.

#### Modular Monolith (Fowler: "Modular Monolith")

The entire system deploys as a monolith but is structured with strong module boundaries:

- **Application modules:** VCSM, Wentrex, Traffic — isolated, never cross-import
- **Engine modules:** Identity, Chat, Reviews, Portfolio, Notifications, Hydration — shared via DI
- **Boundary enforcement:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md, engine CLAUDE.md files, Wolverine scope checking

This matches Fowler's description of a modular monolith: "a single deployment unit where the internal structure is divided into well-defined modules with explicit boundaries."

### 14.3 Architectural Patterns NOT Used

#### Microservices

**What it is:** Independent, separately deployable services communicating over network (HTTP/gRPC/messaging).

**Why not used:** The system's complexity does not warrant network boundaries between modules. Engines share a single database (Supabase PostgreSQL), and the transaction model relies on direct database access — not eventual consistency.

**Tradeoffs accepted:**
- Simpler transactions (no distributed transaction coordination)
- Easier refactoring (rename a function, not an API contract)
- No network latency between modules
- Lower operational overhead (one deployment, not six)
- Trade: cannot scale modules independently

#### Event-Driven Architecture (EDA)

**What it is:** Components communicate through asynchronous events published to a message broker.

**Why not used:** The system uses synchronous request-response patterns. Engine domain events exist (`events.js` in each engine) but are in-process pub/sub — not distributed messaging. Supabase Realtime provides server-push for badge counts, but this is notification delivery, not architectural event sourcing.

**Tradeoffs accepted:**
- Simpler debugging (synchronous call stacks, not event traces)
- No message broker infrastructure
- Easier to reason about data consistency
- Trade: tighter coupling between caller and callee

#### CQRS (Command Query Responsibility Segregation)

**What it is:** Separate models for reads and writes, often with different data stores.

**Why not used:** The system uses the same Supabase PostgreSQL for reads and writes through the same DAL layer. Read and write DALs are in separate files (`*.read.dal.js` / `*.write.dal.js`) but share the same schema and client.

**Tradeoffs accepted:**
- Simpler mental model (one database, one schema per domain)
- No eventual consistency between read and write models
- Trade: cannot independently optimize read vs write performance

#### Serverless Architecture

**What it is:** Stateless functions triggered by events, managed by cloud provider.

**Why not used:** The system is a client-side SPA (React + Vite) with Supabase as the backend. Supabase Edge Functions exist for specific server-side operations (e.g., student auth) but the architecture is not serverless-first.

**Tradeoffs accepted:**
- Full control over client-side architecture
- No cold-start latency
- Richer client-side state management (Zustand, TTL caches)
- Trade: more client-side complexity

#### MVC (Model-View-Controller)

**What it is:** Classic three-tier pattern where Controller handles input, Model manages data, View renders output.

**Why not used:** The system uses a richer layering model (DAL → Model → Controller → Hook → Screen) that separates concerns more granularly than MVC. React hooks replace the "Controller handles input" role of traditional MVC. The Model layer is pure transforms, not active record objects.

**Tradeoffs accepted:**
- More layers = more files, but each file has clearer responsibility
- Hooks as the bridge between domain logic and UI lifecycle
- Trade: steeper learning curve for new developers

### 14.4 Benefits of the Current Architecture

| Benefit | How It's Achieved |
|---------|------------------|
| **Clear boundaries** | Protected roots, engine contracts, boundary isolation contract |
| **Shared platform capabilities** | 6 engines consumed via DI by multiple apps |
| **Controlled dependency direction** | `apps → engines → shared` — verified by ARCHITECT scans |
| **High developer velocity** | Consistent patterns across all features (DAL → Controller → Hook → Screen) |
| **Strong governance** | 14 AI commands + 11 contracts + Logan documentation system |
| **Simplified debugging** | Dev-only profilers, Supabase proxy, feed DAL profiler, screen traces |
| **Centralized database** | Single Supabase instance, schema-per-domain isolation |
| **Safe refactoring** | Engine adapters decouple internal changes from consumers |

### 14.5 Tradeoffs

| Tradeoff | Implication |
|----------|------------|
| **Monolith scaling** | All apps share one deployment — cannot scale engines independently |
| **Dependency discipline required** | Architecture relies on contract enforcement, not physical network boundaries |
| **Module coupling risk** | If contracts are violated, engines can become coupled to app-specific logic |
| **Single database** | All schemas in one PostgreSQL instance — vertical scaling only |
| **Client-side complexity** | Heavy client with 22 TTL caches, Zustand stores, and manual data fetching |

### 14.6 Future Architectural Evolution

The system is positioned to evolve toward **Capability-Based Architecture**:

```
Current: Engine-Driven Modular Monolith
  │
  ├─ Engines are internal shared libraries consumed via DI
  │
  └─ Future: Platform Capabilities
       │
       ├─ Engines exposed as API services (for Traffic + external consumers)
       ├─ Public read APIs for Traffic provider/city/service data
       ├─ Notification engine as event-driven capability (webhook delivery)
       └─ Identity engine as SSO/auth service across all apps
```

**Potential evolution steps:**
1. **Domain capabilities** — Engines become first-class platform capabilities with versioned APIs
2. **API layer** — Thin API gateway for engines, enabling Traffic to consume live data without direct DB access
3. **Public read APIs** — Traffic replaces mock data with real-time provider listings from VCSM
4. **Event delivery** — Notification engine evolves from in-app to multi-channel (push, email, webhook)
5. **Selective extraction** — If a specific engine (e.g., chat) needs independent scaling, extract it to a service boundary while keeping the rest as monolith

This follows Fowler's guidance: "Start with a modular monolith and extract services only when you have a clear operational need."

---

## 15. Architectural Fitness Functions

The governance layer implements what Fowler calls **architectural fitness functions** — automated checks that verify the system conforms to its architectural rules:

| Fitness Function | Implementation | What It Checks |
|-----------------|---------------|----------------|
| **Boundary isolation** | Wolverine scope checking | No cross-root modifications without approval |
| **Layer discipline** | SENTRY contract review | DAL → Controller → Hook → Screen ordering |
| **Dependency direction** | ARCHITECT dependency-map | apps → engines → shared, never reverse |
| **Schema ownership** | Engine CLAUDE.md rules | Each engine queries only its own schema |
| **Column selection** | Architecture contract | No `.select('*')` in any DAL |
| **Documentation drift** | LOGAN drift detection | Docs match actual code state |
| **Security boundaries** | VENOM trust review | Auth, RLS, identity surface compliance |
| **Performance regression** | KRAVEN bottleneck hunt | Duplicate reads, N+1 patterns, overfetch |
| **Release readiness** | THOR aggregation | Collects all signals for ship/no-ship decision |

These are not traditional CI tests — they are **command-driven governance functions** executed by AI assistants, providing the same architectural guardrails that fitness functions provide in automated pipelines.
