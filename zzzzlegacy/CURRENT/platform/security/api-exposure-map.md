# ARCHITECT — API Exposure Map
Generated: 2026-05-09

---

## VCSM — API Surfaces

VCSM is a Vite SPA. There are no traditional server-side API routes.
All data access goes through Supabase client directly from the browser.

### Supabase RPC Endpoints (client-callable)

| RPC Name | DAL File | Auth Required | Controller |
|---|---|---|---|
| provision | identity/dal/provision.rpc.dal.js | YES (session) | ensureVcsmPlatformBootstrap |
| readVportPublicDetails | public/vportMenu/dal/readVportPublicDetails.rpc.dal.js | NO (public) | getVportPublicDetails |
| readVportPublicMenu | public/vportMenu/dal/readVportPublicMenu.rpc.dal.js | NO (public) | getVportPublicMenu |
| sendMessageAtomic | engines/chat/dal/sendMessageAtomic.rpc.dal.js | YES (session) | sendMessage (chat engine) |
| portfolioItems (rpc) | engines/portfolio/dal/portfolioItems.rpc.dal.js | YES (actor) | listPortfolio |
| reviews.rpc | engines/reviews/dal/reviews.rpc.dal.js | YES (actor) | (reviews engine) |
| mailbox.rpc | wanders/core/dal/rpc/mailbox.rpc.dal.js | Partial (guest or authed) | mailbox.controller.js |
| vportDataset.rpc (inferred) | vport.core.dal.js | YES | vportCoreOps |

### Supabase Realtime (subscriptions)

| Channel | Feature | Auth |
|---|---|---|
| Chat messages | engines/chat | Session-scoped |
| Typing presence | engines/chat | Session-scoped |
| Notifications | engines/notifications (inferred) | Session-scoped |

### Edge Function Calls

| Edge Function | DAL File | Purpose |
|---|---|---|
| sendLeadConfirmationEmail | public/vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal.js | Email confirmation on lead submit |

### Client-Side Direct Writes (No Server API)

| Operation | DAL File | Tables | Auth Check |
|---|---|---|---|
| Insert post | upload/dal/insertPost.dal.js | vc.posts | Session required |
| Insert booking | booking/dal/insertBooking.dal.js | vport.bookings | Session + ownership check |
| Insert follow | social/friend/subscribe/dal/actorFollows.dal.js | vc.actor_follows | Session required |
| Submit review | engines/reviews/dal/reviews.write.dal.js | vc.vport_reviews | Session required |
| Write moderation action | moderation/dal/moderationActions.dal.js | vc.moderation_actions | assertModerationAccess required |
| Insert claim (Traffic) | conversion/dal (Traffic) | business_claim_requests | ANON — no auth |

---

## TRAFFIC — API Surfaces

Traffic is a Next.js 14 static export with minimal runtime API routes.

### Public Supabase Reads (anon client)

| Endpoint Type | View/Table | DAL File |
|---|---|---|
| SELECT (anon) | public_traze_provider_index_v | vportDataset.read.dal.js |
| SELECT (anon) | public_traze_provider_index_v | vportHomepage.read.dal.js |
| SELECT (anon) | public_traze_provider_index_v | trazeCategories.read.dal.js |
| SELECT (anon) | public_traze_portfolio_v | providerProfile.read.dal.js |
| SELECT (anon) | price aggregate | priceAggregate.read.dal.js |
| SELECT (anon) | public content | publicContent.read.dal.js |

### Runtime API Routes (Next.js)

| Route | Purpose | Auth |
|---|---|---|
| Reverse-geocode route | Geolocation → city/area lookup | None (public) |
| Sitemap routes (/sitemaps/[chunk]) | Dynamic sitemap chunks | None (public) |

### Client-Side Writes (Traffic)

| Operation | Target | Auth |
|---|---|---|
| Provider claim submit | business_claim_requests | ANON — no session |
| Intake lead capture | business_intake_leads (inferred) | ANON — no session |

SECURITY FLAG: Traffic claim/lead writes are anon — must be protected by RLS INSERT policy.
A malicious user could spam claim_requests without any rate limiting visible at the app layer.
Recommend: Rate limiting via Supabase edge function or RLS policy.

---

## Unauthenticated Sensitive Routes — Flags

| Location | Route/Endpoint | Risk |
|---|---|---|
| VCSM | readVportPublicDetails RPC | LOW — public by design, but verify no private fields returned |
| VCSM | public/vportMenu | LOW — intentionally public |
| VCSM | vportBusinessCard | LOW — intentionally public, but vportBusinessCardLead.write.dal.js accepts unauthenticated lead submissions |
| Traffic | All Supabase reads | LOW — views are designed as public; risk if view definition changes |
| Traffic | claim/lead writes | MEDIUM — anon writes with no rate limiting at app layer |

---

## Over-Broad Payload Risks (Inferred)

| DAL | Risk |
|---|---|
| readVportPublicDetails RPC | RPC may return more fields than UI needs — verify field selection |
| vportBusinessCard.read.dal.js | Business card may include internal fields not meant for public display |
| public_traze_provider_index_v | View definition controls exposure — any internal field added to view becomes public |
| feed.read.actorsBundle.dal.js | Actor bundle for feed — verify no email/phone in actor select |

---

## Duplicate API Logic

| Pattern | Files |
|---|---|
| getVportPublicDetails | readVportPublicDetails.rpc.dal.js (public/vportMenu) + vportProfile.read.dal.js (dashboard) + settings/profile/dal/vportPublicDetails.read.dal.js (settings) — three separate reads of vport details |
| Actor resolution | readActorProfile, readActorIdByUsername, resolveActorSlug all resolve actor identity separately |
