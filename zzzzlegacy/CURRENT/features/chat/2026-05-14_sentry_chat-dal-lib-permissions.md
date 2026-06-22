# SENTRY COMPLIANCE REPORT

**Date:** 2026-05-14
**Application Scope:** VCSM
**Review Reason:** Cerebro-ordered governance pass — RISK-6 (`lib/`/`permissions/` sub-layer classification outside architecture contract) + RISK-1 fix verification (`canSendMessage` canPost sync) from AvengersAssemble 2026-05-11
**Architecture Contract:** `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md`
**Boundary Contract:** `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`

---

## BOUNDARY COMPLIANCE STATUS

| Protected Root | In Scope | Modified | Violation | Notes |
|---|---|---|---|---|
| apps/VCSM | YES | NO | NONE | Read-only audit — no source code modified |
| apps/wentrex | NO | NO | NONE | Out of scope |
| apps/Traffic | NO | NO | NONE | Out of scope |
| engines | YES (read-only) | NO | NONE | Engine version of canSendMessage read for comparison only |

---

## ARCHITECTURE ALIGNMENT STATUS

| Area | Status | Drift Level | Notes |
|---|---|---|---|
| `lib/` sub-folder taxonomy | MINOR DRIFT | MINOR DRIFT | 4 files exist in `lib/` — all are Model-class transforms (no IO, no side effects). Folder name is outside formal taxonomy. Responsibility is correctly scoped. |
| `permissions/` sub-folder taxonomy | MINOR DRIFT | MINOR DRIFT | 3 files exist in `permissions/` — all are Model-class domain predicates (pure functions, no IO). Folder name is outside formal taxonomy. Responsibility is correctly scoped. |
| `canSendMessage` — RISK-1 fix | ALIGNED | NONE | App version and engine version are now in sync. Both return `membership.canPost !== false`. Fix verified. |
| `canSendMessage` — app layer usage | FINDING | MINOR DRIFT | App-level `canSendMessage.js` is unreferenced in the app layer (no importers). Engine version enforces the check via `useConversationGuards.js`. App copy is effectively a dead reference. |
| `canReadConversation` call site | FINDING | MODERATE DRIFT | Imported and called directly in `ConversationView.jsx` (View Screen). Permission enforcement must not live in View Screen — belongs in a hook. |
| `resolvePartnerActor` call site | FINDING | MINOR DRIFT | Imported and called in `ConversationView.jsx` (View Screen) inside a `useMemo`. Model-class transform being called at View Screen level — should be encapsulated in a hook. |
| `buildInboxPreview` call sites | FINDING | MODERATE DRIFT | Imported and called in 4 Final Screens (`InboxScreen`, `ArchivedInboxScreen`, `RequestsInboxScreen`, `SpamInboxScreen`). Final Screens must not interpret domain data — belongs in a hook. |
| `(R)` file marker convention | MINOR DRIFT | MINOR DRIFT | Files in `permissions/` are marked `(R)` — likely "reference copy from engine" — but this convention is undocumented. |
| DAL selects | ALIGNED | NONE | Both app-level chat DAL files verified: explicit column selects, no `select('*')`. Confirmed by prior ARCHITECT pass. |
| Engine boundary isolation | ALIGNED | NONE | App layer imports from engine via `@chat` alias. Engine does not import from app features. Boundary intact. |
| Cross-feature adapter boundary | ALIGNED | NONE | `chat.adapter.js` is the only approved cross-feature surface. Notifications re-export goes through adapter correctly. |

---

## ACTOR OWNERSHIP STATUS

| Flow | Status | Risk | Notes |
|---|---|---|---|
| Badge count scoped to actorId | ALIGNED | NONE | `readChatInboxUnreadRowsDAL(actorId)` — actorId from bootstrap identity, not caller-trusted |
| Attachment write-back scoped to actor session | ALIGNED | NONE | `updateAttachmentMediaAssetIdDAL` fires from post-send hook using authenticated session |
| `canReadConversation` enforced on member load | ALIGNED | LOW | Correctly enforced after `members` array loads from server. Not on seed. No fake membership possible. However, called from wrong layer (View Screen) — see FINDING-02 |
| `canPost` enforcement | ALIGNED | NONE | Engine `useConversationGuards.js` → `PermissionSnapshot.model.js` → `canSendMessage` (engine copy) enforces `canPost !== false`. This is the live enforcement path. App-level copy is unused. |

---

## IDENTITY SURFACE STATUS

| Surface | Status | Risk | Notes |
|---|---|---|---|
| Badge DAL response | ALIGNED | NONE | Returns only `unread_count` — no actorId re-exposure, no internal UUIDs in response |
| `buildInboxPreview` output shape | ALIGNED | LOW | Returns `partnerActorId`, `partnerKind`, `partnerUsername` — actorId is acceptable public surface. No `profileId` or `vportId` exposed. |
| `resolvePartnerActor` output shape | ALIGNED | NONE | Returns `actorId`, `kind`, `displayName`, `username`, `photoUrl`, `_member` — no internal UUIDs exposed |
| `normalizeConversation` output shape | ALIGNED | LOW | Includes `createdByActorId` and `realmId` — both actorId-class fields. Acceptable. `_raw` passthrough included — potential risk if exposed beyond internal use. |

---

## ENGINE ISOLATION STATUS

| Engine Area | Status | Drift | Notes |
|---|---|---|---|
| `engines/chat/src/model/permissions/canSendMessage.js` | ALIGNED | NONE | Engine owns canonical copy. App-level copy is a reference that is currently unreferenced. Engine boundary intact. |
| `engines/chat/src/hooks/useConversationGuards.js` | ALIGNED | NONE | Engine enforces `canSendMessage` internally. App does not need its own enforcement because the engine gate fires before RPC. |
| App → engine import direction | ALIGNED | NONE | App imports from engine via `@chat` alias. No reverse imports found. |

---

## NATIVE PARITY STATUS

| Native Area | Status | Drift | Notes |
|---|---|---|---|
| `canSendMessage` / canPost | DRIFT | MEDIUM | Falcon confirmed native does not decode `canPost` and has no equivalent to app/engine permission check. See `falcon_chat_dal_parity_2026-05-14.md` DRIFT-01. |
| `canReadConversation` native equivalent | PARTIAL | LOW | Native has membership check logic in `LoadConversationAccess.controller.swift` but it's focused on moderation cover, not membership read gate. |

---

## SENTRY FINDINGS

---

### SENTRY FINDING — SF-01

- **Finding ID:** SF-01
- **Location:** `apps/VCSM/src/features/chat/conversation/screen/ConversationView.jsx:33, :260`
- **Drift Level:** MODERATE DRIFT
- **Severity:** MEDIUM
- **Contract Violated:** Architecture Contract §2.6 View Screen Contract — "Must NOT enforce permissions or business rules"
- **Current behavior:** `ConversationView.jsx` imports `canReadConversation` directly and calls it at line 260 to gate access to the conversation view. View Screen is enforcing a permission predicate.
- **Expected behavior:** The `canRead` result should be computed in a hook (e.g., `useConversationAccess`) and passed down as a prop or derived state. The View Screen should receive a pre-computed boolean, not call the permission function itself.
- **Risk:** View Screens computing permissions is a responsibility leak that erodes layer discipline. If the permission logic grows in complexity or acquires IO (e.g., async ownership lookup), refactoring will require touching the View Screen directly instead of the correct layer.
- **Recommended correction:** Extract a `useConversationAccess({ actorId, members })` hook that calls `canReadConversation` internally and returns `{ canRead }`. View Screen consumes the hook output only.
- **Architectural rationale:** The contract assigns permission enforcement to the Controller layer. For client-side guards derived from loaded data, the Hook layer is the acceptable location. View Screens must be pure composition surfaces.

---

### SENTRY FINDING — SF-02

- **Finding ID:** SF-02
- **Location:** `apps/VCSM/src/features/chat/inbox/screens/InboxScreen.jsx:81`, `ArchivedInboxScreen.jsx:43`, `RequestsInboxScreen.jsx:87`, `SpamInboxScreen.jsx:44`
- **Drift Level:** MODERATE DRIFT
- **Severity:** MEDIUM
- **Contract Violated:** Architecture Contract §2.7 Final Screen Contract — "Must NOT interpret domain data; Must NOT execute business logic; Must NOT fetch or mutate data"
- **Current behavior:** Four Final Screens import `buildInboxPreview` directly and call it inside `.map()` to transform inbox entries into display shapes. Final Screens are performing domain data transformation at the screen layer.
- **Expected behavior:** `buildInboxPreview` transformation should be applied inside a hook (e.g., `useInbox`, `useInboxFolder`). Final Screens should receive pre-built display entries — not raw entries that require transformation before rendering.
- **Risk:** Final Screens accumulating data transformation logic is the first step toward "fat screen" drift. The inbox display logic (`buildInboxPreview`) contains non-trivial priority rules for preview text and partner actor fallbacks. If this logic needs to change, 4 screens must be edited instead of 1 hook.
- **Recommended correction:** Move `buildInboxPreview` call inside the hook that fetches inbox data (e.g., `useInbox`, `useInboxFolder`). Return pre-built preview objects. Final Screens receive ready-to-render entries.
- **Architectural rationale:** Final Screens answer one question: "Given route and identity, which View Screen should exist?" They must not interpret, transform, or compute domain meaning.

---

### SENTRY FINDING — SF-03

- **Finding ID:** SF-03
- **Location:** `apps/VCSM/src/features/chat/conversation/screen/ConversationView.jsx:32, :110-111`
- **Drift Level:** MINOR DRIFT
- **Severity:** LOW
- **Contract Violated:** Architecture Contract §2.6 View Screen Contract — "Must NOT import models" / "Must NOT interpret raw database data"
- **Current behavior:** `ConversationView.jsx` imports `resolvePartnerActor` and calls it via `useMemo` to derive the display partner actor from `conversation` and `members`. Model-class transform is called directly at View Screen level.
- **Expected behavior:** `resolvePartnerActor` should be called inside a hook that wraps conversation access (e.g., `useConversation`, `useConversationMembers`, or a dedicated `usePartnerActor` hook). The View Screen should receive `partnerActor` as a computed value from the hook layer.
- **Risk:** Lower than SF-01/02. `useMemo` provides memoization correctness, but the responsibility leak sets precedent for more Model-class logic accumulating in the View Screen.
- **Recommended correction:** Add `partnerActor` as a return value from `useConversationMembers` or a dedicated `usePartnerActor({ actorId, conversationId })` hook. Remove direct import from View Screen.
- **Architectural rationale:** The View Screen contract permits calling domain hooks and composing components. It does not permit importing and calling model-layer functions directly.

---

### SENTRY FINDING — SF-04

- **Finding ID:** SF-04
- **Location:** `apps/VCSM/src/features/chat/conversation/permissions/canSendMessage.js` (app-level copy)
- **Drift Level:** MINOR DRIFT
- **Severity:** LOW
- **Contract Violated:** None — structural/organizational finding
- **Current behavior:** The app-level `canSendMessage.js` was fixed on 2026-05-11 (RISK-1) to match the engine version (`membership.canPost !== false`). Both copies are now in sync. However, the app-level copy has **zero importers** in the app layer. The actual enforcement path for `canPost` goes through the engine: `useConversationGuards.js` → `PermissionSnapshot.model.js` → `canSendMessage` (engine copy). The app-level file is unreferenced dead code.
- **Expected behavior:** Either the app-level copy is removed (engine is the canonical enforcement path) or it is actively imported and used somewhere in the app layer to provide an additional gate. Currently it provides no protection.
- **Risk:** Low immediate risk — engine enforcement is correct. However, the file creates false confidence that the app layer has a canPost guard when it does not. Future engineers may assume the protection exists without verifying.
- **Recommended correction:** Option A (preferred): Delete the app-level `canSendMessage.js` — the engine version is the canonical and only effective guard. The `(R)` pattern suggests it was a reference copy, not a live gate. Option B: Import and use it somewhere in the app layer (e.g., gate the ChatInput disabled state via a hook). Do not leave it unreferenced.
- **Architectural rationale:** Dead code that implies safety guarantees it does not provide is a documentation and maintenance hazard.

---

### SENTRY FINDING — SF-05

- **Finding ID:** SF-05
- **Location:** All files in `permissions/` and `lib/` sub-folders of `features/chat/`
- **Drift Level:** MINOR DRIFT
- **Severity:** LOW
- **Contract Violated:** Architecture Contract §1.2 Module Build Order — `lib/` and `permissions/` are not named layers in the contract taxonomy
- **Current behavior:** Chat feature uses two sub-folder names (`lib/`, `permissions/`) that do not appear in the formal layer taxonomy (DAL → Model → Controller → Hook → Component → View Screen → Final Screen).
- **Expected behavior (SENTRY classification):** These sub-folders are **Model-class** by responsibility:
  - `lib/` files: pure transforms, field normalization, shape derivation — Model contract behavior
  - `permissions/` files: pure domain predicates, no IO, operate on domain shapes — Model contract behavior
  - Both are acceptable as named sub-folders within the Model layer scope without requiring a contract amendment
- **Risk:** SENTRY classifies both as Model-class. No responsibility violation detected. The naming deviation is organizational — these could be renamed `model/utils/` and `model/permissions/` for contract alignment, but the mismatch does not create an architectural risk.
- **Recommended correction:** Document `lib/` and `permissions/` as approved Model-class sub-folder variants in the architecture contract or in the chat feature's `README`-equivalent. Alternatively, rename to `model/utils/` and `model/permissions/`. No behavioral change required.
- **Architectural rationale:** Architecture contracts define responsibility, not folder names. Responsibility is correctly scoped. SENTRY closes RISK-6 as MINOR DRIFT with no blocking action required.

---

### SENTRY FINDING — SF-06

- **Finding ID:** SF-06
- **Location:** All files marked `// (R)` in `permissions/` folders (app + engine)
- **Drift Level:** MINOR DRIFT
- **Severity:** LOW
- **Contract Violated:** None — documentation/convention finding
- **Current behavior:** Files in `permissions/` (both app-level and engine-level) have the comment `// (R)` with no documented definition of what this means. Assumed to mean "Reference copy — synced from engine" based on the file duplication pattern, but this is undocumented.
- **Expected behavior:** The convention should be defined in a documentation file or inline where first used.
- **Risk:** A future engineer modifying a `(R)` file may not realize it must stay in sync with another copy. This contributed directly to RISK-1 (the app copy diverged from the engine copy and was not caught until an audit). The undocumented convention is the systemic cause of RISK-1.
- **Recommended correction:** Add a comment block to all `(R)` files stating: `// (R) — Reference copy. Canonical source: engines/chat/src/model/permissions/[filename]. Keep in sync with canonical.` Alternatively, remove the app-level copies entirely and import from the engine via `@chat` alias if the engine exports them.
- **Architectural rationale:** Conventions that carry semantic responsibility must be documented at their definition point, not assumed from context.

---

## RISK-1 VERIFICATION — canSendMessage canPost Sync

**Verification result: CONFIRMED ALIGNED**

| Location | Content | Status |
|---|---|---|
| `apps/VCSM/src/features/chat/conversation/permissions/canSendMessage.js:49` | `return membership.canPost !== false` | ALIGNED |
| `engines/chat/src/model/permissions/canSendMessage.js:49` | `return membership.canPost !== false` | ALIGNED |
| Engine enforcement path | `useConversationGuards.js:39` → `canSendMessage(...)` | LIVE — this is the real enforcement |
| App-level enforcement path | No importers found | DEAD — app copy is unreferenced |

**SENTRY determination:** RISK-1 fix is correct and effective at the engine layer. The app-level copy is a dead reference and should be tracked under SF-04 for cleanup.

---

## FINAL SENTRY STATUS: MINOR DRIFT

No contract violations detected.
No engine isolation breaches.
No identity surface violations.
No actor ownership architecture violations.

Two MODERATE DRIFT findings (SF-01, SF-02) represent layer responsibility leakage that should be corrected before the chat feature accumulates more screen-layer logic. Neither is a release blocker.

---

## FOLLOW-UP REQUIRED: OPTIONAL (pre-release cleanup)

| Finding | Priority | Action | Owner |
|---|---|---|---|
| SF-01 | P2 | Extract `useConversationAccess` hook; remove `canReadConversation` import from `ConversationView` | Chat feature |
| SF-02 | P2 | Move `buildInboxPreview` call into inbox hook layer; remove from 4 Final Screens | Chat feature |
| SF-03 | P3 | Move `resolvePartnerActor` into hook layer | Chat feature |
| SF-04 | P2 | Delete app-level `canSendMessage.js` OR wire it to an actual call site | Chat feature |
| SF-05 | P3 | Document `lib/` and `permissions/` as Model-class approved sub-folders | Logan / docs |
| SF-06 | P2 | Add sync-contract comment to all `(R)` files | Chat feature |

None of the above are release blockers. All are pre-release cleanup items. THOR may proceed with these as logged follow-ups.

---

## Governance Evidence Update

This report closes RISK-6 from AvengersAssemble 2026-05-11:

| Risk | Original status | SENTRY decision | Resolved? |
|---|---|---|---|
| RISK-6 — `lib/`/`permissions/` layers outside taxonomy | OPEN | Classified as Model-class sub-folders. MINOR DRIFT. No blocking action. | YES — downgraded to tracked cleanup |
| RISK-1 — `canSendMessage` canPost divergence | FIXED (2026-05-11) | Verified aligned (both copies). App copy is dead code — SF-04. | YES — fix confirmed effective at engine layer |
