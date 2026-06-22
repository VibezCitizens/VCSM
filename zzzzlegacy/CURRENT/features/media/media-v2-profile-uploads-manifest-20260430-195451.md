# Media Engine V2 — Profile Uploads Recording Manifest

**Timestamp:** 2026-04-30 19:54:51  
**Git Branch:** main

---

## Purpose

Wire `platform.media_assets` recording into `useProfileUploads.js` additively.  
After each successful `uploadMediaController` result, call `createMediaAssetController`.  
Non-blocking: any failure in recording logs a DEV-only warning and never blocks the profile save.

## Scopes Wired

| Scope | Path |
|---|---|
| `user_avatar` | `uploadAvatar` when `mode === 'user'` |
| `user_banner` | `uploadBanner` when `mode !== 'vport'` |
| `vport_avatar` | `uploadAvatar` when `mode !== 'user'` |
| `vport_banner` | `uploadBanner` when `mode === 'vport'` |

## Files Modified

| File | Change |
|---|---|
| `apps/VCSM/src/features/settings/profile/hooks/useProfileUploads.js` | Add `useIdentity` + `createMediaAssetController` imports; add recording try/catch after each `uploadMediaController` call |

## Files Backed Up

| File | Backup Location |
|---|---|
| `useProfileUploads.js` | `zNOTFORPRODUCTION/zcontract/doc/backups/media-v2-profile-uploads-20260430-195451/` |

## Rules Enforced

- No Supabase import in hook (controller handles DB access)
- No DAL import in hook
- Existing `uploadMediaController` calls and URL return values are unchanged
- Recording is non-blocking (try/catch, DEV warn only)
- `ownerActorId` and `createdByActorId` use `identity.actorId` from `useIdentity()`
- `scopeId` uses `subjectId` (profile or vport reference)
