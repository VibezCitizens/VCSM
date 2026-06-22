# Feature Contract: media

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 9 (scanner 2026-06-05)  
**Inbound imports:** 19  
**Outbound imports:** 1  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`media` is the engine adapter for the VCSM media system. It provides a feature-layer bridge to the `@media` engine, enabling other features to access media capabilities (upload, fetch, optimize) without importing the engine directly.

`media` is a **platform primitive** consumed by any feature that handles images, videos, or files.

---

## 2. Non-Goals

`media` must not own:
- Upload pipeline orchestration — that belongs to `upload/`
- Media asset ownership decisions — that is a Controller responsibility in the consuming feature
- Serving or CDN configuration — that is infrastructure

---

## 3. Public API / Adapter Boundary

**Known adapter:**
- `apps/VCSM/src/features/media/adapters/` — TODO: confirm exact file name
- The feature also has `setup.js` which configures the media engine at startup

Consumers (19 inbound imports from scanner):
- `chat/`, `dashboard/`, `profiles/`, `post/`, `booking/`, `upload/`, and others — all confirmed by scanner data

**Note:** The `@media` alias referenced in the scanner artifact for `useMenuItemPhotoUpload.js` (profiles→notifications Pair 11) likely resolves to the media engine (`engines/media/`), not to the `notifications/runtime/index.js`. This must be verified via ARCH-BIDIR-VERIFY-001.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `media/adapters/` | Engine bridge — primary export surface |
| setup | `media/setup.js` | Engine DI configuration — targeted for migration to `app/setup/` via ARCH-ENGINESETUP-001 |

Total: 9 files. With `setup.js` confirmed and the adapter file, the remaining files span adapter utilities and type definitions.

---

## 5. Allowed Dependencies

Scanner shows 1 outbound import. The specific target is unconfirmed from available data.

`media` is a near-terminal feature — it primarily imports from the media engine, not from other feature modules.

---

## 6. Prohibited Dependencies

`media` must not import from:
- `upload/` — upload is a higher-layer concern
- `profiles/`, `post/`, `feed/` — content features
- Any feature that represents a business domain above the media infrastructure layer

---

## 7. DAL / Controller Rules

`media` uses the engine resolver/adapter pattern, not a full DAL stack.

If `media/` contains any DAL-like functions:
- They must access Supabase platform.media_assets (or equivalent) using explicit column projections
- They must not derive ownership or access flags
- They must not query `vc.actor_owners`

**Security note:** TICKET-PLATFORM-RLS-001 documents that `platform.media_assets` has a `{public}` policy for `media_assets_learning_owner_update` that may require cleanup. Coordinate media DAL changes with this ticket.

---

## 8. Known Coupling

- 19 features consume `media/` (inbound) — media is one of the most-consumed platform primitives
- 1 outbound import — TODO: identify target

No violations. All consumption is through the media adapter.

---

## 9. Risk Notes

**LOW.** Zero violations. Clean engine adapter pattern.

The main risk is the open RLS ticket (TICKET-PLATFORM-RLS-001) which may affect media asset access policy. This is not a feature-level architecture risk but a database governance risk.

---

## 10. Migration Notes

`media/setup.js` targeted for migration to `app/setup/media.setup.js` per ARCH-ENGINESETUP-001. After migration, evaluate whether the remaining `media/` files (adapters) should stay or merge with the engine layer.

---

## 11. Unknowns

- TODO: Confirm exact adapter file names in `media/adapters/`
- TODO: Identify the 1 outbound import from media (what feature does media import from?)
- TODO: Verify `@media` alias in vite config (ARCH-BIDIR-VERIFY-001) — confirm it resolves to `engines/media/`, not `features/media/`
