# ARCHITECT — Feature Ownership Map
Generated: 2026-05-09

---

## VCSM Feature Ownership

| Feature | Owns | Primary Data Source | Dependent Features | Shared Engines |
|---|---|---|---|---|
| auth | Session, registration, login, actor creation | vc.actors, vc.profiles, Supabase auth | identity, onboarding | identity |
| identity | Active actor resolution, actor switching | actorStore (Zustand), engines/identity | ALL features | identity, hydration |
| feed | Post rendering, feed assembly | vc.posts, vc.post_media, vc.post_reactions | actors (hydration), block, social | hydration |
| profiles | Actor profile views (user + vport) | vc.actors, vc.vports, vc.profiles | social, reviews, portfolio, booking | hydration, reviews, portfolio |
| post | Post CRUD, reactions, comments | vc.posts, vc.post_reactions, vc.comments | upload, feed | — |
| upload | Post creation flow | vc.posts, vc.post_media, vc.post_mentions | post, media | media |
| chat | Conversations, messaging, inbox | engines/chat tables | block, identity, media | chat, media |
| notifications | Notification inbox, unread count | engines/notifications tables | identity, chat | notifications |
| booking | Appointment booking (customer side) | engines/booking tables | profiles, identity | booking |
| dashboard | Vport owner operations | engines/booking, engines/portfolio, engines/reviews | vport, booking, media | booking, portfolio, reviews, media |
| social | Follow/subscribe/friend graph | vc.actor_follows, vc.follow_requests | profiles, notifications | — |
| block | Block relationships | vc.blocks | chat, feed, profiles | — |
| settings | Profile settings, account, privacy | vc.profiles, vc.actors, vc.vports | identity, auth, media | identity |
| onboarding | Registration completion flow | vc.onboarding_steps, vc.vibe_tags | auth, identity | — |
| invite | Invite management | vc.invites | auth, onboarding | — |
| join | Business join flow (barber QR) | vc.vports, vc.actor_owners | auth, booking | booking |
| legal | Legal documents, consent | platform.legal_documents, platform.user_consents | auth | — |
| moderation | Content moderation, reports | vc.reports, vc.moderation_actions | feed, chat, profiles | — |
| explore | Search, discovery | vc.actors (search) | actors (hydration), profiles | — |
| media | Media upload, asset management | Cloudflare R2 / vc.media_assets | upload, dashboard, portfolio | media |
| vport | Vport creation, core ops | vc.vports, vc.actors | profiles, dashboard | — |
| public/vportMenu | Public vport page (no auth) | RPC: vport details + menu | reviews, portfolio | reviews, portfolio |
| public/vportBusinessCard | Business card page | vc.vports, vc.vport_services | reviews | — |
| professional | Professional briefings | vc.professional_briefings | profiles | — |
| ads | Vport advertising settings | vc.vport_ads | dashboard | — |
| wanderex | Public discovery experience | vc.wanderex (public view) | — | — |
| wanders | Card-based mailbox system | vc.wanders_* tables | auth, identity | — |
| vgrid | (Grid UI feature) | Unknown | — | — |
| void | (Unknown — likely placeholder) | Unknown | — | — |

---

## TRAFFIC Feature Ownership

| Feature | Owns | Primary Data Source | Conversion Target |
|---|---|---|---|
| home | Homepage provider discovery | public_traze_provider_index_v | VCSM profile pages |
| providers | Provider card rendering, detail pages | public_traze_portfolio_v | VCSM /v/:slug |
| directories | City/service directory listing | public_traze_provider_index_v | VCSM profile pages |
| categories | Category browser | public_traze_provider_index_v (taxonomy) | VCSM category pages |
| conversion | CTA, lead capture, deep-link | — (write: business_claim_requests) | VCSM booking / profile |
| answers | FAQ/answer content pages | public content table | — |
| reviews | Review display (read-only) | providerReviews.connector | VCSM review system |

---

## Ownership Violations / Unclear Ownership

### profiles — screens/views/tabs/* controllers (VIOLATION)
Controllers duplicated inside screen folder hierarchy:
- profiles/screens/views/tabs/friends/controller/ (DUPLICATE)
- profiles/screens/views/tabs/post/controllers/ (DUPLICATE)
- profiles/screens/views/tabs/tags/controller/ (DUPLICATE)
Expected: All controllers at features/profiles/controller/
Resolution: Canonical path is features/profiles/controller/ — screen-nested copies are layer violations.

### vgrid
Feature exists at apps/VCSM/src/features/vgrid/ but purpose is unclear from scan.
No DAL or controller detected. Likely a UI-only grid component feature.
Flag: Verify not dead.

### void
Feature exists at apps/VCSM/src/features/void/ — purpose unknown.
Flag: Likely dead or placeholder. Verify.

### feed engine (engines/feed/)
Engine exists but is not consumed by any app.
VCSM has its own feed feature with its own DAL.
Flag: engines/feed/ appears orphaned. Possibly early engine extraction that was abandoned.

---

## Cross-Feature Leakage Risk

| Risk | Feature A | Feature B | Detail |
|---|---|---|---|
| Block state duplicated | block feature | chat engine | vc.blocks read independently by both |
| Actor fetch duplicated | hydration engine | any feature that fetches actor data directly | Features must read from actorStore, not fire their own actor DAL reads |
| Booking logic duplicated | features/booking | engines/booking | App-level booking controllers may duplicate engine logic |
