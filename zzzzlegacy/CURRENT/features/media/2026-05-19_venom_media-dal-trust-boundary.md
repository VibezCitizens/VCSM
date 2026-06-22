# VENOM — Media DAL Trust Boundary Audit

_Date:_ 2026-05-19  
_Scope:_ `platform.media_assets` write path — `insertMediaAssetDAL` + `createMediaAssetController`  
_Application:_ VCSM  
_Triggered by:_ CEREBRO verification pass on `vcsm.dal.media.md`  
_Authority:_ GOVERNANCE_WRITABLE — no source code modified  
_Status:_ **BLOCKING — RLS policy status unconfirmed; `owner_actor_id` unvalidated at controller layer**

---

## Executive Summary

The `platform.media_assets` write path has **no session-verified auth enforcement at the controller or DAL layer**. Caller-supplied `owner_actor_id` and `created_by_actor_id` flow directly to the database INSERT without any ownership check. A migration file (`2026-05-10_secdef_b_zero_policy_tables.sql`) defines a `media_assets_deny_all` RLS policy, but it is marked **PROPOSAL ONLY** — whether it has been applied to the production database is **unknown**. If it has not been applied, the table is currently unprotected at the database layer.

---

## Files Audited

| File | Role | Audited |
|---|---|---|
| `features/media/dal/mediaAssets.write.dal.js` | DAL — INSERT | YES |
| `features/media/controller/createMediaAsset.controller.js` | Controller — orchestration | YES |
| `features/media/model/mediaAsset.model.js` | Model — payload shape | YES |
| `features/upload/controller/recordPostMedia.controller.js` | External caller | YES |
| `services/supabase/supabaseClient.js` | Auth client setup | YES |
| `zNOTFORPRODUCTION/_ACTIVE/migrations/2026-05-10_secdef_b_zero_policy_tables.sql` | RLS policy proposal | YES |

---

## Finding 1 — RLS Policy Status UNCERTAIN (BLOCKING)

**Severity:** CRITICAL  
**Status:** BLOCKING

A migration file defines the following policy on `platform.media_assets`:

```sql
CREATE POLICY "media_assets_deny_all"
  ON platform.media_assets
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);
```

The file comment states this is "PROPOSAL ONLY — review before applying."

**The app successfully writes to `platform.media_assets` using the authenticated Supabase client (anon key + JWT).** This means either:

1. The deny-all policy has **NOT** been applied — meaning there is **ZERO database-layer protection** against `owner_actor_id` spoofing, OR
2. A separate owner-scoped policy exists that allows writes (not found in any migration file)

If option 1 is true: any authenticated user can insert a row into `platform.media_assets` claiming any `owner_actor_id`.

**Required action:** Run the following query against the production database:

```sql
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'platform' AND tablename = 'media_assets'
ORDER BY policyname;
```

Report the output before this finding can be closed.

---

## Finding 2 — `owner_actor_id` Not Session-Verified at Controller Layer (CRITICAL)

**Severity:** CRITICAL  
**Status:** OPEN

`createMediaAssetController` accepts `ownerActorId` and `createdByActorId` as caller-supplied parameters and forwards them directly to the model and DAL with no ownership check:

```javascript
export async function createMediaAssetController({
  mediaUploadResult,
  ownerActorId,           // CALLER-SUPPLIED — NOT VALIDATED
  createdByActorId,       // CALLER-SUPPLIED — NOT VALIDATED
  scope,
  scopeId = null,
  mediaRole = 'original',
  meta = null,
}) {
  // Validation: required field presence only — no ownership check
  if (!ownerActorId) throw new Error('[createMediaAsset] ownerActorId is required')
  if (!createdByActorId) throw new Error('[createMediaAsset] createdByActorId is required')

  // ownerActorId forwarded without session verification
  const insertPayload = mapUploadResultToMediaAsset({ ownerActorId, createdByActorId, ... })
  const row = await insertMediaAssetDAL(insertPayload)
  ...
}
```

---

## Finding 3 — Inconsistent App-Layer Validation Across Callers (HIGH)

**Severity:** HIGH  
**Status:** OPEN

Caller ownership validation is inconsistent:

| Caller | Auth Validation | Pattern |
|---|---|---|
| `designStudio.assetsExports.controller.js` | YES — calls `requireOwnerActorAccess(ownerActorId)` | Explicit check |
| `useUploadSubmit` (posts) | YES — `identity.actorId` from `useIdentity()` → `switchActorController` | Implicit via identity system |
| `recordChatAttachment.controller.js` | NO — accepts `ownerActorId` as raw parameter | Parameter passthrough |
| `flyerEditor.controller.js` | NO — assumes caller owns `vportId` | Implicit trust |
| `submitCreateVport.controller.js` | PARTIAL — vport creation flow implies ownership | Flow-level trust |
| `addPortfolioMediaWithRecord.controller.js` | PARTIAL — dashboard context implies ownership | Flow-level trust |
| `cards.controller.js` | PARTIAL — `senderActorId` from `ensureGuestUser()` | Session-derived |
| `recordPostMedia.controller.js` | YES — `identity.actorId` from `useIdentity()` | Identity system |

**Attack surface:** `recordChatAttachment.controller.js` accepts `ownerActorId` as a parameter with no validation. An attacker who can invoke this controller with a victim's `actorId` can register media assets attributed to the victim — **if RLS is not enforced at the DB layer**.

---

## Finding 4 — `insertMediaAssetDAL` Has No Auth Check (MEDIUM)

**Severity:** MEDIUM — Defense in depth gap  
**Status:** OPEN

The DAL is a raw Supabase INSERT layer with no ownership validation:

```javascript
export async function insertMediaAssetDAL(row) {
  const { data, error } = await PLATFORM()
    .from('media_assets')
    .insert({
      owner_actor_id: row.owner_actor_id,   // Caller-supplied, no validation
      created_by_actor_id: row.created_by_actor_id,  // Caller-supplied, no validation
      ...
    })
  if (error) throw error
  return data
}
```

Per the architecture contract, business rules belong in the controller — so the DAL is technically correct to not have auth logic. However, as a defense-in-depth measure, the absence of any DB-level enforcement (RLS) means there is no second line of defense.

---

## Finding 5 — Module-Level Cache Risk (LOW — Confirmed Acceptable)

**Severity:** LOW  
**Status:** ACCEPTABLE

`resolveVcsmAppIdDAL` uses a module-level `_cachedAppId`. In a server-side multi-user context, this would be a cross-user data leak risk. In VCSM's Vite client-side architecture, each browser session has its own JS module scope — no user data leaks across sessions. Risk accepted.

---

## Trust Boundary Summary

| Layer | Status | Control |
|---|---|---|
| **Database (RLS)** | UNCERTAIN — BLOCKING | Policy proposal found but not confirmed applied |
| **Supabase JWT** | OK | Anon key + JWT; RLS enforced per session when applied |
| **Controller** | FAIL | Accepts caller-supplied `owner_actor_id` without ownership check |
| **Caller validation** | INCONSISTENT | Some callers validate (designStudio, posts), others do not (chat attachment) |
| **Identity system** | OK | `useIdentity()` validates actor ownership via `platform.actor_owners` |

---

## Corrective Actions

### Immediate (BLOCKING — before release)

1. **Confirm RLS policy state in production** — run `pg_policies` query above
2. **Apply owner-scoped RLS policy** if deny-all is not appropriate for the write path:

```sql
CREATE POLICY "media_assets_owner_write"
  ON platform.media_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_actor_id IN (
      SELECT actor_id FROM vc.actor_owners WHERE user_id = auth.uid()
    )
  );
```

### Short-term

3. **Standardize `recordChatAttachment.controller.js`** — derive `ownerActorId` from authenticated session rather than accepting it as a raw parameter
4. **Add ownership check to `createMediaAssetController`** — either accept a `currentActorId` parameter and assert it matches `ownerActorId`, or require callers to validate first

### Long-term

5. **Derive `ownerActorId` from session in the controller** rather than passing it in — eliminates the entire class of caller-supplied identity risk

---

## Handoffs

| Command | Reason |
|---|---|
| **DB** | Run `pg_policies` query to confirm actual RLS state — required to close Finding 1 |
| **Carnage** | If RLS migration is needed (owner-scoped policy creation for `platform.media_assets`) |
| **SENTRY** | Confirm `recordChatAttachment.controller.js` fix doesn't introduce new boundary violations |

---

_VENOM completed: 2026-05-19_  
_Files read: 7 source files + 1 migration file_  
_Code modified: NONE_  
_Status: BLOCKING — Finding 1 (RLS uncertainty) must be resolved before RELEASE_READY_
