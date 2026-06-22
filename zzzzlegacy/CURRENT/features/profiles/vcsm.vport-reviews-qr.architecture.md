# MODULE ARCHITECTURE REPORT

**Module:** vport-reviews-qr
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Reviews + QR Code Entry System
**Primary Root:**
- `apps/VCSM/src/features/public/vportMenu/` (QR reviews screens)
- `apps/VCSM/src/features/dashboard/qrcode/` (shared QR primitives)
- `apps/VCSM/src/features/profiles/kinds/vport/controller/review/` (reviews controllers)
- `apps/VCSM/src/features/profiles/kinds/vport/hooks/review/` (reviews hooks)
- `apps/VCSM/src/features/profiles/kinds/vport/screens/review/` (reviews view)
- `apps/VCSM/src/features/settings/vports/ui/` (settings QR modal)
- `apps/VCSM/src/features/booking/hooks/` (booking QR links)
**Independence Status:** DEPENDENT — reviews depend on `@reviews` engine; QR depends on `@booking` engine for link management
**Completeness Status:** INCOMPLETE — QR system has 3 parallel implementations; service review FK is absent; no centralized URL builder; `BookingQrLinksPanel` uses banned `profileId` identity surface
**Scan Date:** 2026-05-26
**Produced By:** ARCHITECT v26.14

---

## PURPOSE

This module covers two interconnected surfaces:

### A — VPORT Reviews (Citizen → Vport)
The public and owner-facing review system for VPORT actors. Supports:
- Citizen submission of multi-dimension star ratings with optional text body
- Owner receipt of notifications when review is posted
- Paginated review list (overall, by service, by dimension)
- Edit / soft-delete by reviewer
- Review form config resolved from `vport_type` (gas station → gas dimensions; barbershop → service dimensions)
- Engine-backed (delegates to `@reviews`)

### B — Reviews QR Code Entry
The QR-code-scannable entry point for a VPORT's reviews page:
- Standalone full-screen QR display at `/profile/:slug/reviews/qr` and `/actor/:actorId/reviews/qr`
- QR encodes the public reviews URL (`/profile/:slug/reviews`)
- Supports copy-to-clipboard and open-in-new-tab actions

### C — QR Code System (Cross-VPORT)
The broader QR code infrastructure used across the platform:
- Shared `QrCode` component (dashboard/qrcode)
- Flyer-printable QR formats
- Settings modal for business card QR
- Booking-linked QR (tracked scan count via `@booking` engine)

---

## OWNERSHIP

**Reviews feature owner:** `apps/VCSM/src/features/profiles/kinds/vport/`
**Reviews QR screen owner:** `apps/VCSM/src/features/public/vportMenu/`
**QR primitives owner:** `apps/VCSM/src/features/dashboard/qrcode/`
**Booking QR owner:** `apps/VCSM/src/features/booking/`
**Engine dependency:** `@reviews` (external package), `@booking` (external package)

---

## ENTRY POINTS

| Entry | Route | File | Auth |
|---|---|---|---|
| Reviews QR by slug | `/profile/:slug/reviews/qr` | `VportPublicReviewsQrBySlugScreen.jsx` | Public (no auth) |
| Reviews QR by actorId | `/actor/:actorId/reviews/qr` | _(implied via redirect)_ | Public (no auth) |
| Reviews tab (profile) | `/actor/:actorId/reviews` | `VportReviewsView.jsx` | Public (submit requires auth) |
| Business card QR (settings) | Settings modal | `VportsQrModal.jsx` | Owner |
| Booking QR panel | Booking section | `BookingQrLinksPanel.jsx` | Owner |
| Flyer builder QR | Flyer builder screen | `PrintableQrFlyerCard.jsx` | Owner |
| Profile header QR modal | Profile header button | `ProfileHeaderQRCodeModal.jsx` | Owner |

---

## LAYER MAP

### DAL
| File | Purpose |
|---|---|
| `dal/review/reviewTarget.read.dal.js` | Validates target actor exists, kind=vport, not void |
| `dal/services/readVportServicesByActor.dal.js` | Reads active services for review filtering |
| `dal/services/readVportTypeByActorId.dal.js` | Resolves vport_type for dimension config |

### Model
| File | Purpose |
|---|---|
| _(engine-owned)_ | Review shape — managed by `@reviews` engine |
| `controller/review/vportReviews.mappers.js` | Maps engine → app hook contract |
| `mapDimension()` | Engine dimension → `{ vportType, dimensionKey, label, weight, sortOrder }` |
| `mapStats()` | Engine stats → `{ totalReviews, overallAverage, ... }` |
| `mapRating()` | Engine rating → app rating |
| `mapReview()` | Engine review → app review |

### Controller
| File | Exports |
|---|---|
| `controller/review/VportReviews.controller.js` | `ctrlGetReviewFormConfig`, `ctrlAssertReviewTargetActor`, `ctrlGetOfficialStats`, `ctrlListReviews`, `ctrlSubmitReview`, `ctrlDeleteMyReview`, `ctrlGetMyActiveReview` |
| `controller/review/VportServiceReviews.controller.js` | `ctrlListReviewServices`, `ctrlListServiceReviews`, `ctrlListServicesForReviews` (alias), `ctrlListReviewsForService` (alias) |

### Hook
| File | Exports |
|---|---|
| `hooks/review/useVportReviews.js` | Main orchestrator — tabs, stats, list, compose, delete |
| `hooks/review/useVportReviewCompose.js` | Compose form state |
| `hooks/review/useVportReviewList.js` | Pagination + filtering |
| `hooks/review/useVportReviewMine.js` | Viewer's own review |
| `hooks/review/useVportReviews.helpers.js` | `computeDimStatsFromReviews()`, `normalizeInput()`, `pickRecentComments()` |
| `booking/hooks/useQrLinks.js` | Booking QR links (engine-backed) |

### Component
| File | Purpose |
|---|---|
| `screens/review/components/ReviewsList.jsx` | Paginated list |
| `screens/review/components/VportReviewComposeForm.jsx` | Compose/edit form |
| `screens/review/components/VportReviewStars.jsx` | Star display |
| `screens/review/components/VportReviewsControls.jsx` | Tab bar |
| `screens/review/components/VportReviewDeleteModal.jsx` | Soft delete confirm |
| `public/vportMenu/view/VportPublicReviewsQrView.jsx` | Reviews QR card (full screen) |
| `public/vportMenu/view/components/VportPublicReviewCard.jsx` | Single review card (public menu) |
| `dashboard/qrcode/components/QrCode.jsx` | **Canonical QR primitive** |
| `dashboard/qrcode/components/QrCard.jsx` | Styled QR card wrapper |
| `settings/vports/ui/VportsQrModal.jsx` | Business card QR modal |
| `profiles/kinds/vport/screens/booking/components/BookingQrLinksPanel.jsx` | Booking QR list panel |
| `profiles/screens/views/profileheader/ProfileHeaderQRCodeModal.jsx` | Profile header QR modal |
| `profiles/screens/views/profileheader/VisibleQRCode.jsx` | Inline QR wrapper |
| `dashboard/flyerBuilder/components/printableQr/PrintableQrFlyerCard.jsx` | Printable QR flyer |

### Screen
| File | Route |
|---|---|
| `public/vportMenu/screen/VportPublicReviewsQrBySlugScreen.jsx` | `/profile/:slug/reviews/qr` |
| `public/vportMenu/screen/VportPublicMenuQrScreen.jsx` | `/actor/:actorId/menu/qr` (redirects to slug) |
| `profiles/kinds/vport/screens/review/VportReviewsView.jsx` | Embedded in profile review tab |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Reviews + QR entry separated clearly | — |
| Owner defined | PARTIAL | Reviews: vport feature. QR: split across 3 features | No single owner for QR system |
| Entry points mapped | PASS | All screens found and logged above | — |
| Controllers present/delegated | PASS | VportReviews.controller.js + engine delegation | — |
| DAL/repository present/delegated | PASS | 3 DAL files; engine owns review storage | — |
| Models/transformers present | PASS | vportReviews.mappers.js covers all engine shapes | — |
| Hooks/view models present | PARTIAL | 5 review hooks + 1 QR hook | `useVportReviews` oversized — should be split by responsibility |
| Screens/components present | PASS | All screens and components found | — |
| Services/adapters present | PARTIAL | Reviews use adapters; QR system does NOT use unified adapter | `VportPublicReviewsQrView` bypasses shared `QrCode` component |
| Database objects mapped | PARTIAL | `vc.actors`, `reviews` (engine), `review_dimensions`, `review_ratings` | Service FK absent in review schema |
| Authorization path mapped | PARTIAL | Submit requires `authorActorId !== targetActorId`; kind='user' guard | No rate limiting on review submit; no ownership check on stats read |
| Cache/runtime behavior mapped | FAIL | No caching on review reads | Full reload on every mutation (no optimistic update) |
| Error/loading/empty states mapped | PARTIAL | Exists in VportReviewsView | QR view has no loading state for slug resolution |
| Documentation linked | PARTIAL | `vcsm.vport-reviews-dashboard.architecture.md` | QR system has no prior architecture doc |
| Tests/validation noted | FAIL | No tests found | — |
| Native parity noted | FAIL | No iOS parity notes | QR display on iOS needs clipboard + sharing API audit |
| Engine dependencies mapped | PASS | `@reviews` engine confirmed; `@booking` for QR links | — |

---

## ⚠ CRITICAL ARCHITECTURAL FINDINGS

### CRITICAL-1 — Three Parallel QR Implementations (No Canonical Consumer)

The canonical QR primitive is `@/features/dashboard/qrcode/components/QrCode.jsx`.
However, TWO components bypass it and import `react-qr-code` directly:

| Location | Import | Should Use |
|---|---|---|
| `VportPublicReviewsQrView.jsx:3` | `import QRCode from 'react-qr-code'` | `@/features/dashboard/qrcode/components/QrCode` |
| `VisibleQRCode.jsx` | `import QRCode from 'react-qr-code'` | `@/features/dashboard/qrcode/components/QrCode` |
| `VportsQrModal.jsx` | `import { QrCode } from '@/features/dashboard/qrcode/components/QrCode'` | ✅ Correct |
| `PrintableQrFlyerCard.jsx` | _(via dashboard qrcode system)_ | ✅ Correct |

**Risk:** Styling inconsistency; two bundles for the same package; accessibility props applied differently across implementations.

**Fix:** Replace direct `react-qr-code` imports with the shared `QrCode` component.

---

### CRITICAL-2 — No Centralized QR URL Builder

QR values are constructed inline in 3 different ways with inconsistent domain references:

| Location | URL Pattern | Risk |
|---|---|---|
| `VportPublicReviewsQrView.jsx` | `${window.location.origin}/profile/${canonicalSlug}/reviews` | Uses runtime origin — breaks if served from non-canonical origin |
| `VportsQrModal.jsx` | `https://vibezcitizens.com/vport/${target.slug}/card` | Hardcoded production domain — breaks in staging/local |
| `ProfileHeaderQRCodeModal.jsx` | `value` prop (caller-supplied) | Unknown; no contract |
| `BookingQrLinksPanel` | Via `@booking` engine `listQrLinksByProfile` | Engine-managed — external |

**Risk:** QR codes point to different domains in different environments; no single source of truth for canonical URL structure.

**Fix:** Create `apps/VCSM/src/lib/qrUrlBuilders.js` with exported builders:
```js
buildReviewsQrUrl(slug)   → '/profile/:slug/reviews'
buildBusinessCardQrUrl(slug) → '/vport/:slug/card'
buildMenuQrUrl(slug)      → '/profile/:slug/menu'
```
All builders must use `window.location.origin` (not hardcoded domain) for staging/production parity.

---

### CRITICAL-3 — `BookingQrLinksPanel` Uses Banned `profileId` Identity Surface

```
apps/VCSM/src/features/profiles/kinds/vport/screens/booking/components/BookingQrLinksPanel.jsx:34

export function BookingQrLinksPanel({ organizationId = null, profileId = null }) {
  const { qrLinks, isLoading, error } = useQrLinks({
    organizationId,
    profileId,
    ...
  })
```

The `profileId` prop and the `organizationId` prop are **banned identity surfaces** under the VCSM architecture contract. The contract states:
- Identity is actor-based: `actorId` + `kind`
- `profileId` must never be exposed through any hook or public surface

The underlying `useQrLinks` hook passes `profileId` to `listQrLinksByProfile({ profileId })` in the `@booking` engine.

**Risk:** HIGH — Architecture contract violation. If the engine is ever refactored to actor-based, this surface must update.

**Fix:** Migrate `BookingQrLinksPanel` to accept `actorId` only. Coordinate with booking engine adapter to resolve internal `profileId` from `actorId`.

---

### HIGH-1 — `VportPublicReviewsQrView` Has No Loading State During Slug Resolution

```
public/vportMenu/view/VportPublicReviewsQrView.jsx:6
const { canonicalSlug } = useActorCanonicalSlug(actorId);

// reviewsUrl fallback:
if (canonicalSlug) return `${origin}/profile/${canonicalSlug}/reviews`;
return `${origin}/actor/${actorId}/reviews`; // fallback while slug loads
```

While the fallback URL is technically safe, the QR code renders immediately with the actorId URL, then the QR code silently re-renders with the slug URL when the slug resolves — **two different QR codes appear sequentially for the same share action**.

**Risk:** MEDIUM — User may scan the first QR (actorId-based), which will still work but exposes a raw UUID in the URL (violation of "no raw IDs in public URLs" memory rule).

**Fix:** Show a loading skeleton until `canonicalSlug` is resolved. Never display an actorId-based QR on public surfaces.

---

### HIGH-2 — Service Review FK Is Absent

```
controller/review/VportServiceReviews.controller.js:55

const hasServiceBinding = list.some((r) => r?.serviceId || r?.service_id);
if (!hasServiceBinding) return list;
```

The review schema (owned by `@reviews` engine) does not have a hard `service_id` FK. Service filtering is done **in-memory** on the full review list. If no review has a `serviceId`, all reviews are returned regardless of which service tab is selected.

**Risk:** HIGH — Incorrect filtering silently shows all reviews instead of service-scoped reviews. User believes they are viewing service-specific feedback but see global reviews.

**Fix:** Add `service_id` column to the reviews engine schema (requires CARNAGE). Until then, document the fallback behavior in the UI ("Reviews shown are overall reviews — service-specific reviews coming soon.").

---

### MEDIUM-1 — `useVportReviews` Hook Is Oversized

The main hook manages:
- Tab state
- Dimension loading
- Stats loading
- Review list pagination
- Compose form state
- Edit state
- Delete state
- Service picker state

This violates the hook responsibility rule: _hooks manage lifecycle/timing/state wiring only — no business orchestration_.

**Fix:** Split into:
- `useReviewStats(targetActorId)` — stats only
- `useReviewList(targetActorId, { tab, serviceId })` — paginated list
- `useReviewCompose(targetActorId)` — compose/edit/delete

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `@reviews` engine | engine | inbound | YES — engine package | Core review storage and operations |
| `@booking` engine | engine | inbound | YES — via adapter | QR link CRUD |
| `@/features/profiles/adapters/profiles.adapter` | adapter | inbound | YES | `useActorCanonicalSlug` |
| `@/features/notifications/adapters/notifications.adapter` | adapter | outbound | YES | Publish review notification |
| `react-qr-code` (direct) | external | inbound | VIOLATION | Should use shared QrCode component |
| `useResolveVportSlug` | hook | local | YES | Slug → actorId resolution |
| `dalReadReviewTargetActor` | DAL | local | YES | App-local validation |
| `readVportTypeByActorId` | DAL | local | YES | Dimension subtype resolution |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `reviews[]` | read | `@reviews` engine | `ctrlListReviews` | Engine schema change breaks mappers |
| `review_dimensions[]` | read | `@reviews` engine | `ctrlGetReviewFormConfig` | Dimension keys must match UI dimensionKey |
| `review_ratings[]` | read/write | `@reviews` engine | submit/delete controllers | — |
| `vc.actors` (target validation) | read | app DAL | `ctrlAssertReviewTargetActor` | No caching; read on every submit |
| `canonicalSlug` | read/derived | profiles adapter | QR view | Missing loading guard → UUID leaks into public QR |
| `qrLinks[]` | read | `@booking` engine | `useQrLinks` | Uses `profileId` — contract violation |
| `reviewsUrl` (string) | derived | `VportPublicReviewsQrView` | QR display | Inconsistent: uses `window.location.origin` |
| business card URL (string) | derived | `VportsQrModal` | QR display | Inconsistent: hardcoded `vibezcitizens.com` |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry exists | PASS | All QR screens registered | — |
| Loading state exists | PARTIAL | Reviews view has loading states | QR view shows UUID QR while slug loads |
| Empty state exists | PASS | ReviewsList handles empty; QR view handles notFound | — |
| Error state exists | PARTIAL | Reviews view has error display | QR view: notFound shown for slug fail; but actorId-not-found unhandled |
| Auth/owner gate exists | PARTIAL | Submit requires `kind='user'`; citizen-only guard in controller | No rate limiting on submit; no review count cap per author per target |
| Cache behavior known | FAIL | No caching on any review read | Full reload on mutation; N+1 risk on actor validation per submit |
| Runtime dependencies mapped | PASS | All hooks, engines, adapters confirmed | — |
| Hot paths identified | PARTIAL | Submit path: 4 async DB calls (author actor, target actor, vport type, engine dims) | Should parallelize where possible |
| LOKI/KRAVEN handoff recommended | YES | Submit path makes 4 serial async calls before engine call | KRAVEN |

---

## MODULE BOUNDARY WARNINGS

### ⚠ WARNING 1 — Direct `react-qr-code` import in public reviews QR view

```
MODULE BOUNDARY WARNING
Location: apps/VCSM/src/features/public/vportMenu/view/VportPublicReviewsQrView.jsx:3
Module: vport-reviews-qr
Current dependency: import QRCode from 'react-qr-code'
Expected boundary: import { QrCode } from '@/features/dashboard/qrcode/components/QrCode'
Risk: MEDIUM — Two QR render implementations in same app; styling drift; a11y applied differently
Suggested correction: Replace with shared QrCode component
```

### ⚠ WARNING 2 — `BookingQrLinksPanel` exposes `profileId` (contract violation)

```
MODULE BOUNDARY WARNING
Location: apps/VCSM/src/features/profiles/kinds/vport/screens/booking/components/BookingQrLinksPanel.jsx:34
Module: vport-reviews-qr
Current dependency: prop profileId passed to useQrLinks({ profileId })
Expected boundary: prop actorId only; internal resolution of profileId inside adapter
Risk: HIGH — Architecture identity contract violation; exposes banned identity surface
Suggested correction: Migrate to actorId-based interface; booking adapter resolves profileId internally
```

### ⚠ WARNING 3 — UUID leaks into public QR code while slug loads

```
MODULE BOUNDARY WARNING
Location: apps/VCSM/src/features/public/vportMenu/view/VportPublicReviewsQrView.jsx:11-15
Module: vport-reviews-qr
Current dependency: QRCode renders with /actor/:actorId/reviews fallback URL before slug resolves
Expected boundary: No QR render until canonicalSlug is known; UUID must not appear in public-facing QR
Risk: HIGH — Violates "no raw IDs in public URLs" rule; user may scan and bookmark UUID URL
Suggested correction: Gate QR render behind canonicalSlug load; show spinner until slug resolves
```

### ⚠ WARNING 4 — Hardcoded production domain in VportsQrModal

```
MODULE BOUNDARY WARNING
Location: apps/VCSM/src/features/settings/vports/ui/VportsQrModal.jsx:8, 51, 68, 85
Module: vport-reviews-qr
Current dependency: https://vibezcitizens.com/vport/${target.slug}/card (hardcoded)
Expected boundary: window.location.origin + '/vport/${slug}/card'
Risk: MEDIUM — QR codes in staging/dev environments point to production; broken testing workflow
Suggested correction: Replace with centralized qrUrlBuilders.buildBusinessCardQrUrl(slug)
```

### ⚠ WARNING 5 — No service FK in review schema — in-memory filtering fallback

```
MODULE BOUNDARY WARNING
Location: apps/VCSM/src/features/profiles/kinds/vport/controller/review/VportServiceReviews.controller.js:55-59
Module: vport-reviews-qr
Current dependency: In-memory filter of review list by service_id field that may not exist
Expected boundary: Service-scoped reviews should use DB-level query with proper FK join
Risk: HIGH — Service tab silently shows all reviews when no review has service binding
Suggested correction: Add service_id to review schema (CARNAGE) or display in-app disclosure message
```

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Centralized QR URL builder (`qrUrlBuilders.js`) | HIGH | 3 inconsistent URL patterns; hardcoded domains; UUID leaks | Wolverine |
| `BookingQrLinksPanel` actor-based migration | HIGH | Identity contract violation; uses banned `profileId` | Wolverine + Venom |
| QR render gate (slug must resolve before QR shown) | HIGH | UUID leaks into public-facing QR codes | Wolverine |
| Service FK in review schema | HIGH | Service tab filtering is in-memory fallback; shows wrong data | Carnage |
| Replace direct `react-qr-code` imports with shared component | MEDIUM | Styling drift; duplicate bundle; a11y inconsistency | Wolverine |
| Rate limiting on review submit | MEDIUM | No cap on submissions per author per target | Venom |
| Optimistic update on review submit/delete | MEDIUM | Full reload on mutation; janky UX; performance cost | Kraven |
| Split `useVportReviews` into 3 focused hooks | MEDIUM | Hook oversized; single hook owns 7+ responsibilities | Wolverine |
| Clipboard + share API audit for iOS | MEDIUM | `navigator.clipboard.writeText` not reliable on all iOS Safari versions | Falcon |
| QR accessibility labels | MEDIUM | No `aria-label` on QR images; screen reader context missing | Sentry |
| Tests | HIGH | No test coverage for QR URL generation, review submit, or service filter | Sentry |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc (reviews dashboard) | `vcsm.vport-reviews-dashboard.architecture.md` | PRESENT |
| Logan doc (public reviews) | `vcsm.reviews.architecture.md` | PRESENT |
| Logan doc (reviews QR system) | This file | PRESENT |
| Ownership record | Implicit via feature folder | PRESENT |
| Security audit | `vcsm-security-report.md` (partial) | PRESENT |
| Reviews-specific security | `vcsm-reviews-rls-assumption-map.md` | PRESENT |
| Runtime audit | MISSING | MISSING |
| Performance audit | MISSING | MISSING |
| Native transfer audit | MISSING | MISSING |
| Engine audit (`@reviews`) | MISSING | MISSING |

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P0 | Fix UUID leak in `VportPublicReviewsQrView` — gate QR behind slug resolution | No raw IDs in public URLs — platform rule violation | Wolverine |
| P0 | Migrate `BookingQrLinksPanel` from `profileId` to `actorId` | Identity contract violation | Wolverine + Venom |
| P1 | Create `qrUrlBuilders.js` — centralized QR URL builder | Eliminates domain inconsistency and URL fragmentation | Wolverine |
| P1 | Replace direct `react-qr-code` imports with shared `QrCode` component | Canonical primitive bypass — styling/a11y drift | Wolverine |
| P1 | Add service FK to review schema or disclose fallback in UI | Service tab silently shows wrong data | Carnage (schema) → Wolverine (UI disclosure) |
| P2 | Split `useVportReviews` into `useReviewStats`, `useReviewList`, `useReviewCompose` | Hook responsibility compliance | Wolverine |
| P2 | Add optimistic update to review submit/delete | UX quality + performance | Kraven |
| P2 | Rate limiting on review submit | Security hardening | Venom |
| P3 | QR accessibility attributes | A11y baseline | Sentry |
| P3 | iOS clipboard/share API audit | Native parity | Falcon |

---

## SPAGHETTI SCORE

**Module:** vport-reviews-qr
**Score:** TANGLED

**Reasons:**
- QR code has no single owner — 3 implementations across 3 features with no shared pattern
- `VportPublicReviewsQrView` bypasses the canonical QR primitive
- `BookingQrLinksPanel` violates the identity contract
- No centralized URL builder — 3 inline patterns, 2 domain approaches
- `useVportReviews` does 7+ things (tabs, dimensions, stats, list, compose, edit, delete)
- Service review FK absent — in-memory filtering creates invisible correctness bug

**Release Risk:** MEDIUM — QR works functionally but UUID leak, domain inconsistency, and service tab silent fallback are observable by end users and violate platform contracts.

---

## FINAL MODULE STATUS: INCOMPLETE

_Critical gaps: UUID in public QR, profileId identity violation, no QR URL builder, service FK absent._

## RECOMMENDED HANDOFFS

- **WOLVERINE** — P0 fixes: UUID QR gate, profileId migration, qrUrlBuilders.js, replace raw imports
- **CARNAGE** — Service FK schema addition to `@reviews` engine (or app-side review table)
- **VENOM** — Identity contract violation (profileId); rate limiting on submit; RLS on review reads
- **KRAVEN** — 4-serial-async submit path; full reload on mutation
- **FALCON** — iOS clipboard API; native QR share sheet parity
- **SENTRY** — A11y on QR images; test coverage for URL builders and submit guard
- **LOGAN** — Link this doc from reviews architecture files; update engine audit
