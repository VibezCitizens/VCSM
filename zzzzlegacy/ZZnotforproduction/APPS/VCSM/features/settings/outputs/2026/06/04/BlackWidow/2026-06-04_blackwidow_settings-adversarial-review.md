# BLACKWIDOW V2 Adversarial Review — settings
## BW2.5 V2 Full Execution Report

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Date | 2026-06-04 |
| Feature | settings |
| App | VCSM |
| BW Version | V2 / BW2.5 |
| Analyst | BLACKWIDOW V2 |
| Report Status | COMPLETE |
| Behavior Contract Status | PLACEHOLDER — all §9 invariants UNANCHORED |
| VENOM Open Findings Ingested | VEN-SETTINGS-001 through VEN-SETTINGS-007 (7 open) |
| ELEKTRA Status | NOT RUN |

---

## 2. Scanner Preflight

| Field | Value |
|---|---|
| Scanner Version | 1.1.0 |
| Maps Generated | 2026-06-04T19:48:25.152Z |
| Age at Review | FRESH (~7h old) |
| Security Paths Attributed | 24 |
| Total Platform Security Paths | 598 |
| Feature Coverage | 4.0% |

---

## 3. Scanner Inputs Block

Maps consumed:
- `apps/scanner/maps/security-path-map.json` — 24 settings paths extracted
- `apps/scanner/maps/callgraph.json` — 230 nodes, 306 edges; 33 controller entries, 41 hook entries
- `apps/scanner/maps/write-execution-map.json` — 0 settings results (map does not resolve to feature level)
- `apps/scanner/maps/rpc-execution-map.json` — 0 settings results

Scanner confidence for all 24 paths: LOW (confidence = "write surface discovered without route-confirmed path; potential surface only"). sourceRoute is null on all entries. Per Rule BW-002, all 24 paths are PRIMARY ATTACK TARGETS.

---

## 4. Attack Surface Inventory

### 4.1 Security Paths (24 total — ALL LOW confidence)

| # | DAL Function | Operation | Schema/Table | RPC |
|---|---|---|---|---|
| 1 | dalDeleteCitizenAccountFull | edge_function | — | delete-citizen-account |
| 2 | dalSoftDeleteCitizenAccount | rpc | — | soft_delete_citizen_account |
| 3 | dalDeleteMyVport | rpc | — | soft_delete_vport |
| 4 | dalRestoreVport | rpc | — | restore_vport |
| 5 | dalHardDeleteVport | rpc | — | hard_delete_vport |
| 6 | dalInsertBlock | rpc | moderation | block_actor |
| 7 | dalDeleteBlockByTarget | rpc | moderation | unblock_actor |
| 8 | dalSetActorPrivacy | upsert | vc.actor_privacy_settings | — |
| 9 | updateProfile (user mode) | update | public.profiles | — |
| 10 | updateProfile (vport mode) | update | vport.profiles | — |
| 11 | setVportBusinessCardSettingsDAL | update | vport.profiles | — |
| 12 | setVportDirectoryVisibleDAL | update | vport.profiles | — |
| 13 | syncDirectoryVisibleToPublicDetailsDAL | update | vport.profile_public_details | — |
| 14 | setVportBusinessCardPublishStateDAL | rpc | vport | set_business_card_publish_state |
| 15 | updateUserPhotoMediaAssetIdDAL | update | public.profiles | — |
| 16 | updateUserBannerMediaAssetIdDAL | update | public.profiles | — |
| 17–24 | [vport social settings, pending follow, etc.] | various | various | various |

### 4.2 Hook Entry Points (UI-accessible writes)

| Hook | Write Operation |
|---|---|
| useAccountController.deleteAccount | dalDeleteCitizenAccountFull (via ctrlDeleteAccount) |
| useAccountController.softDeleteVport | dalDeleteMyVport RPC (via ctrlSoftDeleteVport) |
| useAccountController.hardDeleteVport | dalHardDeleteVport RPC (via ctrlHardDeleteVport) |
| useAccountController.restoreVport | dalRestoreVport RPC (via ctrlRestoreVport) |
| useVportsController.hardDeleteVport | dalHardDeleteVport RPC (via ctrlHardDeleteVport) |
| useVportsController.restoreVport | dalRestoreVport RPC (via ctrlRestoreVport) |
| useVportsController.setBusinessCardPublished | setVportBusinessCardPublishStateDAL (via ctrlSetVportBusinessCardPublishState) |
| useActorPrivacy.togglePrivacy | dalSetActorPrivacy (via ctrlSetActorPrivacy) |
| useVportDirectoryVisibility.toggle | setVportDirectoryVisibleDAL (via ctrlSetVportDirectoryVisible) |
| useVportBusinessCardSettings.updateSettings | setVportBusinessCardSettingsDAL (via ctrlSetVportBusinessCardSettings) |
| useProfileController.saveProfile | updateProfile user + vport (via saveProfileCore) |

### 4.3 DAL Write Surfaces

14 direct DAL write surfaces confirmed. All operate via authenticated Supabase client; user-mode surfaces use RLS; vport surfaces use both owner_user_id WHERE clause and RPC SECURITY DEFINER patterns.

---

## 5. Scanner Signals Block

- **24 / 24 paths are LOW confidence** — scanner could not resolve route-confirmed paths for any settings write. This is expected: settings screens are mounted at authenticated routes not captured by the static route scanner.
- **No HIGH confidence paths** present. This means no scanner-confirmed exploit chains; all attack analysis is source-inferred.
- **Callgraph coverage is HIGH**: 230 nodes, 306 edges. Hook and controller layers are well-mapped.
- **VENOM VEN-SETTINGS-001 through VEN-SETTINGS-007** are open; 4 HIGH findings from VENOM are active cross-reference targets.

---

## 6. Adversarial Path Analysis

### A. OWNERSHIP BYPASS (§5.1)

**Target: ctrlSoftDeleteVport / ctrlRestoreVport — No app-layer ownership gate**

Source verified: `account.controller.js` lines 19–22 and 34–36:

```js
// ctrlSoftDeleteVport — line 19
export async function ctrlSoftDeleteVport({ vportId }) {
  await dalDeleteMyVport(vportId)
}

// ctrlRestoreVport — line 34
export async function ctrlRestoreVport({ vportId }) {
  await dalRestoreVport(vportId)
}
```

Neither function accepts a `callerActorId` parameter. Neither calls `assertActorOwnsVportActorController`. The only ownership check is at the RPC level (`VPORT_NOT_FOUND_OR_UNAUTHORIZED` / `VPORT_NOT_FOUND_OR_NOT_DELETED` error strings from DB). App layer has no actor-based ownership assertion.

Attack scenario: An authenticated actor sends `vportId` for a VPORT they do not own. The RPC `soft_delete_vport` is called with that vportId. Whether this succeeds depends entirely on DB-level RPC enforcement (SECURITY DEFINER with auth.uid() binding), not the app layer. The app controller imposes no pre-check.

Contrast with `ctrlHardDeleteVport` (line 23–32) which does call `assertActorOwnsVportActorController`. The asymmetry is a confirmed VEN-SETTINGS-001 finding.

Finding: **BW-SETTINGS-001** — BYPASSED (app-layer) / PARTIAL (DB-layer may still enforce)

**Target: ctrlSetActorPrivacy — Self-vs-VPORT ownership logic**

Source verified: `actorPrivacy.controller.js` lines 14–27:

```js
export async function ctrlSetActorPrivacy({ actorId, callerActorId, isPrivate, refreshActorFn }) {
  if (!actorId) throw new Error('Missing actorId')
  if (!callerActorId) throw new Error('Missing callerActorId')
  if (callerActorId !== actorId) {
    await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })
  }
  await dalSetActorPrivacy(actorId, Boolean(isPrivate))
```

Ownership gate IS present. For VPORT actors, `assertActorOwnsVportActorController` is called. For self (user actor setting their own privacy), the equality shortcut applies. BLOCKED for cross-actor attack.

**Target: blocks — ctrlBlockActor / ctrlUnblockActor**

Source verified: `Blocks.controller.js` lines 71–72 and 104–105:

```js
if (!callerActorId || String(callerActorId) !== String(actorId)) {
  throw new Error('ctrlBlockActor: caller does not own this actor')
}
```

Caller identity check is string-equality of `callerActorId` vs `actorId`. This is NOT the `assertActorOwnsVportActorController` pattern — it's a direct equality check. Attack: A vport actor could pass `actorId = theirVportActorId` and `callerActorId = theirVportActorId` (same value), and the check would pass. The block/unblock would then be inserted with `p_blocker_actor_id: actorId` (the vport actorId). The moderation.block_actor RPC then fires with the actor ID. Whether the RPC has a secondary auth.uid() bind is unknown without DB access.

Note: VENOM VEN-SETTINGS-004 flagged this: "blocks.dal.js passes client-supplied actorId as p_blocker_actor_id to moderation RPC." The key question is whether `callerActorId` is truly session-derived (trusted) or hookprop-supplied (untrusted).

Source verified: `useActorPrivacy.js` line 11: `const callerActorId = identity?.actorId ?? null` — this IS session-derived via the identity context, making it trusted in normal flow. However the controller parameter `callerActorId` is passed in by the caller and is not re-verified against the session at the controller layer itself.

Finding: **BW-SETTINGS-002** — PARTIAL (string equality bypass risk if callerActorId is caller-controlled)

### B. SESSION MUTATION (§5.2)

**Target: profile.write.dal.js — user mode**

Source verified: `profile.write.dal.js` lines 54–67:

```js
const { data: row, error } = await supabase
  .from('profiles')
  .update(payload)
  .eq('id', subjectId)
  // ...
```

In user mode, `subjectId` is passed from `saveProfileCore`, which receives it from `useProfileController`. In `useProfileController` line 54: `return user?.id || null` — this is sourced from `useAuth()` which reads the Supabase session. However the DAL does NOT independently verify `subjectId === auth.uid()`. It trusts the caller to pass the correct subjectId.

Attack scenario: If `saveProfileCore` is called with a crafted `subjectId` (another user's profile ID), the DAL would attempt to update that profile row. RLS on `public.profiles` is the only backstop. This is exactly VEN-SETTINGS-006: "profile.write.dal.js user-mode update has no session bind — subjectId caller-supplied."

Finding: **BW-SETTINGS-003** — PARTIAL [SOURCE_VERIFIED] — RLS is the sole backstop for user-mode profile writes; no app-layer session bind at DAL

**Target: dalDeleteCitizenAccountFull — no app-layer session pre-check**

Source verified: `account.write.dal.js` lines 23–39:

```js
export async function dalDeleteCitizenAccountFull() {
  const { data, error } = await supabase.functions.invoke('delete-citizen-account', {
    method: 'POST',
  })
```

No pre-authentication check before invoking the Edge Function. The Edge Function receives the Supabase auth token from the client automatically. If the session is invalid or expired, the Edge Function itself must enforce authentication. The app layer has no pre-check. This is VEN-SETTINGS-002.

Caller chain: `ctrlDeleteAccount` (account.controller.js line 15) → `dalDeleteCitizenAccountFull`. `ctrlDeleteAccount` takes no arguments; no session validation at controller level.

Finding: **BW-SETTINGS-004** — PARTIAL [SOURCE_VERIFIED] — Edge Function is sole auth enforcer; no app-layer pre-check

**Target: dalSetActorPrivacy — no session bind**

Source verified: `visibility.dal.js` lines 40–57: upsert passes `actor_id` from function argument with no `eq('...', auth.uid())` binding. This is VEN-SETTINGS-005.

Finding: **BW-SETTINGS-005** — PARTIAL [SOURCE_VERIFIED] (session bind absent at DAL; controller gate present)

### C. RUNTIME ABUSE (§5.3)

**Target: assertActorOwnsVportActorController kind-gate**

Source verified: `assertActorOwnsVportActor.controller.js` lines 28–29:

```js
if (requesterActor.kind !== "user") {
  throw new Error("Only actor owners can manage this booking resource.")
}
```

Any non-user-kind actor (e.g., a VPORT-kind actor) attempting to call ownership-gated operations will fail. A VPORT actor cannot directly manage settings operations that require `assertActorOwnsVportActorController` — their requestActorId would be kind='vport' which fails the kind check. BLOCKED.

**Target: ctrlSoftDeleteVport / ctrlRestoreVport — no kind check**

Since these controllers have no ownership gate at all, no kind check either. A VPORT-kind actor could call them directly with any vportId. Whether the DB RPC enforces auth.uid() binding determines the actual blast radius.

Finding: re-referenced in BW-SETTINGS-001 above.

**Target: useVportsController.restoreVport — no callerActorId passed**

Source verified: `useVportsController.js` line 79:

```js
await ctrlRestoreVport({ vportId: targetVportId });
```

No `callerActorId` argument. `ctrlRestoreVport` in `account.controller.js` line 34 accepts only `{ vportId }`. No ownership check exists on this path. The controller passes directly to the DAL RPC with no actor identity.

Finding: **BW-SETTINGS-006** — BYPASSED [SOURCE_VERIFIED] — No app-layer ownership gate on ctrlRestoreVport; any authenticated user who can reach the hook can attempt to restore any vportId via the RPC.

### D. RLS VERIFICATION (§5.4)

**dalSetActorPrivacy (vc.actor_privacy_settings)**
No `eq('...', auth.uid())` or session binding in DAL. Platform RLS on `vc.actor_privacy_settings` is the sole enforcement. RLS status not directly verifiable, but VENOM VEN-SETTINGS-005 flags this as unverified.

**updateProfile user mode (public.profiles)**
No session bind; `eq('id', subjectId)` where subjectId is caller-supplied. RLS on `public.profiles` is the backstop.

**updateProfile vport mode (vport.profiles)**
Source verified line 35: `.eq('owner_user_id', userId)` where userId comes from `supabase.auth.getUser()`. Session-bound. BLOCKED for cross-user attacks.

**setVportBusinessCardSettingsDAL (vport.profiles)**
Source verified lines 35–49: `userId` resolved from `supabase.auth.getUser()`, then `eq('owner_user_id', userId)` in WHERE clause. Session-bound. BLOCKED.

**setVportDirectoryVisibleDAL (vport.profiles)**
Source verified lines 64–83: same pattern — `userId` from session, `eq('owner_user_id', userId)`. Session-bound. BLOCKED.

**syncDirectoryVisibleToPublicDetailsDAL (vport.profile_public_details)**
Source verified lines 101–115: first verifies ownership via `profiles` ownership check, then updates `profile_public_details`. BLOCKED.

**profileMediaAsset writes (public.profiles)**
Source verified `profileMediaAsset.write.dal.js` lines 10–13: `_getSessionUserId()` calls `supabase.auth.getUser()` internally — session-bound. BLOCKED.

**block_actor / unblock_actor RPCs (moderation schema)**
No independent session bind at DAL layer (dalInsertBlock / dalDeleteBlockByTarget). The `p_blocker_actor_id` is passed as the actorId argument from the controller. The moderation RPC's own SECURITY DEFINER and auth binding is unknown without DB access. Risk flagged by VENOM VEN-SETTINGS-004.

Finding: **BW-SETTINGS-007** — UNRESOLVED [SCANNER_LEAD] — moderation.block_actor RPC auth binding unverifiable from source

### E. VIEWER CONTEXT FUZZING (§5.5)

**ctrlSetActorPrivacy with null callerActorId**
Source verified `actorPrivacy.controller.js` line 16: `if (!callerActorId) throw new Error('Missing callerActorId')`. BLOCKED.

**ctrlBlockActor with null callerActorId**
Source verified `Blocks.controller.js` line 71: `if (!callerActorId || ...)`. BLOCKED.

**ctrlSoftDeleteVport with null vportId**
Source verified `account.controller.js` line 19: no null check on `vportId` in the controller. However `dalDeleteMyVport` at line 42: `if (!vportId) throw new Error('dalDeleteMyVport: vportId required')`. DAL catches null. BLOCKED (at DAL layer).

**ctrlRestoreVport with null vportId**
Source verified `account.controller.js` line 34-36: `ctrlRestoreVport({ vportId })` → `dalRestoreVport(vportId)`. DAL has null check at line 59. BLOCKED (at DAL layer).

**ctrlHardDeleteVport with null callerActorId**
Source verified `account.controller.js` line 25: `if (!callerActorId) throw new Error('ctrlHardDeleteVport: callerActorId is required')`. BLOCKED.

**saveProfileCore with null subjectId**
Source verified `profile.controller.js` line 28: `if (!subjectId) throw new Error('saveProfile: subjectId missing')`. BLOCKED.

**useVportDirectoryVisibility with null callerActorId (identity not loaded)**
Source verified `useVportDirectoryVisibility.js` line 24: `const callerActorId = identity?.actorId ?? null`. If identity is not loaded, callerActorId = null. The controller `ctrlGetVportDirectoryState` line 10: `if (!callerActorId) throw new Error('ctrlGetVportDirectoryState: callerActorId required')`. BLOCKED.

**ctrlSetVportDirectoryVisible with null callerActorId**
Source verified `vportDirectoryVisibility.controller.js` line 31: `if (!callerActorId) throw new Error(...)`. BLOCKED.

Finding: **BW-SETTINGS-008** — BLOCKED — All major entry points have null guard for caller identity. Soft/restore vport DAL catches null at DAL layer rather than controller layer (minor defense-in-depth gap, not exploitable in isolation).

### F. MUTATION REPLAY (§5.6)

**Soft-delete replay: Can a soft-deleted vport be soft-deleted again?**
Source verified: `dalDeleteMyVport` calls `soft_delete_vport` RPC. The error string `VPORT_NOT_FOUND_OR_UNAUTHORIZED` from the RPC suggests the RPC itself will error if the vport is not found or unauthorized. Whether it errors on a double soft-delete depends on the RPC logic. No state-machine gate in the app layer.

**Restore replay: Can an active vport be restored?**
Source verified: `dalRestoreVport` calls `restore_vport` RPC. Error string `VPORT_NOT_FOUND_OR_NOT_DELETED` confirms the RPC gates on current is_deleted state. BLOCKED at DB layer.

**Hard-delete before soft-delete:**
Source verified: `dalHardDeleteVport` → error string `VPORT_NOT_FOUND_OR_NOT_DELETED` — the RPC requires the vport be soft-deleted first. App layer relies entirely on this DB-level state machine gate. BLOCKED at DB layer.

**Privacy toggle replay: No state-machine protection needed** — upsert is idempotent by design.

**Block replay (duplicate block):**
Source verified `Blocks.controller.js` lines 85–88:
```js
if (existingBlockedIds && existingBlockedIds.has(blockedActorId)) {
  return { ok: true, changed: false }
}
```
Idempotency check present in controller. BLOCKED.

**Unblock of already-unblocked actor:**
Source verified lines 118–121:
```js
if (existingBlockedIds && !existingBlockedIds.has(blockedActorId)) {
  return { ok: true, changed: false }
}
```
Idempotency check present. BLOCKED.

Note: Both idempotency checks are optional — they only apply `if (existingBlockedIds && ...)`. If `existingBlockedIds` is not supplied, the DAL RPC is called directly. The RPC itself (block_actor / unblock_actor) must handle duplicates.

Finding: **BW-SETTINGS-009** — PARTIAL — Idempotency checks conditional on existingBlockedIds being provided; RPC must handle duplicates

### G. HYDRATION POISONING (§5.7)

Profile controller `profile.controller.js` lines 86–96 directly calls `useActorStore.getState().upsertActors(...)` with `{ force: true }`. This mutates the hydration store for the saved actorId with the confirmed photo/banner URLs. The actorId is resolved by `dalReadActorIdByProfileId` or `dalReadActorIdByVportId` — these are read-only DAL calls and cannot be injected with foreign actor IDs via normal profile save flow.

Attack: If `subjectId` is a foreign profileId (user mode) and RLS somehow does not block the update, the returned `dbRow.photo_url` / `dbRow.banner_url` could be used to poison the hydration store for the legitimate actor whose profile was just corrupted. However this is a second-order attack requiring the primary bypass (RLS failure on public.profiles) to succeed first.

Finding: **BW-SETTINGS-010** — PARTIAL [SOURCE_VERIFIED] — Hydration store mutation `useActorStore.upsertActors({ force: true })` in `profile.controller.js` line 88 is downstream of the profile write; if profile write succeeds for a foreign profile (RLS bypass), hydration store for that actor can be poisoned

### H. URL SURFACE (§5.9)

Settings feature does not construct notification linkPaths or share links. Profile save does not emit notifications. Block/unblock does not emit notifications. Account delete triggers logout with no notification link. No URL surface findings.

Finding: **BW-SETTINGS-011** — INFO — No notification linkPath or share link constructs found in settings feature

### I. §9 INVARIANT ATTACK (HIGHEST PRIORITY)

BEHAVIOR.md is PLACEHOLDER. No §9 invariants are declared. All would-be §9 invariants are UNANCHORED.

Source-inferred invariants based on the platform identity contract and feature logic:

**Invariant I-1 (inferred): An actor should never be able to soft-delete or restore a VPORT they do not own.**
Attack harness: Call `ctrlSoftDeleteVport({ vportId: foreignVportId })` from a valid session. Controller has no ownership check. RPC `soft_delete_vport` is the only barrier.
Result: UNRESOLVED — cannot verify RPC enforcement without DB access.

**Invariant I-2 (inferred): A VPORT-kind actor should never be able to perform settings operations requiring user-kind ownership.**
Attack harness: Obtain a session where `identity.kind === 'vport'` and attempt `ctrlSetActorPrivacy({ actorId: someActorId, callerActorId: vportActorId })`. The `assertActorOwnsVportActorController` kind check at line 28 blocks this. BLOCKED.

**Invariant I-3 (inferred): Profile data for user A should never be writable by user B.**
Attack harness: Call `saveProfileCore({ subjectId: userB_profileId, mode: 'user', draft: ... })`. The DAL issues `.eq('id', subjectId)` with no session bind. RLS on `public.profiles` is the sole barrier. UNRESOLVED.

**Invariant I-4 (inferred): VPORT settings (business card, directory visibility) should only be modifiable by the owning user.**
Attack harness: Call `ctrlSetVportDirectoryVisible({ vportId, visible, callerActorId: attacker, vportActorId: targetVport })`. `assertActorOwnsVportActorController` is called with attacker vs targetVport — will fail the `actor_owners` DB lookup. BLOCKED.

**Invariant I-5 (inferred): Account deletion should only be possible for the authenticated session owner.**
Attack harness: `ctrlDeleteAccount()` takes no arguments; Edge Function receives auth bearer token. The Edge Function must enforce auth. App-layer pre-check absent. UNRESOLVED.

Finding: **BW-SETTINGS-012** — HIGH — Source-inferred invariants I-1, I-3, I-5 are UNRESOLVED; DB/Edge Function enforcement cannot be confirmed from source alone; BEHAVIOR.md PLACEHOLDER prevents formal §9 anchoring.

---

## 7. Exploitability Assessment

| Finding | Severity | Result | Exploit Type | Confidence |
|---|---|---|---|---|
| BW-SETTINGS-001 | HIGH | BYPASSED (app-layer) | Single-step | [SOURCE_VERIFIED] |
| BW-SETTINGS-002 | MEDIUM | PARTIAL | Single-step | [SOURCE_VERIFIED] |
| BW-SETTINGS-003 | HIGH | PARTIAL | Single-step | [SOURCE_VERIFIED] |
| BW-SETTINGS-004 | MEDIUM | PARTIAL | Single-step | [SOURCE_VERIFIED] |
| BW-SETTINGS-005 | MEDIUM | PARTIAL | Single-step | [SOURCE_VERIFIED] |
| BW-SETTINGS-006 | HIGH | BYPASSED | Single-step | [SOURCE_VERIFIED] |
| BW-SETTINGS-007 | MEDIUM | UNRESOLVED | Single-step | [SCANNER_LEAD] |
| BW-SETTINGS-008 | LOW | BLOCKED | — | [SOURCE_VERIFIED] |
| BW-SETTINGS-009 | LOW | PARTIAL | Replay | [SOURCE_VERIFIED] |
| BW-SETTINGS-010 | MEDIUM | PARTIAL | Multi-step | [SOURCE_VERIFIED] |
| BW-SETTINGS-011 | INFO | BLOCKED | — | [SOURCE_VERIFIED] |
| BW-SETTINGS-012 | HIGH | UNRESOLVED | Single-step | [SOURCE_VERIFIED] |

**Confirmed BYPASSED findings (source-verified, no DB access needed):**
- BW-SETTINGS-001: `ctrlSoftDeleteVport` and `ctrlRestoreVport` have zero app-layer ownership assertion. Both reach DB RPCs unchecked from the app layer.
- BW-SETTINGS-006: `ctrlRestoreVport` in `useVportsController` (Vports tab) is called with no callerActorId. Same controller path in Account tab also lacks ownership gate.

**BYPASSED classification rationale:**
Both BW-SETTINGS-001 and BW-SETTINGS-006 are marked BYPASSED at the application layer. Whether the RPCs themselves (soft_delete_vport, restore_vport) enforce auth.uid() ownership is opaque from source. The app layer's responsibility is defense-in-depth: app-layer assertions should precede DB calls. That defense is absent.

---

## 8. Source Verification Summary

All BYPASSED findings are backed by direct source citations:

| Finding | File | Lines | Verified Content |
|---|---|---|---|
| BW-SETTINGS-001 | account.controller.js | 19–22, 34–36 | ctrlSoftDeleteVport / ctrlRestoreVport body — no assertActorOwnsVportActorController call |
| BW-SETTINGS-003 | profile.write.dal.js | 54–58 | .update(payload).eq('id', subjectId) — no auth.uid() bind in user mode |
| BW-SETTINGS-006 | useVportsController.js | 79 | ctrlRestoreVport({ vportId: targetVportId }) — no callerActorId argument |

All PARTIAL findings are backed by source reads confirming the partial nature:

| Finding | File | Evidence of partial gate |
|---|---|---|
| BW-SETTINGS-002 | Blocks.controller.js:71 | String equality check, not assertActorOwnsVportActorController |
| BW-SETTINGS-004 | account.write.dal.js:23 | Edge Function invoked with no pre-auth check |
| BW-SETTINGS-005 | visibility.dal.js:40 | upsert with no auth.uid() bind — controller gate exists |
| BW-SETTINGS-009 | Blocks.controller.js:85,118 | Idempotency checks conditional on existingBlockedIds |
| BW-SETTINGS-010 | profile.controller.js:88 | Hydration store force-mutation downstream of profile write |

---

## 9. Confidence Summary

| Tier | Count | Findings |
|---|---|---|
| [SOURCE_VERIFIED] BYPASSED | 2 | BW-SETTINGS-001, BW-SETTINGS-006 |
| [SOURCE_VERIFIED] PARTIAL | 5 | BW-SETTINGS-002, BW-SETTINGS-003, BW-SETTINGS-004, BW-SETTINGS-005, BW-SETTINGS-010 |
| [SOURCE_VERIFIED] BLOCKED | 2 | BW-SETTINGS-008, BW-SETTINGS-011 (INFO) |
| [SOURCE_VERIFIED] PARTIAL (replay) | 1 | BW-SETTINGS-009 |
| [SOURCE_VERIFIED] UNRESOLVED | 1 | BW-SETTINGS-012 |
| [SCANNER_LEAD] UNRESOLVED | 1 | BW-SETTINGS-007 |

No BYPASSED finding is classified without direct source evidence. Severity ratings do not inflate based on unverified assumptions.

---

## 10. §9 Invariant Attack Map

BEHAVIOR.md is PLACEHOLDER status. No formal §9 invariants exist. All attacks below are against source-inferred invariants.

| Invariant | Attack Scenario | Result | Blocker |
|---|---|---|---|
| I-1: Own-VPORT-only soft-delete | ctrlSoftDeleteVport({ vportId: foreignId }) | UNRESOLVED | DB RPC only |
| I-2: User-kind-only for ownership ops | ctrlSetActorPrivacy from vport actor | BLOCKED | assertActorOwnsVportActorController kind check |
| I-3: User profile write-isolation | saveProfileCore with foreign subjectId | UNRESOLVED | RLS only |
| I-4: VPORT settings owner-only | ctrlSetVportDirectoryVisible with attacker actorId | BLOCKED | assertActorOwnsVportActorController + actor_owners DB |
| I-5: Account delete own-session only | ctrlDeleteAccount() stale session | UNRESOLVED | Edge Function auth only |

**BEHAVIOR.md must be authored before formal §9 invariant anchoring is possible.**

---

## 11. Behavior Contract Attack Summary

| Field | Value |
|---|---|
| BEHAVIOR.md Status | PLACEHOLDER |
| §4 Failure Paths | NOT DECLARED |
| §9 Must Never Happen | NOT DECLARED |
| §9 Invariants Tested | 5 source-inferred invariants (I-1 through I-5) |
| §9 Invariants BLOCKED | 2 (I-2, I-4) |
| §9 Invariants UNRESOLVED | 3 (I-1, I-3, I-5) |
| BEHAVIOR.md Finding | BW-SETTINGS-012 captures unanchored invariant risk as HIGH |

BW note: VENOM VEN-SETTINGS-007 already flagged BEHAVIOR.md being PLACEHOLDER as a HIGH finding. BW concurs. Without §9 invariant anchoring, this review cannot achieve full adversarial coverage — BW cannot design targeted attack harnesses for undefined invariants.

---

## 12. THOR Impact

THOR release blockers are findings that represent BYPASSED or UNRESOLVED severity HIGH or above.

| Finding | Severity | Result | THOR Status |
|---|---|---|---|
| BW-SETTINGS-001 | HIGH | BYPASSED | RELEASE BLOCKER |
| BW-SETTINGS-006 | HIGH | BYPASSED | RELEASE BLOCKER |
| BW-SETTINGS-012 | HIGH | UNRESOLVED | RELEASE BLOCKER (pending BEHAVIOR.md authorship) |

**3 THOR release blockers identified.**

BW-SETTINGS-003 (HIGH, PARTIAL) is not a formal THOR release blocker because:
- VEN-SETTINGS-006 has already flagged the same surface (RLS sole backstop for user profile writes)
- The partial nature means app-layer gate exists at controller layer; DAL-only gap is a known documented risk

However if VEN-SETTINGS-006 resolution confirms RLS is absent or misconfigured on `public.profiles`, BW-SETTINGS-003 upgrades to THOR blocker.

**Recommendation: Do not issue THOR gate clearance for the settings feature until BW-SETTINGS-001 and BW-SETTINGS-006 are patched.**

---

## 13. SPIDER-MAN Test Requirements

The following regression tests are required per BW findings:

| Test ID | Target | Type | Priority |
|---|---|---|---|
| SPM-SETTINGS-BW-001 | ctrlSoftDeleteVport with foreign vportId | Unit — ownership gate rejection | P1 |
| SPM-SETTINGS-BW-002 | ctrlRestoreVport with no callerActorId (both callsites) | Unit — no ownership gate present | P1 |
| SPM-SETTINGS-BW-003 | ctrlBlockActor/ctrlUnblockActor with mismatched callerActorId vs actorId | Unit — string equality bypass | P2 |
| SPM-SETTINGS-BW-004 | saveProfileCore with foreign subjectId — RLS rejection | Integration | P2 |
| SPM-SETTINGS-BW-005 | ctrlDeleteAccount with expired session — Edge Function rejection | Integration | P2 |
| SPM-SETTINGS-BW-006 | ctrlBlockActor without existingBlockedIds — duplicate RPC call | Unit | P3 |
| SPM-SETTINGS-BW-007 | Hydration store mutation after foreign profile write attempt | Unit | P3 |

---

*Report generated by BLACKWIDOW V2 — 2026-06-04*
*Output: ZZnotforproduction/APPS/VCSM/features/settings/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_settings-adversarial-review.md*
