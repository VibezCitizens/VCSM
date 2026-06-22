# Feature Contract: public

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 64 (scanner 2026-06-05)  
**Inbound imports:** 4  
**Outbound imports:** 10  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`public` owns all unauthenticated (no-auth required) public-facing VCSM surfaces:
- **`vportBusinessCard/` (16 files)** — Business card display for vports (public-facing profile card)
- **`vportMenu/` (46 files)** — Public menu display for vport menus (QR-accessible)

`public` is the external-facing layer — content that can be visited without a VCSM account. It links to VCSM's core VPORT profiles for authenticated users.

---

## 2. Non-Goals

`public` must not own:
- Auth-required profile views — that is `profiles/`
- QR code generation — that is `dashboard/qrcode/`
- Business card settings/configuration — model should move to `shared/lib/` (ARCH-BIDIR-MODEL-001)
- Marketing pages — TODO: confirm location of landing/marketing screens

---

## 3. Public API / Adapter Boundary

**Known: public has NO named adapter files confirmed by scanner.**

The scanner shows public with 4 inbound imports — these come from:
- `dashboard/` (2 imports from `public/vportMenu/view/VportPublicMenuQrView.jsx` and `VportPublicReviewsQrView.jsx` → `dashboard/qrcode/adapters/qrcode.adapter`) — these are outbound from public, not inbound
- TODO: Identify the actual 4 inbound consumers

**Known `public/` adapters (not confirmed by scanner but implied by wanders violation):**
- `public/vportBusinessCard/controller/vportBusinessCard.controller` — wanders imports this directly (VIOLATION — ARCH-BIDIR-MODEL-001 area)

`public` may need to expose `vportBusinessCard.controller` via `public/adapters/` to resolve the `wanders` violation.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| vportBusinessCard | `public/vportBusinessCard/` | 16 files — business card display |
| vportBusinessCard/model | `public/vportBusinessCard/model/` | `businessCardSettings.model` — MUST MOVE to `shared/lib/businessCard/` |
| vportBusinessCard/controller | `public/vportBusinessCard/controller/` | `vportBusinessCard.controller` — consumed by wanders without adapter |
| vportMenu | `public/vportMenu/` | 46 files — public menu display |
| vportMenu/view | `public/vportMenu/view/` | `VportPublicMenuQrView.jsx`, `VportPublicReviewsQrView.jsx` — both consume `dashboard/qrcode/adapters/qrcode.adapter` |

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `dashboard` | Public menu views use QR adapter — BIDIR SAFE (Pair 6) | YES — `VportPublicMenuQrView.jsx` and `VportPublicReviewsQrView.jsx` → `dashboard/qrcode/adapters/qrcode.adapter` |
| `identity` | Active actor (if any — public views may have partial auth context) | TODO: confirm |

---

## 6. Prohibited Dependencies

`public` must not import from:
- `profiles/` internals — public views are unauthenticated; profile internals assume auth context
- `booking/` — booking requires auth
- `dashboard/` internals — only through `dashboard/qrcode/adapters/qrcode.adapter` (confirmed CLEAN)
- `social/`, `notifications/`, `chat/` — auth-required features

---

## 7. DAL / Controller Rules

**DAL rules for `public/vportBusinessCard/`:**
- May query publicly-accessible vport data (business name, hours, services flagged as public)
- Must use explicit column projections
- Must not query auth-gated tables
- Must not determine ownership — public views are read-only

**Controller rules for `public/vportBusinessCard/controller/vportBusinessCard.controller`:**
- This controller is consumed by `wanders` without going through an adapter (VIOLATION)
- After remediation: must be exposed via `public/adapters/` (create adapter file)
- The model `businessCardSettings.model` alongside this controller is being consumed by 3 features (dashboard, settings, wanders) — must move to `shared/lib/`

---

## 8. Known Coupling

**0 scanner violations for public itself.**

**Public is a target of violations from other features:**
- `dashboard/cards/settings/components/VportSettingsBusinessCard.jsx` → `public/vportBusinessCard/model/businessCardSettings.model` (VIOLATION in dashboard — Pair 6)
- `settings/vports/hooks/useVportBusinessCardSettings.js` → `public/vportBusinessCard/model/businessCardSettings.model` (VIOLATION in settings)
- `wanders/hooks/useWandersBusinessCardOps.js` → `public/vportBusinessCard/controller/vportBusinessCard.controller` (VIOLATION in wanders)
- `wanders/hooks/useWandersBusinessCardOps.js` → `public/vportBusinessCard/model/businessCardSettings.model` (VIOLATION in wanders)

**Bidirectional pairs:**
- `dashboard` ↔ `public` — Pair 6 (SHARED-MODEL-LEAK on dashboard→public; CLEAN on public→dashboard)

**Resolution:** ARCH-BIDIR-MODEL-001 resolves the model violations. A new ticket is needed for `public` to expose `vportBusinessCard.controller` via `public/adapters/` for wanders.

---

## 9. Risk Notes

**LOW.** Zero violations in public itself. The violations are in the importing features (dashboard, settings, wanders). Public must add adapter exports to enable clean imports.

The `businessCardSettings.model` move to `shared/` will reduce public's coupling surface — 3 features importing from public reduces to 0 after the move.

---

## 10. Migration Notes

**ARCH-BIDIR-MODEL-001:**
- Move `public/vportBusinessCard/model/businessCardSettings.model.js` → `shared/lib/businessCard/businessCardSettings.model.js`
- Update all 3 importers (dashboard, settings, wanders)
- Confirm public itself doesn't self-import the model (update if so)

**Open ticket needed:**
- Create `public/adapters/vportBusinessCard.adapter.js` — expose `vportBusinessCard.controller`
- Update `wanders/hooks/useWandersBusinessCardOps.js` — import from adapter

---

## 11. Unknowns

- TODO: Identify the 4 inbound consumers of public
- TODO: Confirm whether `public/` has a top-level `adapters/` folder
- TODO: Confirm full `public/vportMenu/` structure (46 files)
- TODO: Confirm whether public has any RLS implications for unauthenticated access (public views must not accidentally expose private data)
- TODO: Confirm remaining 7 outbound imports beyond `dashboard/qrcode/adapters/`
