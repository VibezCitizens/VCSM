# VCSM App — Agent Execution Gate

You are working inside `apps/VCSM/` — the social commerce platform.

Read this file top to bottom before making any change.

---

## Step 1: Read the Architecture Contract

Before touching any file, read this in full:

```
zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md
```

This contract is locked. It overrides every local assumption, prior session
pattern, and inferred convention.

---

## What This App Is

A full-stack social commerce platform. Everything lives under one roof:

- **Social layer** — feeds, posts, comments, reactions, real-time chat, notifications
- **Marketplace layer** — Vport service catalogs, gas pricing, bookings, availability
  calendars, QR-coded menus and flyers
- **Wanders** — async messaging (virtual postcards sent between actors)
- **Learning** — embedded LMS at `/learning` — NOT Wentrex, do not conflate them
- **Identity** — actor-based: personal profiles or business storefronts (Vports),
  switchable

---

## Language

JavaScript only. ES Modules.

- Zero `.ts` or `.tsx` files — TypeScript is banned
- No `tsconfig.json` — this project uses `jsconfig.json`
- No CSS-in-JS, Sass, Redux, MobX, Next.js, Remix, GraphQL

---

## Identity

VCSM is actor-based. The canonical identity fields are `actorId` and `kind`
(`'user'` | `'vport'`).

- Never scope behavior by `profileId`, `vportId`, or raw `userId`
- Never expose `profileId` or `vportId` through `useIdentity()` or any public
  hook or controller surface
- Ownership is verified through `actor_owners` only. No other ownership model exists.
- All domain entities are scoped to `vc.actors`

---

## Mandatory Build Order

```
DAL → Model → Controller → Hook → Components → View Screen → Final Screen
```

Never skip layers. Never work backwards. If a layer is missing, build it first.

---

## Engineering Rules

- Surgical changes only — change exactly what was asked, nothing more
- Preserve existing behavior unless the task explicitly changes it
- No full rewrites without explicit approval and a written scope statement
- No unrelated refactors, no logic movement, no opportunistic cleanup
- Trace the full call path before editing: UI → Hook → Controller → Model → DAL → DB
- All new cross-folder imports use `@/...` path aliases — no `../../` chains
- `select('*')` is banned in all DAL files — always use explicit column lists
- Files over 300 lines must be split before adding more code

---

## Adapter Boundaries

- Never import another feature's internal files directly
- All cross-feature access goes through the feature's adapter (`*.adapter.js`)
- Adapters expose only: hooks, components, view screens
- Adapters never export DAL functions, models, or controllers

---

## Theme

Single source of truth: `apps/VCSM/src/styles/citizens-theme.css`

- All colors via `--vc-*` CSS custom properties
- Do not hardcode Tailwind blue/slate/indigo/neutral classes — use `white/*`
  opacity or `purple-*`

---

## Avatar Rule

Avatars must be square with rounded corners. Never circular. `rounded-full` is banned.

| Size | Class |
|---|---|
| Large (64px+) | `rounded-2xl` |
| Medium/Small (24–56px) | `rounded-lg` |
| Tiny (<24px) | `rounded-md` |

Always use `object-cover` + `border border-white/12` + `onError` fallback to `/avatar.jpg`.

---

## iOS Stacking Context

Never render `position: fixed` modals inside a parent that has `backdrop-filter`,
`transform`, `filter`, or `overflow: hidden` with `border-radius`. Always render
modals as fragment siblings, not children of styled card containers.

---

## Implementation Return Format

Every completed task must report:

```
[TICKET-ID] — Implementation Return

Files Changed:     path + what changed and why
Behavior Changed:  before / after / preserved
Grep Checks:       symbol grepped → result
Tests Run:         test file → result (or: not run — state explicitly)
Build Result:      passed / failed / not run
Remaining TODOs:   open items or follow-up tickets
```

---

## Skill References

Full VCSM execution contract:
`zNOTFORPRODUCTION/_CANONICAL/skills/vcsm/SKILL.md`

Contributor quality gate:
`zNOTFORPRODUCTION/_CANONICAL/skills/vcsm-contributor/SKILL.md`
