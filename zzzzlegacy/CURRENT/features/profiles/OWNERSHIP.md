# profiles — OWNERSHIP.md

**Source audit:** `CURRENT/features/dashboard/evidence/2026-05-22_ironman_profiles-feature-ownership.md`
**IRONMAN audit date:** 2026-05-22
**Overall status:** OWNERSHIP PARTIAL — core rendering and lifecycle clearly owned; post data reads, photo reactions, error state have conflicted or missing owners.

---

## Existing IRONMAN Records

- `vcsm.profiles.owner.md` — NOT FOUND. No ownership record exists for the profiles module.
- Status: MISSING — largest feature module in VCSM (416 files) has no canonical IRONMAN ownership record.

---

## Code Roots

| Path | Purpose |
|---|---|
| `apps/VCSM/src/features/profiles/` | Primary feature root |
| `apps/VCSM/src/features/profiles/kinds/vport/` | VPORT-type-specific sub-modules |
| `apps/VCSM/src/features/profiles/adapters/` | Cross-feature boundary surface |
| `apps/VCSM/src/features/profiles/screens/views/tabs/` | Tab views: friends, photos, posts, tags |

Entry files:
- `screens/ActorProfileScreen.jsx` — public profile entry
- `screens/UsernameProfileRedirect.jsx` — legacy redirect
- `kinds/vport/screens/VportProfileKindScreen.jsx` — VPORT profile entry

---

## Responsibility Classification

| Responsibility Type | Owner | Confidence | Notes |
|---|---|:---:|---|
| Feature ownership (profiles) | profiles | HIGH | Core responsibility |
| Engine ownership (@hydration consumer) | hydration engine | HIGH | Actor data via adapter |
| Engine ownership (@reviews consumer) | reviews engine | HIGH | Review panels via adapter |
| Engine ownership (@portfolio consumer) | portfolio engine | HIGH | Portfolio panel via adapter |
| DAL ownership (profiles) | profiles | HIGH | 72 DAL files |
| DAL ownership (post reads) | CONFLICTED | HIGH | profiles reads `vc.posts` directly — post feature should own |
| Controller ownership (profile resolution) | profiles | HIGH | 61 controller files |
| UI ownership (profile rendering) | profiles | HIGH | 132 component files |
| Runtime ownership (profile load) | profiles | HIGH | Entry point confirmed |
| Data ownership (vc.posts) | CONFLICTED | HIGH | profiles reads post data directly; post feature should own |
| Data ownership (vport.services) | profiles | HIGH | profiles writes services |
| Data ownership (vport.rates) | profiles | HIGH | profiles writes rates |
| Data ownership (vport.fuel_prices) | profiles | HIGH | profiles writes fuel prices |
| Rule ownership (photo reactions) | CONFLICTED | HIGH | Hook in profiles; RPCs belong to post/reactions domain |
| Security ownership (owner writes) | PARTIAL | MEDIUM | Some gates exist; inconsistent enforcement confirmed |
| Documentation ownership | MISSING | HIGH | No Logan doc; no vcsm.profiles.owner.md |
| Native parity ownership | N/A | HIGH | Source document declares N/A |

---

## Data Ownership Registry

| Object | Primary Owner | Read Consumers | Conflict | RLS Owner |
|---|---|---|---|---|
| `vc.posts` | post feature | profiles (direct DAL reads) | YES — CONFLICTED | UNKNOWN |
| `vc.post_media` | post feature | profiles (via fetchPostsForActor) | YES — CONFLICTED | UNKNOWN |
| `vc.post_mentions` | post feature | profiles (via fetchPostsForActor) | YES — CONFLICTED | UNKNOWN |
| `vc.actors` | identity | profiles (reads for kind/profile/slug) | NO | UNKNOWN |
| `vc.actor_follows` | social | profiles (reads for gate) | NO | UNKNOWN |
| `vc.actor_blocks` | block | profiles (reads for gate) | NO | UNKNOWN |
| `vc.actor_owners` | identity | profiles (reads for ownership check) | NO | UNKNOWN |
| `vport.profiles` | profiles | profiles (reads public details) | NO | UNKNOWN |
| `vport.services` | profiles | profiles | NO | UNKNOWN |
| `vport.rates` | profiles | profiles | NO | UNKNOWN |
| `vport.fuel_prices` | profiles | profiles | NO | UNKNOWN |
| `vport.menus / menu items` | profiles | profiles | NO | UNKNOWN |
| `vc.friend_ranks` | profiles | profiles | NO | UNKNOWN |
| `vc.actor_vibe_tags` | profiles | profiles (reads only) | NO | UNKNOWN |

---

## Rule Ownership Registry

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| Actor profile visibility (public) | profiles | Route + @hydration | MISSING | LOW |
| Profile privacy gate | profiles | Client (useProfileGate) + DB (RLS — unverified) | MISSING | HIGH |
| Block gate on profile view | profiles + block feature | Client (useProfileGate) + DB (RLS — unverified) | vcsm.block.owner.md | MEDIUM |
| VPORT owner write authorization | PARTIAL | Controller (inconsistent — upsertVportRate has check; upsertVportServices did not) | MISSING | HIGH (VF-002 now closed) |
| Photo reaction write (toggle/rose) | CONFLICTED | RPC (backend) | MISSING | MEDIUM |
| Post grid visibility (canViewContent) | profiles | Client gate only (insufficient) | MISSING | HIGH |
| Friend rank write | profiles | Controller (saveFriendRanks) | MISSING | LOW |
| Gas price suggestion approval | profiles | Controller (two-layer check) | MISSING | LOW |
| Menu content ownership | profiles | Controller (owner gate not confirmed) | MISSING | MEDIUM |
| VPORT content page ownership | profiles | Controller (readVportContentPage has ownership check in DAL — SENTRY violation) | MISSING | MEDIUM |

---

## Ownership Boundary Warnings

### OW-001 — Post data reads owned by profiles (HIGH)
`profiles/dal/post/fetchPostsForActor.dal.js` and `profiles/dal/readActorPosts.dal.js` read `vc.posts`, `vc.post_media`, and `vc.post_mentions` — tables belonging to the post feature domain. No `post.adapter` boundary exists. Post schema changes require updates in profiles DAL with no centralization.

### OW-002 — Photo reactions ownership conflict (HIGH)
`profiles/adapters/photos/photoReactions.adapter.js` and `profiles/screens/views/tabs/photos/hooks/usePhotoReactions.js` call RPCs (`togglePostReaction`, `sendPostRose`) that manipulate post reaction data owned by the post/reactions domain. No contract documents whether profiles or post feature owns this hook.

### OW-003 — checkActorOwnership pattern not canonical (MEDIUM)
`profiles/controller/checkActorOwnership.controller.js` is a hollow pass-through to DAL. The `assertActorOwnsVportActorController` pattern (used in `upsertVportRate.controller.js`) should be the canonical form. Long-term: ownership check should live in the identity engine or shared utility.

### OW-004
UNKNOWN — IRONMAN audit was partially read (80 lines). Additional boundary warnings may exist beyond OW-003 in the full audit file.
