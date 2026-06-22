# ARCHITECT — Event Flow Map
Generated: 2026-05-09

---

## VCSM — Major Event Flows

### 1. User Creates a Post
```
PostUploadButton (UI)
  → useCreatePost (hook) / upload feature
  → createPost.controller.js
  → insertPost.dal.js → vc.posts
  → insertPostMedia.dal.js → vc.post_media
  → insertPostMentions.dal.js → vc.post_mentions
  → recordPostMedia.controller.js
  → engines/media → uploadMedia.controller.js → r2Upload.dal.js (Cloudflare R2)
  → notifications trigger (via DB trigger or publishEvent controller)
```
Missing error handling risk: If media upload fails after post insert, post exists without media. Verify rollback via postAuthRollback.dal.js.

### 2. User Loads Feed
```
CentralFeedScreen mount
  → useFeed (hook)
  → getFeedViewerContext.controller.js
    → feed.read.viewerContext.dal.js (viewer actor)
    → feed.read.blockRows.dal.js (blocked actors)
    → feed.read.followRows.dal.js (followed actors)
  → listActorPosts.controller.js
    → feed.read.posts.dal.js (post list)
    → feed.read.actorsBundle.dal.js (author actors → actorStore)
    → feed.read.media.dal.js (post media)
    → feed.read.reactionCounts.dal.js
    → feed.read.commentCounts.dal.js
    → feed.read.viewerReactions.dal.js
    → feed.read.hiddenPosts.dal.js
```
SERIAL CHAIN: 9 DAL reads. If not parallelized, this is a serial latency stack.

### 3. User Sends Chat Message
```
SendMessageButton (UI)
  → useSendMessageActions (hook)
  → engines/chat → sendMessage.controller.js
  → engines/chat → evaluateConversationPolicy.controller.js
    → blockRelations.read.dal.js (block check)
  → engines/chat → sendMessageAtomic.rpc.dal.js (atomic RPC write)
  → engines/chat → Supabase Realtime broadcast
  → Recipient sees message via Realtime subscription
  → engines/notifications → publishEvent.controller.js (async notify)
```

### 4. User Books an Appointment
```
BookingButton (UI)
  → useCreateBooking (hook)
  → createBooking.controller.js (app)
    → assertActorOwnsVportActor (ownership check)
    → engines/booking → createBooking.controller.js
    → engines/booking → booking.write.dal.js → vport.bookings
  → engines/notifications → publishEvent (notify provider)
```
Engine bypass risk: App-level createBooking.controller.js must not bypass engine-level ownership assertion.

### 5. User Follows Another Actor
```
FollowButton (UI)
  → useFollowActions (hook) / social feature
  → follow.controller.js
  → actorFollows.dal.js → vc.actor_follows
  → engines/notifications → publishEvent.controller.js (follow notification)
  → followRequestsStore.js update (if follow request, not immediate)
```

### 6. Vport Owner Updates Public Details
```
VportSettingsScreen
  → (hook for vport settings)
  → saveVportPublicDetailsByActorId.controller.js
  → ensureVportOwnerResource.controller.js (ownership check)
  → vportPublicDetails.write.dal.js → vc.vports
  → cache invalidation (actorStore)
```

### 7. User Submits a Review
```
ReviewForm (UI)
  → (useReview hook)
  → engines/reviews → submitReview.controller.js
  → engines/reviews → reviews.write.dal.js → vc.vport_reviews
  → engines/reviews → dimensionRatings.write.dal.js
```

### 8. Provider Claim (Traffic → VCSM)
```
ClaimProviderButton (Traffic UI)
  → features/conversion → ClaimController.submitClaim
  → features/conversion → ClaimDAL.insertRequest
    → business_claim_requests table (anon write via Supabase client)
  → VCSM (async) processes claim
  → VCSM links claim to actor via actor_owners
```
Trust boundary: Traffic submits claim with no auth. VCSM must validate actorId server-side.

### 9. App Bootstrap (Auth Identity Resolution)
```
App mount
  → bootstrap.hydrate.controller.js
  → engines/identity → resolveAuthenticatedContext.controller.js
    → session.read.dal.js (Supabase JWT)
    → actorLinks.read.dal.js
    → capabilities.read.dal.js
    → roles.read.dal.js
  → identity.controller.js (VCSM app)
  → ensureVcsmPlatformBootstrap.controller.js
  → actorStore.js populated
  → identitySelection.store.js set
  → App routes unlocked
```
Serial identity chain: 4 sequential reads before app is accessible. Cache hit rate on this chain is critical.

### 10. Moderation Action (Admin)
```
ModerationPanel (UI — admin only)
  → moderationActions.controller.js
  → assertModerationAccess.dal.js (pre-flight — must pass)
  → moderationActions.dal.js → vc.moderation_actions
```
If assertModerationAccess fails, no further DAL access should occur. Verify controller short-circuits on failure.

---

## Detected Dead / Missing Event Flows

### feedWelcomeCard.controller.js
Exists but no screen event flow was found that clearly triggers it.
Classification: POSSIBLY DEAD or rarely triggered.

### getDebugPrivacyRows.controller.js
Debug-only event flow. Must not be triggered in production.

### refreshActorDirectory.controller.js + refreshActorDirectory.dal.js
Directory refresh flow — unclear when this is triggered.
May be a manual admin operation or background job. Verify trigger.

---

## Missing Error Handling (Detected Patterns)

| Flow | Risk |
|---|---|
| Post creation | If insertPost succeeds but insertPostMedia fails, post exists without media |
| Chat send | If RPC fails after policy check, user may get no feedback |
| Booking create | If booking write succeeds but notification publish fails, provider not notified |
| Claim submit | If anon write to business_claim_requests fails, no retry mechanism visible |
