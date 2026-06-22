# VCSM Reviews — Feature Ownership Map

Scope: VCSM + ENGINE (reviews)
Scan Date: 2026-05-24
ARCHITECT Version: 26.14

---

## Ownership Surfaces

The reviews domain spans five distinct feature ownership zones.

---

### ZONE 1: Dashboard Entry
```
Feature: dashboard/vport (dashboard/vport/screens/VportDashboardReviewScreen.jsx)
Owner Responsibility: Route entry, identity gate, ownership mode, desktop portal
Primary Data Source: via adapter → profiles/vport/review
Dependent Features: profiles/vport/review (via adapter — COMPLIANT)
Shared Engines: identity engine (useIdentity), booking (useVportOwnership)
Independence: COMPLETE — this zone is a thin shell, correctly delegating all logic
Spaghetti Score: CLEAN
```

---

### ZONE 2: Review Core Logic (Engine-Backed)
```
Feature: profiles/kinds/vport/controller/review + hooks/review + dal/review (active)
Owner Responsibility: Review lifecycle orchestration, dimension loading, stats loading,
                      submit/edit/delete flows, pagination, service tab, optimistic UI
Primary Data Source: engines/reviews → reviews.reviews, review_dimension_ratings,
                     review_dimensions RPCs
Dependent Features: notifications/adapters (publish on submit), identity (viewer)
Shared Engines: engines/reviews (@reviews alias)
Independence: MOSTLY INDEPENDENT — relies on engines/reviews for all DB ops
Spaghetti Score: WATCH
  - Dead code alongside active path (3 confirmed dead files)
  - Duplicate reads on submit path
  - View screen owns business state
  - Dual submit functions exposed
```

---

### ZONE 3: Public Review Surface
```
Feature: public/vportMenu (controllers, DALs, hooks, views, screens)
Owner Responsibility: Unauthenticated review display, QR share flow, public slug resolution
Primary Data Source: reviews.public_vport_reviews_v, reviews.public_vport_review_summary_v
Dependent Features: vportMenu (shared public slug resolution)
Shared Engines: NONE — no engine dependency (reads views directly)
Independence: INDEPENDENT — fully isolated public read path
Spaghetti Score: CLEAN
Notes:
  - Does NOT use the reviews engine
  - Uses snapshot-based views (no N+1 author enrichment)
  - TTL cached summary (60s)
  - This is architecturally cleaner than the authenticated path
```

---

### ZONE 4: Reviews Engine
```
Feature: engines/reviews
Owner Responsibility: Review CRUD lifecycle, dimension management, stats aggregation,
                      author enrichment, event emission, DI configuration
Primary Data Source: reviews.* schema (all tables and RPCs)
Dependent Features: NONE — engine has no app dependencies (DI only)
Shared Engines: N/A (IS an engine)
Independence: INDEPENDENT — fully self-contained with DI for supabaseClient and isActorOwner
Spaghetti Score: WATCH
  - N+1 in author card enrichment (dalGetAuthorCardsForReviews)
  - Engine events emitted but never consumed
  - isActorOwner DI not actually checking ownership (app-layer gap)
```

---

### ZONE 5: Legacy Dead Code (No Active Owner)
```
Feature: profiles/kinds/vport/dal/review (dead files) + model/review (dead)
Owner Responsibility: Previously owned review author enrichment and direct write ops
Primary Data Source: N/A — DEAD, no active consumers
Dependent Features: N/A
Shared Engines: N/A
Independence: N/A — DEAD CANDIDATE
Spaghetti Score: N/A — delete candidates
Files:
  - vportReviewAuthors.read.dal.js (DEAD)
  - vportReviews.write.dal.js (DEAD)
  - VportReview.model.js (DEAD)
  - reviewDimensions.config.js (LIKELY DEAD)
```

---

## Ownership Responsibility Matrix

| Responsibility | Zone | File(s) | Status |
|---|---|---|---|
| Dashboard route entry | Zone 1 (dashboard/vport) | VportDashboardReviewScreen.jsx | CLEAN |
| Identity + ownership gate | Zone 1 | useVportOwnership, useIdentity | CLEAN |
| Review list loading | Zone 2 (profiles/vport) | useVportReviewList → ctrlListReviews | ACTIVE |
| Dimension form config | Zone 2 | ctrlGetReviewFormConfig → engine | ACTIVE |
| Aggregate stats | Zone 2 | ctrlGetOfficialStats → engine | ACTIVE |
| My review load/submit/delete | Zone 2 | useVportReviewMine → ctrl → engine | ACTIVE |
| Optimistic UI | Zone 2 | useVportReviewMine | ACTIVE |
| Service tab reviews | Zone 2 | VportServiceReviews.controller | ACTIVE (bug — wrong arg) |
| Compose form state | Zone 2 (VIOLATION) | VportReviewsView.jsx | BOUNDARY VIOLATION |
| Review notification on submit | Zone 2 | VportReviews.controller → notifications | ACTIVE |
| Public review display | Zone 3 (public/vportMenu) | readPublicVportReviewsDAL | ACTIVE |
| Public review summary | Zone 3 | readPublicVportReviewSummaryDAL | ACTIVE (cached) |
| QR review link | Zone 3 | VportPublicReviewsQrBySlugScreen | ACTIVE |
| DB-level CRUD | Zone 4 (engine) | engines/reviews controllers + DALs | ACTIVE |
| Domain event emission | Zone 4 | engines/reviews/src/events.js | ACTIVE (no consumers) |
| Author card enrichment | Zone 4 (N+1) | dalGetAuthorCardsForReviews | ACTIVE (N+1 risk) |
| Author write DAL | Zone 5 (DEAD) | vportReviewAuthors.read.dal.js | DEAD |
| Direct write ops | Zone 5 (DEAD) | vportReviews.write.dal.js | DEAD |
| Legacy row model | Zone 5 (DEAD) | VportReview.model.js | DEAD |
| Hardcoded dimension config | Zone 5 (LIKELY DEAD) | reviewDimensions.config.js | LIKELY DEAD |

---

## Shared Data Objects — Ownership Conflicts

| Object | Zone 2 Access | Zone 3 Access | Zone 4 Access | Conflict |
|---|---|---|---|---|
| reviews.review_dimensions | via engine (auth) | direct DAL (public) | owns | Dual access — no conflict (different clients, read only) |
| review_activity_at cursor | zone 2 (auth pagination) | zone 3 (public pagination) | engine | Clean — same cursor field, same direction |
| author snapshot fields | zone 2 uses RPC (N+1) | zone 3 uses view columns | engine writes snapshots | PUBLIC PATH IS BETTER — zone 2 should use views or batch RPC |

---

## Orphaned Ownership

| Item | Last Known Owner | Current Status | Action |
|---|---|---|---|
| vportReviewAuthors.read.dal.js | Pre-engine app reviews layer | ORPHANED | IRONMAN to confirm + delete |
| vportReviews.write.dal.js | Pre-engine app reviews layer | ORPHANED | IRONMAN to confirm + delete |
| VportReview.model.js | Pre-engine app reviews layer | ORPHANED | IRONMAN to confirm + delete |
| reviewDimensions.config.js | Pre-engine client config | ORPHANED (likely) | IRONMAN + CARNAGE verify |
| Engine events (REVIEW_CREATED etc.) | engines/reviews | Emitted, no subscriber | IRONMAN decision: wire or remove |
| Legacy submit() fn | useVportReviewMine | Dead export | IRONMAN verify + remove |
