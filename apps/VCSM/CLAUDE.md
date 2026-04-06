# App: VCSM

Social marketplace hybrid platform. Think Instagram meets Airbnb with a unique identity system.

## What This App Is

A full-stack social commerce platform for creators and service providers. Everything lives under one roof:

- **Social layer** — feeds, posts, comments, reactions, roses, friend/follow graphs, real-time chat, notifications
- **Marketplace layer** — Vport service catalogs, gas pricing (resource-based), bookings, availability calendars, QR-coded menus/flyers
- **Wanders** — async messaging system (virtual postcards sent between actors)
- **Learning** — embedded LMS at `/learning` route with student/teacher/parent/admin dashboards
- **Identity system** — actor-based identities: personal profiles or business storefronts (Vports), switchable

## Stack

- React 19 + Vite
- Supabase (PostgreSQL + Auth + Realtime)
- Zustand (state management)
- UnoCSS + Framer Motion
- Stripe (payments)
- AWS S3 (storage)
- FFmpeg WASM (client-side video processing)

## Identity Rules

- Identity is actor-based: `actorId` + `kind` (`'user'` | `'vport'`)
- Never expose `profileId` or `vportId` through `useIdentity()`
- All domain entities are scoped to `vc.actors`
- Ownership follows `actor_owners`

## The Embedded LMS (`/learning`)

This app contains an LMS, but it is NOT Wentrex. Do not:
- Copy code from `apps/wentrex` into this LMS
- Assume this LMS and Wentrex share the same domain model, schemas, or patterns
- Mix Wentrex's multi-tenant Realm model with this app's actor/Vport identity model

The LMS here is a feature of VCSM, not a standalone product.

## Architecture Layer Order

```
DAL → Model → Controller → Hook → Screen
```

- Business logic lives in Controllers
- Hooks manage UI lifecycle only
- Screens compose, never compute
- Adapters are the only cross-feature boundary

## What NOT to Do

- Do not import anything from `apps/wentrex`
- Do not add routing inside engines
- Do not let components call controllers directly
- Do not use `.select('*')` in any DAL file
- Do not put domain-specific logic in `shared/`
