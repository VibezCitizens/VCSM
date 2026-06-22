---
audit: thor
date: 2026-05-10
scope: VCSM
topic: VPORT create flow — avatar upload + write-back fix
verdict: CAUTION
---

# THOR — Release Readiness: VPORT Create Avatar Upload Fix

## Release Target

```
THOR RELEASE TARGET
Application Scope: VCSM
Release reason:    Fix three regressions in VPORT create avatar upload flow
Areas changed:
  - vport.core.dal.js              (create_vport 7-param call, slug generation)
  - submitCreateVport.controller.js (actorId fix, IIFE avatar upload, avatar_url write-back)
  - vport.write.profileMedia.dal.js (writes both avatar_media_asset_id + avatar_url)
  - DB migration:                   create_vport overload — single 7-param function remains
```

---

## Architecture Status

```
ARCHITECTURE STATUS
Contract violations:   None introduced by the fix.
Dependency risks:      submitCreateVport.controller.js imports from @debuggers — alias resolves
                       to no-op stub in production (verified). Acceptable.
Layer violations:      None. DAL → Controller → Hook → Screen order respected.
Cross-feature:         createMediaAssetController imported correctly via @/features/media/.
                       uploadMediaController imported correctly via @media engine alias.
Dead parameter:        appId passed to createMediaAssetController but not in function signature
                       (silently dropped). Not a violation — minor cleanup needed.
```

**Architecture: PASS**

---

## Performance Status

```
PERFORMANCE STATUS
Hot paths:       IIFE is fire-and-forget — upload does not block navigation. No impact on CRP.
Duplicate reads: resolveVcsmAppIdDAL() called twice per create — once in controller,
                 once inside createMediaAssetController. Cached, so effectively free.
N+1 risks:       None introduced.
High-latency:    Avatar upload happens async after navigation — no user-perceived latency
                 for VPORT creation itself.
```

**Performance: PASS**

---

## Security Status

```
SECURITY STATUS
RLS issues:       UNVERIFIED — updateVportAvatarMediaAssetIdDAL relies entirely on RLS
                  for ownership enforcement. vport.profiles UPDATE policy must be
                  confirmed before merge. See VENOM finding V-04.
Trust boundaries: Upload uses res.actorId (server-returned) — CORRECT.
                  No raw auth UUID used as ownerActorId.
Sensitive surface: console.log statements in createMediaAsset.controller.js are
                   DEV-guarded. @debuggers alias is production no-op. CLEAN.
```

**Security: CAUTION — pending RLS verification**

---

## Migration Status

```
MIGRATION STATUS
Schema changes:     create_vport function — overload ambiguity resolved.
                    Only one 7-param signature should exist.
Migration safety:   Migration reported as applied. Verify with DB command:
                    SELECT proname, pronargs FROM pg_proc
                    WHERE proname = 'create_vport' AND pronamespace = (
                      SELECT oid FROM pg_namespace WHERE nspname = 'vport'
                    );
                    Expected: exactly 1 row, pronargs = 7.
Rollback:           create_vport is a CREATE OR REPLACE function — rollback would
                    require re-deploying the previous overload. No data at risk.
Index:              No index changes. No concern.
```

**Migration: CAUTION — must verify single function row in DB**

---

## Documentation Status

```
DOCUMENTATION STATUS
Logan drift:    No Logan docs needed for this fix.
Missing docs:   None.
Audit files:    VENOM + THOR reports written to:
                zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom_vport-create-avatar-upload.md
                zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_thor_vport-create-avatar-upload.md
```

**Documentation: PASS**

---

## Ownership Status

```
OWNERSHIP STATUS
Feature ownership:  vport/hooks, vport/controller, vport/dal — clear single-feature ownership.
Engine boundary:    media engine used correctly via @media alias.
Unowned modules:    None.
```

**Ownership: PASS**

---

## Release Decision

**CAUTION**

Two conditions must be confirmed before this fix is merged:

### Condition 1 — REQUIRED: RLS on `vport.profiles` UPDATE verified
Run via DB command:
- Confirm `vport.profiles` has an UPDATE policy that gates writes to the row owner.
- The write-back DAL (`updateVportAvatarMediaAssetIdDAL`) has no app-layer ownership
  re-check. If RLS is absent or incomplete, any authenticated user could overwrite
  another vport's avatar_url given knowledge of its actor_id.
- If policy exists and is correct → CLEAR TO MERGE.
- If policy is absent or weak → escalate to Carnage before merge.

### Condition 2 — REQUIRED: DB verify single create_vport function
```sql
SELECT proname, pronargs, pg_get_function_identity_arguments(oid)
FROM pg_proc
WHERE proname = 'create_vport'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'vport');
```
Expected: exactly 1 row, 7 args. If 2+ rows exist, the overload ambiguity is not resolved
and the PostgREST RPC call will still fail.

---

## Expected UX Behavior

| Step | Expected |
|---|---|
| User fills form and taps Create | Spinner shows |
| create_vport RPC succeeds | VPORT created in DB |
| Navigation fires | User lands on `/profile/{actorId}` immediately |
| Avatar shown on first load | May be missing (blank/fallback) — upload still in-flight |
| Upload + write-back completes | avatar_url + avatar_media_asset_id written to vport.profiles |
| User refreshes | Avatar appears |
| Existing broken vport (gas) | avatar_url = null until fixed via profile edit |

This is the intended behavior. The "avatar on refresh" UX is documented and expected.

---

## Smoke Test Checklist

```
[ ] 1. Create a new VPORT (any type) with an avatar image selected
[ ] 2. Confirm creation succeeds and navigation goes to /profile/{actorId}
[ ] 3. On first load: avatar may be missing — this is expected behavior
[ ] 4. Wait 3–5 seconds, then refresh — avatar should now appear
[ ] 5. Inspect DB: vport.profiles row for this actorId should have:
         avatar_url = <non-null R2 URL>
         avatar_media_asset_id = <non-null UUID>
[ ] 6. platform.media_assets row for this upload:
         owner_actor_id = <vport actorId, NOT auth user.id>
         scope = 'vport_creation_avatar'
[ ] 7. Create a VPORT without an avatar — confirm creation succeeds, no errors
[ ] 8. Create a barbershop VPORT — confirm workspace creation does not block
        if it fails (non-fatal)
[ ] 9. Check browser console in production build — no debug logs from create flow
[10] 10. Confirm DB has exactly one vport.create_vport function (7 params)
[11] 11. Verify existing gas VPORT still loads without error (avatar = null is OK)
[12] 12. Fix gas VPORT avatar via profile edit to confirm write-back path also works
         for edit flow (separate code path, but confirms DAL layer is correct)
```

---

## Risk Register

| ID | Risk | Severity | Status |
|---|---|---|---|
| R-01 | RLS on vport.profiles UPDATE not verified | MEDIUM | OPEN — must resolve before merge |
| R-02 | create_vport DB still has overload ambiguity | HIGH | OPEN — must verify via DB |
| R-03 | Silent 0-row update on write-back DAL | LOW | Accepted — non-fatal, fire-and-forget |
| R-04 | Partial write if publicUrl is null | LOW | Accepted — edge case, non-fatal |
| R-05 | Dead appId parameter in controller | LOW | Accepted — cleanup sprint |
| R-06 | listMyVports uses owner_user_id | LOW | Accepted — identity migration sprint |

---

## Final Verdict

**CAUTION**

The code fix is correct. The three reported bugs are properly addressed. No critical security issues were introduced. Production debug output is clean.

**Release is BLOCKED on two verifications:**
1. RLS on `vport.profiles` UPDATE policy — run `/DB` and confirm policy exists.
2. DB single-function confirmation — verify only one `create_vport` row in `vport` schema.

Once both are confirmed: **GO**.
