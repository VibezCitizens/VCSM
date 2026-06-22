# Feature Contract: settings

**Status:** VIOLATIONS  
**Risk:** MEDIUM  
**Files:** 91 (scanner 2026-06-05)  
**Inbound imports:** 16  
**Outbound imports:** 30  
**Violations:** 5  
**Split candidate:** NO (but high fan-out warrants monitoring)

---

## 1. Purpose

`settings` owns all user and VPORT configuration screens:
- Account settings (email, password, notifications)
- Privacy settings (follower permissions, signal visibility)
- Profile settings (display name, avatar, bio)
- VPORT settings (directory visibility, business card, social settings)
- Vport creation modal
- QR code display modal

`settings` has 30 outbound imports — the widest fan-out of any non-God-feature. It imports from `vport`, `social`, `public`, `upload`, `media`, `identity`, `auth`, `ads`, `notifications`, `dashboard`, `profiles`, and others.

---

## 2. Non-Goals

`settings` must not own:
- Social privacy enforcement — that is `social/` and RLS
- Vport business logic — that is `vport/`
- QR code generation — that is `dashboard/qrcode/`
- Business card rendering (public-facing) — that is `public/`
- Profile display — that is `profiles/`

---

## 3. Public API / Adapter Boundary

**Known adapters (confirmed by scanner):**
- `settings/adapters/settings.adapter` — consumed by `vport/hooks/useRestoreVport.js`
- `settings/adapters/ui/Card.adapter` — consumed by `dashboard/cards/settings/VportSettingsScreen.jsx` and `professional/enterprise/ui/` (3 files)
- `settings/adapters/profile/ui/VportAboutDetails.view.adapter` — consumed by `dashboard/cards/settings/VportSettingsScreen.jsx`

**Hooks NOT yet in settings adapters (violations):**
- `settings/vports/hooks/useVportDirectoryVisibility` — consumed by dashboard without adapter
- `settings/vports/hooks/useVportBusinessCardSettings` — consumed by dashboard without adapter
- `settings/vports/hooks/useResolvedVportId` — consumed by dashboard without adapter

These 3 hooks must be added to `settings/adapters/` via ARCH-BIDIR-SETTINGS-001.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `settings/adapters/` | `settings.adapter`, `ui/Card.adapter`, `profile/ui/VportAboutDetails.view.adapter` confirmed |
| hooks | `settings/hooks/` | Account/profile hooks |
| hooks/vports | `settings/vports/hooks/` | Vport-specific settings hooks — 3 missing adapter exports |
| controllers | `settings/controller/` | Settings mutation controllers |
| dal | `settings/dal/` | Settings data access |
| queries | `settings/queries/` | 6 files — non-standard layer name (ARCH-NAMING-001: fold into `dal/`) |
| model | `settings/model/` | Settings data shapes |
| screens | `settings/screens/` | TODO: confirm `screen/` or `screens/` |
| ui | `settings/vports/ui/` | `VportsTab.view.jsx`, `VportsQrModal.jsx`, `VportsCreateModal.jsx` |
| styles | `settings/styles/` | `settings-modern.css` — MUST MOVE to `shared/styles/` |

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `vport` | Settings manages vport operations — BIDIR SAFE (Pair 15) | YES — through `vport/adapters/vport.adapter` and `vport.public.adapter` |
| `social` | Social privacy settings — VIOLATIONS PRESENT | MIXED — 2 direct DAL imports (violations) |
| `public` | Business card settings model — VIOLATION PRESENT | MIXED — 1 model import (violation) |
| `ads` | Ads settings display | YES — `settings/vports/ui/VportsTab.view.jsx` → `ads/adapters/widgets/OnemoredaysAd.adapter` (CLEAN) |
| `dashboard` | QR modal uses qrcode adapter — BIDIR SAFE (Pair 7) | YES — `VportsQrModal.jsx` → `dashboard/qrcode/adapters/qrcode.adapter` (CLEAN) |
| `upload` | Avatar/media upload in settings | Confirmed by outbound count |
| `media` | Media access | Confirmed by outbound count |
| `identity` | Active actor | Confirmed by outbound count |
| `auth` | Auth context | Confirmed by outbound count |
| `notifications` | Notification preferences | Confirmed by outbound count |

---

## 6. Prohibited Dependencies

`settings` must not import from:
- `social/privacy/dal/` directly — VIOLATION (currently happening — 2 files)
- `public/vportBusinessCard/model/` directly — VIOLATION (currently happening — 1 file)
- `profiles/` internals — must use `profiles/adapters/`
- `feed/`, `post/` — content features
- `dashboard/` internals — dashboard imports settings, not the reverse (except through qrcode adapter)

---

## 7. DAL / Controller Rules

**DAL rules for `settings/dal/`:**
- May query account settings tables
- Must not query social privacy tables — social privacy DAL belongs to `social/`
- Must not query vport tables directly — use `vport/adapters/`
- Must use explicit column projections

**Controller rules for `settings/controller/vportSocialSettings.controller.js`:**
- VIOLATION: Currently imports `social/privacy/dal/actorSocialSettings.dal` and `social/privacy/dal/actorSocialPublicPolicy.dal` directly
- This controller configures vport social settings (follower permissions, signal visibility)
- Fix: Social must expose these DAL functions via `social/adapters/` (ARCH-BIDIR-SOCIAL-001)

**Controller rules for `settings/controller/recordProfileMediaAsset.controller.js`:**
- Imports `vport/adapters/vport.adapter` — CLEAN

**`queries/` layer:**
- ARCH-NAMING-001 decision needed: fold `settings/queries/` (6 files) into `settings/dal/` or keep as a read-layer alias
- Currently a non-standard naming — only `settings` uses this layer name

---

## 8. Known Coupling

**5 confirmed violations:**

| From File | To | Rule | Ticket |
|---|---|---|---|
| `hooks/useVportBusinessCardSettings.js` | `public/vportBusinessCard/model/businessCardSettings.model` | `NO_INTERNAL_WITHOUT_ADAPTER` | ARCH-BIDIR-MODEL-001 |
| `controller/vportSocialSettings.controller.js` | `social/privacy/dal/actorSocialSettings.dal` | `NO_INTERNAL_WITHOUT_ADAPTER` + `NO_CROSS_FEATURE_DAL` | ARCH-BIDIR-SOCIAL-001 |
| `controller/vportSocialSettings.controller.js` | `social/privacy/dal/actorSocialPublicPolicy.dal` | `NO_INTERNAL_WITHOUT_ADAPTER` + `NO_CROSS_FEATURE_DAL` | ARCH-BIDIR-SOCIAL-001 |

Note: The 3 missing adapter exports (dashboard→settings direction) are counted as dashboard violations, not settings violations. Settings must add the adapters to resolve them.

**CSS leak (tracked in BIDIR, not as settings violation):**
- `settings/styles/settings-modern.css` is imported by `ads/` and `dashboard/` — it should be `shared/styles/`
- Fix: ARCH-BIDIR-CSS-001

**Bidirectional pairs:**
- `settings` ↔ `vport` — Pair 15 (LEGITIMATE)
- `settings` ↔ `dashboard` — Pair 7 (ADAPTER-MISSING + CSS-LEAK)
- `ads` ↔ `settings` — Pair 1 (CSS-LEAK)

---

## 9. Risk Notes

**MEDIUM.** Settings has 5 active violations and the widest fan-out of any non-split-candidate feature. The social DAL violations break the layer contract directly (controller calling another feature's DAL). CSS violations are behavioral-risk-free but propagate to other features.

Settings is consumed by 16 features. Any change to settings adapters requires broad impact analysis.

---

## 10. Migration Notes

**ARCH-BIDIR-SOCIAL-001:** Add `social/adapters/privacy/actorSocialSettings.adapter.js` and `actorSocialPublicPolicy.adapter.js` (or extend existing social privacy adapter). Update `vportSocialSettings.controller.js`.

**ARCH-BIDIR-MODEL-001:** `businessCardSettings.model` moves to `shared/lib/businessCard/`. Update `settings/hooks/useVportBusinessCardSettings.js`.

**ARCH-BIDIR-SETTINGS-001:** Add 3 hooks to `settings/adapters/vports.adapter.js` (or create this file). Update `dashboard/cards/settings/VportSettingsScreen.jsx`.

**ARCH-BIDIR-CSS-001:** Move `settings-modern.css` to `shared/styles/`. Original in `settings/styles/` may remain if settings self-imports it, or update all importers and delete.

**ARCH-NAMING-001:** Decide whether `settings/queries/` folds into `settings/dal/` (6 files to rename).

---

## 11. Unknowns

- TODO: Confirm full exports of `settings/adapters/settings.adapter`
- TODO: Confirm whether `settings/queries/` files overlap with `settings/dal/` functionality
- TODO: Identify all 16 inbound consumers
- TODO: Confirm whether settings has `screen/` or `screens/` naming
- TODO: Confirm remaining 20+ outbound imports beyond confirmed targets
