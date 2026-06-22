# VCSM Feed — DAL Profiler & Runtime Tracer

## 1. Purpose

Dev-only feed-specific profiler that instruments the actual central feed pipeline to show exactly which DAL methods fire, how often, how long, which tables are read, whether reads are duplicated or follow N+1 patterns, and provides a per-feed-load timing breakdown. Answers questions like "why did profiles get read 14 times?" and "why did FeedDAL.getFeed run twice?"

## 2. Scope

**Included:**
- All 7 feed pipeline DALs instrumented with `wrapDAL()`
- Feed session lifecycle (startFeedSession / endFeedSession)
- Pipeline step recording (normalization, actor upsert, background hydration)
- DAL call counting, timing, row counts, duplicate detection
- Table read frequency analysis
- Serial vs parallel execution detection
- N+1 pattern detection
- Floating overlay with live stats
- Text report export

**Excluded:**
- Non-feed DALs (profile page, chat, notifications — use the general performance dashboard for those)
- Database schema changes
- Business logic changes

## 3. Ownership

- **Application Scope:** VCSM
- **Code Root:** `debuggers/feed/` (profiler files), `apps/VCSM/src/features/feed/` (instrumentation points)
- **Related Systems:** `debuggers/performance/` (general Supabase proxy — complementary, not overlapping)

## 4. Entry Points

- **Overlay:** `FeedProfilerOverlay` rendered in `App.jsx` (dev-only)
- **Session start:** `useFeed.js` calls `startFeedSession()` at `fetchPosts()` entry
- **Session end:** `useFeed.js` calls `endFeedSession()` in `finally` block
- **DAL wrapping:** `fetchFeedPage.pipeline.js` wraps all 7 DALs via `wrapDAL()`
- **Step recording:** Pipeline and hook call `recordStep()` at key non-DAL points

## 5. Data Flow

```
useFeed.fetchPosts()
  └─ startFeedSession({ viewerActorId, realmId, fresh })
       │
       └─ fetchFeedPagePipeline()
            ├─ wrapDAL("readFeedPostsPage") → records call to session
            ├─ Promise.all([
            │    wrapDAL("readPostMediaMap"),
            │    wrapDAL("fetchPostMentionRows"),
            │    wrapDAL("readHiddenPostsForViewer"),
            │    wrapDAL("readActorsBundle"),        ← internally reads 4 tables
            │    wrapDAL("readFeedBlockRowsDAL"),
            │    wrapDAL("readFeedFollowRowsDAL"),
            │  ])
            ├─ recordStep("parallel_dal_complete")
            ├─ recordStep("normalize_start")
            └─ recordStep("normalize_complete")
       │
       ├─ recordStep("actor_upsert_complete")
       ├─ recordStep("hydration_start_background")
       └─ endFeedSession() → builds summary → notifies overlay
```

## 6. Source of Truth

- **Session data:** `debuggers/feed/feedProfiler.js` (in-memory, max 20 sessions)
- **Live UI:** `debuggers/feed/FeedProfilerOverlay.jsx`

## 7. UI States

| State | Behavior |
|---|---|
| No session | Overlay hidden |
| Active session | Blue "recording..." indicator, stats update live |
| Completed session | Green/yellow indicator, full summary displayed |
| Duplicates detected | Yellow DUP badges |
| N+1 detected | Red N+1 badges |
| Minimized | Small pill: "FEED 7dal 342ms" |

## 8. Dependencies

- `debuggers/feed/feedProfiler.js` — core profiler (no external deps)
- `debuggers/feed/FeedProfilerOverlay.jsx` — React component (useSyncExternalStore)
- `@debuggers` Vite alias (already existed)

## 9. Rules / Invariants

1. All instrumentation gated by `import.meta.env.DEV`
2. `wrapDAL()` returns the original function unchanged in production
3. `startFeedSession()` / `endFeedSession()` are no-ops in production
4. Max 20 sessions stored to prevent memory growth
5. Original DAL functions imported with `_` prefix, wrapped versions use clean names
6. Pipeline step recording is optional — missing steps don't break profiling

## 10. Failure Risks

| Risk | Mitigation |
|---|---|
| Profiler overhead during dev | Lightweight — only timestamps + counters, no deep cloning |
| Session not ended (error path) | `endFeedSession()` in `finally` block |
| Multiple concurrent feed loads | Each gets its own session; previous auto-closes |

## 11. Debug Notes

### What It Will Detect

| Pattern | How |
|---|---|
| "profiles read 14 times" | `readActorsBundle` wraps 4 tables — if called across pagination loop iterations, table stats show `profiles` with high read count |
| "FeedDAL.getFeed ran twice" | `dalStats` shows `readFeedPostsPage x2` with DUP flag |
| "ReactionDAL firing per card" | N+1 flag if any DAL called 3+ times in rapid succession |
| Background hydration duplication | `recordStep("hydration_start_background")` visible in timeline after `readActorsBundle` already fetched same actors |
| Serial vs parallel | Timeline visualization shows overlapping vs sequential bars |

### Using the Overlay

1. Run `npm run dev`
2. Navigate to `/feed`
3. "FEED" pill appears bottom-left after first feed load
4. Click to expand — see DAL stats, table frequency, warnings, timeline
5. Click CPY to copy full text report to clipboard

## 12. Files Map

| File | Purpose |
|---|---|
| `debuggers/feed/feedProfiler.js` | Core: session management, wrapDAL, analysis, formatFeedReport |
| `debuggers/feed/FeedProfilerOverlay.jsx` | Floating overlay with stats grid, warnings, DAL list, timeline |
| `debuggers/feed/index.js` | Public API (updated with profiler exports) |
| `apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js` | Modified: 7 DALs wrapped, 3 recordStep calls |
| `apps/VCSM/src/features/feed/hooks/useFeed.js` | Modified: session start/end, 2 recordStep calls |
| `apps/VCSM/src/App.jsx` | Modified: FeedProfilerOverlay added |

## 13. Change Log

### 2026-04-12 10:00
- Task: Build feed-specific DAL profiler with read counters and runtime tracer
- Code Status Before: DOC MISSING
- Summary: Created feedProfiler.js with session-based DAL instrumentation (wrapDAL, recordStep, startFeedSession, endFeedSession), analysis engine (duplicate detection, N+1 detection, serial/parallel classification, table frequency), and FeedProfilerOverlay.jsx floating panel. Instrumented fetchFeedPage.pipeline.js (7 DAL wraps + 3 step records) and useFeed.js (session lifecycle + 2 step records). All behind import.meta.env.DEV guards.
- Files Changed:
  - debuggers/feed/feedProfiler.js (new)
  - debuggers/feed/FeedProfilerOverlay.jsx (new)
  - debuggers/feed/index.js (modified)
  - apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js (modified)
  - apps/VCSM/src/features/feed/hooks/useFeed.js (modified)
  - apps/VCSM/src/App.jsx (modified)
- Validation:
  - npx vite build --mode development passes clean
  - All wrapDAL calls return original function in production
  - Session lifecycle in finally block (error-safe)
  - Overlay only renders after first feed load

### 2026-04-12 10:30 — Session Status Update
- Task: Record completion status for feed DAL profiler
- Code Status Before: ALIGNED
- Summary: System is FULLY COMPLETE and operational. Feed pipeline instrumented with 7 DAL wraps + 5 step records. FeedProfilerOverlay renders in App.jsx after first feed load. ARCHITECT scan in `logan/architecture/database-read-map.md` documents the full feed pipeline read audit (10 table reads per page, up to 30 for 3-page pagination). Key finding confirmed: `readActorsBundle` + `hydrateActorsByIds` is a duplicate read pattern (same actors fetched twice per page).
- Status: COMPLETE. No remaining work.
