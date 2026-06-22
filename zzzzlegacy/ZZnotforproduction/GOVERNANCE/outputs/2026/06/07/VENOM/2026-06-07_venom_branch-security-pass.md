# VENOM V2 — Branch Security Pass
**Branch:** vport-booking-feed-security-updates
**Date:** 2026-06-07
**Run:** Second VENOM pass (this session). First pass incomplete — session compacted.
**Scope:** VCSM:booking | VCSM:vport | VCSM:notifications | VCSM:feed | Traffic:answers
**ARCHITECT Gate:** PASS — evidence bundles current (2026-06-07T08:45:00), scanner maps fresh (2026-06-07T08:11:08)
**Recommendation:** BLOCKED — THOR gate not cleared. See per-feature THOR blockers below.

---

## Source Verification Table

| File | Layer | Lines Read | Verification Status |
|---|---|---|---|
| apps/VCSM/src/features/booking/controllers/createBooking.controller.js | controller | 1-186 | SOURCE_VERIFIED |
| apps/VCSM/src/features/booking/controllers/assertActorOwnsVportActor.controller.js | controller | 1-81 | SOURCE_VERIFIED |
| apps/VCSM/src/features/vport/dal/vport.core.dal.js | dal | 1-293 | SOURCE_VERIFIED |
| apps/VCSM/src/features/vport/dal/vport.write.profileMedia.dal.js | dal | 1-24 | SOURCE_VERIFIED |
| apps/VCSM/src/features/notifications/publish.js | service | 1-154 | SOURCE_VERIFIED |
| apps/VCSM/src/features/notifications/inbox/lib/verifyRecipientOwnership.js | lib | 1-29 | SOURCE_VERIFIED |
| apps/VCSM/src/features/feed/controllers/feedWelcomeCard.controller.js | controller | 1-14 | SOURCE_VERIFIED |
| apps/VCSM/src/features/feed/dal/feedWelcomeCard.dal.js | dal | 1-43 | SOURCE_VERIFIED |
| apps/VCSM/src/features/feed/hooks/useFeedWelcomeCard.js | hook | 1-58 | SOURCE_VERIFIED |
| apps/Traffic/src/app/api/answers/questions/route.js | route | 1-22 | SOURCE_VERIFIED |
| apps/Traffic/src/app/api/answers/moderation/answers/route.js | route | 1-32 | SOURCE_VERIFIED |
| apps/Traffic/src/app/api/answers/moderation/questions/route.js | route | 1-31 | SOURCE_VERIFIED |
| apps/Traffic/src/features/answers/dal/questions.write.dal.js | dal | 1-45 | SOURCE_VERIFIED |
| apps/Traffic/src/features/answers/dal/moderationAnswers.dal.js | dal | 1-80 | SOURCE_VERIFIED |
| apps/Traffic/src/features/answers/dal/moderationQuestions.dal.js | dal | 1-53 | SOURCE_VERIFIED |
| apps/Traffic/src/features/answers/controllers/submitQuestion.controller.js | controller | 1-46 | SOURCE_VERIFIED |
| apps/Traffic/src/features/answers/controllers/moderateAnswers.controller.js | controller | 1-109 | SOURCE_VERIFIED |
| apps/Traffic/src/features/answers/models/questionSubmission.model.js | model | 1-51 | SOURCE_VERIFIED |
| apps/Traffic/src/features/answers/models/moderationAuth.model.js | model | 1-24 | SOURCE_VERIFIED |
| apps/Traffic/src/features/answers/adapters/answers.adapter.js | adapter | 1-21 | SOURCE_VERIFIED |

---

## Branch Patch Summary

### CONFIRMED CLOSED

| Finding ID | Original Severity | Patch Description | Evidence |
|---|---|---|---|
| VEN-BOOKING-009 | MEDIUM | `linkPath: null` in createBookingController — raw UUID no longer stored in notification | SOURCE_VERIFIED: createBooking.controller.js, `publishVcsmNotification({…, linkPath: null})` |
| ELEK-2026-06-04-011 | MEDIUM | Closes the create path (cancel/confirm were already patched) | Same |
| BW-BOOK-015 | MEDIUM | Cross-confirms VEN-BOOKING-009 — raw owner_actor_id no longer in linkPath | Same |

### CONFIRMED PARTIAL FIX

| Finding ID | Original Severity | What Was Fixed | What Remains Open |
|---|---|---|---|
| VEN-BOOKING-007 | HIGH | Public source: `customerActorId := requestActorId` (session-bound) | Management source still accepts caller-supplied `customerActorId` — ELEK-2026-06-04-008 still OPEN |
| ELEK-2026-06-04-008 | HIGH | Public path: attributing booking to an arbitrary citizen now blocked | Management path (`owner`, `admin`, `import`, `sync`): actorId still accepted from caller |

### NEW PATCH — NOTIFICATIONS SESSION GUARD

| File | Change | Addresses |
|---|---|---|
| apps/VCSM/src/features/notifications/publish.js | `getSession()` check added before publish; returns false if no session | TICKET-ARCH-NOTI-SESSION-001 DONE — prevents unauthenticated notification publish |

**Note:** The session guard confirms authentication exists (session is non-null) but does NOT bind the `actorId` parameter to `session.user`. VEN-NOTIFICATIONS-004 (sourceActorId caller-supplied) remains OPEN — an authenticated actor can still impersonate a different source actor.

---

## Source-Verified Confirmations of Prior Open Findings

| Finding ID | Feature | Confirmation |
|---|---|---|
| VEN-VPORT-004 | vport | updateVportAvatarMediaAssetIdDAL and updateVportBannerMediaAssetIdDAL — no session check, no requireUser(), actorId caller-supplied, RLS sole barrier. CONFIRMED [SOURCE_VERIFIED] |
| VEN-VPORT-002 | vport | updateVport: requireUser() present but filters by .eq('id', vportId) with no owner_user_id check. CONFIRMED [SOURCE_VERIFIED] |
| VEN-VPORT-003 | vport | softDeleteVport/restoreVport: no requireUser() call, fully delegates to RPC. CONFIRMED [SOURCE_VERIFIED] |
| BW-FEED-001 / ELEK-2026-06-06-001 | feed | ctrlMarkWelcomeCardSeen accepts actorId from caller; DAL uses public supabase client with no session check; upserts on actor_id,step_key. CONFIRMED [SOURCE_VERIFIED] |

---

## New Findings — Traffic:answers (First VENOM Source Read Pass)

VEN-TRAFFIC-001 through VEN-TRAFFIC-003 were written to SECURITY.md earlier this session.
The following are NEW findings from this source verification pass.

---

### VEN-TRAFFIC-004

**Finding ID:** VEN-TRAFFIC-004
**Location:** apps/Traffic/src/features/answers/controllers/moderateAnswers.controller.js lines 35-109; apps/Traffic/src/features/answers/dal/moderationAnswers.dal.js lines 66-79; apps/Traffic/src/features/answers/dal/moderationQuestions.dal.js lines 40-53
**Application Scope:** Traffic:answers — moderation pipeline
**Platform Surface:** Internal moderation API (bearer-token gated)
**Trust Boundary:** Operator (bearer token holder) → answers.questions / answers.answers (admin client, bypasses RLS)
**Boundary Violated:** No terminal-state enforcement on moderation actions
**Contract Violated:** behavior.moderation.idempotency — state machine integrity

**Current Behavior:**
`moderateQuestion({ id, action })` and `moderateAnswer({ id, action })` accept any valid action (`approve`/`reject` for questions; `publish`/`reject` for answers) and write unconditionally via `updateQuestionModerationRow({ id, values })` / `updateAnswerModerationRow({ id, values })`. No prior-state check exists. A published answer can be re-rejected; a rejected answer can be re-published. `moderated_at` and `published_at` timestamps are overwritten on each call.

**Risk:** A moderation operator (anyone holding the bearer token) can flip any answer or question between published and rejected states indefinitely. No audit trail of original moderation decision is preserved (timestamps overwritten). Content that was approved by one moderator can be silently rejected by another without detection.

**Severity:** MEDIUM
**Exploitability:** MEDIUM — requires valid bearer token
**Attack Preconditions:** Possession of `TRAZE_ANSWERS_MODERATION_TOKEN` (static secret from env)
**Blast Radius:** All moderated content in `answers.questions` and `answers.answers` tables
**Identity Leak Type:** None
**Cache Trust Type:** N/A
**RLS Dependency:** Admin client bypasses RLS — state machine enforcement must be at app layer
**Why It Matters:** Content integrity and audit trail. A published expert answer visible to public users can be silently pulled and re-injected without any record that it was previously published. With a static shared token, there is no per-operator attribution.
**Recommended Mitigation:** Add a prior-state check before applying moderation action. Options: (1) Fetch current `moderation_status` before update and throw if already in terminal state; (2) DB-level check in `updateAnswerModerationRow` / `updateQuestionModerationRow` using a `.eq('moderation_status', 'pending')` guard before UPDATE. Simpler: treat `approved`/`published` as terminal — once published, require an explicit `unpublish` action rather than `reject`.
**Rationale:** The moderation controller has a safe action allowlist (only known keys in `valuesByAction` dict), which prevents SQL injection via `action`. The gap is the missing state transition guard.
**Follow-up Command:** BLACKWIDOW — adversarial replay test on moderation endpoint
**CISSP Domain Primary:** Software Development Security
**CISSP Domain Secondary:** Security Operations

---

### VEN-TRAFFIC-005

**Finding ID:** VEN-TRAFFIC-005
**Location:** apps/Traffic/src/features/answers/models/questionSubmission.model.js lines 7-12
**Application Scope:** Traffic:answers — public question submission
**Platform Surface:** Public POST `/api/answers/questions`
**Trust Boundary:** Anonymous public visitor → answers.questions
**Boundary Violated:** Input sanitization completeness
**Contract Violated:** Defense-in-depth — output escaping cannot be the only XSS barrier

**Current Behavior:**
`cleanText(value, maxLength)` strips only literal `<` and `>` characters via `.replace(/[<>]/g, "")`. Fields affected: title, body, serviceKey, city, region, country. HTML-encoded payloads (`&lt;script&gt;alert(1)&lt;/script&gt;`), `javascript:` URI schemes, CSS injection (`expression()`), and other non-`<>`-delimited injection payloads pass through and are stored in `answers.questions`. Risk is conditional on: (1) how stored values are rendered, and (2) whether React JSX auto-escaping is applied consistently.

**Risk:** If any downstream render uses `dangerouslySetInnerHTML`, metatags without proper escaping, or server-side template rendering without entity encoding, stored values could execute as XSS. SEO pages generated by Traffic embed question data in page content and JSON-LD — JSON-LD context is typically escaped by JSON serialization, but direct HTML embedding is not.

**Severity:** LOW
**Exploitability:** LOW — requires a downstream render without proper escaping; React JSX is the first line of defense
**Attack Preconditions:** Question in `approved` state (moderated); downstream render using unescaped field
**Blast Radius:** Traffic SEO pages embedding question content; any admin/moderation view rendering question body
**Identity Leak Type:** None (no user identity involved)
**Cache Trust Type:** N/A
**RLS Dependency:** None — sanitization is app-layer only
**Why It Matters:** Defense-in-depth. Questions must pass moderation before publishing, so the attack window is narrow. However, moderation views rendering `body` field of pending questions are also exposed. `<>` stripping alone is not a sanitization strategy.
**Recommended Mitigation:** Replace `cleanText` with a proper sanitization library (e.g., `DOMPurify` server-side, or `xss` npm package). At minimum, replace HTML entities: `&` → `&amp;`, `"` → `&quot;`, `'` → `&#x27;`. Also consider length validation for `serviceKey`/`city`/`region`/`country` fields (currently pass through with optional cleaning only).
**Rationale:** Not upgrading to HIGH because (a) React JSX auto-escapes in most renders, (b) questions are moderated before publish, and (c) JSON-LD is JSON-serialized. Downgraded from MEDIUM to LOW after considering defense-in-depth already present.
**Follow-up Command:** HAWKEYE — verify all question field render sites for dangerouslySetInnerHTML or raw template usage
**CISSP Domain Primary:** Software Development Security
**CISSP Domain Secondary:** Security Architecture and Engineering

---

## Carry-Forward THOR Blockers (Unresolved from Prior Runs)

All prior findings from VENOM 2026-06-04 remain OPEN unless explicitly listed as CLOSED above.

### booking
| ID | Severity | Status |
|---|---|---|
| VEN-BOOKING-001 | CRITICAL | OPEN — updateBookingStatusDAL no owner filter |
| VEN-BOOKING-002 | CRITICAL | OPEN — saveBookingServiceProfileDurationsDAL undefined supabase (dead DAL) |
| VEN-BOOKING-003 | CRITICAL | OPEN — upsertBookingResourceServicesDAL undefined supabase (dead DAL) |
| VEN-BOOKING-004 | HIGH | OPEN — status allowlist not enforced on INSERT for management sources |
| VEN-BOOKING-007 | HIGH | PARTIAL — public source session-bound; management source still caller-supplied |
| ELEK-2026-06-04-001 | HIGH | OPEN — availability rule cross-actor hijack (onConflict:id) |
| ELEK-2026-06-04-002 | HIGH | OPEN — availability exception cross-actor hijack |
| ELEK-2026-06-04-003 | HIGH | OPEN — confirmBookingController no terminal-state gate |
| BW-BOOK-007 | MEDIUM | OPEN — listOwnerBookingResources no auth assertion |
| BW-BOOK-009 | HIGH | OPEN — upsertAvailabilityRule cross-actor hijack |
| BW-BOOK-010 | HIGH | OPEN — upsertAvailabilityException cross-actor hijack |
| BW-BOOK-012 | HIGH | OPEN — confirmBooking no terminal-state gate |

### vport
| ID | Severity | Status |
|---|---|---|
| VEN-VPORT-002 | HIGH | OPEN CONFIRMED — updateVport RLS-only (no app-layer owner filter) |
| VEN-VPORT-003 | HIGH | OPEN CONFIRMED — softDelete/restore no app-layer session check |
| VEN-VPORT-004 | MEDIUM | OPEN CONFIRMED — profileMedia DAL no session check |
| VEN-VPORT-006 | MEDIUM | OPEN — owner_user_id in getVportById/getVportBySlug SELECT |
| BW-VPORT-001 | HIGH | OPEN — updateVport RLS sole barrier (conditional THOR blocker) |
| BW-VPORT-002 | HIGH | OPEN — profileMedia DAL RLS sole barrier (conditional THOR blocker) |

### notifications
| ID | Severity | Status |
|---|---|---|
| BW-NOTI-001 | CRITICAL | OPEN — inbox state mutations accept arbitrary recipientId |
| VEN-NOTIFICATIONS-002 | HIGH | OPEN — markRead/dismiss/archive no ownership guard |
| BW-NOTI-004 | HIGH | OPEN — RLS on notification.inbox_items UNVERIFIED |
| VEN-NOTIFICATIONS-004 | MEDIUM | OPEN (PARTIAL) — sourceActorId still caller-supplied; session guard only confirms auth, not actor identity |

### feed
| ID | Severity | Status |
|---|---|---|
| BW-FEED-001 / ELEK-2026-06-06-001 | HIGH | OPEN CONFIRMED — ctrlMarkWelcomeCardSeen no session binding |
| BW-FEED-NEW-002 | HIGH | OPEN — listActorPosts visibility model absent at app layer |
| ELEK-2026-06-06-002 | HIGH | OPEN — logout() missing queryClient.clear() |
| VEN-FEED-005 | HIGH | OPEN — vport.profiles RLS UNVERIFIED |

### Traffic:answers
| ID | Severity | Status |
|---|---|---|
| VEN-TRAFFIC-001 | HIGH | OPEN — no rate limiting on public POST /api/answers/questions |
| VEN-TRAFFIC-002 | MEDIUM | OPEN — static shared bearer token for moderation API |
| VEN-TRAFFIC-003 | MEDIUM | OPEN [SCANNER_LEAD] — submit_business_card_lead RPC env gate unverified |
| VEN-TRAFFIC-004 | MEDIUM | OPEN (NEW) — no terminal-state guard on moderation actions |
| VEN-TRAFFIC-005 | LOW | OPEN (NEW) — partial XSS sanitization (only `<>` stripped) |

---

## DB Audit Notes

*These are NOT patched in this pass. DB phase is separate.*

| DB Object | Risk | Suggested Later SQL Review |
|---|---|---|
| vport.profiles UPDATE RLS | If `owner_user_id = auth.uid()` is absent from UPDATE policy, updateVport bypasses ownership entirely (VEN-VPORT-002, BW-VPORT-001) | Verify: `SELECT policyname, qual FROM pg_policies WHERE tablename='profiles' AND schemaname='vport' AND cmd='UPDATE'` |
| vport.profiles UPDATE RLS | Same gap for profileMedia DAL UPDATE (VEN-VPORT-004, BW-VPORT-002) | Same policy check as above |
| soft_delete_vport / restore_vport RPCs | Must enforce ownership via actor_owners — no app-layer fallback exists (VEN-VPORT-003) | Verify: `SELECT proname, prosrc FROM pg_proc WHERE proname IN ('soft_delete_vport','restore_vport')` |
| vc.actor_onboarding_steps UPDATE RLS | If RLS on UPDATE absent, any authenticated actor can mark any other actor's welcome card as seen (BW-FEED-001, ELEK-2026-06-06-001) | Verify: `SELECT policyname, qual FROM pg_policies WHERE tablename='actor_onboarding_steps' AND schemaname='vc' AND cmd='UPDATE'` |
| notification.inbox_items UPDATE RLS | If RLS absent, any authenticated actor can modify any other actor's inbox state (BW-NOTI-001, BW-NOTI-004) | Verify: `SELECT policyname, qual FROM pg_policies WHERE tablename='inbox_items' AND schemaname='notification' AND cmd='UPDATE'` |
| answers.questions INSERT RLS (anon key) | When TRAZE_ANSWERS_SCHEMA_READY=true, public client inserts without auth — RLS must restrict INSERT to expected patterns (VEN-TRAFFIC-001) | Verify: `SELECT policyname, qual, cmd FROM pg_policies WHERE tablename='questions' AND schemaname='answers'` |

---

## VENOM Severity Summary

| Severity | Count | New This Pass |
|---|---|---|
| CRITICAL | 4 | 0 |
| HIGH | 15+ | 0 |
| MEDIUM | 8+ | 2 (VEN-TRAFFIC-004, VEN-TRAFFIC-005 downgraded to LOW) |
| LOW | 4+ | 1 (VEN-TRAFFIC-005) |
| CLOSED | 3 | 3 (VEN-BOOKING-009, BW-BOOK-015, ELEK-2026-06-04-011) |

---

## Per-Feature Output Files

| Feature | Output |
|---|---|
| booking | ZZnotforproduction/APPS/VCSM/features/booking/outputs/2026/06/07/Venom/2026-06-07_venom_booking-delta.md |
| vport | ZZnotforproduction/APPS/VCSM/features/vport/outputs/2026/06/07/Venom/2026-06-07_venom_vport-source-verify.md |
| notifications | ZZnotforproduction/APPS/VCSM/features/notifications/outputs/2026/06/07/Venom/2026-06-07_venom_notifications-session-patch.md |
| feed | ZZnotforproduction/APPS/VCSM/features/feed/outputs/2026/06/07/Venom/2026-06-07_venom_feed-source-confirm.md |
| Traffic:answers | ZZnotforproduction/APPS/Traffic/features/answers/outputs/2026/06/07/Venom/2026-06-07_venom_traffic-answers-full.md |

---

## Provenance

| Input | Source | Freshness |
|---|---|---|
| Scanner maps | apps/scanner/maps/ | FRESH (2026-06-07T08:11:08) |
| ARCHITECT evidence bundles | ZZnotforproduction/APPS/VCSM/features/*/outputs/2026/06/07/ARCHITECT/ | FRESH (same-day) |
| BEHAVIOR.md files | booking, vport, notifications, feed — all read | ACTIVE |
| SECURITY.md files | booking, vport, notifications, feed, Traffic:answers — all read | READ |
| Source files | 20 files verified at line level | SOURCE_VERIFIED |
