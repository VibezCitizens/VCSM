# VENOM — Security Audit: Notifications DAL

**Date:** 2026-05-19  
**Triggered by:** CEREBRO pass on `vcsm.dal.notifications.md`  
**Scope:** Notifications feature — DAL trust boundaries, block filter, vportClient, console policy  
**Status:** VERIFIED — no blocking security findings  

---

## vportClient (RISK-16 — Reassessed)

**Prior claim:** `vportClient` is a separate Supabase client with distinct RLS and schema implications.

**Actual finding — DEESCALATED:**

File: `apps/VCSM/src/services/supabase/vportClient.js`

```js
import { supabase } from '@/services/supabase/supabaseClient'
export const vport = supabase.schema('vport')
export default vport
```

`vportClient` is **not a separate client**. It is a schema accessor on the same Supabase client. Same authentication, same JWT, same session, same RLS evaluation context. `listVportRowsByIdsDAL` in `senders.read.dal.js` uses:

```js
const { data, error } = await vportSchema
  .from("profiles")
  .select("id,name,slug,avatar_url")
  .in("id", ids);
```

- Explicit column select — no wildcard. ✓  
- Same auth context as all other DAL calls. ✓  
- RLS on `vport.profiles` applies with the same session user. ✓  
- No privilege escalation path. ✓  

**Verdict:** CLEAN. No security concern. Document should be updated to clarify this is a schema accessor, not a separate client.

---

## Block Filter Trust Boundary (RISK-16 related — previously flagged by VENOM April 2026 as unreviewed)

File: `apps/VCSM/src/features/notifications/inbox/dal/blocks.read.dal.js`

```js
const { data, error } = await supabase
  .schema("moderation")
  .from("blocks")
  .select("blocked_actor_id")  // explicit column
  .eq("blocker_actor_id", actorId)
  .eq("status", "active");    // active-only filter
```

- Schema: `moderation` — correct. ✓  
- Both directions: `listBlockedActorRowsDAL` (actors I blocked) + `listBlockingActorRowsDAL` (actors who blocked me). ✓  
- Status filter: `active` only. ✓  
- Explicit column select. ✓  
- `blockFilter.js` builds bidirectional Sets and `filterByBlocks` removes any actor in either set. ✓  

**Verdict:** CLEAN. Block filter correctly enforces bidirectional visibility suppression.

---

## Console Violations (RISK-2 — Status Confirmed)

All previously flagged console violations verified as DEV-gated:

| File | Line(s) | Guard |
|---|---|---|
| `publish.js` | 79-81 | `if (import.meta.env.DEV)` |
| `Notifications.controller.js` | 55-57 | `if (import.meta.env.DEV)` |
| `resolveInboxActor.js` | 33-34, 52-53 | `if (import.meta.env.DEV)` |
| `useNotificationInbox.js` | 49, 60, 85 | `if (!DEV || ...)` / `if (DEV)` |
| `FollowRequestItem.view.jsx` | 25, 76, 93 | `if (DEV)` |
| `useMarkNotificationsRead.js` | 27, 34, 62, 72 | `if (DEV)` |

**Verdict:** RISK-2 is FULLY RESOLVED. Zero unguarded console violations remain in production paths.

---

## Engine DI Chain

`configureNotificationsEngine` called once at app startup via `main.jsx → setup.js`. Guard `_configured` prevents double-initialization. DAL functions access Supabase only after `configureNotificationsRuntimeDAL` is called. **CLEAN.**

---

## Adapter Boundary

All 15+ external consumers of the notification publish path use `notifications.adapter.js`. Zero direct controller-to-controller imports detected in production paths. **CLEAN.**

---

## Layer Violation (RISK-6 — Dead but Flagged)

`useMarkNotificationsRead.js` — `useMarkNotificationRead` calls `markRead()` from `@notifications` directly from the hook layer, bypassing the controller. File is confirmed dead (zero external consumers). If ever reactivated, this pattern skips any ownership/permission checks the controller layer provides. **LOW risk (dead code) but pattern must not be replicated.**

---

## Summary

| Area | Status | Severity |
|---|---|---|
| vportClient RLS posture | CLEAN — same auth context | Resolved (RISK-16 deescalated) |
| Block filter trust boundary | CLEAN — bidirectional, active-only | VERIFIED |
| Console policy (RISK-2) | FULLY RESOLVED | Resolved |
| Adapter boundary | CLEAN | VERIFIED |
| Engine DI chain | CLEAN | VERIFIED |
| Layer violation (RISK-6) | LOW — dead code only | OPEN |

**No blocking security findings. All active security paths verified clean.**
