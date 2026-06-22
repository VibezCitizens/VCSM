# VCSM — Universal Actor Social Graph Architecture

**Status:** IMPLEMENTATION IN PROGRESS — TICKET-SUB-009 through TICKET-SUB-011 complete. Pending: TICKET-SUB-013 (Settings UI), TICKET-SUB-015, TICKET-SUB-006, TICKET-SUB-008, deprecation.
**Date:** 2026-05-28 (updated)
**Scope:** VCSM
**Related docs:**
- `vcsm.social.subscribe-architecture.md` — current follow/subscriber system
- `vcsm.profiles.subscribe-pipeline.md` — runtime flow trace

---

## 1 Current System Review

### 1.1 Schema

| Table | Role | Key constraints |
|---|---|---|
| `vc.actor_follows` | Active follow edges (any actor → any actor). `is_active` bool. | PK: `(follower_actor_id, followed_actor_id)` — one edge per actor pair, never duplicated. No `updated_at`. |
| `vc.social_follow_requests` | Request state for private actors. | PK: `(requester_actor_id, target_actor_id)` — one request row per pair. State machine via `status` transitions. |
| `vc.actor_privacy_settings` | Single `is_private` boolean per actor. | PK: `actor_id`. |
| `vc.actor_social_settings` | Actor social settings — follow policy, account visibility, signal visibility, notification preferences. | PK: `actor_id`. FK: `vc.actors(id) ON DELETE CASCADE`. Owner-only RLS (3 citizen policies + 2 owner-delegation policies for VPORT actors via `actor_owners`). Backfilled 2026-05-28: 14 rows seeded. **LIVE.** |
| `vc.actors` | Actor registry. | Has `is_void` (Void Realm) and `is_deleted` (soft delete) — both must be excluded in any actor-scoped migration. |

### 1.2 Follow State Machine (current)

States from `FOLLOW_RELATION_STATES`:
- `NOT_FOLLOWING` — no active edge, no pending request
- `PENDING` — `social_follow_requests.status = 'pending'`
- `FOLLOWING` — `actor_follows.is_active = true`
- `BLOCKED` — bidirectional block active
- `UNKNOWN` — resolution error

Follow request status values confirmed on live DB: `pending`, `accepted`, `declined`, `cancelled`, `revoked`.

`revoked` is a post-acceptance state — a requester who was accepted can revoke their own follow after the fact (policy: `social_follow_requests_update_revoke_by_requester`). This transitions `accepted → revoked` and is separate from `cancelled` (cancelling a pending request). The `revoked` status does not currently invalidate the `actor_follows` edge in the same RPC — this is a known gap in the follow state machine.

### 1.3 Privacy Resolution Path (updated — TICKET-SUB-010/012 applied)

**Current live path:**
```
ctrlGetFollowRelationshipState
  → dalGetActorSocialPublicPolicy(targetActorId)     ← TICKET-SUB-012
    → vc.get_actor_social_public_policy RPC (SECURITY DEFINER)
    → returns { followPolicy, accountVisibility, allowBusinessFollowers }
    → missing actor: POLICY_CLOSED (followPolicy: 'approval_required')  ← fail-closed

actorPrivacy.dal.js (backward-compat wrapper)
  → dalGetActorSocialPublicPolicy(actorId)
  → maps followPolicy !== 'open' → { isPrivate: true }
```

`follow_policy = 'approval_required'` routes `ctrlSubscribe` through `ctrlSendFollowRequest`.
`follow_policy = 'closed'` short-circuits `ctrlSubscribe` with `throw new Error('Actor does not accept new followers')`.
`follow_policy = 'open'` inserts edge directly.

**Old path (no longer used for follow routing):**
```
ctrlGetActorPrivacy → actorPrivacy.dal.js (now a wrapper, still callable)
  → vc.actor_privacy_settings WHERE actor_id = :targetActorId
```

### 1.4 Visibility Surfaces (updated — TICKET-SUB-011 applied)

| Signal | Surface | Gate |
|---|---|---|
| VPORT subscriber count | `VportSubscribersView` header | `dalCanViewActorSignal('follower_count')` — LIVE. Defaults `public` → passes for anon. |
| VPORT subscriber list | `VportSubscribersView` tab | `dalCanViewActorSignal('follower_list')` — LIVE. Defaults `public` → passes for anon. TICKET-SUB-002 resolved. |
| Citizen follower count | Profile header | No UI gate yet — TICKET-SUB-013 |
| Citizen follower list | No UI exists | N/A |
| Citizen following list | No UI exists | N/A |
| Follow button | Any auth actor except self | Routes via `follow_policy` (`open` / `approval_required` / `closed`) |

### 1.5 DAL Files Reading Privacy

| File | Reads | Missing-row default | Used by |
|---|---|---|---|
| `social/privacy/dal/actorPrivacy.dal.js` | `is_private` | `true` (fail-closed) | Follow gate, profile gate |
| `settings/privacy/dal/visibility.dal.js` | `is_private` | `false` (fail-open) | Settings write path |

---

## 2 Problems In Current Model

### 2.1 `is_private` is too coarse

A single boolean collapses three independent decisions into one:
1. Can the profile be found? (account visibility)
2. Who can follow? (follow policy)
3. Who can see counts and lists? (signal visibility)

If a VPORT wants open follows but a hidden subscriber list, the current model cannot express it. Any change to `is_private` changes all three behaviors simultaneously.

### 2.2 No `follow_policy` concept

`is_private = true` forces approval-required follows, but "approval required" is a relationship policy, not an account visibility mode. A profile can be public (findable, viewable) but still require follow approval. These are orthogonal.

### 2.3 No per-signal visibility

Follower count, follower list, and following list each have different disclosure sensitivities. A business VPORT wants its subscriber count public (social proof) but its following list private (competitive intelligence). A Citizen may want neither list public. Neither can be expressed.

### 2.4 Two diverging DAL paths for the same table

`actorPrivacy.dal.js` (fail-closed) and `visibility.dal.js` (fail-open) read the same field from the same table and return opposite values for a missing row. Both have active callers. They will diverge in behavior after any schema change.

### 2.5 No `allow_business_followers` signal

There is no way to distinguish "only Citizens can follow me" from "anyone can follow me." This matters for VPORTs that may not want to be followed by other VPORTs, or Citizens who want to block cold-follow from business accounts.

### 2.6 VPORT subscriber list has no privacy gate (TICKET-SUB-002)

`getSubscribersController` performs a public read with no visibility check. A private VPORT's subscriber list is readable via direct REST even though the profile is private. TICKET-SUB-002 cannot be resolved cleanly without a visibility model.

### 2.7 SECURITY DEFINER RPCs bypass RLS

`count_vport_subscribers` and `list_vport_subscribers` are SECURITY DEFINER. All privacy enforcement is app-layer only. If the app-layer gate is absent (as in TICKET-SUB-002), the RLS layer provides no backup.

### 2.8 `allow_follow_notifications` not expressible

There is no per-actor setting to silence follow notifications. An actor with a public profile and open follows has no way to mute the notification stream from high-volume follows.

---

## 3 Recommended Universal Visibility Model

### 3.1 Core Principle: Three Orthogonal Dimensions

The follow/visibility system governs three independent concerns. They must not be collapsed:

```
1. Account Visibility  — can this actor's profile be discovered and viewed?
2. Follow Policy       — who may follow this actor, and under what terms?
3. Signal Visibility   — which counts and lists are visible to whom?
```

### 3.2 Viewer Resolution

Before any signal is served, the viewer's relationship to the target actor is resolved:

```
viewer_tier:
  OWNER    — viewer is the actor (assertingActorId === targetActorId)
  FOLLOWER — viewer has an active follow edge to target
  AUTH     — viewer is authenticated but not a follower
  ANON     — unauthenticated request
```

Visibility fields use these tier labels as their minimum-required tier.

### 3.3 Signal Visibility Levels

Each count/list signal has a `visibility` field with four levels:

| Value | Visible to |
|---|---|
| `public` | Everyone including anon |
| `followers` | Followers + owner |
| `owner` | Owner only |
| `hidden` | Nobody (including owner via API) |

### 3.4 Account Visibility Modes

| Value | Meaning |
|---|---|
| `public` | Profile is findable via search/explore and directly viewable |
| `private` | Profile is findable but content requires follow approval to view |
| `unlisted` | Profile is directly viewable but not discoverable via search/explore |

### 3.5 Follow Policy Modes

| Value | Meaning |
|---|---|
| `open` | Any actor can follow immediately — edge inserted, no request needed |
| `approval_required` | Follow edge requires target's approval — routes through `social_follow_requests` |
| `closed` | No new followers accepted — follow action is rejected at controller layer |

`follow_policy` is independent of `account_visibility`. A `public` account can be `approval_required`. An `unlisted` account can be `open`.

---

## 4 Recommended DB Schema

```sql
CREATE TABLE vc.actor_social_settings (
  actor_id                   uuid        PRIMARY KEY
                                         REFERENCES vc.actors(id) ON DELETE CASCADE,
  account_visibility         text        NOT NULL DEFAULT 'public'
    CHECK (account_visibility IN ('public', 'private', 'unlisted')),
  follow_policy              text        NOT NULL DEFAULT 'approval_required'
    CHECK (follow_policy IN ('open', 'approval_required', 'closed')),
  follower_count_visibility  text        NOT NULL DEFAULT 'owner'
    CHECK (follower_count_visibility IN ('public', 'followers', 'owner', 'hidden')),
  follower_list_visibility   text        NOT NULL DEFAULT 'owner'
    CHECK (follower_list_visibility IN ('public', 'followers', 'owner', 'hidden')),
  following_list_visibility  text        NOT NULL DEFAULT 'owner'
    CHECK (following_list_visibility IN ('public', 'followers', 'owner', 'hidden')),
  allow_business_followers   bool        NOT NULL DEFAULT true,
  allow_follow_notifications bool        NOT NULL DEFAULT true,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

-- auto-update updated_at
-- vc.tg_set_updated_at confirmed on live DB (2026-05-28)
CREATE TRIGGER trg_actor_social_settings_updated_at
  BEFORE UPDATE ON vc.actor_social_settings
  FOR EACH ROW EXECUTE FUNCTION vc.tg_set_updated_at();
```

This table is the single source of truth for all follow/visibility policy. `vc.actor_privacy_settings.is_private` becomes a derived field; the column is preserved for backward compatibility during migration only.

---

## 5 Actor-Type Defaults

Defaults are applied at row-insert time (backfill + trigger) based on `vc.actors.kind`.

### 5.1 Citizen (`kind = 'user'`)

| Field | Default | Reason |
|---|---|---|
| `account_visibility` | `'public'` | Profiles are discoverable |
| `follow_policy` | `'approval_required'` | Citizens control their social graph — aligns with Instagram personal account model |
| `follower_count_visibility` | `'owner'` | Follower count is private until Citizens have a public social product |
| `follower_list_visibility` | `'owner'` | Social graph is private by default |
| `following_list_visibility` | `'owner'` | Following list is private by default |
| `allow_business_followers` | `true` | VPORTs may follow Citizens (product decision 2026-05-27) |
| `allow_follow_notifications` | `true` | Notifications on by default |

### 5.2 VPORT (`kind = 'vport'`)

| Field | Default | Reason |
|---|---|---|
| `account_visibility` | `'public'` | Business profiles must be discoverable |
| `follow_policy` | `'open'` | Subscriber growth must be frictionless — follow = subscribe for business |
| `follower_count_visibility` | `'public'` | Subscriber count is a public trust signal (IRONMAN decision 2026-05-27) |
| `follower_list_visibility` | `'public'` | Subscriber list is visible on public VPORT profiles |
| `following_list_visibility` | `'owner'` | VPORT's outgoing follows are private (competitive intelligence) |
| `allow_business_followers` | `true` | B2B follow graph is permitted |
| `allow_follow_notifications` | `true` | Notifications on by default |

---

## 6 Visibility Rules Matrix

For each signal, whether the viewer may see it:

### 6.1 Follower Count

| `follower_count_visibility` | OWNER | FOLLOWER | AUTH | ANON |
|---|---|---|---|---|
| `public` | ✓ | ✓ | ✓ | ✓ |
| `followers` | ✓ | ✓ | ✗ | ✗ |
| `owner` | ✓ | ✗ | ✗ | ✗ |
| `hidden` | ✗ | ✗ | ✗ | ✗ |

### 6.2 Follower List

| `follower_list_visibility` | OWNER | FOLLOWER | AUTH | ANON |
|---|---|---|---|---|
| `public` | ✓ | ✓ | ✓ | ✓ |
| `followers` | ✓ | ✓ | ✗ | ✗ |
| `owner` | ✓ | ✗ | ✗ | ✗ |
| `hidden` | ✗ | ✗ | ✗ | ✗ |

### 6.3 Following List

| `following_list_visibility` | OWNER | FOLLOWER | AUTH | ANON |
|---|---|---|---|---|
| `public` | ✓ | ✓ | ✓ | ✓ |
| `followers` | ✓ | ✓ | ✗ | ✗ |
| `owner` | ✓ | ✗ | ✗ | ✗ |
| `hidden` | ✗ | ✗ | ✗ | ✗ |

### 6.4 Follow Button / Action

| `follow_policy` | Visible | Behavior |
|---|---|---|
| `open` | Yes | Immediate follow insert |
| `approval_required` | Yes | Routes to follow request |
| `closed` | No (or disabled) | Action rejected at controller |

### 6.5 `account_visibility` Gate (applied before all signals)

| `account_visibility` | Discoverable via search | Profile viewable | Signals visible per matrix |
|---|---|---|---|
| `public` | Yes | Yes | Per matrix |
| `private` | Yes | Only if follower or owner | Only if follower or owner |
| `unlisted` | No | Yes (direct URL) | Per matrix |

When `account_visibility = 'private'` and viewer is not a follower or owner, all signals are hidden regardless of individual visibility settings.

---

## 7 RPC Architecture

### 7.1 Existing RPCs — Preserved

| RPC | Caller | Change |
|---|---|---|
| `count_vport_subscribers(p_actor_id)` | `subscribersCount.dal.js` | Preserve as-is — VPORT public trust signal, visibility guard already in RPC body |
| `list_vport_subscribers(p_actor_id, p_limit, p_offset)` | `subscribersList.dal.js` | Preserve as-is — same rationale |
| `get_follower_count(p_actor_id)` | `subscriberCount.dal.js` | Preserve — rename pending TICKET-SUB-006 |

The VPORT RPCs enforce visibility at the RPC layer via the `vport.profiles` EXISTS guard. They return `0` / `[]` for non-VPORT or inactive VPORTs. This is the correct behavior and does not change.

### 7.2 New RPC — `get_actor_social_settings`

Purpose: server-side access to actor social settings, including defaults for missing rows.

```sql
CREATE OR REPLACE FUNCTION vc.get_actor_social_settings(p_actor_id uuid)
RETURNS TABLE (
  actor_id                   uuid,
  account_visibility         text,
  follow_policy              text,
  follower_count_visibility  text,
  follower_list_visibility   text,
  following_list_visibility  text,
  allow_business_followers   bool,
  allow_follow_notifications bool
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'vc', 'public'
AS $$
  SELECT
    p_actor_id,
    COALESCE(s.account_visibility,
      CASE a.kind WHEN 'vport' THEN 'public' ELSE 'public' END),
    COALESCE(s.follow_policy,
      CASE a.kind WHEN 'vport' THEN 'open' ELSE 'approval_required' END),
    COALESCE(s.follower_count_visibility,
      CASE a.kind WHEN 'vport' THEN 'public' ELSE 'owner' END),
    COALESCE(s.follower_list_visibility,
      CASE a.kind WHEN 'vport' THEN 'public' ELSE 'owner' END),
    COALESCE(s.following_list_visibility, 'owner'),
    COALESCE(s.allow_business_followers, true),
    COALESCE(s.allow_follow_notifications, true)
  FROM vc.actors a
  LEFT JOIN vc.actor_social_settings s ON s.actor_id = a.id
  WHERE a.id = p_actor_id;
$$;
GRANT EXECUTE ON FUNCTION vc.get_actor_social_settings(uuid) TO authenticated;
```

This RPC is used only from server-side controllers and DAL — never called directly from client-side code.

### 7.3 Visibility Check — App Layer Only

Visibility policy resolution (which viewer tier can see which signal) stays at the controller layer. RPCs return raw data; controllers apply `viewerTier >= requiredTier` logic before returning to hooks.

This is intentional: viewer tier requires session context (assertingActorId) which RPCs should not embed in their SECURITY DEFINER body.

---

## 8 RLS / Security Design

### 8.1 `vc.actor_social_settings` — Proposed Policies

| Policy | Command | Using | With Check |
|---|---|---|---|
| `social_settings_select` | SELECT | `true` — any authenticated actor can read settings | — |
| `social_settings_insert_own` | INSERT | — | `actor_id = auth.uid()` |
| `social_settings_update_own` | UPDATE | `actor_id = auth.uid()` | `actor_id = auth.uid()` |

**VPORT caveat:** A VPORT's `actor_id` is not the same as the session user's UID. VPORT settings updates must go through a server-side controller that verifies ownership via `actor_owners` before issuing an update. Direct REST UPDATE from the client for VPORTs will fail the RLS check — this is the desired behavior.

### 8.2 Why SELECT is Open

Privacy enforcement is intentionally app-layer. The settings row itself (e.g., "my follow_policy is open") is not sensitive. What is sensitive is the *data it gates* (the subscriber list). Restricting SELECT to owner would prevent the controller from loading settings for visibility evaluation — it needs the target actor's settings to decide what the viewer can see.

### 8.3 `vc.actor_privacy_settings` — Migration Transition

During migration, `actor_privacy_settings.is_private` is preserved and synchronized via application logic (no DB-level sync needed). After full migration is verified, the column is deprecated (not dropped — backward compat).

---

## 9 Enumeration Protection Strategy

### 9.1 Threats

- **Graph traversal**: iterating follower lists to map the social graph
- **Count scraping**: polling follower counts on many actors for competitive analysis
- **Private actor discovery**: using follow requests to probe whether a private actor exists

### 9.2 Mitigations

| Threat | Mitigation |
|---|---|
| Graph traversal | `follower_list_visibility` defaults to `owner` for Citizens. Even with `public` setting, lists are paginated server-side with a hard cap (current: `LEAST(p_limit, 50)`) |
| Count scraping | `follower_count_visibility` defaults to `owner` for Citizens. Rate limiting at API gateway level (out of scope for this architecture) |
| Private actor discovery via follow request | `ctrlSendFollowRequest` must return a generic "request sent" response regardless of whether the actor exists — do not distinguish "actor not found" from "request sent" |
| UUID exposure | All list outputs return slug/username/handle only — never raw `actor_id` in public-facing list items |
| `unlisted` account enumeration | `unlisted` actors excluded from search/explore DB queries — requires search index filter, not covered by this table alone |

### 9.3 Pagination Hard Cap

The existing VPORT RPCs already use:
```sql
LIMIT greatest(p_limit, 0) OFFSET greatest(p_offset, 0)
```

Future list RPCs must enforce a server-side cap:
```sql
LIMIT LEAST(p_limit, 50) OFFSET GREATEST(p_offset, 0)
```

The `greatest(p_limit, 0)` pattern in the current VPORT RPCs does not cap the upper bound — this is a known gap that should be fixed in the next RPC revision (TICKET-SUB-001 scope).

---

## 10 Notification / Routing Strategy

### 10.1 Current State (post TICKET-SUB-003 / TICKET-SUB-004)

- `notification.model.js` uses `sender.route` (handle-based: `/profile/${username}` or `/profile/${slug}`)
- `FollowNotificationItem` navigates to `sender.route`, not `linkPath`
- `linkPath` for follow events is `/feed` — intentionally generic

These fixes are already applied and must be preserved.

### 10.2 New `allow_follow_notifications` Signal

When `allow_follow_notifications = false` on the followed actor:
- `publishVcsmNotification` must be suppressed for `kind = 'follow'` and `kind = 'follow_request'`
- This check fires in `ctrlSubscribe` before calling `publishVcsmNotification`
- It requires reading `actor_social_settings` for the `followedActorId`

Pattern in `ctrlSubscribe`:
```js
const settings = await dalGetActorSocialSettings(followedActorId)
if (settings.allowFollowNotifications) {
  publishVcsmNotification({ ... })
}
```

### 10.3 `follow_policy = 'closed'` — Controller Response

When a target actor's `follow_policy = 'closed'`, `ctrlSubscribe` must return:
```js
{
  ok: false,
  mode: 'closed',
  status: 'closed',
  isFollowing: false,
  decision: { route: 'follow_policy_closed' },
}
```

The UI must render a disabled follow button (not an error state). The label should say something like "Follows closed" or hide the button entirely.

---

## 11 Migration Strategy

### Phase 0 — Schema (TICKET-SUB-009)

Create `vc.actor_social_settings` with all columns, constraints, trigger, and RLS policies.
Create `vc.get_actor_social_settings` RPC.

No application code changes. Zero risk.

### Phase 1 — Backfill Defaults (TICKET-SUB-009, same migration)

**Critical:** backfill must preserve current `is_private` behavior for existing actors. Seeding kind-based defaults (e.g., `approval_required` for all user-kind actors) would silently change Citizen→Citizen follows from direct-insert to request-flow for all actors currently set to `is_private = false`. All 17 current actors have `is_private = false` — seeding `approval_required` would break the entire follow graph.

Backfill rule:
- VPORT kind → `open` (VPORT default, confirmed by product decision)
- user kind, `is_private = true` → `approval_required` (preserve their explicit privacy choice)
- user kind, `is_private = false` or no row → `open` (preserve current open-follow behavior)
- `approval_required` as user default applies only to newly created Citizen accounts going forward (enforced in the new-account creation path, not here)

```sql
INSERT INTO vc.actor_social_settings (
  actor_id,
  follow_policy,
  follower_count_visibility,
  follower_list_visibility
)
SELECT
  a.id,
  CASE
    WHEN a.kind = 'vport'          THEN 'open'
    WHEN p.is_private = true       THEN 'approval_required'
    ELSE                                'open'   -- preserve is_private = false state
  END,
  CASE a.kind WHEN 'vport' THEN 'public' ELSE 'owner' END,
  CASE a.kind WHEN 'vport' THEN 'public' ELSE 'owner' END
FROM vc.actors a
LEFT JOIN vc.actor_privacy_settings p ON p.actor_id = a.id
WHERE a.is_void    = false   -- exclude void actors (Void Realm accounts)
  AND a.is_deleted = false   -- exclude soft-deleted actors
ON CONFLICT (actor_id) DO NOTHING;
```

**Why exclude void and deleted actors:** `vc.actors` has `is_void` (Void Realm actor) and `is_deleted` (soft delete). Seeding settings rows for these actors wastes storage, could surface via future RLS changes, and creates noise in any settings audit. Only active, real actors need social settings rows.

### Phase 2 — New DAL (TICKET-SUB-012)

Create `actorSocialSettings.dal.js`:
- `dalGetActorSocialSettings(actorId)` — TTL cache 30s, fail-closed to kind defaults
- `dalUpdateActorSocialSettings({ actorId, assertingActorId, patch })` — ownership-verified
- Thin wrapper in `actorPrivacy.dal.js`: reads `follow_policy` from new table, maps to `{ isPrivate: follow_policy === 'approval_required' }` for backward-compat callers

Build order: DAL only, no controller changes yet.

### Phase 3 — Controller Migration (TICKET-SUB-010)

Update `ctrlGetFollowRelationshipState`:
- Replace `ctrlGetActorPrivacy` call with `dalGetActorSocialSettings`
- `relation.isPrivate` becomes derived from `follow_policy !== 'open'`
- Add `follow_policy = 'closed'` short-circuit in `ctrlSubscribe`

Update `getSubscribersController` (resolves TICKET-SUB-002):
- Load `dalGetActorSocialSettings(actorId)` for the target
- Resolve viewer tier (owner / follower / auth / anon)
- Apply visibility matrix before returning count/list

### Phase 4 — Settings UI (TICKET-SUB-013)

Expose new fields in Privacy Settings screen.
Privacy toggle maps to `follow_policy` (approval_required ↔ open), not `is_private`.

### Phase 5 — Deprecation (TICKET-SUB-014, deferred)

After Phase 4 is verified in production:
- `actor_privacy_settings.is_private` is no longer written to
- The column is left in place (no DROP) for backward compatibility
- `actorPrivacy.dal.js` is removed after all callers are migrated to `actorSocialSettings.dal.js`

---

## 12 Backward Compatibility Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Backfill seeds wrong `follow_policy` if kind-defaults are used** — all 17 live actors have `is_private = false`. Seeding `approval_required` for all user-kind actors would convert all Citizen→Citizen follows from `public_follow` to `request` route silently | CRITICAL | Backfill reads `actor_privacy_settings.is_private`: `is_private = true` → `approval_required`, otherwise → `open`. `approval_required` as Citizen default applies only to new account creation, not existing actors. See Phase 1 backfill SQL. |
| `actorPrivacy.dal.js` reads `is_private` — any migration that stops writing `is_private` will break the follow gate | HIGH | Keep writing `is_private` via `actor_privacy_settings` in parallel during Phase 2–3. Deprecate only after Phase 4 verified. |
| `ctrlGetFollowRelationshipState` derives `isPrivate` from `actorPrivacy.dal.js` — if `actorPrivacy.dal.js` is updated before the controller, intermediate state may be inconsistent | MEDIUM | Phase 2 adds new DAL; Phase 3 migrates controller. Never cut over DAL and controller in the same deploy. |
| `visibility.dal.js` writes `is_private` — settings screen still uses it | MEDIUM | Settings UI migration (Phase 4) migrates the write path. Until then, `visibility.dal.js` continues writing `is_private` unchanged. |
| VPORT RPCs already public — `follower_count_visibility = 'public'` default matches current behavior | LOW — no regression | Default matches current live behavior. Backfill will not change VPORT behavior. |
| Feed follow cache invalidation pattern unchanged | NONE | `invalidateFeedFollowCache` fires on follow insert regardless of policy. No change needed. |
| Notification routing already fixed (TICKET-SUB-003/004) | NONE | Preserved as-is. |

---

## 13 Required Code Changes

### 13.1 New Files

| File | Purpose |
|---|---|
| `features/social/privacy/dal/actorSocialSettings.dal.js` | Universal settings DAL — TTL cache, kind-defaulted, write-path with ownership |
| `features/social/privacy/model/actorSocialSettings.model.js` | Type constants (`FOLLOW_POLICY`, `VISIBILITY_LEVELS`, `ACCOUNT_VISIBILITY`) and viewer tier resolver |

### 13.2 Modified Files

| File | Change |
|---|---|
| `features/social/privacy/dal/actorPrivacy.dal.js` | Thin wrapper — reads `follow_policy` from `actorSocialSettings.dal.js`, maps to `{ isPrivate }` |
| `features/social/friend/subscribe/controllers/getFollowRelationshipState.controller.js` | Use `actorSocialSettings.dal.js` → `follow_policy` instead of `actorPrivacy.dal.js` → `is_private` |
| `features/social/friend/subscribe/controllers/follow.controller.js` | Add `follow_policy = 'closed'` guard after ownership/block checks; suppress notification if `!allowFollowNotifications` |
| `features/profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js` | Apply viewer-tier visibility gate using `actorSocialSettings` before returning count/list |
| `features/settings/privacy/dal/visibility.dal.js` | Migrate writes to `actor_social_settings`; keep `actor_privacy_settings` write for transition period |
| `features/settings/privacy/screens/PrivacySettingsScreen.jsx` | Expose `follow_policy`, `follower_count_visibility`, `follower_list_visibility` controls |

### 13.3 No Changes Required

| File | Reason |
|---|---|
| `features/social/friend/subscribe/controllers/unsubscribe.controller.js` | Ownership gate is correct. Unsubscribe is always permitted. |
| `features/social/friend/request/controllers/followRequests.controller.js` | Accept/decline/cancel gates are correct. Policy routing is upstream in `ctrlSubscribe`. |
| `features/profiles/kinds/vport/dal/subscribersCount.dal.js` | VPORT RPC is correct. Visibility now gated at controller layer. |
| `features/profiles/kinds/vport/dal/subscribersList.dal.js` | Same. |
| `features/notifications/inbox/model/notification.model.js` | Fixed in TICKET-SUB-003. No change needed. |
| `features/notifications/types/follow/FollowNotificationItem.view.jsx` | Fixed in TICKET-SUB-004. No change needed. |

---

## 14 Required DB Changes

### 14.1 New Objects

| Object | Migration |
|---|---|
| `vc.actor_social_settings` table | New migration — TICKET-SUB-009 |
| `trg_actor_social_settings_updated_at` trigger | Same migration |
| `vc.get_actor_social_settings(uuid)` RPC | Same migration |
| RLS policies (3 policies) | Same migration |
| Backfill INSERT for all current actors | Same migration |

### 14.2 No Schema Drops

| Object | Status |
|---|---|
| `vc.actor_privacy_settings` | Preserved — deprecated after Phase 4 |
| `vc.actor_privacy_settings.is_private` | Preserved — written to during transition |
| `vc.count_vport_subscribers` | Preserved — correct behavior |
| `vc.list_vport_subscribers` | Preserved — correct behavior |
| `vc.get_follower_count` | Preserved — TICKET-SUB-006 renames DAL export, not RPC |

### 14.3 Future Drop (deferred, TICKET-SUB-014)

After Phase 4 verified in production:
```sql
-- deprecate the is_private write path
ALTER TABLE vc.actor_privacy_settings
  ALTER COLUMN is_private SET DEFAULT NULL;
-- drop only after zero active writes confirmed in logs
```

No `DROP TABLE` until `actor_privacy_settings` has zero writers.

---

## 15 Required Tests

### 15.1 Controller Tests

| Test | File |
|---|---|
| `ctrlSubscribe` → `follow_policy: 'open'` → inserts edge immediately | `follow.controller.test.js` |
| `ctrlSubscribe` → `follow_policy: 'approval_required'` → routes to request | `follow.controller.test.js` |
| `ctrlSubscribe` → `follow_policy: 'closed'` → returns `ok: false, mode: 'closed'` | `follow.controller.test.js` |
| `ctrlSubscribe` → `allow_follow_notifications: false` → notification NOT published | `follow.controller.test.js` |
| `getSubscribersController` → VPORT with `follower_count_visibility: 'public'` → viewer anon → returns count | `getSubscribers.controller.test.js` |
| `getSubscribersController` → VPORT with `follower_list_visibility: 'owner'` → viewer not owner → returns `[]` | `getSubscribers.controller.test.js` |
| `getSubscribersController` → `account_visibility: 'private'` → viewer not follower → returns count `0` and `[]` | `getSubscribers.controller.test.js` |
| `getSubscribersController` → `account_visibility: 'private'` → viewer is owner → returns full data | `getSubscribers.controller.test.js` |

### 15.2 DAL Tests

| Test | File |
|---|---|
| `dalGetActorSocialSettings` → row exists → returns values | `actorSocialSettings.dal.test.js` |
| `dalGetActorSocialSettings` → no row → returns kind-correct defaults | `actorSocialSettings.dal.test.js` |
| `dalGetActorSocialSettings` → cache hit → no second DB call | `actorSocialSettings.dal.test.js` |
| `actorPrivacy.dal.js` wrapper → `follow_policy: 'open'` → returns `{ isPrivate: false }` | `actorPrivacy.dal.test.js` |
| `actorPrivacy.dal.js` wrapper → `follow_policy: 'approval_required'` → returns `{ isPrivate: true }` | `actorPrivacy.dal.test.js` |

### 15.3 Model Tests

| Test | File |
|---|---|
| `resolveViewerTier` → `viewerId === targetId` → `OWNER` | `actorSocialSettings.model.test.js` |
| `resolveViewerTier` → active follow edge → `FOLLOWER` | `actorSocialSettings.model.test.js` |
| `resolveViewerTier` → authenticated, no edge → `AUTH` | `actorSocialSettings.model.test.js` |
| `resolveViewerTier` → no session → `ANON` | `actorSocialSettings.model.test.js` |
| `canViewSignal('follower_list_visibility', 'owner', 'AUTH')` → false | `actorSocialSettings.model.test.js` |
| `canViewSignal('follower_count_visibility', 'public', 'ANON')` → true | `actorSocialSettings.model.test.js` |

---

## 16 Recommended Tickets

| Ticket | Title | Severity | Blocks |
|---|---|---|---|
| TICKET-SUB-009 | Create `vc.actor_social_settings` table, RLS, RPC, and backfill | HIGH | TICKET-SUB-010, TICKET-SUB-012 |
| TICKET-SUB-010 | Migrate `ctrlGetFollowRelationshipState` to use `follow_policy` | HIGH | TICKET-SUB-002 resolution |
| TICKET-SUB-011 | Resolve TICKET-SUB-002 via visibility gate in `getSubscribersController` | HIGH | Depends on TICKET-SUB-012 |
| TICKET-SUB-012 | Create `actorSocialSettings.dal.js` + `actorPrivacy.dal.js` wrapper | HIGH | TICKET-SUB-010, TICKET-SUB-011 |
| TICKET-SUB-013 | Expose new visibility fields in Privacy Settings UI | MEDIUM | Depends on TICKET-SUB-012 |
| TICKET-SUB-007 | Unify missing-row defaults — resolved by this system (both files read new table) | LOW | Closed by TICKET-SUB-012 |
| TICKET-SUB-014 | Deprecate `actor_privacy_settings.is_private` write path | LOW | Depends on TICKET-SUB-013 in production |
| TICKET-SUB-015 | Fix VPORT RPC hard-cap: `LEAST(p_limit, 50)` instead of `greatest(p_limit, 0)` | LOW | Standalone |

### Execution Order

```
TICKET-SUB-009 (schema)
    ↓
TICKET-SUB-012 (DAL)
    ↓
TICKET-SUB-010 (controller — follow gate migration)
TICKET-SUB-011 (controller — subscriber visibility gate)
    ↓
TICKET-SUB-013 (UI)
    ↓
TICKET-SUB-014 (deprecation — deferred)
```

TICKET-SUB-015 is independent and can run at any time.

---

## Audit References

Document Scope: VCSM
Application Scope Label: VCSM
Migration Required: YES — TICKET-SUB-009
DB Review Required: YES — new table, RLS, RPC
VENOM Review Required: YES — new visibility enforcement surface

---

## Change Log

### 2026-05-27 — Initial Draft

Initial draft. Universal actor social graph architecture.
Current system review, problems analysis, three-dimensional visibility model, schema design, actor-type defaults, visibility matrix, RPC architecture, RLS design, enumeration protection, notification strategy, migration phases, backward compat risks, code/DB/test requirements, recommended tickets.
Status: DRAFT — awaiting architecture approval before any code is patched.

### 2026-05-27 — RLS Correction Applied

Universal actor graph direction approved. RLS model corrected: broad `SELECT true` replaced with owner-only table access. Controlled visibility RPCs designed. Migration strategy, DB changes, code changes, tests, and ticket plan updated accordingly. See §17 below.

### 2026-05-28 — Pre-Migration DB Verification Pass (Round 1)

Live DB snapshot confirmed: `vc.actor_social_settings` does not exist (clean migration target). 17 actors live (8 user, 9 vport). All 17 have `is_private = false`. Follow edges: user→user 1, user→vport 3, vport→vport 6 active. All existing RPCs granted to PUBLIC. Live subscribe trace confirmed current pipeline working.

Corrections applied:
1. Backfill SQL corrected — derives `follow_policy` from `actor_privacy_settings.is_private` rather than kind defaults, to prevent silent behavior change on existing actors. CRITICAL risk added to backward compatibility table.
2. New RPC GRANTs confirmed `TO authenticated` only — anon access is not permitted. Public VPORT subscriber data is served via the dedicated subscriber RPCs (`count_vport_subscribers`, `list_vport_subscribers`) which are GRANT PUBLIC. Policy/signal RPCs are authenticated only.
3. `vc.can_view_actor` existing DB helper noted in design decisions.
4. `actor_follows` FORCE ROW LEVEL SECURITY noted — SECURITY DEFINER bypass confirmed working via existing RPCs.

### 2026-05-28 — Pre-Migration Trigger Verification

Confirmed live trigger function name: `vc.tg_set_updated_at` (not `vc.set_updated_at`). Migration file and architecture doc corrected.

### 2026-05-28 — Pre-Migration DB Verification Pass (Round 2 — Full Schema)

Full `vc` and `vport` schema dump received and analyzed.

Corrections applied:
1. Backfill SQL — added `WHERE a.is_void = false AND a.is_deleted = false` to exclude void (Void Realm) and soft-deleted actors. Without this filter, seeded rows are created for actors that will never use them.
2. Phase 0a — added pre-flight check instruction for `updated_at` trigger function name verification before migration.
3. §1.1 schema table — added key constraint notes (`actor_follows` composite PK, `actor_follows` no `updated_at`, `actors` void/deleted flags).
4. §1.2 follow state machine — added `revoked` status documentation (accepted → revoked transition via requester policy). Noted gap: `revoked` does not currently deactivate the `actor_follows` edge.
5. `social_follow_requests` composite PK confirmed: one request row per actor pair at a time — state machine via status transitions.

---

---

# Universal Actor Social Graph Architecture — RLS Correction

---

## Decision

**State: APPROVED WITH RLS CHANGE.**

| Component | Status |
|---|---|
| Universal actor graph direction | APPROVED |
| `vc.actor_social_settings` table schema | APPROVED |
| Three-dimensional visibility model (account / follow-policy / signal) | APPROVED |
| Actor-type defaults (Citizen / VPORT) | APPROVED |
| Visibility rules matrix | APPROVED |
| Migration strategy phases | APPROVED — updated below |
| `social_settings_select SELECT true` (broad read) | REJECTED — replaced with owner-only RLS |
| Controlled visibility decision RPCs | APPROVED — new additions |

---

## What Changed From Draft

### The Rejected Policy

The draft §8 proposed:

```
social_settings_select  SELECT  true  — any authenticated actor can read settings
```

**Why this was wrong:**

`vc.actor_social_settings` contains actor preference and security data: `follow_policy`, `account_visibility`, `follower_count_visibility`, `follower_list_visibility`, `following_list_visibility`, `allow_business_followers`, `allow_follow_notifications`. These are not public signals — they are the configuration behind signals.

Allowing any authenticated actor to SELECT any other actor's full settings row would:

1. Expose whether an actor has set `follow_policy = 'closed'` — leaking deliberate exclusion decisions
2. Expose whether an actor has `allow_business_followers = false` — leaking commercial relationship preferences
3. Expose `allow_follow_notifications = false` — leaking behavioral signals not intended for others
4. Create a graph-scraping surface: iterate actor IDs, harvest `account_visibility` for all actors at once
5. Contradict ARCHITECTURE.md §8: "Security lives in RLS" — broad SELECT on preference tables is an RLS regression, not a feature

The justification given in the draft was: "visibility enforcement is app-layer; the settings row itself is not sensitive." This reasoning fails because it assumes app-layer gates will never be bypassed via direct REST. RLS is the safety net. A table with `SELECT true` has no RLS safety net at all.

### The Correct Model

```
Table: vc.actor_social_settings  →  owner-only access
Public visibility decisions       →  dedicated controlled RPCs
```

Relationship existence (`vc.actor_follows`) remains actor-global — any actor can follow any actor.

Visibility of what those relationships expose is enforced through RPCs that emit only the decision (boolean / enum), never the raw configuration row.

This preserves three guarantees:
- An actor's settings are private unless they choose otherwise
- Public visibility signals (VPORT subscriber count) remain accessible through safe dedicated RPCs
- Citizen social graph privacy is protected at the DB layer, not just app layer

---

## Corrected RLS Model

### Table Policies — `vc.actor_social_settings`

```sql
-- Enable RLS
ALTER TABLE vc.actor_social_settings ENABLE ROW LEVEL SECURITY;

-- SELECT: owner only
CREATE POLICY social_settings_select_own
  ON vc.actor_social_settings
  FOR SELECT
  USING (actor_id = auth.uid());

-- INSERT: owner only
CREATE POLICY social_settings_insert_own
  ON vc.actor_social_settings
  FOR INSERT
  WITH CHECK (actor_id = auth.uid());

-- UPDATE: owner only
CREATE POLICY social_settings_update_own
  ON vc.actor_social_settings
  FOR UPDATE
  USING (actor_id = auth.uid())
  WITH CHECK (actor_id = auth.uid());
```

No DELETE policy. Rows are never deleted directly — they follow `vc.actors ON DELETE CASCADE`.

### Why SELECT is Owner-Only

A session user's `auth.uid()` matches their own `actor_id` in `vc.actors` (for `kind = 'user'`). The SELECT policy allows the actor to read their own settings. No actor can read another actor's raw settings row via direct REST.

All cross-actor visibility decisions go through controlled RPCs (see below).

### VPORT Ownership Caveat

A VPORT actor's `actor_id` in `vc.actors` is NOT equal to `auth.uid()`. The session user is a `user` actor; the VPORT is a separate actor they own via `actor_owners`.

**Resolved via TICKET-SUB-010-B (2026-05-28):** Two additional owner-delegation RLS policies were added — `social_settings_select_owner_delegate` and `social_settings_update_owner_delegate`. These allow authenticated users with an active, non-void `actor_owners` row to SELECT and UPDATE that VPORT's settings row. No service-role client is needed.

**Live RLS policies (5 total):**

| Policy | Command | Gate |
|---|---|---|
| `social_settings_select_own` | SELECT | `actor_id = auth.uid()` — citizen reads own settings |
| `social_settings_insert_own` | INSERT | `actor_id = auth.uid()` — citizen inserts own settings |
| `social_settings_update_own` | UPDATE | `actor_id = auth.uid()` — citizen updates own settings |
| `social_settings_select_owner_delegate` | SELECT | `EXISTS (actor_owners WHERE actor_id = row.actor_id AND user_id = auth.uid() AND is_void = false)` — VPORT owner reads VPORT settings |
| `social_settings_update_owner_delegate` | UPDATE | Same EXISTS check — VPORT owner updates VPORT settings |

No DELETE policy. Rows follow `vc.actors ON DELETE CASCADE`.

**App-layer pattern for VPORT settings (LIVE — TICKET-SUB-010):**

```
ctrlUpdateVportSocialSettings({ callerActorId, vportActorId, patch })
  → assertActorOwnsVportActorController (existing ownership gate)
  → dalUpdateActorSocialSettings({ actorId: vportActorId, patch })
    → UPDATE vc.actor_social_settings (succeeds via owner-delegate RLS)
  → invalidateActorSocialSettingsCache(vportActorId)
  → invalidateActorSocialPublicPolicyCache(vportActorId)
```

File: `features/settings/vports/controller/vportSocialSettings.controller.js`

---

## Controlled Visibility Decision RPCs

Instead of exposing the raw settings row, two controlled RPCs serve the specific decisions callers need.

### RPC 1 — `vc.get_actor_social_public_policy`

**Purpose:** Returns the minimum policy data needed to decide how to route a follow action and render the follow button. Does NOT return signal visibility fields.

**Callers:** `ctrlGetFollowRelationshipState` (replaces `actorPrivacy.dal.js`), `ctrlSubscribe` (follow policy routing).

```sql
CREATE OR REPLACE FUNCTION vc.get_actor_social_public_policy(p_actor_id uuid)
RETURNS TABLE (
  account_visibility       text,
  follow_policy            text,
  allow_business_followers bool
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'vc', 'public'
AS $$
  SELECT
    COALESCE(s.account_visibility,
      CASE a.kind WHEN 'vport' THEN 'public' ELSE 'public' END)      AS account_visibility,
    COALESCE(s.follow_policy,
      CASE a.kind WHEN 'vport' THEN 'open' ELSE 'approval_required' END) AS follow_policy,
    COALESCE(s.allow_business_followers, true)                         AS allow_business_followers
  FROM vc.actors a
  LEFT JOIN vc.actor_social_settings s ON s.actor_id = a.id
  WHERE a.id = p_actor_id;
$$;
GRANT EXECUTE ON FUNCTION vc.get_actor_social_public_policy(uuid) TO authenticated;
```

**What it exposes:**
- `account_visibility` — is the profile public / private / unlisted? (needed for profile gate)
- `follow_policy` — open / approval_required / closed? (needed for follow routing)
- `allow_business_followers` — does the actor allow VPORT followers? (needed for `allow_business_followers` check if implemented)

**What it does NOT expose:**
- `follower_count_visibility`
- `follower_list_visibility`
- `following_list_visibility`
- `allow_follow_notifications`

These are not needed for the follow action decision. They are only needed for rendering, and rendering decisions go through RPC 2.

### RPC 2 — `vc.can_view_actor_signal`

**Purpose:** Returns a single boolean — can this viewer see this signal for this target? Resolves viewer tier internally. Controllers call this before returning count/list data.

**Callers:** `getSubscribersController` (before returning count and list), any future signal rendering controller.

```sql
CREATE OR REPLACE FUNCTION vc.can_view_actor_signal(
  p_target_actor_id uuid,
  p_viewer_actor_id uuid,
  p_signal          text   -- 'follower_count' | 'follower_list' | 'following_list'
)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'vc', 'public'
AS $$
DECLARE
  v_visibility      text;
  v_account_vis     text;
  v_follow_policy   text;
  v_viewer_tier     text;  -- 'owner' | 'follower' | 'auth' | 'anon'
  v_is_active_follow bool;
BEGIN
  -- Reject unknown signal names
  IF p_signal NOT IN ('follower_count', 'follower_list', 'following_list') THEN
    RETURN false;
  END IF;

  -- Resolve account visibility and signal visibility (with kind-aware defaults)
  SELECT
    COALESCE(s.account_visibility, 'public'),
    CASE p_signal
      WHEN 'follower_count'  THEN COALESCE(s.follower_count_visibility,
        CASE a.kind WHEN 'vport' THEN 'public' ELSE 'owner' END)
      WHEN 'follower_list'   THEN COALESCE(s.follower_list_visibility,
        CASE a.kind WHEN 'vport' THEN 'public' ELSE 'owner' END)
      WHEN 'following_list'  THEN COALESCE(s.following_list_visibility, 'owner')
    END
  INTO v_account_vis, v_visibility
  FROM vc.actors a
  LEFT JOIN vc.actor_social_settings s ON s.actor_id = a.id
  WHERE a.id = p_target_actor_id;

  -- No such actor
  IF v_visibility IS NULL THEN RETURN false; END IF;

  -- Resolve viewer tier
  IF p_viewer_actor_id IS NULL THEN
    v_viewer_tier := 'anon';
  ELSIF p_viewer_actor_id = p_target_actor_id THEN
    v_viewer_tier := 'owner';
  ELSE
    SELECT is_active INTO v_is_active_follow
    FROM vc.actor_follows
    WHERE follower_actor_id = p_viewer_actor_id
      AND followed_actor_id = p_target_actor_id;
    v_viewer_tier := CASE WHEN v_is_active_follow IS TRUE THEN 'follower' ELSE 'auth' END;
  END IF;

  -- Account visibility gate: private profile hides all signals from non-followers/non-owners
  IF v_account_vis = 'private' AND v_viewer_tier NOT IN ('owner', 'follower') THEN
    RETURN false;
  END IF;

  -- Signal visibility matrix
  RETURN CASE v_visibility
    WHEN 'public'    THEN true
    WHEN 'followers' THEN v_viewer_tier IN ('owner', 'follower')
    WHEN 'owner'     THEN v_viewer_tier = 'owner'
    WHEN 'hidden'    THEN false
    ELSE false
  END;
END;
$$;
GRANT EXECUTE ON FUNCTION vc.can_view_actor_signal(uuid, uuid, text) TO authenticated;
```

**Design decisions:**
- `p_viewer_actor_id = NULL` → `anon` tier (unauthenticated requests)
- Returns `false` for unknown signals (fail-closed)
- Returns `false` if target actor does not exist (fail-closed)
- Account-visibility private gate fires before signal-visibility check — private profile collapses all signals for non-followers regardless of individual settings
- SECURITY DEFINER — bypasses RLS on `actor_follows` and `actor_social_settings` to resolve tier and settings together safely
- `vc.actor_follows` has `FORCE ROW LEVEL SECURITY` enabled (confirmed live). SECURITY DEFINER runs as the function owner (`postgres`), which has `BYPASSRLS` in Supabase. The existing `count_vport_subscribers` and `list_vport_subscribers` already query `actor_follows` inside SECURITY DEFINER without issue — confirmed working pattern.
- **`vc.can_view_actor` helper exists** on the live DB — used by `actor_privacy_settings` SELECT policy (`vc.is_actor_owner(actor_id) OR vc.can_view_actor(actor_id)`). This is a general actor-viewability helper, not a signal-specific decision. `can_view_actor_signal` is a different contract — it resolves a named signal's visibility for a specific viewer, incorporating follow status and signal-level settings. They serve different purposes and do not overlap.

**The removed RPC from draft:** `vc.get_actor_social_settings(uuid)` is no longer in the plan. It was a broad settings reader — replaced by the two focused RPCs above plus owner-only table access for the actor's own settings.

---

## Updated Migration Strategy

### Phase 0 — Schema (TICKET-SUB-009)

**Phase 0a — Create Table**
Create `vc.actor_social_settings` with all columns, constraints, and `updated_at` trigger.
Apply owner-only RLS policies (3 policies: select_own, insert_own, update_own).
Enable RLS on the table.

Trigger function confirmed: `vc.tg_set_updated_at` (verified 2026-05-28). Pre-flight check complete.

**Phase 0b — Create Controlled RPCs**
Create `vc.get_actor_social_public_policy(uuid)`.
Create `vc.can_view_actor_signal(uuid, uuid, text)`.
Grant EXECUTE to authenticated role.

**Phase 0c — Backfill Defaults**
Insert default rows per actor kind. No app code changes needed at this phase.

All three phases are in the same migration file. Zero application risk — no app reads the table yet.

### Phase 1 — DAL (TICKET-SUB-012)

Create three DAL files:

| File | Purpose |
|---|---|
| `actorSocialSettings.dal.js` | Owner's own settings — reads via owner-session table access, writes same. TTL 30s. |
| `actorSocialPublicPolicy.dal.js` | Follow action routing — calls `get_actor_social_public_policy` RPC. TTL 30s. |
| `actorSignalVisibility.dal.js` | Signal gate — calls `can_view_actor_signal` RPC. No cache (viewer-sensitive). |

`actorPrivacy.dal.js` becomes a thin wrapper: calls `actorSocialPublicPolicy.dal.js`, maps `follow_policy !== 'open'` → `{ isPrivate: true }` for backward-compat callers.

### Phase 2 — Controller Migration (TICKET-SUB-010 + TICKET-SUB-011)

Migrate `ctrlGetFollowRelationshipState`:
- Replace `ctrlGetActorPrivacy(targetActorId)` with `dalGetActorSocialPublicPolicy(targetActorId)`
- `relation.isPrivate` derived from `follow_policy !== 'open'`
- Add `follow_policy = 'closed'` short-circuit in `ctrlSubscribe`

Migrate `getSubscribersController` (resolves TICKET-SUB-002):
- Call `dalCanViewActorSignal({ targetActorId: actorId, viewerActorId, signal: 'follower_count' })` before returning count
- Call `dalCanViewActorSignal({ targetActorId: actorId, viewerActorId, signal: 'follower_list' })` before returning list
- If either returns `false`, return `{ count: null, subscribers: [] }` with a `visibility: 'restricted'` flag

### Phase 3 — Settings UI (TICKET-SUB-013)

Privacy Settings screen reads/writes own settings via `actorSocialSettings.dal.js` (owner session).
VPORT settings writes go through `ctrlUpdateVportSocialSettings` (TICKET-SUB-010 scope) — ownership-verified via `actor_owners`.

### Phase 4 — Deprecation (TICKET-SUB-014, deferred)

Deprecate `actor_privacy_settings.is_private` write path after Phase 3 verified in production.

---

## Updated Required DB Changes

### New Objects

| Object | Change from Draft |
|---|---|
| `vc.actor_social_settings` table | Unchanged schema — RLS corrected to owner-only |
| `trg_actor_social_settings_updated_at` trigger | Unchanged |
| `social_settings_select_own` RLS policy | NEW — replaces `SELECT true` |
| `social_settings_insert_own` RLS policy | Unchanged |
| `social_settings_update_own` RLS policy | Unchanged |
| `vc.get_actor_social_public_policy(uuid)` RPC | NEW — replaces `vc.get_actor_social_settings(uuid)` |
| `vc.can_view_actor_signal(uuid, uuid, text)` RPC | NEW — not in draft |

### Removed from Plan

| Object | Reason |
|---|---|
| `vc.get_actor_social_settings(uuid)` RPC | Removed — was a broad settings reader. Replaced by two focused RPCs that expose only needed decisions. |

### Preserved Objects (no change)

| Object | Reason |
|---|---|
| `vc.count_vport_subscribers(uuid)` | Unchanged — VPORT public trust signal, `vport.profiles` guard in RPC body |
| `vc.list_vport_subscribers(uuid, int, int)` | Unchanged — same rationale |
| `vc.get_follower_count(uuid)` | Unchanged — TICKET-SUB-006 rename pending |
| `vc.actor_privacy_settings` | Preserved — written to during transition |

---

## Updated Required Code Changes

### New Files

| File | Purpose | Change from Draft |
|---|---|---|
| `features/social/privacy/dal/actorSocialSettings.dal.js` | Owner reads own settings — direct table access via owner session | Unchanged |
| `features/social/privacy/dal/actorSocialPublicPolicy.dal.js` | Follow action routing — calls `get_actor_social_public_policy` RPC | NEW — was not in draft (draft used `actorSocialSettings.dal.js` for this) |
| `features/social/privacy/dal/actorSignalVisibility.dal.js` | Signal visibility gate — calls `can_view_actor_signal` RPC | NEW — not in draft |
| `features/social/privacy/model/actorSocialSettings.model.js` | Constants and viewer tier resolver | Unchanged |

### Modified Files

| File | Change |
|---|---|
| `features/social/privacy/dal/actorPrivacy.dal.js` | Wrapper calls `dalGetActorSocialPublicPolicy`, maps `follow_policy !== 'open'` → `{ isPrivate }` |
| `features/social/friend/subscribe/controllers/getFollowRelationshipState.controller.js` | Use `dalGetActorSocialPublicPolicy` (not `actorPrivacy.dal.js` directly) |
| `features/social/friend/subscribe/controllers/follow.controller.js` | Add `follow_policy = 'closed'` guard; suppress notification if `!allowFollowNotifications` (read via `dalGetActorSocialPublicPolicy`) |
| `features/profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js` | Call `dalCanViewActorSignal` for count and list before returning; return `{ count: null, subscribers: [] }` with `visibility: 'restricted'` if denied |
| `features/settings/privacy/dal/visibility.dal.js` | Migrate writes to `actor_social_settings` table via owner session |
| `features/settings/privacy/screens/PrivacySettingsScreen.jsx` | Expose `follow_policy`, `follower_count_visibility`, `follower_list_visibility` |

### Pattern: VPORT Settings Update

```
ctrlUpdateVportSocialSettings({ assertingActorId, vportActorId, patch })
  → ctrlAssertActorOwnsVportActor (existing gate)
  → supabase service-role client
    → UPDATE vc.actor_social_settings WHERE actor_id = vportActorId
```

This is the only path for VPORT settings mutation. Direct REST via RLS will fail because `auth.uid() ≠ vportActorId`.

### No Changes Required

| File | Reason |
|---|---|
| `features/profiles/kinds/vport/dal/subscribersCount.dal.js` | VPORT RPC already has `vport.profiles` visibility guard |
| `features/profiles/kinds/vport/dal/subscribersList.dal.js` | Same |
| `features/social/friend/subscribe/controllers/unsubscribe.controller.js` | Unsubscribe always allowed regardless of policy |
| `features/social/friend/request/controllers/followRequests.controller.js` | Ownership gates correct |
| `features/notifications/inbox/model/notification.model.js` | Fixed in TICKET-SUB-003 |
| `features/notifications/types/follow/FollowNotificationItem.view.jsx` | Fixed in TICKET-SUB-004 |

---

## Updated Tests

### New DAL Tests

| Test | File |
|---|---|
| `dalGetActorSocialPublicPolicy` returns `follow_policy`, `account_visibility`, `allow_business_followers` — not full row | `actorSocialPublicPolicy.dal.test.js` |
| `dalGetActorSocialPublicPolicy` → no row → returns kind-correct defaults | `actorSocialPublicPolicy.dal.test.js` |
| `dalCanViewActorSignal('follower_count')` → owner → true | `actorSignalVisibility.dal.test.js` |
| `dalCanViewActorSignal('follower_count')` → anon, visibility='public' → true | `actorSignalVisibility.dal.test.js` |
| `dalCanViewActorSignal('follower_list')` → anon, visibility='owner' → false | `actorSignalVisibility.dal.test.js` |
| `dalCanViewActorSignal('follower_count')` → private account, viewer not follower → false | `actorSignalVisibility.dal.test.js` |
| `dalCanViewActorSignal` → unknown signal → false | `actorSignalVisibility.dal.test.js` |

### Updated Controller Tests

| Test | File | Change from Draft |
|---|---|---|
| `getSubscribersController` → visibility denied → returns `{ count: null, subscribers: [], visibility: 'restricted' }` | `getSubscribers.controller.test.js` | Updated: calls `dalCanViewActorSignal`, not full settings load |
| `getSubscribersController` → VPORT public → visibility allowed → returns data | `getSubscribers.controller.test.js` | Unchanged intent |
| `ctrlSubscribe` → `follow_policy: 'closed'` → returns `ok: false, mode: 'closed'` | `follow.controller.test.js` | Unchanged |
| `ctrlSubscribe` → `allow_follow_notifications: false` → notification NOT published | `follow.controller.test.js` | Reads via `dalGetActorSocialPublicPolicy` |

### VPORT Settings Write Test

| Test | File |
|---|---|
| `ctrlUpdateVportSocialSettings` → `assertingActorId` does not own `vportActorId` → throws | `updateVportSocialSettings.controller.test.js` |
| `ctrlUpdateVportSocialSettings` → valid ownership → updates settings | `updateVportSocialSettings.controller.test.js` |

---

## Updated Ticket Plan

| Ticket | Title | Severity | Change from Draft |
|---|---|---|---|
| TICKET-SUB-009 | Create `vc.actor_social_settings` table, owner-only RLS, visibility RPCs, backfill | HIGH | RLS corrected; `get_actor_social_public_policy` + `can_view_actor_signal` added; `get_actor_social_settings` removed |
| TICKET-SUB-010 | Migrate `ctrlGetFollowRelationshipState` to `follow_policy`; add `ctrlUpdateVportSocialSettings` | HIGH | `ctrlUpdateVportSocialSettings` added to scope |
| TICKET-SUB-011 | Resolve TICKET-SUB-002 via `dalCanViewActorSignal` gate in `getSubscribersController` | HIGH | Uses `can_view_actor_signal` RPC, not full settings read |
| TICKET-SUB-012 | Create `actorSocialSettings.dal.js`, `actorSocialPublicPolicy.dal.js`, `actorSignalVisibility.dal.js` | HIGH | Two new DAL files added vs draft |
| TICKET-SUB-013 | Privacy Settings UI — expose `follow_policy`, count/list visibility fields | MEDIUM | Unchanged |
| TICKET-SUB-007 | Unify missing-row defaults — closed by TICKET-SUB-012 | LOW | Unchanged |
| TICKET-SUB-014 | Deprecate `actor_privacy_settings.is_private` write path | LOW | Unchanged |
| TICKET-SUB-015 | Fix VPORT RPC hard-cap: `LEAST(p_limit, 50)` | LOW | Unchanged |

### Execution Order (Revised)

```
TICKET-SUB-009 (schema — owner-only RLS + controlled RPCs)
    ↓
TICKET-SUB-012 (DAL — three files + actorPrivacy.dal.js wrapper)
    ↓
TICKET-SUB-010 (controller — follow gate + VPORT settings write)
TICKET-SUB-011 (controller — subscriber visibility gate)
    ↓
TICKET-SUB-013 (UI)
    ↓
TICKET-SUB-014 (deprecation — deferred)
```

TICKET-SUB-015 remains independent.

---

## Why Universal Actor Follows Remain Allowed

This section documents the architecture reasoning explicitly per the approved principle.

**Relationship existence is separate from relationship visibility.**

`vc.actor_follows` records that actor A follows actor B. That fact is data about a relationship — it belongs to both actors. Restricting WHO can create that relationship (e.g., blocking VPORT → Citizen follows) is a follow-policy decision, not an access-control decision.

The follow-policy field (`open` / `approval_required` / `closed`) is the correct mechanism for relationship creation control. It is per-actor, per-kind-default, and configurable. Hardcoding an actor-kind restriction in the controller (the TICKET-SUB-005 guard that was reverted) was wrong because it was an architectural assumption masquerading as a product decision.

Product decision (2026-05-27): VPORT → Citizen, VPORT → VPORT, and Citizen → VPORT follows are all permitted. The graph is universal.

**Visibility controls what is discoverable, not who can form a relationship.**

A Citizen who does not want to be followed by VPORTs can set `allow_business_followers = false`. That is a declarative preference enforced at the controller layer. It does not remove the ability for other actors to attempt a follow — it causes the controller to reject the attempt cleanly.

This separation ensures:
- The follow graph remains a single universal structure
- No code branches on actor kind for graph membership
- Visibility, discoverability, and notification behavior are configurable per-actor
- The architecture grows by adding policy fields, not by adding kind-based if-statements

---

## Change Log (continued)

### 2026-05-28 — TICKET-SUB-009 Migration Applied

Migration `20260528000000_create_actor_social_settings.sql` ran successfully.

Results verified:
- `vc.actor_social_settings` table LIVE
- 3 owner-only RLS policies confirmed
- `get_actor_social_public_policy` RPC LIVE — SECURITY DEFINER, GRANT authenticated
- `can_view_actor_signal` RPC LIVE — SECURITY DEFINER, GRANT authenticated
- Backfill: 14 rows seeded (17 actors − 3 excluded by is_void/is_deleted filter)
- All VPORTs: `follow_policy = 'open'`, `follower_count_visibility = 'public'`, `follower_list_visibility = 'public'`
- All Citizens: `follow_policy = 'open'` (derived from `is_private = false` on all 8 live Citizen actors)

### 2026-05-28 — TICKET-SUB-012 DAL Layer Applied

Four files created/modified:

| File | Status |
|---|---|
| `features/social/privacy/dal/actorSocialPublicPolicy.dal.js` | NEW — `get_actor_social_public_policy` RPC, 30s TTL, in-flight dedup, fail-closed to `POLICY_CLOSED` |
| `features/social/privacy/dal/actorSignalVisibility.dal.js` | NEW — `can_view_actor_signal` RPC, no cache (viewer-sensitive), fail-false |
| `features/social/privacy/dal/actorSocialSettings.dal.js` | NEW — owner reads/writes direct table, 30s TTL, explicit column list |
| `features/social/privacy/dal/actorPrivacy.dal.js` | MODIFIED — thin wrapper over `dalGetActorSocialPublicPolicy`, maps `followPolicy !== 'open'` → `{ isPrivate }` |

`actorPrivacy.dal.js` wrapper preserves full backward-compat for all existing callers — same signature `{ actorId }`, same return `{ isPrivate: boolean }`.

`settings/privacy/dal/visibility.dal.js` is a separate file with its own `dalGetActorPrivacy(actorId)` — unaffected by TICKET-SUB-012. The write path is still `actor_privacy_settings.is_private` — TICKET-SUB-013 will migrate it.

### 2026-05-28 — TICKET-SUB-010-B Migration Applied + TICKET-SUB-010 Controller Migration Applied

Migration `20260528000001_actor_social_settings_owner_delegation_rls.sql` ran successfully.
Added: `social_settings_select_owner_delegate` + `social_settings_update_owner_delegate` on `vc.actor_social_settings`.
Table now has 5 RLS policies total. VPORT owner write path unblocked.

Controller changes applied:

`features/social/friend/subscribe/controllers/getFollowRelationshipState.controller.js`:
- Removed `ctrlGetActorPrivacy` hop (controller→controller for a pure read)
- Now calls `dalGetActorSocialPublicPolicy(targetActorId)` directly
- Returns `followPolicy` in addition to `isPrivate` (non-breaking addition)
- Fail-closed early return uses `approval_required` default, `isPrivate: true`

`features/social/friend/subscribe/controllers/follow.controller.js`:
- Added `closed` short-circuit after the `already_following` check
- `relation.followPolicy === 'closed'` → `throw new Error('Actor does not accept new followers')`
- Existing followers are not re-gated (order preserved)

`features/settings/vports/controller/vportSocialSettings.controller.js` (NEW):
- `ctrlGetVportSocialSettings({ vportActorId, callerActorId })` — ownership gate → direct table read
- `ctrlUpdateVportSocialSettings({ vportActorId, patch, callerActorId })` — patch allowlist validation → ownership gate → write → dual cache bust

**Known deviation from architecture spec §10.3:** The `closed` policy currently `throw`s an error rather than returning `{ ok: false, mode: 'closed', status: 'closed', ... }`. The hook caller (`useSubscribe` or equivalent) currently catches errors. This is a remaining TODO for TICKET-SUB-013 or a standalone fix — see Pending section below.

### 2026-05-28 — TICKET-SUB-011 Subscriber Visibility Gate Applied

`features/profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js`:
- Added `viewerActorId` param (optional, defaults to null for anon)
- Runs 4 parallel calls: count + list + `dalCanViewActorSignal('follower_count')` + `dalCanViewActorSignal('follower_list')`
- Visibility gates: count denied → `count: null`; list denied → `rows: []`; either denied → `visibility: 'restricted'` added to response
- Existing behavior fully preserved for public VPORTs (both signals pass with `public` defaults)

Test coverage: 42 tests (up from 19). All pass. TICKET-SUB-002 resolved.

---

## §17 Implementation Status

### Completed (2026-05-28)

| Ticket | Status | Files |
|---|---|---|
| TICKET-SUB-009 | **COMPLETE** | `20260528000000_create_actor_social_settings.sql` |
| TICKET-SUB-010-B | **COMPLETE** | `20260528000001_actor_social_settings_owner_delegation_rls.sql` |
| TICKET-SUB-012 | **COMPLETE** | `actorSocialPublicPolicy.dal.js`, `actorSignalVisibility.dal.js`, `actorSocialSettings.dal.js`, `actorPrivacy.dal.js` (wrapper) |
| TICKET-SUB-010 | **COMPLETE** | `getFollowRelationshipState.controller.js`, `follow.controller.js`, `vportSocialSettings.controller.js` (new) |
| TICKET-SUB-011 | **COMPLETE** | `getSubscribers.controller.js`, `getSubscribers.controller.test.js` (42 tests) |

### Pending Tomorrow

| Item | Ticket | Priority | Notes |
|---|---|---|---|
| **Privacy Settings UI** — expose `follow_policy`, `follower_count_visibility`, `follower_list_visibility` controls | TICKET-SUB-013 | HIGH | Requires new hook, new screen sections; writes via `dalUpdateActorSocialSettings` (citizen) or `ctrlUpdateVportSocialSettings` (VPORT) |
| **Migrate settings write path** — `visibility.dal.js` still writes to `actor_privacy_settings.is_private`; needs to switch to `actor_social_settings` | TICKET-SUB-013 | HIGH | Part of Settings UI ticket — read and write must move together |
| **`closed` return shape** — `ctrlSubscribe` currently `throw`s on `closed` policy; architecture spec §10.3 says return `{ ok: false, mode: 'closed', status: 'closed', isFollowing: false, decision: { route: 'follow_policy_closed' } }` | TICKET-SUB-010 cleanup | MEDIUM | The hook calling `ctrlSubscribe` currently catches errors — the change is non-breaking but required for correct UI state (disabled button vs error state) |
| **`allow_follow_notifications` gate** — `ctrlSubscribe` should read `allowFollowNotifications` from settings and suppress `publishVcsmNotification` when false | TICKET-SUB-013 or standalone | MEDIUM | Requires reading `dalGetActorSocialPublicPolicy` result for `followedActorId` before publishing notification |
| **`settings/vports/index.js` export** — `ctrlGetVportSocialSettings` and `ctrlUpdateVportSocialSettings` not yet exported from vports adapter | TICKET-SUB-013 | LOW | Needed when TICKET-SUB-013 builds the consumer hook |
| **`vportSocialSettings.controller.test.js`** — ownership gate and patch allowlist tests | TICKET-SUB-010 | LOW | No tests yet for `vportSocialSettings.controller.js` |
| **TICKET-SUB-006** — Rename `dalCountSubscribers` in social DAL | TICKET-SUB-006 | LOW | Independent — no blockers |
| **TICKET-SUB-008** — Ownership gate on `dalListOutgoingRequests` | TICKET-SUB-008 | LOW | Independent — no blockers |
| **TICKET-SUB-015** — Fix VPORT RPC hard cap `greatest(p_limit, 0)` → `LEAST(p_limit, 50)` | TICKET-SUB-015 | LOW | Independent — CARNAGE migration required |
| **TICKET-SUB-014** — Deprecate `actor_privacy_settings.is_private` write path | TICKET-SUB-014 | DEFERRED | Only after TICKET-SUB-013 verified in production |
| **DB verification** — Confirm `vc.actor_owners(actor_id, user_id)` composite index exists (CARNAGE flag from 2026-05-28 audit) | — | BEFORE PRODUCTION | Index used in 2 new RLS delegation policies; pre-existing concern shared with booking/posts/chat RLS |

### Transition Risk (active)

`settings/privacy/dal/visibility.dal.js` still writes `actor_privacy_settings.is_private`. The read path now goes through `actor_social_settings.follow_policy`. These are two separate tables. A settings toggle in the Privacy Settings screen currently writes `is_private` but has no effect on the follow routing (which reads `follow_policy`). Until TICKET-SUB-013 migrates the write path, the Privacy Settings toggle is effectively disconnected from the follow gate. This is acceptable in dev (all actors currently `open`) but must be resolved before production.
