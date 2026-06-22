# Module: Supabase schema usage — reviews

## PWA Source of Truth

**Routes:** Reviews used in profile, public menu, dashboard, and review composer routes

**Screens/components:**
- `apps/VCSM/src/features/reviews/*`
- `apps/VCSM/src/features/public/vportMenu/*`
- `apps/VCSM/src/features/profiles/kinds/vport/*`

**Services/DAL:**
- `apps/VCSM/src/services/supabase/reviewsClient.js`
- `apps/VCSM/src/features/public/vportMenu/dal/readPublicVportReview*.js`

**Supabase schema/tables/RPCs:**
- `reviews.public_vport_reviews_v`
- `reviews.public_vport_review_summary_v`
- `reviews.public_vport_review_dimensions_v`
- `reviews.upsert_neutral_review`

**RLS expectations:** Public read views can be anon-safe; review writes are authenticated citizen-only and must prevent self-review.

**Current PWA status:** PWA reviews schema usage is explicit and mostly centralized through `reviewsClient.js`.

---

## Native Transfer Status

**Status:** `Partial`

---

## Transferred Native Files

- `VCSMNativeApp/Features/PublicMenu/DAL/PublicMenuReads.dal.swift`
- `VCSMNativeApp/Features/Profile/DAL/ProfileContentReads.dal.swift`
- `VCSMNativeApp/Features/Profile/DAL/ProfileReviewsWrites.dal.swift`
- `VCSMNativeApp/Features/Dashboard/DAL/DashboardReviews.dal.swift`

---

## Native Behavior Currently Present

- Native uses `schema: "reviews"` in public menu, profile content, profile review writes, and dashboard review DALs.

---

## Native Gaps

- Function/RPC name parity for review writes not confirmed against `reviews.upsert_neutral_review`.
- Ongoing sync needed if PWA changes review dimension keys or public view field names.

---

## Risk Notes

- Reviews touch public surfaces and authenticated writes — schema drift causes both display bugs and RLS failures.
- Always record future PWA reviews view/RPC changes in this file before starting native work.

---

## Pending Transfer Checklist

- [ ] Record every future PWA reviews view/RPC change in this file before native work begins.
- [ ] Run native profile/public menu/dashboard review smoke tests after any schema changes.

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

- Last synced date: 2026-05-03
- Native files updated: (none — tracker refresh only)
- Delta status: Partial — write RPC parity unconfirmed
- Notes: Initial tracker from ROADTRIP.docx May 3 refresh

---

## Archived Notes

No archived notes yet.
