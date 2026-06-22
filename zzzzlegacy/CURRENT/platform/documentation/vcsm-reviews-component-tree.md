# VCSM Reviews — Component Tree Map

Scope: VCSM (reviews module)
Scan Date: 2026-05-24
ARCHITECT Version: 26.14

---

## Authenticated Dashboard Tree

```
/actor/:actorId/dashboard/reviews
└─ VportDashboardReviewScreen        [FINAL SCREEN — route entry, identity gate]
   Props: targetActorId (from useParams or prop)
   Hooks: useParams, useIdentity, useVportOwnership, useDesktopBreakpoint
   State: none (hook-only)
   Renders: VportBackButton + VportReviewsView (via adapter)
   On desktop: wraps in createPortal → document.body (iOS safe)
   │
   ├─ VportBackButton                [COMPONENT — navigation only]
   │   Props: isDesktop, onClick
   │   No hooks, no state
   │
   └─ VportReviewsView.adapter       [ADAPTER — 2-line re-export]
      │
      └─ VportReviewsView            [VIEW SCREEN — ⚠️ owns compose form state]
         Props: targetActorId, profile, viewerActorId, mode
         Hooks:
           useTranslation()           — i18n
           useIdentity()              — session actor (DUAL IMPORT PATH ⚠️)
           useActorConsistencyCheck() — debugger (dev-only stub)
           useVportReviews(targetActorId) — main data hook
         Local State (BOUNDARY VIOLATION — should be in hook):
           body, ratingsMap, activeDimKey, submitting, submitErr
         Local State (acceptable UI):
           showDeleteConfirm
         │
         ├─ [Summary Card]           [inline JSX — no separate component]
         │   Shows: overallAverage, totalReviews, verified badge
         │   Reads: r.overallAverage, r.totalReviews, r.officialStats
         │
         ├─ [Error Banner]           [inline JSX]
         │   Shows when: r.error != null
         │
         ├─ [Owner Tabs]             [inline JSX — mode="owner" only]
         │   Shows: Overall / Services / per-dimension tabs
         │   Uses: TabButton component
         │   │
         │   ├─ TabButton            [COMPONENT — presentational]
         │   │   Props: active, onClick, children
         │   │   No hooks, no state
         │   │
         │   └─ [Service Selector]  [inline <select> — no component]
         │       Uses: r.services, r.serviceId, r.setServiceId
         │
         ├─ VportReviewComposeForm   [COMPONENT — presentational ✓]
         │   Props: (17 props — all state passed from view)
         │   No local state (all state passed via props from view — view boundary violation)
         │   No data fetching
         │   Hooks: useTranslation() only
         │   │
         │   ├─ [Dimension Pills]   [inline JSX]
         │   │   Iterates: dynamicDimensions
         │   │   Reads: ratingsMap, activeDimKey
         │   │
         │   ├─ [Rating Panel]      [inline JSX per active dimension]
         │   │   Uses: InputStars component
         │   │   │
         │   │   └─ InputStars      [COMPONENT — interactive star input]
         │   │       Props: value, label, onChange
         │   │       No hooks, no state
         │   │
         │   ├─ [Progress Bar]      [inline JSX — ratedCount/totalDims]
         │   │
         │   ├─ [Comment Textarea]  [inline JSX]
         │   │   Uses: body, setBody
         │   │
         │   ├─ [Error Display]     [inline JSX — submitErr]
         │   │
         │   └─ [Submit / Cancel]   [inline buttons]
         │       Calls: onSubmit, onCancelEdit
         │
         ├─ ReviewsList             [COMPONENT — pure display list]
         │   Props: loading, reviews, viewerActorId, onEdit, onDelete,
         │          hasMore, loadingMore, onLoadMore
         │   No hooks, no state
         │   No data fetching
         │   Internal: StarMeter, pickAuthor, formatDateTime, formatScore
         │   │
         │   ├─ [Loading Skeleton]  [3 animated placeholder cards]
         │   ├─ [Empty State]       [MessageSquare icon + copy]
         │   └─ [Review Cards]      [mapped from reviews array]
         │       Each card: author row, star rating, body, edit/delete actions
         │       Uses: Link (react-router-dom) for author navigation
         │       └─ [Load More button] [when hasMore=true]
         │
         └─ VportReviewDeleteModal  [COMPONENT — confirm dialog]
             Props: open, onClose, isDeleting, onDelete
             No hooks, no state
             Renders as fragment (portal-safe)
```

---

## Public Route Tree (Unauthenticated)

```
/profile/:slug/reviews
└─ VportPublicReviewsBySlugScreen    [FINAL SCREEN — slug resolution + gate]
   Hooks: useParams, useResolveVportSlug
   Renders: VportPublicReviewsView
   │
   └─ VportPublicReviewsView         [VIEW SCREEN — display only]
      Hooks: useVportPublicDetails, useVportPublicReviews
      │
      ├─ [Banner + Header]           [inline JSX]
      └─ VportPublicReviewsPanel     [COMPONENT]
         │
         ├─ VportPublicReviewSummary [COMPONENT — aggregate display]
         └─ VportPublicReviewEmptyState [COMPONENT — empty state]

/profile/:slug/reviews/qr
└─ VportPublicReviewsQrBySlugScreen  [FINAL SCREEN — slug + QR render]
   └─ VportPublicReviewsQrView       [VIEW SCREEN — QR layout]
```

---

## Profile Tab Entry (secondary context)

```
VportProfileViewScreen
└─ VportProfileTabContent
   └─ [REVIEWS tab active]
      └─ VportReviewsTab             [thin wrapper — passes profile + viewerActorId]
         └─ VportReviewsView         [same view as dashboard, mode="public"]
            [Same component tree as above — mode controls owner tabs vs compose form]
```

---

## Component Responsibility Audit

| Component | Hooks | Local State | Data Fetch | Status |
|---|---|---|---|---|
| VportDashboardReviewScreen | 4 | none | no | ✅ COMPLIANT (final screen) |
| VportBackButton | none | none | no | ✅ CLEAN |
| VportReviewsView.adapter | none | none | no | ✅ CLEAN (re-export) |
| VportReviewsView | 4 + useVportReviews | 6 useState | no (hooks only) | ⚠️ BOUNDARY VIOLATION |
| VportReviewComposeForm | useTranslation | none | no | ✅ COMPLIANT (all state passed via props) |
| InputStars | none | none | no | ✅ CLEAN |
| TabButton | none | none | no | ✅ CLEAN |
| ReviewsList | useMemo (internal) | none | no | ✅ CLEAN |
| VportReviewDeleteModal | none | none | no | ✅ CLEAN |
| VportReviewsTab (profile tab) | none | none | no | ✅ CLEAN (thin wrapper) |
| VportPublicReviewsBySlugScreen | useParams + useResolveVportSlug | none | no | ✅ COMPLIANT |
| VportPublicReviewsView | 2 hooks | none | no | ✅ COMPLIANT |
| VportPublicReviewsPanel | none | none | no | ✅ CLEAN |

**One violation found:** VportReviewsView — fix: extract `useVportReviewCompose.js`

---

## Props Drilling Risk Assessment

```
VportReviewsView passes 17 props to VportReviewComposeForm:
  canCompose, myExists, isEditing, reviewAuthorActorId, sessionActorId,
  targetActorId, dynamicDimensions, activeDimKey, setActiveDimKey,
  activeDimension, ratingsMap, setRatingsMap, normalizedRatings,
  ratedCount, totalDims, body, setBody, submitting, submitErr,
  onSubmit, onStartEdit, onCancelEdit

Risk: MEDIUM — deep prop drilling from view to component.
Root cause: Compose form state lives in the view (boundary violation).
Fix: useVportReviewCompose hook encapsulates the state. VportReviewComposeForm
     only needs: { hook result spread } — reducing to ~5 props.
```

---

## Render Trigger Summary

| Trigger | Components Re-rendered | Cost |
|---|---|---|
| Tab change | VportReviewsView + all children | HIGH (full list refetch) |
| Service selection | VportReviewsView + ReviewsList | MEDIUM |
| Review submitted | VportReviewsView (optimistic insert) | LOW (optimistic) |
| Dimension pill clicked (ratingsMap) | VportReviewsView + VportReviewComposeForm | LOW |
| Star rating changed | VportReviewsView + VportReviewComposeForm | LOW |
| Load more | ReviewsList only | LOW |
| Delete confirmed | VportReviewsView (list + stats refetch) | MEDIUM |
