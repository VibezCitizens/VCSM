# VENOM Remediation Report — VCSM Full Deep Scan
Date: 2026-05-10
Source scan: `2026-05-10_00-00_venom_vcsm-full-deep-scan.md`
Scope: apps/VCSM only

---

## Files Changed

| File | Finding | Change |
|---|---|---|
| `apps/VCSM/src/app/routes/protected/appRoutes.redirects.jsx` | F-04 | Added `OwnerOnlyDashboardGuard` |
| `apps/VCSM/src/app/routes/protected/app.routes.jsx` | F-04 | Nested all dashboard routes inside `OwnerOnlyDashboardGuard` |
| `apps/VCSM/src/features/dashboard/vport/controller/vportTeamAccess.controller.js` | F-05 | Added `assertCallerOwns` + `callerActorId` to all privileged functions |
| `apps/VCSM/src/features/dashboard/vport/hooks/useVportTeamAccess.js` | F-05 | Added `useIdentity`, passes `sessionActorId` to all controller calls |
| `apps/VCSM/src/features/dashboard/vport/controller/vportLeads.controller.js` | F-05 | Added `assertCallerOwns` + `callerActorId` to all functions |
| `apps/VCSM/src/features/dashboard/vport/hooks/useVportLeads.js` | F-05 | Added `useIdentity`, passes `sessionActorId` to all controller calls |
| `apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js` | F-03 | Added `callerActorId` assertion to `ctrlBlockActor`/`ctrlUnblockActor`; guarded `console.error` |
| `apps/VCSM/src/features/settings/queries/useBlockedCitizens.js` | F-03 | Added `useIdentity`, passes `callerActorId: sessionActorId` to mutations |
| `apps/VCSM/src/dev/diagnostics/groups/settingsPrivacyFeature.group.js` | F-03 | Added `callerActorId: context.actorId` to all `ctrlBlockActor`/`ctrlUnblockActor` calls |
| `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js` | F-06 | `useExistingBarberVportAndAccept` now reads auth user + verifies vport ownership before accept |
| `apps/VCSM/src/features/join/dal/joinInvite.dal.js` | F-06/F-12 | Removed `profile_id` from `RESOURCE_COLS` |
| `apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js` | F-01 | Renamed export to `isModerationAuthorizedDAL`, returns boolean only — no throw |
| `apps/VCSM/src/features/moderation/controllers/assertModerationAccess.controller.js` | F-01 | **New file** — enforcement (throw FORBIDDEN) moved here |
| `apps/VCSM/src/features/moderation/controllers/moderationActions.controller.js` | F-01 | Import updated to use new controller |
| `apps/VCSM/src/state/identity/identity.controller.js` | F-07 | Removed `profileId` from debug event payload |
| `apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js` | F-08 | Fixed `isOwner` from `profile_id === actorId` → `myActorIds.includes(postActor.actor_id)` |
| `apps/VCSM/src/features/feed/screens/DebugPrivacyPanel.jsx` | F-09 | Removed `profile_id` and `vport_id` columns from debug table |
| `apps/VCSM/src/features/settings/profile/dal/profile.write.dal.js` | F-11 | Guarded `console.error` with `import.meta.env.DEV` |
| `apps/VCSM/src/features/settings/privacy/hooks/usePendingFollowRequestActions.js` | F-11 | Guarded both `console.error` calls with `import.meta.env.DEV` |
| `apps/VCSM/src/features/wanders/services/wandersSupabaseClient.js` | F-11 | Guarded env-check `console.error` with `import.meta.env.DEV` |

Total files changed: 20 (19 modified, 1 new)

---

## DB Migration SQL — F-02 (Carnage)

> Status: PENDING — not yet applied. Requires DB/Carnage execution.
> Rationale: Decouples moderation authorization from `learning.platform_admins`.
> Until this migration runs, `isModerationAuthorizedDAL` continues to read `learning.platform_admins`.

```sql
-- migration: 2026-05-10_create-moderation-moderators-table
-- Decouples moderation role authorization from the LMS platform_admins table.
-- After this runs, extend isModerationAuthorizedDAL to check moderation.moderators.

CREATE SCHEMA IF NOT EXISTS moderation;

CREATE TABLE IF NOT EXISTS moderation.moderators (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid NOT NULL REFERENCES vc.actors(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'moderator' CHECK (role IN ('moderator', 'admin')),
  granted_by  uuid REFERENCES vc.actors(id),
  granted_at  timestamptz NOT NULL DEFAULT now(),
  revoked_at  timestamptz,
  is_active   boolean NOT NULL DEFAULT true,
  UNIQUE (actor_id)
);

ALTER TABLE moderation.moderators ENABLE ROW LEVEL SECURITY;

-- Only platform service role (not anon/authenticated) can read/write moderators.
-- App-layer reads go through isModerationAuthorizedDAL which uses the service key.
CREATE POLICY "moderators_service_only"
  ON moderation.moderators
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Grant select to authenticated for self-lookup only (optional, for UI badge).
-- Omit if moderator identity should never be revealed via client-side query.
```

> After migration, update `isModerationAuthorizedDAL` to also query `moderation.moderators`:
> ```js
> const { data: modRow } = await supabase
>   .schema('moderation')
>   .from('moderators')
>   .select('actor_id')
>   .eq('actor_id', actorId)
>   .eq('is_active', true)
>   .limit(1)
> return (Array.isArray(data) && data.length > 0) || (Array.isArray(modRow) && modRow.length > 0)
> ```

---

## Enforcement Flow After Fixes

```
Browser request → /actor/:actorId/dashboard/*
  ↓
ProtectedRoute         (auth + email verify + consent gate)
  ↓
ProfileGatedOutlet     (profile completeness gate)
  ↓
BlockedVportGuard      (blockedVport state check)
  ↓
OwnerOnlyDashboardGuard  ← NEW: identity.actorId === URL :actorId
  ↓
VportDashboard* Screen (isOwner check — now redundant but retained as defense-in-depth)
  ↓
useVportLeads(actorId) → listVportLeadsController(actorId, opts, sessionActorId)
  ↓ assertCallerOwns(sessionActorId, actorId) ← throws if mismatch
  ↓
DAL read
```

Block/Unblock path:
```
useBlockedCitizens(actorId, scope)
  → ctrlBlockActor({ actorId, blockedActorId, scope, callerActorId: sessionActorId })
    ↓ asserts callerActorId === actorId
    ↓ DAL write
```

Join invite accept path:
```
useExistingBarberVportAndAccept(token, vportActorId, { readCurrentAuthUserDAL })
  ↓ reads auth user
  ↓ reads barber vport by owner user id
  ↓ asserts existingVport.actor_id === vportActorId
  ↓ acceptJoinResourceDAL(token, vportActorId)
```

Moderation path:
```
hideReportedObjectController({ moderatorActorId, reportId })
  → assertModerationAccessController(moderatorActorId)  ← controller layer
    → isModerationAuthorizedDAL(actorId)                 ← DAL returns boolean
      ↓ returns true/false
    ↓ throws FORBIDDEN if false
  ↓ enforces moderation action
```

---

## Pass/Fail Manual Test Checklist

### F-04 — OwnerOnlyDashboardGuard
- [ ] Navigate to `/actor/<your-actorId>/dashboard` while logged in → loads
- [ ] Navigate to `/actor/<another-actorId>/dashboard` while logged in → redirects to `/feed`
- [ ] Navigate to any dashboard subroute (team, leads, reviews) as non-owner → redirects to `/feed`
- [ ] Navigate while logged out → redirects (ProtectedRoute catches first)

### F-05 — Controller session binding (team + leads)
- [ ] Open team screen as owner → members load
- [ ] Add team member as owner → succeeds
- [ ] Remove team member as owner → succeeds
- [ ] Manually call `getTeamAccessController(actorId, null)` → throws "callerActorId required"
- [ ] Manually call `listVportLeadsController(actorId, {}, null)` → throws "callerActorId required"

### F-03 — Block controller session binding
- [ ] Block an actor from settings → succeeds
- [ ] Unblock an actor → succeeds
- [ ] Manually call `ctrlBlockActor({ actorId, blockedActorId, scope, callerActorId: null })` → throws
- [ ] Manually call with mismatched callerActorId → throws "caller does not own this actor"

### F-06 — Join invite ownership
- [ ] Use existing barber vport flow with correct vportActorId → accepts invite
- [ ] Use existing barber vport flow with mismatched vportActorId → throws "Caller does not own this barber vport"
- [ ] Verify no `profile_id` column returned in join resource fetch

### F-01 — Moderation auth in controller layer
- [ ] `hideReportedObjectController` called by non-moderator → FORBIDDEN thrown at controller
- [ ] `dismissReportController` called by non-moderator → FORBIDDEN thrown at controller
- [ ] `assertModerationAccessDAL` directly returns boolean (no throw) — verify by inspection

### F-07/F-08/F-09 — Identity surface cleanup
- [ ] Check browser devtools → no `profileId` in `HYDRATION_ACTOR_READ_SUCCESS` event payload
- [ ] Open debug privacy panel in dev → `profile_id` and `vport_id` columns absent
- [ ] `isOwner` field in debug panel rows correct for your own posts

### F-11 — Console log hardening
- [ ] Build prod bundle (`vite build`) → grep output for `[updateProfile:user] DB ERROR` → absent
- [ ] Search for `console.error('Accept failed'` in prod build output → absent
- [ ] Search for `console.error('Decline failed'` in prod build output → absent

---

## Findings NOT Fixed (Remaining)

| Finding | Reason |
|---|---|
| F-02 (moderation.moderators table) | DB migration — Carnage/DB pending. Code side (F-01) is complete. |
| F-10 (Wanders RLS audit) | Read-only audit only — no code changes planned. See notes below. |
| F-13 (learning.platform_admins RLS) | Requires DB audit of the LMS admin table RLS — out of scope for this remediation pass. |
| F-14 | No action required per original scan. |

### F-10 — Wanders Guest Auth Boundary (Read-Only Audit Notes)

The `wandersSupabaseClient.js` creates an isolated Supabase client with device-keyed `storageKey`. This is intentionally separate from the main VCSM session — Wanders operates as a guest auth boundary where actors are identified by client key, not by VCSM session.

Risks observed:
- Guest session is keyed by localStorage `clientKey` — if localStorage is cleared, a new guest identity is created silently.
- `x-client-key` header is set on every request — this is a custom header, not a Supabase auth header; its enforcement depends entirely on RLS policies in the `wanders` schema.
- No handoff mechanism was observed for linking a guest wanders session to an authenticated VCSM actor identity. If such a handoff exists elsewhere, it must be verified.

Recommended DB follow-up: `DB` command to audit RLS policies on `wanders.*` tables and verify that `x-client-key` is enforced at the DB level (not just application level).
