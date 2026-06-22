# ARCHITECT Evidence Bundle — vport
Generated: 2026-06-07T08:45:00
Scope: VCSM:vport
Command: ARCHITECT V2
Scanner Version: 1.1.0

---

## Source Files Read

| File | Layer | Lines |
|---|---|---|
| apps/VCSM/src/features/vport/dal/vport.core.dal.js | dal | 1-293 |
| apps/VCSM/src/features/vport/controllers/vportCoreOps.controller.js | controller | 1-3 |

---

## Layer Counts (from callgraph)

| Layer | Count |
|---|---|
| controller | 2 |
| dal | 21 |
| hook | 5 |
| model | 6 |
| barrel | 15 |
| module | 45 |
| screen | 3 |
| **Total** | **100** |

---

## Call Chains

### CHAIN-vport-001: Create VPORT
```
useCreateVport → submitCreateVport.controller → vport.core.dal::createVport → {
  requireUser() [session check — throws if no auth]
  vportSchema.rpc("create_vport", {...}) [DB auth enforced in RPC]
  refreshVcActorDirectory(actor_id) [post-create identity sync]
}
```
Ownership checked: YES (requireUser + RPC AUTH_REQUIRED enforcement)
Confidence: HIGH [SOURCE_VERIFIED]

### CHAIN-vport-002: Update VPORT
```
[caller] → vport.core.dal::updateVport(vportId, patch) → {
  requireUser() [confirms auth session only]
  vportSchema.from("profiles").update(patch).eq("id", vportId) [RLS sole protection]
}
```
User-controlled params: vportId, name, slug, avatarUrl, bannerUrl, bio, is_active
Ownership checked: PARTIAL — requireUser() confirms auth; RLS enforces owner_user_id = auth.uid()
App-layer ownership check: ABSENT
Confidence: HIGH [SOURCE_VERIFIED]
⚠️ SECURITY NOTE: RLS on vport.profiles must enforce owner_user_id = auth.uid() on UPDATE

### CHAIN-vport-003: Soft/Hard Delete VPORT
```
useVportCoreOps → vportCoreOps.controller → vport.core.dal::{softDeleteVport|hardDeleteVport} → {
  vportSchema.rpc("soft_delete_vport" | "hard_delete_vport", {p_vport_id: vportId})
  [requireUser() NOT called — auth fully delegated to RPC]
}
```
Ownership checked: RPC only (AUTH_REQUIRED error on failure)
App-layer session check: ABSENT
Confidence: HIGH [SOURCE_VERIFIED]
⚠️ SECURITY NOTE: If RPC auth check fails or has a bypass, unauthenticated delete is possible

### CHAIN-vport-004: Restore VPORT
```
useRestoreVport → vport.core.dal::restoreVport(vportId) → {
  vportSchema.rpc("restore_vport", {p_vport_id: vportId})
  [requireUser() NOT called]
}
```
Same risk profile as CHAIN-vport-003.

---

## Security-Sensitive Surfaces

| Surface | File | Risk | Priority |
|---|---|---|---|
| updateVport | vport.core.dal.js:183 | RLS-only ownership | HIGH |
| softDeleteVport | vport.core.dal.js:231 | No app-layer session check | HIGH |
| hardDeleteVport | vport.core.dal.js:248 | No app-layer session check | HIGH |
| restoreVport | vport.core.dal.js:265 | No app-layer session check | HIGH |
| create_vport RPC | vport.core.dal.js:73 | Auth in RPC | MEDIUM |

---

## Database Writes

| DAL | Operation | Table/RPC | Ownership Check | Note |
|---|---|---|---|---|
| vport.core.dal::createVport | RPC | create_vport | YES (requireUser + RPC) | ✅ |
| vport.core.dal::updateVport | UPDATE | vport.profiles | PARTIAL (RLS only) | ⚠️ |
| vport.core.dal::softDeleteVport | RPC | soft_delete_vport | RPC only | ⚠️ |
| vport.core.dal::hardDeleteVport | RPC | hard_delete_vport | RPC only | ⚠️ |
| vport.core.dal::restoreVport | RPC | restore_vport | RPC only | ⚠️ |
| vport.write.profileMedia.dal.js | UPDATE | vport.profiles | UNKNOWN | NEEDS_VERIFY |

---

## Engine Dependencies

| Engine | Used By |
|---|---|
| @identity (via identityOps.adapter) | vport.core.dal.js::createVport (refreshVcActorDirectory) |
| @notifications | vport/adapters (per engine-candidates) |
| @booking | vport (per engine-candidates — booking consumers include VCSM:vport) |

---

## Provenance
- Source maps consumed: callgraph, write-surface-map, rpc-map, dependency-map
- Source files validated: 2
- Confidence: HIGH
