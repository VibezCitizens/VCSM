---
name: vcsm.public.index
description: VCSM public feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / public

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 12 | getVportPublicDetails, getVportPublicMenu, getVportPublicReviews, resolveMenuSlug, resolveVportSlug, vportBusinessCard (3 controller exports), plus callgraph expansions |
| DAL files | 15 | businessCardSections.read, sendLeadConfirmationEmail.edge, vportBusinessCard.read, vportBusinessCardLead.write, readPublicVportReviewDimensions, readPublicVportReviewSummary, readPublicVportReviews, readVportPublicDetails.rpc, readVportPublicMenu.rpc, resolveMenuSlug, resolveVportSlug |
| Hooks | 8 | useVportBusinessCardExperience, useVportBusinessCardLeadForm, useVportBusinessCardSections, useDesktopBreakpoint, useResolveMenuSlug, useResolveVportSlug, useVportPublicDetails, useVportPublicMenu, useVportPublicReviews |
| Models | 43 | businessCardSettings.model, vportBusinessCard.model, vportPublicDetails.model, vportPublicMenu.model, vportPublicMenuPanel.model, vportPublicReviews.model (callgraph count includes all transform functions) |
| Screens | 10 | VportPublicMenuScreen, VportPublicMenuBySlugScreen, VportPublicMenuQrScreen, VportPublicMenuQrBySlugScreen, VportPublicMenuRedirectScreen, VportPublicReviewsBySlugScreen, VportPublicReviewsQrBySlugScreen, VportBusinessCardPublic.screen, VportMenuRedirect |
| Components | 13 | VportPublicMenuPanel, VportPublicReviewCard, VportPublicReviewDimensions, VportPublicReviewEmptyState, VportPublicReviewSummary, VportPublicReviewsPanel, BusinessCardLeadForm, BusinessCardMainCard, BusinessCardSectionCard, businessCardExtraSection, businessCardHelpers, businessCardPrimarySection, businessCardSections |
| Adapters | 1 | vportMenu.adapter.js |
| Barrels | 19 | vportBusinessCard/index.js and internal view/module barrels (callgraph count) |
| Tests | 0 | No test files detected by scanner |
| Routes | 0 | No entries in scanner route-map output — route registration needs HAWKEYE verification |
| Total source files | 64 | From scanner sourceFileCount |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| rpc | — | — | readBusinessCardSectionsDAL → get_business_card_sections |
| edge_function | — | — | sendLeadConfirmationEmailDAL |
| rpc | — | — | readVportBusinessCardPublicBySlugDAL → read_business_card_public |
| rpc | — | — | createVportBusinessCardLeadDAL → submit_business_card_lead |

## Security-Sensitive Surfaces

- **submit_business_card_lead (RPC)** — Anonymous write surface. Accepts name/phone/email/message/userAgent from an unauthenticated caller. Relies entirely on SECURITY DEFINER server-side enforcement for slug validity and rate limiting. VENOM audit recommended.
- **sendLeadConfirmationEmailDAL (edge function)** — Sends email to the lead's provided address. No retry logic visible in source. If the edge function is misconfigured, lead confirmation silently fails.
- **read_business_card_public (RPC)** — Public read; low risk, but exposes Vport business card data by slug. Ensure RPC does not leak unpublished cards.

## Engine Dependencies

- lead
- menu
- notification
- profile
- qr
- review

## Routes

No routes detected in scanner route-map output. Nine screens identified in source scan. Route registration must be verified at the app router level by HAWKEYE.

Known screen entry points (from source scan):
- VportPublicMenuScreen — `/profile/:actorId/menu`
- VportPublicMenuBySlugScreen — `/profile/:slug/menu`
- VportPublicMenuQrBySlugScreen — `/profile/:slug/menu/qr`
- VportPublicMenuQrScreen — `/profile/:actorId/menu/qr`
- VportPublicReviewsBySlugScreen — `/profile/:slug/reviews`
- VportPublicReviewsQrBySlugScreen — `/profile/:slug/reviews/qr`
- VportPublicMenuRedirectScreen — redirect helper
- VportBusinessCardPublic.screen — `/public/:slug`
- VportMenuRedirect — `/menu-redirect`

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (PLACEHOLDER — needs real content) |
| ARCHITECTURE.md | PRESENT (this run) |
| CURRENT_STATUS.md | PRESENT (this run) |
