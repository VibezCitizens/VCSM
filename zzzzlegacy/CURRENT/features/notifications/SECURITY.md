# notifications — SECURITY.md

**Source audit:** `CURRENT/features/dashboard/evidence/venom_notifications-dal_2026-05-19.md`
**VENOM audit date:** 2026-05-19
**Overall verdict:** VERIFIED — no blocking security findings. All active security paths verified clean.

---

## Findings Summary

| Finding ID | Area | Severity | Status | Notes |
|---|---|---|---|---|
| RISK-16 (deescalated) | vportClient RLS posture | — | CLEAN | vportClient is a schema accessor on the same Supabase client, not a separate client. Same auth, same JWT, same RLS evaluation context. No privilege escalation path. |
| — | Block filter trust boundary | — | CLEAN | Bidirectional block filter verified: `listBlockedActorRowsDAL` + `listBlockingActorRowsDAL`; `moderation.blocks` schema, active-only filter, explicit column select. |
| RISK-2 | Console violations | — | FULLY RESOLVED | All console calls in publish.js, Notifications.controller.js, resolveInboxActor.js, useNotificationInbox.js, FollowRequestItem.view.jsx, useMarkNotificationsRead.js confirmed DEV-gated. Zero unguarded console violations in production paths. |
| — | Adapter boundary | — | CLEAN | All 15+ external consumers use `notifications.adapter.js`. Zero direct controller-to-controller imports in production paths. |
| — | Engine DI chain | — | CLEAN | `configureNotificationsEngine` called once pre-render via `main.jsx → setup.js`. `_configured` guard prevents double-initialization. |
| RISK-6 | Layer violation (dead code) | LOW | OPEN | `useMarkNotificationsRead.js` — `useMarkNotificationRead` calls `markRead()` from `@notifications` directly from hook layer, bypassing controller. File is confirmed dead (zero consumers). Pattern must not be replicated if the file is ever reactivated. |

---

## Trust Boundary

- Auth source: Same Supabase singleton as all features (`supabase` shared client)
- Block filter: Enforced in controller via `loadBlockSets(myActorId)` + `filterByBlocks()` — bidirectional, active-only
- Publish ACL: OPEN gap — no documented rule restricts who can publish via adapter (see IRONMAN)
- Actor cache eviction: `purgeNotificationCache()` uses `removeQueries` (hard evict) — confirmed no cross-actor data bleed on actor switch or logout

---

## Verified Security Paths (VENOM 2026-05-19)

| Path | Status |
|---|---|
| vportClient schema accessor identity | VERIFIED CLEAN |
| Block filter bidirectionality | VERIFIED CLEAN |
| Console policy (all 6 files) | VERIFIED CLEAN |
| Adapter boundary (15+ consumers) | VERIFIED CLEAN |
| Engine DI initialization guard | VERIFIED CLEAN |
