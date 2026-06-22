# Module: Supabase schema usage — platform

## PWA Source of Truth

**Routes:** Identity, legal, media upload, app bootstrap

**Screens/components:**
- `apps/VCSM/src/features/identity/*`
- `apps/VCSM/src/features/legal/*`
- `apps/VCSM/src/features/media/*`
- `apps/VCSM/src/features/upload/*`

**Services/DAL:**
- `apps/VCSM/src/features/identity/dal/provision.rpc.dal.js`
- `apps/VCSM/src/features/media/dal/mediaAssets.write.dal.js`
- `apps/VCSM/src/features/legal/dal/*`

**Supabase schema/tables/RPCs:**
- `platform.provision_vcsm_identity`
- `platform.user_app_preferences`
- `platform.user_app_accounts`
- `platform.user_app_actor_links`
- `platform.apps`
- `platform.media_assets`
- `platform.legal_documents`
- `platform.user_consents`

**RLS expectations:** Identity/legal/media writes must resolve the authenticated user/app context and must never use string `app_key` where a UUID `app_id` is required.

**Current PWA status:** Source of truth for identity provisioning, active actor preferences, legal consent, and media asset recording.

---

## Native Transfer Status

**Status:** `Partial`

---

## Transferred Native Files

- `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`
- `VCSMNativeApp/Session/SessionStore.swift`
- `VCSMNativeApp/Services/Composer/LivePostComposerService.swift`
- `VCSMNativeApp/Services/Conversation/LiveConversationService.swift`

---

## Native Behavior Currently Present

- Native uses `platform` schema for identity preferences, legal documents/consents, app context, and media-related paths.
- Composer now resolves `platform.apps.id` for `key=vcsm`, inserts `platform.media_assets`, and writes the resulting media asset UUID back to `vc.post_media`.
- Legal gate error handling now fails signed-out instead of fail-open into signed-in runtime state.

---

## Native Gaps

- Composer post uploads record `platform.media_assets` like PWA; runtime Cloudflare/Supabase upload regression is not yet tested.
- `app_id` resolution uses `platform.apps` UUID for composer post uploads; chat attachment parity is not yet verified.
- Legal consent error path is build-verified as fail-closed; live policy/session restore regression is not yet tested.

---

## Risk Notes

- `platform` schema mistakes commonly present as: RLS 401/403 errors, silent missing media links, or actor switch not persisting.
- UUID `app_id` is required — composer now resolves `platform.apps.id` before inserting `platform.media_assets`.

---

## Pending Transfer Checklist

- [x] Trace media asset insert and post attachment update for first upload batch.
- [ ] Trace chat attachment media asset update for upload parity.
- [ ] Trace identity preference write after actor switch.
- [ ] Trace legal consent acceptance and app context lookup.

---

## PWA → Native Transfer Log

- Date:
- Change type: Feature / Fix / Schema / UI / RLS
- PWA files changed:
- Routes affected:
- Screens/components changed:
- Services/DAL changed:
- Behavior change:
- Supabase schema/RPC change:
- RLS expectations changed:
- Affected native modules:
- Priority: P0 / P1 / P2
- Native status: Not started / Partial / Risky / Complete
- Testing notes:
- Notes:

---

## Transfer History

- Last synced date: 2026-05-03
- Native files updated: `LivePostComposerService.swift`, `SupabaseClient.swift`, `SessionStore.swift`
- Delta status: Partial — composer media_assets recording and legal hardening are build-verified; chat media asset parity and runtime legal/upload tests remain open
- Notes: P0 native transfer batch started and build-verified on May 3.

---

## Archived Notes

No archived notes yet.
