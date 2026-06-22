# MODULE ARCHITECTURE REPORT

**Module:** public
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Public VPORT Surfaces (Menu & Business Card)
**Primary Root:** `apps/VCSM/src/features/public/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns all unauthenticated public surfaces for VPORTs: the public QR menu (accessible via QR code, no auth required), the public business card (shareable link with lead capture form), and the vport menu redirect handler. These are the primary surfaces that external visitors (e.g., restaurant customers, barbershop clients) interact with without needing a VCSM account.

---

## ENTRY POINTS

- `/m/:slug` → `VportPublicMenuBySlugScreen.jsx`
- `/m/:slug/qr` → `VportPublicMenuQrBySlugScreen.jsx`
- `/m/vport/:actorId` → `VportPublicMenuScreen.jsx`
- `/m/vport/:actorId/qr` → `VportPublicMenuQrScreen.jsx`
- `/m/redirect/:vportId` → `VportMenuRedirect.jsx`
- `/m/:slug/reviews` → `VportPublicReviewsBySlugScreen.jsx`
- `/m/:slug/reviews/qr` → `VportPublicReviewsQrBySlugScreen.jsx`
- `/card/:slug` → `VportBusinessCardPublic.screen.jsx` (business card)
- Public menu redirect: `/m/redirect` → `VportMenuRedirect.jsx`

---

## LAYER MAP

**vportMenu/ sub-module:**
DAL: `readPublicVportReviewDimensions.dal.js`, `readPublicVportReviewSummary.dal.js`, `readPublicVportReviews.dal.js`, `readVportPublicDetails.rpc.dal.js`, `readVportPublicMenu.rpc.dal.js`, `resolveMenuSlug.dal.js`, `resolveVportSlug.dal.js`
Controllers: `getVportPublicDetails.controller.js`, `getVportPublicMenu.controller.js`, `getVportPublicReviews.controller.js`, `resolveMenuSlug.controller.js`, `resolveVportSlug.controller.js`
Hooks: `useDesktopBreakpoint.js`, `useResolveMenuSlug.js`, `useResolveVportSlug.js`, `useVportPublicDetails.js`, `useVportPublicMenu.js`, `useVportPublicReviews.js`
Models: `vportPublicDetails.model.js`, `vportPublicMenu.model.js`, `vportPublicMenuPanel.model.js`, `vportPublicReviews.model.js`
Components: `VportPublicMenuPanel.jsx`, `VportPublicReviewCard.jsx`, `VportPublicReviewDimensions.jsx`, `VportPublicReviewEmptyState.jsx`, `VportPublicReviewSummary.jsx`, `VportPublicReviewsPanel.jsx`
Screens: `VportPublicMenuBySlugScreen.jsx`, `VportPublicMenuQrBySlugScreen.jsx`, `VportPublicMenuQrScreen.jsx`, `VportPublicMenuRedirectScreen.jsx`, `VportPublicMenuScreen.jsx`, `VportPublicReviewsBySlugScreen.jsx`, `VportPublicReviewsQrBySlugScreen.jsx`
Views: `VportPublicMenuQrView.jsx`, `VportPublicMenuView.jsx`, `VportPublicReviewsQrView.jsx`, `VportPublicReviewsView.jsx`, `vportPublicMenuView.styles.js`
Adapter: `vportMenu.adapter.js`

**vportBusinessCard/ sub-module:**
DAL: `businessCardSections.read.dal.js`, `sendLeadConfirmationEmail.edge.dal.js`, `vportBusinessCard.read.dal.js`, `vportBusinessCardLead.write.dal.js`
Controller: `vportBusinessCard.controller.js`
Hooks: `useVportBusinessCardExperience.js`, `useVportBusinessCardLeadForm.js`, `useVportBusinessCardSections.js`
Models: `businessCardSettings.model.js`, `vportBusinessCard.model.js`
Screen: `VportBusinessCardPublic.screen.jsx`
Views: `BusinessCardLeadForm.jsx`, `BusinessCardMainCard.jsx`, `VportBusinessCardPublic.view.jsx`, many view components
Index: `index.js`

**screens/ root:**
- `VportMenuRedirect.jsx`

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Public VPORT surfaces clear | — |
| Owner defined | PARTIAL | No IRONMAN record | — |
| Entry points mapped | PASS | 8+ screens routed | — |
| Controllers present/delegated | PASS | 6 controllers | — |
| DAL/repository present/delegated | PASS | 11 DAL files | — |
| Models/transformers present | PASS | 6 models | — |
| Hooks/view models present | PASS | 9 hooks | — |
| Screens/components present | PASS | 8 screens + 10 components | — |
| Services/adapters present | PASS | 2 adapters | — |
| Database objects mapped | PARTIAL | vport schema, RPC calls | Lead email edge function not documented |
| Authorization path mapped | PASS | Public = no auth required by design | — |
| Cache/runtime behavior mapped | FAIL | Not documented | Public menu is high-traffic — caching critical |
| Error/loading/empty states mapped | PARTIAL | Review empty state present | Menu empty state unclear |
| Documentation linked | FAIL | No Logan doc | — |
| Tests/validation noted | FAIL | No tests | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | No engine deps | — |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| VPORT public menu | read | public (via RPC) | Public menu screens | Unauthenticated — RLS must protect |
| VPORT public details | read | public (via RPC) | Public menu + business card | — |
| Business card lead | write | public | Lead form submission | No auth = spam risk |
| Lead confirmation email | write | public (edge function) | Lead form | Edge function security |
| Public reviews | read | public | Review panels | Unauthenticated read |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| `sendLeadConfirmationEmail.edge.dal.js` | Edge function DAL inside feature | MEDIUM — security boundary | VENOM |
| `useDesktopBreakpoint.js` in public/vportMenu | Utility hook — should be shared | LOW | IRONMAN |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Cache strategy for public menu | HIGH | High-traffic unauthenticated surface — needs CDN/TTL strategy | KRAVEN |
| Lead form spam protection | HIGH | No auth on lead write = spam risk | VENOM |
| Logan documentation | HIGH | No canonical public surface docs | LOGAN |
| Edge function security audit | HIGH | sendLeadConfirmationEmail runs without auth | VENOM |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- VENOM (security: lead form, edge function, unauthenticated RLS)
- KRAVEN (performance: public menu caching)
- LOGAN (documentation)
