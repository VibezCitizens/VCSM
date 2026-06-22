# Feature Contract: ads

**Status:** VIOLATIONS (CSS)  
**Risk:** LOW  
**Files:** 18 (scanner 2026-06-05)  
**Inbound imports:** 2  
**Outbound imports:** 1  
**Violations:** 0 (scanner — CSS tracked in BIDIR)  
**Split candidate:** NO

---

## 1. Purpose

`ads` owns ad placement widgets and targeting logic:
- `OnemoredaysAd` widget — confirmed ad component
- Ad targeting and display rules
- Ad settings screen

`ads` is consumed by `settings` (the primary display surface for VPORT ad configuration).

---

## 2. Non-Goals

`ads` must not own:
- Ad delivery infrastructure — that is external
- Payment processing for ad purchases — separate feature
- General settings UI — that is `settings/`

---

## 3. Public API / Adapter Boundary

**Known adapters (confirmed by scanner):**
- `ads/adapters/widgets/OnemoredaysAd.adapter` — consumed by `settings/vports/ui/VportsTab.view.jsx`

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `ads/adapters/` | `widgets/OnemoredaysAd.adapter` confirmed |
| hooks | `ads/hooks/` | Ad targeting hooks |
| widgets | `ads/widgets/` | Ad display components |
| screens | `ads/screens/` | `VportAdsSettingsScreen.jsx` confirmed — source of CSS import violation |
| model | `ads/model/` | Ad targeting shapes |

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `settings` | Ads settings screen uses settings stylesheet — CSS-LEAK (Pair 1) | MIXED — the settings→ads direction (OnemoredaysAd.adapter) is CLEAN; ads→settings CSS import is VIOLATION |

---

## 6. Prohibited Dependencies

`ads` must not import from:
- `settings/styles/settings-modern.css` — VIOLATION (currently happening — ARCH-BIDIR-CSS-001)
- `settings/` controllers, hooks, or DAL — ads is not a settings feature
- `profiles/`, `feed/`, `post/` — content features
- `social/`, `notifications/` — infrastructure features

---

## 7. DAL / Controller Rules

**DAL rules:**
- May query ad targeting and placement tables
- Must use explicit column projections
- Must not determine actor ownership independently

---

## 8. Known Coupling

**CSS violation (tracked in BIDIR Pair 1):**
- `ads/screens/VportAdsSettingsScreen.jsx` → `settings/styles/settings-modern.css` — CSS-LEAK
- Fix: `settings-modern.css` moves to `shared/styles/`; ads updates import path

After fix, `ads` ↔ `settings` becomes unidirectional: `settings → ads` (CLEAN, through adapter).

---

## 9. Risk Notes

**LOW.** The CSS violation is behavioral-risk-free. Fix is mechanical (1 import path update).

---

## 10. Migration Notes

**ARCH-BIDIR-CSS-001:** Update `ads/screens/VportAdsSettingsScreen.jsx` import from `settings/styles/settings-modern.css` → `shared/styles/settings-modern.css`.

---

## 11. Unknowns

- TODO: Identify the 2 inbound consumers (settings is 1; the second is unknown)
- TODO: Confirm full file list (18 files — adapters/widgets + hooks + screens + model)
- TODO: Confirm whether `ads/adapters/` has additional adapters beyond `widgets/OnemoredaysAd.adapter`
