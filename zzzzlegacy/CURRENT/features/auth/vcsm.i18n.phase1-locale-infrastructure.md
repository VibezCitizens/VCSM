# VCSM i18n Phase 1 — Locale Infrastructure

Date: 2026-05-03
Updated: 2026-05-09 (Phase 1C — engine migration)
Scope: VCSM + WENTREX + ENGINE
Type: Infrastructure
Status: Complete (engine migration applied 2026-05-09)

---

## 1. What Was Built

EN/ES locale switching infrastructure. No strings were translated. No feature copy was extracted. This phase only establishes the plumbing so future translation work has a place to land.

---

## 2. File Inventory

### New — Platform layer (`apps/VCSM/src/platform/i18n/`)

| File | Purpose |
|---|---|
| `useLocale.jsx` | React Context for locale state. Exports `LocaleProvider` + `useLocale`. |
| `VcsmI18nProvider.jsx` | VCSM wrapper around `I18nContext.Provider`. Sets `document.documentElement.lang`, logs missing keys in dev. |
| `LocaleSwitcher.jsx` | EN \| ES toggle component. Not yet placed in any UI route. |

### New — Spanish stub dictionaries

**Platform (`platform/i18n/es/`):**
`common.json`, `actions.json`, `errors.json`, `status.json`, `state.json`, `time.json`, `auth.json`, `notifications.json`

**App-specific (`apps/VCSM/src/i18n/es/`):**
`booking.json`, `vport.json`, `feed.json`, `social.json`, `content.json`

All 13 files contain English values as placeholders. No translation has been done yet.

### Modified

| File | Change |
|---|---|
| `apps/VCSM/src/i18n/setup.js` | Exports `vcsmDictionaryEn`, `vcsmDictionaryEs`, `dictionaries = { en, es }`. Legacy `vcsmDictionary` export retained for transition. |
| `apps/VCSM/src/main.jsx` | Replaced `I18nProvider + vcsmDictionary` with `LocaleProvider → LocaleRoot → VcsmI18nProvider`. |

---

## 3. Architecture

### Locale state

```
LocaleProvider (React Context)
  └── LocaleRoot (reads locale, resolves dictionary)
        └── VcsmI18nProvider (injects t() into I18nContext)
              └── App
```

- `LocaleProvider` owns locale state via `useState(detectDefault)`
- `detectDefault` checks `localStorage.getItem('vcsm.locale')` first, then `navigator.language` (defaults ES if browser starts with `es-`)
- `setLocale` persists to `localStorage` key `vcsm.locale`
- `LocaleRoot` is a minimal component defined in `main.jsx` that calls `useLocale()` and passes the resolved dictionary to `VcsmI18nProvider`

### Why `VcsmI18nProvider` does not wrap or modify the platform `I18nProvider`

It imports `I18nContext` directly from `@i18n` and creates its own `createTranslator` call. The platform `I18nProvider` is bypassed entirely. This keeps the platform untouched while giving VCSM full control over dev-mode key warnings and `document.documentElement.lang`.

### Why `useLocale.jsx` not `.js`

The file contains JSX (`<LocaleContext.Provider>`). Vite requires `.jsx` extension for JSX content.

---

## 4. Dictionary Structure

```
dictionaries = {
  en: {
    common, actions, errors, status, state, time, auth, notifications,  // platform
    booking, vport, feed, social, content                                // app-specific
  },
  es: { ...same shape, English placeholder values }
}
```

All keys resolved via dot-path by `createTranslator`. Example: `t('booking.selectedDay')`.

---

## 5. What Phase 1 Does NOT Do

- No strings extracted from feature JSX files
- No actual Spanish translations (all ES files are EN value copies)
- `LocaleSwitcher` is built but not mounted in any route/nav yet
- No RTL support consideration

---

## 6. Phase 1B Cleanup — 2026-05-09

The following cleanup was applied to remove artifacts and fix tooling after the initial infrastructure build.

### Deleted

| File | Reason |
|---|---|
| `apps/VCSM/src/i18n/en.json` | Machine-generated audit artifact from the AST scanner. Never imported by setup.js or any production code. Flat dot-key format is not the correct structure for this system. |
| `apps/VCSM/src/i18n/es.json` | Same — plus it contained broken Spanglish strings from a machine translation attempt. Must never be imported or used as a translation base. |

### Moved

| From | To |
|---|---|
| `apps/VCSM/src/features/language/` | `zNOTFORPRODUCTION/_ACTIVE/tools/language-audit/` |

`src/features/language/` was a dev audit tool (AST-based visible string extractor + JSON outputs). It is not a product feature. Moving it out of the production `src/features/` tree eliminates bundle confusion and enforces the CLAUDE.md rule that dev tools do not live inside application source.

### Fixed — jsconfig.json aliases

Added to `apps/VCSM/jsconfig.json`:

```json
"@i18n": ["../../platform/i18n/src/index.js"],
"@i18n/*": ["../../platform/i18n/src/*"],
"@platform/i18n": ["../../platform/i18n"],
"@platform/i18n/*": ["../../platform/i18n/*"]
```

These aliases existed in `vite.config.js` only. The IDE could not resolve `from '@i18n'` or `from '@platform/i18n/...'` without the jsconfig entries. Adding them unblocks IntelliSense, go-to-definition, and type-checking for all future translation wiring work.

---

## 6C. Engine Migration — 2026-05-09

The i18n engine code and platform translation data moved from `platform/i18n/` into the engines system.

### What moved

| From | To |
|---|---|
| `platform/i18n/src/createTranslator.js` | `engines/i18n/src/createTranslator.js` |
| `platform/i18n/src/interpolate.js` | `engines/i18n/src/interpolate.js` |
| `platform/i18n/src/index.js` | `engines/i18n/src/index.js` |
| `platform/i18n/src/react/I18nProvider.jsx` | `engines/i18n/src/react/I18nProvider.jsx` |
| `platform/i18n/src/react/useTranslation.js` | `engines/i18n/src/react/useTranslation.js` |
| `platform/i18n/en/*.json` (8 files) | `engines/i18n/en/*.json` |
| `platform/i18n/es/*.json` (8 files) | `engines/i18n/es/*.json` |

`platform/i18n/` deleted after migration. `platform/` now only contains `services/`.

### New engine entry point

`engines/i18n/index.js` — exports `createTranslator`, `interpolate`, `I18nContext`, `I18nProvider`, `useTranslation`.

### Alias contract (both apps)

| Alias | Resolves to | Use for |
|---|---|---|
| `@i18n` | `engines/i18n/index.js` | Engine code |
| `@i18n/*` | `engines/i18n/*` | Data: `@i18n/en/common.json` |

`@platform/i18n` alias removed from both `vite.config.js` files. All data imports now use `@i18n/en/*` and `@i18n/es/*`.

### Files updated (both apps)

- `apps/VCSM/vite.config.js` — aliases updated
- `apps/VCSM/jsconfig.json` — aliases updated
- `apps/VCSM/src/i18n/setup.js` — imports updated
- `apps/wentrex/vite.config.js` — aliases updated
- `apps/wentrex/jsconfig.json` — `@i18n` aliases added
- `apps/wentrex/src/i18n/setup.js` — imports updated

---

## 7. Translation Rules (Canonical)

These rules apply to all future phases:

**Source of truth for UI copy:** namespace JSON files only.
- Platform namespaces: `platform/i18n/en/` and `platform/i18n/es/`
- App namespaces: `apps/VCSM/src/i18n/en/` and `apps/VCSM/src/i18n/es/`

**Spanish copy is supplied by the product owner directly. No machine translation. Ever.**
The flat `es.json` artifact is deleted. It must not be referenced or regenerated as a translation base.

**User-generated content must never be translated in code.**
Bio text, post content, service descriptions, review text, business names, and chat messages pass through the system unchanged. Translate only fixed UI strings.

**Wire UI strings via `useTranslation()`.** Import from `@i18n`. Call `t('namespace.key')`.

**Format dates, numbers, and currency via `useFormatter()` (to be built in Phase 2).** Never call `new Intl.*()` inline in components.

**Pluralization:** When a string needs plural forms, the value in the JSON file should be `{ "one": "...", "other": "..." }`. The translator engine will need to be updated to support this before Phase 3.

---

## 8. Phase 2 — Next Steps

1. Place `LocaleSwitcher` in a user-accessible location (settings screen — language preference)
2. Translate all 13 ES JSON files (human copy — owner supplies Spanish directly)
3. Add pluralization support to `createTranslator` in `platform/i18n/src/createTranslator.js`
4. Build `platform/i18n/src/format.js` — `createFormatter(locale)` using `Intl.DateTimeFormat` / `Intl.NumberFormat`
5. Extract hardcoded strings from navigation and auth into dictionaries (Phase 3 in plan)
6. Add missing namespaces as needed: `nav`, `toasts`, `onboarding`

---

## 9. Known Consideration — Double Dictionary Import

`setup.js` imports all 26 JSON files (13 EN + 13 ES) at module load time. Both dictionaries are always in the bundle regardless of active locale. For Phase 1 this is acceptable — the files are small. If the dictionary grows large, consider lazy-loading the inactive locale.
