# Feature Contract: legal

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 26 (scanner 2026-06-05)  
**Inbound imports:** 2  
**Outbound imports:** 4  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`legal` owns all legal and compliance-related screens:
- Terms of Service screen
- Privacy Policy screen
- Consent Gate screen (blocks access until consent is given)
- How-to pages (HowToCreateVport, HowToCreateProfile, VportCategoryLanding)
- Contact and About screens
- Legal document display

`legal` is a **platform primitive** — it provides the consent gate that `auth` requires during registration.

---

## 2. Non-Goals

`legal` must not own:
- Authentication — that is `auth/`
- Privacy settings (configuring who can see what) — that is `settings/` and `social/`
- Analytics attribution tracking — `funnelSource.js` belongs in `shared/lib/` (ARCH-ANALYTICS-001)

---

## 3. Public API / Adapter Boundary

**Known adapter:**
- `legal/adapters/legal.adapter` — confirmed consumed by `auth/hooks/useRegister.js`

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `legal/adapters/legal.adapter` | Primary public API |
| screens | `legal/screens/` | `ConsentGateScreen.jsx`, `LegalDocumentScreen.jsx`, `HowToCreateVportScreen.jsx`, `HowToCreateProfileScreen.jsx`, `VportCategoryLandingScreen.jsx` — confirmed |
| controllers | `legal/controllers/` | TODO: confirm if legal has controllers |
| hooks | `legal/hooks/` | TODO: confirm |

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `auth` | Consent gate and legal screens gate on auth state — BIDIR SAFE (Pair 2) | YES — `ConsentGateScreen.jsx` and `LegalDocumentScreen.jsx` → `auth/adapters/auth.adapter` |
| `analytics` | How-to screens track funnel source — currently imports from `features/analytics/` | YES — `HowToCreateVportScreen.jsx`, `HowToCreateProfileScreen.jsx`, `VportCategoryLandingScreen.jsx` → `features/analytics/funnelSource` (3 import sites targeted for update by ARCH-ANALYTICS-001) |

---

## 6. Prohibited Dependencies

`legal` must not import from:
- `settings/` — legal is a platform primitive; settings is Layer 4
- `profiles/`, `feed/`, `post/` — content features
- `social/`, `notifications/` — infrastructure features above Layer 0
- `analytics/` internals after ARCH-ANALYTICS-001 executes (will import from `shared/lib/funnelSource` instead)

---

## 7. DAL / Controller Rules

`legal` likely has no DAL (legal screens are static content with no database reads).

If `legal` does have DAL files (e.g., to track consent timestamp):
- Must use explicit column projections
- Must not query `vc.actor_owners`

---

## 8. Known Coupling

**0 violations.**

**Bidirectional pair — LEGITIMATE:**
- `auth` ↔ `legal` — Pair 2 (registration requires consent; legal gates on auth state)

**Pending import update (ARCH-ANALYTICS-001):**
- `legal/screens/HowToCreateVportScreen.jsx` line 3: `import { setFunnelSource } from '@/features/analytics/funnelSource'` → update to `@/shared/lib/funnelSource`
- `legal/screens/HowToCreateProfileScreen.jsx` line 3: same update
- `legal/screens/VportCategoryLandingScreen.jsx` line 3: same update

---

## 9. Risk Notes

**LOW.** Clean feature with clear boundaries. The analytics import update is mechanical (3 import path changes).

---

## 10. Migration Notes

**ARCH-ANALYTICS-001:** Update 3 import paths in legal screens from `@/features/analytics/funnelSource` to `@/shared/lib/funnelSource`. This is part of eliminating the `analytics/` feature stub.

---

## 11. Unknowns

- TODO: Confirm whether legal has a `controllers/` folder
- TODO: Confirm whether legal has a DAL (consent timestamp recording)
- TODO: Confirm the 2 inbound consumers (scanner shows inbound: 2 — auth is 1, the second is unknown)
