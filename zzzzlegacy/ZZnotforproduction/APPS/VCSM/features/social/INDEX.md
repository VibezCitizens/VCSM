---
name: vcsm.social.index
description: VCSM social feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / social

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 15 | follow.controller.js, unsubscribe.controller.js, getFollowRelationshipState.controller.js, getFollowStatus.controller.js, getFollowerCount.controller.js, followRequests.controller.js, getActorPrivacy.controller.js |
| DAL files | 19 | actorFollows.dal.js, followRequests.dal.js, subscriberCount.dal.js, actorPrivacy.dal.js, actorSocialPublicPolicy.dal.js, actorSocialSettings.dal.js, actorSignalVisibility.dal.js |
| Hooks | 13 | useFollowActorToggle.js, useFollowStatus.js, useFollowerCount.js, useUnsubscribeAction.js, useSendFollowRequest.js, useFollowRequestActions.js, useFollowRequestStatus.js, useSocialFollowRequestOps.js, useSubscribeAction.js, useIncomingFollowRequests.js, useActorPrivacy.js |
| Models | 5 | followRelationState.model.js, followRequest.model.js |
| Screens | 0 | No dedicated screens — social is embedded in profile and settings screens |
| Components | 3 | PrivateProfileNotice.jsx, SubscribeDebugPanel.jsx |
| Adapters | 2 | social.adapter.js (top-level), actorPrivacy.adapter.js + sub-adapters in adapters/friend/ |
| Barrels | 3 | social.adapter.js barrel + friend sub-adapters |
| Tests | 3 | follow.controller.test.js, unsubscribe.controller.test.js, followRequests.controller.test.js |
| Routes | 0 | No routes registered for this feature |
| Total source files | 44 | From scanner sourceFileCount |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| update | vc | actor_follows | dalDeactivateFollow |
| upsert | vc | actor_follows | dalInsertFollow |
| update | vc | social_follow_requests | dalUpdateRequestStatus |
| upsert | vc | social_follow_requests | dalUpsertPendingRequest |
| rpc | vc | — | dalCountSubscribers (get_follower_count) |
| rpc | vc | — | dalCanViewActorSignal (can_view_actor_signal) |
| rpc | vc | — | dalGetActorSocialPublicPolicy (get_actor_social_public_policy) |
| update | vc | actor_social_settings | dalUpdateActorSocialSettings |

## Security-Sensitive Surfaces

- **vc.actor_follows (upsert):** Follow edge creation. Ownership gate (`assertingActorId === followerActorId`) enforced in `follow.controller.js`. Block check required before insert.
- **vc.social_follow_requests (upsert/update):** Accept/decline/cancel operations. Ownership gate (`assertingActorId === targetActorId` for accept/decline; `assertingActorId === requesterActorId` for cancel) enforced in `followRequests.controller.js`.
- **vc.actor_social_settings (update):** Privacy and follow policy settings. RLS restricts to `actor_id = auth.uid()`. VPORT actor mutation path noted in source as requiring an `actor_owners` gate — verify this path exists.
- **vc.social_follow_requests inbox read:** `ctrlListIncomingRequests` enforces `assertingActorId === targetActorId` ownership gate before returning pending request list.

## Engine Dependencies

- **identity** — actor resolution and identity context
- **notification** — follow and follow_request notifications published via `publishVcsmNotification`
- **profile** — profile data for actor display

## Routes

No routes registered in the route-map for this feature. Social functionality is embedded within profile and settings routes.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (content is PLACEHOLDER — needs full contract) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
