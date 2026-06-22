# ARCHITECT — Database Read Map
Generated: 2026-05-09

---

## TRAFFIC — Supabase View Reads

### vportDataset.read.dal.js
View: public_traze_provider_index_v
Called by: vportDataset.controller.js → connectors/unifiedDataset.js, vportDataset.js
Used in: generateStaticParams, city/segment/service pages

### vportHomepage.read.dal.js
View: public_traze_provider_index_v
Called by: connectors/vportHomepage.connector.js
Used in: homepage.repo.js → home feature components

### providerProfile.read.dal.js
View: public_traze_portfolio_v
Called by: provider.repo.js
Used in: /pro/[providerSlug] page

### trazeCategories.read.dal.js
View: public_traze_provider_index_v
Called by: taxonomyParams.repo.js, category.repo.js
Used in: generateStaticParams for segment pages

### priceAggregate.read.dal.js
Table: (price aggregate — TBD, likely vc.vport_price_aggregates)
Called by: aggregate.repo.js

### publicContent.read.dal.js
Table: (public content/guides)
Called by: content.repo.js

DUPLICATE READ WARNING:
public_traze_provider_index_v is read by THREE separate DAL files:
- vportDataset.read.dal.js
- vportHomepage.read.dal.js
- trazeCategories.read.dal.js
These all read the same view with different filters. At build time during generateStaticParams, multiple reads may fan out across all three. Consider a single cached read that feeds all three consumers.

---

## VCSM — Feed Read Chain

### feed.read.posts.dal.js
Tables: vc.posts (likely via feed view)
Called by: FeedController / getFeedViewerContext
Call chain: CentralFeedScreen → useFeed → FeedController → feed.read.posts.dal.js

### feed.read.actorsBundle.dal.js
Tables: vc.actors (batch)
Called by: FeedController (after posts load)

### feed.read.blockRows.dal.js
Tables: vc.blocks
Called by: FeedController

### feed.read.followRows.dal.js
Tables: vc.actor_follows
Called by: FeedController

### feed.read.hiddenPosts.dal.js
Tables: vc.hidden_posts (or similar)
Called by: FeedController

### feed.read.media.dal.js
Tables: vc.post_media
Called by: FeedController

### feed.read.commentCounts.dal.js
Tables: vc.comments (count only)
Called by: FeedController

### feed.read.reactionCounts.dal.js
Tables: vc.post_reactions (count only)
Called by: FeedController

### feed.read.viewerContext.dal.js
Tables: vc.actors (viewer resolution)
Called by: getFeedViewerContext.controller.js

### feed.read.viewerReactions.dal.js
Tables: vc.post_reactions (viewer-specific)
Called by: FeedController

N+1 WARNING — Feed Assembly:
The feed controller calls at minimum 9 separate DAL reads per feed load:
posts → actors → blocks → follows → hidden → media → commentCounts → reactionCounts → viewerReactions
These appear to be sequential rather than parallel. This is a HIGH impact bottleneck.

---

## VCSM — Auth Read Chain

### actorGetByProfile.dal.js
Tables: vc.actors, vc.profiles (join)
Called by: authSession.controller.js

### authSession.read.dal.js
Tables: Supabase auth (session)
Called by: authSession.controller.js, identity.controller.js

### profile.dal.js
Tables: vc.profiles
Called by: profile.controller.js

---

## VCSM — Profile Read Chain

### readActorProfile.dal.js
Tables: vc.actors + profile join
Called by: getProfileView.controller.js

### readActorKind.dal.js
Tables: vc.actors (kind column)
Called by: getActorKind.controller.js

### readActorIdByUsername.dal.js
Tables: vc.actors (username lookup)
Called by: resolveUsernameToActor.controller.js

### resolveActorSlug.dal.js
Tables: vc.actors (slug lookup)
Called by: resolveActorBySlug.controller.js

DUPLICATE READ WARNING:
readActorProfile, readActorKind, readActorType, readActorIdByUsername, and resolveActorSlug
all access vc.actors. During a profile page load, multiple of these may fire independently.
The hydration engine (hydrateActor.controller.js) is meant to consolidate actor reads — verify it is used consistently.

---

## VCSM — Public Vport Read Chain

### readVportPublicDetails.rpc.dal.js
Method: RPC call
Tables: vc.vports + joins (via RPC)
Called by: getVportPublicDetails.controller.js (public/vportMenu)

### readVportPublicMenu.rpc.dal.js
Method: RPC call
Tables: vc.vport_menu_categories, vc.vport_menu_items (via RPC)
Called by: getVportPublicMenu.controller.js

### vportBusinessCard.read.dal.js
Tables: vc.vports, vc.actors, vc.vport_services (likely)
Called by: vportBusinessCard.controller.js

### businessCardSections.read.dal.js
Tables: vc.vport_business_card_sections (or similar)
Called by: vportBusinessCard.controller.js

---

## VCSM — Booking Read Chain

### listBookingResourcesByOwnerActorId.dal.js
Tables: vport.resources
Called by: listOwnerBookingResources.controller.js

### listAvailabilityRulesByResourceId.dal.js
Tables: vport.availability_rules
Called by: getResourceAvailability.controller.js

### listAvailabilityExceptionsInRange.dal.js
Tables: vport.availability_exceptions
Called by: getResourceAvailability.controller.js

### listBookingsInRange.dal.js
Tables: vport.bookings
Called by: getResourceAvailability.controller.js

N+1 WARNING — Resource Availability:
getResourceAvailability calls 3 DAL reads (rules + exceptions + bookings) per resource.
If a staff list view loads multiple resources, this becomes 3N reads.

---

## VCSM — Moderation Read Chain

### assertModerationAccess.dal.js
Tables: vc.moderation_roles (or similar)
Called by: all moderation controllers (pre-flight check)

### reports.read.dal.js
Tables: vc.reports
Called by: report.controller.js

---

## Engine — Chat Read Chain (engines/chat/)

### inbox.read.dal.js
Tables: vc.chat_inboxes (or similar)
Called by: getInboxEntries.controller.js

### messages.timeline.read.dal.js
Tables: vc.chat_messages
Called by: getConversationMessages.controller.js

### conversationMembers.read.dal.js
Tables: vc.conversation_members
Called by: getConversationMembers.controller.js

### blockRelations.read.dal.js
Tables: vc.blocks
Called by: evaluateConversationPolicy.controller.js

DUPLICATE READ WARNING:
vc.blocks is read both in engines/chat (blockRelations) and in apps/VCSM/features/block (block.read.dal.js).
These are separate code paths but read the same table. Ensure RLS or caching prevents double DB hits.

---

## Engine — Notifications Read Chain (engines/notifications/)

### events.read.dal.js
Tables: vc.notification_events
Called by: getInbox.controller.js

### inbox.read.dal.js
Tables: vc.notification_inbox
Called by: inboxState.controller.js

### recipients.read.dal.js
Tables: vc.notification_recipients
Called by: getInbox.controller.js

---

## Engine — Identity Read Chain (engines/identity/)

### session.read.dal.js
Tables: Supabase auth (JWT)
Called by: resolveAuthenticatedContext.controller.js

### actorLinks.read.dal.js
Tables: vc.actor_links (or similar)
Called by: resolveAuthenticatedContext.controller.js

### capabilities.read.dal.js
Tables: vc.actor_capabilities
Called by: resolveAuthenticatedContext.controller.js

### roles.read.dal.js
Tables: vc.actor_roles
Called by: resolveAuthenticatedContext.controller.js

SERIAL CHAIN WARNING:
Identity resolution reads session → actorLinks → capabilities → roles in sequence.
If any step is uncached, this is 4 sequential reads on every authenticated request.
The hydration engine caches actor records, but identity resolution may not be cached.
