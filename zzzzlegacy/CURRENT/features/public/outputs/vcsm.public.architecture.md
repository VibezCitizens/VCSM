---
# Module Architecture Report — vcsm.public
# ARCHITECT §26.11 — Dated Immutable Report
# Generated: 2026-06-02
# Ticket: ARCHITECT-PUBLIC-0001
# Status: FIRST FORMAL ARCHITECT AUDIT — replaces inferred entries in prior ARCHITECTURE.md
# Scope: apps/VCSM/src/features/public/
---

## Feature Overview

The public feature is the unauthenticated VPORT discovery and lead-capture surface for the VCSM platform. It is split into two full-MVC sub-modules: **vportMenu** (public menu, pricing, reviews, and QR-scan paths via slug-based routes serving any visitor) and **vportBusinessCard** (public VPORT profile, contact details, services, branding, and lead-capture form with notification dispatch). All routes are PUBLIC_ZERO_AUTH — no session is required to read or submit a lead. No engine dependencies. One cross-feature dependency: `features/notifications/adapters/notifications.adapter` consumed by the business card controller for lead owner notification dispatch.

**Source Path:** apps/VCSM/src/features/public/
**Engine Path:** None — feature-only (no engines/ imports detected)
**Security Tier:** HIGH
**THOR Status:** BLOCKED

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers | YES | apps/VCSM/src/features/public/vportMenu/controller/, apps/VCSM/src/features/public/vportBusinessCard/controller/ |
| DALs | YES | apps/VCSM/src/features/public/vportMenu/dal/, apps/VCSM/src/features/public/vportBusinessCard/dal/ |
| Models | YES | apps/VCSM/src/features/public/vportMenu/model/, apps/VCSM/src/features/public/vportBusinessCard/model/ |
| Hooks | YES | apps/VCSM/src/features/public/vportMenu/hooks/, apps/VCSM/src/features/public/vportBusinessCard/hooks/ |
| Screens | YES | apps/VCSM/src/features/public/vportMenu/screen/, apps/VCSM/src/features/public/vportBusinessCard/screen/, apps/VCSM/src/features/public/screens/ |
| Components | YES | apps/VCSM/src/features/public/vportMenu/components/ |
| Adapters | YES | apps/VCSM/src/features/public/vportMenu/adapters/vportMenu.adapter.js |
| Engine controllers | NO | None |
| Engine DALs | NO | None |

---

## Active Controllers

### vportMenu (5 controllers)

| Controller | Purpose | Auth Gate |
|---|---|---|
| getVportPublicDetails.controller.js | Resolves VPORT public profile/details by actorId; primary read from vport.public_menu_read_model_v; fallback to vport.public_actor_seo_v when no menu items exist | actorId presence check only — zero auth |
| getVportPublicMenu.controller.js | Fetches public menu categories and items by actorId from vport.public_menu_read_model_v | actorId presence check only — zero auth |
| getVportPublicReviews.controller.js | Loads initial review summary + first reviews page + dimensions in parallel (Promise.all); exports getVportPublicReviewsPageController for cursor-based pagination | targetActorId presence check only — zero auth |
| resolveMenuSlug.controller.js | Thin pass-through: slug → actorId via resolveMenuSlugDAL (queries vport.public_menu_read_model_v; only resolves VPORTs with active menu items) | No gate — completely open |
| resolveVportSlug.controller.js | Thin pass-through: slug → actorId via resolveVportSlugDAL (queries vport.public_actor_seo_v; resolves any VPORT with a profile) | No gate — completely open |

### vportBusinessCard (1 file, 3 exported controllers)

| Controller Export | Purpose | Auth Gate |
|---|---|---|
| getVportBusinessCardPublicController | Read: VPORT business card by slug via SECURITY DEFINER RPC read_business_card_public | Slug normalization only — zero auth |
| submitVportBusinessCardLeadController | Write: lead submission via submit_business_card_lead RPC; fires lead confirmation email (edge function, fire-and-forget) + owner notification | Input validation only — zero auth; RPC has GRANT EXECUTE TO PUBLIC (VL-001 OPEN) |
| getVportBusinessCardSectionsController | Read: business card sections by slug; derives profile_id server-side from slug (PUBLIC-002 GUID protection pattern) | Slug normalization only — zero auth |

---

## Active DALs

### vportMenu (7 files)

| DAL | Tables / Views | Cache | Notes |
|---|---|---|---|
| readVportPublicDetails.rpc.dal.js | vport.public_menu_read_model_v (primary), vport.public_actor_seo_v (fallback) | NONE | Double-read risk: fires on every page mount with readVportPublicMenu |
| readVportPublicMenu.rpc.dal.js | vport.public_menu_read_model_v | NONE | Fires alongside details DAL on every page mount — 2 hits per visit |
| readPublicVportReviews.dal.js | reviews.public_vport_reviews_v | NONE | Cursor-based pagination, limit+1 pattern, PAGE_SIZE=20 |
| readPublicVportReviewSummary.dal.js | reviews.public_vport_review_summary_v | TTL 60s | Cache keyed on targetActorId |
| readPublicVportReviewDimensions.dal.js | reviews.public_vport_review_dimensions_v | TTL 60s | Cache keyed on targetActorId |
| resolveMenuSlug.dal.js | vport.public_menu_read_model_v | TTL 10min | Only resolves VPORTs with active menu items |
| resolveVportSlug.dal.js | vport.public_actor_seo_v | TTL 10min | Resolves any VPORT with a profile |

### vportBusinessCard (4 files)

| DAL | Tables / Views | Cache | Notes |
|---|---|---|---|
| vportBusinessCard.read.dal.js | vport RPC: read_business_card_public | NONE | SECURITY DEFINER RPC via vportClient |
| vportBusinessCardLead.write.dal.js | vport RPC: submit_business_card_lead | N/A | Anonymous-safe SECURITY DEFINER RPC; GRANT EXECUTE TO PUBLIC (VL-001 OPEN) |
| businessCardSections.read.dal.js | vport RPC: get_business_card_sections | NONE | Accepts profileId (internal UUID) — controlled server-side from slug lookup (PUBLIC-002) |
| sendLeadConfirmationEmail.edge.dal.js | Supabase Edge Function: send-lead-confirmation | N/A | Fire-and-forget; anon key accepted as auth (ELEK-2026-05-27-004 OPEN) |

---

## Active Hooks

### vportMenu (6 files)

| Hook | Calls | Purpose |
|---|---|---|
| useVportPublicDetails.js | getVportPublicDetailsController | Loads and refreshes VPORT public profile details by actorId |
| useVportPublicMenu.js | getVportPublicMenuController | Loads public menu categories/items by actorId |
| useVportPublicReviews.js | getVportPublicReviewsController, getVportPublicReviewsPageController | Loads review summary + paginated cards + dimensions; exposes loadMore for cursor pagination |
| useResolveMenuSlug.js | resolveMenuSlugController | Resolves menu slug → actorId; sets notFound flag on failure |
| useResolveVportSlug.js | resolveVportSlugController | Resolves vport slug → actorId; sets notFound flag on failure |
| useDesktopBreakpoint.js | — | Thin re-export of shared/hooks/useDesktopBreakpoint; not feature logic |

### vportBusinessCard (3 files)

| Hook | Calls | Purpose |
|---|---|---|
| useVportBusinessCardExperience.js | getVportBusinessCardPublicController | Loads business card data by slug; exposes loading/unavailable state |
| useVportBusinessCardLeadForm.js | submitVportBusinessCardLeadController | Full form state management + lead submission; exposes submit/reset/fieldErrors/formError |
| useVportBusinessCardSections.js | getVportBusinessCardSectionsController (inferred via index) | Loads business card sections by slug |

---

## Engine Dependencies

None — no imports from engines/ found in any file under apps/VCSM/src/features/public/.

---

## Cross-Feature Dependencies

| Feature | What is Imported | Direction | Boundary Compliant |
|---|---|---|---|
| features/notifications | publishVcsmNotification via notifications/adapters/notifications.adapter | Outbound (public → notifications) | YES — imported via adapter surface |

---

## Authorization Pattern

All routes in this feature are PUBLIC_ZERO_AUTH — no session, token, or actor identity is required to read or write. Authorization analysis by layer:

- **Controllers:** Input presence check only (actorId/slug not null). No actor ownership assertions. No assertActorOwnsVportActorController calls. No useIdentity() usage.
- **DALs:** All reads target public views. Write surfaces use SECURITY DEFINER RPCs — DB-level enforcement is the only gate for writes.
- **Write path (leads):** submit_business_card_lead RPC carries GRANT EXECUTE TO PUBLIC with actor_id hardcoded to NULL. VL-001 through VL-005 CARNAGE migration plan authored but NOT EXECUTED — this is the current THOR blocker.
- **Email path:** send-lead-confirmation edge function accepts anon key as sufficient auth — can deliver SES to arbitrary addresses (ELEK-2026-05-27-004).
- **ELEK-007/008 status:** Menu delete controller ownership gates confirmed RESOLVED per 2026-06-02 source inspection — these are patched.

---

## Module Independence Classification

**MOSTLY INDEPENDENT**

No engine imports. One outbound cross-feature dependency (notifications adapter) follows the adapter boundary contract. Both sub-modules are internally self-contained. Primary coupling risk is the unresolved duplicate in features/profiles (VportActorMenuPublicView at /actor/:actorId/menu) — parallel implementation not owned by this feature.

---

## Architecture State

**FLAGGED**

Structurally sound layering and adapter boundary, but 11 open structural risks including: unexecuted critical security migration (VL-001–005), 4 relative import violations, auth coupling in component layer, style objects in model layer, line limit breach, duplicate route conflict in profiles feature, no TTL cache on highest-traffic DALs, double-hook performance issue, dead write-review CTA, and 5 untracked DB views.

---

## Known Structural Risks

1. **Duplicate route conflict** — /actor/:actorId/menu owned by features/profiles (VportActorMenuPublicView); raw UUID in back navigation (VF-001); divergent hook data shape; console.log violations. No consolidation ticket.

2. **No TTL cache on high-traffic read DALs** — readVportPublicDetailsRpcDAL and readVportPublicMenuRpcDAL both hit vport.public_menu_read_model_v on every page mount. resolveMenuSlugDAL adds 3rd hit. QR-primary surface — all 3 fire per visitor's first paint.

3. **Double hook on useVportPublicReviews** — Reviews tab active triggers 2 hook instances: 3 redundant DB reads (summary + page + dimensions) per tab open.

4. **Relative import violations** — 4 files use relative ../ instead of @/ aliases (resolveMenuSlug.controller.js, resolveVportSlug.controller.js, useResolveMenuSlug.js, useResolveVportSlug.js).

5. **Auth coupling in component layer** — useAuth() inside VportPublicReviewsPanel; should be a prop from view layer.

6. **Style objects in model layer** — PANEL_STYLE and THUMB_WRAP_STYLE in vportPublicMenuPanel.model.js.

7. **VportPublicMenuView.jsx at 301 lines** — 1 line over 300-line architectural limit.

8. **Dead write-review CTA** — VportPublicReviewsPanel CTA redirects to /login; no review submission screen post-auth.

9. **Five DB views untracked by CARNAGE** — public_menu_read_model_v, public_actor_seo_v, public_vport_reviews_v, public_vport_review_summary_v, public_vport_review_dimensions_v.

10. **Critical security migration unexecuted** — VL-001 through VL-005 (submit_business_card_lead): GRANT EXECUTE TO PUBLIC, actor_id = NULL hardcoded, permissive INSERT, full-row UPDATE grant, missing source CHECK constraint. PLAN AUTHORED, NOT EXECUTED.

11. **Wildcard CORS open** — ELEK-2026-05-27-001: all 5 edge functions carry wildcard CORS. No patch applied.

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | DR_STRANGE.md, ARCHITECTURE.md, CURRENT_STATUS.md | — |
| Owner defined | PARTIAL | OWNERSHIP.md exists but NOT_AUDITED — IRONMAN never run | Split ownership conflict with profiles feature on /actor/:actorId/menu |
| Entry points mapped | PASS | All screens, routes, and adapters enumerated | — |
| Controllers present | PASS | 6 controller files confirmed in source scan and read | — |
| DAL/repository present | PASS | 11 DAL files confirmed; 5 DB views confirmed from source reads | Migration history untracked — CARNAGE needed |
| Models/transformers | PASS | 6 model files confirmed in both sub-modules | Style objects in vportPublicMenuPanel.model.js — layer violation |
| Hooks/view models | PASS | 9 hook files confirmed; 8 substantive (1 is pass-through re-export) | Double-hook pattern on useVportPublicReviews — performance risk |
| Screens/components | PASS | 9 screens + 6 components + 4 views confirmed | VportPublicMenuView.jsx at 301 lines (1 over limit) |
| Authorization path mapped | PARTIAL | Auth pattern documented: PUBLIC_ZERO_AUTH; SECURITY DEFINER RPCs for writes | VL-001–005 migration unexecuted; ELEK-2026-05-27-004 open |
| Engine dependencies mapped | PASS | No engine imports found — confirmed feature-only | N/A |
| Tests/validation noted | FAIL | 0 test files; SPIDER-MAN never run; TESTS.md missing | No regression tests for fromPublicRow() UUID exclusion or DAL ownership predicates |

---

## Recommended Handoffs

| Command | Priority | Scope |
|---|---|---|
| CARNAGE | P0 | Execute VL-001–005 migration (submit_business_card_lead hardening); version 5 untracked DB views. Gating action for THOR. |
| ELEKTRA | P0 (post-CARNAGE) | Edge functions (send-lead-confirmation, submit_business_card_lead post-migration), wildcard CORS (ELEK-2026-05-27-001), lead submission path end-to-end. |
| SPIDER-MAN | P1 | First test coverage run: fromPublicRow() UUID exclusion, DAL ownership predicates, lead submit validation boundary. |
| KRAVEN | P1 | Double-read on vport.public_menu_read_model_v (3 hits/visit); double-hook on useVportPublicReviews (3 redundant DB reads/tab). |
| VENOM | P1 | Second full pass post-ELEK-007/008 patch; scope wildcard CORS and edge function auth hardening. |
| IRONMAN | P2 | Formal ownership audit; resolve split ownership conflict with profiles feature on /actor/:actorId/menu. |

---

## Final Module Status

**MOSTLY COMPLETE**

All layers present, adapter boundary defined, cross-feature imports follow contract, production traffic actively served. Architecture FLAGGED due to: unexecuted critical security migration (VL-001–005), 4 relative import violations, auth coupling in component layer, style objects in model layer, line limit breach, duplicate route conflict in profiles, no TTL cache on highest-traffic DALs, double-hook performance issue, dead CTA, 5 untracked DB views, and zero test coverage. THOR BLOCKED.

---

## ARCHITECT Run Record

| Attribute | Value |
|---|---|
| Date | 2026-06-02 |
| Ticket | ARCHITECT-PUBLIC-0001 |
| Architecture State | FLAGGED |
| Source files scanned | 64 |
| Controllers confirmed | 6 (5 vportMenu + 1 multi-export vportBusinessCard) |
| DALs confirmed | 11 |
| Hooks confirmed | 9 |
| Models confirmed | 6 |
| Screens confirmed | 9 |
| Components confirmed | 6 |
| Engine dependencies | 0 |
| Cross-feature dependencies | 1 (notifications adapter — compliant) |
| Structural risks identified | 11 |
| Prior ARCHITECT run | NOT RUN — this is the first formal ARCHITECT audit |
| CURRENT files written | ARCHITECTURE.md, FEATURE_INDEX_RUNTIME/public.md, outputs/2026/06/02/ARCHITECT/modules/vcsm.public.architecture.md |
