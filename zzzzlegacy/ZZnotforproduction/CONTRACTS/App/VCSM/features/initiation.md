# Feature Contract: initiation

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 16 (scanner — listed as "onboarding"; actual folder: "initiation")  
**Inbound imports:** 1  
**Outbound imports:** 4  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`initiation` owns the app initialization flow after authentication:
- Post-auth first launch experience
- Profile completion prompts
- Onboarding steps (actor type selection, vport creation prompts)
- First-session gates

`initiation` is triggered after `auth/` completes but before the user reaches the main app.

**Naming discrepancy:** The scanner reports this as "onboarding" (16 files). The actual folder name in `apps/VCSM/src/features/` is `initiation`. ARCH-NAMING-001 should confirm the canonical name.

---

## 2. Non-Goals

`initiation` must not own:
- Authentication — that is `auth/`
- Account registration — that is `auth/`
- Vport creation business logic — that is `vport/`
- Main app navigation — that is `shell/` and `app/routes/`

---

## 3. Public API / Adapter Boundary

**Known:** 1 inbound import — likely from `app/routes/` or auth callback flow.

No adapter file confirmed. Given the low inbound count, no adapter surface is currently required.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| screens | `initiation/screens/` | Onboarding/initiation screens |
| hooks | `initiation/hooks/` | Initiation flow hooks |
| controllers | `initiation/controller/` or `controllers/` | Initiation logic |
| dal | `initiation/dal/` | TODO: confirm if initiation has DAL |
| model | `initiation/model/` | TODO: confirm if initiation has model |

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `auth` | Initiation follows auth completion | Confirmed by outbound count |
| `identity` | Resolve actor after first auth | Confirmed by outbound count |
| `social` | Social context for first-time users | Confirmed by outbound count (4 total) |
| `vport` | Vport creation prompt in initiation | Confirmed by outbound count |

---

## 6. Prohibited Dependencies

`initiation` must not import from:
- `dashboard/`, `settings/` — management features (user hasn't completed onboarding yet)
- `profiles/` internals — use adapters
- `feed/`, `post/` — content features (post-onboarding)

---

## 7. DAL / Controller Rules

**Controller rules:**
- Initiation controllers manage first-launch state (has user completed profile? selected actor type?)
- Must not modify auth state — auth is already complete by the time initiation runs
- Must not create vport directly — delegate to `vport/adapters/`

---

## 8. Known Coupling

**No violations.** Zero scanner violations.

---

## 9. Risk Notes

**LOW.** Small feature with clear lifecycle boundaries. The naming discrepancy (initiation vs onboarding) is the primary issue.

---

## 10. Migration Notes

**ARCH-NAMING-001:** Confirm canonical name: `initiation` (actual folder) vs `onboarding` (scanner name). If the folder is renamed, update all import paths.

---

## 11. Unknowns

- TODO: Confirm canonical feature name — `initiation` vs `onboarding`
- TODO: Confirm full file list (16 files)
- TODO: Identify the 1 inbound consumer
- TODO: Confirm whether initiation has its own DAL or relies entirely on auth/identity/vport adapters
