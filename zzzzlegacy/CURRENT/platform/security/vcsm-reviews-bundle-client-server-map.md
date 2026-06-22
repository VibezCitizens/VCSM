# VCSM Reviews — Bundle Boundary & Client/Server Execution Map

Scope: VCSM + ENGINE (reviews)
Scan Date: 2026-05-24
ARCHITECT Version: 26.14

---

## Runtime Context

VCSM is a Vite + React 19 SPA. There is no SSR, no Next.js, no server actions.
All code runs exclusively client-side at runtime.

The only "server-side" execution in VCSM's reviews module is:
- Supabase SECURITY DEFINER RPCs (PostgreSQL server — not JS)
- Supabase RLS policies (PostgreSQL server — not JS)
- Notification engine workers (if any — async, fire-and-forget)

No reviews code executes on a Node.js server.

---

## Execution Classification

| File | Layer | Execution | Lazy-Loaded | Bundle Risk |
|---|---|---|---|---|
| VportDashboardReviewScreen.jsx | Final Screen | CLIENT — runtime | YES (lazyApp) | LOW |
| VportReviewsView.adapter.js | Adapter | CLIENT — runtime | with VportDashboardReviewScreen | LOW |
| VportReviewsView.jsx | View Screen | CLIENT — runtime | with adapter | LOW |
| VportReviewComposeForm.jsx | Component | CLIENT — runtime | with view | LOW |
| ReviewsList.jsx | Component | CLIENT — runtime | with view | LOW |
| VportReviewDeleteModal.jsx | Component | CLIENT — runtime | with view | LOW |
| VportReviewStars.jsx | Component | CLIENT — runtime | with view | LOW |
| VportReviewsControls.jsx | Component | CLIENT — runtime | with view | LOW |
| useVportReviews.js | Hook | CLIENT — runtime | with view | LOW |
| useVportReviewList.js | Hook | CLIENT — runtime | with view | LOW |
| useVportReviewMine.js | Hook | CLIENT — runtime | with view | LOW |
| useVportReviews.helpers.js | Pure util | CLIENT — build-included | with hook | LOW |
| VportReviews.controller.js | Controller | CLIENT — runtime | with hook | MEDIUM (imports engine) |
| VportServiceReviews.controller.js | Controller | CLIENT — runtime | with hook | LOW |
| vportReviews.mappers.js | Model/Mapper | CLIENT — runtime | with controller | LOW |
| reviewTarget.read.dal.js | DAL | CLIENT — runtime | with controller | LOW |
| engines/reviews/src/* | Engine | CLIENT — runtime | via @reviews alias | MEDIUM |
| readPublicVportReviewsDAL.js | DAL (public) | CLIENT — runtime | with public screen | LOW |
| readPublicVportReviewSummaryDAL.js | DAL (public) | CLIENT — runtime | with public screen | LOW |
| VportPublicReviewsBySlugScreen.jsx | Public Screen | CLIENT — runtime | YES (lazyPublic) | LOW |
| VportPublicReviewsView.jsx | Public View | CLIENT — runtime | with public screen | LOW |

### Dead Files (client-side, unreachable at runtime)

| File | Execution | Status |
|---|---|---|
| vportReviewAuthors.read.dal.js | CLIENT — never reached | DEAD |
| vportReviews.write.dal.js | CLIENT — never reached | DEAD |
| VportReview.model.js | CLIENT — never reached | DEAD |
| reviewDimensions.config.js | CLIENT — never reached (likely) | LIKELY DEAD |

---

## Lazy Loading Boundaries

```
Dashboard reviews path (authenticated):
  main bundle
  └─ lazyApp.jsx → dynamic import
     └─ VportDashboardReviewScreen  [lazy chunk — loads on navigation]
        └─ VportReviewsView.adapter
           └─ VportReviewsView
              ├─ VportReviewComposeForm
              ├─ ReviewsList
              ├─ VportReviewDeleteModal
              ├─ VportReviewStars
              └─ VportReviewsControls
        └─ (hooks + controllers + DALs bundled with view chunk)
        └─ engines/reviews/* [bundled in chunk — significant size]

Public reviews path (unauthenticated):
  main bundle
  └─ lazyPublic.jsx → dynamic import
     └─ VportPublicReviewsBySlugScreen  [separate lazy chunk]
        └─ VportPublicReviewsView
           └─ VportPublicReviewsPanel
              └─ VportPublicReviewEmptyState / VportPublicReviewSummary
        └─ (public hooks + DALs bundled with public chunk)
        [No engines/reviews import in public path]
```

**Key finding:** The authenticated path bundles `engines/reviews` (14 files across
controller, DAL, model, service layers). The public path does NOT — it reads public
views directly, keeping its chunk smaller and cleaner.

---

## Bundle Size Signals

| Bundle Contribution | Size Signal | Notes |
|---|---|---|
| engines/reviews (14 source files) | MEDIUM | Only in authenticated chunk |
| @reviews alias resolution | MEDIUM | Imported by VportReviews.controller only |
| Dead DALs (3 files) | LOW waste | Tree-shaken if not imported — confirmed not imported |
| reviewDimensions.config.js | LOW waste | 140-line config — tree-shaken if not imported |
| lucide-react (Star, MessageSquare) | LOW | Per-icon import — tree-shakeable |

---

## Server/Client Boundary Violations

NONE — this is a pure client-side Vite SPA. No boundary violations possible
(there is no server component layer to violate).

---

## Hydration Risk

NONE — no SSR. All components mount fresh in the browser.

Desktop portal (createPortal to document.body):
```
VportDashboardReviewScreen.jsx:58-73
  if (isDesktop && typeof document !== "undefined") {
    return createPortal(<div ...>{content}</div>, document.body)
  }
```
Guard `typeof document !== "undefined"` is present — safe for any future SSR transition.
Portal renders outside the component tree — correct iOS stacking context pattern.

---

## Dynamic Import Patterns

```
VportReviews.controller.js uses two dynamic imports inside ctrlGetReviewFormConfig:
  const { default: readVportTypeByActorId } = await import(
    '@/features/profiles/kinds/vport/dal/services/readVportTypeByActorId.dal'
  )

This import is called:
  1. Inside ctrlGetReviewFormConfig (on mount)
  2. Inside ctrlSubmitReview (on every submit — DUPLICATE dynamic import)

Each dynamic import() call triggers a module resolution. Vite bundles these statically
at build time (no true code-splitting for inline dynamic imports of local modules),
so this is not a lazy-split boundary — it's an unnecessary await pattern.

Risk: LOW for bundle. MEDIUM for readability — looks like a code-split but isn't.
Fix: Convert to static import at module top. The DAL is always needed when the controller loads.
```

---

## Client-Side Data Exposure Risk

| Data | Exposed In Client Bundle | Risk |
|---|---|---|
| REVIEW_COLUMNS (DB column list) | engines/reviews/src/dal/reviews.read.dal.js | LOW — column names only, not data |
| RATING_COLUMNS (DB column list) | engines/reviews/src/dal/dimensionRatings.read.dal.js | LOW |
| RPC function names | engines/reviews/src/dal/reviews.rpc.dal.js | LOW — public schema info |
| Supabase URL + anon key | supabase client (platform level, not reviews) | Already public by design |
| isActorOwner logic | features/reviews/setup.js (bundled) | LOW — logic is visible but DB enforces real auth |

No secrets or private keys detected in the reviews module bundle surface.
