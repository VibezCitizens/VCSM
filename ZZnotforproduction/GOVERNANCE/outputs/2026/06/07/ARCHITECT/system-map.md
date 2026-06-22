# ARCHITECT SYSTEM MAP
Generated: 2026-06-07T08:11:08.925Z
Scanner Version: 1.1.0
Scope: ALL APPS + ENGINE

---

## Application Boundaries

| App | Root | Status | Features | Routes | Write Surfaces | RPCs | Edge Functions |
|---|---|---|---|---|---|---|---|
| VCSM | apps/VCSM | ACTIVE | 41 | 130 | 290 | 49 | 34 |
| wentrex | apps/wentrex | ACTIVE | 10 | 63 | 33 | 0 | 0 |
| Traffic | apps/Traffic | ACTIVE | 11 | 51 | 58 | 0 | 18 |
| engines | engines/ | ACTIVE | 9 | 0 | 106 | 22 | 0 |

**Total:** 71 features · 244 routes · 487 write surfaces · 71 RPCs · 52 edge functions

---

## Engine Boundary

| Engine | Root | Callgraph Nodes | Controllers | DALs | Models |
|---|---|---|---|---|---|
| engine:booking | engines/booking | 221 | 40 | 88 | 28 |
| engine:chat | engines/chat | 255 | 38 | 92 | 40 |
| engine:hydration | engines/hydration | — | — | — | — |
| engine:i18n | engines/i18n | — | — | — | — |
| engine:identity | engines/identity | 74 | 8 | 20 | 6 |
| engine:media | engines/media | — | — | — | — |
| engine:notifications | engines/notifications | 102 | 13 | 23 | 7 |
| engine:portfolio | engines/portfolio | — | — | — | — |
| engine:reviews | engines/reviews | — | — | — | — |

---

## Structural Isolation Status

| Boundary | Status | Evidence |
|---|---|---|
| VCSM → wentrex cross-import | CLEAN | 0 cross-app imports detected in dependency-map |
| VCSM → Traffic cross-import | CLEAN | 0 cross-app imports detected in dependency-map |
| wentrex → Traffic cross-import | CLEAN | 0 cross-app imports detected in dependency-map |
| Apps → engines (forward only) | CLEAN | 26 VCSM→engine dependencies, all forward |
| Engine → app reverse import | REQUIRES_VERIFICATION | Scanner could not confirm — source check needed |

---

## Feature Count Summary

| App | Feature Count | Callgraph Node Count | Largest Feature |
|---|---|---|---|
| VCSM | 41 | ~3,200 | profiles (671 nodes) |
| wentrex | 10 | ~1,200 | wentrex:learning (765 nodes) |
| Traffic | 11 | ~600 | Traffic:data (277 nodes) |
| engines | 9 | ~700 | engine:chat (255 nodes) |

---

## Special Feature Status

| Feature | App | Status | Notes |
|---|---|---|---|
| wanders | VCSM | FROZEN | Do not modify — governance freeze |
| wanderex | VCSM | FROZEN | Do not modify — governance freeze |
| vgrid | VCSM | FROZEN | Do not modify — governance freeze |
| learning | VCSM | FROZEN | Do not modify — governance freeze |
| dev | VCSM | DEV_ONLY | 358 nodes; must not ship to production |
| debuggers-stub | VCSM | DEV_ONLY | 104 nodes; must not ship to production |
| void | VCSM | ACTIVE | 18+ anonymous realm — planned feature |
