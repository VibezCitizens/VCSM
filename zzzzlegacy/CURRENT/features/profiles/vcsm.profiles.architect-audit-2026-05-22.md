# ARCHITECT VERIFICATION AUDIT

**Module:** profiles
**Application Scope:** apps/VCSM
**Source Document:** `vcsm.profiles.architecture.md`
**Audit Date:** 2026-05-22
**Auditor:** ARCHITECT
**Audit Type:** Stale-claim verification, boundary map, spaghetti detection, dead code detection

---

## SCOPE DECLARATION

Boundary: VCSM (single-root)
Protected root in scope: `/Users/vcsm/Desktop/VCSM/apps/VCSM`

---

## STALE CLAIM VERIFICATION

The source document contains the following claims. Each has been verified against the filesystem.

| Claim | Document Value | Actual Value | Status |
|---|---|---|---|
| DAL files | "15+ files" | **72 files** | STALE — 80% undercount |
| Controller files | "6 controllers" | **61 files** | STALE — 10× undercount |
| Adapter files | "16+ adapters" | **20 files** | STALE — minor undercount |
| Screen files | "7 screens" | **32 screen files** | STALE — 4.5× undercount |
| Hook files | "various" | **66 files** | UNVERIFIABLE — vague claim |
| Component files | "50+ components" | **132 files** | STALE — 2.6× undercount |
| Model files | not mentioned | **42 files** | MISSING from document |
| Total module files | not stated | **416 files** | MISSING from document |

**Finding:** All quantitative claims in the source document are materially understated. The profiles module is significantly larger than documented.

---

## NAMING VIOLATIONS — CONFIRMED

Three adapter files use double-extension naming that violates the naming contract:

| File | Violation Pattern |
|---|---|
| `adapters/kinds/vport/hooks/rates/useUpsertVportRate.js.adapter.js` | `.js.adapter.js` |
| `adapters/kinds/vport/screens/rates/components/VportRateEditorCard.jsx.adapter.js` | `.jsx.adapter.js` |
| `adapters/kinds/vport/screens/rates/view/VportRatesView.jsx.adapter.js` | `.jsx.adapter.js` |

**Risk:** HIGH — violates adapter naming contract. Tooling (linters, bundlers, imports) may misclassify these files.
**Handoff:** LOGAN

---

## LAYER VIOLATION — CONTROLLER IMPORTS FROM SCREENS

**SPAGHETTI CODE FINDING**
Location: `apps/VCSM/src/features/profiles/controller/post/getActorPosts.controller.js`
Pattern: Controller imports from a screens subdirectory
Evidence:
```js
import { PostModel } from "@/features/profiles/screens/views/tabs/post/models/post.model"
```
The `PostModel` lives inside `screens/views/tabs/post/models/` — a screen-layer path. A controller must never depend downward on a screen-layer module.
Expected: Model files belong in `model/` or `kinds/*/model/` at the feature root, not nested inside `screens/`.
Risk: MODERATE — breaks layer isolation; controller is coupled to screen-local model
Handoff: SENTRY

---

## DUPLICATE POST DAL READS — CONFIRMED

**DUPLICATE IMPLEMENTATION FINDING**
Behavior: Reading actor posts from `vc.posts`
Locations:
1. `apps/VCSM/src/features/profiles/dal/readActorPosts.dal.js`
   - Reads: `vc.posts`, `vc.post_media`
2. `apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js`
   - Reads: `vc.posts`, `vc.post_media`, `vc.post_mentions`, `vc.actors`, `public.profiles`, `vport.profiles`

Active paths:
- `readActorPosts.dal.js` is the original read path (used in profile tab)
- `fetchPostsForActor.dal.js` is the enriched path with mentions and actor hydration

Risk: HIGH — two DAL methods reading overlapping tables (`vc.posts`, `vc.post_media`) with different shapes. Caller must choose manually; incorrect choice leads to inconsistent data surface.
Canonical owner: Unclear — both live in profiles. The enriched version should belong to the `post` feature and be consumed via adapter.
Recommended consolidation: Move enriched read to `post` feature, consume via `post.adapter` in profiles.

---

## DEAD STRUCTURE DETECTED

**DEAD CODE FINDING**
Location: `apps/VCSM/src/features/profiles/screens/views/tabs/post/dal/`
Code Type: Empty directory
Classification: LIKELY DEAD — directory exists with no files
Evidence: Directory present, confirmed empty
Risk: LOW — structural noise, no runtime impact
Recommended action: VERIFY USAGE — if no future use planned, remove
Recommended handoff: LOGAN

---

## RE-EXPORT ANTI-PATTERN

**DEAD CODE FINDING**
Location: `apps/VCSM/src/features/profiles/screens/views/tabs/post/controllers/getActorPosts.controller.js`
Code Type: Re-export wrapper
Classification: POSSIBLY LEGACY — file re-exports from `@/features/profiles/controller/post/getActorPosts.controller`
Evidence: File contains only a re-export, no logic. The canonical controller already exists at the root controller path.
Risk: MEDIUM — creates two import paths for the same controller; callers may use either
Recommended action: CONSOLIDATE — remove re-export, update callers to use canonical path
Recommended handoff: LOGAN

---

## RAW UUID IN PUBLIC ROUTE — CONFIRMED

**MODULE BOUNDARY WARNING**
Location: `apps/VCSM/src/app/routes/index.jsx`
Module: profiles
Current dependency: Route `/profile/:actorId` exposes raw actorId (UUID) in URL
Expected boundary: All public profile URLs must use human-readable slugs (e.g., `/@:username`)
Risk: HIGH — violates no-raw-IDs-in-public-URLs platform rule. Raw UUIDs in shareable URLs are a security and UX concern.
Suggested correction: Confirm whether `/profile/:actorId` is still a public route or a redirect-only internal path. If public, replace with slug-based routing.
Handoff: VENOM

---

## STATE/ACTORS IMPORT PATH

**FINDING (ACCEPTABLE WITH NOTE)**
Location: `apps/VCSM/src/features/profiles/controller/post/getActorPosts.controller.js`
Import: `@/state/actors/hydrateActors` and `@/state/actors/actorStore`
Verification: `@/state/actors/` files are confirmed thin re-exports of `@hydration` engine.
Status: ACCEPTABLE — re-export wrappers are in place, canonical source is `@hydration`
Note: The re-export wrapper at `@/state/actors/` adds an unnecessary indirection. Future cleanup: controllers should import from `@hydration` directly via adapter.

---

## DEV CONSOLE.LOG VIOLATION

**FINDING**
Location: `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js`
Violation: `console.log` used directly (even in DEV-only guard):
```js
if (import.meta.env?.DEV) {
  console.log("[dalReadActorOwnerRow] actorId=", actorId, "userId=", userId);
}
```
Rule: All debug output must render on-screen in dev, never via console.log.
Risk: LOW — dev-only, but violates platform debug logging rules
Handoff: LOGAN

---

## CODE HEALTH METRICS

| Module | Files | Layers | Controller Files | DAL Files | Cross-Feature Imports | Dead Code Signals | Spaghetti Score |
|---|---:|---:|---:|---:|---:|---:|---|
| profiles (root) | 416 | 7 (DAL/Model/Controller/Hook/Adapter/Component/Screen) | 61 | 72 | 4 (identity, state/actors, shared, post-schema cross-reads) | 3 (empty dir, re-export, double-extension) | TANGLED |

---

## SPAGHETTI SCORE

Module: profiles
Score: **TANGLED**
Reasons:
- Controller imports from screen-layer model path (layer inversion)
- Duplicate post DAL reads with overlapping tables and no canonical owner
- Re-export controller creates two valid import paths to same file
- Empty DAL directory inside screens subtree (structural noise)
- 416-file mega-module with 72 DALs and 61 controllers — sustainability risk

Release risk: MEDIUM — no immediate runtime breakage, but architectural debt compounds as VPORT types are added

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P0 | Fix raw UUID in `/profile/:actorId` public route | Security/UX — raw UUID exposure | VENOM |
| P1 | Move PostModel out of screens into feature-root model/ | Layer inversion — controller→screen dependency | SENTRY |
| P1 | Consolidate duplicate post DAL reads | Two DALs reading same tables with no canonical owner | SENTRY |
| P1 | Fix adapter naming violations (3 files) | Naming contract violation | LOGAN |
| P1 | Remove re-export controller | Two import paths to same controller | LOGAN |
| P2 | Remove empty dal/ in screens/views/tabs/post/ | Structural noise | LOGAN |
| P2 | Verify app-level auth on upsertVportRate — route guard only | Auth relies on route guard, no DAL-level check | VENOM |
| P2 | Correct stale file counts in source document | Document materially incorrect | LOGAN |
| P3 | Replace console.log in actorOwners.read.dal.js | Platform debug logging rule | LOGAN |

---

## FINAL ARCHITECT AUDIT STATUS

**Stale claims:** CONFIRMED — all counts materially understated
**Naming violations:** CONFIRMED — 3 files
**Layer violations:** CONFIRMED — 1 (controller→screen import)
**Duplicate reads:** CONFIRMED — 2 DALs overlapping vc.posts
**Dead structure:** CONFIRMED — empty dal/ dir, re-export controller
**Route exposure:** CONFIRMED — `/profile/:actorId` raw UUID in URL
**Dev logging violation:** CONFIRMED — 1 file

**Recommended next commands (in order):** VENOM → SENTRY → DB → LOKI → KRAVEN → IRONMAN → LOGAN
