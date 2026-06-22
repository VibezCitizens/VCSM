# Runtime Feature Index: social

## Metadata
| Field | Value |
|---|---|
| Feature | social |
| CURRENT Folder | CURRENT/features/social |
| Source Folder | apps/VCSM/src/features/social |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |

## Source Inventory
| Layer | Count | Key Files |
|---|---:|---|
| Controllers | 13 | follow.controller.js, unsubscribe.controller.js, followRequests.controller.js, getFollowRelationshipState.controller.js, getFollowStatus.controller.js, getFollowerCount.controller.js, getActorPrivacy.controller.js |
| DALs | 7 | actorFollows.dal.js, followRequests.dal.js, subscriberCount.dal.js, actorPrivacy.dal.js, actorSocialPublicPolicy.dal.js, actorSocialSettings.dal.js, actorSignalVisibility.dal.js |
| Hooks | 11 | useFollowActorToggle.js, useFollowRequestActions.js, useFollowRequestStatus.js, useIncomingFollowRequests.js, useSendFollowRequest.js, useSocialFollowRequestOps.js, useSubscribeAction.js, useFollowStatus.js, useFollowerCount.js, useUnsubscribeAction.js, useActorPrivacy.js |
| Models | 2 | followRequest.model.js, followRelationState.model.js |
| Screens | 0 | NONE — social surfaces embedded in profiles, feed, notifications |
| Components | 2 | PrivateProfileNotice.jsx, SubscribeDebugPanel.jsx |
| Routes | 0 | NONE — no dedicated routes |
| Tests | 3 | followRequests.controller.test.js, follow.controller.test.js, unsubscribe.controller.test.js |

## Route / Screen Map
| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| NONE dedicated | — | — | Social surfaces embedded in profile screens, bottom nav, feed |

## Mutation Surface Map
| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| ctrlSubscribe | friend/subscribe/controllers/follow.controller.js | INSERT vc.actor_follows (upsert) | YES — V-SUB-001: assertingActorId === followerActorId | LOW |
| ctrlUnsubscribe | friend/subscribe/controllers/unsubscribe.controller.js | UPDATE vc.actor_follows (deactivate) + UPDATE vc.social_follow_requests (revoked) | YES — V-SUB-002: assertingActorId === followerActorId | LOW |
| ctrlAcceptFollowRequest | friend/request/controllers/followRequests.controller.js | INSERT vc.actor_follows + UPDATE vc.social_follow_requests | YES — V-SUB-003: assertingActorId === targetActorId | LOW |
| ctrlDeclineFollowRequest | friend/request/controllers/followRequests.controller.js | UPDATE vc.social_follow_requests (declined) | YES — assertingActorId === targetActorId | LOW |
| ctrlCancelFollowRequest | friend/request/controllers/followRequests.controller.js | UPDATE vc.social_follow_requests (cancelled) | YES — assertingActorId === requesterActorId | LOW |
| ctrlSendFollowRequest | friend/request/controllers/followRequests.controller.js | UPSERT vc.social_follow_requests | PARTIAL — block check only; called internally by ctrlSubscribe (which has ownership gate) | MEDIUM |
| dalUpdateActorSocialSettings | privacy/dal/actorSocialSettings.dal.js | UPDATE vc.actor_social_settings | NO — no controller-layer ownership gate; ctrlSetActorPrivacy missing (ELEK-002 HIGH) | HIGH |

## Security-Sensitive Surface Map
| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| dalUpdateActorSocialSettings | privacy/dal/actorSocialSettings.dal.js | PRIVACY + OWNERSHIP | ELEK-2026-05-27-002 HIGH OPEN: no assertingActorId ownership gate on write path; ctrlSetActorPrivacy not found in source |
| vc.get_follower_count RPC | DB (via subscriberCount.dal.js) | DB_RLS | Security context (prosecdef/proconfig) UNKNOWN — V-SUB-008 HIGH OPEN; RPC may not exist in live DB |
| vc.actor_social_settings | DB (via actorSocialSettings.dal.js) | DB_RLS | RLS policies UNKNOWN — not DB-verified |
| vc.social_follow_requests | DB (via followRequests.dal.js) | DB_RLS | RLS policies UNKNOWN — not DB-verified |
| count_subscribers / list_subscribers RPCs | DB | DB_SECDEF | ELEK-2026-05-27-001 HIGH OPEN — SECURITY DEFINER; private subscriber enumeration via direct REST; Phase 0 migration 20260527060000 READY TO APPLY |
| ctrlSubscribe — actor-kind guard | friend/subscribe/controllers/follow.controller.js | FOLLOW_BYPASS | ELEK-2026-05-27-003 MEDIUM OPEN — no actor-kind check; VPORT can follow Citizen and gain private post access |
| Notification linkPath raw UUID | followRequests.controller.js, follow.controller.js | ACTOR_ID_ENUMERATION | ELEK-2026-05-27-004 MEDIUM OPEN — linkPath: /feed does not expose UUID; risk may be resolved |

## Open Security Findings
| Finding | Severity | Status | Ticket |
|---|---|---|---|
| ELEK-2026-05-27-001 — count_subscribers/list_subscribers SECURITY DEFINER private enumeration | HIGH | OPEN | Phase 0 migration 20260527060000 READY TO APPLY |
| ELEK-2026-05-27-002 — ctrlSetActorPrivacy no ownership gate | HIGH | OPEN | TICKET-SUB-005 |
| V-SUB-008 — vc.get_follower_count RPC missing in live DB | HIGH | OPEN | CARNAGE sprint required |
| BW-SUB-003 — actor-kind follow bypass (VPORT follows Citizen) | HIGH | OPEN | Governance rule required before code enforcement |
| ELEK-2026-05-27-003 — ctrlSubscribe no actor-kind guard | MEDIUM | OPEN | TICKET-SUB-005 |
| ELEK-2026-05-27-004 — raw actor UUID in notification sender routes | MEDIUM | OPEN | Verify linkPath paths |

## CI / Test Status
| Item | Status |
|---|---|
| 17 tests V-SUB-001/002/003 | INTENTIONALLY FAILING in CI |
| follow.controller.test.js | Present — coverage unknown |
| followRequests.controller.test.js | Present — coverage unknown |
| unsubscribe.controller.test.js | Present — coverage unknown |
| SPIDER-MAN formal pass | NOT RUN |
| TESTS.md | MISSING |

## DB Migration Status
| Phase | Description | Status |
|---|---|---|
| Phase 0 | Apply 20260527060000 — vport.profiles guard on count_subscribers/list_subscribers | WRITTEN, READY TO APPLY |
| Phase 1 | Create count_vport_subscribers + list_vport_subscribers RPCs | PENDING — blocked on Phase 0 + 3 DB verifications |
| Phase 2 | Update DAL call sites + rename exports | PENDING |
| Phase 3 | Drop count_subscribers + list_subscribers | PENDING |

## Recommended Next Command

CARNAGE (vc.get_follower_count RPC creation — V-SUB-008 HIGH) after DB verifies the three unknowns. Then apply Phase 0 migration 20260527060000. Then VENOM full pass to verify ctrlSetActorPrivacy gate (ELEK-002).
