# BLACKWIDOW V2 Adversarial Review — shared
**Report Date:** 2026-06-04
**Analyst:** BLACKWIDOW V2 (BW2.5 V2)
**Feature:** shared
**Application:** VCSM
**Status:** COMPLETE

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | shared |
| App | VCSM |
| Report Date | 2026-06-04 |
| BW Version | BW2.5 V2 |
| Scanner Preflight | FRESH |
| Scanner Timestamp | 2026-06-04T19:48:25.152Z |
| Scanner Version | 1.1.0 |
| Security paths attributed to feature | 0 |
| Total platform security paths | 598 |
| Behavior Contract | PLACEHOLDER — §9 invariants UNANCHORED |

---

## 2. Scanner Preflight

- Scanner maps: FRESH (~7h old at time of review)
- Generation timestamp: 2026-06-04T19:48:25.152Z
- Scanner version: 1.1.0
- Security paths attributed to `shared` in scanner: **0** (scanner gap confirmed — shared is infrastructure, not a feature with DB write paths)
- Callgraph nodes (VCSM:shared owned): 90
- Callgraph edges involving VCSM:shared nodes: 249
- By layer: component (35), hook (9), module (45), barrel (1)
- Write paths for shared in scanner: **0** (no DAL write surfaces)
- RPC paths for shared in scanner: **0**

Scanner correctly identifies shared as having no security paths. The feature is composed entirely of utilities, UI primitives, hooks, and lib functions. Zero write-path coverage is expected and correct.

---

## 3. Scanner Inputs Block

| Map | Status | Paths Returned |
|---|---|---|
| security-path-map.json | FRESH | 0 |
| callgraph.json | FRESH | 90 nodes, 249 edges |
| write-execution-map.json | FRESH | 0 |
| rpc-execution-map.json | FRESH | 0 |

**Callgraph Hook Entry Points (VCSM:shared owned):**
- `useDesktopBreakpoint` — media query observer, no auth surface
- `useIOSKeyboardLock` — CSS variable writer, no auth surface
- `useOneSignalPush` — OneSignal identity binding hook
- `useUserLocation` — GPS + reverse-geocode edge function caller

**Known adapter boundary violation (VEN-SHARED-002):**
- `BottomNavBar.jsx:9` imports `getCachedActorCanonicalSlug` from `@/features/profiles/controller/buildActorCanonicalSlug.controller` directly, bypassing `profiles.adapter.js`
- `profiles.adapter.js` exports only `useProfilesOps` and `useActorCanonicalSlug` — the controller-level cache function is not surfaced there

---

## 4. Attack Surface Inventory

### 4.1 Source Modules Reviewed

| File | Type | Security Relevance |
|---|---|---|
| `shared/utils/resolveRealm.js` | util | Hardcoded UUID fallbacks; dual realm path |
| `shared/hooks/useUserLocation.js` | hook | GPS data transmission; edge function auth |
| `shared/hooks/useOneSignalPush.js` | hook | Push identity binding; external user ID |
| `shared/hooks/useDesktopBreakpoint.js` | hook | UI only — no auth surface |
| `shared/hooks/useIOSKeyboardLock.js` | hook | CSS only — no auth surface |
| `shared/lib/qrUrlBuilders.js` | lib | URL construction; UUID guard |
| `shared/lib/actorSlug.js` | lib | Slug parsing/building; legacy UUID slugs |
| `shared/lib/ttlCache.js` | lib | Module-scope cache; multi-actor key isolation |
| `shared/lib/compressImage.js` | lib | MIME type validation; client-side image processing |
| `shared/lib/clipboard.js` | lib | Clipboard write; no sanitization |
| `shared/lib/shareNative.js` | lib | Native share; URL passthrough |
| `shared/lib/iosProdDebugger.js` | lib | Session info capture; prod guard check |
| `shared/lib/disableConsoleInProd.js` | lib | Console muting; prod-only |
| `shared/lib/formatTimestamp.js` | lib | `console.error` in catch |
| `shared/config/releaseFlags.js` | config | Feature flags; env-var baked |
| `shared/components/BottomNavBar.jsx` | component | Auth-gated nav; adapter boundary violation |
| `shared/components/ActorLink.jsx` | component | Route passthrough via `actor.route` |
| `shared/components/PublicNavbar.jsx` | component | Identity-conditional rendering |

### 4.2 Attack Surface Classification

**HIGH CONFIDENCE (no writes, utility infrastructure):**
- No DAL write surfaces exist in shared
- All mutations in callers, not in shared itself
- TTL cache is read/write but in-memory module-scope only

**LOW CONFIDENCE / UNRESOLVED (scanner gap):**
- `useUserLocation` — GPS coordinates transmitted to reverse-geocode edge function; path not in scanner map (VEN-SHARED-001 confirmed)
- `resolveRealm` — hardcoded UUID fallbacks active when env vars absent; fallback realm selection bypasses canonical DAL (VEN-SHARED-004 confirmed)
- `BottomNavBar` adapter boundary violation (VEN-SHARED-002 confirmed active)
- `console.error` in production (VEN-SHARED-005 partially confirmed — mitigated by `disableConsoleInProd`)

---

## 5. Scanner Signals Block

- **0 security paths** attributed to shared in scanner — confirms this feature has no registered DB write paths
- **90 callgraph nodes** (VCSM:shared owned) — primary concerns are the 9 hook entry points
- **Critical hooks** for adversarial testing: `useUserLocation`, `useOneSignalPush`, `resolveRealm`
- **No RPC paths** — no RPC calls originate from shared
- **Scanner gap**: reverse-geocode edge function call in `useUserLocation` is off-scanner (no supabase DAL wrapping)

---

## 6. Adversarial Path Analysis

### 6.A — OWNERSHIP BYPASS

**Attack:** Can a viewer mutate another actor's data via shared utilities?

**Result: BLOCKED**

The shared layer contains zero DAL write functions. `resolveRealm`, `ttlCache`, `actorSlug`, `qrUrlBuilders`, and all other utilities are pure functions with no identity or ownership context. No ownership bypass is possible at the shared layer itself.

**However**: `useOneSignalPush` binds `user.id` (Supabase auth layer) as the OneSignal external user ID (line 66). This is correct — it uses the stable auth ID, not a client-supplied actor ID. The binding fires only after `user?.id && identity?.actorId` are both present (line 65), preventing binding with a stale or unhydrated identity.

**Provenance:** [SOURCE_VERIFIED] `useOneSignalPush.js:65-66`

---

### 6.B — SESSION MUTATION

**Attack:** Can a stale/null viewerActorId bypass session gates in shared hooks?

**Result: BLOCKED**

`useOneSignalPush` checks `user?.id && identity?.actorId` before calling `loginOneSignalExternalUser(user.id)` (line 65). Null check is present and uses optional chaining defensively.

`resolveRealm` is called in two patterns:
1. `identity?.realmId ?? resolveRealm(Boolean(identity?.isVoid))` — uses identity-provided realmId first, only falls back when null. The `isVoid` field from identity is boolean-coerced before passing to `resolveRealm`. This is a client-side fallback, not a server-trusted value, so the risk is bounded to client-side realm selection — not server-side privilege escalation.
2. `resolveRealm(false)` — called directly with literal `false` for system posts (wanders, routes), correctly always selecting PUBLIC_REALM_ID.

**PARTIAL finding**: `identity?.isVoid` is a client-side field from the identity context. If an actor could manipulate `isVoid` to `true` in their session, `resolveRealm(true)` would return `VOID_REALM_ID`. This is a client-side concern (UI state manipulation), bounded because the actual server insert would go to the void realm — which could allow system-post content to appear in void realm. However, system post controllers (gas price, locksmith, etc.) import `PUBLIC_REALM_ID` directly and ignore the identity context for realm selection, so the void realm bypass path is not open for system posts.

**Provenance:** [SOURCE_VERIFIED] `useStartConversation.js:35`, `resolveRealm.js:10-12`, `publishFuelPriceUpdateAsPost.controller.js:46`

---

### 6.C — RUNTIME ABUSE

**Attack:** Can unprivileged actors reach privileged shared endpoints?

**Result: BLOCKED (with caveat)**

Shared utilities have no role/kind checks because they are infrastructure primitives. This is correct by design.

`useOneSignalPush` is mounted once in `BottomNavBar` and fires for any authenticated user. No privilege escalation path exists — OneSignal binding is per-user and not cross-actor.

`releaseFlags` are baked at build time from env vars (lines 10-28 of `releaseFlags.js`). They cannot be overridden at runtime via URL params or localStorage. Feature flags are hardcoded booleans in the module graph. A user who knows a flag is disabled cannot enable it at runtime.

**Caveat (INFO)**: `isDashboardCardEnabled` returns `true` by default for unrecognized keys (line 33: `return true`). This means if a new feature key is added to the switch and the default-true case is not intentionally overriding, the feature is silently enabled. Not a security vulnerability but a governance risk.

**Provenance:** [SOURCE_VERIFIED] `releaseFlags.js:33`

---

### 6.D — RLS VERIFICATION

**Attack:** Does shared layer bypass RLS on any table?

**Result: BLOCKED**

The shared layer has zero Supabase DAL calls. All DB access is in feature DALs that consume shared utilities (ttlCache, resolveRealm, etc.). RLS enforcement happens at the feature DAL level, not in shared.

The one network call in shared (`useUserLocation` → reverse-geocode edge function) uses `readSupabaseAccessToken()` to attach a Bearer token (line 45). The edge function itself handles authorization server-side. The client-side GPS coordinate is passed as a query parameter — this is an informational-level finding about GPS PII exposure but not an RLS bypass.

**Provenance:** [SOURCE_VERIFIED] `useUserLocation.js:45-59`

---

### 6.E — VIEWER CONTEXT FUZZING

**Attack:** What happens with null/undefined viewerActorId passed to shared hooks?

**useUserLocation with null auth:**
- Line 47: checks `if (!token)` and resolves null. No crash.
- Lines 82-88: geolocation error path resolves null and sets error state. No crash.
- Result: **BLOCKED** — null auth handled gracefully.

**useOneSignalPush with null identity:**
- Line 65: `user?.id && identity?.actorId` guards the login call. Both must be truthy.
- Line 72: `if (!user)` guards the logout call.
- Result: **BLOCKED** — null guards present on both sides.

**resolveRealm with undefined isVoid:**
- `resolveRealm(undefined)` — `undefined` is falsy, resolves to PUBLIC_REALM_ID. Safe.
- `resolveRealm(null)` — same behavior. Safe.
- Result: **BLOCKED** — falsy input correctly maps to public realm.

**Provenance:** [SOURCE_VERIFIED] `useUserLocation.js:47`, `useOneSignalPush.js:65,72`, `resolveRealm.js:10-12`

---

### 6.F — MUTATION REPLAY

**Attack:** Can shared utilities enable replay of terminal-state operations?

**Result: NOT APPLICABLE**

The shared layer has no write operations. TTL cache (`ttlCache.js`) is read-only for callers and automatically expires. No state machine or terminal-state tracking exists in shared — that responsibility belongs to feature controllers.

**TTL cache replay risk (INFO):** The TTL cache returns stale data until expiry. If a booking or fuel price update is made and the cache is not explicitly invalidated, the old data will be served for up to TTL duration. This is not a replay attack against a terminal state machine — it is a cache consistency concern. Callers are responsible for calling `cache.invalidate(key)` after mutations.

**Provenance:** [SOURCE_VERIFIED] `ttlCache.js:17-24`

---

### 6.G — HYDRATION POISONING

**Attack:** Does shared layer interact with the hydration store or actor summaries?

**Result: NOT APPLICABLE / PARTIAL**

The shared layer does not directly write to the Zustand hydration store. `BottomNavBar` reads from `useIdentity()` and bootstrap selectors (`useNotificationUnread`, `useChatUnread`) but does not write to them.

`useOneSignalPush` binds to the OneSignal external user ID. If an attacker could manipulate `user.id` at the React hook level (not possible via normal app flow), they could associate a victim's push subscription with their own account. This requires authenticated session compromise — not a shared-layer vulnerability.

`ProfileNavTab` reads from `getCachedActorCanonicalSlug(personaActorId)` — a TTL cache. If the cache was poisoned with a malicious slug, the user could be navigated to an incorrect profile URL. The TTL cache stores data written by the controller layer — contamination would require a controller-level exploit, not a shared-layer exploit.

**Provenance:** [SOURCE_VERIFIED] `BottomNavBar.jsx:9-10`, `useOneSignalPush.js:65-66`

---

### 6.H — URL SURFACE

**Attack:** Do shared utilities expose raw UUIDs in public-facing URLs?

**Result: PARTIAL — BLOCKED for QR builders, OPEN for share links**

**QR builders (BLOCKED):**
`qrUrlBuilders.js` enforces `isQrSafeSlug()` before every URL construction (lines 65, 76, 87, 105). The UUID_RE pattern correctly rejects both bare UUIDs and any string matching the UUID pattern. Returns empty string on failure. Defense-in-depth is solid.
[SOURCE_VERIFIED] `qrUrlBuilders.js:53-56,64-66`

**actorSlug `buildActorSlug` (LEGACY PATH — LOW):**
`buildActorSlug` in `actorSlug.js` constructs slugs with UUID as the first segment (line 76: `const parts = [actorId]`). The file header notes this function is "kept for internal use but no longer used for routing" (line 15). However, it remains exported and callable. If any consumer calls `buildActorSlug` and uses the result in a public URL, raw UUIDs will appear in that URL.

`actorSeo.model.js` is the only current consumer (confirmed by grep). Risk is LOW while the legacy format is only used for backward-compat redirect handling.
[SOURCE_VERIFIED] `actorSlug.js:15,76`

**shareNative URL passthrough (OPEN — INFO):**
`shareNative.js` is a transparent passthrough — it passes whatever `url` is given to `navigator.share()` without validation. The URL content safety depends entirely on the caller. Callers in `useCentralFeedActions.js:235` and `useActorProfileActions.js:31` construct URLs as `/post/${postId}` and `/profile/self` respectively. `postId` is a UUID from the post model — raw UUIDs appear in share URLs via the post share path. This violates the "no raw IDs in public URLs" memory rule.
[SOURCE_VERIFIED] `useCentralFeedActions.js:235`, `shareNative.js:3`

---

### 6.I — §9 INVARIANT ATTACK (HIGHEST PRIORITY)

**BEHAVIOR.md Status: PLACEHOLDER**

No §9 Must Never Happen invariants are documented. All invariant attacks are source-inferred.

**Source-inferred invariants tested:**

**Invariant 1: Void realm must never receive system posts**
Attack: Pass `isVoid: true` to `resolveRealm` in a system post controller.
Result: **BLOCKED** — All system post controllers (`publishFuelPriceUpdateAsPost`, `publishExchangeRateUpdateAsPost`, etc.) import `PUBLIC_REALM_ID` directly from `resolveRealm.js` (not `resolveRealm(false)`). They ignore the identity context for realm resolution.
[SOURCE_VERIFIED] `publishFuelPriceUpdateAsPost.controller.js:6,46`

**Invariant 2: Raw UUIDs must never appear in QR URLs**
Attack: Call any QR builder with a raw UUID slug.
Result: **BLOCKED** — `isQrSafeSlug(uuid)` returns false for any UUID input. All builders return empty string.
[SOURCE_VERIFIED] `qrUrlBuilders.js:41-56`

**Invariant 3: GPS coordinates must never be transmitted unauthenticated**
Attack: Call `resolveLocation()` without a valid session.
Result: **BLOCKED** — `readSupabaseAccessToken()` is awaited at line 45; if null, function resolves null at line 48 before transmitting coordinates.
[SOURCE_VERIFIED] `useUserLocation.js:45-50`

**Invariant 4: Debug tools must never run in production**
Attack: Load `iosProdDebugger` functions in production mode.
Result: **BLOCKED** — `IS_PROD` constant is set at module load from `import.meta.env.PROD`. All exported functions check `IS_PROD` at the top and return immediately. `IOSProdRouteDebugger` is gated by `{import.meta.env.DEV && <IOSProdRouteDebugger />}` at the render site.
[SOURCE_VERIFIED] `iosProdDebugger.js:5,124,137,153,183,192,222`, `RootLayout.jsx:102`

**Invariant 5: console.* must not fire in production**
Attack: Confirm `console.error` in `useUserLocation.js:74` and `formatTimestamp.js:17` fires in production.
Result: **BLOCKED (mitigated)** — `disableConsoleInProd.js` is imported as a side effect in `main.jsx:1` and calls `disableConsoleInProd()` at module init (line 60). This replaces all `console.*` methods with no-ops in production. The raw `console.error` calls in `useUserLocation.js` and `formatTimestamp.js` are silenced at runtime.
**NOTE:** This is an implicit mitigation, not inline prod-checks. If `disableConsoleInProd` is ever removed from `main.jsx` or the import order changes, the calls would fire in production. The individual call sites have no `if (import.meta.env.DEV)` guards.
[SOURCE_VERIFIED] `disableConsoleInProd.js:60`, `main.jsx:1`, `useUserLocation.js:74,127`, `formatTimestamp.js:17`

---

## 7. Exploitability Assessment

| Finding ID | Severity | Exploit Chain | Exploitability |
|---|---|---|---|
| BW-SHARED-001 | MEDIUM | Single-step | Low effort — BottomNavBar imports controller directly, bypassing adapter. Not a runtime exploit but an architecture governance failure that could enable future cross-feature leaks. |
| BW-SHARED-002 | MEDIUM | Multi-step | Medium effort — `buildActorSlug` legacy function exports UUID-prefixed slugs; requires a caller to use it in a public URL context. Not currently exploited. |
| BW-SHARED-003 | LOW | Single-step | Low effort — share URL for posts uses raw `postId` UUID. `shareNative` is transparent. UUID is exposed in shared post URLs. |
| BW-SHARED-004 | LOW | Single-step | Low effort — `console.error` calls in `useUserLocation.js` and `formatTimestamp.js` lack inline `DEV` guards; silencing depends solely on side-effect import in `main.jsx`. |
| BW-SHARED-005 | LOW | Multi-step | Low effort — `isDashboardCardEnabled` returns `true` for unrecognized keys; silent enablement risk if new flags added without updating this function. |
| BW-SHARED-006 | INFO | Single-step | Zero client-side effort — `copyToClipboard` writes unsanitized text to clipboard. In a DOM XSS scenario (existing XSS required as pre-condition), this could allow silently clipboard-poisoning with crafted content. Not an independent exploit. |

---

## 8. Source Verification Summary

| Finding | Source File | Lines Verified | Confidence |
|---|---|---|---|
| BW-SHARED-001 | `BottomNavBar.jsx` | 9 | [SOURCE_VERIFIED] |
| BW-SHARED-002 | `actorSlug.js` | 15, 76 | [SOURCE_VERIFIED] |
| BW-SHARED-003 | `useCentralFeedActions.js`, `shareNative.js` | 235, 3 | [SOURCE_VERIFIED] |
| BW-SHARED-004 | `useUserLocation.js`, `formatTimestamp.js`, `disableConsoleInProd.js`, `main.jsx` | 74, 127, 17, 60, 1 | [SOURCE_VERIFIED] |
| BW-SHARED-005 | `releaseFlags.js` | 33 | [SOURCE_VERIFIED] |
| BW-SHARED-006 | `clipboard.js` | 1-32 | [SOURCE_VERIFIED] |
| ATTACKS BLOCKED | All §9 invariant attacks | Multiple | [SOURCE_VERIFIED] |

All BLOCKED findings are SOURCE_VERIFIED. No BYPASSED findings — zero CRITICAL or HIGH severity findings confirmed.

---

## 9. Confidence Summary

| Category | Confidence | Basis |
|---|---|---|
| No DB write surfaces in shared | HIGH | Scanner write-execution-map: 0 paths + source survey |
| Void realm exclusion for system posts | HIGH | Source-verified in 8 controller files |
| QR UUID guard | HIGH | Source-verified `isQrSafeSlug` in all 4 builders |
| GPS auth gate | HIGH | Source-verified token check before coordinate transmission |
| Debug tool prod isolation | HIGH | Both module-level IS_PROD and render-site DEV guard |
| Adapter boundary violation (VEN-SHARED-002) | HIGH | Source-verified — not fixed since VENOM run |
| Console prod mitigation fragility | MEDIUM | Depends on import order in main.jsx; no inline guards |
| Post share UUID exposure | HIGH | Source-verified in useCentralFeedActions.js:235 |
| buildActorSlug legacy UUID risk | MEDIUM | Not currently routed through public URLs |
| VPORT system post void bypass | HIGH | BLOCKED — direct import of PUBLIC_REALM_ID confirmed |

---

## 10. §9 Invariant Attack Map

Since BEHAVIOR.md is PLACEHOLDER, all §9 invariants are source-inferred from the platform's known contracts.

| Inferred Invariant | Attack Attempted | Result |
|---|---|---|
| Void realm never receives system posts | Pass isVoid=true through resolveRealm to system post controller | BLOCKED — system post controllers import PUBLIC_REALM_ID directly |
| Raw UUIDs never appear in QR codes | Call buildReviewsQrUrl/buildBusinessCardQrUrl with raw UUID | BLOCKED — isQrSafeSlug gates all builders |
| GPS coordinates never transmitted unauthenticated | Call resolveLocation() without valid session token | BLOCKED — token null check at line 45-50 |
| Debug tools never run in production | Load iosProdDebugger in PROD=true environment | BLOCKED — IS_PROD constant gates all functions |
| Console.* never fire in production | Test console.error calls in useUserLocation + formatTimestamp | BLOCKED (fragile) — disableConsoleInProd side effect in main.jsx |

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md is a PLACEHOLDER. The absence of a behavior contract means:
- No formal §9 invariants exist to anchor this review
- All §9 attack targets were source-inferred from the platform vocabulary and memory rules
- VEN-SHARED-003 (contract missing) remains OPEN and blocks formal BW anchoring for this feature
- Recommendation: BEHAVIOR.md must be written before the next BW pass can be fully anchored

**VEN-SHARED-003 cross-reference:** OPEN — BEHAVIOR.md remains a placeholder stub with no §5 Security Rules or §9 Must Never Happen invariants. This directly limits the completeness of the BW adversarial review.

---

## 12. THOR Impact

**THOR Release Blocker Status: NO**

No CRITICAL or HIGH BW findings were identified. All adversarial attacks were either BLOCKED or resulted in LOW/INFO-severity findings.

**Findings by disposition:**

| Finding | THOR Status | Reason |
|---|---|---|
| BW-SHARED-001 (adapter boundary) | NON-BLOCKER | Architecture hygiene — not a runtime security exploit. Already tracked as VEN-SHARED-002 (OPEN). |
| BW-SHARED-002 (buildActorSlug legacy) | NON-BLOCKER | Not currently used in public URL routing. |
| BW-SHARED-003 (share URL UUID) | NON-BLOCKER | INFO-level PII hygiene in native share payload — not a security exploit. |
| BW-SHARED-004 (console fragility) | NON-BLOCKER | Mitigation exists. Fragility is a maintenance concern, not a current exploit. |
| BW-SHARED-005 (releaseFlags default-true) | NON-BLOCKER | Governance risk only. |
| BW-SHARED-006 (clipboard no sanitization) | NON-BLOCKER | Requires prior XSS as pre-condition. |

---

## 13. SPIDER-MAN Test Requirements

The following test cases are required to prevent regressions on the invariants verified in this review:

| Test ID | Test Target | Scenario | Expected Result |
|---|---|---|---|
| SM-SHARED-T01 | `qrUrlBuilders.js` | `buildReviewsQrUrl` called with bare UUID | Returns empty string |
| SM-SHARED-T02 | `qrUrlBuilders.js` | `buildBusinessCardQrUrl` called with UUID-prefixed slug | Returns empty string |
| SM-SHARED-T03 | `qrUrlBuilders.js` | All builders called with valid canonical slug | Return expected URL |
| SM-SHARED-T04 | `resolveRealm.js` | `resolveRealm(true)` returns VOID_REALM_ID | Returns void UUID |
| SM-SHARED-T05 | `resolveRealm.js` | `resolveRealm(false)` returns PUBLIC_REALM_ID | Returns public UUID |
| SM-SHARED-T06 | `resolveRealm.js` | `resolveRealm(undefined)` resolves to PUBLIC_REALM_ID | Returns public UUID |
| SM-SHARED-T07 | `actorSlug.js` | `isCanonicalSlug` rejects bare UUID | Returns false |
| SM-SHARED-T08 | `actorSlug.js` | `isCanonicalSlug` rejects UUID-prefixed slug | Returns false |
| SM-SHARED-T09 | `actorSlug.js` | `isCanonicalSlug` accepts clean slug | Returns true |
| SM-SHARED-T10 | `ttlCache.js` | Cache returns null after TTL expiry | Returns null |
| SM-SHARED-T11 | `ttlCache.js` | `invalidate` removes key before TTL | get returns null |
| SM-SHARED-T12 | `releaseFlags.js` | `isDashboardCardEnabled('flyer')` reflects flag | Returns flag value |
| SM-SHARED-T13 | `disableConsoleInProd.js` | In PROD, console.error is a no-op | Does not throw |
| SM-SHARED-T14 | `compressImage.js` | Non-image MIME type throws error | Throws "Invalid file type" |
| SM-SHARED-T15 | System post controllers | `publishFuelPriceUpdateAsPost` uses PUBLIC_REALM_ID (not void) | realmId === PUBLIC_REALM_ID |

---

*End of report — BLACKWIDOW V2 — 2026-06-04*
