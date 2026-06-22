# BOTTOM NAV — SETTINGS BUTTON ARCHITECTURE MAP

**Generated:** 2026-05-11
**Button:** Settings (Settings/Gear icon)
**Route:** `/settings`
**Feature:** settings

---

## Button Definition

```jsx
<Tab to="/settings" label={t('nav.settings')} icon={<Settings size={18} />} />
```
- NavLink — React Router push
- No badge, no custom handler

---

## Screen Chain

```
/settings → SettingsScreen.jsx
  → lazy-loaded tab views:
    - privacy tab → PrivacyTab.view (lazy)
    - profile tab → ProfileTab adapter (lazy)
    - account tab → AccountTab.view (lazy)
    - vports tab → VportsTab.view (lazy)
```

**Screen:** `features/settings/screen/SettingsScreen.jsx`
**Sub-views (all lazy-loaded via Suspense):**
- `settings/privacy/ui/PrivacyTab.view`
- `settings/profile/adapter/ProfileTab`
- `settings/account/ui/AccountTab.view`
- `settings/vports/ui/VportsTab.view`

---

## Primary Hooks (INFERRED from sub-views not read)

| Hook (INFERRED) | Sub-View | Purpose |
|---|---|---|
| INFERRED: profile read/write | ProfileTab | Edit display name, username, photo |
| INFERRED: privacy settings read/write | PrivacyTab | Public/private toggle, block list access |
| INFERRED: account read/write | AccountTab | Email, password, danger zone |
| INFERRED: vport list read | VportsTab | Actor's owned VPORTs list |

---

## Route Tab Structure

| Tab Key | View | URL Navigation |
|---|---|---|
| `privacy` | PrivacyTab.view | `/settings?tab=privacy` (INFERRED) |
| `profile` | ProfileTab (adapter) | `/settings?tab=profile` |
| `account` | AccountTab.view | `/settings?tab=account` |
| `vports` | VportsTab.view | `/settings?tab=vports` |

---

## State Stores

- INFERRED: `identitySelection.store` for actorId
- INFERRED: React Query for individual settings read/write operations
- INFERRED: local form state for edit fields

---

## Known Spaghetti Flags (from module audit)

| Signal | Evidence | Risk | Handoff |
|---|---|---|---|
| `queries/` folder with 6 hook files | Possibly dead post-refactor | MEDIUM | IRONMAN |
| `vportAboutDetails.model.js` in `profile/ui/` | Model in UI folder — layer violation | HIGH | SENTRY |
| `useMyBlocks.jsx` extension | Hook with .jsx extension | LOW | IRONMAN |
| Block management in settings | `settings/privacy/` has block-related hooks — duplicates block feature | HIGH | SENTRY |

---

## Missing Pieces

- Sub-view content not traced (all lazy-loaded, not read in this scan)
- `ProfileTab` is an adapter — wraps a profile sub-system (INFERRED: writes to `vc.profiles` or `vport.profiles`)
- VportsTab likely reads `vport.profiles` for actor's owned VPORTs

---

## NEEDS LOKI VERIFICATION

- All sub-view hook and DAL chains
- How settings writes invalidate actorStore + identitySelection
