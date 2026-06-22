# MODULE ARCHITECTURE REPORT

**Module:** social
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Social Graph (Follow, Subscribe, Privacy)
**Primary Root:** `apps/VCSM/src/features/social/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns the social graph: follow/unfollow actions, follow request flow (for private profiles), follower count, follow relationship state, and actor privacy settings. Organized into three sub-domains: `friend/subscribe` (public follow), `friend/request` (private profile follow requests), and `privacy` (actor privacy settings).

---

## ENTRY POINTS

No direct routing screens — social is consumed via adapters by profiles, settings, and notifications features.

---

## LAYER MAP

**friend/subscribe/ sub-module:**
DAL: `subscriberCount.dal.js`
Controllers: `follow.controller.js`, `getFollowRelationshipState.controller.js`, `getFollowStatus.controller.js`, `getFollowerCount.controller.js`, `unsubscribe.controller.js`
Hooks: `useFollowActorToggle.js`, `useFollowStatus.js`, `useFollowerCount.js`, `useUnsubscribeAction.js`
Model: `followRelationState.model.js`
Component: `SubscribeDebugPanel.jsx`

**friend/request/ sub-module:**
DAL: `actorFollows.dal.js`, `followRequests.dal.js`
Controllers: `followRequests.controller.js`
Hooks: `useFollowRequestActions.js`, `useFollowRequestStatus.js`, `useIncomingFollowRequests.js`, `useSendFollowRequest.js`, `useSocialFollowRequestOps.js`, `useSubscribeAction.js`
Model: `followRequest.model.js`

**privacy/ sub-module:**
DAL: `actorPrivacy.dal.js`
Controller: `getActorPrivacy.controller.js`
Hook: `useActorPrivacy.js`

**Components:**
- `PrivateProfileNotice.jsx`

**Adapters:**
- `social.adapter.js` — main adapter
- `friend/request/hooks/useFollowRequestActions.adapter.js`
- `friend/request/hooks/useIncomingFollowRequests.adapter.js`
- `friend/request/hooks/useSendFollowRequest.adapter.js`
- `friend/request/hooks/useSubscribeAction.adapter.js`
- `friend/subscribe/components/SubscribeDebugPanel.adapter.js`
- `friend/subscribe/hooks/useFollowActorToggle.adapter.js`
- `friend/subscribe/hooks/useFollowStatus.adapter.js`
- `friend/subscribe/hooks/useFollowerCount.adapter.js`
- `privacy/hooks/useActorPrivacy.adapter.js`
- `components/PrivateProfileNotice.adapter.js`

**Store:** None

**Engine Consumers:** None

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Social graph ownership clear | — |
| Owner defined | PARTIAL | No IRONMAN record | — |
| Entry points mapped | PASS | All via adapters — correct | — |
| Controllers present/delegated | PASS | 7 controllers | — |
| DAL/repository present/delegated | PASS | 3 DAL files | — |
| Models/transformers present | PASS | 2 models | — |
| Hooks/view models present | PASS | 10 hooks | — |
| Screens/components present | PARTIAL | 2 components, no screens | No follow request management screen |
| Services/adapters present | PASS | 11 adapter exports | — |
| Database objects mapped | PARTIAL | vc.actor_follows, vc.follow_requests, vc.actor_privacy | — |
| Authorization path mapped | PARTIAL | Follow state checked in controllers | No auth gate on follow action |
| Cache/runtime behavior mapped | FAIL | No cache documented | Follower count cached? |
| Error/loading/empty states mapped | FAIL | No screens = no UI states | — |
| Documentation linked | FAIL | No Logan doc | — |
| Tests/validation noted | FAIL | No tests | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | No engine dependencies | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `profiles` feature | feature | profiles → social | YES (via adapter) | Profile follow button |
| `settings` feature | feature | settings → social | YES (via adapter) | Privacy settings |
| `notifications` feature | feature | notifications → social | PARTIAL | Follow notifications |
| `vc.actor_follows` | database | social reads/writes | YES | — |
| `vc.follow_requests` | database | social reads/writes | YES | — |
| `vc.actor_privacy` | database | social reads/writes | YES | — |
| `state/social/followRequestsStore.js` | state | social → global store | PARTIAL | Global store vs feature state |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| Follow relationship state | read/write | social | profiles, notifications | — |
| Follow requests | read/write | social | profiles, settings, notifications | — |
| Actor privacy setting | read/write | social | profiles, feed | Feed must respect privacy |
| Follower count | derived | social | profiles | — |
| PrivateProfileNotice UI | read | social | profiles | Must go via adapter |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | No screens — all via adapter | — |
| Loading state | N/A | No screens | — |
| Empty state | N/A | No screens | — |
| Error state | FAIL | Error handling in hooks not confirmed | — |
| Auth/owner gates | PARTIAL | Controller checks actor | — |
| Cache behavior | FAIL | Not documented | Follower count re-fetched per render? |
| Runtime dependencies | PASS | Direct Supabase access | — |
| Hot paths | MEDIUM | Follow status checked on every profile view | — |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| `state/social/followRequestsStore.js` | Zustand store at global state level | MEDIUM — should be feature-local | SENTRY |
| `SubscribeDebugPanel` in production | Debug component exported from social | LOW | IRONMAN |
| `useSubscribeAction.js` in both request/ and subscribe/ | Both have a `useSubscribeAction` — naming overlap | MEDIUM | IRONMAN |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | N/A | N/A |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Follow status caching | HIGH | Checked on every profile view = repeated DB reads | KRAVEN |
| Logan documentation | HIGH | No canonical social graph docs | LOGAN |
| `useSubscribeAction` naming disambiguation | MEDIUM | Two hooks with same name in different sub-modules | IRONMAN |
| Global follow requests store review | MEDIUM | Should state be in feature vs global? | SENTRY |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- KRAVEN (performance: follow status caching)
- LOGAN (documentation)
- SENTRY (boundary: global store vs feature state)
- IRONMAN (ownership: duplicate hook naming)
