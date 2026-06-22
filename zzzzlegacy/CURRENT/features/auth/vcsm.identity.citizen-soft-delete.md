# VCSM Citizen Delete — Soft Delete + Hard Delete

> **Version:** 3
> **Created:** 2026-04-20
> **Last Updated:** 2026-04-25
> **Scope:** Phase 1 (soft delete, reversible) + Phase 2 (hard delete — app data + auth user via Edge Function)

---

## 1. Purpose

Provides a safe, reversible path to deactivate a Citizen (user) account without physically deleting any data. A soft-deleted Citizen:

- Is marked deleted at the profile root (`public.profiles.is_deleted`)
- Has their actor marked deleted (`vc.actors.is_deleted`)
- Disappears from all hydration, feed, and profile reads
- Can be restored in a future Phase 2 by flipping both flags back
- Does not cascade into posts, chat, follows, or VPORTs in Phase 1

**Important:** `is_void` is a separate feature and is never touched by this path.

---

## 2. Canonical Citizen Root

**Table:** `public.profiles`

Columns added by this migration:

| Column | Type | Default | Purpose |
|---|---|---|---|
| `is_deleted` | BOOLEAN NOT NULL | false | Marks the profile as soft-deleted |
| `deleted_at` | TIMESTAMPTZ | NULL | Timestamp of soft delete |

---

## 3. Actor Table

**Table:** `vc.actors`

Columns added by this migration:

| Column | Type | Default | Purpose |
|---|---|---|---|
| `is_deleted` | BOOLEAN NOT NULL | false | Marks the actor as soft-deleted (separate from `is_void`) |
| `deleted_at` | TIMESTAMPTZ | NULL | Timestamp of soft delete |

`is_void` is NOT touched. `is_void` is a different feature.

---

## 4. What is Changed on Soft Delete

| Table | Column | Value |
|---|---|---|
| `public.profiles` | `is_deleted` | `true` |
| `public.profiles` | `deleted_at` | `now()` |
| `vc.actors` | `is_deleted` | `true` |
| `vc.actors` | `deleted_at` | `now()` |

`vc.actor_owners` is **not touched**. `is_void` is **not touched** anywhere.

---

## 5. Restore Path (admin only — not exposed in UI)

```sql
UPDATE public.profiles SET is_deleted = false, deleted_at = NULL, updated_at = now() WHERE id = :profile_id;
UPDATE vc.actors        SET is_deleted = false, deleted_at = NULL                     WHERE id = :actor_id;
```

No other tables need to change. No linkage is broken. Fully reversible — but only if the auth user has not yet been hard-deleted (Phase 2).

---

## 6. DB Functions Updated

Both functions are updated via migration `20260420040000` to add `and coalesce(a.is_deleted, false) = false` to their WHERE clause.

### `vc.get_actor_summaries(uuid[])`

Used by feed hydration, actor cards, chat author display. Now excludes deleted citizen actors automatically. The deleted citizen disappears from all feed reads without any app-layer changes needed.

```sql
where a.id = any(p_actor_ids)
  and coalesce(a.is_void,    false) = false   -- existing
  and coalesce(a.is_deleted, false) = false   -- added
```

### `vc.read_actor_profile(uuid)`

Used by the profile page DAL. Now returns zero rows for a deleted citizen. `maybeSingle()` → `null` → `readActorProfileDAL` returns `null` → profile page shows 404.

```sql
where a.id = p_actor_id
  and coalesce(a.is_deleted, false) = false   -- added
```

---

## 7. RPC — `public.soft_delete_citizen_account()`

Migration: `apps/VCSM/supabase/migrations/20260420040000_citizen_soft_delete_v2.sql`

```
SECURITY DEFINER, search_path = public, vc

1. auth.uid() → AUTH_REQUIRED if null
2. SELECT ao.actor_id, a.profile_id
     FROM vc.actor_owners ao JOIN vc.actors a
    WHERE ao.user_id = auth.uid()
      AND a.kind = 'user'
      AND ao.is_void = false        -- existing — not touching is_void, just reading it
      AND a.is_void = false         -- existing — not touching is_void, just reading it
      AND a.is_deleted = false      -- guard: not already deleted
   → CITIZEN_NOT_FOUND if NOT FOUND
3. UPDATE public.profiles SET is_deleted = true, deleted_at = now() WHERE id = v_profile_id
4. UPDATE vc.actors        SET is_deleted = true, deleted_at = now() WHERE id = v_actor_id
5. RETURN jsonb { ok, actor_id, profile_id }
```

**Grants:**
```sql
REVOKE EXECUTE ON FUNCTION public.soft_delete_citizen_account() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.soft_delete_citizen_account() TO authenticated;
```

---

## 8. DAL Layer

### `account.write.dal.js`

| Function | RPC |
|---|---|
| `dalSoftDeleteCitizenAccount()` | `public.soft_delete_citizen_account` |

Error normalisation:
- `AUTH_REQUIRED` → `'Not authenticated'`
- `CITIZEN_NOT_FOUND` → `'No active citizen account found'`

### `readActorProfile.dal.js`

No special handling needed. Since `vc.read_actor_profile` now returns zero rows for deleted actors, `maybeSingle()` returns `null`, and the existing `if (!data) return null` guard covers it.

---

## 9. Phase 2 — Citizen Hard Delete (Edge Function)

Phase 2 permanently deletes both app/domain data AND the Supabase Auth user. It is irreversible.

### Ordering contract

1. App/domain data deleted first (via `soft_delete_citizen_account()` RPC — same as Phase 1)
2. Auth user deleted second (`adminClient.auth.admin.deleteUser(user.id)`)

If step 1 fails → abort, return error, auth user is untouched.
If step 2 fails after step 1 → app data is gone; `userId` is logged server-side for admin recovery.

### Edge Function — `delete-citizen-account`

**File:** `apps/VCSM/supabase/functions/delete-citizen-account/index.ts`

```
POST /functions/v1/delete-citizen-account
Authorization: Bearer <user-jwt>

1. Extract Bearer token from Authorization header → 401 if missing
2. Create anon client scoped to JWT → auth.getUser() → 401 if no user
3. Call soft_delete_citizen_account() via anon client
   → RLS + auth.uid() enforce ownership
   → 404 if CITIZEN_NOT_FOUND, 500 on other errors
4. Create admin client (SUPABASE_SERVICE_ROLE_KEY — server-side only)
5. adminClient.auth.admin.deleteUser(user.id)
   → on failure: log userId server-side, return AUTH_DELETE_FAILED
6. Return { ok: true }
```

**Security invariants:**
- No `userId` accepted from the request body — caller identity from JWT only
- `SUPABASE_SERVICE_ROLE_KEY` never leaves the Edge Function
- `auth.uid()` in the RPC resolves to the JWT user — ownership enforced at DB level

**Required Supabase secrets (all auto-injected in Edge Functions):**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### DAL — `dalDeleteCitizenAccountFull()`

**File:** `apps/VCSM/src/features/settings/account/dal/account.write.dal.js`

```js
export async function dalDeleteCitizenAccountFull() {
  const { data, error } = await supabase.functions.invoke('delete-citizen-account', { method: 'POST' })
  if (error) throw new Error(error?.message || 'Could not delete account.')
  if (data?.code === 'AUTH_DELETE_FAILED') throw new Error(data.error || '...')
  return data
}
```

The Supabase JS client automatically attaches the current session JWT as the `Authorization` header when calling `functions.invoke`.

### Controller

`ctrlDeleteAccount()` in `account.controller.js` calls `dalDeleteCitizenAccountFull()`.

`dalSoftDeleteCitizenAccount()` remains in the DAL — it is called by the Edge Function itself via the anon client, not directly from frontend code.

---

## 10. Hook Behaviour

`useAccountController.deleteAccount()`:

**Normal path (full success):**
1. Calls `ctrlDeleteAccount()` → `dalDeleteCitizenAccountFull()` → Edge Function → app data deleted → auth user deleted
2. Clears localStorage actor keys (`actor_kind`, `actor_vport_id`, `actor_touch`)
3. Calls `logoutFromAuth()` — clears local Supabase session tokens, navigates to `/login`

**AUTH_DELETE_FAILED path (partial success):**
- App data is deleted but `adminClient.auth.admin.deleteUser` failed in the Edge Function
- `dalDeleteCitizenAccountFull` throws an error with `err.code = 'AUTH_DELETE_FAILED'`
- Hook catch block detects this code and still force-logs the user out (same localStorage clear + `logoutFromAuth()`)
- The user has no valid app state to return to — forcing logout is the safe action
- The auth user record persists in Supabase; admin recovery is possible server-side

**Total failure path (network error, Edge Function 500, etc.):**
- `ctrlDeleteAccount()` throws without a recognized code
- Hook catch block shows the error message to the user
- `logoutFromAuth()` is NOT called — deletion may not have happened, retry is possible

`logoutFromAuth()` calls `supabase.auth.signOut()` — this is safe even after the auth user is deleted (just clears local tokens).

---

## 10. Migration History

### 030000 — abandoned (incorrect)
`20260420030000_citizen_soft_delete.sql` — used `is_void` on `vc.actor_owners` and `vc.actors`, added `voided_profile_id`. Incorrect: `is_void` is a separate feature.

### 040000 — current correct implementation
`20260420040000_citizen_soft_delete_v2.sql` — cleans up 030000 artifacts, uses dedicated `is_deleted` on both tables, updates DB functions, creates corrected RPC.

---

## 11. Files Map

| File | Role |
|---|---|
| `apps/VCSM/supabase/migrations/20260420040000_citizen_soft_delete_v2.sql` | Schema + DB function updates + Phase 1 RPC |
| `apps/VCSM/supabase/functions/delete-citizen-account/index.ts` | Phase 2 Edge Function — app delete + auth.admin.deleteUser |
| `apps/VCSM/supabase/functions/delete-citizen-account/deno.json` | Deno import map (empty) |
| `apps/VCSM/src/features/settings/account/dal/account.write.dal.js` | `dalSoftDeleteCitizenAccount` (Phase 1, used by Edge Function) + `dalDeleteCitizenAccountFull` (Phase 2, used by controller) |
| `apps/VCSM/src/features/settings/account/controller/account.controller.js` | `ctrlDeleteAccount` → `dalDeleteCitizenAccountFull` |
| `apps/VCSM/src/features/settings/account/hooks/useAccountController.js` | `deleteAccount` — calls controller → clears localStorage → logoutFromAuth |
| `apps/VCSM/src/features/profiles/dal/readActorProfile.dal.js` | Returns null when `read_actor_profile` returns no rows (soft-deleted actor → 404) |

---

## 12. Change Log

### 2026-04-20 — v1 (abandoned)
**Migration:** `20260420030000_citizen_soft_delete.sql`
Used `is_void` on `vc.actor_owners` and `vc.actors` — incorrect. `is_void` is reserved for a separate feature. Also added `voided_profile_id` which had no place in the schema. Entirely superseded by v2.
Generated by: Batman

### 2026-04-20 — v2
**Migration:** `20260420040000_citizen_soft_delete_v2.sql`
- Replaced void approach with dedicated `is_deleted` + `deleted_at` on both `public.profiles` and `vc.actors`
- Migration 040000 cleans up any 030000 artifacts before applying correct schema
- Updated `vc.get_actor_summaries` to add `and coalesce(a.is_deleted, false) = false`
- Updated `vc.read_actor_profile` to add `and coalesce(a.is_deleted, false) = false`
- Created `public.soft_delete_citizen_account()` SECURITY DEFINER RPC — scoped to `authenticated`, resolves actor via `actor_owners` without touching `is_void`
- `dalSoftDeleteCitizenAccount()` added to `account.write.dal.js`
- `ctrlDeleteAccount` wired in `account.controller.js`
- `useAccountController.deleteAccount()` clears localStorage actor keys (`actor_kind`, `actor_vport_id`, `actor_touch`) before calling `logoutFromAuth()`
- `readActorProfile.dal.js` returns `null` when `vc.read_actor_profile` returns no rows (deleted actor → 404)
- `vc.actor_owners` not touched. `is_void` not touched anywhere.
Generated by: Batman

### 2026-05-02 — v4 (current)

**Task:** Fix stale session after account deletion (Issue B)
**Summary:**
- `dalDeleteCitizenAccountFull` now attaches `err.code = 'AUTH_DELETE_FAILED'` to the thrown error so callers can distinguish partial success from total failure without string-matching.
- `useAccountController.deleteAccount()` catch block now checks `error?.code === 'AUTH_DELETE_FAILED'` and forces logout when the app data is gone but auth cleanup failed. User has no valid app state; forcing logout is the safe default.
- Total failure path (network error, 500) unchanged — error is shown to user, logout is not called.

**Files Changed:**
- `apps/VCSM/src/features/settings/account/dal/account.write.dal.js`
- `apps/VCSM/src/features/settings/account/hooks/useAccountController.js`

Generated by: Claude

### 2026-04-25 — v3

**Task:** Citizen hard delete — permanently delete app/domain data AND Supabase Auth user
**Summary:**
- Created Edge Function `delete-citizen-account/index.ts` — verifies JWT via anon client, calls `soft_delete_citizen_account()` RPC first (app data), then `adminClient.auth.admin.deleteUser(user.id)` (auth user). App delete must succeed before auth delete is attempted. Auth delete failure is logged server-side with `userId` for admin recovery.
- Added `dalDeleteCitizenAccountFull()` to `account.write.dal.js` — calls `supabase.functions.invoke('delete-citizen-account')`. JWT attached automatically by Supabase client.
- `ctrlDeleteAccount()` in `account.controller.js` now calls `dalDeleteCitizenAccountFull()` instead of `dalSoftDeleteCitizenAccount()`. `dalSoftDeleteCitizenAccount()` is retained in the DAL — it is still called by the Edge Function itself (via anon client + JWT).
- Hook and view unchanged — `deleteAccount()` in `useAccountController` continues to call `logoutFromAuth()` after the controller resolves, which clears local tokens and navigates to `/login`.
- Deploy: `supabase functions deploy delete-citizen-account --project-ref <ref>`

**Files Changed:**
- `apps/VCSM/supabase/functions/delete-citizen-account/index.ts` (NEW)
- `apps/VCSM/supabase/functions/delete-citizen-account/deno.json` (NEW)
- `apps/VCSM/src/features/settings/account/dal/account.write.dal.js`
- `apps/VCSM/src/features/settings/account/controller/account.controller.js`

Generated by: Claude
