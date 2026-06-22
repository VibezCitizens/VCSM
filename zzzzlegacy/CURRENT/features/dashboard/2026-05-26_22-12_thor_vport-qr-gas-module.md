# THOR Release Gate Evaluation

**Date:** 2026-05-26  
**Branch:** vport-booking-feed-security-updates  
**Reviewer:** THOR  
**Evaluation scope:** Post-session release readiness assessment for vport QR + gas station security updates  
**Security pipeline inputs:** VENOM ✓ | BLACKWIDOW ✓ | ELEKTRA ✓ | SENTRY ✓

---

## THOR RELEASE TARGET

**Application Scope:** VCSM  
**Release reason:** Security fixes for vport QR UUID leak and gas station dashboard hardening (session `vport-booking-feed-security-updates`)  
**Areas changed:**
- QR code URL generation: centralized via `qrUrlBuilders.js`
- Public QR views: UUID-leak gate added (`loading || !canonicalSlug`)
- `QrCode.jsx`: `title`/`className` pass-through added
- Flyer files: all direct `react-qr-code` imports replaced with shared component
- `qrcode.adapter.js`: `QrCode` export added
- Gas panel security: `allowOwnerUpdate && isOwner` dual gate
- `GasUnitToggleBar`: extracted as standalone component
- Dead code removed from gas screen
- LOGAN module architecture docs created and cross-linked

---

## ARCHITECTURE STATUS

**SENTRY result:** ALIGNED (from session audit `2026-05-26_sentry_vport-gas-reviews-qr-fixes.md`)  
- S1 MINOR DRIFT resolved: `QrCode` added to adapter, cross-feature consumers updated  
- S2 (pre-existing Final/View screen merge): deferred, non-blocking for this scope

**Contract violations:** None  
**Dependency risks:** None — adapter boundary enforced; `react-qr-code` centralized to single consumer  
**Layer violations:** None — `GasUnitToggleBar` extraction is correct (component layer, not screen); `allowOwnerUpdate && isOwner` gate is at correct controller/hook-propagated level  
**Cross-feature boundary issues:** None — `PosterFlyer`/`ClassicFlyer` use internal path; `PrintableQrFlyerCard` uses adapter  

**ARCHITECTURE STATUS: ✅ CLEAR**

---

## PERFORMANCE STATUS

**Kraven/Loki signals:** Not run in this session (not applicable to this scope — no DAL changes, no new query paths, no N+1 risk introduced)  

**Hot paths:** `useActorCanonicalSlug` has a 10-minute TTL cache at controller level — slug resolution is not a hot path  
**Duplicate reads:** None introduced  
**N+1 risks:** None introduced  
**High-latency areas:** Note from ELEKTRA — the controller caches `canonicalSlug = actorId` (UUID fallback) for 10 minutes when no slug data exists. After profile write, `invalidateActorCanonicalSlugCache(actorId)` must fire to prevent stale UUID-fallback being served. Verify this is wired. Not a performance risk but a cache-correctness concern.

**PERFORMANCE STATUS: ✅ CLEAR** (no regressions introduced; cache invalidation wiring requires verification)

---

## SECURITY STATUS

**VENOM:** 2 HIGH | 2 MEDIUM | 2 LOW  
**BLACKWIDOW:** 1 CONFIRMED BYPASS (BW-001) — HIGH  
**ELEKTRA:** 1 HIGH (ELEK-001) | 1 LOW | 1 INFO | 2 False Positives Rejected

### Unresolved Release Blockers:

**🚨 BLOCKER 1 — ELEK-001 / V-001 / BW-001 (HIGH, CONFIRMED)**

Double-path UUID leak in public QR views:
- Error path: `useActorCanonicalSlug` catch block sets `canonicalSlug = actorId` → gate `loading || !canonicalSlug` passes → UUID in QR
- No-slug-data path: `buildActorCanonicalSlugController` returns `canonicalSlug = actorId` on success when actor has no slug data → same gate bypass → UUID in QR

Both `VportPublicReviewsQrView.jsx` and `VportPublicMenuQrView.jsx` are affected.

Status: **UNRESOLVED — BLOCKS RELEASE**  
Fix: Add UUID guard (`UUID_RE.test(canonicalSlug)`) — see ELEKTRA suggested patch ELEK-001

---

### Non-Blocking Items (addressable before or immediately after release):

**⚠️ ACTION REQUIRED BEFORE RELEASE — ELEK-002 / V-002 (LOW)**  
`VportsBusinessCardSection.jsx` lines 7 and 46: hardcoded `https://vibezcitizens.com/vport/${v.slug}/card`  
- Replace with `buildBusinessCardQrUrl(v.slug)` — one-line fix, two locations  
- Does not block release (slug is human-readable, no auth impact) but creates inconsistency vs the fixed QR modal  
- Status: OPTIONAL PRE-RELEASE / REQUIRED PRE-SHIP

**ℹ️ OPTIONAL — ELEK-003 / V-003 (INFO)**  
Full `identity` object passed to `GasPricesPanel` — should be reduced to `canSubmit={!!identity?.actorId}`  
- No exploit path; deferred to next cleanup sprint

**ℹ️ DEFERRED — V-004, V-005 (LOW)**  
- `QrCode` URL scheme validation (V-004): no current exploit path; hardening
- `BookingQrLinksPanel` encoding (V-005): panel is disabled; must be fixed before `enabled: true`

---

**SECURITY STATUS: 🚫 BLOCKED — ELEK-001 / V-001 / BW-001 unresolved**

---

## MIGRATION STATUS

**Carnage signals:** Not applicable. No schema changes in this session. No RLS modifications. No new DB objects.  
**Schema changes:** None  
**Migration safety:** N/A  

**MIGRATION STATUS: ✅ CLEAR**

---

## DOCUMENTATION STATUS

**LOGAN docs updated in session:**
- `vcsm.vport-gas-station-cards-individual.architecture.md` — CREATED ✓
- `vcsm.vport-reviews-qr.architecture.md` — CREATED ✓
- `vcsm.vport-gas-prices.architecture.md` — cross-link added ✓
- `vcsm.vport-reviews-dashboard.architecture.md` — updated ✓
- `vcsm.vport.gas-station-profile-spec.md` — Section 13 added ✓

**Session summary:** Persisted ✓  
**Security audit trail:** VENOM ✓ | BLACKWIDOW ✓ | ELEKTRA ✓ | SENTRY ✓ (all files persisted to audit directories)

**DOCUMENTATION STATUS: ✅ CLEAR**

---

## OWNERSHIP STATUS

**Ironman signals:** Not run. Scope is clear — vport feature, single owner domain.  
**Feature ownership:** VPORT QR system owned by `dashboard/qrcode` feature; public QR views owned by `public/vportMenu`; gas dashboard owned by `dashboard/vport`  
**No ambiguity identified.**

**OWNERSHIP STATUS: ✅ CLEAR**

---

## RELEASE READINESS MATRIX

| Area | Status | Blocker | Notes |
|---|---|---|---|
| Architecture (SENTRY) | ✅ ALIGNED | None | S1 resolved; S2 pre-existing deferred |
| Performance | ✅ CLEAR | None | No new query paths; cache invalidation wiring to verify |
| Security — QR UUID leak (ELEK-001) | 🚫 BLOCKED | **YES** | Double-path bypass confirmed; UUID guard patch required |
| Security — hardcoded domain (ELEK-002) | ⚠️ ACTION | No | One-line fix; recommended before ship |
| Security — identity surface (ELEK-003) | ✅ ADVISORY | No | Deferred cleanup |
| Security — QrCode scheme guard (V-004) | ✅ ADVISORY | No | Hardening, no exploit path |
| Security — BookingQrLinks (V-005) | ✅ DORMANT | No | Panel is disabled; pre-activation fix required |
| Database migrations | ✅ CLEAR | None | No schema changes |
| Documentation | ✅ CLEAR | None | All docs updated |
| Ownership | ✅ CLEAR | None | Unambiguous |

---

## OPEN ITEMS (not blocking this release)

| Item | Owner | Priority |
|---|---|---|
| P3-C: `BookingQrLinksPanel` booking adapter | Next sprint | P2 |
| S2: `VportDashboardGasScreen` Final/View split | Dashboard sprint | P3 |
| CARNAGE: `service_id` FK in `@reviews` schema | CARNAGE sprint | P1 |
| Falcon: iOS clipboard API audit on QR copy flows | Falcon sprint | P2 |
| Kraven: cache `fuel_price_submissions` + `station_price_settings` | Kraven sprint | P2 |

---

## REQUIRED ACTIONS BEFORE RELEASE

### 🚨 P0 — MUST FIX (Release Blocker)

**ELEK-001: Add UUID guard to both public QR views**

Files:
- `apps/VCSM/src/features/public/vportMenu/view/VportPublicReviewsQrView.jsx`
- `apps/VCSM/src/features/public/vportMenu/view/VportPublicMenuQrView.jsx`

Patch (apply identically to both):
```jsx
// After: const { canonicalSlug, loading } = useActorCanonicalSlug(actorId);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isQrSafeSlug = !!canonicalSlug && !UUID_RE.test(canonicalSlug);

// Replace: const reviewsUrl = canonicalSlug ? buildReviewsQrUrl(canonicalSlug) : "";
const reviewsUrl = isQrSafeSlug ? buildReviewsQrUrl(canonicalSlug) : "";
// (or menuUrl for the menu view)

// Replace gate: loading || !canonicalSlug
// With:         loading || !isQrSafeSlug

// Replace action display gate: !loading && canonicalSlug
// With:                        !loading && isQrSafeSlug
```

### ⚡ P1 — STRONGLY RECOMMENDED BEFORE SHIP

**ELEK-002: Replace hardcoded domain in `VportsBusinessCardSection.jsx`**

```js
// Add import:
import { buildBusinessCardQrUrl } from "@/lib/qrUrlBuilders";

// Line 7: const url = buildBusinessCardQrUrl(v.slug)
// Line 46: const cardUrl = buildBusinessCardQrUrl(v.slug)
```

---

## THOR VERDICT

```
╔══════════════════════════════════════════════════════════════════╗
║  THOR RELEASE STATUS: ❌ RELEASE BLOCKED                        ║
║                                                                  ║
║  BLOCKER: ELEK-001 / V-001 / BW-001                             ║
║  Double-path UUID leak in public QR views                        ║
║  CONFIRMED by BLACKWIDOW — error path AND no-slug-data path     ║
║  both bypass the QR render gate and encode raw actorId UUID.     ║
║                                                                  ║
║  The session's P0 UUID-leak fix is incomplete.                  ║
║  Two additional bypass paths were not covered.                   ║
║                                                                  ║
║  Required to unblock:                                            ║
║  - Add UUID_RE guard to VportPublicReviewsQrView.jsx            ║
║  - Add UUID_RE guard to VportPublicMenuQrView.jsx               ║
║  - SENTRY post-execution review of both files                    ║
║  - THOR re-evaluation after fix                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

**All other session work is release-ready.** The QR UUID fix itself (loading-window gate), flyer migration, adapter centralization, gas panel dual gate, GasUnitToggleBar extraction, and LOGAN documentation are all complete and SENTRY-verified. Only ELEK-001 must be resolved before this branch ships.

---

## THOR RE-EVALUATION TRIGGER

After ELEK-001 patch is implemented and SENTRY post-execution review passes:

- Run THOR again with `[RE-EVAL: vport-qr-uuid-guard-fix]` as trigger
- ELEK-002 fix (hardcoded domain) should also be included before re-eval
- If both fixes are in and SENTRY status is ALIGNED → RELEASE APPROVED
