# FEATURE-MODULARIZATION-BASELINE-001
# VCSM Feature Modularization Audit — Full Baseline

**Date:** 2026-06-07
**Scope:** apps/VCSM/src/features — 36 features
**Status:** Read-only scan. No files modified.

---

## 1. FEATURE MODULARITY MATRIX

| Feature | Files | Adapter | Index.js | Cross-Feature Internal | App-Layer | UI→DAL | Hook→DAL | Naming Drift | Grade |
|---------|-------|---------|----------|----------------------|-----------|--------|----------|--------------|-------|
| actors | 4 | YES | no | NONE | NONE | NONE | NONE | NONE | CLEAN |
| ads | 18 | YES | no | NONE | NONE | NONE | NONE | NONE | CLEAN |
| auth | 64 | YES | yes (stub) | NONE | useAuthOnboarding→AuthProvider; LoginScreen→ios/ | NONE | NONE | NONE | MOSTLY_CLEAN |
| block | 18 | YES | yes | NONE | NONE | NONE | NONE | NONE | CLEAN |
| booking | 68 | YES | no | NONE | NONE | NONE | NONE | controller/ (singular) | MOSTLY_CLEAN |
| chat | 66 | YES | yes | block via adapter | ConversationView→@/app/platform | NONE | NONE | NONE | CLEAN |
| debug | 3 | no | no | NONE | NONE | NONE | NONE | NONE | CLEAN |
| explore | 22 | no | no | NONE | NONE | NONE | NONE | controller/, model/ (singular) | MOSTLY_CLEAN |
| feed | 46 | YES | no | NONE | CentralFeedScreen→AuthProvider | NONE | NONE | controllers/ + model/ mixed | MOSTLY_CLEAN |
| flyerBuilder | 54 | YES | no | NONE | NONE | NONE | NONE | controller/, model/ (singular) | MOSTLY_CLEAN |
| hydration | 2 | no | no | NONE | vcsmActorHydrator→@/state/identity/* | N/A | N/A | N/A | FROZEN |
| identity | 10 | YES | no | NONE | NONE | NONE | NONE | controller/ (singular) | CLEAN |
| initiation | 18 | YES | no | NONE | NONE | NONE | NONE | controller/, model/ (singular) | DRIFT |
| invite | 6 | no | no | NONE | NONE | NONE | NONE | controller/ (singular) | DRIFT |
| join | 12 | no | no | NONE | NONE | NONE | NONE | NONE | CLEAN |
| legal | 26 | YES | no | NONE | useLegalConsent→AuthProvider | NONE | NONE | NONE | MOSTLY_CLEAN |
| media | 9 | YES | no | NONE | NONE | NONE | NONE | controller/, model/ (singular) | DRIFT |
| moderation | 35 | YES | no | NONE | NONE | NONE | NONE | NONE | CLEAN |
| notifications | 45 | YES | no | NONE | NONE | NONE | NONE | NONE | CLEAN |
| portfolio | 2 | YES | no | NONE | NONE | NONE | NONE | NONE | CLEAN |
| post | 116 | YES | no | NONE | NONE | NONE | NONE | components/ + ui/ coexist | DRIFT |
| professional | 33 | no | no | NONE | NONE | NONE | NONE | components/ + ui/ coexist | DRIFT |
| profiles | 376 | YES | no | NONE | ActorProfileHeader→AuthProvider | NONE | NONE | components/ + ui/ coexist | MOSTLY_CLEAN |
| public | 64 | YES | no | NONE | VportPublicReviewsPanel→AuthProvider | NONE | NONE | NONE | CLEAN |
| qrcode | 9 | YES | yes (EMPTY) | NONE | NONE | NONE | NONE | NONE | DELETE_CANDIDATE |
| reviews | 1 | no | no | NONE | NONE | NONE | NONE | NONE | DELETE_CANDIDATE |
| settings | 91 | YES | yes (stub) | profiles/media/vport via adapters | NONE | NONE | NONE | NONE | MOSTLY_CLEAN |
| shell | 6 | YES | no | NONE | NONE | NONE | NONE | NONE | CLEAN |
| social | 45 | YES | no | feed/notifications/block via adapters | NONE | NONE | NONE | NONE | CLEAN |
| upload | 38 | YES | no | identity/notifications/block via adapters | NONE | NONE | NONE | controller/ AND controllers/ BOTH exist | NEEDS_REORG |
| vgrid | 10 | YES | yes | NONE | NONE | NONE | NONE | 11 empty/stub index files | DRIFT |
| void | 11 | YES | no | NONE | NONE | NONE | NONE | void.js stub | FROZEN |
| vport | 29 | YES | no | settings/identity via adapters | NONE | NONE | NONE | controller/, model/ (singular) | CLEAN |
| vportDashboard | 199 | YES | no | identity via adapters (13+ instances) | NONE | NONE | NONE | NONE | CLEAN |
| wanderex | 22 | no | no | NONE | NONE | NONE | useWanderExProfile→dal; useWanderExDirectory→dal | NONE | NEEDS_REORG |
| wanders | 124 | YES | no | public/media via adapters | NONE | NONE | NONE | model/ AND models/ BOTH exist | NEEDS_REORG |

---

## 2. GRADE DISTRIBUTION

| Grade | Count | Features |
|-------|-------|---------|
| CLEAN | 15 | actors, ads, block, chat, debug, identity, join, moderation, notifications, portfolio, public, shell, social, vport, vportDashboard |
| MOSTLY_CLEAN | 8 | auth, booking, explore, feed, flyerBuilder, legal, profiles, settings |
| DRIFT | 6 | initiation, invite, media, post, professional, vgrid |
| NEEDS_REORG | 3 | upload, wanderex, wanders |
| FROZEN | 2 | hydration, void |
| DELETE_CANDIDATE | 2 | qrcode, reviews |

**Total:** 36 features

---

## 3. TOP MODULARIZATION BLOCKERS

### P0 — Architectural Violations (Fix First)

| ID | Feature | Violation | File | Priority |
|----|---------|-----------|------|----------|
| P0-001 | wanderex | Hook→DAL direct import (bypasses controller layer) | wanderex/hooks/useWanderExProfile.js → dal/ | CRITICAL |
| P0-002 | wanderex | Hook→DAL direct import (bypasses controller layer) | wanderex/hooks/useWanderExDirectory.js → dal/ | CRITICAL |

### P1 — Structural Issues (Systemic)

| ID | Feature | Violation | Detail |
|----|---------|-----------|--------|
| P1-001 | upload | Dual directory conflict | Both `controller/` AND `controllers/` exist; createPost.controller.js duplicated across both |
| P1-002 | wanders | Dual directory conflict | Both `model/` AND `models/` exist; split model files |
| P1-003 | wanderex | No adapter | External consumers cannot isolate this feature |
| P1-004 | professional | No adapter | Feature has no public surface — cannot verify isolation |
| P1-005 | explore | No adapter | Feature has no public surface |
| P1-006 | invite | No adapter | Feature has no public surface |
| P1-007 | join | No adapter | Feature has no public surface |
| P1-008 | debug | No adapter | Dev-only, acceptable — no external consumers expected |
| P1-009 | feed | UI→App-layer | CentralFeedScreen.jsx imports AuthProvider directly from @/app/ |
| P1-010 | hydration | App-layer bridge | vcsmActorHydrator.js imports @/state/identity/* — planned migration (ARCH-ENGINESETUP-001) |

### P2 — Naming Drift (Cosmetic but Systematic)

| ID | Scope | Pattern | Features Affected |
|----|-------|---------|-------------------|
| P2-001 | controller naming | controller/ (singular) vs canonical controllers/ (plural) | booking, explore, flyerBuilder, identity, initiation, invite, media, vport |
| P2-002 | model naming | model/ (singular) vs canonical models/ (plural) | explore, flyerBuilder, initiation, media, vport |
| P2-003 | component naming | components/ + ui/ coexist in same feature | post, professional, profiles |
| P2-004 | stub indexes | Empty/near-empty index.js files present | auth, qrcode, settings, vgrid |

### P3 — Cleanup

| ID | Feature | Issue |
|----|---------|-------|
| P3-001 | vgrid | 11 stub/empty index.js files for 10 actual code files |
| P3-002 | qrcode | Empty root index.js (0 bytes) — either populate or delete |
| P3-003 | reviews | Single setup.js stub — planned migration to app/setup/ |
| P3-004 | portfolio | Single setup.js stub — planned migration to app/setup/ |
| P3-005 | void | void.js stub ("// void DAL (stub) export {}") |
| P3-006 | auth | 3 stub/near-empty index files (ui/index.js, usecases/index.js, index.js) |

---

## 4. RECOMMENDED TICKET QUEUE

### MOD-001 — wanderex: Hook→DAL Violation (P0)
**Priority:** P0
**Risk:** MEDIUM (feature is FROZEN per project rules)
**Action:** Create controllers layer; route useWanderExProfile and useWanderExDirectory through controllers before DAL
**Note:** wanderex is a FROZEN feature per DOCS-ORG-001. Flag for future sprint when freeze lifts.

### MOD-002 — upload: Dual Controller Directories (P1)
**Priority:** P1
**Risk:** LOW
**Action:** Audit controller/ vs controllers/ contents; consolidate into controllers/ (plural); verify no duplicate logic
**Effort:** MEDIUM (38 files, must trace all imports)

### MOD-003 — wanders: Dual Model Directories (P1)
**Priority:** P1
**Risk:** LOW
**Action:** Merge model/ and models/ into models/ (plural); update all internal imports
**Effort:** LOW (4 model files to merge)

### MOD-004 — Singular→Plural Controller Rename Sweep (P2)
**Priority:** P2
**Risk:** LOW
**Action:** Rename controller/ → controllers/ in: booking, explore, flyerBuilder, initiation, invite, media
**Note:** identity uses controller/ (singular) — decide if it follows the standard or documents intentional exception
**Effort:** LOW per feature; run as batch

### MOD-005 — Singular→Plural Model Rename Sweep (P2)
**Priority:** P2
**Risk:** LOW
**Action:** Rename model/ → models/ in: explore, flyerBuilder, initiation, media
**Effort:** LOW per feature; run as batch

### MOD-006 — components/ vs ui/ Standardization (P2)
**Priority:** P2
**Risk:** LOW
**Action:** Decide canonical: use components/ everywhere. Audit post, professional, profiles submodules and rename ui/ → components/ or document intentional split
**Effort:** MEDIUM (profiles is 376 files — requires careful scoped rename)

### MOD-007 — Stub Index.js Cleanup (P3)
**Priority:** P3
**Risk:** NONE
**Action:** Delete or populate: auth/ui/index.js, auth/usecases/index.js, qrcode/index.js, settings/profile/index.js, vgrid/*/index.js stubs
**Effort:** LOW

### MOD-008 — reviews + portfolio: Setup.js Migration (P3)
**Priority:** P3
**Risk:** LOW (depends on ARCH-ENGINESETUP-001 readiness)
**Action:** After ARCH-ENGINESETUP-001, move reviews/setup.js and portfolio/setup.js to app/setup/; delete feature directories
**Effort:** LOW (tracked against ARCH-ENGINESETUP-001)

---

## 5. SAFE EXECUTION ORDER

```
Phase 1 — Zero-Risk Cleanup (no import changes)
  MOD-007  Stub index cleanup (delete/populate empty indexes)
  MOD-008  Setup.js migration (reviews, portfolio) — post ARCH-ENGINESETUP-001

Phase 2 — Rename Sweeps (low-risk, mechanical)
  MOD-004  controller/ → controllers/ (booking, explore, flyerBuilder, initiation, invite, media)
  MOD-005  model/ → models/ (explore, flyerBuilder, initiation, media)
  MOD-003  wanders model/ → models/ merge

Phase 3 — Structural Consolidation (medium-risk)
  MOD-006  components/ vs ui/ standardization (post, professional, profiles)
  MOD-002  upload: dual controller directory consolidation

Phase 4 — Architecture Fix (when freeze lifts)
  MOD-001  wanderex: hook→DAL violation (blocked by FROZEN status)
```

---

## 6. FEATURES THAT MUST NOT BE TOUCHED YET

| Feature | Reason | Authority |
|---------|--------|-----------|
| hydration | Planned migration per ARCH-ENGINESETUP-001; intentional app-layer bridge | ARCH plan |
| void | FROZEN — Void Realm planned feature; stub intentional | Project freeze |
| wanderex | FROZEN per DOCS-ORG-001 | Project freeze |
| wanders | FROZEN per DOCS-ORG-001 | Project freeze |
| vgrid | FROZEN per DOCS-ORG-001 | Project freeze |
| reviews | Awaiting ARCH-ENGINESETUP-001; single-file stub only | ARCH plan |
| portfolio | Awaiting ARCH-ENGINESETUP-001; single-file stub only | ARCH plan |

---

## 7. FEATURES READY FOR MECHANICAL CLEANUP

These features have zero architectural violations and only cosmetic naming drift. Safe to rename in place.

| Feature | Ticket | Action | Effort |
|---------|--------|--------|--------|
| initiation | MOD-004, MOD-005 | controller/ → controllers/, model/ → models/ | LOW |
| invite | MOD-004 | controller/ → controllers/ | LOW |
| media | MOD-004, MOD-005 | controller/ → controllers/, model/ → models/ | LOW |
| booking | MOD-004 | controller/ → controllers/ | LOW |
| flyerBuilder | MOD-004, MOD-005 | controller/ → controllers/, model/ → models/ | LOW |

---

## 8. APP-LAYER IMPORT SUMMARY

All app-layer imports detected are `@/app/providers/AuthProvider` — a global auth context. These are **acceptable** in screen-layer components that require auth state. They are **not acceptable** in hooks, controllers, or DAL.

| File | Import | Assessment |
|------|--------|-----------|
| auth/hooks/useAuthOnboarding.js | AuthProvider | REVIEW — hook importing from app/ is borderline |
| chat/screens/ConversationView.jsx | @/app/platform | ACCEPTABLE — platform utility |
| feed/screens/CentralFeedScreen.jsx | AuthProvider | ACCEPTABLE — screen layer |
| legal/hooks/useLegalConsent.js | AuthProvider | REVIEW — hook importing from app/ is borderline |
| profiles/screens/ActorProfileHeader.jsx | AuthProvider | ACCEPTABLE — screen layer |
| public/vportMenu/.../VportPublicReviewsPanel.jsx | AuthProvider | ACCEPTABLE — screen layer |

**Hook-level app imports (auth, legal):** borderline. Consider routing through `useIdentity()` from identity adapter instead.

---

## 9. CROSS-FEATURE IMPORT HEALTH

All detected cross-feature imports route through adapter boundaries correctly. No feature directly imports another feature's dal/, controllers/, hooks/, or model/ internals.

**Confirmed clean cross-feature adapter usage:**
- chat → block (adapter)
- social → feed, notifications, block (adapters)
- upload → identity, notifications, block (adapters)
- vport → settings, identity (adapters)
- vportDashboard → identity (adapter, 13+ instances)
- wanders → public, media (adapters)
- settings → profiles, media, vport (adapters)

---

## 10. TOTAL VIOLATION COUNTS

| Severity | Count | Type |
|----------|-------|------|
| P0 (Hook→DAL) | 2 | wanderex hooks bypass controller |
| P1 (Structural) | 10 | dual directories, missing adapters, app-layer imports |
| P2 (Naming drift) | ~25 | singular dirs, components/ui coexistence |
| P3 (Cleanup) | 6 | stubs, empty files, dead indexes |
| **TOTAL** | **~43** | |

---

## 11. NAMING CONVENTION DECISION REQUIRED

The codebase has three competing patterns:

| Pattern | Features Using It | Recommendation |
|---------|------------------|----------------|
| controllers/ + models/ (plural) | moderation, notifications, join, wanders, settings | **CANONICAL — adopt universally** |
| controller/ + model/ (singular) | actors, booking, explore, flyerBuilder, identity, initiation, invite, media, vport | Rename to plural |
| Mixed | feed (controllers/ + model/) | Normalize to plural |

**Recommendation:** Establish canonical plural as standard. See `NAMING_CONVENTION_DECISION.md` for any prior decisions.

---

*Report generated by FEATURE-MODULARIZATION-BASELINE-001 scan.*
*Do not modify source files until ticket MOD-00X is opened and approved.*
