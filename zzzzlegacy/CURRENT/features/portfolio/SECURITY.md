# Security Posture — portfolio

Last Updated: 2026-06-04
Highest Open Severity: NONE
THOR Release Blocker: NO

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

**Source-only revalidation — TICKET-VENOM-CODE-ONLY-REVALIDATION-DASHBOARD-COMPLETE-0001**

**Write surfaces:** 16 (engine: portfolio_items, portfolio_media, portfolio_tags; app: locksmith_portfolio_details, portfolio_media.media_asset_id)

**Architecture:**
- Engine controllers (engines/portfolio/src/controller/) — all gated by `isActorOwner(actorId)` + `profileId` cross-check
- App-level controllers — mostly delegate to engine; probe controller now gated (VEN-PORT-003 fixed)
- Public list — `viewerIsOwner` context now threads through hook → controller → engine → DAL (VEN-PORT-002 fixed)

---

### VEN-PORT-001 [HIGH] — ~~Locksmith Portfolio Detail: Call Signature Mismatch~~ — FIXED 2026-06-04

- **Location:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/hooks/usePortfolioItemSubmit.js:123`
- **Fix applied:** `await ctrlSavePortfolioDetail(identityActorId, actorId, itemId, { ... })` — `identityActorId` now passed as first arg. Ownership assertion receives correct user actor + VPORT actor IDs.
- **THOR:** CLEAR

---

### VEN-PORT-002 [MEDIUM] — ~~Portfolio List: Private Items Returned in Public Read~~ — FIXED 2026-06-04

- **Location:** `engines/portfolio/src/dal/portfolioItems.read.dal.js`
- **Fix applied:** `publicOnly` param added to DAL — applies `.eq('visibility','public').eq('is_active',true)` when true. `viewerIsOwner` threaded through engine controller → app controller (with split cache key `actorId:owner` / `actorId:public`) → hook → call sites. Dashboard passes `{ viewerIsOwner: true }`; public profile view defaults to `false`.
- **THOR:** CLEAR

---

### VEN-PORT-003 [MEDIUM] — ~~probeVportPortfolioController: No Ownership Gate~~ — FIXED 2026-06-04

- **Location:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/controller/probeVportPortfolio.controller.js`
- **Fix applied:** `assertActorOwnsVportActorController({ requestActorId: identity.actorId, targetActorId: actorId })` added before any reads. Controller now requires `identity` and throws if missing. `email` removed from `result.session` — only `userId` returned. Hook updated to stop passing `email`.
- **THOR:** CLEAR

---

### VEN-PORT-004 [LOW] — ~~Engine DAL Write Surfaces Without Caller-Profile Scope~~ — FIXED 2026-06-04

- **Location:** `engines/portfolio/src/dal/portfolioItems.write.dal.js`
- **Fix applied:** `callerProfileId` added as required parameter to `dalUpdatePortfolioItem` and `dalSoftDeletePortfolioItem`. Both now throw if missing and apply `.eq('profile_id', callerProfileId)` to the mutation query. Callers (`updateItem.controller.js`, `deleteItem.controller.js`) already had `callerProfileId` in scope — passed directly.
- **THOR:** CLEAR

---

### VEN-PORT-005 [LOW] — ~~dalReplacePortfolioTags: Full-Delete Without Ownership Scope~~ — FIXED 2026-06-04

- **Location:** `engines/portfolio/src/dal/portfolioTags.write.dal.js`
- **Fix applied:** `callerProfileId` added as required parameter (throws if missing). Before any tag mutation, a pre-check queries `portfolio_items` with `.eq('id', itemId).eq('profile_id', callerProfileId).eq('is_deleted', false).maybeSingle()`. If no row is returned, throws `item not found or not owned by caller`. Delete and insert only proceed after this gate passes. `updateItem.controller.js` updated to pass `callerProfileId`. 11 tests added and passing.
- **THOR:** CLEAR

---

### VEN-BEHAV-001 — FALSE_POSITIVE (retracted 2026-06-04)

- BEHAVIOR.md exists at `zNOTFORPRODUCTION/CURRENT/features/dashboard/modules/portfolio/BEHAVIOR.md` — APPROVED.
- VENOM searched wrong root (`CURRENT/features/` vs `zNOTFORPRODUCTION/CURRENT/features/dashboard/modules/`). Not a real finding.

---

**Engine write gate summary (verified):**
- `createItem`: `isActorOwner` before insert ✓
- `deleteItem`: profileId cross-check + `isActorOwner` ✓
- `updateItem`: profileId cross-check + `isActorOwner` ✓
- `addMedia`: profileId cross-check + `isActorOwner` ✓
- `removeMedia`: profileId cross-check + `isActorOwner` ✓
- `updatePortfolioMediaAssetIdDAL` (VCSM): callerProfileId scope ✓

**VENOM Module Score:** 10/10 — CLEAR
**THOR Status:** CLEAR

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: NEVER
BLACKWIDOW Status: NOT RUN
