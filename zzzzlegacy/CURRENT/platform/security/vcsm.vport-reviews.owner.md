# VCSM Vport Reviews — Ownership Record

IRONMAN Version: 15.17
Scan Date: 2026-05-24
Scope: VCSM + ENGINE (reviews)

---

## 1. Purpose

The Vport Reviews module manages the full lifecycle of multi-dimensional reviews
left by Citizens (users) on Vport actors (business profiles). This includes:

- Review form composition (dimension ratings + body)
- Submit, edit, and delete flows with optimistic UI
- Aggregate stats display (overall average, verified count, p50/p90)
- Dimension tab navigation
- Service-filtered review lists
- Cursor-based paginated list loading
- Unauthenticated public review display (slug-based routes)
- QR code review link generation
- Review notification on submit

The module spans two surfaces:
- **Authenticated** — Dashboard + Profile tab (engine-backed, full CRUD)
- **Public** — Unauthenticated slug-based routes (view-backed, read only, no N+1)

---

## 2. Application Scope

**VCSM + ENGINE**

The authenticated path consumes `engines/reviews` via the `@reviews` alias.
The public path reads from Supabase views directly — no engine dependency.

---

## 3. Code Roots

### Authenticated Path
```
apps/VCSM/src/features/dashboard/vport/screens/          (route entry)
apps/VCSM/src/features/profiles/adapters/kinds/vport/screens/review/  (adapter)
apps/VCSM/src/features/profiles/kinds/vport/screens/review/           (view + components)
apps/VCSM/src/features/profiles/kinds/vport/hooks/review/             (orchestrator + sub-hooks)
apps/VCSM/src/features/profiles/kinds/vport/controller/review/        (business logic)
apps/VCSM/src/features/profiles/kinds/vport/dal/review/               (DB access — 1 active, 2 dead)
apps/VCSM/src/features/profiles/kinds/vport/model/review/             (1 dead)
apps/VCSM/src/features/profiles/kinds/vport/config/                   (reviewDimensions — dead)
apps/VCSM/src/features/reviews/setup.js                               (engine DI config)
engines/reviews/src/                                                   (engine — CRUD, DAL, events)
```

### Public Path
```
apps/VCSM/src/features/public/vportMenu/dal/             (public DALs — 2 active, TTL cached)
apps/VCSM/src/features/public/vportMenu/controllers/     (public controllers)
apps/VCSM/src/features/public/vportMenu/hooks/           (public hooks)
apps/VCSM/src/features/public/vportMenu/screens/         (public screens + views)
```

---

## 4. Core Layers

### DAL
**ACTIVE:**
- `dal/review/reviewTarget.read.dal.js` — reads `vc.actors` to validate target (called 2-3x per mount — duplicate risk)
- `public/vportMenu/dal/readPublicVportReviewsDAL.js` — reads `reviews.public_vport_reviews_v`
- `public/vportMenu/dal/readPublicVportReviewSummaryDAL.js` — reads `reviews.public_vport_review_summary_v` (60s TTL cache)
- `public/vportMenu/dal/readPublicVportReviewDimensionsDAL.js` — reads `reviews.review_dimensions`
- `engines/reviews/src/dal/` — all engine DALs (7 files, active)

**DEAD — DELETE CANDIDATES:**
- `dal/review/vportReviewAuthors.read.dal.js` — pre-engine multi-client author card DAL (3 clients: vc, public, vport schemas). Zero consumers. **HIGHEST RISK if accidentally re-wired — exposes raw `identity.actor_directory`.**
- `dal/review/vportReviews.write.dal.js` — pre-engine direct table write DAL. Bypasses `upsert_neutral_review` SECURITY DEFINER RPC. Zero consumers. **DELETION PRIORITY 1.**

### Model
**ACTIVE:**
- `controller/review/vportReviews.mappers.js` — pure mappers: `mapDimension`, `mapStats`, `mapRating`, `mapReview`. Used by active controllers.
- `engines/reviews/src/model/` — engine models and transformers (active)

**DEAD — DELETE CANDIDATE:**
- `model/review/VportReview.model.js` — pre-engine row model (5 functions). Zero consumers. Windows dev machine path still in file header.

### Controller
**ACTIVE:**
- `controller/review/VportReviews.controller.js` — main controller. Engine-backed. Exports: `ctrlAssertReviewTargetActor`, `ctrlGetOfficialStats`, `ctrlGetReviewFormConfig`, `ctrlSubmitReview`, `ctrlDeleteReview`, `ctrlGetMyActiveReview`. **Known issue: duplicate reads in ctrlSubmitReview (P2 — KRAVEN).**
- `controller/review/VportServiceReviews.controller.js` — service tab list controller. **Known bug: positional arg error on line 52 — passes `limit` as number instead of options object (P1 — SENTRY).**

### Hook
**ACTIVE:**
- `hooks/review/useVportReviews.js` — orchestrator hook. Composes `useVportReviewList` + `useVportReviewMine`.
- `hooks/review/useVportReviewList.js` — paginated review list with cursor. Tab-aware. Client-side tab filter (truncation risk for results beyond cursor — P2).
- `hooks/review/useVportReviewMine.js` — my-review load/submit/delete. Contains legacy `submit()` function — exported but never called by any consumer (dead export — P3).
- `hooks/review/useVportReviews.helpers.js` — pure utils: `safeNum`, tab labeling.

### Component
**ACTIVE:**
- `screens/review/VportReviewComposeForm.jsx` — presentational form. COMPLIANT. Receives 17 props from view (props drilling risk — root cause is view boundary violation).
- `screens/review/components/ReviewsList.jsx` — pure display list with skeleton, empty state, load more.
- `screens/review/components/VportReviewDeleteModal.jsx` — confirm dialog.
- `screens/review/components/InputStars.jsx` — star input.
- `screens/review/components/TabButton.jsx` — tab button.

### View Screen
**ACTIVE — BOUNDARY VIOLATION:**
- `screens/review/VportReviewsView.jsx` — **OWNS 6 useState (body, ratingsMap, activeDimKey, submitting, submitErr, showDeleteConfirm) + handleSubmit async callback. All non-UI state belongs in `useVportReviewCompose.js` (to be extracted — SENTRY P2).**

### Adapter
**ACTIVE:**
- `profiles/adapters/kinds/vport/screens/review/VportReviewsView.adapter.js` — 2-line re-export. COMPLIANT.

### Final Screen
**ACTIVE:**
- `dashboard/vport/screens/VportDashboardReviewScreen.jsx` — route entry + identity gate + desktop portal. COMPLIANT.

---

## 5. Engines Used

| Engine | Usage | Entry |
|---|---|---|
| `engines/reviews` | All authenticated CRUD + author enrichment | `@reviews` alias in VportReviews.controller |
| Identity (React Context) | Session actor via `useIdentity()` | Two import paths — both resolve to `identityContext` |
| Notifications | `publishVcsmNotification` after submit | Fire-and-forget |
| Hydration (booking) | `useVportOwnership` for ownership gate | Dashboard screen only |

**NOTE:** The public path does NOT use `engines/reviews`. It reads Supabase views directly.
This is architecturally cleaner than the authenticated path.

---

## 6. Database / Schema Ownership

### Tables Read (Authenticated)
| Table | Schema | Access Path |
|---|---|---|
| `reviews` | `reviews` | engine → `dalListReviewsByTarget` |
| `review_dimension_ratings` | `reviews` | engine → `dalListRatingsByReviewIds` |
| `review_dimensions` | `reviews` | engine → `dalListDimensionsByTargetKind` |
| `actors` | `vc` | app DAL → `reviewTarget.read.dal.js` (2-3x per mount) |

### Tables Written (Authenticated)
| Table | Schema | Access Path | Guard |
|---|---|---|---|
| `reviews` (upsert) | `reviews` | engine → `dalRpcUpsertNeutralReview` | SECURITY DEFINER RPC |
| `review_dimension_ratings` | `reviews` | engine → `dalUpsertDimensionRatings` | After RPC succeeds |
| `reviews` (soft delete) | `reviews` | engine → `dalSoftDeleteReview` | `isActorOwner` DI check (WEAK — P0 VENOM) |

### Views (Public Path)
| View | Schema | Access Path |
|---|---|---|
| `public_vport_reviews_v` | `reviews` | `readPublicVportReviewsDAL` |
| `public_vport_review_summary_v` | `reviews` | `readPublicVportReviewSummaryDAL` (60s TTL cache) |

### RPCs
| RPC | Schema | SECURITY DEFINER | Caller |
|---|---|---|---|
| `upsert_neutral_review` | `reviews` | YES | engine `dalRpcUpsertNeutralReview` |
| `get_review_author_card` | `reviews` | YES | engine `dalGetAuthorCardsForReviews` — N+1 per review |
| `get_target_overall_stats` | `reviews` | Unconfirmed | engine `dalRpcGetTargetOverallStats` |

### Migration Owner
`engines/reviews` schema ownership → CARNAGE

### RLS Owner
`reviews.*` schema — DB-enforced. App-layer `isActorOwner` check is WEAK (does not verify `session.user.id → actor_owners → actorId`). VENOM must audit.

---

## 7. Rule Ownership

| Rule | Owner | Enforcement Layer | Risk |
|---|---|---|---|
| One review per author/target | DB: `upsert_neutral_review` RPC | Database (upsert constraint) | LOW — DB enforced |
| Author must be `kind='user'` | App: `canReview` in `useVportReviews` | Hook (UI gate) + DB (unconfirmed) | MEDIUM — UI only if DB doesn't enforce |
| Actor ownership before write | App: `isActorOwner()` DI in engine | **WEAK** — checks actor exists, not ownership | **P0 — VENOM** |
| Target must be active Vport | App: `ctrlAssertReviewTargetActor` | Controller + `reviewTarget.read.dal.js` | LOW |
| Soft-delete (not hard) | Engine: `dalSoftDeleteReview` | Engine DAL | LOW |
| Public review display | Supabase view RLS | Database | LOW |

---

## 8. Contracts Touched

- `ARCHITECTURE.md` — Screen role boundaries (violated by VportReviewsView boundary violation)
- `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md` — VCSM root isolation (compliant)
- `SECURITY_ENGINEERING_CONTRACT.md` — `isActorOwner` weak check violates auth ownership rules
- `SENIOR_DEVELOPER_CONTRACT.md` — DAL explicit column selection (REVIEW_COLUMNS compliant), file length (compliant)

---

## 9. Documentation Links

### ARCHITECT outputs (2026-05-24)
- `architect/modules/vcsm.vport-reviews-dashboard.architecture.md` — module completeness matrix
- `architect/vcsm-reviews-dead-and-spaghetti-report.md` — dead code + spaghetti findings
- `architect/vcsm-reviews-event-flow-map.md` — 5 major event flows mapped
- `architect/vcsm-reviews-rls-assumption-map.md` — RLS trust surface + VENOM checklist
- `architect/vcsm-reviews-database-read-map.md` — every DB read, call chains, duplicates
- `architect/vcsm-reviews-supabase-view-tree.md` — view dependency trees
- `architect/vcsm-reviews-feature-ownership-map.md` — 5-zone ownership
- `architect/vcsm-reviews-api-exposure-map.md` — no server APIs, Supabase direct
- `architect/vcsm-reviews-state-store-map.md` — no Zustand, local React state only
- `architect/vcsm-reviews-bundle-client-server-map.md` — pure Vite client SPA
- `architect/vcsm-reviews-component-tree.md` — full component tree + props audit
- `architect/graph-data/vcsm-reviews-dashboard.graph.json` — SHIELD graph (35 nodes)
- `architect/graph-data/vcsm-reviews-governance-overlay.graph.json` — governance routing

---

## 10. Runtime Ownership

| Runtime Flow | Entry Point | Owning Feature | Controllers | DALs |
|---|---|---|---|---|
| Dashboard reviews load | `VportDashboardReviewScreen` | dashboard/vport | `ctrlAssertReviewTargetActor`, `ctrlGetOfficialStats`, `ctrlGetReviewFormConfig` | `reviewTarget.read.dal.js` (3x), engine DALs |
| Submit review | `VportReviewsView.handleSubmit` | profiles/kinds/vport (view — VIOLATION) | `ctrlSubmitReview` | engine `dalRpcUpsertNeutralReview` |
| Delete review | `VportReviewDeleteModal.onDelete` | profiles/kinds/vport | `ctrlDeleteReview` | engine `dalSoftDeleteReview` |
| Load more reviews | `ReviewsList.onLoadMore` | profiles/kinds/vport | `ctrlListReviews` | engine DALs |
| Public slug reviews | `/profile/:slug/reviews` | public/vportMenu | `getVportPublicReviewsController` | `readPublicVportReviewsDAL` |
| Author card enrichment | Engine internal | engines/reviews | N/A | `dalGetAuthorCardsForReviews` (N+1) |

**Runtime ownership: INFERRED** (no LOKI trace completed).

---

## 11. Responsibilities

The Vport Reviews module owns:
- Review CRUD lifecycle for Vport actors (authenticated path, engine-backed)
- Aggregate stats computation and display
- Dimension tab navigation and per-dimension filtering
- Service-filtered review lists
- Optimistic UI on submit (insert → replace on success → rollback on error)
- Cursor-based pagination
- Public review display (slug route, no engine)
- QR review link generation
- Review notification on submit (fire-and-forget)

---

## 12. Boundaries

The Vport Reviews module must NOT:
- Read or write tables outside `reviews.*` schema except `vc.actors` (for target validation)
- Bypass the engine's `upsert_neutral_review` RPC for writes
- Import from another feature's internals without adapter boundary
- Re-wire the dead DAL files (`vportReviews.write.dal.js`, `vportReviewAuthors.read.dal.js`)
- Implement its own author card enrichment separate from the engine

---

## 13. Change Impact Rules

If the reviews module changes, update:
1. All ARCHITECT output files listed in §9
2. This ownership record
3. SHIELD graph data files
4. RLS assumption map if DB objects change
5. Engine audit docs if `engines/reviews` changes
6. CARNAGE migration plan if schema changes

---

## 14. Release Gate Notes

**NOT RELEASE-READY.** THOR must block until:
1. `isActorOwner` security gap resolved (VENOM audit + fix)
2. `upsert_neutral_review` SECURITY DEFINER body audited (VENOM)
3. N+1 author card pattern resolved (KRAVEN + CARNAGE)

See: `architect/graph-data/vcsm-reviews-governance-overlay.graph.json`

---

## 15. Open Ownership Questions

1. **Does `upsert_neutral_review` enforce `auth.uid() → actor_owners → actorId`?** — VENOM must read the RPC body in Supabase.
2. **Is `get_target_overall_stats` RLS-restricted or fully open?** — ARCHITECT flagged as unconfirmed.
3. **Who owns engine event subscription?** — 5 events emitted, 0 subscribers. IRONMAN decision: wire or remove.
4. **Service reviews tab: should it be server-side filtered?** — Currently client-side filter on cursor-limited page. CARNAGE + SENTRY.
