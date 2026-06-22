# Platform — Performance Observability System

## 1. Purpose

Dev-only internal tooling that instruments the VCSM runtime to capture, analyze, and display database query timing, API request performance, client-side rendering metrics, and asset loading behavior. Enables developers to diagnose slow page loads, duplicate queries, N+1 patterns, overfetching, and render-blocking work without modifying business logic.

## 2. Scope

**Included:**
- Supabase client query instrumentation (`.from()`, `.schema().from()`, `.rpc()`)
- `window.fetch` proxy for non-Supabase API calls
- Client-side Performance API integration (page load, hydration, images, route changes)
- Duplicate query detection, N+1 pattern detection, overfetch analysis
- Auto-generated performance recommendations with priority levels
- Floating in-app overlay panel
- Full-page performance dashboard at `/dev/performance`
- JSON export, clipboard copy, and sessionStorage persistence

**Excluded:**
- Server-side instrumentation (Supabase Edge Functions, PostgreSQL EXPLAIN)
- Production telemetry or analytics
- Wentrex app instrumentation (scoped to VCSM only)
- Business logic changes

## 3. Ownership

- **Application Scope:** VCSM
- **Code Roots:** `debuggers/performance/` (17 files), integration points in `apps/VCSM/src/`
- **Related Engines:** None (standalone dev tooling in `debuggers/`)
- **Primary Features:** Query tracing, API timing, client metrics, analysis, dashboard UI

### DB Observability Ownership Split

Two systems provide database observability. Their responsibilities are distinct:

| System | Location | Scope | When to Use |
|--------|----------|-------|-------------|
| **Performance Observability** | `debuggers/performance/` | Global — all Supabase queries across all routes | "What is the app doing overall?" — total query counts, API timing, page load breakdown, waterfall, recommendations |
| **Feed DAL Profiler** | `debuggers/feed/` | Feed-specific — only the central feed pipeline | "What is the feed doing?" — per-DAL call count, which DAL fired, serial vs parallel, N+1 per feed load |

**Source of truth for DB observability:** `debuggers/performance/` is the primary system. It automatically instruments every Supabase query via the proxy. The feed profiler is a specialized extension that adds DAL-level granularity (function names, caller context) on top of the global system.

**They are complementary, not overlapping:**
- Performance system captures every `.from()` call globally but doesn't know which DAL function triggered it
- Feed profiler wraps specific DAL functions with `wrapDAL()` so it knows "readActorsBundle fired 3x" — but only covers the feed pipeline

**If a new feature needs DAL profiling:** Follow the feed profiler pattern — create `debuggers/[feature]/` with `wrapDAL()` on that feature's DALs. The global performance system continues capturing everything automatically.

## 4. Entry Points

- **Routes:** `/dev/performance` (protected, dev-only gated by `devDiagnosticsEnabled`)
- **Screens:** `PerfDashboardScreen.jsx` (full dashboard), `PerfOverlay.jsx` (floating panel)
- **Instrumentation Init:**
  - Supabase proxy: auto-installed via dynamic import in `supabaseClient.js`
  - Fetch proxy + client metrics: auto-installed via dynamic import in `App.jsx`
- **Public API:** `debuggers/performance/index.js` exports all store, analysis, and logger functions

## 5. Data Flow

### Instrumentation Path

```
supabaseClient.js
  └─ DEV: dynamic import → installSupabaseProxy(supabase)
       └─ Wraps .from(), .schema().from(), .rpc()
       └─ On query resolve: captures timing, rows, columns, payload size
       └─ Writes to store via addDbQuery()

App.jsx
  └─ DEV: dynamic import → installFetchProxy() + installClientMetrics()
       └─ fetchProxy wraps window.fetch (filters HMR/extensions)
       └─ clientMetrics uses PerformanceObserver for images, Navigation API for page loads
       └─ Route changes tracked via history.pushState/replaceState monkey-patch
```

### Store Architecture

```
store.js (plain JS, manual subscriptions)
  ├─ _dbQueries[]       ← max 1000, newest first
  ├─ _apiRequests[]     ← max 500
  ├─ _pageLoads[]       ← max 500
  ├─ _routeChanges[]    ← max 500
  ├─ _imageLoads[]      ← max 500
  └─ sessionStorage persistence (survives HMR, key: vcsm.debug.perf.events)
```

### Analysis Path

```
store data
  └─ overfetch.js
  │    ├─ detectDuplicateQueries() — same table+method+name within window
  │    ├─ detectNPlus1() — rapid sequential queries to same table (burst detection)
  │    ├─ detectOverfetch() — SELECT *, too many columns, too many rows, large payloads
  │    └─ analyzeRequestGroups() — group queries by requestId for per-request view
  └─ recommendations.js
       └─ generateRecommendations(state) — produces prioritized list with fix suggestions
            ├─ Database: duplicates, N+1, overfetch, slow queries, sequential chains
            ├─ API: slow requests, large responses
            ├─ Page loads: slow pages with time breakdown
            └─ Assets: large images, slow-loading images
```

### UI Rendering Path

```
PerfOverlay.jsx (floating panel)
  └─ useSyncExternalStore(subscribePerfStore, getPerfState)
  └─ Filters data to current route
  └─ Shows: query count, DB time, API calls, duplicates, slow ops, issues
  └─ Links to /dev/performance

PerfDashboardScreen.jsx (full page)
  └─ useSyncExternalStore(subscribePerfStore, getPerfState)
  └─ Runs full analysis on every state change
  └─ Renders: MetricCard grid, route breakdown table, WaterfallChart,
              RecommendationsList, duplicate/N+1 detail, QueryTable, API table, page loads
```

## 6. Source of Truth

- **Runtime data:** `debuggers/performance/store.js` (in-memory + sessionStorage)
- **Thresholds:** `debuggers/performance/constants.js`
- **Analysis logic:** `debuggers/performance/analysis/` (pure functions, no side effects)
- **Supabase client singleton:** `apps/VCSM/src/services/supabase/supabaseClient.js`

## 7. UI States

| State | Behavior |
|---|---|
| Recording | Green dot pulses, data accumulates |
| Paused | Grey dot, no new data captured |
| Empty | "No operations recorded yet" placeholders |
| Data present | Tables, charts, recommendations populate |
| Minimized overlay | Small pill showing query count + DB time |
| Expanded overlay | Full stat grid, slow ops list, issue badges |
| Dashboard | Full-page view with all sections |

## 8. Dependencies

### Internal Modules
- `debuggers/cycle.js` — `registerDebugCollector()` for unified debug state
- `@debuggers` alias in Vite config (already existed)

### Shared Engines
- None (standalone)

### External Services
- None

### Database Objects
- None created. Reads go through existing Supabase client.

### Browser APIs
- `PerformanceObserver` (resource timing, long tasks)
- `performance.getEntriesByType('navigation')` (page load timing)
- `history.pushState` / `history.replaceState` (route change detection)
- `sessionStorage` (persistence across HMR)
- `Blob` / `URL.createObjectURL` (JSON export download)

## 9. Rules / Invariants

1. **All instrumentation is no-op in production.** Every public function checks `import.meta.env.DEV` before executing.
2. **Dynamic imports only.** Integration points in `supabaseClient.js` and `App.jsx` use dynamic `import()` so the performance code is never in the production bundle.
3. **Store is capped.** Max 1000 DB queries, 500 API requests, 500 page loads to prevent memory growth.
4. **Supabase proxy is reversible.** `uninstallSupabaseProxy()` restores original methods.
5. **Fetch proxy filters noise.** Vite HMR, browser extensions, and Supabase REST calls (already captured by Supabase proxy) are excluded.
6. **Analysis functions are pure.** They read from store arrays and return new objects — no mutations.
7. **No console.log output.** All debug information renders on screen (per project feedback rules).
8. **Dashboard route gated.** Only available when `import.meta.env.DEV || VITE_ENABLE_DEV_DIAGNOSTICS === '1'`.

## 10. Failure Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Supabase proxy breaks query chaining | DB queries fail | Proxy preserves all chain methods; `uninstallSupabaseProxy()` available |
| SessionStorage quota exceeded | Persistence fails silently | Store serializes capped subsets (200 queries, 100 requests) |
| PerformanceObserver not supported | Missing image/long-task data | All observers wrapped in try/catch |
| HMR re-installs proxy | Double instrumentation | `_proxyInstalled` / `_installed` guards prevent re-installation |
| Production bundle inclusion | Bundle size increase | Dynamic imports + `import.meta.env.DEV` guards + Vite tree-shaking |

### Code Logic Reference

Full implementation walkthrough of how `/dev/performance` works — from instrumentation through store to dashboard rendering:

`logan/architecture/dev-performance-code-logic.md`

Covers: data capture pipeline, trace lifecycle, query attribution, store architecture, dashboard rendering, background vs active logic, duplicate/N+1 detection, file map (25 files), weak points, and recommended improvements.

## 11. Debug Notes

### Enable/Disable
- **Dev mode:** Automatically on during `npm run dev`. No config needed.
- **Pause recording:** Click pause button on overlay or dashboard.
- **Clear data:** Click "CLR" on overlay or "Clear Data" on dashboard.
- **Production override:** Set `VITE_ENABLE_DEV_DIAGNOSTICS=1` in `.env` to enable the `/dev/performance` route in production builds (instrumentation still disabled).

### Export
- **JSON download:** Click "Export JSON" on dashboard — saves timestamped `.json` file.
- **Clipboard:** Click "Copy" on dashboard.
- **Programmatic:** Call `exportSnapshot()` or `downloadSnapshot()` from console in dev.

### Overlay Controls
- **Reposition:** Click arrow button to cycle through bottom-left, bottom-right, top-right, top-left.
- **Minimize:** Click `_` to collapse to pill. Click pill to expand.

## 12. Files Map

### New Files (17)

| File | Purpose |
|---|---|
| `debuggers/performance/index.js` | Public API, `initPerfInstrumentation()` |
| `debuggers/performance/store.js` | Central event store with sessionStorage persistence |
| `debuggers/performance/constants.js` | Thresholds, severity levels, event types |
| `debuggers/performance/logger.js` | Export, download, copy snapshot utilities |
| `debuggers/performance/instrumentation/supabaseProxy.js` | Wraps Supabase `.from()`, `.schema().from()`, `.rpc()` |
| `debuggers/performance/instrumentation/fetchProxy.js` | Wraps `window.fetch` with HMR/extension filtering |
| `debuggers/performance/instrumentation/clientMetrics.js` | Page load, hydration, images, route change tracking |
| `debuggers/performance/instrumentation/requestContext.js` | Request ID generation and correlation |
| `debuggers/performance/analysis/overfetch.js` | Duplicate, N+1, overfetch, request group analysis |
| `debuggers/performance/analysis/recommendations.js` | Auto-generated prioritized recommendations |
| `debuggers/performance/components/MetricCard.jsx` | Stat display card component |
| `debuggers/performance/components/QueryTable.jsx` | Searchable/filterable/sortable query table |
| `debuggers/performance/components/WaterfallChart.jsx` | Visual waterfall timeline |
| `debuggers/performance/components/TimelineBar.jsx` | Individual bar in waterfall |
| `debuggers/performance/components/RecommendationsList.jsx` | Expandable recommendations with fix details |
| `debuggers/performance/PerfOverlay.jsx` | Floating dev panel (collapsible, repositionable) |
| `debuggers/performance/PerfDashboardScreen.jsx` | Full dashboard at `/dev/performance` |

### Modified Files (4)

| File | Change |
|---|---|
| `apps/VCSM/src/services/supabase/supabaseClient.js` | Added dev-only dynamic import to install Supabase proxy |
| `apps/VCSM/src/App.jsx` | Added `PerfOverlay` import + fetch/client metrics init |
| `apps/VCSM/src/app/routes/index.jsx` | Added lazy import for `PerfDashboardScreen` |
| `apps/VCSM/src/app/routes/protected/app.routes.jsx` | Added `/dev/performance` route entry |

## 13. Change Log

### 2026-04-12 08:30
- Task: Build dev-only performance observability system
- Code Status Before: DOC MISSING
- Summary: Created complete performance instrumentation system with Supabase query proxy, fetch proxy, client metrics via Performance API, duplicate/N+1/overfetch analysis engine, auto-generated recommendations, floating overlay panel, and full dashboard page. Integrated into existing app via dynamic imports at supabaseClient.js, App.jsx, and route config. All code gated behind import.meta.env.DEV. Build verified passing.
- Files Changed:
  - debuggers/performance/ (17 new files — see Files Map above)
  - apps/VCSM/src/services/supabase/supabaseClient.js
  - apps/VCSM/src/App.jsx
  - apps/VCSM/src/app/routes/index.jsx
  - apps/VCSM/src/app/routes/protected/app.routes.jsx
- Validation:
  - `npx vite build --mode development` passes clean
  - All instrumentation functions guarded by `import.meta.env.DEV`
  - Dynamic imports ensure zero production bundle inclusion
  - Store caps prevent memory growth
  - Existing debugger pattern (identity, global, actor-switch) followed consistently

### 2026-04-12 10:30 — Session Status Update
- Task: Record completion status for performance observability system
- Code Status Before: ALIGNED
- Summary: System is FULLY COMPLETE and operational. No pending work. All 17 files in `debuggers/performance/`, dashboard at `/dev/performance`, floating overlay in App.jsx. Supabase proxy auto-installs via dynamic import. Build verified. ARCHITECT scan in `logan/architecture/database-read-map.md` references this system's findings (duplicate reads, N+1 risks, table frequency).
- Status: COMPLETE. No remaining work.

### 2026-04-12 13:30 — Screen Trace Completion
- Task: Complete screen-trace wiring — persistent traces, source-type tagging, trace coverage status
- Code Status Before: MINOR DRIFT (traces ended too early on paint, background queries misattributed)
- Summary: Three key fixes applied:
  1. **Traces stay open until next route change** — removed premature `endScreenTrace()` after double-rAF. Traces now capture all lazy data, polling, and realtime activity for their route. Previous trace auto-ended when new route starts.
  2. **Source-type classification** — every query tagged `screen_load` (before paint), `post_load` (after paint), or `background` (no trace). Classification uses `loadSettledAt` marker set after double-rAF paint.
  3. **Initial page load trace** — first route gets a trace automatically on app startup. No more gap between app load and first navigation.
  4. **Trace coverage status** — ScreenListView shows which core routes have been traced with checkmark/circle/cross indicators.
  5. **Bottom nav hidden** — `/dev/performance` hides platform bottom nav, replaced by DevNavBar route inspector.
  6. **Route filter** — dashboard filters all analysis (metrics, duplicates, N+1) to selected route.
  7. **Background separation** — queries without active trace stored in separate bucket, viewable via "Background" filter.
- Files Changed:
  - debuggers/performance/screenTrace.js (markTraceLoadSettled, sourceType classification, background buckets)
  - debuggers/performance/instrumentation/clientMetrics.js (removed premature end, added initial trace)
  - debuggers/performance/store.js (attachQueryToTrace/attachApiToTrace/attachImageToTrace integration)
  - debuggers/performance/PerfDashboardScreen.jsx (DevNavBar, route filter, scope labels, background section)
  - debuggers/performance/components/DevNavBar.jsx (new — internal route inspector)
  - debuggers/performance/components/ScreenListView.jsx (trace coverage status banner)
  - debuggers/performance/index.js (exports: markTraceLoadSettled, getBackgroundActivity)
  - apps/VCSM/src/app/layout/RootLayout.jsx (hide nav on /dev/performance)
- Validation: Build passes. Traces persist until next navigation. Source types classified. Coverage displayed.
