# VCSM MODULE ARCHITECTURE SUMMARY

**Generated:** 2026-05-11
**Scope:** `apps/VCSM/src/features/` — all 34 feature modules
**Architect:** ARCHITECT command — read-only scan and report
**Output Location:** `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/modules/`

---

## MODULE COMPLETENESS TABLE

| Module | Status | Independence | Critical Flags | Report |
|---|---|---|---|---|
| auth | MOSTLY COMPLETE | MOSTLY INDEPENDENT | Actor creation atomicity | vcsm.auth.architecture.md |
| booking | INCOMPLETE | DEPENDENT | Dual write DAL with dashboard, no screens | vcsm.booking.architecture.md |
| feed | MOSTLY COMPLETE | MOSTLY INDEPENDENT | Dual controller/ + controllers/ folders | vcsm.feed.architecture.md |
| post | MOSTLY COMPLETE | MOSTLY INDEPENDENT | Dual PostCard adapter paths | vcsm.post.architecture.md |
| chat | MOSTLY COMPLETE | DEPENDENT | Block DAL in inbox, senders DAL in chat | vcsm.chat.architecture.md |
| wanders | INCOMPLETE | FRAGMENTED | Custom Supabase client, dual DAL, dual models | vcsm.wanders.architecture.md |
| dashboard | MOSTLY COMPLETE (CRITICAL) | MOSTLY INDEPENDENT | Booking DAL duplicated, model in dal folder | vcsm.dashboard.architecture.md |
| profiles | MOSTLY COMPLETE | MOSTLY INDEPENDENT | Adapter naming violations, 100+ files | vcsm.profiles.architecture.md |
| social | MOSTLY COMPLETE | MOSTLY INDEPENDENT | followRequestsStore at global level | vcsm.social.architecture.md |
| settings | MOSTLY COMPLETE | MOSTLY INDEPENDENT | Model in UI folder, queries/ dead code risk | vcsm.settings.architecture.md |
| notifications | MOSTLY COMPLETE | MOSTLY INDEPENDENT | Duplicate NotiViewPostScreen, hook in screen/ | vcsm.notifications.architecture.md |
| identity | MOSTLY COMPLETE | FRAGMENTED | Split across features/ and state/, hot path | vcsm.identity.architecture.md |
| upload | MOSTLY COMPLETE | MOSTLY INDEPENDENT | Dual controller folders, legacy screen | vcsm.upload.architecture.md |
| moderation | MOSTLY COMPLETE | MOSTLY INDEPENDENT | No admin screen, block DAL ownership | vcsm.moderation.architecture.md |
| public | MOSTLY COMPLETE | MOSTLY INDEPENDENT | Email DAL security surface, spam risk | vcsm.public.architecture.md |
| wanderex | INCOMPLETE | FRAGMENTED | No controller layer, hooks call DAL directly | vcsm.wanderex.architecture.md |
| explore | MOSTLY COMPLETE | MOSTLY INDEPENDENT | usecases/ violation, no adapter | vcsm.explore.architecture.md |
| onboarding | MOSTLY COMPLETE | MOSTLY INDEPENDENT | vibeInvites.dal.js possibly dead | vcsm.onboarding.architecture.md |
| legal | MOSTLY COMPLETE | MOSTLY INDEPENDENT | IP collection privacy risk | vcsm.legal.architecture.md |
| vport | MOSTLY COMPLETE | MOSTLY INDEPENDENT | CreateVportForm at feature root, .jsx.adapter.js | vcsm.vport.architecture.md |
| actors | MOSTLY COMPLETE | INDEPENDENT | Clean headless module | vcsm.actors.architecture.md |
| block | MOSTLY COMPLETE | MOSTLY INDEPENDENT | Block DAL duplicated in 3 features | vcsm.block.architecture.md |
| ads | INCOMPLETE | MOSTLY INDEPENDENT | usecases/ violation, localStorage DAL | vcsm.ads.architecture.md |
| professional | INCOMPLETE | FRAGMENTED | localStorage access gate (CRITICAL), seed data | vcsm.professional.architecture.md |
| invite | MOSTLY COMPLETE | MOSTLY INDEPENDENT | Dal/controller may be stale post-refactor | vcsm.invite.architecture.md |
| join | MOSTLY COMPLETE | MOSTLY INDEPENDENT | Barbershop-only, not generalized | vcsm.join.architecture.md |
| hydration | MOSTLY COMPLETE | DEPENDENT | Inline Supabase call in hydrator, N+1 risk | vcsm.hydration.architecture.md |
| portfolio | MOSTLY COMPLETE | DEPENDENT | Engine wrapper only — minimal | vcsm.portfolio.architecture.md |
| reviews | MOSTLY COMPLETE | DEPENDENT | Engine wrapper only — minimal | vcsm.reviews.architecture.md |
| media | MOSTLY COMPLETE | DEPENDENT | No adapter — controller imported cross-feature | vcsm.media.architecture.md |
| vgrid | INCOMPLETE (NOT STARTED) | UNKNOWN | All empty stubs, usecases/ pre-violation | vcsm.vgrid.architecture.md |
| void | INCOMPLETE (PLACEHOLDER) | UNKNOWN | No auth gate on 18+ realm screen (CRITICAL) | vcsm.void.architecture.md |
| debug | DEPRECATED | N/A | Debug module in production feature tree | vcsm.debug.architecture.md |
| ui | MOSTLY COMPLETE | INDEPENDENT | Design primitives in features/ not shared/ | vcsm.ui.architecture.md |

---

## STATUS DISTRIBUTION

| Status | Count | Modules |
|---|---|---|
| MOSTLY COMPLETE | 22 | auth, feed, post, chat, dashboard, profiles, social, settings, notifications, identity, upload, moderation, public, explore, onboarding, legal, vport, actors, block, invite, join, hydration, portfolio, reviews, media, ui |
| INCOMPLETE | 5 | booking, wanders, wanderex, ads, professional |
| NOT STARTED | 1 | vgrid |
| PLACEHOLDER | 1 | void |
| DEPRECATED | 1 | debug |

---

## INDEPENDENCE DISTRIBUTION

| Independence | Count | Modules |
|---|---|---|
| INDEPENDENT | 2 | actors, ui |
| MOSTLY INDEPENDENT | 22 | auth, feed, post, dashboard, profiles, social, settings, notifications, upload, moderation, public, explore, onboarding, legal, vport, block, ads, invite, join, media |
| DEPENDENT | 5 | chat, hydration, portfolio, reviews, booking |
| FRAGMENTED | 4 | wanders, wanderex, identity, professional |
| UNKNOWN | 2 | vgrid, void |
| DEPRECATED | 1 | debug |

---

## CRITICAL RISK FLAGS

These require immediate attention before new feature development in affected modules.

### SECURITY CRITICAL

| Risk | Module | File | Handoff |
|---|---|---|---|
| localStorage access gate (bypassable) | professional | `core/storage/professionalAccess.storage.js` | VENOM |
| Custom Supabase client (separate auth session) | wanders | `services/wandersSupabaseClient.js` | VENOM |
| No auth/age gate on 18+ void screen | void | `VoidScreen.jsx` | VENOM |
| IP collection on consent signature | legal | `getPublicIp.dal.js` | VENOM |
| Lead form — no spam protection visible | public | `sendLeadConfirmationEmail.edge.dal.js` | VENOM |
| localStorage-backed business DAL | ads | `dal/ad.storage.dal.js` | VENOM |

### DATA INTEGRITY CRITICAL

| Risk | Module | Evidence | Handoff |
|---|---|---|---|
| Dual write DAL — booking tables owned by 2 features | dashboard + booking | `dashboard/vport/dal/write/insertVportBooking.write.dal.js` | SENTRY |
| Hard-coded seed data in production feature | professional | `enterprise/data/enterpriseSeed.data.js` | IRONMAN |
| No controller layer — hooks call DAL directly | wanderex | `hooks/useWanderExBookingFlow.js` | IRONMAN |

### ARCHITECTURE VIOLATIONS

| Violation | Module | Evidence | Handoff |
|---|---|---|---|
| Dual `controller/` + `controllers/` folders | feed, upload | Two controller folders in same feature | SENTRY |
| `usecases/` layer used instead of `controllers/` | ads, explore | `adPipeline.usecase.js`, `search.usecase.js` | SENTRY |
| Custom Supabase client (bypasses platform singleton) | wanders | `wandersSupabaseClient.js` | SENTRY |
| Model file inside DAL folder | dashboard | `flyerBuilder/dal/flyerDraft.model.js` | SENTRY |
| Model file inside UI folder | settings | `profile/ui/vportAboutDetails.model.js` | SENTRY |
| Model file inside screens/ folder | wanderex | `wanderexProfileScreen.model.js` | SENTRY |
| Inline Supabase call inside hydrator | hydration | `vcsmActorHydrator.js:65-72` | SENTRY |
| Controller imported cross-feature (no adapter) | media | `createMediaAsset.controller.js` | SENTRY |
| Screen component at feature root | vport | `CreateVportForm.jsx` | SENTRY |
| Hook file inside `screen/` folder | notifications | `screen/hooks/useMyAppointments.js` | SENTRY |
| Debug module in production `features/` tree | debug | Entire module | IRONMAN |
| `usecases/` pre-stub in planned module | vgrid, void | `usecases/index.js` stubs | SENTRY |

### DUPLICATE / DEAD CODE

| Risk | Modules | Evidence | Handoff |
|---|---|---|---|
| Block DAL duplicated across 3 features | block, chat, notifications, settings | `blocks.read.dal.js` in chat/inbox, notifications/inbox, settings/privacy | SENTRY |
| Duplicate NotiViewPostScreen | notifications | 2 files same name in different subdirs | IRONMAN |
| Duplicate wandersCardKeys DAL | wanders | root `dal/` + `core/dal/read/` | IRONMAN |
| Duplicate wandersCardKeys controller | wanders | root `controllers/` + `core/controllers/` | IRONMAN |
| Dual model folders | wanders | `model/` + `models/` | IRONMAN |
| Dual useWandersReplies hooks | wanders | `useWandersReplies.hook.js` + `useWandersReplies.js` | IRONMAN |
| Dual PostCard adapter paths | post | Two PostCard adapter files | IRONMAN |
| Legacy UploadScreen alongside UploadScreenModern | upload | Both exist in same feature | IRONMAN |
| `vibeInvites.dal.js` possibly dead | onboarding | Post-invite-refactor — may be stale | IRONMAN |
| `debug` feature entire module deprecated | debug | `loginDebug.store.js` — re-export shim only | IRONMAN |
| `vgrid` skeleton with no implementation | vgrid | All 10 files empty stubs | IRONMAN |

### NAMING VIOLATIONS

| Violation | Module | Evidence |
|---|---|---|
| `.jsx.adapter.js` extension | profiles, vport | `ProfileCard.jsx.adapter.js` etc. |
| `.js.adapter.js` extension | profiles | Mixed naming |
| `useMyBlocks.jsx` wrong extension | settings | Hook file with `.jsx` |
| `local engine/` folder inside feature | legal | `engine/legalCompliance.engine.js` |

---

## MODULES WITHOUT ADAPTERS

Modules that are consumed by other features but expose no adapter boundary:

| Module | Missing Adapter | Cross-Feature Risk |
|---|---|---|
| join | No adapter | LOW — not consumed widely |
| invite | No adapter | LOW — not consumed widely |
| explore | No adapter | MEDIUM — search used across features |
| media | No adapter | MEDIUM — createMediaAsset used cross-feature |
| professional | No adapter | HIGH — professional workspace consumed by app shell |
| wanderex | No adapter | HIGH — booking flow cross-feature risk |

---

## MODULES WITH MISSING DOCUMENTATION

All 34 modules are missing Logan documentation files. Documentation is a universal gap across the entire `features/` tree.

**Highest priority for Logan:**
1. wanders — fragmented, highest complexity
2. professional — security risks
3. booking — data integrity risk
4. wanderex — architecture violations
5. identity — critical hot path
6. dashboard — largest module (130+ files)

---

## SPAGHETTI SCORE BY MODULE

Scored 0-10 based on: violations, duplication, missing layers, security risks, fragmentation.

| Module | Score | Primary Reason |
|---|---|---|
| wanders | 9 | Custom client, dual DAL, dual models, dual controllers, duplicate hooks |
| professional | 8 | localStorage gate, seed data, missing DAL/controllers for 2 sub-modules |
| wanderex | 8 | No controller layer, duplicate submit hooks, model in screens/ |
| dashboard | 7 | Booking DAL duplicated, model in dal/, mega-module |
| ads | 6 | usecases/ violation, localStorage DAL, no controller |
| notifications | 5 | Duplicate screen, hook in wrong folder, MyAppointments ownership |
| settings | 5 | Model in UI folder, queries/ dead code, block ownership |
| feed | 4 | Dual controller folders, pipeline/api/queries layers |
| upload | 4 | Dual controller folders, legacy screen |
| identity | 4 | Split across two roots, inflight controller unclear |
| chat | 3 | Block DAL in inbox, senders DAL, unread count overlap |
| profiles | 3 | Naming violations, 100+ files |
| explore | 3 | usecases/ violation, no adapter |
| post | 2 | Dual PostCard adapter paths |
| block | 2 | DAL duplicated in 3 features |
| social | 2 | followRequestsStore global placement |
| void | 2 | No auth gate (CRITICAL but small module) |
| booking | 2 | No screens, dual DAL with dashboard |
| debug | 2 | Deprecated in production tree |
| legal | 2 | IP collection risk |
| public | 2 | Email DAL security surface |
| auth | 1 | Atomicity risk, minor empty folders |
| hydration | 1 | Inline Supabase call |
| vport | 1 | Form at root, naming violation |
| onboarding | 1 | Possibly dead DAL |
| media | 1 | No adapter |
| vgrid | 1 | All stubs, usecases/ pre-stub |
| actors | 0 | Clean |
| portfolio | 0 | Engine wrapper — correct |
| reviews | 0 | Engine wrapper — correct |
| join | 0 | Clean |
| invite | 0 | Clean |
| ui | 0 | Clean |

---

## HANDOFF QUEUE SUMMARY

### VENOM (Security)
- `professional` — localStorage access gate
- `wanders` — custom Supabase client
- `void` — no auth gate on 18+ screen
- `legal` — IP collection
- `ads` — localStorage DAL
- `public` — email edge surface

### SENTRY (Architecture Boundaries)
- `dashboard` + `booking` — dual write DAL ownership
- `feed` + `upload` — dual controller folder
- `ads` + `explore` — usecases layer violation
- `wanders` — custom Supabase client
- `dashboard` — model in dal folder
- `settings` — model in UI folder
- `wanderex` — model in screens/
- `hydration` — inline Supabase call
- `media` — no adapter boundary
- `notifications` — hook in screen folder
- `block` — DAL duplicated in 3 features
- `vgrid` + `void` — usecases/ pre-stubs
- `vport` — form at feature root

### IRONMAN (Ownership / Cleanup)
- `wanders` — dual DAL, dual models, dual controllers, duplicate hooks
- `professional` — seed data, missing DAL for enterprise/nurse
- `wanderex` — no controller layer, build controller layer
- `notifications` — duplicate screen, MyAppointments ownership
- `debug` — delete or relocate deprecated module
- `vgrid` — define or delete skeleton
- `upload` — retire legacy UploadScreen
- `post` — resolve dual PostCard adapter
- `onboarding` — confirm vibeInvites.dal.js status
- `invite` — confirm dal/controller post-refactor
- `join` — generalize for non-barbershop VPORT types
- `void` — realm switching architecture
- `ui` — evaluate moving to shared/

### CARNAGE (Schema)
- `professional` — are enterprise/nurse DB-backed? No schema documented
- `booking` — confirm dual-ownership tables
- `public` — email edge function schema

### KRAVEN (Performance)
- `hydration` — N+1 owner resolution on cache miss
- `dashboard` — calendar N+1 risk
- `wanders` — parallel vs sequential read chains

### LOGAN (Documentation)
- All 34 modules need documentation
- Priority: wanders, professional, booking, wanderex, identity, dashboard

---

## PHASE COMPLETION REPORT

| Phase | Status |
|---|---|
| Phase 1 — Read and Index | COMPLETE |
| Phase 2 — Module Discovery Plan | COMPLETE |
| Phase 3 — Module Reports (34/34) | COMPLETE |
| Phase 4 — Global Summary | COMPLETE |

**Total module reports generated:** 34
**Output path:** `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/modules/`
**Summary path:** `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/vcsm-module-architecture-summary.md`

---

## RECOMMENDED NEXT COMMAND SEQUENCE

1. **`/Venom`** — Security audit: start with `professional` localStorage gate + `void` auth gap + `wanders` custom client
2. **`/Sentry`** — Boundary enforcement: dual booking DAL, usecases violations, block DAL consolidation
3. **`/Ironman`** — Ownership resolution: wanders cleanup, wanderex controller layer, debug/vgrid decisions
4. **`/Logan`** — Documentation: write Logan docs for top-priority modules (wanders, booking, wanderex, identity)
5. **`/Carnage`** — Schema review: professional enterprise/nurse DB schema definition

---

*ARCHITECT report complete. No application code was modified.*
