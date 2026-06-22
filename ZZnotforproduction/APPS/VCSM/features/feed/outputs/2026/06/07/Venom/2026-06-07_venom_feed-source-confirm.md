# VENOM V2 — feed Source Confirmation
**Branch:** vport-booking-feed-security-updates
**Date:** 2026-06-07
**Run type:** Source verification confirming prior 2026-06-06 findings

---

## Source Files Verified

| File | Lines | Purpose |
|---|---|---|
| apps/VCSM/src/features/feed/controllers/feedWelcomeCard.controller.js | 1-14 | Welcome card controller |
| apps/VCSM/src/features/feed/dal/feedWelcomeCard.dal.js | 1-43 | Welcome card DAL |
| apps/VCSM/src/features/feed/hooks/useFeedWelcomeCard.js | 1-58 | Welcome card hook |

---

## BW-FEED-001 / ELEK-2026-06-06-001 — CONFIRMED [SOURCE_VERIFIED]

**Finding:** ctrlMarkWelcomeCardSeen has no ownership check — actorId unverified against session
**Evidence:**

`feedWelcomeCard.controller.js` (full file, 14 lines):
```js
export async function ctrlMarkWelcomeCardSeen({ actorId }) {
  await markWelcomeFeedCardSeenDAL({ actorId })  // actorId accepted directly, no session check
}
```

`feedWelcomeCard.dal.js` lines 20-43:
```js
export async function markWelcomeFeedCardSeenDAL({ actorId }) {
  if (!actorId) throw new Error('...')  // null guard only
  const { error } = await supabase      // public supabase client (no requireUser())
    .schema('vc')
    .from('actor_onboarding_steps')
    .upsert({ actor_id: actorId, step_key: 'welcome_feed_card', status: 'completed', … }, { onConflict: 'actor_id,step_key' })
```

`useFeedWelcomeCard.js` line 47:
```js
if (actorId) ctrlMarkWelcomeCardSeen({ actorId }).catch(() => {})
```
`actorId` comes from the hook's props (`{ actorId, kind }`), not from `useIdentity()` internally.

**Attack path:** Any caller passing an arbitrary `actorId` to `useFeedWelcomeCard` can mark that actor's welcome card as completed, suppressing the onboarding card from their feed UI permanently.
**RLS dependency:** `vc.actor_onboarding_steps` UPDATE policy must restrict to `actor_id = auth.uid()` — UNVERIFIED [BW-FEED-005 UNRESOLVED]
**Status:** CONFIRMED OPEN — prior findings stand

---

## Prior Findings Status (Carry-Forward)

All findings from 2026-06-06 carry forward unchanged. No new findings identified for feed on this branch pass.

| Finding ID | Severity | Status |
|---|---|---|
| BW-FEED-001 / ELEK-2026-06-06-001 | HIGH | OPEN — CONFIRMED SOURCE_VERIFIED |
| BW-FEED-NEW-002 | HIGH | OPEN — listActorPosts no app-layer visibility model |
| ELEK-2026-06-06-002 | HIGH | OPEN — logout() missing queryClient.clear() |
| VEN-FEED-005 | HIGH | OPEN — vport.profiles RLS unverified |
| VEN-FEED-009 | HIGH | OPEN — useFeed.adapter.js frozen on legacy hook |
| BW-FEED-005 | MEDIUM | OPEN — vc.actor_onboarding_steps write RLS unverified |
| BW-FEED-007 | MEDIUM | OPEN — share URL raw UUID postId |
| ELEK-2026-06-06-003 | MEDIUM | OPEN — includeDebug unconditional in pipeline |
| ELEK-2026-06-06-004 | MEDIUM | OPEN — raw UUID postId in share URL |
| ELEK-2026-06-06-005 | MEDIUM | OPEN — viewerActorId validated but discarded |

---

## THOR Gate: BLOCKED

BW-FEED-001/ELEK-2026-06-06-001 (HIGH), BW-FEED-NEW-002 (HIGH), ELEK-2026-06-06-002 (HIGH), BW-FEED-005 (DB RLS), VEN-FEED-009 (HIGH) all remain.
