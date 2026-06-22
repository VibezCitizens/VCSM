---
name: vcsm.public.architecture
description: ARCHITECT V2 module architecture report for VCSM:public
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** public
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/public
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The `public` feature delivers unauthenticated-safe public-facing surfaces for VCSM Vports: the public business card (slug-keyed, lead capture form, confirmation email, owner notification), the public menu experience (QR-scanned and slug-keyed), and the public reviews panel. It is the canonical read path for external visitors, TRAZE deep links, and QR code endpoints — no auth session is required. All write operations (lead submission) are SECURITY DEFINER RPCs, ensuring no RLS bypass is possible from an anonymous caller.

## OWNERSHIP

Public-facing Vport surfaces team. Primary responsibility: read-only Vport discovery, lead ingestion, and QR code delivery. No identity or session dependencies; all data access uses anonymous-safe RPCs and schema views. Cross-feature boundaries are respected — cross-feature access routes through the `profiles.adapter` and the `vportMenu.adapter`.

## ENTRY POINTS

- `/profile/:actorId/menu` — VportPublicMenuScreen (actorId-based, redirects to canonical slug)
- `/profile/:slug/menu` — VportPublicMenuBySlugScreen (canonical slug entry)
- `/profile/:slug/menu/qr` — VportPublicMenuQrBySlugScreen (QR scan entry)
- `/profile/:actorId/menu/qr` — VportPublicMenuQrScreen (legacy actorId QR)
- `/profile/:slug/reviews` — VportPublicReviewsBySlugScreen
- `/profile/:slug/reviews/qr` — VportPublicReviewsQrBySlugScreen
- `/public/:slug` — VportBusinessCardPublic.screen.jsx (business card by slug)
- `/menu-redirect` — VportMenuRedirect.jsx (root-level redirect helper)
- `/profile/:actorId/redirect` — VportPublicMenuRedirectScreen (slug redirect)

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 15 | vportBusinessCard.read.dal.js, vportBusinessCardLead.write.dal.js, readVportPublicDetails.rpc.dal.js, readVportPublicMenu.rpc.dal.js, resolveVportSlug.dal.js |
| Model | 43 | vportBusinessCard.model.js, vportPublicDetails.model.js, vportPublicMenu.model.js, vportPublicReviews.model.js |
| Controller | 12 | vportBusinessCard.controller.js, getVportPublicDetails.controller.js, getVportPublicMenu.controller.js, getVportPublicReviews.controller.js, resolveVportSlug.controller.js |
| Service | N/A | — |
| Adapter | 1 | vportMenu.adapter.js |
| Hook | 8 | useVportBusinessCardExperience.js, useVportBusinessCardLeadForm.js, useVportPublicMenu.js, useVportPublicDetails.js, useVportPublicReviews.js |
| Component | 13 | VportPublicMenuPanel.jsx, VportPublicReviewCard.jsx, VportPublicReviewsPanel.jsx, BusinessCardLeadForm.jsx, BusinessCardMainCard.jsx |
| Screen | 10 | VportPublicMenuScreen.jsx, VportPublicMenuBySlugScreen.jsx, VportPublicMenuQrScreen.jsx, VportPublicMenuQrBySlugScreen.jsx, VportBusinessCardPublic.screen.jsx |
| Barrel | 19 | vportBusinessCard/index.js, vportMenu.adapter.js (top-level), internal view/index barrels |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source and BEHAVIOR.md both confirm public-facing surface | BEHAVIOR.md is PLACEHOLDER only |
| Owner defined | PARTIAL | ARCHITECT inferred from source; no explicit ownership record | No OWNERSHIP doc |
| Entry points mapped | PASS | 9 screens identified across vportMenu and vportBusinessCard | No route-map entries in scanner (routes: []) |
| Controllers present/delegated | PASS | 12 controllers (callgraph) covering both sub-features | — |
| DAL/repository present/delegated | PASS | 15 DAL files; SECURITY DEFINER RPCs for all writes | — |
| Models/transformers present | PASS | 43 model references via callgraph | — |
| Hooks/view models present | PASS | 8 hooks covering both sub-features | — |
| Screens/components present | PASS | 10 screens + 13 components | — |
| Services/adapters present | PASS | vportMenu.adapter.js exposes correct public surface | vportBusinessCard has no adapter (OK — it has no cross-feature consumers identified) |
| Database objects mapped | PASS | vport.public_menu_read_model_v, vport.public_actor_seo_v, RPCs: read_business_card_public, submit_business_card_lead, get_business_card_sections | — |
| Authorization path mapped | PASS | All writes via SECURITY DEFINER RPC; all reads via anonymous-safe views | No session required — by design |
| Cache/runtime behavior mapped | PARTIAL | useState/useEffect pattern; no SWR or persistent cache | No memoization layer — repeated navigation will refetch |
| Error/loading/empty states mapped | PASS | useVportBusinessCardExperience exposes loading/error/unavailable flags; hooks all follow pattern | — |
| Documentation linked | PARTIAL | BEHAVIOR.md present but PLACEHOLDER status | Need real behavior contract |
| Tests/validation noted | FAIL | 0 tests | No test coverage for lead submission, slug resolution, or model transforms |
| Native parity noted | N/A | Public web surfaces; no native app parity concern | — |
| Engine dependencies mapped | PASS | lead, menu, notification, profile, qr, review | All confirmed in scanner data |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/lead | engine | inward | YES | Lead submission and confirmation flow |
| engines/menu | engine | inward | YES | Public menu read model |
| engines/notification | engine | inward | YES | Lead received notification to Vport owner |
| engines/profile | engine | inward | YES | Vport profile lookup, SEO view |
| engines/qr | engine | inward | YES | QR code URL resolution |
| engines/review | engine | inward | YES | Public review dimensions and summaries |
| features/notifications | cross-feature | inward | YES via adapter | publishVcsmNotification imported from notifications adapter |
| features/profiles | cross-feature | inward | YES via adapter | useActorCanonicalSlug imported from profiles.adapter |
| services/supabase | service | inward | YES | vportClient + supabaseClient used in DAL layer |
| vport.public_menu_read_model_v | DB view | read | YES | Primary public menu data source |
| vport.public_actor_seo_v | DB view | read | YES | Fallback profile data when no menu items |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| submit_business_card_lead (RPC) | WRITE (insert) | vport schema / SECURITY DEFINER | public feature | MEDIUM — anonymous write; RPC must enforce slug validity server-side |
| get_business_card_sections (RPC) | READ | vport schema | public feature | LOW — read-only, slug-keyed |
| read_business_card_public (RPC) | READ | vport schema | public feature | LOW — public read |
| sendLeadConfirmationEmailDAL | WRITE (edge function) | platform edge | public feature | MEDIUM — email delivery; no retry logic visible |
| vport.public_menu_read_model_v | READ | vport schema | public/vportMenu DAL | LOW — view, no writes |
| vport.public_actor_seo_v | READ | vport schema | public/vportMenu DAL | LOW — view, no writes |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | READY | 9 screens identified; slug and actorId resolution paths both present | Scanner routes[] is empty — route registration must be verified at app router level |
| Loading state | READY | All hooks expose `loading` flag; screens defer render | — |
| Empty state | READY | `unavailable` computed from !loading && !card; empty states in review components | — |
| Error state | READY | All hooks expose `error`; controller wraps errors with user-facing messages | Lead controller maps DB error codes to human messages |
| Auth/owner gates | N/A | Feature is entirely public/unauthenticated | No auth gates — by design |
| Cache behavior | WATCH | Pure useState/useEffect; no SWR or query cache | Repeated navigation causes re-fetch; acceptable for public pages |
| Runtime dependencies | READY | vportClient and supabaseClient both required at runtime; edge function for email | Edge function availability is external dependency |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/public/BEHAVIOR.md | PRESENT (PLACEHOLDER) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is PLACEHOLDER | HIGH | No behavioral contract means no regression baseline; any change to business card or menu flow is unvalidated | LOGAN |
| Zero test coverage | HIGH | Lead submission (anonymous write + email + notification) has no regression protection | SPIDER-MAN |
| No route-map entries in scanner | MEDIUM | Scanner routes[] is empty despite 9 identified screens — route registration may not be wired or scanner pattern missed routes | HAWKEYE |
| No security audit on lead submission path | MEDIUM | Anonymous write via SECURITY DEFINER RPC, edge function call, and notification fire — VENOM has not audited this module | VENOM |
| vportBusinessCard has no adapter | LOW | If another feature needs to consume business card hooks/views, there is no adapter boundary — direct import risk | IRONMAN |
| No OWNERSHIP record | LOW | No explicit team ownership — makes escalation ambiguous | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

- `VportPublicMenuScreen` imports `useActorCanonicalSlug` from `features/profiles/adapters/profiles.adapter` — this is a valid cross-feature adapter import.
- `vportBusinessCard.controller.js` imports `publishVcsmNotification` from `features/notifications/adapters/notifications.adapter` — this is a valid cross-feature adapter import.
- No direct cross-feature DAL or internal imports detected in the files read.

---

## SPAGHETTI SCORE

**Module:** public
**Score:** CLEAN
**Reasons:** Two well-organized sub-features (vportBusinessCard, vportMenu) each with their own DAL/model/controller/hook/screen/view stack. Cross-feature access routes through adapters. SECURITY DEFINER RPCs for anonymous writes. Adapter boundary present for vportMenu. No circular imports detected.
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no behavioral contract content exists

**Check A (Source without behavior):** FAIL — source is fully implemented, BEHAVIOR.md is a stub with no content
**Check B (Behavior without source):** N/A — BEHAVIOR.md has no documented happy paths to compare against source
**Check C (§13 engine consistency):** PARTIAL — scanner declares engines [lead, menu, notification, profile, qr, review]; source confirms menu (views), notification (lead received), profile (slug/SEO read), review (review panel); lead and qr engine imports not directly verified in files read but confirmed by write surface patterns
**Check D (§6 data change consistency):** PASS — scanner write surfaces (submit_business_card_lead, read_business_card_public, get_business_card_sections, sendLeadConfirmationEmail edge) all confirmed in source DAL files read

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write real BEHAVIOR.md | PLACEHOLDER contract leaves feature ungoverned; blocking THOR eligibility | LOGAN |
| P1 | Add tests for lead submission controller | Anonymous write + email + notification chain has zero regression protection | SPIDER-MAN |
| P2 | VENOM security audit on public write surfaces | submit_business_card_lead and sendLeadConfirmationEmail are anonymous-accessible; need trust boundary review | VENOM |
| P3 | Wire routes to scanner / verify route registration | Scanner routes[] empty despite 9 screens; confirm app router is registering all public routes correctly | HAWKEYE |

## RECOMMENDED HANDOFFS

- **LOGAN** — rebuild BEHAVIOR.md from source evidence gathered in this scan
- **SPIDER-MAN** — add tests for vportBusinessCard.controller.js lead submission and model validation
- **VENOM** — audit anonymous write surfaces (submit_business_card_lead RPC, edge function, notification dispatch)
- **HAWKEYE** — verify public route registration in app router; scanner routes[] is empty

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
