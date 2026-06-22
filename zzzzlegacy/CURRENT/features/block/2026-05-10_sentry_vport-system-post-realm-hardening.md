# SENTRY — VPORT System Post Realm Hardening

**Date:** 2026-05-10
**Scope:** VCSM — feed/dal, vport/controller/gas, vport/controller/menu
**Trigger:** Post-execution review — Slice 1 of VPORT system post hardening
**Status: ALIGNED**

---

## Files Reviewed

### 1. `apps/VCSM/src/features/feed/dal/resolvePublicRealm.dal.js` (NEW)

**Layer:** DAL — ALIGNED

- Queries `vc.realms` with explicit column select (`id`) — follows DAL contract
- Module-scoped cache (`_cachedPublicRealmId`) — acceptable for a stable, singleton row lookup; not business logic
- Returns null on error; caller is responsible for early-exit on null — clean fail-closed pattern
- No business rules, no React, no UI — pure DB access
- Single responsibility: resolve the canonical public realm ID

**Verdict: ALIGNED**

---

### 2. `apps/VCSM/src/features/profiles/kinds/vport/controller/gas/publishFuelPriceUpdateAsPost.controller.js` (MODIFIED)

**Layer:** Controller — ALIGNED

- Removed hardcoded `PUBLIC_REALM_ID` UUID — correct
- Added `resolvePublicRealmIdDAL()` call at controller top — controller coordinating DAL calls is correct
- Early return `{ published: false, reason: "missing_public_realm" }` if realm not found — fail-closed, non-blocking
- Dedup check before write — ordering preserved (check → resolve name → build text → create post)
- No React, no UI concerns
- All Supabase access via DAL imports, not direct in controller

**Cross-feature import note:**
This controller imports `resolvePublicRealmIdDAL` from `@/features/feed/dal/`. This is technically a cross-feature DAL import (vport/controller → feed/dal), which ideally would flow through an adapter boundary. However:
- `resolvePublicRealmIdDAL` is infrastructure-level, not feed-domain logic
- No feed-specific business rules are consumed — it's a single table lookup for a singleton config row
- Promoting it to `shared/lib/` or `services/` would be the architecturally cleaner path long-term

**Ruling:** Minor pragmatic deviation. Acceptable for current stage. Future recommendation: move `resolvePublicRealmIdDAL` to `shared/lib/realm/` or `services/realm/` when more cross-feature consumers emerge.

**Verdict: ALIGNED (with minor cross-feature import note)**

---

### 3. `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/publishMenuUpdateAsPost.controller.js` (MODIFIED)

**Layer:** Controller — ALIGNED

- Same hardening pattern as gas controller — consistent
- Removed hardcoded UUID, added `resolvePublicRealmIdDAL` call
- `imageUrl` param correctly threaded to `createSystemPost` as `media_url`
- `media_url: imageUrl || null` — correct null-coalescing (avoids empty string)
- Same cross-feature import note applies as gas controller

**Verdict: ALIGNED (with same cross-feature import note)**

---

## Summary

| File | Status | Notes |
|------|--------|-------|
| `feed/dal/resolvePublicRealm.dal.js` | ALIGNED | Clean DAL, module cache, fail-closed |
| `controller/gas/publishFuelPriceUpdateAsPost.controller.js` | ALIGNED | Hardened, minor cross-feature import |
| `controller/menu/publishMenuUpdateAsPost.controller.js` | ALIGNED | Hardened, minor cross-feature import |

**Overall SENTRY Status: ALIGNED**

---

## Follow-Up Recommendations

1. **Future:** If more features need `resolvePublicRealmIdDAL`, move it to `shared/lib/realm/resolvePublicRealm.js` — the DAL label is slightly misleading for a config lookup that multiple feature controllers will consume.
2. **No immediate action required** — current placement is pragmatic and architecturally sound for the single-consumer case.

---

## Void Realm Safety Confirmation

Both controllers now resolve the realm via `resolvePublicRealmIdDAL()` which queries `vc.realms WHERE slug = 'public'`. This is completely independent of the viewer's session `realmId`. When the Void realm is launched:
- A void viewer's session will carry a void `realmId`
- VPORT system posts will continue to target the public realm correctly
- No code change will be required in either controller
