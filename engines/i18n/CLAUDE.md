# Engine: i18n

## Working Directory

Your ONLY allowed working directory is:

```
/Users/vcsm/Desktop/VCSM/engines/i18n
```

## Strict Scope Rules

1. **NEVER modify anything outside** `/Users/vcsm/Desktop/VCSM/engines/i18n`
2. **NEVER import from** `/apps`, or any other engine
3. **This engine is platform-level and app-agnostic** — it must not contain:
   - VCSM-specific copy, namespaces, or dictionary assembly
   - Wentrex-specific copy, namespaces, or dictionary assembly
   - App routing, screen logic, or feature concerns

## What Lives Here

- `src/createTranslator.js` — dot-path key resolver + `{{param}}` interpolation
- `src/interpolate.js` — template string substitution
- `src/react/I18nProvider.jsx` — `I18nContext` definition + generic `I18nProvider` component
- `src/react/useTranslation.js` — `useTranslation()` hook
- `en/*.json` — platform-level English translation data (shared by all apps)
- `es/*.json` — platform-level Spanish translation data (shared by all apps)

## What Does NOT Live Here

- App-specific dictionary assembly (`setup.js`) — stays in each app's `src/i18n/`
- App-specific namespace files (`booking.json`, `feed.json`, etc.) — stays in each app
- App locale provider wrappers (`VcsmI18nProvider`, `LocaleProvider`) — stays in each app
- Language switcher components — stays in each app

## Alias Contract

Apps consume this engine via two Vite/jsconfig aliases:

| Alias | Resolves to | Use for |
|---|---|---|
| `@i18n` | `engines/i18n/index.js` | Engine code: `createTranslator`, `I18nContext`, `useTranslation` |
| `@i18n/*` | `engines/i18n/*` | Data files: `@i18n/en/common.json`, `@i18n/es/auth.json` |

The old `@platform/i18n` alias is removed. Use `@i18n/*` for data access.

## Translation Data Rules

- `en/` and `es/` contain platform-level strings shared across all apps
- App-specific namespaces (booking, feed, social, etc.) live in the app, not here
- Spanish files currently contain English placeholder values — awaiting human translation
- **No machine translation. Ever.**
- **User-generated content is never translated in code**
