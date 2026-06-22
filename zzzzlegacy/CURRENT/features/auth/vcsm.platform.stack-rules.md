# VCSM Platform — Stack Rules

**Last updated:** April 10, 2026

## 1. Purpose

Define the authoritative technology stack for the VCSM platform and enforce language/file constraints that must never be violated.

## 2. Stack — VCSM App

| Layer | Technology | Version |
|---|---|---|
| **Language** | JavaScript (ES Modules) | — |
| **UI Framework** | React | 19.x |
| **Build** | Vite | — |
| **Styling** | UnoCSS (Preset Wind3) + CSS custom properties | — |
| **Animation** | Framer Motion | — |
| **State** | Zustand | — |
| **Routing** | React Router DOM | — |
| **Icons** | Lucide React, Phosphor React | — |
| **Database** | Supabase (PostgreSQL + Auth + Realtime + Storage) | — |
| **Payments** | Stripe (SDK installed, not yet active) | — |
| **Maps** | Leaflet + leaflet-geosearch + leaflet-routing-machine + leaflet.markercluster | — |
| **Places** | use-places-autocomplete (Google Places) | — |
| **Media** | Cloudflare R2 (CDN: cdn.vibezcitizens.com) + browser-image-compression + FFmpeg WASM | — |
| **Forms** | React Hook Form | — |
| **Data Fetching** | @tanstack/react-query (installed), Supabase client (primary) | — |
| **PWA** | vite-plugin-pwa | — |

## 3. Forbidden Technologies

### TypeScript — BANNED

| Rule | Detail |
|---|---|
| No `.ts` files | Zero TypeScript source files allowed in `apps/VCSM/src/` |
| No `.tsx` files | Zero TypeScript JSX files allowed |
| No `tsconfig.json` | The project uses `jsconfig.json` — never create a tsconfig |
| No `.d.ts` files | No type declaration files in app source |
| No TypeScript dependencies | Do not add `typescript`, `@types/*`, or TS-only libraries |

**Why:** The project is pure JavaScript with `jsconfig.json` for path aliases. TypeScript adds build complexity, migration burden, and cognitive overhead that is not wanted. This is a deliberate architectural decision.

### Other Banned Patterns

| Pattern | Why |
|---|---|
| CSS-in-JS (styled-components, emotion) | UnoCSS + CSS custom properties is the styling system |
| Sass/SCSS/Less | Plain CSS with custom properties |
| Redux / MobX | Zustand is the state manager |
| Next.js / Remix | Vite + React Router is the stack |
| GraphQL | Supabase PostgREST is the data layer |

## 4. File Rules Inside Source

### Allowed file extensions in `apps/VCSM/src/`

| Extension | Use |
|---|---|
| `.js` | JavaScript modules (DAL, controllers, models, hooks, lib, config) |
| `.jsx` | React components (screens, views, UI) |
| `.css` | Stylesheets (feature CSS, global CSS) |
| `.json` | Config and data files |
| `.mjs` | ES module scripts |

### Forbidden file types in `apps/VCSM/src/`

| Extension | Rule |
|---|---|
| `.ts` / `.tsx` | BANNED — see above |
| `.md` | BANNED — documentation lives in `/logan/` only |
| `.txt` | No loose text files in source |
| Files with spaces in name | BANNED — breaks imports and CLI tools |
| Files with no extension | BANNED — must have a valid extension |

### README.md Files

- README.md files are BANNED inside `apps/`, `engines/`, `shared/`, or any source directory.
- The only approved README.md in the workspace is `logan/README.md`.
- Any new README.md requires explicit user approval before creation.

## 5. Architecture Pattern

```
DAL → Model → Controller → Hook → Screen
```

- **DAL:** Raw Supabase queries, single responsibility, explicit column selection (never `.select('*')`)
- **Model:** Domain models and pure transforms
- **Controller:** Business logic orchestration, calls DALs
- **Hook:** React lifecycle management, calls controllers
- **Screen:** Pure composition, no computation, no direct DB access

## 6. Theme System

Single source of truth: `src/styles/citizens-theme.css`

- All colors via `--vc-*` CSS custom properties
- Feature CSS files alias tokens into local `--feature-*` vars
- `authTheme.js` provides inline style references using `var(--vc-*)`
- See `logan/vcsm/theme/vcsm.theme.design-tokens.md` for full token reference

## 7. Identity System

- Actor-based: `actorId` + `kind` (`'user'` | `'vport'`)
- Never expose `profileId` or `vportId` through `useIdentity()`
- All domain entities scoped to `vc.actors`
- Ownership via `actor_owners`

## 8. Production Safety

These directories must NEVER be included in production builds:

| Directory | Purpose |
|---|---|
| `.claude/` | Claude Code tooling config |
| `planning/` | Session planning files |
| `logan/` | System documentation |
| `session-summaries/` | Conversation logs |
| `db_snapshot/` | Schema snapshots and seeds |

## 9. Rules / Invariants

1. Zero TypeScript files in the workspace — ever
2. Zero `.md` files inside `src/` — documentation lives in `/logan/`
3. Zero README.md files unless explicitly approved
4. Zero files with spaces in filenames
5. Zero files without extensions in source directories
6. `jsconfig.json` is the project config — never replace with `tsconfig.json`
7. All new code must be `.js` or `.jsx`
8. All styling must use CSS custom properties from `citizens-theme.css`
9. All DB queries must use explicit column selection

## 10. Change Log

### 2026-04-10 03:40 AM
- Task: Create stack rules document
- Summary: Documented full VCSM technology stack, banned technologies (TypeScript, CSS-in-JS, etc.), file rules, architecture pattern, and production safety rules. Removed 10 scattered .md files and 2 stray extensionless artifacts from `apps/VCSM/src/`.
- Files Changed:
  - Created: `logan/platform/vcsm.platform.stack-rules.md`
  - Removed: 10 `.md` files from `apps/VCSM/src/features/` and `src/app/`
  - Removed: 2 extensionless stray files from `src/features/wanders/`
