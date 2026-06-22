# Module: Reviews

## PWA Source of Truth

**Routes:** `/profile/:slug/reviews`, `/vport/:slug/reviews`, `/vport/:slug/reviews/qr`

**Screens/components:**
- `apps/VCSM/src/features/reviews/*`
- `apps/VCSM/src/features/public/vportMenu/components/VportPublicReviewsPanel.jsx`
- `apps/VCSM/src/features/public/vportMenu/view/VportPublicReviewsQrView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/review/*`

**Services/DAL:**
- `apps/VCSM/src/services/supabase/reviewsClient.js`
- `apps/VCSM/src/features/public/vportMenu/dal/readPublicVportReviews.dal.js`
- `apps/VCSM/src/features/public/vportMenu/dal/readPublicVportReviewSummary.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/review/VportReviews.controller.js`

**Supabase schema/tables/RPCs:**
- `reviews.public_vport_reviews_v`
- `reviews.public_vport_review_summary_v`
- `reviews.public_vport_review_dimensions_v`
- `reviews.upsert_neutral_review`

**RLS expectations:** Public reviews use public views; review writes must be authenticated citizens and must reject owner self-review.

**Current PWA status:** Source of truth for public reviews list/summary/dimensions and citizen review submission rules.

---

## Native Transfer Status

**Status:** `Partial`

---

## Transferred Native Files

- `VCSMNativeApp/Features/PublicMenu/DAL/PublicMenuReads.dal.swift`
- `VCSMNativeApp/Features/PublicMenu/Screens/VPortPublicMenuViewScreen.swift`
- `VCSMNativeApp/Features/Profile/DAL/ProfileContentReads.dal.swift`
- `VCSMNativeApp/Features/Profile/DAL/ProfileReviewsWrites.dal.swift`
- `VCSMNativeApp/Features/Dashboard/DAL/DashboardReviews.dal.swift`
- `VCSMNativeApp/Features/Profile/Screens/VPortReviewComposerScreen.swift`

---

## Native Behavior Currently Present

- Native reads public review summary/dimensions/reviews, profile reviews, dashboard reviews, and has a review composer write DAL.

---

## Native Gaps

- Write path RPC/function contract not verified against `reviews.upsert_neutral_review`.
- QR route and dedicated public reviews surface parity not validated.
- Owner self-review guard and blocked author filtering parity with PWA not confirmed.

---

## Risk Notes

- `PublicMenuReads.dal.swift:335-376` uses `reviews` public views.
- `ProfileReviewsWrites.dal.swift:77-141` writes `reviews` schema — must match approved RPC contract.
- Schema drift in review dimension keys or public view field names will cause display bugs and RLS failures.

---

## Pending Transfer Checklist

- [x] Confirm native write DAL matches `reviews.upsert_neutral_review` signature and RLS expectations — verified 2026-05-04: RPC params match (p_target_actor_id, p_author_actor_id, p_body), dimension ratings upserted to `reviews.review_dimension_ratings` with correct conflict key, rating validation 1-5.
- [x] Confirm owner self-review guard — `ProfileReviewsWrites.dal.swift:60` checks `targetActorID != authorActorID`.
- [x] Confirm author-kind guard — `VPortReviewComposerScreen.swift:457` checks `activeIdentity.kind == .profile` (citizen only).
- [x] Confirm QR route — `publicReviewsQR(actorID:)` exists in NativeAppRoute, URL parsing covers `/actor/`, `/vport/`, `/profile/` prefixes, dedicated screen with `ActorGuardedRouteScreen`.
- [ ] Runtime test: public reviews list, dimensions, summary, QR sharing, and service-mode filters.
- [ ] Runtime test: citizen review creation and owner self-review rejection.

---

## PWA → Native Transfer Log

- Date:
- Change type: Feature / Fix / Schema / UI / RLS
- PWA files changed:
- Routes affected:
- Screens/components changed:
- Services/DAL changed:
- Behavior change:
- Supabase schema/RPC change:
- RLS expectations changed:
- Affected native modules:
- Priority: P0 / P1 / P2
- Native status: Not started / Partial / Risky / Complete
- Testing notes:
- Notes:

---

## Transfer History

- Last synced date: 2026-05-04
- Native files updated: none — verification only
- Delta status: Near-complete — write RPC verified, QR route verified, self-review + author-kind guards verified. Only runtime testing remains.
- Notes: Code audit confirmed full parity with PWA review flow. RPC signature, dimension key→ID mapping, rating validation, public view reads, and QR routing all match.

### Previous entries

- Synced: 2026-05-03
- Delta: Partial — write RPC parity and QR route unverified
- Notes: Initial tracker from ROADTRIP.docx May 3 refresh

---

## Archived Notes

No archived notes yet.
