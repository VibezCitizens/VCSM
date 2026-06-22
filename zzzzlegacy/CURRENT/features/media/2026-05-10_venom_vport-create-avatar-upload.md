---
audit: venom
date: 2026-05-10
scope: VCSM
topic: VPORT create flow — avatar upload + write-back fix
verdict: PASS WITH CONDITIONS
---

# VENOM — VPORT Create Avatar Upload Security Audit

## Target

```
VENOM TARGET
Feature / Route / Engine: VPORT creation — avatar upload + write-back
Application Scope: VCSM
Reason for review: Post-fix verification — actorId fix, avatar_url write-back addition, create_vport overload resolution
Primary trust boundary: Supabase RLS on vport.profiles + media engine ownerActorId enforcement
```

---

## Security Surface

```
SECURITY SURFACE
Entry point:      useCreateVport.submit() → submitCreateVportController()
Auth source:      supabase.auth.getUser() via requireUser() in vport.core.dal.js:21
Authorization:    RLS on vport.profiles (write-back); create_vport RPC (server-enforced)
Identity surface: actorId (returned from create_vport RPC) — CORRECT
Sensitive objects: vport.profiles.avatar_url, vport.profiles.avatar_media_asset_id,
                   platform.media_assets (owner_actor_id), R2 storage key
```

---

## Trust Boundary Trace

```
TRUST BOUNDARY TRACE
Client input:         name, type, description, avatarFile, avatarUrl, directoryVisible
Validated at:         vportType validated in controller (submitCreateVport.controller.js:27-30)
                      File validated in media engine (validateMediaFile, uploadMedia.controller.js:38-39)
Identity resolved at: DB — create_vport RPC returns actor_id; requireUser() verifies session before RPC call
Authorization:        create_vport RPC enforces auth server-side (AUTH_REQUIRED guard)
                      updateVportAvatarMediaAssetIdDAL relies 100% on RLS — no app-layer re-auth
Data returned to:     Hook receives { res, list }; res.actorId used for navigation only
```

---

## Call Path (Confirmed)

```
useCreateVport.submit()
  └── submitCreateVportController()                   [submitCreateVport.controller.js]
        ├── createVport()                             [vport.core.dal.js:45]
        │     ├── requireUser()                       [:21] — auth check before RPC
        │     └── vportSchema.rpc('create_vport', …) [:72] — 7-param signature, server-enforced
        │           returns { actorId, profileId, slug, … }
        │
        ├── createOrganizationLocationWorkspace()     [barbershop only, non-fatal]
        │
        ├── IIFE (async, fire-and-forget):            [:64-93]
        │     ├── uploadMediaController({ ownerActorId: res.actorId })   [engines/media]
        │     ├── resolveVcsmAppIdDAL()               [cached]
        │     ├── createMediaAssetController({ ownerActorId: res.actorId, createdByActorId: res.actorId })
        │     └── updateVportAvatarMediaAssetIdDAL({ actorId: res.actorId, mediaAssetId, avatarUrl })
        │           [vport.write.profileMedia.dal.js:5]
        │
        └── listMyVports() [if withList]
              returns { res, list }

useCreateVport (hook):
  └── navigate(`/profile/${res.actorId}`)  — navigation happens BEFORE IIFE completes
```

---

## Security Risk Findings

---

### FINDING V-01 — actorId used for upload ownership (VERIFIED CORRECT)

```
VENOM SECURITY FINDING
- Location: submitCreateVport.controller.js:70
- Application Scope: VCSM
- Current behavior: ownerActorId: res.actorId — the VPORT's own actor ID returned from the DB
- Risk: NONE — correctly uses the newly-created vport actorId, not auth user.id
- Severity: PASS
- Why it matters: Using auth user.id would create media assets owned by the wrong actor
- Recommended mitigation: No action required. Confirmed correct.
- Rationale: res.actorId is returned by create_vport RPC, server-authoritative
- Follow-up command: N/A
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security
```

---

### FINDING V-02 — avatar_url + avatar_media_asset_id both written (VERIFIED CORRECT)

```
VENOM SECURITY FINDING
- Location: vport.write.profileMedia.dal.js:7-9
- Application Scope: VCSM
- Current behavior:
    patch = { avatar_media_asset_id: mediaAssetId }
    if (avatarUrl) patch.avatar_url = avatarUrl
- Risk: LOW — avatar_url is only written when avatarUrl is truthy.
  If uploadResult.publicUrl is null (upload failure edge), avatar_media_asset_id
  would be written without avatar_url. The avatar would show broken until refresh
  after a manual avatar edit.
- Severity: LOW
- Why it matters: Partial write is non-fatal but could leave avatar_media_asset_id set
  without a matching avatar_url, causing the profile to display a broken avatar reference.
- Recommended mitigation: Consider an atomic check — if avatarUrl is null/empty,
  skip the entire write-back rather than writing a partial record.
  Not a blocker; follow-up via Wolverine.
- Rationale: uploadResult.publicUrl would only be null if R2 upload succeeded
  but URL generation failed — an extremely unlikely edge case.
- Follow-up command: Wolverine (optional hardening)
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Asset Security
```

---

### FINDING V-03 — Write-back DAL has no returned-row verification (MEDIUM)

```
VENOM SECURITY FINDING
- Location: vport.write.profileMedia.dal.js:9-13
- Application Scope: VCSM
- Current behavior:
    .from('profiles').update(patch).eq('actor_id', actorId)
    — no .select() or .count() check after update
- Risk: MEDIUM — if RLS correctly blocks the write (e.g., session expired, policy gap),
  the update silently affects 0 rows. The IIFE catches thrown errors but a 0-row
  silent update would pass without error and without detection.
- Severity: MEDIUM
- Why it matters: In the normal flow this is safe — the session is authenticated and
  the vport was just created by this user. But if a policy enforcement gap exists
  OR if the IIFE executes after session expiry (race condition on slow devices),
  the write-back silently fails and avatar_url remains null. No log, no retry.
- Recommended mitigation:
    Add .select('actor_id').single() after update and verify the row was returned.
    Alternatively ensure IIFE avatar write-back logs "0 rows updated" via bugBunny.
    Not a blocker for this release.
- Rationale: Fire-and-forget pattern accepts non-fatal failure; the risk is silent
  failure without observability rather than unauthorized write.
- Follow-up command: Wolverine (hardening sprint)
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Security Operations
```

---

### FINDING V-04 — Write-back relies 100% on RLS, no app-layer ownership re-check

```
VENOM SECURITY FINDING
- Location: vport.write.profileMedia.dal.js:5-13
- Application Scope: VCSM
- Current behavior: update filtered by .eq('actor_id', actorId) only.
  No app-layer check that the session user owns this actorId.
- Risk: MEDIUM — if RLS on vport.profiles does not enforce ownership on UPDATE,
  any authenticated user who knows a vportId's actor_id could call this DAL
  and overwrite that vport's avatar_url.
- Severity: MEDIUM (conditional — depends on RLS correctness)
- Why it matters: The DAL is exported as a named function. If ever called from
  another code path without the "just created this vport" guarantee, the only
  protection is RLS. This is an acceptable architecture for Supabase-based apps
  but requires RLS verification before go-live.
- Recommended mitigation:
  1. Verify vport.profiles has an UPDATE policy that checks:
     auth.uid() = owner_user_id (or equivalent actor_owners check)
  2. If policy is absent or incomplete, escalate to Carnage for policy addition.
  3. Do NOT ship without RLS confirmation.
- Rationale: The fix itself is correct in that it uses actorId. The gap is the
  absence of a documented RLS policy confirmation for this write path.
- Follow-up command: DB (inspect vport.profiles RLS UPDATE policy)
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering
```

---

### FINDING V-05 — console.log in createMediaAsset.controller.js (DEV-guarded, LOW)

```
DEBUG LEAKAGE WARNING
- Location: createMediaAsset.controller.js:65, :76
- Current behavior:
    if (import.meta.env?.DEV) console.log('[createMediaAsset] insert payload:', insertPayload)
    if (import.meta.env?.DEV) console.log('[createMediaAsset] insert result:', ...)
  insertPayload includes ownerActorId, storageKey, scopeId
- Leak risk: LOW — all guarded by import.meta.env?.DEV which is false in production builds.
  Vite tree-shakes these in production. No leak in production.
- Severity: LOW / INFORMATIONAL
- Recommended mitigation: No immediate action needed.
  Optional: migrate to bugBunny debug trace for consistency with the rest of the upload pipeline.
- CISSP Domain:
  - Primary: Security Operations
  - Secondary: Asset Security
```

---

### FINDING V-06 — console.warn in submitCreateVportController (DEV-guarded, LOW)

```
DEBUG LEAKAGE WARNING
- Location: submitCreateVport.controller.js:91
- Current behavior:
    if (import.meta.env?.DEV) console.warn('[submitCreateVportController] media write-back failed...')
- Leak risk: NONE — DEV-only. Production build strips this.
- Severity: INFORMATIONAL
- Recommended mitigation: No action required. Correctly guarded.
- CISSP Domain:
  - Primary: Security Operations
```

---

### FINDING V-07 — @debuggers alias resolves to no-op stub in production (VERIFIED CORRECT)

```
VENOM SECURITY FINDING
- Location: apps/VCSM/vite.config.js (alias config)
- Application Scope: VCSM
- Current behavior:
    production → ./src/debuggers-stub/  (exports empty no-ops)
    development → zNOTFORPRODUCTION/_ACTIVE/debuggers/
- Risk: NONE — production builds use stub with zero implementation.
  The zNOTFORPRODUCTION directory never ships.
- Severity: PASS
- Recommended mitigation: No action needed. Pattern is correct.
- CISSP Domain:
  - Primary: Security Operations
  - Secondary: Software Development Security
```

---

### FINDING V-08 — Dead appId parameter passed to createMediaAssetController (LOW)

```
VENOM SECURITY FINDING
- Location: submitCreateVport.controller.js:73-82 vs createMediaAsset.controller.js:25-33
- Application Scope: VCSM
- Current behavior: Caller resolves appId via resolveVcsmAppIdDAL() and passes it
  as a parameter to createMediaAssetController. But the function signature does not
  include appId — the parameter is silently dropped. The controller resolves appId
  again internally. Result: resolveVcsmAppIdDAL() is called twice (cached, so safe).
- Risk: LOW / NONE — double-call is benign due to caching. No security risk.
  Dead parameter causes mild confusion about contract.
- Severity: LOW
- Recommended mitigation: Remove the appId resolve+pass from submitCreateVport.controller.js
  (trust createMediaAssetController to handle its own resolution).
  Not a blocker.
- Follow-up command: Wolverine (cleanup sprint)
- CISSP Domain:
  - Primary: Software Development Security
```

---

### FINDING V-09 — listMyVports uses owner_user_id (raw auth UUID) instead of actorId

```
IDENTITY SURFACE WARNING
- Location: vport.core.dal.js:127
- Current identity surface: .eq("owner_user_id", user.id)  — raw auth UUID
- Expected identity surface: actor-based filtering (actorId or actor_owners join)
- Risk: LOW — read-only, scoped to the authenticated user's own session.
  However this deviates from the actor-based identity contract.
- Severity: LOW / CONTRACT DEVIATION
- Recommended mitigation: Not a security risk in isolation, but note that
  owner_user_id is a legacy column. Future migration to actor_owners may break this.
  Track for the identity migration sprint.
- Follow-up command: DB, ARCHITECT
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security and Risk Management
```

---

### FINDING V-10 — createVport DAL returns profileId/vportId aliases alongside actorId

```
IDENTITY SURFACE WARNING
- Location: vport.core.dal.js:107-117
- Current behavior: Return object exposes vport_id, profile_id, profileId, vportId
  as aliases alongside the canonical actorId.
- Risk: LOW — these are internal DAL return values consumed by the controller.
  They are not exposed through useIdentity() or any public hook surface.
  The controller correctly uses res.actorId for all upload/navigation operations.
- Severity: LOW / INTERNAL CONTRACT DEVIATION
- Recommended mitigation: Consider removing camelCase aliases (profileId, vportId)
  from the DAL return. Only actorId is needed downstream.
  The barbershop workspace call on line 49 passes res.profileId — this is the one
  consumer keeping these aliases alive.
- Follow-up command: Wolverine (cleanup sprint)
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security
```

---

## CISSP Domain Coverage Summary

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | V-09 — identity contract deviation |
| Asset Security | 2 | V-02 (partial write), V-05 (log payload) |
| Security Architecture and Engineering | 2 | V-03, V-04 — RLS reliance + silent failure |
| Communication and Network Security | 0 | Out of scope for this feature path |
| Identity and Access Management | 4 | V-01, V-04, V-09, V-10 |
| Security Assessment and Testing | 1 | V-04 — RLS requires verification |
| Security Operations | 3 | V-03, V-05, V-06, V-07 |
| Software Development Security | 4 | V-01, V-02, V-07, V-08, V-10 |

Communication and Network Security: not applicable to this internal write-back flow.

---

## Uncovered Domains

- **Communication and Network Security** — not applicable. Upload goes through R2 via the media engine; no custom network handling in scope.

---

## VENOM Verdict

**PASS WITH CONDITIONS**

The three reported fixes are correctly implemented:
1. `create_vport` RPC call uses the 7-param form — overload ambiguity resolved at the DB layer.
2. Upload uses `res.actorId` (not `user.id`) — CONFIRMED CORRECT.
3. Write-back writes both `avatar_media_asset_id` and `avatar_url` — CONFIRMED CORRECT.
4. Fire-and-forget IIFE correctly decouples avatar failure from VPORT creation.
5. Production debug leakage: NONE — all logs DEV-guarded; `@debuggers` alias resolves to no-op stub.

**Blocking condition before merge:**
- V-04: RLS on `vport.profiles` UPDATE policy must be verified via DB command.
  Without RLS confirmation, the write-back DAL has no app-layer ownership re-check.

**Non-blocking follow-ups:**
- V-03: Add returned-row verification to write-back DAL (hardening).
- V-08: Remove dead appId parameter from submitCreateVportController.
- V-10: Remove profileId/vportId aliases from createVport return.
