# TRAFFIC-MODULARIZATION-MASTER-PLAN-001 — Phase 1 Baseline Audit

**Date:** 2026-06-07
**Scope:** apps/Traffic/src
**Mode:** Read-only. No source changes.

---

## 1. Full Folder Map

```
apps/Traffic/src/
├── app/                         # Next.js 14 App Router (file-based routing)
│   ├── (seo)/                   # Canonical SEO route group
│   │   └── [city]/              # 5 nesting levels deep
│   ├── answers/                 # Answers pages (index, detail, moderation)
│   ├── api/                     # API routes
│   │   └── answers/             # 3 answer API routes
│   ├── categories/
│   ├── directory/
│   ├── en/                      # English locale mirror routes
│   ├── es/                      # Spanish locale mirror routes
│   ├── sitemaps/
│   └── top-providers/
├── components/                  # Root-level standalone component
│   └── TrazeSearchBar.jsx       # 1 file
├── config/                      # Config
│   └── trazeScreenSearch.config.js
├── data/                        # GLOBAL DATA LAYER (no public boundary)
│   ├── connectors/              # 7 files (Supabase client, datasets)
│   ├── controllers/             # 1 file (vportDataset.controller.js)
│   ├── dal/                     # 6 files (DAL reads)
│   ├── mappers/                 # 2 files (pageModel, providerIndex)
│   ├── repositories/            # 13 files (all query functions)
│   └── types.js
├── features/                    # Feature modules (7 + 1 stub)
│   ├── answers/
│   ├── categories/
│   ├── conversion/
│   ├── directories/
│   ├── home/
│   ├── providers/
│   └── reviews/
├── i18n/                        # Internationalization
│   ├── dictionaries/            # en.js, es.js
│   └── index.js
├── lib/                         # App-wide utilities
│   ├── analytics.js
│   ├── env.js
│   ├── geo/                     # 2 files
│   ├── i18n.js
│   ├── language.js
│   ├── paths.js
│   ├── revalidateClient.js
│   ├── slugs.js
│   └── trazeLocationStorage.js
├── seo/                         # SEO generation utilities
│   ├── canonical.js
│   ├── internalLinks.js
│   ├── locale.js
│   ├── metadata.js
│   ├── qualityGuards.js
│   └── schemaOrg.js
├── shared/                      # Shared UI components (Traffic-internal)
│   └── components/              # 12 files
└── styles/                      # CSS (26 files)
```

---

## 2. Feature / Module List

| # | Module | Path | File Count | Has adapters/ |
|---|--------|------|-----------|--------------|
| 1 | answers | features/answers/ | 40 | YES (partial) |
| 2 | categories | features/categories/ | 1 | NO |
| 3 | conversion | features/conversion/ | 9 | YES (partial) |
| 4 | directories | features/directories/ | 12 | NO |
| 5 | home | features/home/ | 14 | NO |
| 6 | providers | features/providers/ | 13 | NO |
| 7 | reviews | features/reviews/ | 1 | NO |

**Non-feature modules (always-global):**
- `data/` — 30 files, no public boundary
- `shared/` — 12 files, Traffic-internal UI primitives
- `seo/` — 6 files, SEO utilities
- `lib/` — 9 files, utility functions
- `components/` — 1 file (TrazeSearchBar.jsx — root-level misfile)

---

## 3. File Count per Module

### answers (40 files)
```
adapters/    1  (answers.adapter.js)
components/  13
controller/  3   ← NAMING DRIFT: should be controllers/
dal/         8
data/        0   ← EMPTY DIRECTORY (stub)
hooks/       3
model/       8   ← NAMING DRIFT: should be models/
repositories/ 0  ← EMPTY DIRECTORY (stub)
screens/     4
```

### categories (1 file)
```
components/  1  (CategoriesDiscoveryClient.jsx)
```

### conversion (9 files)
```
adapters/    1  (conversion.adapter.js)
components/  2
controller/  1   ← NAMING DRIFT: should be controllers/
dal/         1
hooks/       1
lib/         1
model/       1   ← NAMING DRIFT: should be models/
```

### directories (12 files)
```
components/  9
lib/         1
templates/   2   ← NON-STANDARD (no screens/)
```

### home (14 files)
```
components/  14
```

### providers (13 files)
```
components/  10
lib/         2
templates/   1   ← NON-STANDARD (no screens/)
```

### reviews (1 file)
```
components/  1  (ReviewTrustSummary.jsx)
```

---

## 4. Existing Adapters / Public APIs

### answers.adapter.js — PARTIAL
Exports: AnswerCard, AnswerSeoJsonLd, QuestionHeader, fetchAnswerPage, fetchAnswersIndex, AnswerDetailScreen, AnswersIndexView, AnswersModerationView

Missing: Does not export controller functions. App layer bypasses it for controller and model imports.

### conversion.adapter.js — PARTIAL
Exports: DirectoryCtaModules, ProviderCtaModules, ProviderLeadCaptureCard, useProviderLeadCapture

Missing: External consumers (directories, providers) bypass this adapter and import directly from `conversion/components/CtaModules`. The adapter exists but is not enforced.

### All others — MISSING
categories, directories, home, providers, reviews have NO adapters.

---

## 5. Controllers / Services / DAL / Data Layers

### Feature-level:
| Module | Layer | Files |
|--------|-------|-------|
| answers | controller/ | moderateAnswers, readAnswerPage, submitQuestion |
| answers | dal/ | 8 files (read + write for answers, questions, topics) |
| conversion | controller/ | submitProviderLead |
| conversion | dal/ | submitProviderLead.write.dal |

### Root data/ layer:
| Sublayer | Files |
|----------|-------|
| connectors/ | supabase.client, unifiedDataset, vportDataset, taxonomyDataset, providerReviews.connector, publicContent.connector, publicReviewSummary.connector, vportHomepage.connector |
| controllers/ | vportDataset.controller |
| dal/ | priceAggregate, providerProfile, publicContent, trazeCategories, vportDataset, vportHomepage |
| mappers/ | pageModel.model, providerIndex.model |
| repositories/ | aggregate, category, city, content, geo, geoCoverage, homepage, pageCandidate, provider, reviewSummary, service, staticParams, taxonomyParams |

---

## 6. Hooks / Components / Screens / Routes

### Hooks
| Module | Hooks |
|--------|-------|
| answers | useAnswerPage, useAnswersModeration, useSubmitQuestion |
| conversion | useProviderLeadCapture |

### Components (non-trivial modules)
| Module | Count |
|--------|-------|
| answers | 13 |
| home | 14 |
| directories | 9 |
| providers | 10 |
| shared | 12 |

### Screens
| Module | Screens |
|--------|---------|
| answers | AnswerDetail.view, AnswerDetailScreen, AnswersIndex.view, AnswersModeration.view |

### Routes (Next.js pages)
- `app/` root: layout, page, sitemap, robots
- `app/(seo)/`: 5 depth levels — canonical SEO directory pages
- `app/en/` + `app/es/`: locale mirrors of all routes
- `app/answers/`: index, [slug], moderation
- `app/api/answers/`: 3 API routes (questions submit, moderation answers, moderation questions)

---

## 7. Cross-Module Import Violations

### 7A — Feature-to-Feature (bypassing adapters)

| # | Consumer | Imports From | Through Adapter? | Violation Type |
|---|----------|-------------|-----------------|----------------|
| XM-01 | categories/components/CategoriesDiscoveryClient | home/components/HomepageCategoryGrid | NO — no home adapter | HARD VIOLATION |
| XM-02 | providers/components/TopProvidersDiscoveryClient | home/components/HomepageTopProvidersSection | NO — no home adapter | HARD VIOLATION |
| XM-03 | providers/components/ProviderTrustSection | reviews/components/ReviewTrustSummary | NO — no reviews adapter | HARD VIOLATION |
| XM-04 | providers/templates/ProviderPageTemplate | directories/components/InternalLinkGrid | NO — no directories adapter | HARD VIOLATION |
| XM-05 | providers/templates/ProviderPageTemplate | conversion/components/CtaModules | NO — bypasses conversion.adapter | BYPASS |
| XM-06 | directories/templates/DirectoryPageTemplate | conversion/components/CtaModules | NO — bypasses conversion.adapter | BYPASS |
| XM-07 | directories/templates/CountryHubTemplate | conversion/components/CtaModules | NO — bypasses conversion.adapter | BYPASS |

### 7B — Feature → Root Data Layer (no module DAL)

| # | Consumer | Imports From | Violation Type |
|---|----------|-------------|----------------|
| DL-01 | directories/components/ProviderListItem | data/repositories/geo.repo, service.repo, reviewSummary.repo | Component → data bypass |
| DL-02 | directories/lib/relatedGuides | data/repositories/content.repo | Lib → data bypass |
| DL-03 | directories/templates/DirectoryPageTemplate | data/repositories/service.repo, geo.repo, provider.repo | Template → data bypass |
| DL-04 | providers/lib/providerGuideLinks | data/repositories/content.repo | Lib → data bypass |
| DL-05 | providers/lib/providerRelatedLinks | data/repositories/service.repo | Lib → data bypass |

### 7C — App Layer → Feature Internals (bypassing adapters)

| # | App File | Imports From | Violation Type |
|---|----------|-------------|----------------|
| AL-01 | app/answers/[slug]/page.jsx | features/answers/controller/readAnswerPage.controller | Bypasses answers.adapter |
| AL-02 | app/api/answers/moderation/answers/route.js | features/answers/controller/moderateAnswers.controller | API → controller bypass |
| AL-03 | app/api/answers/moderation/questions/route.js | features/answers/controller/moderateAnswers.controller | API → controller bypass |
| AL-04 | app/api/answers/questions/route.js | features/answers/controller/submitQuestion.controller | API → controller bypass |
| AL-05 | app/api/answers/moderation/*.route.js | features/answers/model/moderationAuth.model | API → model bypass |
| AL-06 | app/(seo)/*/page.jsx (multiple) | features/directories/templates/* | No directories adapter |
| AL-07 | app/(seo)/*/page.jsx (multiple) | features/providers/templates/* | No providers adapter |
| AL-08 | app/page.jsx | features/home/components/* (5 imports) | No home adapter |
| AL-09 | app/top-providers/page.jsx | features/home/components/CountrySelectorClient | No home adapter |
| AL-10 | app/categories/page.jsx | features/categories/components/CategoriesDiscoveryClient | No categories adapter |
| AL-11 | app/(seo)/[city]/categories/page.jsx | features/categories/components/* | No categories adapter |
| AL-12 | app/(seo)/[city]/top-providers/page.jsx | features/providers/components/TopProvidersDiscoveryClient | No providers adapter |
| AL-13 | app/(seo)/[city]/pro/[providerSlug]/page.jsx | features/providers/lib/providerRelatedLinks | No providers adapter |

### 7D — App Layer → Root Data Layer (direct — no controller/feature boundary)

The app layer imports directly from `data/repositories/*`, `data/mappers/*`, and `data/connectors/*` on **every (seo) route page**. This is the largest single structural issue. Every SEO page bypasses any feature or controller layer entirely. Estimated: 40+ import lines across 10+ app pages.

---

## 8. App-Layer Imports Summary

App layer correctly goes through adapters for:
- `app/answers/page.jsx` → `answers.adapter` (AnswersIndexView) ✓
- `app/answers/moderation/page.jsx` → `answers.adapter` (AnswersModerationView) ✓
- `app/en/answers/[slug]/page.jsx` → `answers.adapter` (AnswerDetailScreen) ✓
- `app/es/answers/[slug]/page.jsx` → `answers.adapter` (AnswerDetailScreen) ✓

App layer bypasses adapters for: everything else.

---

## 9. Shared-Layer Imports

Traffic's `shared/` is the correct shared component layer for this app. Feature modules import from it appropriately:

| Feature | Shared components used |
|---------|----------------------|
| directories | JsonLdScript, TrazePageShell, TrazeProviderCard, TrazeSection, TrazeGeoExplorer, TrazeGeoCoverageGlobe |
| providers | JsonLdScript |
| home | TrazeCategoryCard (via HomepageCategoryGrid), TrazeProviderCard (via HomepageProviderCard) |

Verdict: `shared/` consumption is **CLEAN**. No violations.

---

## 10. Direct Data-Layer Bypasses

**CRITICAL PATTERN:** The `data/` layer (repositories, connectors, mappers) is consumed directly by:
1. App-layer pages — universal pattern (every SEO page)
2. Feature modules (directories, providers) — from components and templates

The `data/` layer has NO public boundary (no adapter/index). All 13 repository files, 7 connector files, 2 mapper files, and 6 DAL files are directly importable by any file in the project. This is the root cause of most boundary violations.

---

## 11. Dead Files / Stubs

| Path | Status |
|------|--------|
| features/answers/data/ | EMPTY DIRECTORY — no files, no justification |
| features/answers/repositories/ | EMPTY DIRECTORY — no files, no justification |
| apps/Traffic/docs/TRAFFIC_ARCHITECTURE_REVIEW.md | External doc, not canonical — skip |

No dead JS/JSX source files found. All files have content and apparent usage.

---

## 12. Duplicate Naming Patterns

| Pattern | Instances | Verdict |
|---------|-----------|---------|
| `controller/` (singular) | answers, conversion | DRIFT — standard is `controllers/` |
| `model/` (singular) | answers, conversion | DRIFT — standard is `models/` |
| `templates/` (non-standard) | directories, providers | NEEDS DECISION — these are not screens in the Next.js sense |
| `ui/` vs `components/` | none | CLEAN |
| `controller/` AND `controllers/` coexisting | none | CLEAN (no conflict yet) |

---

## 13. Missing Adapter / Public Boundary per Module

| Module | Adapter Exists | Missing |
|--------|---------------|---------|
| answers | YES (partial) | Controller + model exports for API routes |
| categories | NO | Full adapter needed |
| conversion | YES (bypassed) | Consumers must be migrated to use it |
| directories | NO | Full adapter needed |
| home | NO | Full adapter needed |
| providers | NO | Full adapter needed |
| reviews | NO | Full adapter needed |

---

## 14. Module Matrix with Grades

| Module | adapters | controllers | dal | model | screens | hooks | Folder Drift | Cross-Module Violations | Grade |
|--------|----------|-------------|-----|-------|---------|-------|--------------|------------------------|-------|
| answers | YES | `controller/` | YES | `model/` | YES | YES | MEDIUM | App bypasses adapter (AL-01 through AL-05) | **DRIFT** |
| categories | NO | NO | NO | NO | NO | NO | NONE | XM-01, AL-10, AL-11 | **NEEDS_REORG** |
| conversion | YES | `controller/` | YES | `model/` | NO | YES | MEDIUM | XM-05, XM-06, XM-07 (bypassed by consumers) | **DRIFT** |
| directories | NO | NO (uses data/) | NO | NO | templates/ | NO | templates/ | XM-04, XM-06, XM-07, DL-01, DL-02, DL-03, AL-06 | **NEEDS_REORG** |
| home | NO | NO | NO | NO | NO | NO | NONE | XM-01, XM-02, AL-08, AL-09 (consumed without adapter) | **NEEDS_REORG** |
| providers | NO | NO (uses data/) | NO | NO | templates/ | NO | templates/ | XM-02, XM-03, XM-04, XM-05, DL-04, DL-05, AL-07, AL-12, AL-13 | **NEEDS_REORG** |
| reviews | NO | NO | NO | NO | NO | NO | NONE | XM-03 (consumed without adapter) | **NEEDS_REORG** |
| data/ (global) | NO | 1 controller | YES | mappers/ | — | — | Non-standard | Consumed by app + features directly | **NEEDS_REORG** |

---

## 15. Top Blockers

**BLOCKER-01 — No adapter for home/: 5 consumers**
`home/` is consumed by `app/page.jsx`, `app/top-providers/page.jsx`, `categories/`, and `providers/`. There is no adapter. Any refactor inside `home/` would break all consumers. No enforcement is possible.

**BLOCKER-02 — No adapter for directories/: 4 consumers**
`directories/` templates are imported by `app/(seo)/` pages directly. The app layer has no way to be isolated from template internals.

**BLOCKER-03 — No adapter for providers/: 4 consumers**
`providers/` templates are imported by `app/(seo)/` pages, and `providers/` imports from `directories/` and `reviews/` with no adapter in between.

**BLOCKER-04 — data/ layer has no public boundary**
The global `data/repositories/` is imported directly by: 10+ app pages, 5 feature module files. No controller or adapter mediates access. Scanner enforcement is impossible without a boundary.

**BLOCKER-05 — conversion.adapter bypassed by its own consumers**
The `conversion` module has a working adapter but `directories/` and `providers/` import directly from `conversion/components/CtaModules`. The adapter is vestigial — not enforced.

---

## 16. Safe Execution Order

Phase order respects: (a) smallest blast radius first, (b) no module depends on a module not yet cleaned, (c) app routes are never restructured.

```
STEP 1 — reviews
  Reason: 1 file, 1 consumer (providers). Add adapter, update that one import.
  Risk: MINIMAL

STEP 2 — categories
  Reason: 1 file, 2 consumers (app/categories, app/(seo)/[city]/categories).
  Fix: Add adapter, fix cross-module import in CategoriesDiscoveryClient (home dependency).
  Risk: MINIMAL

STEP 3 — home
  Reason: Components-only, no DAL, no controller. Add adapter, update 4 app-layer consumers.
  Fix: Add home.adapter.js re-exporting all public components. Update imports in app/.
  Risk: LOW

STEP 4 — conversion
  Reason: Has adapter (partially working). Migrate 3 bypassing consumers to use it.
  Fix: Update directories/ and providers/ to import from conversion.adapter. Rename controller/ → controllers/, model/ → models/.
  Risk: LOW

STEP 5 — answers
  Reason: Has adapter (partially working). Fix app-layer bypasses for controller/model imports.
  Fix: Add controller+model exports to adapter for API routes. Rename controller/ → controllers/, model/ → models/. Delete empty data/ and repositories/ stubs.
  Risk: LOW–MEDIUM (API routes must stay correct)

STEP 6 — directories
  Reason: Depends on conversion (fixed in step 4), reviews (fixed in step 1), shared (clean).
  Fix: Add adapter, add dal/ for geo/service/provider data, remove direct data/repositories imports.
  Risk: MEDIUM (data access refactor required)

STEP 7 — providers
  Reason: Depends on directories (step 6), conversion (step 4), reviews (step 1), home (step 3).
  Fix: Add adapter, add dal/ for content/service data, remove direct data/repositories imports, fix cross-module imports through adapters.
  Risk: MEDIUM

STEP 8 — data/ public boundary
  Reason: After all features have their own DAL, formalize data/ as a read-only infrastructure layer.
  Fix: Add data/index.js or data/data.adapter.js exporting only what app-layer routes may use directly.
  Risk: MEDIUM–HIGH (app-layer pages access data/ heavily; change requires careful mapping)

STEP 9 — root components/ cleanup
  Reason: TrazeSearchBar.jsx is root-level — should move to shared/components/.
  Risk: MINIMAL (1 file, check all importers first)
```

---

## 17. Do-Not-Touch List

| Path | Reason |
|------|--------|
| `src/app/` (all .jsx/.js) | Next.js file-based routing — restructuring breaks the build |
| `src/seo/` | SEO utils — stable, no violations, no consumers outside app layer |
| `src/lib/` | Utilities — no boundary violations, globally consumed correctly |
| `src/shared/` | Correct pattern — imported appropriately by feature modules |
| `src/i18n/` | Locale dictionaries — no violations |
| `src/styles/` | CSS only — no JS dependency issues |
| `src/config/` | Config only |
| `out/` | Build output — never touch |

---

## 18. Mechanical Cleanup Candidates

These require no logic changes — pure mechanical operations:

| Task | Files | Risk |
|------|-------|------|
| Rename `controller/` → `controllers/` | answers, conversion | LOW — update 6 import paths |
| Rename `model/` → `models/` | answers, conversion | LOW — update 12 import paths |
| Delete `features/answers/data/` (empty) | 0 files | NONE |
| Delete `features/answers/repositories/` (empty) | 0 files | NONE |
| Move `components/TrazeSearchBar.jsx` → `shared/components/` | 1 file | LOW — grep consumers first |

---

## 19. Recommended Ticket Queue

```
TRAFFIC-MOD-ADAPTER-REVIEWS-001
  Add reviews.adapter.js
  Update providers/ProviderTrustSection import to use it
  Priority: P2 | Risk: LOW

TRAFFIC-MOD-ADAPTER-CATEGORIES-001
  Add categories.adapter.js
  Update 2 app-layer consumers
  Fix CategoriesDiscoveryClient cross-module import (home → categories)
  Priority: P2 | Risk: LOW

TRAFFIC-MOD-ADAPTER-HOME-001
  Add home.adapter.js
  Update 4 app-layer consumers (app/page, app/top-providers, providers/, categories/)
  Priority: P2 | Risk: LOW

TRAFFIC-MOD-FOLDER-NAMING-001
  Rename controller/ → controllers/ in answers and conversion
  Rename model/ → models/ in answers and conversion
  Update all affected import paths
  Priority: P3 | Risk: LOW

TRAFFIC-MOD-STUB-CLEANUP-001
  Delete features/answers/data/ (empty)
  Delete features/answers/repositories/ (empty)
  Priority: P3 | Risk: NONE

TRAFFIC-MOD-ADAPTER-CONVERSION-001
  Fix conversion.adapter bypass in directories/ and providers/
  Update 3 import sites to use conversion.adapter
  Priority: P2 | Risk: LOW

TRAFFIC-MOD-ADAPTER-ANSWERS-001
  Extend answers.adapter to cover controller exports needed by API routes
  Update app/answers/[slug] and api/answers routes to use adapter
  Priority: P2 | Risk: MEDIUM

TRAFFIC-MOD-ADAPTER-DIRECTORIES-001
  Add directories.adapter.js
  Add directories/dal/ to own geo/service/provider data calls
  Migrate 3 direct data/repositories imports out of feature components
  Update all app-layer consumers to import through adapter
  Priority: P1 | Risk: MEDIUM

TRAFFIC-MOD-ADAPTER-PROVIDERS-001
  Add providers.adapter.js
  Add providers/dal/ to own content/service data calls
  Fix cross-module imports (directories, conversion, reviews, home)
  Update all app-layer consumers
  Priority: P1 | Risk: MEDIUM

TRAFFIC-MOD-DATA-BOUNDARY-001
  Formalize data/ as infrastructure layer
  Add data/data.adapter.js or data/index.js with only app-facing exports
  Block direct repository access from feature internals
  Priority: P1 | Risk: MEDIUM-HIGH (deferred until modules cleaned)

TRAFFIC-MOD-SCANNER-GATE-001
  Add scanner rules to enforce all of the above
  Priority: P2 | Risk: LOW
```

---

## 20. Whether Traffic Is Modularization-Ready

**NOT YET.**

Traffic is structurally sound at the file level (no dead code, good naming, clear separation of concerns within each module's own internals) but the boundary enforcement layer is almost entirely absent.

**What exists:**
- answers adapter (partial)
- conversion adapter (partial, bypassed)
- Reasonable internal structure within answers and conversion

**What is missing:**
- 5 of 7 feature modules have no adapter
- The global `data/` layer has no public boundary
- App-layer pages bypass every module boundary by importing directly from `data/repositories/`
- Cross-module imports are pervasive (7 feature-to-feature violations)

**Readiness score:** 2 / 7 modules have adapters. 0 boundary violations are scanner-enforced.

**Traffic will be modularization-ready after Steps 1–7 in the execution order.** Steps 1–5 are low-risk and can begin immediately. Steps 6–8 require DAL additions and are medium-risk.

---

## Appendix A — Violation Count Summary

| Category | Count |
|----------|-------|
| Feature-to-feature (no adapter) | 7 |
| Feature-to-feature (adapter exists but bypassed) | 3 |
| Feature → root data/ | 5 |
| App layer → feature internals | 13 |
| App layer → root data/ (pages) | 40+ |
| **Total boundary violations** | **68+** |

---

## Appendix B — Module Standard Reference (Phase 2 Target)

```
module/
├── adapters/         ← REQUIRED: public API surface
├── components/       ← UI components (internal)
├── controllers/      ← Orchestration (plural)
├── dal/              ← Data access (reads/writes)
├── hooks/            ← React hooks (call controllers)
├── models/           ← Data transformation (plural)
└── screens/          ← Page-level views
```

`templates/` in directories and providers should be evaluated per module:
- If they are full page-level views rendered by routes → rename to `screens/`
- If they are layout primitives shared across pages → keep as `components/`

Recommend: rename to `screens/` for both — DirectoryPageTemplate and ProviderPageTemplate are full route renderers, not layout primitives.
