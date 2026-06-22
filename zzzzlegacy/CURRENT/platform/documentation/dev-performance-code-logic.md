# /dev/performance — Code Logic Explanation

**Generated:** 2026-04-12
**Source:** Direct code inspection of all debuggers/performance/ files

---

## 1. Executive Summary

`/dev/performance` is a dev-only multi-view performance dashboard that captures every Supabase query, API request, image load, and route navigation in the VCSM app. It works by monkey-patching the global Supabase client and `window.fetch` at startup, storing all events in a plain-JS store with sessionStorage persistence, grouping events into per-route screen traces, and rendering the data through a tabbed dashboard with 7 views.

The system has 3 layers: **instrumentation** (captures events) → **store + traces** (accumulates + groups data) → **dashboard UI** (renders + analyzes).

---

## 2. Route Entry and Screen Ownership

**Route definition:** `apps/VCSM/src/app/routes/protected/app.routes.jsx` line ~230
```javascript
{ path: "/dev/performance", element: devDiagnosticsEnabled ? <PerfDashboardScreen /> : <Navigate to="/feed" replace /> }
```

**Gate:** `devDiagnosticsEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_DIAGNOSTICS === '1'`

**Lazy import:** `apps/VCSM/src/app/routes/index.jsx` line ~104
```javascript
const PerfDashboardScreen = devDiagnosticsEnabled
  ? lazyWithLog("PerfDashboardScreen", () => import("@debuggers/performance").then((m) => ({ default: m.PerfDashboardScreen })))
  : () => null
```

**Layout behavior:** `RootLayout.jsx` detects `/dev/performance` via regex and hides both top nav and bottom nav. The dashboard renders its own `DevNavBar` instead.

---

## 3. Performance Data Capture Pipeline

### 3.1 Supabase Proxy (captures every DB query)

**File:** `debuggers/performance/instrumentation/supabaseProxy.js`
**Installed at:** `apps/VCSM/src/services/supabase/supabaseClient.js` (dynamic import, dev-only)

**How it works:**
1. `installSupabaseProxy(supabase)` replaces `supabase.from()`, `supabase.schema().from()`, and `supabase.rpc()` with wrapped versions
2. Each wrapped method starts a timer (`performance.now()`)
3. The original method is called normally
4. On `.then()` resolution, the wrapper captures: table name, schema, method, duration, row count, payload size, columns
5. Calls `addDbQuery()` on the performance store

**What's captured per query:**
```
{ id, timestamp, at, queryName, table, method, durationMs, rowCount, columns, columnCount, payloadSize, requestId, route, severity, error }
```

### 3.2 Fetch Proxy (captures non-Supabase API calls)

**File:** `debuggers/performance/instrumentation/fetchProxy.js`
**Installed at:** `apps/VCSM/src/App.jsx` (dynamic import, dev-only)

**How it works:**
1. `installFetchProxy()` replaces `window.fetch` with a timed wrapper
2. Filters out: Vite HMR (`/@vite`, `/__vite`), browser extensions, `node_modules`
3. Filters out Supabase REST requests (already captured by Supabase proxy)
4. For remaining requests: captures URL, method, duration, status, response size, route
5. Calls `addApiRequest()` on the performance store

### 3.3 Client Metrics (page loads, images, route changes)

**File:** `debuggers/performance/instrumentation/clientMetrics.js`
**Installed at:** `apps/VCSM/src/App.jsx` (dynamic import, dev-only)

**Three subsystems:**

1. **Page load timing:** Uses `performance.getEntriesByType('navigation')` for TTFB, DOM interactive, load event timing
2. **Image observer:** `PerformanceObserver` watching `type: 'resource'` for images — captures URL, duration, transfer size
3. **Route change tracker:** Monkey-patches `history.pushState` and `history.replaceState` + listens `popstate`. On each route change: starts a new screen trace, records route change timing, marks load settled after double-rAF paint

---

## 4. Trace Lifecycle

**File:** `debuggers/performance/screenTrace.js`

### When a trace starts:
- On **initial app load:** `installClientMetrics()` calls `startScreenTrace(window.location.pathname)` immediately
- On **route change:** `handleRouteChange()` in clientMetrics calls `startScreenTrace(newRoute)`
- `startScreenTrace()` auto-ends the previous trace via `endScreenTrace()` before creating the new one

### Trace object shape:
```javascript
{
  id: 'trace_1712930000000',
  route: '/feed',
  startTime: performance.now(),
  startedAt: '2026-04-12T...',
  loadSettledAt: null,        // set after double-rAF paint
  completed: false,
  durationMs: 0,
  dbQueries: [],              // accumulates during trace lifetime
  apiRequests: [],
  imageLoads: [],
  alerts: [],
  summary: null               // computed on endScreenTrace()
}
```

### When load settles:
- After double-rAF paint, `markTraceLoadSettled()` sets `loadSettledAt = performance.now()`
- Queries before this timestamp = `screen_load`
- Queries after = `post_load`

### When a trace ends:
- When the **next** route change starts (not on paint)
- `endScreenTrace()` sets `completed = true`, computes `summary` and `alerts`
- The trace stays in `_traces[]` (max 30) for the dashboard to display

### Key design decision:
Traces stay open until the user navigates away. This means ALL activity on a route — lazy data fetches, polling, realtime — belongs to that trace. The `_sourceType` tag distinguishes initial load from post-load activity.

---

## 5. Query Attribution Logic

**File:** `debuggers/performance/screenTrace.js` — `attachQueryToTrace()` and `classifySourceType()`

Every query that enters the store via `addDbQuery()` is immediately passed to `attachQueryToTrace()`:

```
Query arrives → is there an active trace?
  YES → classify source type → attach to trace.dbQueries[]
    - Before loadSettledAt → _sourceType = 'screen_load'
    - After loadSettledAt → _sourceType = 'post_load'
    - If explicit _sourceType set by caller → use that
  NO → _sourceType = 'background' → stored in _backgroundQueries[]
```

Each query gets tagged with:
- `_sourceType`: `'screen_load'` | `'post_load'` | `'background'`
- `_isBackground`: `true` if no active trace
- `_traceId`: ID of the owning trace (or null for background)

---

## 6. Store and Aggregation Logic

### 6.1 Performance Store

**File:** `debuggers/performance/store.js`

**Shape:**
```javascript
_dbQueries[]       // max 1000, newest first
_apiRequests[]     // max 500
_pageLoads[]       // max 500
_routeChanges[]    // max 500
_imageLoads[]      // max 500
_recording         // boolean toggle
```

**Persistence:** sessionStorage key `vcsm.debug.perf.events` — survives HMR, stores subset (200 queries, 100 requests, 50 loads)

**Snapshot stability:** `getPerfState()` returns a cached object that only rebuilds when `notify()` fires (fixes the infinite re-render bug from `useSyncExternalStore`)

### 6.2 Screen Trace Store

**File:** `debuggers/performance/screenTrace.js`

**Shape:**
```javascript
_traces[]              // max 30, newest first
_activeTrace           // currently open trace (or null)
_backgroundQueries[]   // max 200, queries with no active trace
_backgroundApiRequests[] // max 100
```

### 6.3 Analysis (computed on demand)

**File:** `debuggers/performance/analysis/overfetch.js`

- `detectDuplicateQueries(queries)` — groups by `table + method + queryName`, returns groups with count > 1
- `detectNPlus1(queries)` — finds burst patterns: same table queried 3+ times within 500ms window
- `detectOverfetch(queries)` — flags SELECT *, too many columns (>20), too many rows (>100/500), large payloads (>50KB/200KB)
- `analyzeRequestGroups(queries)` — groups queries by requestId for per-request analysis

**File:** `debuggers/performance/analysis/recommendations.js`

- `generateRecommendations(state)` — runs all detectors, produces prioritized list with `{ priority, category, title, description, impact, fix }`

### 6.4 Trace Summary (computed on trace end)

Each completed trace gets a `summary` object:
```javascript
{
  route, durationMs, totalDbMs, totalApiMs, totalImageMs, dbPct,
  queryCount, apiCount, imageCount, totalRows, totalPayload,
  byDal: [...],           // DAL method call counts
  byTable: [...],         // table read frequency
  duplicateGroups: [...], // within-trace duplicates
  nplus1: [...],          // within-trace N+1 patterns
  sourceBreakdown: { screenLoad, postLoad, background },
  hasLoadSettled: boolean
}
```

---

## 7. Dashboard Rendering Logic

**File:** `debuggers/performance/PerfDashboardScreen.jsx`

**Data sources (2 stores):**
```javascript
const state = useSyncExternalStore(subscribePerfStore, getPerfState)       // global store
const traces = useSyncExternalStore(subscribeScreenTraces, getScreenTraces) // trace store
```

**Route filter state:** `routeFilter` — when set, all analysis uses only queries from that route's traces instead of session-wide data

**7 tab views:**

| Tab | Component | What it shows |
|-----|-----------|---------------|
| Overview | `OverviewTab` (inline) | MetricCards + WaterfallChart + RecommendationsList |
| By Screen | `ScreenListView` | All traces with per-trace metrics, trace coverage status |
| Screen Detail | `ScreenDetailView` | Selected trace: waterfall, DAL breakdown, table reads, alerts |
| By DAL | `GroupView` | DAL methods sorted by call count |
| By Table | `GroupView` | Tables sorted by read frequency |
| Duplicates | `GroupView` | Duplicate query groups |
| N+1 | `GroupView` | N+1 burst patterns |
| All Queries | `QueryTable` | Searchable/filterable/sortable table of all queries |

**Additional UI elements:**
- `AlertBanner` — shows critical/warning threshold alerts from recent traces
- `DevNavBar` — internal route inspector (replaces hidden platform bottom nav)
- Scope indicator — shows "Session Totals" vs "Route: /feed" vs "Background activity"

---

## 8. Background vs Active Route Logic

**Classification hierarchy:**
1. If query has explicit `_sourceType` set by caller → use it
2. If active trace exists and `loadSettledAt` is null → `screen_load` (still in initial paint)
3. If active trace exists and query timestamp <= `loadSettledAt` → `screen_load`
4. If active trace exists and query timestamp > `loadSettledAt` → `post_load`
5. If no active trace → `background`

**What goes to background:**
- Polling queries that fire between route changes (when previous trace ended but next hasn't started)
- Realtime-triggered refreshes during the gap between traces
- Any query that fires before the first `startScreenTrace()` call

**What stays in active trace as `post_load`:**
- Badge polling (useNotiCount, useUnreadBadge) while on the current route
- Realtime-triggered refreshes while on the current route
- Lazy data fetches after initial paint

**Dashboard filtering:**
- "Background" filter in DevNavBar shows only `_backgroundQueries` and `_backgroundApiRequests`
- Route filter shows only traces matching that route, analysis scoped to those traces' queries

---

## 9. Duplicate / N+1 Detection Logic

### Duplicate Detection (`detectDuplicateQueries`)

Groups queries by `table + method + queryName`. Any group with count > 1 is a duplicate group. Within a single trace, this detects repeated identical reads during one screen load.

**Limitation:** Cannot distinguish "same query with different params" from "truly identical query" — only groups by name, not by params.

### N+1 Detection (`detectNPlus1`)

Sorts queries by timestamp, then finds bursts: same table queried 3+ times within 500ms window. Reports burst size, total duration, and average per-query duration.

**Threshold:** 3 queries to same table within 500ms = N+1 suspect.

### Per-Trace Alerts (`detectAlerts`)

| Alert | Threshold |
|-------|-----------|
| Queries > 25 | critical |
| Queries > 15 | warning |
| Duplicate groups > 5 | critical |
| Duplicate groups > 0 | warning |
| N+1 patterns > 0 | critical |
| Load time > 5000ms | critical |
| Load time > 2000ms | warning |
| DB time > 1000ms | critical |
| Images > 20 | warning |

---

## 10. File Map

### Instrumentation Layer

| File | Purpose |
|------|---------|
| `instrumentation/supabaseProxy.js` | Wraps `.from()`, `.schema().from()`, `.rpc()` with timing capture |
| `instrumentation/fetchProxy.js` | Wraps `window.fetch` with timing (filters HMR/extensions) |
| `instrumentation/clientMetrics.js` | Page load, images, route changes, starts/settles screen traces |
| `instrumentation/requestContext.js` | Request ID generation for correlation |

### Store Layer

| File | Purpose |
|------|---------|
| `store.js` | Central event store — dbQueries, apiRequests, pageLoads, routeChanges, imageLoads |
| `screenTrace.js` | Per-route trace model — startScreenTrace, endScreenTrace, markTraceLoadSettled, attachQueryToTrace, background buckets |
| `constants.js` | Thresholds, severity levels, event types |

### Analysis Layer

| File | Purpose |
|------|---------|
| `analysis/overfetch.js` | detectDuplicateQueries, detectNPlus1, detectOverfetch, analyzeRequestGroups |
| `analysis/recommendations.js` | generateRecommendations with priority/category/fix |

### UI Layer

| File | Purpose |
|------|---------|
| `PerfDashboardScreen.jsx` | Main dashboard — tabs, route filter, scope labels |
| `PerfOverlay.jsx` | Floating pill on every page |
| `components/DashboardTabs.jsx` | 7-tab navigation |
| `components/DevNavBar.jsx` | Internal route inspector (replaces bottom nav) |
| `components/AlertBanner.jsx` | Threshold alert banners |
| `components/ScreenListView.jsx` | Screen trace list with coverage status |
| `components/ScreenDetailView.jsx` | Trace detail: waterfall, DAL breakdown |
| `components/GroupView.jsx` | Reusable grouped view (by DAL, by table, duplicates, N+1) |
| `components/MetricCard.jsx` | Stat display card |
| `components/QueryTable.jsx` | Searchable/filterable query table |
| `components/WaterfallChart.jsx` | Visual waterfall timeline |
| `components/TimelineBar.jsx` | Individual waterfall bar |
| `components/RecommendationsList.jsx` | Expandable recommendations |

### Utility

| File | Purpose |
|------|---------|
| `index.js` | Public API — exports everything |
| `logger.js` | exportSnapshot, downloadSnapshot, copySnapshot, formatSummary |

### Integration Points (in app code)

| File | What it does |
|------|-------------|
| `apps/VCSM/src/services/supabase/supabaseClient.js` | Dynamic import → `installSupabaseProxy(supabase)` |
| `apps/VCSM/src/App.jsx` | Dynamic import → `installFetchProxy()` + `installClientMetrics()`, renders `<PerfOverlay />` |
| `apps/VCSM/src/app/routes/index.jsx` | Lazy import of `PerfDashboardScreen` |
| `apps/VCSM/src/app/routes/protected/app.routes.jsx` | `/dev/performance` route entry |
| `apps/VCSM/src/app/layout/RootLayout.jsx` | Hides top/bottom nav on `/dev/performance` |

---

## 11. Weak Points / Incomplete Areas

1. **Bootstrap duplication:** Identity resolution (platform.user_app_actor_links, user_app_preferences, etc.) fires on every route in the app shell. When `/dev/performance` loads, it's inside `<ProtectedRoute>` → `<RootLayout>`, so identity bootstrap runs. If React StrictMode is enabled or components remount, bootstrap reads repeat. These show as duplicates tagged `screen_load` in the trace.

2. **No per-query param distinction:** Duplicate detection groups by `table + method + queryName` — it can't distinguish "same query, different params" (legitimate) from "identical repeated query" (waste). Two queries to `vc.actors` with different actor IDs look like duplicates.

3. **Trace gap on slow navigations:** If a route change takes longer than expected (heavy lazy load), queries during the transition may attach to the old trace or fall into background.

4. **No component-level attribution:** Queries are tagged with route and trace, but not which React component or hook triggered them. The Supabase proxy can't see the call stack.

5. **Post-load classification is coarse:** Everything after `loadSettledAt` is `post_load` — no distinction between polling, realtime, lazy data, or user-triggered actions.

---

## 12. Recommended Next Improvements

1. **Fix bootstrap duplication** — Gate identity/bootstrap reads to fire once per session, not per route change. The backlog task covers this.
2. **Add param-aware dedup** — Hash query params to distinguish truly identical queries from different-param same-table queries.
3. **Explicit polling tags** — Have badge hooks tag their queries with `_sourceType: 'poll'` so they're distinguishable from lazy post-load data.
4. **Component attribution** — Use React DevTools-style profiling or a naming convention in DAL calls to identify the triggering component.
