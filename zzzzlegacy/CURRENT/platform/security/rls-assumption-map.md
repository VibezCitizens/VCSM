# ARCHITECT — RLS Assumption Map
Generated: 2026-05-09

---

## Traffic — Anon Client Reads

All Traffic Supabase reads use the anon client (supabase.client.js).
No auth token is attached to any Traffic query.

| DAL File | View/Table | App-Layer Auth | RLS Required |
|---|---|---|---|
| vportDataset.read.dal.js | public_traze_provider_index_v | None | YES — view must be public-safe |
| vportHomepage.read.dal.js | public_traze_provider_index_v | None | YES |
| trazeCategories.read.dal.js | public_traze_provider_index_v | None | YES |
| providerProfile.read.dal.js | public_traze_portfolio_v | None | YES |
| priceAggregate.read.dal.js | (price aggregate table) | None | YES |
| publicContent.read.dal.js | (content table) | None | YES |

ASSUMPTION: All Traffic-facing views are intentionally public (SELECT for anon).
RISK: If a view definition is modified and accidentally joins a non-public table,
      data could be exposed. View definitions should be reviewed via /DB or /Carnage.

Traffic also has a write surface (provider claim / intake lead):
- Claim request writes go through anon client
- App-layer: no auth check (Traffic has no auth)
- RLS MUST enforce: anon INSERT allowed, but SELECT of others' claims MUST be blocked
- actorId or vportId must never be caller-provided and trusted in claim association

---

## VCSM — DAL Methods With No App-Layer Auth Check

These DAL files perform reads that appear to have no explicit app-layer ownership check.
The assumption is that RLS (Row Level Security) enforces isolation at the DB layer.

### readPublicVportReviews.dal.js
Path: features/public/vportMenu/dal/
Table: vc.vport_reviews (or similar)
App-layer auth: None (public endpoint)
RLS assumption: reviews are public — SELECT for all roles
Risk: LOW if reviews are intentionally public

### readPublicVportReviewSummary.dal.js
Similar to above — aggregate, public
Risk: LOW

### listVportActorMenuCategories.dal.js / listVportActorMenuItems.dal.js
Path: features/profiles/kinds/vport/dal/menu/
These are read by the public vport menu — no auth required
App-layer auth: None on the read path
RLS assumption: menu data is public
Risk: LOW if menu is intentionally public

### wanderexPublic.read.dal.js
Path: features/wanderex/dal/
Purpose: Public discovery — no auth
App-layer auth: None
RLS assumption: data is publicly readable
Risk: MEDIUM — depends on what fields are exposed. Verify no internal fields in view.

---

## VCSM — DAL Methods That Should Have App-Layer Auth (Verify)

### moderation DAL suite
Path: features/moderation/dal/
assertModerationAccess.dal.js is the pre-flight check.
All other moderation DAL files should only be reachable AFTER this check.
Risk: If any moderation controller skips assertModerationAccess, privilege escalation is possible.

### dashboard/vport/dal/write/*.write.dal.js
All vport dashboard write DAL files mutate vport data.
These should only be reachable when actorId is verified as owner via actor_owners.
App-layer check: ensureVportOwnerResource.controller.js must be called before any write.
Risk: If any write DAL is called without going through the owner check controller, unauthorized writes are possible.

### settings/profile/dal/profile.write.dal.js
Writes to vc.profiles.
App-layer check: saveProfile.controller.js must verify actorId matches session.
Risk: If controller is bypassed, any authenticated user could write to any profile.

### admin moderation write DAL (conversationCover.write.dal.js, moderationActions.dal.js)
Must only be reachable after admin/moderator role verification.
assertModerationAccess.dal.js must be the gatekeeper.

---

## Mixed Trust Boundary Warning

### booking DAL — dual implementation
App booking DAL (apps/VCSM/src/features/booking/dal/) and engine booking DAL (engines/booking/src/dal/) both write to booking tables.
If app DAL bypasses ownership check that the engine DAL enforces, there is a trust boundary gap.
Recommended: All booking writes must go through engines/booking controllers (which enforce actor ownership via assertActorOwnsVportActor).

### feed.read.debugPrivacyRows.dal.js
Path: features/feed/dal/
Purpose: Debug — reads privacy rows for debugging feed visibility
Risk: MEDIUM — debug reads should be gated by dev environment flag.
If this DAL is callable in production, internal privacy data is exposed.
Check: getDebugPrivacyRows.controller.js must be dev-only.

---

## Engine-Level Auth Assumptions

### engines/identity
resolveAuthenticatedContext.controller.js reads session, actorLinks, capabilities, roles.
This is the canonical auth boundary. All app-level controllers should call through this.
Risk: If any app controller resolves identity itself instead of calling the identity engine,
      identity misuse is possible.

### engines/chat
evaluateConversationPolicy.controller.js enforces who can send to whom (block checks, spam, privacy).
Risk: If any app-level chat hook bypasses the engine policy controller, blocked actors could send messages.

### engines/booking
assertActorOwnsVportActor.controller.js is the ownership gate for all booking mutations.
Risk: App-level booking controllers (assertActorOwnsVportActor.controller.js in features/booking/controller/) duplicate this check. Verify they call the engine version, not a weaker app-level version.
