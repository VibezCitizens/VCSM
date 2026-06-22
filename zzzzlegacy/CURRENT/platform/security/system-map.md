# ARCHITECT — System Map
Generated: 2026-05-09

---

## Applications

### VCSM
Path: apps/VCSM/
Type: Social commerce platform (React 19 + Vite, SPA)
Language: JavaScript (.js / .jsx)
State: Zustand
Routing: React Router DOM
DB: Supabase (PostgreSQL + Auth + Realtime)

### WENTREX
Path: apps/wentrex/
Type: Standalone multi-tenant LMS SaaS (React + Vite, SPA)
Language: JavaScript (.js / .jsx)
DB: Supabase

### TRAFFIC
Path: apps/Traffic/
Type: Programmatic SEO acquisition engine (Next.js 14, static export)
Language: JavaScript (.js / .jsx)
DB: Supabase (anon client, public views only)
Role: Acquisition — routes visitors to VCSM via deep links

---

## Shared Engines

| Engine | Path | Layers Present |
|---|---|---|
| identity | engines/identity/ | dal, controller, model, adapters, services, types |
| chat | engines/chat/ | dal, controller, model, adapters, hooks, services, rules, utils, types |
| booking | engines/booking/ | dal, controller, model, adapters, types |
| hydration | engines/hydration/ | controller, adapters |
| notifications | engines/notifications/ | dal, controller, model, adapters, services, types |
| portfolio | engines/portfolio/ | dal, controller, model, adapters, services, types |
| reviews | engines/reviews/ | dal, controller, model, adapters, services, types |
| media | engines/media/ | dal, controller, model, hooks, lib, config |
| i18n | engines/i18n/ | src/react, en/, es/ |
| feed | engines/feed/ | (minimal — present at root level) |

---

## VCSM Feature Inventory (35 features)

actors, ads, auth, block, booking, chat, dashboard, debug, explore, feed,
hydration, identity, invite, join, legal, media, moderation, notifications,
onboarding, portfolio, post, professional, profiles, public, reviews,
settings, social, ui, upload, vgrid, void, vport, wanderex, wanders
+ embedded learning/ module (standalone LMS route within VCSM)

---

## WENTREX Feature Inventory

Features: actors, auth, block, communication, identity, moderation, services, ui
Learning domains: administration, student, staff, parent
Shared: components, lib, utils

---

## TRAFFIC Feature Inventory

features/: answers, categories, conversion, directories, home, providers, reviews
data/: connectors, controllers, dal, mappers, repositories
app/: (seo) route group, answers, categories, directory, guides, top-providers, sitemaps

---

## Boundary Rules

- VCSM and WENTREX never import from each other
- TRAFFIC never imports from engines/ or any app/
- engines/ never import from apps/
- Dependency direction: apps → engines → shared
