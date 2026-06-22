---
name: vcsm.moderation.behavior
description: Feature-level behavior contract for the VCSM moderation feature — built from governance artifacts
metadata:
  type: behavior
  status: ACTIVE
  authored-by: LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
  date: 2026-06-05
  priority: P0
  evidence-standard: GOVERNANCE_ARTIFACTS_ONLY
---

# Feature Behavior Contract — moderation
**Application:** VCSM
**Status:** ACTIVE — built from governance artifacts (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
**Evidence standard:** Governance artifacts only. No source code read. UNKNOWN = unproven.

---

## §1 Purpose

The moderation feature provides trust and safety enforcement for the VCSM platform. It serves two distinct functional domains:

1. **Citizen reporting** — Any Citizen can report platform content (posts, messages, conversations, actors, comments, profiles, Vports) via a contextual report flow. Reports are submitted into `moderation.reports` with an optional deduplication key.

2. **Moderator enforcement** — Authorized moderators can review submitted reports and act on them by hiding content, recording moderation actions, and maintaining a full audit trail via `moderation.report_events` and `moderation.actions`.

Additionally, the feature supports **actor-level personal visibility toggles** — Citizens can hide/unhide posts and comments from their own view without moderator access.

The feature is a **platform safety layer** owned by the VCSM core platform team. It is a cross-cutting concern: it writes into `moderation` schema tables and also reaches into `vc.posts` and `chat.messages`/`chat.inbox_entries` as enforcement surfaces. No external engine dependency is declared — self-contained at the DB boundary.

Sources: ARCHITECTURE.md §PURPOSE, §OWNERSHIP; CURRENT_STATUS.md

---

## §2 Entry Points

The moderation feature has **no registered routes** — it is surface-invoked, not route-driven. All entry points are adapter boundaries exposed to other features.

### Adapter Hook Entry Points (consumed by other features)

| Adapter | Purpose |
|---|---|
| `useReportFlow.adapter.js` | Drives the report submission flow |
| `usePostVisibility.adapter.js` | Drives post hide/unhide visibility state |
| `useCommentVisibility.adapter.js` | Drives comment hide/unhide visibility state |
| `useConversationCover.adapter.js` | Drives conversation cover state in chat inbox |
| `useHidePostForActor.adapter.js` | Drives actor-scoped post hide action |

### Adapter Component Entry Points (consumed by other features)

| Adapter | Purpose |
|---|---|
| `ReportModal.adapter.js` | Report submission modal |
| `ReportThanksOverlay.adapter.js` | Post-report success overlay |
| `ReportedObjectCover.adapter.js` | Cover component for reported/hidden content |
| `ChatSpamCover.adapter.js` | Cover component for spam-flagged conversations |

### Moderator Admin Path

- `moderationActions.controller.js` — callable from any admin surface; no dedicated screen in source
- Authorization gate: `assertModerationAccessController` → `isModerationAuthorizedDAL` → RPC `moderation.is_current_user_moderator`

Source: ARCHITECTURE.md §ENTRY POINTS; INDEX.md

---

## §3 User Flows

### Flow 1 — Citizen submits a report

1. Citizen triggers report flow on a piece of content (post, message, conversation, actor, comment, profile, or Vport)
2. `ReportModal` is displayed (surface-invoked via `ReportModal.adapter.js`)
3. Citizen selects a reason code (expected: from `REPORT_REASONS` list — see §4 for validation caveat)
4. `useReportFlow` hook calls `createReportController` → `insertReportRow` (writes to `moderation.reports`) + `insertReportEventRow` (writes to `moderation.report_events`)
5. On success: `ReportThanksOverlay` is displayed
6. Deduplication: caller supplies a `dedupeKey`; server-side uniqueness enforcement is NOT confirmed (see §11)

Source: modules/report/BEHAVIOR.md (STUB); ARCHITECTURE.md §MODULE RUNTIME READINESS; INDEX.md §Write Surface Map; BlackWidow output §4.2

### Flow 2 — Authorized moderator acts on a report

1. Moderator accesses admin surface (specific surface UNKNOWN — no dedicated screen in source)
2. `assertModerationAccessController` fires → calls `isModerationAuthorizedDAL` → RPC `moderation.is_current_user_moderator`
3. If authorized: moderator can update report status via `updateReportRowStatus` (writes to `moderation.reports`)
4. Moderator can hide reported content:
   - Posts: `hidePostRow` (writes to `vc.posts.is_hidden`)
   - Messages: `hideMessageRow` (writes to `chat.messages.is_hidden`)
5. Moderation action is recorded via `insertModerationActionRow` or `insertModerationActionDAL` (writes to `moderation.actions`)
6. Report event logged via `insertReportEventRow` (writes to `moderation.report_events`)

Source: ARCHITECTURE.md §MODULE DATA CONTRACT; INDEX.md §Write Surface Map; SECURITY.md VENOM findings

### Flow 3 — Citizen hides/unhides content from personal view

1. Citizen triggers hide on a post or comment (surface-invoked via `usePostVisibility.adapter.js` or `useCommentVisibility.adapter.js`)
2. Hook calls visibility controller → `insertModerationActionDAL` (writes actor-scoped record to `moderation.actions`)
3. Hidden content is replaced by `ReportedObjectCover` component in the UI
4. Citizen can unhide: reverse path via same hook

Source: ARCHITECTURE.md §MODULE RUNTIME READINESS; modules/visibility/BEHAVIOR.md (STUB); BlackWidow output §4.2

### Flow 4 — Conversation cover (spam/reported conversation)

1. Chat inbox checks conversation cover status via `getConversationCoverStatus.controller`
2. If covered: `ChatSpamCover` overlay is displayed instead of message preview
3. Citizen can dismiss cover via `undoConversationCover.controller` → `dalDeleteConversationHideAction` (DELETE from `moderation.actions`) + `updateConversationInboxFolderDAL` (writes to `chat.inbox_entries`)
4. Spam report on a conversation triggers automatic inbox folder routing: `upsertInboxEntryFolder` is called inside `insertReportRow` (DAL-level side effect — layer boundary note: belongs in controller)

Source: modules/cover/BEHAVIOR.md (STUB); ARCHITECTURE.md §MODULE BOUNDARY WARNINGS item 3; BlackWidow output §4.2

---

## §4 Business Rules

| # | Rule | Evidence |
|---|---|---|
| BR-01 | Moderator authorization is required before any moderator write operation (hide content, action report, record enforcement action) | ARCHITECTURE.md §AUTH/OWNER GATES: "assertModerationAccessController throws FORBIDDEN before all moderator writes" |
| BR-02 | Moderator authorization is determined by the RPC `moderation.is_current_user_moderator` | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH; INDEX.md §Security-Sensitive Surfaces |
| BR-03 | Report deduplication is caller-controlled via `dedupeKey`; no DB-enforced uniqueness is confirmed beyond optional dedupe_key | ARCHITECTURE.md §MODULE DATA CONTRACT: "dedupeKey prevents resubmits"; SECURITY.md BW-MOD-008 "server-side rate limit or server-enforced duplicate detection" PARTIAL |
| BR-04 | Spam report on a conversation automatically routes the conversation to the spam inbox folder (bridge logic in `insertReportRow` DAL) | ARCHITECTURE.md §MODULE BOUNDARY WARNINGS item 3; INDEX.md §Write Surface Map |
| BR-05 | Personal hide/unhide does not require moderator access — any Citizen can hide content from their own view | ARCHITECTURE.md §PURPOSE; modules/visibility/BEHAVIOR.md |
| BR-06 | Report reason code is expected to come from a `REPORT_REASONS` allowlist — VALIDATION IS NOT ENFORCED at controller or DAL (open finding BW-MOD-004) | SECURITY.md BW-MOD-004: "reasonCode is not validated against REPORT_REASONS allowlist in controller or DAL" |
| BR-07 | Report flow exposes loading and error states to the UI; visibility hooks do NOT surface error states to consumers | ARCHITECTURE.md §MODULE RUNTIME READINESS |
| BR-08 | The feature has no dedicated screens — all surfaces are overlays, covers, or modals invoked from other features | ARCHITECTURE.md §SCREENS/COMPONENTS; INDEX.md |
| BR-09 | The block feature and settings feature consume moderation schema block/unblock RPCs directly without going through the moderation adapter boundary | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH: "block feature uses moderation.block_actor / unblock_actor RPCs"; "settings feature calls moderation schema block/unblock RPCs directly" |
| BR-10 | `assertModerationAccessController` accepts `actorId` as a parameter but `isModerationAuthorizedDAL` ignores it — the authorization gate is session-based, not actor-param-based | SECURITY.md BW-MOD-007 |

---

## §5 State Rules

### Report Status Lifecycle

The following states are referenced in governance artifacts but the complete state machine is NOT formally documented:

| State | Evidence |
|---|---|
| `pending` | Implied by report submission flow (report submitted, awaiting moderator review) |
| `actioned` | Referenced in modules/report/BEHAVIOR.md TODO: "pending → actioned → dismissed" |
| `dismissed` | Referenced in SECURITY.md BW-MOD-006: "dismissed terminal state" |

**Transition rule (partial):** `dismissed` is described as a terminal state. BW-MOD-006 (BYPASSED/OPEN) documents that `hideReportedObjectController` does not guard against re-actioning a dismissed report — the dismissed terminal state can currently be overridden.

Source: modules/report/BEHAVIOR.md; SECURITY.md BW-MOD-006

**Full state machine:** UNKNOWN — REQUIRES IMPLEMENTATION REVIEW

---

## §6 Security Constraints

The following constraints are derived directly from VENOM and BlackWidow findings. Each finding implies a constraint that must hold for the feature to be secure.

| Constraint | Finding | Status |
|---|---|---|
| CONSTRAINT: `reporter_actor_id` must be bound to the authenticated session — it must never be accepted as an arbitrary caller-supplied value | VEN-MODERATION-001 (HIGH): "Reporter identity is caller-supplied with no session binding — depends on moderation.reports INSERT RLS (UNVERIFIED)" | OPEN |
| CONSTRAINT: `actor_id` in personal hide/unhide actions must be bound to the authenticated session — it must never be accepted as an arbitrary caller-supplied value | VEN-MODERATION-002 (HIGH): "Actor identity in personal hide/unhide actions is caller-supplied — depends on moderation.actions INSERT RLS (UNVERIFIED)" | OPEN |
| CONSTRAINT: `hidePostRow` and `hideMessageRow` must only be callable through paths that enforce the moderator gate — they must never be callable directly without authorization | VEN-MODERATION-003 (HIGH): "hidePostRow and hideMessageRow are exported DAL functions with no own auth guard — moderator gating is controller-only" | OPEN |
| CONSTRAINT: `updateReportRowStatus` must enforce a status allowlist and must only update reports the caller is authorized to modify | VEN-MODERATION-004 (HIGH): "updateReportRowStatus is an exported DAL function with no auth guard and no status allowlist — depends on moderation.reports UPDATE RLS (UNVERIFIED)" | OPEN |
| CONSTRAINT: `reporterActorId` must be verified server-side against the authenticated session before reaching the write path | VEN-MODERATION-005 (MEDIUM): "reporterActorId flows from React hook prop to write path with no server-side session binding verification at any layer above RLS" | OPEN |
| CONSTRAINT: Internal state must never be leaked to production browser consoles | VEN-MODERATION-006 (LOW): "Ungated console.warn in report.controller.js:113 leaks internal state to production browser consoles" | OPEN |
| CONSTRAINT: `dalDeleteConversationHideAction` DELETE must re-check actor ownership via `.eq('actor_id', actorId)` to prevent TOCTOU exploitation | VEN-MODERATION-008 (LOW): "dalDeleteConversationHideAction final DELETE query missing .eq('actor_id', actorId) ownership re-check (TOCTOU hardening)" | OPEN |
| CONSTRAINT: Report reason codes must be validated against a server-enforced allowlist — arbitrary strings must never be written to `moderation.reports` | BW-MOD-004 (MEDIUM): "reasonCode is not validated against REPORT_REASONS allowlist in controller or DAL" | BYPASSED/OPEN |
| CONSTRAINT: Personal hide/unhide actions must only be permitted for personal (non-Vport) actors | BW-MOD-005 (MEDIUM): "Personal hide/unhide paths have no actor kind check — vport actors can write hide actions to moderation.actions" | BYPASSED/OPEN |
| CONSTRAINT: A dismissed report must not be re-actioned — dismissed is a terminal state | BW-MOD-006 (MEDIUM): "hideReportedObjectController does not guard against re-actioning a dismissed report — dismissed terminal state can be overridden by any moderator" | BYPASSED/OPEN |

RLS verification status for `moderation.reports INSERT`, `moderation.reports UPDATE`, and `moderation.actions INSERT` is UNVERIFIED across all findings.

Source: SECURITY.md §VENOM STATUS; §BLACKWIDOW STATUS

---

## §7 Error Handling

### Documented (provable from governance)

| Path | Error Handling | Source |
|---|---|---|
| `useReportFlow` | Exposes loading + error states to UI consumers | ARCHITECTURE.md §MODULE RUNTIME READINESS |
| `postVisibility` / `commentVisibility` controllers | Return `{ok:false, error}` on failure but visibility hooks swallow errors silently — no user feedback on failure | ARCHITECTURE.md §MODULE RUNTIME READINESS: "Visibility errors swallowed" |
| `assertModerationAccessController` | Throws `FORBIDDEN` when moderator check fails | ARCHITECTURE.md §MODULE COMPLETENESS MATRIX |
| Moderator admin path | UNKNOWN — REQUIRES IMPLEMENTATION REVIEW | — |

### Silent Failure Risk

Visibility hook error swallowing is a documented gap: failed DB calls in post/comment visibility result in empty Sets with no user feedback. This is flagged in ARCHITECTURE.md as MEDIUM severity missing piece.

Source: ARCHITECTURE.md §MODULE RUNTIME READINESS; §MODULE MISSING PIECES

---

## §8 Cross-Feature Dependencies

| Dependency | Direction | Boundary | Notes |
|---|---|---|---|
| `moderation.is_current_user_moderator` RPC | outbound (moderation → DB) | Approved | Authorization gate for all moderator write paths — HIGH risk if incorrect |
| `vc.posts` UPDATE (`is_hidden`) | outbound cross-schema (moderation → vc) | WATCH | `hidePostRow` in moderation DAL updates `vc.posts` — cross-schema enforcement write |
| `chat.messages` UPDATE (`is_hidden`) | outbound cross-schema (moderation → chat) | WATCH | `hideMessageRow` updates `chat.messages` — cross-schema enforcement write |
| `chat.inbox_entries` UPDATE/UPSERT | outbound cross-schema (moderation → chat) | WATCH | Conversation cover and spam report routing modify chat inbox entries |
| `block` feature | inbound consumer | Approved | Block feature calls `moderation.block_actor` / `moderation.unblock_actor` RPCs directly — bypasses moderation adapter |
| `settings` feature | inbound consumer | Approved | Settings feature calls `moderation` schema block/unblock RPCs directly — bypasses moderation adapter |
| supabase client | external service | Yes | Used directly in DAL files via `@/services/supabase/supabaseClient` |

Independence status: MOSTLY INDEPENDENT — no declared engine dependencies; cross-schema writes are intentional enforcement operations.

Source: ARCHITECTURE.md §MODULE DEPENDENCY GRAPH; §MODULE BOUNDARY WARNINGS

---

## §9 Must Never Happen — Security Invariants

Each VENOM/BlackWidow finding implies a must-never-happen invariant. All invariants below are OPEN (unresolved).

| # | Invariant | Violated by |
|---|---|---|
| INV-01 | `reporter_actor_id` must NEVER be written to `moderation.reports` from a caller-supplied prop without server-side session binding | BW-MOD-001 (CRITICAL) — reporter attribution can be forged |
| INV-02 | `actor_id` in personal hide/unhide actions must NEVER be written to `moderation.actions` from a caller-supplied prop without session binding | BW-MOD-001 (CRITICAL) — actor identity on hide action can be forged |
| INV-03 | A stale or incorrect `actorId` from a component prop must NEVER silently propagate to the write path in `useReportFlow` | BW-MOD-002 (HIGH) — prop-sourced actorId has no session enforcement |
| INV-04 | `updateReportRowStatus` must NEVER update a report without an ownership filter beyond `.eq('id', reportId)` — any report must not be status-updatable by any authenticated user if RLS passes | BW-MOD-003 (HIGH) — moderator gating is controller-only with no DB-layer ownership filter |
| INV-05 | `hidePostRow` and `hideMessageRow` must NEVER be called directly without passing through the moderator authorization gate | BW-MOD-010 (HIGH) / VEN-MODERATION-003 (HIGH) — exported DAL functions with no own auth guard |
| INV-06 | A BEHAVIOR.md placeholder must NEVER serve as the behavior contract for a security-critical trust-and-safety feature | BW-MOD-009 (HIGH) / VEN-MODERATION-007 (MEDIUM) — RESOLVED by this document |
| INV-07 | `reasonCode` must NEVER be written to `moderation.reports` without validation against the `REPORT_REASONS` allowlist | BW-MOD-004 (MEDIUM) — arbitrary strings can be written |
| INV-08 | Vport actors must NEVER be permitted to write personal hide actions to `moderation.actions` via the personal hide/unhide path | BW-MOD-005 (MEDIUM) — no actor kind check on personal hide path |
| INV-09 | A dismissed report must NEVER be re-actioned — dismissed is a terminal state and must be protected from override | BW-MOD-006 (MEDIUM) — no terminal-state guard on `hideReportedObjectController` |
| INV-10 | Internal moderation state must NEVER be exposed via `console.warn` or similar in production builds | VEN-MODERATION-006 (LOW) — ungated console.warn in report.controller.js:113 |
| INV-11 | `dalDeleteConversationHideAction` must NEVER execute the final DELETE without re-checking `.eq('actor_id', actorId)` | VEN-MODERATION-008 (LOW) — TOCTOU hardening gap |

Source: SECURITY.md §VENOM STATUS; §BLACKWIDOW STATUS

---

## §10 Module Responsibilities

Three modules are declared under `modules/`. All BEHAVIOR.md files are STUB status.

### Module: `report`

**Responsibility (from governance):** Handles the Citizen report submission flow. Covers report creation (`insertReportRow`), report event logging (`insertReportEventRow`), deduplication via caller-supplied `dedupeKey`, and display of success overlay (`ReportThanksOverlay`). The `useReportFlow` hook is the primary entry point.

**Security notes:** Reporter identity binding is unverified (INV-01, INV-02). Reason code validation is absent (INV-07). Deduplication is opt-in and not server-enforced.

**Module BEHAVIOR.md status:** STUB — behaviors marked UNVERIFIED. Key TODOs: confirm `reporterActorId` source (session vs prop), document deduplication, define report status lifecycle.

Source: modules/report/BEHAVIOR.md; SECURITY.md; ARCHITECTURE.md §MODULE DATA CONTRACT

### Module: `visibility`

**Responsibility (from governance):** Handles both actor-scoped personal hide/unhide (posts, comments) and moderator-scoped global content hiding. Personal visibility is stored in `moderation.actions` (actor-scoped record). Moderator hide writes to `vc.posts.is_hidden` or `chat.messages.is_hidden`. Hidden content is replaced by `ReportedObjectCover` or `ReportCoverScreen` in the UI.

**Security notes:** Actor kind check absent on personal hide path (INV-08). DAL hide functions lack own auth guards (INV-05). Report terminal-state guard absent (INV-09).

**Module BEHAVIOR.md status:** STUB — behaviors marked UNVERIFIED. Key TODOs: define moderator gate invariant, confirm actor kind check, confirm dismissed state behavior.

Source: modules/visibility/BEHAVIOR.md; SECURITY.md; ARCHITECTURE.md §MODULE RUNTIME READINESS

### Module: `cover`

**Responsibility (from governance):** Handles conversation cover state in the chat inbox. Reads cover status via `getConversationCoverStatus.controller`. Displays `ChatSpamCover` overlay when a conversation is covered. Allows Citizen to dismiss cover via `undoConversationCover.controller` (DELETE from `moderation.actions` + UPDATE `chat.inbox_entries`).

**Security notes:** Ownership re-check on DELETE is missing (INV-11). Actor ownership enforcement on undo cover path is unconfirmed.

**Module BEHAVIOR.md status:** STUB — behaviors marked UNVERIFIED. Key TODOs: confirm cover status read table/column shape, confirm whether cover is global (moderator-set) or per-actor.

Source: modules/cover/BEHAVIOR.md; SECURITY.md VEN-MODERATION-008; ARCHITECTURE.md §MODULE BOUNDARY WARNINGS

---

## §11 Known Gaps

### Unverified or UNKNOWN behaviors

1. **Report status lifecycle is not formally defined** — Governance references `pending`, `actioned`, `dismissed` but no complete state machine is documented. Full transitions are UNKNOWN — REQUIRES IMPLEMENTATION REVIEW.

2. **Moderator admin surface is headless** — `moderationActions.controller.js` is implemented but no screen consuming it exists in source scan. The moderator review UI surface is UNKNOWN — REQUIRES IMPLEMENTATION REVIEW (flagged in ARCHITECTURE.md §MODULE MISSING PIECES).

3. **RLS for `moderation.reports INSERT`, `moderation.reports UPDATE`, and `moderation.actions INSERT` is UNVERIFIED** — All VENOM findings that depend on RLS as a backstop are marked UNVERIFIED. Actual DB RLS policies are UNKNOWN — REQUIRES DB AUDIT.

4. **`dedupeKey` server-side enforcement is unconfirmed** — Deduplication is described as opt-in; no DB-enforced uniqueness constraint is confirmed beyond the optional dedupe_key column.

5. **Conversation cover scope (global vs per-actor) is unconfirmed** — modules/cover/BEHAVIOR.md explicitly marks this as TODO.

6. **`reporterActorId` source (session-derived vs prop-supplied)** — modules/report/BEHAVIOR.md marks this as TODO. BW-MOD-001/002 indicate it is currently prop-supplied with no session enforcement.

7. **Visibility error surface in UI** — visibility hooks swallow errors silently; what the user sees on a failed hide/unhide operation is UNKNOWN.

8. **Full set of content types reportable** — ARCHITECTURE.md mentions posts, messages, conversations, actors, comments, profiles, Vports. The complete allowed set in source is UNKNOWN.

### Missing governance artifacts

- `OWNERSHIP.md` — MISSING (flagged ARCHITECTURE.md §MODULE GOVERNANCE LINKS)
- `ELEKTRA` security scan — NEVER RUN (SECURITY.md §ELEKTRA STATUS)
- Runtime audit — MISSING
- Performance audit — MISSING
- Migration audit — MISSING
- All three module BEHAVIOR.md files are STUB status (not formal contracts)

### Open tickets

- TICKET-BOOKING-RPC-001 — customer_actor_id injection (adjacent platform concern)
- TICKET-PLATFORM-RLS-001 — media_assets RLS policy (adjacent platform concern)

### THOR blockers

See §13.

---

## §12 Validation Sources

| File | Key Facts Extracted |
|---|---|
| `ZZnotforproduction/APPS/VCSM/features/moderation/CURRENT_STATUS.md` | Architecture state STABLE; independence MOSTLY INDEPENDENT; completeness MOSTLY COMPLETE; spaghetti score WATCH; top gap: BEHAVIOR.md placeholder; ARCHITECT last run 2026-06-04 |
| `ZZnotforproduction/APPS/VCSM/features/moderation/SECURITY.md` | 8 VENOM findings (0 CRITICAL, 4 HIGH, 2 MEDIUM, 2 LOW); 10 BlackWidow findings (1 CRITICAL, 4 HIGH, 3 MEDIUM, 2 LOW); THOR Release Blocker YES; ELEKTRA never run |
| `ZZnotforproduction/APPS/VCSM/features/moderation/ARCHITECTURE.md` | Full layer map (19 DAL, 17 controllers, 5 hooks, 9 adapters, 7 components, 2 models); entry points; dependency graph; data contract; runtime readiness; boundary warnings; build priority |
| `ZZnotforproduction/APPS/VCSM/features/moderation/INDEX.md` | Source inventory (35 files, 0 tests, 0 routes); write surface map (12 operations); security-sensitive surfaces list |
| `ZZnotforproduction/APPS/VCSM/features/moderation/modules/cover/BEHAVIOR.md` | STUB — cover status check, ChatSpamCover overlay, undo cover path; key unknowns: cover scope (global vs per-actor), ownership enforcement |
| `ZZnotforproduction/APPS/VCSM/features/moderation/modules/report/BEHAVIOR.md` | STUB — report submission flow, reason code, dedupeKey, ReportThanksOverlay; key unknowns: reporterActorId source, deduplication behavior, full status lifecycle |
| `ZZnotforproduction/APPS/VCSM/features/moderation/modules/visibility/BEHAVIOR.md` | STUB — personal hide/unhide, moderator hide, visibility reads, cover components; key unknowns: actor kind check, dismissed state behavior |
| `ZZnotforproduction/APPS/VCSM/features/moderation/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_moderation-security-review.md` | 12 write surfaces inventoried; 13 security paths all confidence=LOW; full finding detail for VEN-MODERATION-001 through VEN-MODERATION-008 |
| `ZZnotforproduction/APPS/VCSM/features/moderation/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_moderation-adversarial-review.md` | Attack surface inventory; hook entry points → write path map; 10 adversarial findings BW-MOD-001 through BW-MOD-010 |

---

## §13 THOR Release Status

**THOR Release Blocker:** YES

**Exact text from SECURITY.md:**
> THOR Release Blocker: YES — VEN-MODERATION-001, VEN-MODERATION-002, VEN-MODERATION-007, BW-MOD-001, BW-MOD-002, BW-MOD-003, BW-MOD-010

**Blockers:**

| Blocker ID | Source | Severity | Description |
|---|---|---|---|
| VEN-MODERATION-001 | VENOM | HIGH | Reporter identity (`reporter_actor_id`) is caller-supplied with no session binding — depends on `moderation.reports` INSERT RLS (UNVERIFIED) |
| VEN-MODERATION-002 | VENOM | HIGH | Actor identity (`actor_id`) in personal hide/unhide actions is caller-supplied — depends on `moderation.actions` INSERT RLS (UNVERIFIED) |
| VEN-MODERATION-007 | VENOM | MEDIUM | BEHAVIOR.md was PLACEHOLDER — no §5 Security Rules or §9 Must Never Happen invariants defined (RESOLVED by this document — pending THOR re-review) |
| BW-MOD-001 | BlackWidow | CRITICAL | `reporter_actor_id` and `actor_id` are fully caller-supplied with no session binding — reporter attribution and personal hide-action actor can be forged |
| BW-MOD-002 | BlackWidow | HIGH | `useReportFlow` accepts `reporterActorId` from component prop with no session enforcement — stale or wrong actorId propagates silently to write path |
| BW-MOD-003 | BlackWidow | HIGH | `updateReportRowStatus` has no ownership filter (only `.eq('id', reportId)`) — any report can be status-updated if RLS passes; moderator gating is controller-only |
| BW-MOD-010 | BlackWidow | HIGH | `hidePostRow` and `hideMessageRow` are exported DAL functions with no auth guard — direct callers can globally hide any content bypassing moderator gate |

**Current THOR status:** BLOCKED — feature cannot be released until all 7 blockers are resolved and THOR re-reviewed. VEN-MODERATION-007 is PARTIALLY resolved by this BEHAVIOR.md (BEHAVIOR.md is no longer a placeholder) but THOR gate requires re-verification.

Source: SECURITY.md §THOR Release Blocker field; §VENOM STATUS; §BLACKWIDOW STATUS
