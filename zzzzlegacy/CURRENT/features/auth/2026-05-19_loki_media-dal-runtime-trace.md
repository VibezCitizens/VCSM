# LOKI — Media DAL Runtime Trace

_Date:_ 2026-05-19  
_Scope:_ `features/media/dal/` + `features/media/controller/createMediaAsset.controller.js`  
_Application:_ VCSM  
_Triggered by:_ CEREBRO verification pass on `vcsm.dal.media.md`  
_Authority:_ GOVERNANCE_WRITABLE — no source code modified  
_Status:_ **PARTIAL — critical observability gaps in `resolveVcsmAppIdDAL`; production silent on all media asset events**

---

## Runtime Instrumentation Inventory

### `resolveAppId.read.dal.js` — ZERO instrumentation

| Event | Instrumented | Condition | Notes |
|---|---|---|---|
| Cache hit | NO | — | Silent return |
| Cache miss (DB query start) | NO | — | Silent |
| DB query success | NO | — | `_cachedAppId` populated silently |
| DB query error | NO | — | `throw error` with no preceding log |
| App not found | NO | — | `throw new Error(...)` — message only, no log |

**Module-level cache state (`_cachedAppId`) is completely opaque at runtime.** There is no way to observe whether subsequent calls hit the cache or the DB.

---

### `mediaAssets.write.dal.js` — DEV-only instrumentation

| Event | Instrumented | Condition | Log level |
|---|---|---|---|
| Pre-INSERT log | YES | `import.meta.env?.DEV` | console.log — scope_type, owner_actor_id, scope_id, storage_key |
| Post-INSERT result | YES | `import.meta.env?.DEV` | console.log — id, error.code, error.message |
| INSERT success (production) | NO | — | Completely silent |
| INSERT failure (production) | NO | — | Error thrown only |

---

### `createMediaAsset.controller.js` — BugBunny + DEV instrumentation

| Event | Instrumented | Condition | Log level |
|---|---|---|---|
| Pre-insert step | YES | BugBunny enabled | bugBunnyUploadStep — appId, appKey, ownerActorId, createdByActorId, scopeType, storageKey |
| Full insert payload | YES | `import.meta.env?.DEV` | console.log |
| INSERT success | YES | DEV + BugBunny | console.log + bugBunnyUploadStep (id, appId, ownerActorId) |
| INSERT failure | YES | DEV + BugBunny | console.warn + bugBunnyUploadError (re-throw after log) |

---

### `mediaAppId.adapter.js` — ZERO instrumentation

Pure passthrough — no logging, no transforms, no error handling added. Delegates to DAL directly.

---

## BugBunny Upload Debugger Architecture

**Production path:** `apps/VCSM/src/debuggers-stub/media/bugBunnyUploadDebugger.js` (all exports no-op)  
**DEV path:** `zNOTFORPRODUCTION/_ACTIVE/debuggers/media/bugBunnyUploadDebugger.js`  
**Vite alias resolution:** `mode === 'production'` → stub; else → real debugger

| Capability | Value |
|---|---|
| Ring buffer size | 100 events (FIFO, oldest dropped) |
| Activation gate | `import.meta.env?.DEV` OR `?debugUploads=1` OR `localStorage.DEBUG_UPLOADS === '1'` |
| Token redaction | YES — removes tokens, auth headers, API keys from payloads |
| Production behavior | ALL EXPORTS ARE NO-OPS |

---

## Error Propagation Chain

```
resolveVcsmAppIdDAL()
├─ Cache hit  → return _cachedAppId  [SILENT — no log]
└─ Cache miss:
   ├─ Query success → _cachedAppId = data.id → return  [SILENT]
   ├─ Query error  → throw error                       [NO LOG BEFORE THROW]
   └─ App not found → throw new Error(...)             [MESSAGE ONLY]

insertMediaAssetDAL(row)
├─ Pre-insert: DEV console.log (scope_type, owner_actor_id)
├─ INSERT:
│  ├─ Success → DEV console.log (id, null error) → return data
│  └─ Error   → DEV console.log (error.code, message) → throw error
└─ Production: completely silent on both success and failure

createMediaAssetController(params)
├─ resolveVcsmAppIdDAL() — error propagates up (not caught here)
├─ Pre-insert: BugBunny step + DEV console.log
├─ try: insertMediaAssetDAL(insertPayload)
│  ├─ Success: DEV log + BugBunny step → return mapMediaAssetRow(row)
│  └─ Error: BugBunny error + DEV warn → RE-THROW → propagates to caller
└─ Production BugBunny calls: NO-OPS (stub)
```

---

## Observability Gaps (Prioritized)

| Gap | Severity | Area |
|---|---|---|
| `resolveVcsmAppIdDAL` cache behavior completely unobservable (hit vs miss indistinguishable) | MODERATE | resolveAppId DAL |
| INSERT success produces zero production-observable event | LOW | write DAL |
| INSERT failure propagates as thrown exception with no production log | MODERATE | write DAL |
| Adapter adds zero observability to the pass-through | LOW | adapter |
| No cache invalidation mechanism — stale `_cachedAppId` would persist for entire session | LOW | resolveAppId DAL |

---

## Runtime Behavior Confirmed

- `resolveVcsmAppIdDAL` performs exactly **one DB query per browser session**. All subsequent calls in the same session return the cached value without hitting the database.
- `insertMediaAssetDAL` performs a single synchronous INSERT per call — no batching, no queue.
- Error from either DAL function re-throws and propagates to the hook layer — hooks that wrap in IIFE (`submitCreateVport`, `addPortfolioMediaWithRecord`) swallow these errors silently in production.
- Blocking callers (`recordChatAttachment`, `recordPostMedia`) will surface the error to their hook's error state.

---

## Recommendations

1. Add DEV-mode cache-state logging to `resolveVcsmAppIdDAL` — at minimum log `[resolveVcsmAppIdDAL] cache hit` vs. `[resolveVcsmAppIdDAL] DB query (cold)` 
2. The production silence on INSERT success/failure is acceptable for a write-path DAL — error propagation via re-throw is the correct pattern; no action required
3. Document the IIFE swallow pattern in callers that use non-blocking IIFE — silent media record failure means the upload surface exists but has no DB record; this should be surfaced to the BugBunny ring buffer at minimum

---

_LOKI completed: 2026-05-19_  
_Files read: 5 source files + vite.config.js + debugger stub_  
_Code modified: NONE_
