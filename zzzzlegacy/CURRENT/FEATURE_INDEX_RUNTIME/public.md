# Runtime Feature Index: public

## Metadata

| Field | Value |
|---|---|
| Feature | public |
| CURRENT Folder | CURRENT/features/public |
| Source Folder | apps/VCSM/src/features/public |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |
| ARCHITECT Run | ARCHITECT-PUBLIC-0001 (2026-06-02) |

## Source Inventory

| Layer | Count | Key Files |
|---|---:|---|
| Controllers | 6 | getVportPublicDetails.controller.js, getVportPublicMenu.controller.js, getVportPublicReviews.controller.js, resolveMenuSlug.controller.js, resolveVportSlug.controller.js, vportBusinessCard.controller.js |
| DALs | 11 | readVportPublicDetails.rpc.dal.js, readVportPublicMenu.rpc.dal.js, readPublicVportReviews.dal.js, readPublicVportReviewSummary.dal.js, readPublicVportReviewDimensions.dal.js, resolveMenuSlug.dal.js, resolveVportSlug.dal.js, vportBusinessCard.read.dal.js, vportBusinessCardLead.write.dal.js, businessCardSections.read.dal.js, sendLeadConfirmationEmail.edge.dal.js |
| Hooks | 9 | useVportPublicDetails.js, useVportPublicMenu.js, useVportPublicReviews.js, useResolveMenuSlug.js, useResolveVportSlug.js, useDesktopBreakpoint.js (re-export), useVportBusinessCardExperience.js, useVportBusinessCardLeadForm.js, useVportBusinessCardSections.js |
| Models | 6 | vportPublicDetails.model.js, vportPublicMenu.model.js, vportPublicMenuPanel.model.js, vportPublicReviews.model.js, vportBusinessCard.model.js, businessCardSettings.model.js |
| Screens | 9 | VportPublicMenuBySlugScreen.jsx, VportPublicMenuQrBySlugScreen.jsx, VportPublicMenuScreen.jsx, VportPublicMenuQrScreen.jsx, VportPublicMenuRedirectScreen.jsx, VportPublicReviewsBySlugScreen.jsx, VportPublicReviewsQrBySlugScreen.jsx, VportBusinessCardPublic.screen.jsx, VportMenuRedirect.jsx |
| Components | 6 | VportPublicMenuPanel.jsx, VportPublicReviewsPanel.jsx, VportPublicReviewCard.jsx, VportPublicReviewSummary.jsx, VportPublicReviewDimensions.jsx, VportPublicReviewEmptyState.jsx |
| Routes | 9 | /m/:slug, /m/:slug/qr, /profile/:slug/menu, /profile/:slug/menu/qr, /profile/:slug/reviews, /profile/:slug/reviews/qr, /m/redirect/:vportId, /card/:slug, /actor/:actorId/menu (profiles feature — duplicate) |
| Tests | 0 | NONE FOUND |

## Route / Screen Map

| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| /m/:slug | vportMenu/screen/VportPublicMenuBySlugScreen.jsx | PUBLIC_ZERO_AUTH | Short-URL public VPORT menu by slug |
| /m/:slug/qr | vportMenu/screen/VportPublicMenuQrBySlugScreen.jsx | PUBLIC_ZERO_AUTH | QR-scanned public menu |
| /profile/:slug/menu | vportMenu/screen/VportPublicMenuBySlugScreen.jsx | PUBLIC_ZERO_AUTH | Canonical slug-based public menu (PUBLIC-005 canonical) |
| /profile/:slug/menu/qr | vportMenu/screen/VportPublicMenuQrBySlugScreen.jsx | PUBLIC_ZERO_AUTH | QR-scanned menu (canonical slug path) |
| /profile/:slug/reviews | vportMenu/screen/VportPublicReviewsBySlugScreen.jsx | PUBLIC_ZERO_AUTH | Public VPORT reviews by slug |
| /profile/:slug/reviews/qr | vportMenu/screen/VportPublicReviewsQrBySlugScreen.jsx | PUBLIC_ZERO_AUTH | QR-scanned reviews |
| /m/redirect/:vportId | screens/VportMenuRedirect.jsx | PUBLIC_ZERO_AUTH | Legacy actorId redirect → resolves slug → navigates to /profile/:slug/menu |
| /card/:slug | vportBusinessCard/screen/VportBusinessCardPublic.screen.jsx | PUBLIC_ZERO_AUTH | Business card public landing page — lead capture form |
| /actor/:actorId/menu | profiles feature (VportActorMenuPublicView) | PUBLIC_ZERO_AUTH | DUPLICATE — NOT in features/public/; owned by profiles feature; raw UUID in URL (VF-001); divergent hook shape |

## Mutation Surface Map

| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| submitVportBusinessCardLeadController | vportBusinessCard/controller/vportBusinessCard.controller.js | RPC INSERT (lead) via submit_business_card_lead | NO — GRANT EXECUTE TO PUBLIC; actor_id = NULL hardcoded; VL-001–005 PLAN AUTHORED, NOT EXECUTED | CRITICAL |
| sendLeadConfirmationEmailDAL | vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal.js | Edge Function (SES email delivery) | NO — anon key accepted as auth; ELEK-2026-05-27-004 OPEN | HIGH |
| publishVcsmNotification (cross-feature) | features/notifications/adapters/notifications.adapter | Notification dispatch (fire-and-forget) | PARTIAL — recipientActorId derived from RPC result | MEDIUM |

## Security-Sensitive Surface Map

| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| submit_business_card_lead RPC | vportBusinessCard/dal/vportBusinessCardLead.write.dal.js | DB_RLS — PUBLIC EXECUTE grant | VL-001–005: GRANT EXECUTE TO PUBLIC, actor_id = NULL, permissive INSERT, full-row UPDATE grant, missing source CHECK constraint |
| send-lead-confirmation edge function | vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal.js | EDGE_FUNCTION — anon SES delivery | ELEK-2026-05-27-004: anon key accepted; can deliver SES to arbitrary addresses |
| All edge functions (5 total) | supabase/functions/ | EDGE_FUNCTION — CORS wildcard | ELEK-2026-05-27-001: wildcard CORS on all 5 edge functions including public lead submit path |
| /actor/:actorId/menu fallback | screens/VportMenuRedirect.jsx | PUBLIC_ZERO_AUTH — raw UUID in URL | PUBLIC-005 / VF-001: raw actorId exposed in fallback navigation; legacy route not retired |
| Double-read on vport.public_menu_read_model_v | vportMenu/dal/ (readVportPublicDetails + readVportPublicMenu) | PERFORMANCE — no TTL cache | Both DALs hit same view on every page mount; no cache; QR-primary surface |
| useVportPublicReviews double-hook | vportMenu/hooks/useVportPublicReviews.js | PERFORMANCE — redundant reads | Called twice when Reviews tab active: +3 DB reads (summary + page + dimensions) |
| useAuth() in component layer | vportMenu/components/VportPublicReviewsPanel.jsx | LAYER VIOLATION — auth coupling | Auth hook imported inside component; should be prop from view layer |
| Style objects in model layer | vportMenu/model/vportPublicMenuPanel.model.js | LAYER VIOLATION | PANEL_STYLE and THUMB_WRAP_STYLE defined in model; model must not contain styles |
| Relative imports (4 files) | vportMenu/controller/ and hooks/ | IMPORT BOUNDARY VIOLATION | 4 files use relative ../ instead of @/ aliases; architecture contract breach |

## DB Views Consumed

| View | Schema | Purpose | Migration Tracked |
|---|---|---|---|
| public_menu_read_model_v | vport | Primary menu + profile read model | NOT TRACKED — CARNAGE flagged as MISSING |
| public_actor_seo_v | vport | Slug resolution + profile fallback | NOT TRACKED |
| public_vport_reviews_v | reviews | Paginated public reviews | NOT TRACKED |
| public_vport_review_summary_v | reviews | Review count + average rating | NOT TRACKED |
| public_vport_review_dimensions_v | reviews | Per-dimension ratings | NOT TRACKED |

## Adapter Surface

| Adapter | Path | Exports |
|---|---|---|
| vportMenu.adapter.js | vportMenu/adapters/vportMenu.adapter.js | Views (4), Hooks (3), Slug hooks (2) — DALs, models, and controllers NOT exported |
| vportBusinessCard index.js | vportBusinessCard/index.js | VportBusinessCardPublicScreen only |

## Architecture Classification

| Attribute | Value |
|---|---|
| Engine Dependencies | 0 (None) |
| Cross-Feature Dependencies | 1 (notifications adapter — boundary-compliant) |
| Architecture State | FLAGGED |
| Module Status | MOSTLY COMPLETE |
| THOR Status | BLOCKED |
| Security Tier | HIGH |
| Test Coverage | 0 files |
| Active Security Findings | 11+ open (4 HIGH, multiple MEDIUM) |

## Recommended Next Command

CARNAGE — Execute VL-001 through VL-005 business_card_leads migration; then ELEKTRA scoped to edge functions and RPC write paths. These are prerequisites before THOR gate can be attempted.

## Recommended Next Ticket

TICKET-PUBLIC-SECURITY-001 — P0 sprint: (1) execute business_card_leads CARNAGE migration VL-001–005, (2) verify DELETE RLS on vport.menu_categories and vport.menu_items (PUBLIC-007), (3) run ELEKTRA scoped to edge functions and RPC write paths.
